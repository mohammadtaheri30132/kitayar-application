package com.kitayar.modules.canvas.export

import android.content.Context
import android.content.Intent
import android.graphics.*
import android.graphics.pdf.PdfDocument
import android.net.Uri
import androidx.core.content.FileProvider
import com.kitayar.modules.canvas.model.CanvasDocument
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import kotlin.math.max
import kotlin.math.min

class CanvasExporter(private val context: Context) {

    private val exportDir: File by lazy {
        File(context.cacheDir, "canvas_exports").apply {
            if (!exists()) mkdirs()
        }
    }

    suspend fun exportImage(
        document: CanvasDocument,
        format: String, // "png" or "jpeg"
        transparentBackground: Boolean = false,
        scale: Float = 1.5f,
        jpegQuality: Int = 90
    ): File = withContext(Dispatchers.IO) {
        val bbox = document.getBoundingBox()
        val width = max(200, (bbox.width() * scale).toInt())
        val height = max(200, (bbox.height() * scale).toInt())

        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)

        if (!transparentBackground || format == "jpeg") {
            val bgPaint = Paint().apply { color = document.backgroundColor }
            canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), bgPaint)
        }

        canvas.save()
        canvas.scale(scale, scale)
        canvas.translate(-bbox.left, -bbox.top)

        val sorted = document.elements.sortedBy { it.zIndex }
        for (el in sorted) {
            el.draw(canvas, isSelected = false)
        }
        canvas.restore()

        val ext = if (format == "jpeg") "jpg" else "png"
        val outFile = File(exportDir, "canvas_${System.currentTimeMillis()}.$ext")
        val compressFormat = if (format == "jpeg") Bitmap.CompressFormat.JPEG else Bitmap.CompressFormat.PNG
        val quality = if (format == "jpeg") jpegQuality else 100

        FileOutputStream(outFile).use { fos ->
            bitmap.compress(compressFormat, quality, fos)
            fos.flush()
        }
        bitmap.recycle()

        outFile
    }

    suspend fun exportPdf(
        document: CanvasDocument,
        pageSize: String = "fit", // "fit", "a4_portrait", "a4_landscape"
    ): File = withContext(Dispatchers.IO) {
        val bbox = document.getBoundingBox()
        val pdfDoc = PdfDocument()

        val pageWidth: Int
        val pageHeight: Int
        val renderScale: Float
        val offsetX: Float
        val offsetY: Float

        when (pageSize) {
            "a4_portrait" -> {
                pageWidth = 595
                pageHeight = 842
                val margin = 36f
                val availW = pageWidth - margin * 2
                val availH = pageHeight - margin * 2
                renderScale = min(availW / bbox.width(), availH / bbox.height())
                offsetX = margin + (availW - bbox.width() * renderScale) / 2f - bbox.left * renderScale
                offsetY = margin + (availH - bbox.height() * renderScale) / 2f - bbox.top * renderScale
            }
            "a4_landscape" -> {
                pageWidth = 842
                pageHeight = 595
                val margin = 36f
                val availW = pageWidth - margin * 2
                val availH = pageHeight - margin * 2
                renderScale = min(availW / bbox.width(), availH / bbox.height())
                offsetX = margin + (availW - bbox.width() * renderScale) / 2f - bbox.left * renderScale
                offsetY = margin + (availH - bbox.height() * renderScale) / 2f - bbox.top * renderScale
            }
            else -> {
                // "fit"
                pageWidth = max(200, bbox.width().toInt())
                pageHeight = max(200, bbox.height().toInt())
                renderScale = 1.0f
                offsetX = -bbox.left
                offsetY = -bbox.top
            }
        }

        val pageInfo = PdfDocument.PageInfo.Builder(pageWidth, pageHeight, 1).create()
        val page = pdfDoc.startPage(pageInfo)
        val canvas = page.canvas

        // Background
        val bgPaint = Paint().apply { color = document.backgroundColor }
        canvas.drawRect(0f, 0f, pageWidth.toFloat(), pageHeight.toFloat(), bgPaint)

        // Draw vector elements
        canvas.save()
        canvas.translate(offsetX, offsetY)
        canvas.scale(renderScale, renderScale)

        val sorted = document.elements.sortedBy { it.zIndex }
        for (el in sorted) {
            el.draw(canvas, isSelected = false)
        }
        canvas.restore()

        pdfDoc.finishPage(page)

        val outFile = File(exportDir, "canvas_${System.currentTimeMillis()}.pdf")
        FileOutputStream(outFile).use { fos ->
            pdfDoc.writeTo(fos)
            fos.flush()
        }
        pdfDoc.close()

        outFile
    }

    fun shareFile(file: File, mimeType: String, chooserTitle: String = "اشتراک‌گذاری بوم") {
        val authority = "${context.packageName}.fileprovider"
        val contentUri: Uri = FileProvider.getUriForFile(context, authority, file)

        val intent = Intent(Intent.ACTION_SEND).apply {
            type = mimeType
            putExtra(Intent.EXTRA_STREAM, contentUri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }

        val chooser = Intent.createChooser(intent, chooserTitle).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(chooser)
    }
}
