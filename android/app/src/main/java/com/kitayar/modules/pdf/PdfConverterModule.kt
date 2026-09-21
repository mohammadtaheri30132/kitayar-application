package com.kitayar.modules.pdf

import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.pdf.PdfDocument
import android.net.Uri
import com.facebook.react.bridge.*
import java.io.File
import java.io.FileOutputStream

class PdfConverterModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "PdfConverterModule"
    }

    @ReactMethod
    fun selectAndExtractPdfPages(pdfUriString: String, outputFileName: String, promise: Promise) {
        PdfSelectorActivity.currentPromise = promise
        val activity = getCurrentActivity()
        if (activity == null) {
            promise.reject("ERROR", "Activity not found")
            return
        }
        
        val intent = Intent(activity, PdfSelectorActivity::class.java)
        intent.putExtra("pdfUri", pdfUriString)
        intent.putExtra("outputName", outputFileName)
        activity.startActivity(intent)
    }

    @ReactMethod
    fun imagesToPdf(imageUris: ReadableArray, outputFileName: String, promise: Promise) {
        try {
            val document = PdfDocument()
            
            for (i in 0 until imageUris.size()) {
                val uriStr = imageUris.getString(i)
                val uri = Uri.parse(uriStr)
                val inputStream = reactApplicationContext.contentResolver.openInputStream(uri)
                val bitmap = BitmapFactory.decodeStream(inputStream)
                inputStream?.close()
                
                if (bitmap != null) {
                    val pageInfo = PdfDocument.PageInfo.Builder(bitmap.width, bitmap.height, i + 1).create()
                    val page = document.startPage(pageInfo)
                    page.canvas.drawBitmap(bitmap, 0f, 0f, null)
                    document.finishPage(page)
                }
            }
            
            val outputDir = reactApplicationContext.filesDir
            val outputFile = File(outputDir, "$outputFileName.pdf")
            val outputStream = FileOutputStream(outputFile)
            document.writeTo(outputStream)
            
            document.close()
            outputStream.close()
            
            promise.resolve(outputFile.absolutePath)
        } catch (e: Exception) {
            promise.reject("CONVERSION_ERROR", e.message)
        }
    }
}