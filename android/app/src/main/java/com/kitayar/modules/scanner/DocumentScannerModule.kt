package com.kitayar.modules.scanner

import android.content.ContentValues
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.graphics.pdf.PdfDocument
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.media.ExifInterface
import com.facebook.react.bridge.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.opencv.android.Utils
import org.opencv.core.*
import org.opencv.imgproc.Imgproc
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import kotlin.math.*

class DocumentScannerModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val coroutineScope = CoroutineScope(Dispatchers.IO)

    override fun getName(): String = "DocumentScannerModule"

    override fun getConstants(): MutableMap<String, Any> {
        return mutableMapOf(
            "FILTER_ORIGINAL" to "ORIGINAL",
            "FILTER_AUTO_ENHANCE" to "AUTO_ENHANCE",
            "FILTER_GRAYSCALE" to "GRAYSCALE",
            "FILTER_BW_DOCUMENT" to "BW_DOCUMENT",
            "FILTER_COLOR_DOCUMENT" to "COLOR_DOCUMENT"
        )
    }

    @ReactMethod
    fun getSupportedFilters(promise: Promise) {
        val array = Arguments.createArray().apply {
            pushMap(Arguments.createMap().apply {
                putString("id", "ORIGINAL")
                putString("title", "اصلی")
                putString("description", "رنگ‌های واقعی بدون تغییر")
            })
            pushMap(Arguments.createMap().apply {
                putString("id", "AUTO_ENHANCE")
                putString("title", "بهینه‌سازی هوشمند")
                putString("description", "افزایش وضوح و کنتراست خودکار")
            })
            pushMap(Arguments.createMap().apply {
                putString("id", "BW_DOCUMENT")
                putString("title", "سند سیاه و سفید")
                putString("description", "مناسب برگه آزمون و متن چاپی")
            })
            pushMap(Arguments.createMap().apply {
                putString("id", "COLOR_DOCUMENT")
                putString("title", "سند رنگی")
                putString("description", "تقویت وضوح و حفظ امضا و نمودار")
            })
            pushMap(Arguments.createMap().apply {
                putString("id", "GRAYSCALE")
                putString("title", "خاکستری")
                putString("description", "حالت طیف خاکستری یکنواخت")
            })
        }
        promise.resolve(array)
    }

    @ReactMethod
    fun captureCameraPhoto(promise: Promise) {
        val cameraView = DocumentCameraViewManager.activeCameraView
        if (cameraView == null) {
            promise.reject("CAMERA_ERROR", "دوربین فعال پیدا نشد")
            return
        }
        cameraView.capturePhoto(promise)
    }

    /**
     * Detects 4 document corners in the given image URI.
     */
    @ReactMethod
    fun detectDocument(imageUriStr: String, promise: Promise) {
        coroutineScope.launch {
            try {
                val uri = Uri.parse(imageUriStr)
                val localFile = resolveToFile(reactContext, uri)
                val originalBitmap = loadOrientedBitmapFromFile(localFile)
                    ?: throw Exception("امکان بارگذاری تصویر وجود ندارد")

                val origWidth = originalBitmap.width
                val origHeight = originalBitmap.height

                // Downscale for fast, efficient edge detection (max 1080px)
                val maxDim = 1080.0
                val scale = if (max(origWidth, origHeight) > maxDim) {
                    maxDim / max(origWidth, origHeight).toDouble()
                } else 1.0

                val targetW = (origWidth * scale).toInt()
                val targetH = (origHeight * scale).toInt()
                val scaledBitmap = Bitmap.createScaledBitmap(originalBitmap, targetW, targetH, true)

                val mat = Mat()
                Utils.bitmapToMat(scaledBitmap, mat)

                val detectedPoints = detectDocumentCorners(mat)
                mat.release()
                if (scaledBitmap != originalBitmap) {
                    scaledBitmap.recycle()
                }
                originalBitmap.recycle()

                // Scale detected points back to original image coordinates
                val resultCorners = Arguments.createArray()
                var isFallback = false
                var confidence = 0.85

                val finalPoints = if (detectedPoints != null && detectedPoints.size == 4) {
                    detectedPoints.map { pt ->
                        org.opencv.core.Point(pt.x / scale, pt.y / scale)
                    }
                } else {
                    isFallback = true
                    confidence = 0.0
                    // Default fallback: 8% inset rectangle
                    val insetX = origWidth * 0.08
                    val insetY = origHeight * 0.08
                    listOf(
                        org.opencv.core.Point(insetX, insetY),
                        org.opencv.core.Point(origWidth - insetX, insetY),
                        org.opencv.core.Point(origWidth - insetX, origHeight - insetY),
                        org.opencv.core.Point(insetX, origHeight - insetY)
                    )
                }

                // Ensure corner ordering: TL, TR, BR, BL
                val ordered = orderCorners(finalPoints)
                for (pt in ordered) {
                    val cornerMap = Arguments.createMap().apply {
                        putDouble("x", pt.x)
                        putDouble("y", pt.y)
                    }
                    resultCorners.pushMap(cornerMap)
                }

                val response = Arguments.createMap().apply {
                    putString("imageUri", "file://${localFile.absolutePath}")
                    putInt("width", origWidth)
                    putInt("height", origHeight)
                    putArray("corners", resultCorners)
                    putDouble("confidence", confidence)
                    putBoolean("isFallback", isFallback)
                }

                withContext(Dispatchers.Main) {
                    promise.resolve(response)
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    promise.reject("DETECTION_ERROR", e.message ?: "خطا در پردازش تصویر", e)
                }
            }
        }
    }

    /**
     * Corrects perspective distortion and applies requested enhancement filter.
     */
    @ReactMethod
    fun processDocument(
        imageUriStr: String,
        cornersArray: ReadableArray,
        filterMode: String?,
        rotationDegrees: Int,
        promise: Promise
    ) {
        coroutineScope.launch {
            try {
                val uri = Uri.parse(imageUriStr)
                val localFile = resolveToFile(reactContext, uri)
                var originalBitmap = loadOrientedBitmapFromFile(localFile)
                    ?: throw Exception("امکان خواندن تصویر وجود ندارد")

                if (cornersArray.size() != 4) {
                    throw Exception("تعداد نقاط گوشه باید دقیقا ۴ نقطه باشد")
                }

                val srcPoints = ArrayList<org.opencv.core.Point>()
                for (i in 0 until 4) {
                    val map = cornersArray.getMap(i) ?: throw Exception("نقطه نامعتبر است")
                    val x = map.getDouble("x")
                    val y = map.getDouble("y")
                    srcPoints.add(org.opencv.core.Point(x, y))
                }

                val orderedSrc = orderCorners(srcPoints)

                val tl = orderedSrc[0]
                val tr = orderedSrc[1]
                val br = orderedSrc[2]
                val bl = orderedSrc[3]

                // Calculate target rectangular width and height
                val widthTop = hypot(tr.x - tl.x, tr.y - tl.y)
                val widthBottom = hypot(br.x - bl.x, br.y - bl.y)
                var destWidth = max(widthTop, widthBottom).toInt()

                val heightLeft = hypot(bl.x - tl.x, bl.y - tl.y)
                val heightRight = hypot(br.x - tr.x, br.y - tr.y)
                var destHeight = max(heightLeft, heightRight).toInt()

                // Limit max dimensions to 3200px to prevent OOM
                val maxDim = 3200
                if (max(destWidth, destHeight) > maxDim) {
                    val ratio = maxDim.toDouble() / max(destWidth, destHeight).toDouble()
                    destWidth = (destWidth * ratio).toInt()
                    destHeight = (destHeight * ratio).toInt()
                }
                destWidth = max(100, destWidth)
                destHeight = max(100, destHeight)

                val srcMat = Mat()
                Utils.bitmapToMat(originalBitmap, srcMat)
                originalBitmap.recycle()

                val srcQuad = MatOfPoint2f(tl, tr, br, bl)
                val dstQuad = MatOfPoint2f(
                    org.opencv.core.Point(0.0, 0.0),
                    org.opencv.core.Point(destWidth.toDouble(), 0.0),
                    org.opencv.core.Point(destWidth.toDouble(), destHeight.toDouble()),
                    org.opencv.core.Point(0.0, destHeight.toDouble())
                )

                val transformMatrix = Imgproc.getPerspectiveTransform(srcQuad, dstQuad)
                val warpedMat = Mat()
                Imgproc.warpPerspective(
                    srcMat,
                    warpedMat,
                    transformMatrix,
                    Size(destWidth.toDouble(), destHeight.toDouble()),
                    Imgproc.INTER_LINEAR
                )

                srcMat.release()
                transformMatrix.release()
                srcQuad.release()
                dstQuad.release()

                // Apply enhancement filter
                val mode = filterMode ?: "AUTO_ENHANCE"
                val filteredMat = applyFilter(warpedMat, mode)
                warpedMat.release()

                // Rotate if required (90, 180, 270)
                val finalMat = when ((rotationDegrees % 360 + 360) % 360) {
                    90 -> {
                        val rotated = Mat()
                        Core.rotate(filteredMat, rotated, Core.ROTATE_90_CLOCKWISE)
                        filteredMat.release()
                        rotated
                    }
                    180 -> {
                        val rotated = Mat()
                        Core.rotate(filteredMat, rotated, Core.ROTATE_180)
                        filteredMat.release()
                        rotated
                    }
                    270 -> {
                        val rotated = Mat()
                        Core.rotate(filteredMat, rotated, Core.ROTATE_90_COUNTERCLOCKWISE)
                        filteredMat.release()
                        rotated
                    }
                    else -> filteredMat
                }

                val finalBitmap = Bitmap.createBitmap(
                    finalMat.cols(),
                    finalMat.rows(),
                    Bitmap.Config.ARGB_8888
                )
                Utils.matToBitmap(finalMat, finalBitmap)
                finalMat.release()

                // Save to cache file
                val cacheDir = reactContext.cacheDir
                val scannerDir = File(cacheDir, "scanner_docs").apply { mkdirs() }
                val outputFile = File(scannerDir, "scan_${System.currentTimeMillis()}.jpg")
                val fos = FileOutputStream(outputFile)
                finalBitmap.compress(Bitmap.CompressFormat.JPEG, 92, fos)
                fos.flush()
                fos.close()

                val outW = finalBitmap.width
                val outH = finalBitmap.height
                finalBitmap.recycle()

                val result = Arguments.createMap().apply {
                    putString("uri", "file://${outputFile.absolutePath}")
                    putInt("width", outW)
                    putInt("height", outH)
                    putString("filter", mode)
                }

                withContext(Dispatchers.Main) {
                    promise.resolve(result)
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    promise.reject("PROCESSING_ERROR", e.message ?: "خطا در تصحیح پرسپکتیو و اعمال فیلتر", e)
                }
            }
        }
    }

    /**
     * Saves processed document image directly to Android MediaStore Pictures gallery.
     */
    @ReactMethod
    fun saveToGallery(imageUriStr: String, customName: String?, promise: Promise) {
        coroutineScope.launch {
            try {
                val uri = Uri.parse(imageUriStr)
                val inputStream = reactContext.contentResolver.openInputStream(uri)
                    ?: throw Exception("امکان خواندن فایل ذخیره شده وجود ندارد")
                val bitmap = BitmapFactory.decodeStream(inputStream)
                inputStream.close()
                    ?: throw Exception("خطا در بارگذاری عکس برای ذخیره")

                val fileName = (customName ?: "Kitayar_Scan_${System.currentTimeMillis()}") + ".jpg"

                val contentValues = ContentValues().apply {
                    put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
                    put(MediaStore.MediaColumns.MIME_TYPE, "image/jpeg")
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/Kitayar")
                        put(MediaStore.MediaColumns.IS_PENDING, 1)
                    }
                }

                val resolver = reactContext.contentResolver
                val imageUri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, contentValues)
                    ?: throw Exception("امکان ایجاد رکورد در گالری وجود ندارد")

                val outStream = resolver.openOutputStream(imageUri)
                    ?: throw Exception("امکان نوشتن فایل در حافظه وجود ندارد")
                bitmap.compress(Bitmap.CompressFormat.JPEG, 95, outStream)
                outStream.flush()
                outStream.close()
                bitmap.recycle()

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    contentValues.clear()
                    contentValues.put(MediaStore.MediaColumns.IS_PENDING, 0)
                    resolver.update(imageUri, contentValues, null, null)
                }

                withContext(Dispatchers.Main) {
                    promise.resolve(imageUri.toString())
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    promise.reject("SAVE_ERROR", e.message ?: "خطا در ذخیره تصویر در گالری", e)
                }
            }
        }
    }

    /**
     * Exports an array of scanned image URIs into a multi-page or single-page PDF document.
     */
    @ReactMethod
    fun exportToPdf(imageUris: ReadableArray, pdfTitle: String?, promise: Promise) {
        coroutineScope.launch {
            try {
                if (imageUris.size() == 0) {
                    throw Exception("هیچ تصویری برای تبدیل به PDF انتخاب نشده است")
                }

                val pdfDocument = PdfDocument()

                for (i in 0 until imageUris.size()) {
                    val uriStr = imageUris.getString(i)
                    val uri = Uri.parse(uriStr)
                    val stream = reactContext.contentResolver.openInputStream(uri) ?: continue
                    val bitmap = BitmapFactory.decodeStream(stream)
                    stream.close()

                    if (bitmap == null) continue

                    // Standard A4 aspect ratio in points: 595 x 842
                    val pageWidth = 595
                    val pageHeight = 842

                    val pageInfo = PdfDocument.PageInfo.Builder(pageWidth, pageHeight, i + 1).create()
                    val page = pdfDocument.startPage(pageInfo)
                    val canvas = page.canvas

                    // Calculate fitting scale preserving aspect ratio
                    val scaleX = pageWidth.toFloat() / bitmap.width.toFloat()
                    val scaleY = pageHeight.toFloat() / bitmap.height.toFloat()
                    val scale = min(scaleX, scaleY)

                    val drawWidth = bitmap.width * scale
                    val drawHeight = bitmap.height * scale
                    val offsetX = (pageWidth - drawWidth) / 2f
                    val offsetY = (pageHeight - drawHeight) / 2f

                    val matrix = Matrix().apply {
                        postScale(scale, scale)
                        postTranslate(offsetX, offsetY)
                    }

                    canvas.drawBitmap(bitmap, matrix, null)
                    pdfDocument.finishPage(page)
                    bitmap.recycle()
                }

                val fileName = (pdfTitle ?: "Scanned_Document_${System.currentTimeMillis()}") + ".pdf"
                val outputDir = File(reactContext.filesDir, "scanned_pdfs").apply { mkdirs() }
                val pdfFile = File(outputDir, fileName)

                val fos = FileOutputStream(pdfFile)
                pdfDocument.writeTo(fos)
                fos.flush()
                fos.close()
                pdfDocument.close()

                val result = Arguments.createMap().apply {
                    putString("uri", "file://${pdfFile.absolutePath}")
                    putString("fileName", fileName)
                    putDouble("fileSize", pdfFile.length().toDouble())
                }

                withContext(Dispatchers.Main) {
                    promise.resolve(result)
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    promise.reject("PDF_ERROR", e.message ?: "خطا در تولید فایل PDF", e)
                }
            }
        }
    }

    // ==========================================
    // OpenCV Detection & Enhancement Algorithms
    // ==========================================

    private fun detectDocumentCorners(src: Mat): List<org.opencv.core.Point>? {
        val gray = Mat()
        Imgproc.cvtColor(src, gray, Imgproc.COLOR_BGR2GRAY)

        // Gaussian blur to suppress fine noise
        val blurred = Mat()
        Imgproc.GaussianBlur(gray, blurred, Size(5.0, 5.0), 0.0)

        // Morphological gradient and Canny edge detection
        val edges = Mat()
        Imgproc.Canny(blurred, edges, 50.0, 150.0)

        // Dilate edges slightly to close gaps
        val kernel = Imgproc.getStructuringElement(Imgproc.MORPH_RECT, Size(3.0, 3.0))
        val dilated = Mat()
        Imgproc.dilate(edges, dilated, kernel)

        val contours = ArrayList<MatOfPoint>()
        val hierarchy = Mat()
        Imgproc.findContours(
            dilated,
            contours,
            hierarchy,
            Imgproc.RETR_LIST,
            Imgproc.CHAIN_APPROX_SIMPLE
        )

        val totalArea = src.cols() * src.rows().toDouble()
        var bestQuad: List<org.opencv.core.Point>? = null
        var maxArea = 0.0

        for (contour in contours) {
            val contour2f = MatOfPoint2f(*contour.toArray())
            val peri = Imgproc.arcLength(contour2f, true)
            val approx = MatOfPoint2f()

            // Approximate polygon with epsilon = 2% of perimeter
            Imgproc.approxPolyDP(contour2f, approx, 0.02 * peri, true)

            if (approx.total() == 4L) {
                val points = approx.toArray().toList()
                val isConvex = Imgproc.isContourConvex(MatOfPoint(*approx.toArray()))
                val area = Imgproc.contourArea(approx)

                // Must be convex and take between 8% and 98% of total area
                if (isConvex && area > totalArea * 0.08 && area < totalArea * 0.98) {
                    if (isValidQuadrilateralAngles(points) && area > maxArea) {
                        maxArea = area
                        bestQuad = points
                    }
                }
            }

            contour2f.release()
            approx.release()
            contour.release()
        }

        gray.release()
        blurred.release()
        edges.release()
        kernel.release()
        dilated.release()
        hierarchy.release()

        return bestQuad
    }

    private fun isValidQuadrilateralAngles(pts: List<org.opencv.core.Point>): Boolean {
        for (i in pts.indices) {
            val p1 = pts[i]
            val p2 = pts[(i + 1) % 4]
            val p3 = pts[(i + 2) % 4]

            val v1x = p1.x - p2.x
            val v1y = p1.y - p2.y
            val v2x = p3.x - p2.x
            val v2y = p3.y - p2.y

            val dot = v1x * v2x + v1y * v2y
            val mag1 = hypot(v1x, v1y)
            val mag2 = hypot(v2x, v2y)

            if (mag1 == 0.0 || mag2 == 0.0) return false

            val cosVal = max(-1.0, min(1.0, dot / (mag1 * mag2)))
            val angleDeg = acos(cosVal) * (180.0 / Math.PI)

            // Valid angles between 55 and 125 degrees
            if (angleDeg < 55.0 || angleDeg > 125.0) {
                return false
            }
        }
        return true
    }

    /**
     * Orders points: [0] Top-Left, [1] Top-Right, [2] Bottom-Right, [3] Bottom-Left
     */
    private fun orderCorners(pts: List<org.opencv.core.Point>): List<org.opencv.core.Point> {
        val sumList = pts.map { it.x + it.y }
        val diffList = pts.map { it.y - it.x }

        var tlIdx = 0
        var brIdx = 0
        var trIdx = 0
        var blIdx = 0

        var minSum = Double.MAX_VALUE
        var maxSum = -Double.MAX_VALUE
        var minDiff = Double.MAX_VALUE
        var maxDiff = -Double.MAX_VALUE

        for (i in pts.indices) {
            val sum = sumList[i]
            val diff = diffList[i]

            if (sum < minSum) {
                minSum = sum
                tlIdx = i
            }
            if (sum > maxSum) {
                maxSum = sum
                brIdx = i
            }
            if (diff < minDiff) {
                minDiff = diff
                trIdx = i
            }
            if (diff > maxDiff) {
                maxDiff = diff
                blIdx = i
            }
        }

        return listOf(pts[tlIdx], pts[trIdx], pts[brIdx], pts[blIdx])
    }

    private fun applyFilter(src: Mat, mode: String): Mat {
        return when (mode.uppercase()) {
            "ORIGINAL" -> src.clone()

            "AUTO_ENHANCE" -> {
                // CLAHE (Contrast Limited Adaptive Histogram Equalization) on Lab L-channel
                val lab = Mat()
                Imgproc.cvtColor(src, lab, Imgproc.COLOR_BGR2Lab)

                val channels = ArrayList<Mat>()
                Core.split(lab, channels)

                val clahe = Imgproc.createCLAHE(2.0, Size(8.0, 8.0))
                val enhancedL = Mat()
                clahe.apply(channels[0], enhancedL)
                enhancedL.copyTo(channels[0])

                Core.merge(channels, lab)
                val enhanced = Mat()
                Imgproc.cvtColor(lab, enhanced, Imgproc.COLOR_Lab2BGR)

                // Subtle unsharp mask for crisp text
                val blurred = Mat()
                Imgproc.GaussianBlur(enhanced, blurred, Size(0.0, 0.0), 2.0)
                val sharpened = Mat()
                Core.addWeighted(enhanced, 1.3, blurred, -0.3, 0.0, sharpened)

                lab.release()
                enhancedL.release()
                enhanced.release()
                blurred.release()
                for (c in channels) c.release()

                sharpened
            }

            "GRAYSCALE" -> {
                val gray = Mat()
                Imgproc.cvtColor(src, gray, Imgproc.COLOR_BGR2GRAY)
                // Normalize contrast
                val enhancedGray = Mat()
                val clahe = Imgproc.createCLAHE(1.8, Size(8.0, 8.0))
                clahe.apply(gray, enhancedGray)

                val result = Mat()
                Imgproc.cvtColor(enhancedGray, result, Imgproc.COLOR_GRAY2BGR)

                gray.release()
                enhancedGray.release()
                result
            }

            "BW_DOCUMENT" -> {
                // Adaptive thresholding: High-contrast binarization like a photocopy/scanner
                val gray = Mat()
                Imgproc.cvtColor(src, gray, Imgproc.COLOR_BGR2GRAY)

                val blurred = Mat()
                Imgproc.GaussianBlur(gray, blurred, Size(3.0, 3.0), 0.0)

                val bw = Mat()
                Imgproc.adaptiveThreshold(
                    blurred,
                    bw,
                    255.0,
                    Imgproc.ADAPTIVE_THRESH_GAUSSIAN_C,
                    Imgproc.THRESH_BINARY,
                    15,
                    10.0
                )

                val result = Mat()
                Imgproc.cvtColor(bw, result, Imgproc.COLOR_GRAY2BGR)

                gray.release()
                blurred.release()
                bw.release()
                result
            }

            "COLOR_DOCUMENT" -> {
                // Enhance colors while brightening and normalizing paper background
                val hsv = Mat()
                Imgproc.cvtColor(src, hsv, Imgproc.COLOR_BGR2HSV)

                val hsvChannels = ArrayList<Mat>()
                Core.split(hsv, hsvChannels)

                // Boost saturation slightly for inks, stamps, markings
                hsvChannels[1].convertTo(hsvChannels[1], -1, 1.25, 0.0)

                // CLAHE on value channel to even out background shadows
                val clahe = Imgproc.createCLAHE(2.2, Size(8.0, 8.0))
                val enhancedV = Mat()
                clahe.apply(hsvChannels[2], enhancedV)
                enhancedV.copyTo(hsvChannels[2])

                Core.merge(hsvChannels, hsv)
                val colorDoc = Mat()
                Imgproc.cvtColor(hsv, colorDoc, Imgproc.COLOR_HSV2BGR)

                hsv.release()
                enhancedV.release()
                for (c in hsvChannels) c.release()

                colorDoc
            }

            else -> src.clone()
        }
    }

    private fun resolveToFile(context: Context, uri: Uri): File {
        if (uri.scheme == "file") {
            val path = uri.path ?: throw Exception("مسیر فایل خالی است")
            val f = File(path)
            if (f.exists()) return f
        }
        val cacheDir = context.cacheDir
        val outputDir = File(cacheDir, "scanner_temp").apply { mkdirs() }
        val cacheFile = File(outputDir, "picked_input_${System.currentTimeMillis()}.jpg")
        context.contentResolver.openInputStream(uri)?.use { input ->
            FileOutputStream(cacheFile).use { output ->
                input.copyTo(output)
            }
        } ?: throw Exception("امکان خواندن تصویر وجود ندارد")
        return cacheFile
    }

    private fun loadOrientedBitmapFromFile(file: File): Bitmap? {
        val bitmap = BitmapFactory.decodeFile(file.absolutePath) ?: return null

        var orientation = ExifInterface.ORIENTATION_NORMAL
        try {
            val exif = ExifInterface(file.absolutePath)
            orientation = exif.getAttributeInt(
                ExifInterface.TAG_ORIENTATION,
                ExifInterface.ORIENTATION_NORMAL
            )
        } catch (_: Exception) {}

        val matrix = Matrix()
        when (orientation) {
            ExifInterface.ORIENTATION_ROTATE_90 -> matrix.postRotate(90f)
            ExifInterface.ORIENTATION_ROTATE_180 -> matrix.postRotate(180f)
            ExifInterface.ORIENTATION_ROTATE_270 -> matrix.postRotate(270f)
            else -> return bitmap
        }

        val rotated = Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
        if (rotated != bitmap) {
            bitmap.recycle()
        }
        return rotated
    }
}
