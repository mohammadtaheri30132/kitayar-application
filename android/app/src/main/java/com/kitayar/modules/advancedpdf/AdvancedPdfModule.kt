package com.kitayar.modules.advancedpdf

import android.net.Uri
import com.facebook.react.bridge.*
import com.tom_roush.pdfbox.android.PDFBoxResourceLoader
import com.tom_roush.pdfbox.multipdf.PDFMergerUtility
import com.tom_roush.pdfbox.multipdf.Splitter
import com.tom_roush.pdfbox.pdmodel.PDDocument
import com.tom_roush.pdfbox.pdmodel.encryption.AccessPermission
import com.tom_roush.pdfbox.pdmodel.encryption.StandardProtectionPolicy
import com.tom_roush.pdfbox.pdmodel.PDPageContentStream
import com.tom_roush.pdfbox.pdmodel.font.PDType1Font
import java.io.File
import java.io.FileOutputStream

class AdvancedPdfModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    init {
        // راه‌اندازی موتور PdfBox
        PDFBoxResourceLoader.init(reactContext)
    }

    override fun getName(): String = "AdvancedPdfModule"

    @ReactMethod
    fun executeTool(toolId: String, mainUriStr: String, extraUris: ReadableArray?, param: String, promise: Promise) {
        Thread {
            var document: PDDocument? = null
            try {
                val context = reactApplicationContext
                val outputDir = File(context.cacheDir, "kitayar_pdf")
                if (!outputDir.exists()) outputDir.mkdirs()
                
                val outputFile = File(outputDir, "Result_${toolId}_${System.currentTimeMillis()}.pdf")

                val mainUri = Uri.parse(mainUriStr)
                val inputStream = context.contentResolver.openInputStream(mainUri)

                when (toolId) {
                    "MERGE_PDF" -> {
                        val merger = PDFMergerUtility()
                        merger.destinationFileName = outputFile.absolutePath
                        merger.addSource(inputStream)
                        
                        if (extraUris != null) {
                            for (i in 0 until extraUris.size()) {
                                val extraUri = Uri.parse(extraUris.getString(i))
                                val extraStream = context.contentResolver.openInputStream(extraUri)
                                merger.addSource(extraStream)
                            }
                        }
                        merger.mergeDocuments(null)
                    }
                    
                    "SPLIT_PDF" -> {
                        document = PDDocument.load(inputStream)
                        // دریافت شماره صفحه‌ای که کاربر وارد کرده است (پیش‌فرض 1)
                        val pageNum = param.toIntOrNull() ?: 1
                        val index = if (pageNum > 0) pageNum - 1 else 0
                        
                        if (index in 0 until document.numberOfPages) {
                            val newDoc = PDDocument()
                            newDoc.addPage(document.getPage(index))
                            newDoc.save(outputFile)
                            newDoc.close()
                        } else {
                            throw Exception("شماره صفحه وارد شده خارج از محدوده است.")
                        }
                    }

                    "DELETE_PAGES" -> {
                        document = PDDocument.load(inputStream)
                        // param شامل شماره صفحاتی است که باید حذف شوند (مثلاً "1,3,5")
                        val pagesToDelete = param.split(",").mapNotNull { it.trim().toIntOrNull() }.sortedDescending()
                        for (pageNumber in pagesToDelete) {
                            // در PdfBox ایندکس صفحات از 0 شروع می‌شود
                            val index = pageNumber - 1
                            if (index in 0 until document.numberOfPages) {
                                document.removePage(index)
                            }
                        }
                        document.save(outputFile)
                    }

                    "ROTATE_PAGES" -> {
                        document = PDDocument.load(inputStream)
                        val degrees = param.toIntOrNull() ?: 90
                        for (page in document.pages) {
                            page.rotation = page.rotation + degrees
                        }
                        document.save(outputFile)
                    }

                    "ENCRYPT_PDF" -> {
                        document = PDDocument.load(inputStream)
                        val ap = AccessPermission()
                        // param رمز عبور کاربر است
                        val spp = StandardProtectionPolicy(param, param, ap)
                        spp.encryptionKeyLength = 128
                        document.protect(spp)
                        document.save(outputFile)
                    }

                    "WATERMARK_PDF" -> {
                        document = PDDocument.load(inputStream)
                        val font = PDType1Font.HELVETICA_BOLD
                        for (page in document.pages) {
                            val contentStream = PDPageContentStream(document, page, PDPageContentStream.AppendMode.APPEND, true, true)
                            contentStream.beginText()
                            contentStream.setFont(font, 50f)
                            contentStream.setNonStrokingColor(200, 200, 200) // رنگ خاکستری روشن
                            
                            // چرخش واترمارک و قرار دادن در مرکز
                            val tx = page.mediaBox.width / 4f
                            val ty = page.mediaBox.height / 4f
                            contentStream.newLineAtOffset(tx, ty)
                            contentStream.showText(param) // param متن واترمارک است
                            contentStream.endText()
                            contentStream.close()
                        }
                        document.save(outputFile)
                    }

                    else -> throw Exception("این ابزار به زودی در آپدیت‌های بعدی کاتلین فعال می‌شود.")
                }

                document?.close()
                inputStream?.close()

                promise.resolve(outputFile.absolutePath)

            } catch (e: Exception) {
                document?.close()
                promise.reject("PDF_PROCESS_ERROR", e.message)
            }
        }.start()
    }
}