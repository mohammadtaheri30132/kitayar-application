package com.kitayar.modules.texttopdf

import android.graphics.Canvas
import android.graphics.Color
import android.graphics.pdf.PdfDocument
import android.net.Uri
import android.os.Build
import android.text.Layout
import android.text.StaticLayout
import android.text.TextPaint
import com.facebook.react.bridge.*
import java.io.File
import java.io.FileOutputStream

class TextToPdfModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName() = "TextToPdfModule"

    @ReactMethod
    fun convertTextToPdf(uriStr: String, promise: Promise) {
        Thread {
            try {
                val uri = Uri.parse(uriStr)
                val inputStream = reactApplicationContext.contentResolver.openInputStream(uri)
                val text = inputStream?.bufferedReader()?.use { it.readText() } ?: ""
                
                val document = PdfDocument()
                // سایز A4 استاندارد به پوینت (595 در 842)
                val pageInfo = PdfDocument.PageInfo.Builder(595, 842, 1).create()
                
                val textPaint = TextPaint().apply {
                    color = Color.BLACK
                    textSize = 14f
                    isAntiAlias = true
                }

                val margin = 50
                val printableWidth = pageInfo.pageWidth - (2 * margin)
                val printableHeight = pageInfo.pageHeight - (2 * margin)

                // پشتیبانی از راست‌چین بودن متون فارسی و چینش خودکار کلمات
                val staticLayout = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    StaticLayout.Builder.obtain(text, 0, text.length, textPaint, printableWidth)
                        .setAlignment(Layout.Alignment.ALIGN_NORMAL)
                        .setLineSpacing(0f, 1.5f)
                        .build()
                } else {
                    @Suppress("DEPRECATION")
                    StaticLayout(text, textPaint, printableWidth, Layout.Alignment.ALIGN_NORMAL, 1.5f, 0f, false)
                }

                var yOffset = 0
                var pageNumber = 1

                while (yOffset < staticLayout.height) {
                    val page = document.startPage(pageInfo)
                    val canvas = page.canvas

                    canvas.save()
                    canvas.translate(margin.toFloat(), margin.toFloat() - yOffset)
                    
                    // جلوگیری از رسم متون خارج از کادر صفحه فعلی
                    canvas.clipRect(0, yOffset, printableWidth, yOffset + printableHeight)
                    
                    staticLayout.draw(canvas)
                    canvas.restore()

                    document.finishPage(page)
                    yOffset += printableHeight
                    pageNumber++
                }

                val outputFile = File(reactApplicationContext.cacheDir, "text_converted_${System.currentTimeMillis()}.pdf")
                val outputStream = FileOutputStream(outputFile)
                document.writeTo(outputStream)
                document.close()
                outputStream.close()

                promise.resolve(outputFile.absolutePath)
            } catch (e: Exception) {
                promise.reject("CONVERT_ERROR", e.message)
            }
        }.start()
    }
}