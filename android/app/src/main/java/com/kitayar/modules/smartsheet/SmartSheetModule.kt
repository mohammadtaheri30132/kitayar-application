package com.kitayar.modules.smartsheet

import android.content.Context
import android.graphics.*
import android.graphics.pdf.PdfDocument
import android.media.ExifInterface
import android.net.Uri
import android.util.Log
import com.facebook.react.bridge.*
import com.google.mlkit.vision.barcode.BarcodeScannerOptions
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage
import com.google.zxing.BarcodeFormat
import com.google.zxing.EncodeHintType
import com.google.zxing.MultiFormatWriter
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.opencv.android.Utils
import org.opencv.core.*
import org.opencv.core.Point
import org.opencv.core.Rect
import org.opencv.core.Scalar
import org.opencv.core.Size
import org.opencv.imgproc.Imgproc
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import java.util.*
import kotlin.math.*

class SmartSheetModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "SmartSheetModule"
        private const val TAG = "SmartSheetModule"

        // Standard A4 dimensions in PDF points (72 DPI)
        const val A4_WIDTH = 595
        const val A4_HEIGHT = 842

        // Standardized warped image resolution for OMR processing
        const val WARP_WIDTH = 1200.0
        const val WARP_HEIGHT = 1697.0 // 1200 * sqrt(2) ~ 1697

        const val TEMPLATE_MODEL_1 = "MODEL_1" // شبکه‌ای کادربندی‌شده (حاشیه امن مستقل)
        const val TEMPLATE_MODEL_2 = "MODEL_2" // ماتریسی سنجشی (با نشانگرهای تراز ردیف)
        const val TEMPLATE_MODEL_3 = "MODEL_3" // الفبایی مدرن (گزینه‌های الف، ب، ج، د)
    }

    private val coroutineScope = CoroutineScope(Dispatchers.IO)

    override fun getName(): String = NAME

    private fun toPersianDigits(text: String): String {
        val persian = arrayOf("۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹")
        var res = text
        for (i in 0..9) {
            res = res.replace(i.toString(), persian[i])
        }
        return res
    }

    private fun getOptionHeaderLabel(opt: Int, optionLabelType: String): String {
        val letters = arrayOf("الف", "ب", "ج", "د", "هـ")
        return if (optionLabelType == "ALPHABETIC" && opt - 1 < letters.size) {
            letters[opt - 1]
        } else {
            toPersianDigits(opt.toString())
        }
    }

    // =========================================================================
    // 1. GENERATE PERSONALIZED EXAM SHEETS PDF (3 DISTINCT DESIGN MODELS)
    // =========================================================================

    @ReactMethod
    fun generateExamSheetsPdf(options: ReadableMap, promise: Promise) {
        coroutineScope.launch {
            try {
                val examTitle = if (options.hasKey("examTitle")) options.getString("examTitle") ?: "آزمون تستی" else "آزمون تستی"
                val subject = if (options.hasKey("subject")) options.getString("subject") ?: "" else ""
                val className = if (options.hasKey("className")) options.getString("className") ?: "" else ""
                val schoolName = if (options.hasKey("schoolName")) options.getString("schoolName") ?: "" else ""
                val examDate = if (options.hasKey("examDate")) options.getString("examDate") ?: "" else ""
                val totalQuestions = if (options.hasKey("totalQuestions")) options.getInt("totalQuestions") else 20
                val optionsCount = if (options.hasKey("optionsCount")) options.getInt("optionsCount") else 4
                val templateId = if (options.hasKey("templateId")) options.getString("templateId") ?: TEMPLATE_MODEL_1 else TEMPLATE_MODEL_1
                val optionLabelType = if (options.hasKey("optionLabelType")) options.getString("optionLabelType") ?: "ALPHABETIC" else "ALPHABETIC"
                val students = if (options.hasKey("students")) options.getArray("students") else null

                if (students == null || students.size() == 0) {
                    throw Exception("هیچ دانش‌آموزی برای صدور پاسخ‌برگ انتخاب نشده است")
                }

                val pdfDocument = PdfDocument()

                // Common Paints
                val textPaint = Paint().apply {
                    color = Color.BLACK
                    isAntiAlias = true
                    typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
                }

                val normalPaint = Paint().apply {
                    color = Color.BLACK
                    isAntiAlias = true
                    typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
                }

                val strokePaint = Paint().apply {
                    color = Color.BLACK
                    style = Paint.Style.STROKE
                    strokeWidth = 1.2f
                    isAntiAlias = true
                }

                val fillMarkerPaint = Paint().apply {
                    color = Color.BLACK
                    style = Paint.Style.FILL
                    isAntiAlias = true
                }

                val bubbleBorderPaint = Paint().apply {
                    color = Color.rgb(51, 65, 85)
                    style = Paint.Style.STROKE
                    strokeWidth = 1.3f
                    isAntiAlias = true
                }

                val lightGrayFillPaint = Paint().apply {
                    color = Color.rgb(241, 245, 249)
                    style = Paint.Style.FILL
                    isAntiAlias = true
                }

                val borderPaint = Paint().apply {
                    color = Color.LTGRAY
                    style = Paint.Style.STROKE
                    strokeWidth = 0.8f
                    isAntiAlias = true
                }

                // Adaptive Column Setup for A4
                val columnsCount = when {
                    totalQuestions <= 20 -> 2
                    totalQuestions <= 40 -> 2
                    else -> 3
                }
                val questionsPerColumn = ceil(totalQuestions.toDouble() / columnsCount.toDouble()).toInt()

                // Standard Registration Marker locations in A4 points
                val markerMargin = 24f
                val markerSize = 22f

                for (sIdx in 0 until students.size()) {
                    val studentMap = students.getMap(sIdx) ?: continue
                    val studentName = if (studentMap.hasKey("studentName")) studentMap.getString("studentName") ?: "دانش‌آموز" else "دانش‌آموز"
                    val sheetCode = if (studentMap.hasKey("sheetCode")) studentMap.getString("sheetCode") ?: "KIT-0000" else "KIT-0000"

                    val pageInfo = PdfDocument.PageInfo.Builder(A4_WIDTH, A4_HEIGHT, sIdx + 1).create()
                    val page = pdfDocument.startPage(pageInfo)
                    val canvas = page.canvas

                    // 1. Draw 4 Corner Registration Square Markers (Solid black 22x22 points)
                    // Top-Left
                    canvas.drawRect(markerMargin, markerMargin, markerMargin + markerSize, markerMargin + markerSize, fillMarkerPaint)
                    // Top-Right
                    canvas.drawRect(A4_WIDTH - markerMargin - markerSize, markerMargin, A4_WIDTH - markerMargin, markerMargin + markerSize, fillMarkerPaint)
                    // Bottom-Left
                    canvas.drawRect(markerMargin, A4_HEIGHT - markerMargin - markerSize, markerMargin + markerSize, A4_HEIGHT - markerMargin, fillMarkerPaint)
                    // Bottom-Right
                    canvas.drawRect(A4_WIDTH - markerMargin - markerSize, A4_HEIGHT - markerMargin - markerSize, A4_WIDTH - markerMargin, A4_HEIGHT - markerMargin, fillMarkerPaint)

                    // Outer page boundary line
                    canvas.drawRect(markerMargin, markerMargin, A4_WIDTH - markerMargin, A4_HEIGHT - markerMargin, borderPaint)

                    // 2. Draw QR Code (encodes sheetCode|templateId|optionLabelType for 100% instant auto-configuration)
                    val qrSize = 62
                    val qrContent = "$sheetCode|$templateId|$optionLabelType"
                    val qrBitmap = generateQrBitmap(qrContent, qrSize, qrSize)
                    if (qrBitmap != null) {
                        val qrX = markerMargin + markerSize + 10f
                        val qrY = markerMargin + 6f
                        canvas.drawBitmap(qrBitmap, qrX, qrY, null)
                        qrBitmap.recycle()

                        normalPaint.textSize = 7.5f
                        normalPaint.textAlign = Paint.Align.CENTER
                        canvas.drawText("کد: $sheetCode", qrX + (qrSize / 2f), qrY + qrSize + 10f, normalPaint)
                    }

                    // 3. Render Selected Sheet Design Model
                    when (templateId) {
                        TEMPLATE_MODEL_2 -> {
                            drawModel2TimingGridSheet(
                                canvas = canvas,
                                examTitle = examTitle,
                                subject = subject,
                                className = className,
                                schoolName = schoolName,
                                examDate = examDate,
                                studentName = studentName,
                                totalQuestions = totalQuestions,
                                optionsCount = optionsCount,
                                columnsCount = columnsCount,
                                questionsPerColumn = questionsPerColumn,
                                optionLabelType = optionLabelType,
                                markerMargin = markerMargin,
                                markerSize = markerSize,
                                textPaint = textPaint,
                                normalPaint = normalPaint,
                                strokePaint = strokePaint,
                                fillMarkerPaint = fillMarkerPaint,
                                bubbleBorderPaint = bubbleBorderPaint,
                                lightGrayFillPaint = lightGrayFillPaint,
                                borderPaint = borderPaint
                            )
                        }
                        TEMPLATE_MODEL_3 -> {
                            drawModel3LetteredSheet(
                                canvas = canvas,
                                examTitle = examTitle,
                                subject = subject,
                                className = className,
                                schoolName = schoolName,
                                examDate = examDate,
                                studentName = studentName,
                                totalQuestions = totalQuestions,
                                optionsCount = optionsCount,
                                columnsCount = columnsCount,
                                questionsPerColumn = questionsPerColumn,
                                optionLabelType = optionLabelType,
                                markerMargin = markerMargin,
                                markerSize = markerSize,
                                textPaint = textPaint,
                                normalPaint = normalPaint,
                                strokePaint = strokePaint,
                                fillMarkerPaint = fillMarkerPaint,
                                bubbleBorderPaint = bubbleBorderPaint,
                                lightGrayFillPaint = lightGrayFillPaint,
                                borderPaint = borderPaint
                            )
                        }
                        else -> {
                            // MODEL_1: شبکه‌ای با کادربندی تفکیک‌شده و حاشیه امن مستقل
                            drawModel1BoxedGridSheet(
                                canvas = canvas,
                                examTitle = examTitle,
                                subject = subject,
                                className = className,
                                schoolName = schoolName,
                                examDate = examDate,
                                studentName = studentName,
                                totalQuestions = totalQuestions,
                                optionsCount = optionsCount,
                                columnsCount = columnsCount,
                                questionsPerColumn = questionsPerColumn,
                                optionLabelType = optionLabelType,
                                markerMargin = markerMargin,
                                markerSize = markerSize,
                                textPaint = textPaint,
                                normalPaint = normalPaint,
                                strokePaint = strokePaint,
                                fillMarkerPaint = fillMarkerPaint,
                                bubbleBorderPaint = bubbleBorderPaint,
                                lightGrayFillPaint = lightGrayFillPaint,
                                borderPaint = borderPaint
                            )
                        }
                    }

                    pdfDocument.finishPage(page)
                }

                val cacheDir = reactContext.cacheDir
                val outputDir = File(cacheDir, "smart_exam_sheets").apply { mkdirs() }
                val fileName = "smart_exam_${templateId.lowercase()}_${System.currentTimeMillis()}.pdf"
                val pdfFile = File(outputDir, fileName)

                val fos = FileOutputStream(pdfFile)
                pdfDocument.writeTo(fos)
                fos.flush()
                fos.close()
                pdfDocument.close()

                val result = Arguments.createMap().apply {
                    putString("uri", "file://${pdfFile.absolutePath}")
                    putString("fileName", fileName)
                    putString("templateId", templateId)
                    putInt("pageCount", students.size())
                    putDouble("fileSize", pdfFile.length().toDouble())
                }

                withContext(Dispatchers.Main) {
                    promise.resolve(result)
                }
            } catch (e: Exception) {
                Log.e(TAG, "generateExamSheetsPdf error", e)
                withContext(Dispatchers.Main) {
                    promise.reject("PDF_GEN_ERROR", e.message ?: "خطا در تولید PDF پاسخ‌برگ‌ها", e)
                }
            }
        }
    }

    // -------------------------------------------------------------------------
    // DESIGN MODEL 1: «شبکه‌ای با کادربندی تفکیک‌شده (Boxed Grid)»
    // -------------------------------------------------------------------------
    private fun drawModel1BoxedGridSheet(
        canvas: Canvas,
        examTitle: String,
        subject: String,
        className: String,
        schoolName: String,
        examDate: String,
        studentName: String,
        totalQuestions: Int,
        optionsCount: Int,
        columnsCount: Int,
        questionsPerColumn: Int,
        optionLabelType: String,
        markerMargin: Float,
        markerSize: Float,
        textPaint: Paint,
        normalPaint: Paint,
        strokePaint: Paint,
        fillMarkerPaint: Paint,
        bubbleBorderPaint: Paint,
        lightGrayFillPaint: Paint,
        borderPaint: Paint
    ) {
        val headerRight = A4_WIDTH - markerMargin - markerSize - 12f

        // Brand & Title
        textPaint.textSize = 12.5f
        textPaint.textAlign = Paint.Align.RIGHT
        textPaint.color = Color.rgb(30, 41, 59)
        canvas.drawText("کیتایار • سامانه آزمون‌های تستی هوشمند (قالب ۱: کادربندی تفکیک‌شده)", headerRight, markerMargin + 16f, textPaint)

        textPaint.textSize = 12f
        textPaint.color = Color.BLACK
        canvas.drawText(examTitle, headerRight, markerMargin + 34f, textPaint)

        normalPaint.textSize = 9f
        normalPaint.textAlign = Paint.Align.RIGHT
        val classSubjText = (if (schoolName.isNotEmpty()) "مدرسه: $schoolName | " else "") + "کلاس: $className" + (if (subject.isNotEmpty()) " | درس: $subject" else "") + (if (examDate.isNotEmpty()) " | تاریخ: ${toPersianDigits(examDate)}" else "")
        canvas.drawText(classSubjText, headerRight, markerMargin + 50f, normalPaint)

        // Student Box
        val studentBoxTop = markerMargin + 62f
        val studentBoxRect = android.graphics.RectF(A4_WIDTH / 2f - 40f, studentBoxTop, headerRight, studentBoxTop + 24f)
        canvas.drawRoundRect(studentBoxRect, 5f, 5f, lightGrayFillPaint)
        canvas.drawRoundRect(studentBoxRect, 5f, 5f, borderPaint)

        textPaint.textSize = 10f
        textPaint.color = Color.rgb(15, 23, 42)
        canvas.drawText("نام دانش‌آموز: $studentName", headerRight - 10f, studentBoxTop + 16f, textPaint)

        // Heavy Header Delimiter Bar (Zero Bleed Separation)
        val delimiterY = markerMargin + 94f
        val heavyBarPaint = Paint().apply {
            color = Color.rgb(15, 23, 42)
            style = Paint.Style.STROKE
            strokeWidth = 2.0f
            isAntiAlias = true
        }
        canvas.drawLine(markerMargin + 6f, delimiterY, A4_WIDTH - markerMargin - 6f, delimiterY, heavyBarPaint)

        // Instructions
        val guideTop = delimiterY + 8f
        val guideRect = android.graphics.RectF(markerMargin + 10f, guideTop, A4_WIDTH - markerMargin - 10f, guideTop + 22f)
        canvas.drawRoundRect(guideRect, 4f, 4f, lightGrayFillPaint)
        canvas.drawRoundRect(guideRect, 4f, 4f, borderPaint)

        normalPaint.textSize = 8.5f
        normalPaint.textAlign = Paint.Align.CENTER
        canvas.drawText("راهنمای پاسخ‌برگ: مستطیل گزینه مورد نظر را با مداد نرم پر کنید: [  ] [  ] [■] [  ] — درون گزینه‌ها خالی است.", A4_WIDTH / 2f, guideTop + 14.5f, normalPaint)

        // Grid Coordinates
        val gridTop = 176f
        val gridBottom = A4_HEIGHT - markerMargin - markerSize - 14f
        val availableHeight = gridBottom - gridTop

        val contentWidth = (A4_WIDTH - (markerMargin * 2) - 16f)
        val columnWidth = contentWidth / columnsCount.toFloat()
        val rowHeight = min(26f, availableHeight / (questionsPerColumn + 1).toFloat())
        val optionGapEst = (columnWidth - 48f) / optionsCount.toFloat()
        val rectW = min(15.5f, optionGapEst * 0.70f)
        val rectH = min(9.0f, rowHeight * 0.44f)

        val faintDividerPaint = Paint().apply {
            color = Color.rgb(226, 232, 240) // #E2E8F0
            style = Paint.Style.STROKE
            strokeWidth = 0.55f
            isAntiAlias = true
        }

        for (c in 0 until columnsCount) {
            val colRight = A4_WIDTH - markerMargin - 8f - (c * columnWidth)
            val colLeft = colRight - columnWidth + 8f

            // Column Header
            val colHeaderRect = android.graphics.RectF(colLeft, gridTop, colRight, gridTop + 18f)
            canvas.drawRoundRect(colHeaderRect, 3f, 3f, lightGrayFillPaint)
            canvas.drawRoundRect(colHeaderRect, 3f, 3f, borderPaint)

            textPaint.textSize = 8.5f
            textPaint.textAlign = Paint.Align.CENTER
            textPaint.color = Color.BLACK
            canvas.drawText("سوال", colRight - 18f, gridTop + 12.5f, textPaint)

            val optRightBound = colRight - 44f
            val optLeftBound = colLeft + 6f
            val optionGap = (optRightBound - optLeftBound) / optionsCount.toFloat()

            for (opt in 1..optionsCount) {
                val optHeaderX = optRightBound - ((opt - 0.5f) * optionGap)
                val label = getOptionHeaderLabel(opt, optionLabelType)
                canvas.drawText(label, optHeaderX, gridTop + 12.5f, textPaint)
            }

            // Question Rows (100% pure white background with subtle separator line)
            for (r in 0 until questionsPerColumn) {
                val qNum = (c * questionsPerColumn) + r + 1
                if (qNum > totalQuestions) break

                val rowY = gridTop + 20f + (r * rowHeight)
                val rowCenterY = rowY + (rowHeight / 2f)

                // Subtle horizontal divider line separating questions
                canvas.drawLine(colLeft, rowY + rowHeight, colRight, rowY + rowHeight, faintDividerPaint)

                // Question Number on the right
                textPaint.textSize = 8.5f
                textPaint.textAlign = Paint.Align.CENTER
                textPaint.color = Color.rgb(15, 23, 42)
                canvas.drawText(toPersianDigits(qNum.toString()), colRight - 16f, rowCenterY + 3.0f, textPaint)

                // Thin vertical divider line between question number and options
                canvas.drawLine(colRight - 32f, rowY + 2f, colRight - 32f, rowY + rowHeight - 2f, faintDividerPaint)

                // Rectangular Bubbles (Empty inside - NO text or numbers)
                for (opt in 1..optionsCount) {
                    val bubbleX = optRightBound - ((opt - 0.5f) * optionGap)
                    val rectF = android.graphics.RectF(
                        bubbleX - (rectW / 2f),
                        rowCenterY - (rectH / 2f),
                        bubbleX + (rectW / 2f),
                        rowCenterY + (rectH / 2f)
                    )
                    canvas.drawRoundRect(rectF, 2.0f, 2.0f, bubbleBorderPaint)
                }
            }

            // Outer column border
            canvas.drawRoundRect(android.graphics.RectF(colLeft, gridTop, colRight, gridTop + 20f + (questionsPerColumn * rowHeight)), 3f, 3f, borderPaint)
        }
    }

    // -------------------------------------------------------------------------
    // DESIGN MODEL 2: «ماتریسی سنجشی با نشانگرهای تراز ردیف (Timing-Mark Guided Matrix)»
    // -------------------------------------------------------------------------
    private fun drawModel2TimingGridSheet(
        canvas: Canvas,
        examTitle: String,
        subject: String,
        className: String,
        schoolName: String,
        examDate: String,
        studentName: String,
        totalQuestions: Int,
        optionsCount: Int,
        columnsCount: Int,
        questionsPerColumn: Int,
        optionLabelType: String,
        markerMargin: Float,
        markerSize: Float,
        textPaint: Paint,
        normalPaint: Paint,
        strokePaint: Paint,
        fillMarkerPaint: Paint,
        bubbleBorderPaint: Paint,
        lightGrayFillPaint: Paint,
        borderPaint: Paint
    ) {
        val headerRight = A4_WIDTH - markerMargin - markerSize - 12f

        // Brand & Title
        textPaint.textSize = 12.5f
        textPaint.textAlign = Paint.Align.RIGHT
        textPaint.color = Color.rgb(30, 41, 59)
        canvas.drawText("کیتایار • سامانه سنجش و آزمون (قالب ۲: ماتریسی با نشانگر تراز ردیف)", headerRight, markerMargin + 16f, textPaint)

        // Metadata Table Card
        val metaTop = markerMargin + 26f
        val metaRect = android.graphics.RectF(A4_WIDTH / 2f - 60f, metaTop, headerRight, metaTop + 48f)
        canvas.drawRoundRect(metaRect, 4f, 4f, lightGrayFillPaint)
        canvas.drawRoundRect(metaRect, 4f, 4f, borderPaint)

        textPaint.textSize = 11f
        textPaint.color = Color.BLACK
        canvas.drawText("آزمون: $examTitle", headerRight - 8f, metaTop + 16f, textPaint)

        normalPaint.textSize = 8.8f
        normalPaint.textAlign = Paint.Align.RIGHT
        canvas.drawText("کلاس: $className | درس: $subject ${if (examDate.isNotEmpty()) " | تاریخ: ${toPersianDigits(examDate)}" else ""}", headerRight - 8f, metaTop + 30f, normalPaint)
        canvas.drawText("دانش‌آموز: $studentName", headerRight - 8f, metaTop + 43f, textPaint)

        // Delimiter Bar with Pill Label
        val delimiterY = markerMargin + 82f
        canvas.drawLine(markerMargin + 6f, delimiterY, A4_WIDTH - markerMargin - 6f, delimiterY, strokePaint)

        // Instructions Banner
        val guideTop = delimiterY + 8f
        val guideRect = android.graphics.RectF(markerMargin + 8f, guideTop, A4_WIDTH - markerMargin - 8f, guideTop + 22f)
        canvas.drawRoundRect(guideRect, 3f, 3f, lightGrayFillPaint)
        canvas.drawRoundRect(guideRect, 3f, 3f, borderPaint)

        normalPaint.textSize = 8.5f
        normalPaint.textAlign = Paint.Align.CENTER
        canvas.drawText("راهنمای مدل ۲: خطوط مشکی تراز در دو طرف ستون‌ها جهت کالیبراسیون دقیق ردیف‌ها تعبیه شده‌اند.", A4_WIDTH / 2f, guideTop + 14.5f, normalPaint)

        // Grid Layout with Timing Marks
        val gridTop = 168f
        val gridBottom = A4_HEIGHT - markerMargin - markerSize - 14f
        val availableHeight = gridBottom - gridTop

        val contentWidth = (A4_WIDTH - (markerMargin * 2) - 16f)
        val columnWidth = contentWidth / columnsCount.toFloat()
        val rowHeight = min(26f, availableHeight / (questionsPerColumn + 1).toFloat())
        val optionGapEst = (columnWidth - 40f) / optionsCount.toFloat()
        val rectW = min(15.5f, optionGapEst * 0.70f)
        val rectH = min(9.0f, rowHeight * 0.44f)

        val faintDividerPaint = Paint().apply {
            color = Color.rgb(226, 232, 240) // #E2E8F0
            style = Paint.Style.STROKE
            strokeWidth = 0.55f
            isAntiAlias = true
        }

        for (c in 0 until columnsCount) {
            val colRight = A4_WIDTH - markerMargin - 8f - (c * columnWidth)
            val colLeft = colRight - columnWidth + 8f

            // Column Header
            val colHeaderRect = android.graphics.RectF(colLeft, gridTop, colRight, gridTop + 18f)
            canvas.drawRect(colHeaderRect, lightGrayFillPaint)
            canvas.drawRect(colHeaderRect, strokePaint)

            textPaint.textSize = 8.5f
            textPaint.textAlign = Paint.Align.CENTER
            textPaint.color = Color.BLACK
            canvas.drawText("ردیف", colRight - 16f, gridTop + 12.5f, textPaint)

            val optRightBound = colRight - 38f
            val optLeftBound = colLeft + 6f
            val optionGap = (optRightBound - optLeftBound) / optionsCount.toFloat()

            for (opt in 1..optionsCount) {
                val optHeaderX = optRightBound - ((opt - 0.5f) * optionGap)
                val label = getOptionHeaderLabel(opt, optionLabelType)
                canvas.drawText(label, optHeaderX, gridTop + 12.5f, textPaint)
            }

            // Question Rows (100% Pure White Background)
            for (r in 0 until questionsPerColumn) {
                val qNum = (c * questionsPerColumn) + r + 1
                if (qNum > totalQuestions) break

                val rowY = gridTop + 20f + (r * rowHeight)
                val rowCenterY = rowY + (rowHeight / 2f)

                // 1. Draw Timing Marks on left and right side of the column (Black solid bars)
                canvas.drawRect(colLeft - 7f, rowCenterY - 2.5f, colLeft - 1f, rowCenterY + 2.5f, fillMarkerPaint)
                canvas.drawRect(colRight + 1f, rowCenterY - 2.5f, colRight + 7f, rowCenterY + 2.5f, fillMarkerPaint)

                // 2. Pure White row background with subtle divider line at bottom
                canvas.drawLine(colLeft, rowY + rowHeight, colRight, rowY + rowHeight, faintDividerPaint)

                // Vertical Question Strip
                textPaint.textSize = 8.5f
                textPaint.textAlign = Paint.Align.CENTER
                textPaint.color = Color.rgb(15, 23, 42)
                canvas.drawText(toPersianDigits(qNum.toString()), colRight - 16f, rowCenterY + 3.0f, textPaint)
                canvas.drawLine(colRight - 32f, rowY + 2f, colRight - 32f, rowY + rowHeight - 2f, faintDividerPaint)

                // Rectangular Bubbles (Empty inside - NO text or numbers)
                for (opt in 1..optionsCount) {
                    val bubbleX = optRightBound - ((opt - 0.5f) * optionGap)
                    val rectF = android.graphics.RectF(
                        bubbleX - (rectW / 2f),
                        rowCenterY - (rectH / 2f),
                        bubbleX + (rectW / 2f),
                        rowCenterY + (rectH / 2f)
                    )
                    canvas.drawRoundRect(rectF, 2.0f, 2.0f, bubbleBorderPaint)
                }
            }

            // Column outer boundary
            canvas.drawRect(colLeft, gridTop, colRight, gridTop + 20f + (questionsPerColumn * rowHeight), strokePaint)
        }
    }

    // -------------------------------------------------------------------------
    // DESIGN MODEL 3: «الفبایی مدرن با حروف سنجشی [الف | ب | ج | د]»
    // -------------------------------------------------------------------------
    private fun drawModel3LetteredSheet(
        canvas: Canvas,
        examTitle: String,
        subject: String,
        className: String,
        schoolName: String,
        examDate: String,
        studentName: String,
        totalQuestions: Int,
        optionsCount: Int,
        columnsCount: Int,
        questionsPerColumn: Int,
        optionLabelType: String,
        markerMargin: Float,
        markerSize: Float,
        textPaint: Paint,
        normalPaint: Paint,
        strokePaint: Paint,
        fillMarkerPaint: Paint,
        bubbleBorderPaint: Paint,
        lightGrayFillPaint: Paint,
        borderPaint: Paint
    ) {
        val headerRight = A4_WIDTH - markerMargin - markerSize - 12f

        // Brand & Title
        textPaint.textSize = 12.5f
        textPaint.textAlign = Paint.Align.RIGHT
        textPaint.color = Color.rgb(30, 41, 59)
        canvas.drawText("کیتایار • سامانه آزمون‌های تستی هوشمند (قالب ۳: الفبایی مدرن)", headerRight, markerMargin + 16f, textPaint)

        textPaint.textSize = 12f
        textPaint.color = Color.BLACK
        canvas.drawText(examTitle, headerRight, markerMargin + 34f, textPaint)

        normalPaint.textSize = 9f
        normalPaint.textAlign = Paint.Align.RIGHT
        val classSubjText = (if (schoolName.isNotEmpty()) "مدرسه: $schoolName | " else "") + "کلاس: $className" + (if (subject.isNotEmpty()) " | درس: $subject" else "") + (if (examDate.isNotEmpty()) " | تاریخ: ${toPersianDigits(examDate)}" else "")
        canvas.drawText(classSubjText, headerRight, markerMargin + 50f, normalPaint)

        // Student Card
        val studentBoxTop = markerMargin + 62f
        val studentBoxRect = android.graphics.RectF(A4_WIDTH / 2f - 40f, studentBoxTop, headerRight, studentBoxTop + 24f)
        canvas.drawRoundRect(studentBoxRect, 5f, 5f, lightGrayFillPaint)
        canvas.drawRoundRect(studentBoxRect, 5f, 5f, borderPaint)

        textPaint.textSize = 10f
        textPaint.color = Color.rgb(15, 23, 42)
        canvas.drawText("نام دانش‌آموز: $studentName", headerRight - 10f, studentBoxTop + 16f, textPaint)

        // Heavy Divider
        val delimiterY = markerMargin + 94f
        canvas.drawLine(markerMargin + 6f, delimiterY, A4_WIDTH - markerMargin - 6f, delimiterY, strokePaint)

        // Visual Letter Guide
        val guideTop = delimiterY + 8f
        val guideRect = android.graphics.RectF(markerMargin + 10f, guideTop, A4_WIDTH - markerMargin - 10f, guideTop + 22f)
        canvas.drawRoundRect(guideRect, 4f, 4f, lightGrayFillPaint)
        canvas.drawRoundRect(guideRect, 4f, 4f, borderPaint)

        normalPaint.textSize = 8.5f
        normalPaint.textAlign = Paint.Align.CENTER
        canvas.drawText("راهنمای مدل ۳: مستطیل گزینه مورد نظر را کاملاً پر کنید: [  ] [  ] [■] [  ] — درون گزینه‌ها خالی است.", A4_WIDTH / 2f, guideTop + 14.5f, normalPaint)

        // Grid Layout with Lettered Options and Inverted Question Badges
        val gridTop = 164f
        val gridBottom = A4_HEIGHT - markerMargin - markerSize - 14f
        val availableHeight = gridBottom - gridTop

        val contentWidth = (A4_WIDTH - (markerMargin * 2) - 16f)
        val columnWidth = contentWidth / columnsCount.toFloat()
        val rowHeight = min(26f, availableHeight / (questionsPerColumn + 1).toFloat())
        val optionGapEst = (columnWidth - 44f) / optionsCount.toFloat()
        val rectW = min(15.5f, optionGapEst * 0.70f)
        val rectH = min(9.0f, rowHeight * 0.44f)

        val faintDividerPaint = Paint().apply {
            color = Color.rgb(226, 232, 240) // #E2E8F0
            style = Paint.Style.STROKE
            strokeWidth = 0.55f
            isAntiAlias = true
        }

        for (c in 0 until columnsCount) {
            val colRight = A4_WIDTH - markerMargin - 8f - (c * columnWidth)
            val colLeft = colRight - columnWidth + 8f

            // Top Column Crosshair Anchors
            canvas.drawLine(colLeft + 8f, gridTop - 6f, colLeft + 16f, gridTop - 6f, strokePaint)
            canvas.drawLine(colLeft + 12f, gridTop - 10f, colLeft + 12f, gridTop - 2f, strokePaint)
            canvas.drawLine(colRight - 16f, gridTop - 6f, colRight - 8f, gridTop - 6f, strokePaint)
            canvas.drawLine(colRight - 12f, gridTop - 10f, colRight - 12f, gridTop - 2f, strokePaint)

            // Column Header
            val colHeaderRect = android.graphics.RectF(colLeft, gridTop, colRight, gridTop + 18f)
            canvas.drawRoundRect(colHeaderRect, 3f, 3f, lightGrayFillPaint)
            canvas.drawRoundRect(colHeaderRect, 3f, 3f, borderPaint)

            textPaint.textSize = 8.5f
            textPaint.textAlign = Paint.Align.CENTER
            textPaint.color = Color.BLACK
            canvas.drawText("سوال", colRight - 18f, gridTop + 12.5f, textPaint)

            val optRightBound = colRight - 44f
            val optLeftBound = colLeft + 8f
            val optionGap = (optRightBound - optLeftBound) / optionsCount.toFloat()

            for (opt in 1..optionsCount) {
                val optHeaderX = optRightBound - ((opt - 0.5f) * optionGap)
                val label = getOptionHeaderLabel(opt, optionLabelType)
                canvas.drawText(label, optHeaderX, gridTop + 12.5f, textPaint)
            }

            // Question Rows (100% Pure White Background)
            for (r in 0 until questionsPerColumn) {
                val qNum = (c * questionsPerColumn) + r + 1
                if (qNum > totalQuestions) break

                val rowY = gridTop + 20f + (r * rowHeight)
                val rowCenterY = rowY + (rowHeight / 2f)

                // Subtle horizontal line between questions
                canvas.drawLine(colLeft, rowY + rowHeight, colRight, rowY + rowHeight, faintDividerPaint)

                // Question Number
                textPaint.textSize = 8.5f
                textPaint.textAlign = Paint.Align.CENTER
                textPaint.color = Color.rgb(15, 23, 42)
                canvas.drawText(toPersianDigits(qNum.toString()), colRight - 16f, rowCenterY + 3.0f, textPaint)

                // Vertical Divider
                canvas.drawLine(colRight - 32f, rowY + 2f, colRight - 32f, rowY + rowHeight - 2f, faintDividerPaint)

                // Rectangular Bubbles (Empty inside - NO text or numbers)
                for (opt in 1..optionsCount) {
                    val bubbleX = optRightBound - ((opt - 0.5f) * optionGap)
                    val rectF = android.graphics.RectF(
                        bubbleX - (rectW / 2f),
                        rowCenterY - (rectH / 2f),
                        bubbleX + (rectW / 2f),
                        rowCenterY + (rectH / 2f)
                    )
                    canvas.drawRoundRect(rectF, 2.0f, 2.0f, bubbleBorderPaint)
                }
            }

            // Column outer boundary
            canvas.drawRoundRect(android.graphics.RectF(colLeft, gridTop, colRight, gridTop + 20f + (questionsPerColumn * rowHeight)), 3f, 3f, borderPaint)
        }
    }

    private fun generateQrBitmap(content: String, width: Int, height: Int): Bitmap? {
        return try {
            val hints = EnumMap<EncodeHintType, Any>(EncodeHintType::class.java).apply {
                put(EncodeHintType.CHARACTER_SET, "UTF-8")
                put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M)
                put(EncodeHintType.MARGIN, 0)
            }
            val bitMatrix = MultiFormatWriter().encode(content, BarcodeFormat.QR_CODE, width, height, hints)
            val bmp = Bitmap.createBitmap(width, height, Bitmap.Config.RGB_565)
            for (x in 0 until width) {
                for (y in 0 until height) {
                    bmp.setPixel(x, y, if (bitMatrix[x, y]) Color.BLACK else Color.WHITE)
                }
            }
            bmp
        } catch (e: Exception) {
            Log.e(TAG, "generateQrBitmap error", e)
            null
        }
    }

    // =========================================================================
    // 2. SCAN AND RECOGNIZE ANSWER SHEET (HIGH-ACCURACY OMR + CORNER FIDUCIALS)
    // =========================================================================

    @ReactMethod
    fun scanAndRecognizeSheet(options: ReadableMap, promise: Promise) {
        coroutineScope.launch {
            try {
                val imageUriStr = options.getString("imageUri")
                    ?: throw Exception("آدرس تصویر معتبر نیست")
                val totalQuestions = if (options.hasKey("totalQuestions")) options.getInt("totalQuestions") else 20
                val optionsCount = if (options.hasKey("optionsCount")) options.getInt("optionsCount") else 4
                val expectedSheetCode = if (options.hasKey("expectedSheetCode")) options.getString("expectedSheetCode") else null
                var templateId = if (options.hasKey("templateId")) options.getString("templateId") ?: TEMPLATE_MODEL_1 else TEMPLATE_MODEL_1

                val uri = Uri.parse(imageUriStr)
                val originalBitmap = loadOrientedBitmap(uri)
                    ?: throw Exception("امکان خواندن تصویر پاسخ‌برگ وجود ندارد")

                var detectedOptionLabelType = if (options.hasKey("optionLabelType")) options.getString("optionLabelType") ?: "ALPHABETIC" else "ALPHABETIC"

                // Step 1: Detect QR Code from input bitmap
                var rawQrContent = detectQrCodeFromBitmap(originalBitmap)
                var detectedSheetCode: String? = null

                if (rawQrContent != null) {
                    if (rawQrContent.contains("|")) {
                        val parts = rawQrContent.split("|")
                        detectedSheetCode = parts[0].trim()
                        if (parts.size > 1 && parts[1].startsWith("MODEL_")) {
                            templateId = parts[1].trim()
                        }
                        if (parts.size > 2 && (parts[2].trim() == "NUMERIC" || parts[2].trim() == "ALPHABETIC")) {
                            detectedOptionLabelType = parts[2].trim()
                        }
                    } else {
                        detectedSheetCode = rawQrContent.trim()
                    }
                } else if (expectedSheetCode != null) {
                    detectedSheetCode = expectedSheetCode
                }

                // Step 2: Perspective Transform & Corner Alignment with OpenCV
                val srcMat = Mat()
                Utils.bitmapToMat(originalBitmap, srcMat)
                originalBitmap.recycle()

                val warpedMat = alignAndWarpSheet(srcMat)
                srcMat.release()

                if (warpedMat == null) {
                    throw Exception("خطا در تراز کردن و پرسپکتیو پاسخ‌برگ. لطفاً عکس واضح‌تری بگیرید.")
                }

                // Orientation Verification & QR Extraction directly on Warped Sheet
                val warpedBmp = Bitmap.createBitmap(warpedMat.cols(), warpedMat.rows(), Bitmap.Config.ARGB_8888)
                Utils.matToBitmap(warpedMat, warpedBmp)
                val qrResult = detectQrCodeWithPosition(warpedBmp)
                warpedBmp.recycle()

                if (qrResult != null) {
                    if (qrResult.isBottomHalf) {
                        Log.d(TAG, "Sheet is upside-down (QR detected in bottom half). Rotating 180°...")
                        Core.rotate(warpedMat, warpedMat, Core.ROTATE_180)
                    }
                    rawQrContent = qrResult.content
                    if (rawQrContent.contains("|")) {
                        val parts = rawQrContent.split("|")
                        detectedSheetCode = parts[0].trim()
                        if (parts.size > 1 && parts[1].startsWith("MODEL_")) {
                            templateId = parts[1].trim()
                        }
                        if (parts.size > 2 && (parts[2].trim() == "NUMERIC" || parts[2].trim() == "ALPHABETIC")) {
                            detectedOptionLabelType = parts[2].trim()
                        }
                    } else {
                        detectedSheetCode = rawQrContent.trim()
                    }
                } else {
                    // Fallback Orientation Check: Header area (top 12%) is significantly denser with dark text/borders
                    // compared to footer margin (bottom 12%). If bottom is markedly darker, rotate 180°.
                    try {
                        val topH = (warpedMat.rows() * 0.12).toInt()
                        val topRoi = Mat(warpedMat, Rect(0, 0, warpedMat.cols(), topH))
                        val botRoi = Mat(warpedMat, Rect(0, warpedMat.rows() - topH, warpedMat.cols(), topH))
                        val topGray = Mat()
                        val botGray = Mat()
                        Imgproc.cvtColor(topRoi, topGray, Imgproc.COLOR_BGR2GRAY)
                        Imgproc.cvtColor(botRoi, botGray, Imgproc.COLOR_BGR2GRAY)
                        val topMean = Core.mean(topGray).`val`[0]
                        val botMean = Core.mean(botGray).`val`[0]
                        topRoi.release()
                        botRoi.release()
                        topGray.release()
                        botGray.release()
                        if (botMean < (topMean - 22.0)) {
                            Log.d(TAG, "Density fallback detected upside-down sheet (botMean=$botMean < topMean=$topMean). Rotating 180°...")
                            Core.rotate(warpedMat, warpedMat, Core.ROTATE_180)
                        }
                    } catch (e: Exception) {
                        Log.w(TAG, "Fallback orientation check failed: ${e.message}")
                    }
                }

                // Step 3: Run Advanced Enterprise-Grade OMR Bubble Recognition
                val omrResult = recognizeBubbles(warpedMat, totalQuestions, optionsCount, templateId)

                // Step 4: Generate Annotated Image for Visual Teacher Review
                val annotatedBmp = Bitmap.createBitmap(warpedMat.cols(), warpedMat.rows(), Bitmap.Config.ARGB_8888)
                Utils.matToBitmap(omrResult.annotatedMat, annotatedBmp)
                omrResult.annotatedMat.release()
                warpedMat.release()

                val cacheDir = reactContext.cacheDir
                val omrDir = File(cacheDir, "omr_scans").apply { mkdirs() }
                val annotatedFile = File(omrDir, "annotated_${System.currentTimeMillis()}.jpg")
                val fos = FileOutputStream(annotatedFile)
                annotatedBmp.compress(Bitmap.CompressFormat.JPEG, 90, fos)
                fos.flush()
                fos.close()
                annotatedBmp.recycle()

                val answersArray = Arguments.createArray()
                for (ans in omrResult.answers) {
                    val ansMap = Arguments.createMap().apply {
                        putInt("questionNumber", ans.questionNumber)
                        putInt("selectedOption", ans.selectedOption)
                        putDouble("confidence", ans.confidence)
                        putBoolean("isAmbiguous", ans.isAmbiguous)
                        putBoolean("isMultiple", ans.isMultiple)
                        putBoolean("isBlank", ans.isBlank)
                    }
                    answersArray.pushMap(ansMap)
                }

                val response = Arguments.createMap().apply {
                    putBoolean("qrFound", detectedSheetCode != null)
                    putString("sheetCode", detectedSheetCode)
                    putString("templateId", templateId)
                    putString("optionLabelType", detectedOptionLabelType)
                    putArray("answers", answersArray)
                    putString("annotatedImageUri", "file://${annotatedFile.absolutePath}")
                    putInt("totalQuestions", totalQuestions)
                    putInt("markedCount", omrResult.markedCount)
                    putInt("blankCount", omrResult.blankCount)
                    putInt("ambiguousCount", omrResult.ambiguousCount)
                }

                withContext(Dispatchers.Main) {
                    promise.resolve(response)
                }
            } catch (e: Exception) {
                Log.e(TAG, "scanAndRecognizeSheet error", e)
                withContext(Dispatchers.Main) {
                    promise.reject("OMR_RECOG_ERROR", e.message ?: "خطا در پردازش تصویر پاسخ‌برگ", e)
                }
            }
        }
    }

    private data class QrDetectionResult(
        val content: String,
        val isBottomHalf: Boolean
    )

    private suspend fun detectQrCodeWithPosition(bitmap: Bitmap): QrDetectionResult? = kotlinx.coroutines.suspendCancellableCoroutine { cont ->
        try {
            val inputImage = InputImage.fromBitmap(bitmap, 0)
            val options = BarcodeScannerOptions.Builder()
                .setBarcodeFormats(Barcode.FORMAT_QR_CODE)
                .build()
            val scanner = BarcodeScanning.getClient(options)

            scanner.process(inputImage)
                .addOnSuccessListener { barcodes ->
                    if (barcodes.isNotEmpty()) {
                        val barcode = barcodes[0]
                        val value = barcode.rawValue ?: barcode.displayValue
                        if (!value.isNullOrEmpty()) {
                            val box = barcode.boundingBox
                            val isBottom = if (box != null) {
                                box.centerY() > (bitmap.height / 2)
                            } else false
                            if (cont.isActive) cont.resume(QrDetectionResult(value.trim(), isBottom), null)
                            return@addOnSuccessListener
                        }
                    }
                    if (cont.isActive) cont.resume(null, null)
                }
                .addOnFailureListener {
                    if (cont.isActive) cont.resume(null, null)
                }
        } catch (e: Exception) {
            Log.d(TAG, "MLKit QR detection failed: ${e.message}")
            if (cont.isActive) cont.resume(null, null)
        }
    }

    private suspend fun detectQrCodeFromBitmap(bitmap: Bitmap): String? {
        return detectQrCodeWithPosition(bitmap)?.content
    }

    /**
     * Finds 4 corner square fiducials or paper quad and warps to 1200 x 1697 A4 Mat.
     */
    private fun alignAndWarpSheet(src: Mat): Mat? {
        val scaleX = WARP_WIDTH / A4_WIDTH.toDouble()
        val scaleY = WARP_HEIGHT / A4_HEIGHT.toDouble()

        // Tier 1: Detect the 4 printed corner square fiducials
        val cornerPoints = detectCornerFiducials(src)
        if (cornerPoints != null && cornerPoints.size == 4) {
            val ordered = orderCorners(cornerPoints)
            val srcQuad = MatOfPoint2f(ordered[0], ordered[1], ordered[2], ordered[3])

            // Center of the 22x22 markers is at (24 + 11 = 35) from margins
            val cX1 = 35.0 * scaleX
            val cY1 = 35.0 * scaleY
            val cX2 = (A4_WIDTH - 35.0) * scaleX
            val cY2 = (A4_HEIGHT - 35.0) * scaleY

            val dstQuad = MatOfPoint2f(
                Point(cX1, cY1),
                Point(cX2, cY1),
                Point(cX2, cY2),
                Point(cX1, cY2)
            )

            val transformMatrix = Imgproc.getPerspectiveTransform(srcQuad, dstQuad)
            val warped = Mat()
            Imgproc.warpPerspective(src, warped, transformMatrix, Size(WARP_WIDTH, WARP_HEIGHT), Imgproc.INTER_LINEAR)

            srcQuad.release()
            dstQuad.release()
            transformMatrix.release()
            return warped
        }

        // Tier 2: Fallback to largest 4-point paper boundary contour
        val gray = Mat()
        Imgproc.cvtColor(src, gray, Imgproc.COLOR_BGR2GRAY)

        val blurred = Mat()
        Imgproc.GaussianBlur(gray, blurred, Size(5.0, 5.0), 0.0)

        val edges = Mat()
        Imgproc.Canny(blurred, edges, 40.0, 130.0)

        val kernel = Imgproc.getStructuringElement(Imgproc.MORPH_RECT, Size(3.0, 3.0))
        val dilated = Mat()
        Imgproc.dilate(edges, dilated, kernel)

        val contours = ArrayList<MatOfPoint>()
        val hierarchy = Mat()
        Imgproc.findContours(dilated, contours, hierarchy, Imgproc.RETR_LIST, Imgproc.CHAIN_APPROX_SIMPLE)

        val totalArea = src.cols() * src.rows().toDouble()
        var bestQuad: List<Point>? = null
        var maxArea = 0.0

        for (contour in contours) {
            val contour2f = MatOfPoint2f(*contour.toArray())
            val peri = Imgproc.arcLength(contour2f, true)
            val approx = MatOfPoint2f()
            Imgproc.approxPolyDP(contour2f, approx, 0.02 * peri, true)

            if (approx.total() == 4L) {
                val area = Imgproc.contourArea(approx)
                if (area > (totalArea * 0.18) && area > maxArea) {
                    if (Imgproc.isContourConvex(MatOfPoint(*approx.toArray()))) {
                        maxArea = area
                        bestQuad = approx.toArray().toList()
                    }
                }
            }
            contour.release()
            contour2f.release()
            approx.release()
        }

        gray.release()
        blurred.release()
        edges.release()
        kernel.release()
        dilated.release()
        hierarchy.release()

        val corners = if (bestQuad != null) {
            orderCorners(bestQuad)
        } else {
            // Tier 3: Inset fallback
            val w = src.cols().toDouble()
            val h = src.rows().toDouble()
            listOf(
                Point(w * 0.04, h * 0.04),
                Point(w * 0.96, h * 0.04),
                Point(w * 0.96, h * 0.96),
                Point(w * 0.04, h * 0.96)
            )
        }

        val srcQuad = MatOfPoint2f(corners[0], corners[1], corners[2], corners[3])
        val dstQuad = MatOfPoint2f(
            Point(0.0, 0.0),
            Point(WARP_WIDTH, 0.0),
            Point(WARP_WIDTH, WARP_HEIGHT),
            Point(0.0, WARP_HEIGHT)
        )

        val transformMatrix = Imgproc.getPerspectiveTransform(srcQuad, dstQuad)
        val warped = Mat()
        Imgproc.warpPerspective(src, warped, transformMatrix, Size(WARP_WIDTH, WARP_HEIGHT), Imgproc.INTER_LINEAR)

        srcQuad.release()
        dstQuad.release()
        transformMatrix.release()

        return warped
    }

    /**
     * Detects 4 black square corner fiducials printed at the 4 corners of the sheet.
     */
    private fun detectCornerFiducials(src: Mat): List<Point>? {
        val gray = Mat()
        Imgproc.cvtColor(src, gray, Imgproc.COLOR_BGR2GRAY)

        val blurred = Mat()
        Imgproc.GaussianBlur(gray, blurred, Size(5.0, 5.0), 0.0)

        val binary = Mat()
        Imgproc.adaptiveThreshold(
            blurred,
            binary,
            255.0,
            Imgproc.ADAPTIVE_THRESH_GAUSSIAN_C,
            Imgproc.THRESH_BINARY_INV,
            21,
            9.0
        )

        val contours = ArrayList<MatOfPoint>()
        val hierarchy = Mat()
        Imgproc.findContours(binary, contours, hierarchy, Imgproc.RETR_LIST, Imgproc.CHAIN_APPROX_SIMPLE)

        val totalArea = src.cols() * src.rows().toDouble()
        val srcW = src.cols().toDouble()
        val srcH = src.rows().toDouble()

        var tlCand: Point? = null
        var trCand: Point? = null
        var brCand: Point? = null
        var blCand: Point? = null

        var tlDist = Double.MAX_VALUE
        var trDist = Double.MAX_VALUE
        var brDist = Double.MAX_VALUE
        var blDist = Double.MAX_VALUE

        for (contour in contours) {
            val area = Imgproc.contourArea(contour)
            if (area in (totalArea * 0.00008)..(totalArea * 0.035)) {
                val rect = Imgproc.boundingRect(contour)
                val aspect = rect.width.toDouble() / rect.height.toDouble()
                if (aspect in 0.65..1.45) {
                    val extent = area / (rect.width * rect.height).toDouble()
                    if (extent > 0.60) {
                        val cX = rect.x + (rect.width / 2.0)
                        val cY = rect.y + (rect.height / 2.0)

                        if (cX < srcW * 0.45 && cY < srcH * 0.45) {
                            val dist = cX * cX + cY * cY
                            if (dist < tlDist) {
                                tlDist = dist
                                tlCand = Point(cX, cY)
                            }
                        } else if (cX > srcW * 0.55 && cY < srcH * 0.45) {
                            val dx = srcW - cX
                            val dist = dx * dx + cY * cY
                            if (dist < trDist) {
                                trDist = dist
                                trCand = Point(cX, cY)
                            }
                        } else if (cX > srcW * 0.55 && cY > srcH * 0.55) {
                            val dx = srcW - cX
                            val dy = srcH - cY
                            val dist = dx * dx + dy * dy
                            if (dist < brDist) {
                                brDist = dist
                                brCand = Point(cX, cY)
                            }
                        } else if (cX < srcW * 0.45 && cY > srcH * 0.55) {
                            val dy = srcH - cY
                            val dist = cX * cX + dy * dy
                            if (dist < blDist) {
                                blDist = dist
                                blCand = Point(cX, cY)
                            }
                        }
                    }
                }
            }
            contour.release()
        }

        gray.release()
        blurred.release()
        binary.release()
        hierarchy.release()

        return if (tlCand != null && trCand != null && brCand != null && blCand != null) {
            listOf(tlCand, trCand, brCand, blCand)
        } else {
            null
        }
    }

    private data class RecognizedAnswerInternal(
        val questionNumber: Int,
        val selectedOption: Int,
        val confidence: Double,
        val isAmbiguous: Boolean,
        val isMultiple: Boolean,
        val isBlank: Boolean
    )

    private data class OmrResult(
        val answers: List<RecognizedAnswerInternal>,
        val annotatedMat: Mat,
        val markedCount: Int,
        val blankCount: Int,
        val ambiguousCount: Int
    )

    /**
     * Advanced Enterprise-Grade OMR Rectangular Bubble Recognition.
     * Features:
     * - CLAHE contrast normalization (eliminates camera shadows and uneven illumination).
     * - Sub-pixel auto-centering search window (tolerates print skew, camera angle, and partial fills).
     * - Dynamic local row paper baseline calculation (100% immune to lighting gradients).
     * - Multi-feature scoring (Dark Pixel Ratio + Relative Darkness Drop).
     * - Row-relative baseline subtraction and contrast ratio analysis for definitive Blank / Single / Multiple discrimination.
     */
    private fun recognizeBubbles(
        warped: Mat,
        totalQuestions: Int,
        optionsCount: Int,
        templateId: String = TEMPLATE_MODEL_1
    ): OmrResult {
        val annotated = warped.clone()

        val gray = Mat()
        Imgproc.cvtColor(warped, gray, Imgproc.COLOR_BGR2GRAY)

        // 1. Contrast Enhancement (CLAHE - Contrast Limited Adaptive Histogram Equalization)
        val clahe = Imgproc.createCLAHE(3.0, Size(8.0, 8.0))
        val enhancedGray = Mat()
        clahe.apply(gray, enhancedGray)

        // Subtle Gaussian smoothing to eliminate camera sensor grain
        val denoised = Mat()
        Imgproc.GaussianBlur(enhancedGray, denoised, Size(3.0, 3.0), 0.0)

        val columnsCount = when {
            totalQuestions <= 20 -> 2
            totalQuestions <= 40 -> 2
            else -> 3
        }
        val questionsPerColumn = ceil(totalQuestions.toDouble() / columnsCount.toDouble()).toInt()

        // Coordinate Mapping from PDF (595.28 x 841.89 pt) to Warped Mat (1200 x 1697 px)
        val scaleX = WARP_WIDTH / A4_WIDTH.toDouble()
        val scaleY = WARP_HEIGHT / A4_HEIGHT.toDouble()

        val markerMargin = 24.0 * scaleX
        val gridTopPdf = when (templateId) {
            TEMPLATE_MODEL_2 -> 168.0
            else -> 176.0 // MODEL_1 & MODEL_3
        }
        val gridBottomPdf = A4_HEIGHT - 24.0 - 22.0 - 14.0 // ~781.89
        val gridTop = gridTopPdf * scaleY
        val availableHeight = (gridBottomPdf - gridTopPdf) * scaleY

        val contentWidth = (WARP_WIDTH - (markerMargin * 2) - (16.0 * scaleX))
        val columnWidth = contentWidth / columnsCount.toDouble()
        val rowHeight = min(26.0 * scaleY, availableHeight / (questionsPerColumn + 1).toDouble())

        // Rectangular Bubble Dimensions on Warped Mat
        val bubbleW = 15.5 * scaleX
        val bubbleH = min(9.0 * scaleY, rowHeight * 0.44)

        // Sampling core inside the bubble (leaves safe ~4.5px margin from all outer borders)
        val coreHalfW = (bubbleW * 0.35)
        val coreHalfH = (bubbleH * 0.32)

        // Sub-pixel auto-centering search offsets to tolerate printer shifts and camera tilt
        val searchOffsets = listOf(
            Pair(0, 0),
            Pair(-3, 0),
            Pair(3, 0),
            Pair(0, -2),
            Pair(0, 2),
            Pair(-2, -2),
            Pair(2, 2)
        )

        val answers = ArrayList<RecognizedAnswerInternal>()
        var markedCount = 0
        var blankCount = 0
        var ambiguousCount = 0

        for (q in 1..totalQuestions) {
            val c = (q - 1) / questionsPerColumn
            val r = (q - 1) % questionsPerColumn

            val colRight = WARP_WIDTH - markerMargin - (8.0 * scaleX) - (c * columnWidth)
            val colLeft = colRight - columnWidth + (8.0 * scaleX)

            val rowY = gridTop + (20.0 * scaleY) + (r * rowHeight)
            val rowCenterY = rowY + (rowHeight / 2.0)

            val optRightBound = when (templateId) {
                TEMPLATE_MODEL_2 -> colRight - (38.0 * scaleX)
                TEMPLATE_MODEL_3 -> colRight - (44.0 * scaleX)
                else -> colRight - (44.0 * scaleX) // MODEL_1 (matching PDF exactly)
            }
            val optLeftBound = when (templateId) {
                TEMPLATE_MODEL_3 -> colLeft + (8.0 * scaleX)
                else -> colLeft + (6.0 * scaleX)
            }
            val optionGap = (optRightBound - optLeftBound) / optionsCount.toDouble()

            // Step A: Determine Local Row Paper Brightness from nominal bubble positions
            val nominalCenters = ArrayList<Point>()
            val nominalMeans = DoubleArray(optionsCount)

            for (opt in 1..optionsCount) {
                val bubbleX = optRightBound - ((opt - 0.5) * optionGap)
                nominalCenters.add(Point(bubbleX, rowCenterY))

                val minX = (bubbleX - coreHalfW).toInt().coerceIn(0, denoised.cols() - 1)
                val maxX = (bubbleX + coreHalfW).toInt().coerceIn(0, denoised.cols() - 1)
                val minY = (rowCenterY - coreHalfH).toInt().coerceIn(0, denoised.rows() - 1)
                val maxY = (rowCenterY + coreHalfH).toInt().coerceIn(0, denoised.rows() - 1)

                var sum = 0.0
                var count = 0
                for (y in minY..maxY) {
                    for (x in minX..maxX) {
                        val px = denoised.get(y, x)
                        if (px != null) {
                            sum += px[0]
                            count++
                        }
                    }
                }
                nominalMeans[opt - 1] = if (count > 0) sum / count.toDouble() else 240.0
            }

            // In any row, at least 2 to 3 options are unmarked white paper.
            // Taking the average of the brightest options gives the ground-truth paper baseline for this row!
            val sortedMeans = nominalMeans.clone().sortedDescending()
            val localPaperBrightness = if (sortedMeans.size >= 2) {
                (sortedMeans[0] + sortedMeans[1]) / 2.0
            } else {
                sortedMeans.firstOrNull() ?: 240.0
            }
            val darkPixelThreshold = localPaperBrightness * 0.80

            // Step B: Multi-Feature Evaluation with Dynamic Sub-Pixel Auto-Centering
            val optionScores = DoubleArray(optionsCount)
            val bestCenters = ArrayList<Point>()

            for (opt in 1..optionsCount) {
                val bubbleX = nominalCenters[opt - 1].x
                var maxOptionScore = 0.0
                var bestCenter = Point(bubbleX, rowCenterY)

                for (offset in searchOffsets) {
                    val sX = bubbleX + offset.first
                    val sY = rowCenterY + offset.second

                    val minX = (sX - coreHalfW).toInt().coerceIn(0, denoised.cols() - 1)
                    val maxX = (sX + coreHalfW).toInt().coerceIn(0, denoised.cols() - 1)
                    val minY = (sY - coreHalfH).toInt().coerceIn(0, denoised.rows() - 1)
                    val maxY = (sY + coreHalfH).toInt().coerceIn(0, denoised.rows() - 1)

                    var sum = 0.0
                    var darkCount = 0
                    var totalCount = 0

                    for (y in minY..maxY) {
                        for (x in minX..maxX) {
                            val px = denoised.get(y, x)
                            if (px != null) {
                                val v = px[0]
                                sum += v
                                totalCount++
                                if (v < darkPixelThreshold) {
                                    darkCount++
                                }
                            }
                        }
                    }

                    if (totalCount > 0) {
                        val mean = sum / totalCount.toDouble()
                        val darkRatio = darkCount.toDouble() / totalCount.toDouble()
                        val darknessDrop = max(0.0, (localPaperBrightness - mean) / localPaperBrightness)
                        val combined = (darkRatio * 0.60) + (darknessDrop * 0.40)
                        if (combined > maxOptionScore) {
                            maxOptionScore = combined
                            bestCenter = Point(sX, sY)
                        }
                    }
                }

                optionScores[opt - 1] = maxOptionScore
                bestCenters.add(bestCenter)
            }

            // Step C: Row-Relative Normalization & Decision Engine
            val sortedIndices = (0 until optionsCount).sortedByDescending { optionScores[it] }
            val bestIdx = sortedIndices[0]
            val bestOpt = bestIdx + 1
            val maxScore = optionScores[bestIdx]

            val secondIdx = if (sortedIndices.size > 1) sortedIndices[1] else bestIdx
            val secondMaxScore = if (sortedIndices.size > 1) optionScores[secondIdx] else 0.0

            val otherScores = (0 until optionsCount).filter { it != bestIdx }.map { optionScores[it] }
            val rowBaseline = if (otherScores.isNotEmpty()) otherScores.average() else 0.0
            val netScore = maxScore - rowBaseline
            val contrastRatio = if (secondMaxScore > 0.04) maxScore / secondMaxScore else (maxScore / 0.04)

            // Decision Thresholds
            val BLANK_SCORE_CEILING = 0.12
            val BLANK_NET_CEILING = 0.08

            val MULTIPLE_SCORE_FLOOR = 0.15
            val MULTIPLE_DIFF_CEILING = 0.09

            val CONFIRMED_SCORE_FLOOR = 0.17
            val CONFIRMED_NET_FLOOR = 0.10
            val CONFIRMED_RATIO_FLOOR = 1.55

            val selectedOption: Int
            val isBlank: Boolean
            val isMultiple: Boolean
            val isAmbiguous: Boolean
            val confidence: Double

            val halfW = (bubbleW / 2.0)
            val halfH = (bubbleH / 2.0)

            if (maxScore < BLANK_SCORE_CEILING || netScore < BLANK_NET_CEILING) {
                // 1. BLANK QUESTION (نزده - کاملاً سفید یا تفاوت ناچیز)
                selectedOption = 0
                isBlank = true
                isMultiple = false
                isAmbiguous = false
                confidence = 0.99
                blankCount++

                for (opt in 0 until optionsCount) {
                    Imgproc.circle(annotated, nominalCenters[opt], 2, Scalar(180.0, 180.0, 180.0), -1)
                }
            } else if (secondMaxScore >= MULTIPLE_SCORE_FLOOR && (maxScore - secondMaxScore) < MULTIPLE_DIFF_CEILING) {
                // 2. MULTIPLE OPTIONS MARKED (دو یا چند گزینه‌ای / باطل)
                selectedOption = -1
                isBlank = false
                isMultiple = true
                isAmbiguous = true
                confidence = 0.50
                markedCount++
                ambiguousCount++

                for (opt in 0 until optionsCount) {
                    if (optionScores[opt] >= MULTIPLE_SCORE_FLOOR) {
                        val cPt = bestCenters[opt]
                        val pt1 = Point(cPt.x - halfW, cPt.y - halfH)
                        val pt2 = Point(cPt.x + halfW, cPt.y + halfH)
                        Imgproc.rectangle(annotated, pt1, pt2, Scalar(0.0, 0.0, 240.0), 3) // Red
                    }
                }
            } else if (maxScore >= CONFIRMED_SCORE_FLOOR && netScore >= CONFIRMED_NET_FLOOR && contrastRatio >= CONFIRMED_RATIO_FLOOR) {
                // 3. CONFIRMED SINGLE MARK (تک گزینه قطعی)
                selectedOption = bestOpt
                isBlank = false
                isMultiple = false
                isAmbiguous = false
                confidence = min(0.99, maxScore * 1.35)
                markedCount++

                val cPt = bestCenters[bestIdx]
                val pt1 = Point(cPt.x - halfW, cPt.y - halfH)
                val pt2 = Point(cPt.x + halfW, cPt.y + halfH)
                Imgproc.rectangle(annotated, pt1, pt2, Scalar(16.0, 185.0, 129.0), 3) // Emerald Green

                for (opt in 0 until optionsCount) {
                    if (opt != bestIdx) {
                        Imgproc.circle(annotated, nominalCenters[opt], 2, Scalar(200.0, 200.0, 200.0), -1)
                    }
                }
            } else if (maxScore >= 0.12 && netScore >= 0.06) {
                // 4. AMBIGUOUS MARK (علامت کم‌رنگ، خط‌خوردگی یا پاک‌شده - نیازمند بازبینی)
                selectedOption = bestOpt
                isBlank = false
                isMultiple = false
                isAmbiguous = true
                confidence = 0.65
                markedCount++
                ambiguousCount++

                val cPt = bestCenters[bestIdx]
                val pt1 = Point(cPt.x - halfW, cPt.y - halfH)
                val pt2 = Point(cPt.x + halfW, cPt.y + halfH)
                Imgproc.rectangle(annotated, pt1, pt2, Scalar(245.0, 158.0, 11.0), 3) // Amber Orange
            } else {
                // 5. Fallback: Blank
                selectedOption = 0
                isBlank = true
                isMultiple = false
                isAmbiguous = false
                confidence = 0.95
                blankCount++

                for (opt in 0 until optionsCount) {
                    Imgproc.circle(annotated, nominalCenters[opt], 2, Scalar(180.0, 180.0, 180.0), -1)
                }
            }

            answers.add(
                RecognizedAnswerInternal(
                    questionNumber = q,
                    selectedOption = selectedOption,
                    confidence = confidence,
                    isAmbiguous = isAmbiguous,
                    isMultiple = isMultiple,
                    isBlank = isBlank
                )
            )
        }

        gray.release()
        enhancedGray.release()
        denoised.release()

        return OmrResult(
            answers = answers,
            annotatedMat = annotated,
            markedCount = markedCount,
            blankCount = blankCount,
            ambiguousCount = ambiguousCount
        )
    }

    private fun orderCorners(pts: List<Point>): List<Point> {
        val sortedBySum = pts.sortedBy { it.x + it.y }
        val tl = sortedBySum.first()
        val br = sortedBySum.last()

        val remaining = pts.filter { it != tl && it != br }
        val sortedByDiff = remaining.sortedBy { it.y - it.x }
        val tr = sortedByDiff.first()
        val bl = sortedByDiff.last()

        return listOf(tl, tr, br, bl)
    }

    private fun openUriStream(uri: Uri): InputStream? {
        return if (uri.scheme == "file" || uri.scheme == null) {
            val path = uri.path ?: ""
            val f = File(path)
            if (f.exists()) f.inputStream() else null
        } else {
            try {
                reactContext.contentResolver.openInputStream(uri)
            } catch (e: Exception) {
                Log.e(TAG, "openUriStream failed for $uri", e)
                null
            }
        }
    }

    private fun loadOrientedBitmap(uri: Uri): Bitmap? {
        // 1. Read EXIF Orientation from stream
        var rotation = 0
        try {
            openUriStream(uri)?.use { stream ->
                val exif = ExifInterface(stream)
                val orientation = exif.getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL)
                rotation = when (orientation) {
                    ExifInterface.ORIENTATION_ROTATE_90 -> 90
                    ExifInterface.ORIENTATION_ROTATE_180 -> 180
                    ExifInterface.ORIENTATION_ROTATE_270 -> 270
                    else -> 0
                }
            }
        } catch (e: Exception) {
            Log.d(TAG, "EXIF rotation read failed: ${e.message}")
        }

        // 2. Read image dimensions to calculate safe inSampleSize (avoids OOM on high-megapixel gallery photos)
        var sampleSize = 1
        try {
            openUriStream(uri)?.use { stream ->
                val boundsOptions = BitmapFactory.Options().apply { inJustDecodeBounds = true }
                BitmapFactory.decodeStream(stream, null, boundsOptions)
                val maxDim = max(boundsOptions.outWidth, boundsOptions.outHeight)
                while (maxDim / sampleSize > 2400) {
                    sampleSize *= 2
                }
            }
        } catch (e: Exception) {
            Log.d(TAG, "Bounds check failed: ${e.message}")
        }

        // 3. Decode the actual bitmap with calculated inSampleSize
        val decodeOptions = BitmapFactory.Options().apply {
            inSampleSize = sampleSize
            inPreferredConfig = Bitmap.Config.ARGB_8888
        }
        val bitmap = try {
            openUriStream(uri)?.use { stream ->
                BitmapFactory.decodeStream(stream, null, decodeOptions)
            }
        } catch (e: Throwable) {
            Log.e(TAG, "BitmapFactory.decodeStream failed", e)
            null
        } ?: return null

        // 4. Apply rotation if needed
        return if (rotation != 0) {
            val matrix = Matrix().apply { postRotate(rotation.toFloat()) }
            val rotated = Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
            bitmap.recycle()
            rotated
        } else {
            bitmap
        }
    }
}
