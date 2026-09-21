package com.kitayar.modules.pdfcore

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.ColorMatrix
import android.graphics.ColorMatrixColorFilter
import android.graphics.Paint
import android.net.Uri
import android.os.ParcelFileDescriptor
import com.facebook.react.bridge.*
import com.shockwave.pdfium.PdfDocument
import com.shockwave.pdfium.PdfiumCore
import com.tom_roush.pdfbox.android.PDFBoxResourceLoader
import com.tom_roush.pdfbox.pdmodel.PDDocument
import com.tom_roush.pdfbox.text.PDFTextStripper
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import kotlin.concurrent.thread

class PdfCoreModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "PdfCoreModule"

    private val core = PdfiumCore(reactApplicationContext)
    private val documents = ConcurrentHashMap<String, PdfDocument>()
    private val fileDescriptors = ConcurrentHashMap<String, ParcelFileDescriptor>()

    init { PDFBoxResourceLoader.init(reactApplicationContext) }

    @ReactMethod
    fun getPageText(uriString: String, password: String?, pageIndex: Int, promise: Promise) {
        thread {
            try {
                val uri = Uri.parse(uriString)
                val inputStream: InputStream? = reactApplicationContext.contentResolver.openInputStream(uri)
                if (inputStream == null) { promise.reject("E_FILE", "نمی‌توان فایل را خواند"); return@thread }
                val document = if (!password.isNullOrEmpty()) PDDocument.load(inputStream, password) else PDDocument.load(inputStream)
                val stripper = PDFTextStripper()
                stripper.startPage = pageIndex + 1
                stripper.endPage = pageIndex + 1
                val text = stripper.getText(document)
                document.close()
                promise.resolve(text)
            } catch (e: Exception) { promise.reject("E_TEXT_EXTRACT", e.message) }
        }
    }

    @ReactMethod
    fun searchTextInPdf(uriString: String, password: String?, keyword: String, promise: Promise) {
        thread {
            try {
                val uri = Uri.parse(uriString)
                val inputStream: InputStream? = reactApplicationContext.contentResolver.openInputStream(uri)
                if (inputStream == null) { promise.reject("E_FILE", "خطا"); return@thread }
                val document = if (!password.isNullOrEmpty()) PDDocument.load(inputStream, password) else PDDocument.load(inputStream)
                val stripper = PDFTextStripper()
                val results = Arguments.createArray()
                val lowerKeyword = keyword.lowercase()

                for (i in 1..document.numberOfPages) {
                    stripper.startPage = i
                    stripper.endPage = i
                    val text = stripper.getText(document) ?: continue
                    val lowerText = text.lowercase()
                    var startIndex = 0
                    while(true) {
                        val index = lowerText.indexOf(lowerKeyword, startIndex)
                        if (index == -1) break
                        val start = Math.max(0, index - 40)
                        val end = Math.min(text.length, index + keyword.length + 40)
                        var snippet = text.substring(start, end).replace("\n", " ").replace("\r", " ")
                        snippet = "... $snippet ..."
                        val map = Arguments.createMap()
                        map.putInt("page", i - 1)
                        map.putString("snippet", snippet)
                        results.pushMap(map)
                        startIndex = index + keyword.length
                    }
                }
                document.close()
                promise.resolve(results)
            } catch (e: Exception) { promise.reject("E_SEARCH", e.message) }
        }
    }

    @ReactMethod
    fun getInitialPdfUri(promise: Promise) {
        val uri = com.kitayar.MainActivity.pendingUri
        com.kitayar.MainActivity.pendingUri = null
        promise.resolve(uri)
    }

    @ReactMethod
    fun openDocument(uriString: String, password: String?, promise: Promise) {
        try {
            val uri = Uri.parse(uriString)
            val pfd = reactApplicationContext.contentResolver.openFileDescriptor(uri, "r") ?: run { promise.reject("E_OPEN", "خطا"); return }
            val document = if (!password.isNullOrEmpty()) core.newDocument(pfd, password) else core.newDocument(pfd)
            val docId = UUID.randomUUID().toString()
            documents[docId] = document
            fileDescriptors[docId] = pfd
            val result = Arguments.createMap().apply { putString("docId", docId); putInt("pageCount", core.getPageCount(document)) }
            promise.resolve(result)
        } catch (e: Exception) { promise.reject("E_OPEN_FAILED", e.message, e) }
    }

    @ReactMethod
    fun closeDocument(docId: String, promise: Promise) {
        try {
            documents[docId]?.let { core.closeDocument(it) }
            fileDescriptors[docId]?.close()
            documents.remove(docId)
            fileDescriptors.remove(docId)
            promise.resolve(true)
        } catch (e: Exception) { promise.reject("E_CLOSE_FAILED", e.message, e) }
    }

    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        documents.values.forEach { core.closeDocument(it) }
        fileDescriptors.values.forEach { it.close() }
        documents.clear()
        fileDescriptors.clear()
    }
}