package com.kitayar.modules.canvas.bridge

import com.facebook.react.bridge.*
import com.kitayar.modules.canvas.engine.InfiniteCanvasView
import com.kitayar.modules.canvas.export.CanvasExporter
import com.kitayar.modules.canvas.model.CanvasDocument
import com.kitayar.modules.canvas.storage.CanvasDocumentStore
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.io.File

class InfiniteCanvasModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val documentStore = CanvasDocumentStore(reactContext)
    private val exporter = CanvasExporter(reactContext)
    private val scope = CoroutineScope(Dispatchers.Main)

    override fun getName(): String = "InfiniteCanvasModule"

    @ReactMethod
    fun exportActiveCanvas(format: String, options: ReadableMap?, promise: Promise) {
        val view = InfiniteCanvasView.activeInstance
        if (view == null) {
            promise.reject("CANVAS_NOT_FOUND", "بوم نقاشی فعال یافت نشد")
            return
        }

        scope.launch {
            try {
                val doc = view.document
                val exportFile: File
                val mimeType: String

                when (format.lowercase()) {
                    "pdf" -> {
                        val pageSize = options?.getString("pageSize") ?: "fit"
                        exportFile = exporter.exportPdf(doc, pageSize)
                        mimeType = "application/pdf"
                    }
                    "jpeg", "jpg" -> {
                        val scale = options?.getDouble("scale")?.toFloat() ?: 1.5f
                        val quality = options?.getInt("quality") ?: 90
                        exportFile = exporter.exportImage(doc, "jpeg", transparentBackground = false, scale = scale, jpegQuality = quality)
                        mimeType = "image/jpeg"
                    }
                    else -> { // PNG
                        val scale = options?.getDouble("scale")?.toFloat() ?: 1.5f
                        val transparent = options?.getBoolean("transparentBackground") ?: false
                        exportFile = exporter.exportImage(doc, "png", transparentBackground = transparent, scale = scale)
                        mimeType = "image/png"
                    }
                }

                val result = Arguments.createMap().apply {
                    putString("filePath", exportFile.absolutePath)
                    putString("mimeType", mimeType)
                    putString("fileName", exportFile.name)
                }
                promise.resolve(result)
            } catch (e: Exception) {
                e.printStackTrace()
                promise.reject("EXPORT_ERROR", "خطا در خروجی گرفتن از بوم: ${e.message}")
            }
        }
    }

    @ReactMethod
    fun getActiveDocumentJson(promise: Promise) {
        try {
            val view = InfiniteCanvasView.activeInstance
            if (view != null) {
                promise.resolve(view.document.toJson().toString())
            } else {
                promise.resolve("{}")
            }
        } catch (e: Exception) {
            promise.reject("GET_DOC_ERROR", e.message)
        }
    }

    @ReactMethod
    fun saveDocument(docJson: String, promise: Promise) {
        try {
            val json = JSONObject(docJson)
            val doc = CanvasDocument.fromJson(json)
            val savedFile = documentStore.saveDocument(doc)
            val result = Arguments.createMap().apply {
                putString("id", doc.id)
                putString("title", doc.title)
                putDouble("updatedAt", doc.updatedAt.toDouble())
                putString("filePath", savedFile.absolutePath)
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("SAVE_ERROR", "خطا در ذخیره‌سازی بوم: ${e.message}")
        }
    }

    @ReactMethod
    fun loadDocument(docId: String, promise: Promise) {
        try {
            val doc = documentStore.loadDocument(docId)
            if (doc != null) {
                promise.resolve(doc.toJson().toString())
            } else {
                promise.reject("NOT_FOUND", "سند با شناسه $docId یافت نشد")
            }
        } catch (e: Exception) {
            promise.reject("LOAD_ERROR", "خطا در بارگذاری سند: ${e.message}")
        }
    }

    @ReactMethod
    fun listDocuments(promise: Promise) {
        try {
            val docs = documentStore.listDocuments()
            val array = Arguments.createArray()
            for (d in docs) {
                val map = Arguments.createMap().apply {
                    putString("id", d.id)
                    putString("title", d.title)
                    putDouble("updatedAt", d.updatedAt.toDouble())
                    putInt("elementCount", d.elementCount)
                    putString("filePath", d.filePath)
                }
                array.pushMap(map)
            }
            promise.resolve(array)
        } catch (e: Exception) {
            promise.reject("LIST_ERROR", "خطا در دریافت لیست اسناد: ${e.message}")
        }
    }

    @ReactMethod
    fun deleteDocument(docId: String, promise: Promise) {
        try {
            val success = documentStore.deleteDocument(docId)
            promise.resolve(success)
        } catch (e: Exception) {
            promise.reject("DELETE_ERROR", "خطا در حذف سند: ${e.message}")
        }
    }

    @ReactMethod
    fun renameDocument(docId: String, newTitle: String, promise: Promise) {
        try {
            val success = documentStore.renameDocument(docId, newTitle)
            promise.resolve(success)
        } catch (e: Exception) {
            promise.reject("RENAME_ERROR", "خطا در تغییر نام سند: ${e.message}")
        }
    }

    @ReactMethod
    fun duplicateDocument(docId: String, promise: Promise) {
        try {
            val copy = documentStore.duplicateDocument(docId)
            if (copy != null) {
                val result = Arguments.createMap().apply {
                    putString("id", copy.id)
                    putString("title", copy.title)
                    putDouble("updatedAt", copy.updatedAt.toDouble())
                }
                promise.resolve(result)
            } else {
                promise.reject("NOT_FOUND", "سند اصلی یافت نشد")
            }
        } catch (e: Exception) {
            promise.reject("DUPLICATE_ERROR", "خطا در کپی‌برداری از سند: ${e.message}")
        }
    }

    @ReactMethod
    fun exportDocument(docJson: String, format: String, options: ReadableMap?, promise: Promise) {
        scope.launch {
            try {
                val json = JSONObject(docJson)
                val doc = CanvasDocument.fromJson(json)

                val exportFile: File
                val mimeType: String

                when (format.lowercase()) {
                    "pdf" -> {
                        val pageSize = options?.getString("pageSize") ?: "fit"
                        exportFile = exporter.exportPdf(doc, pageSize)
                        mimeType = "application/pdf"
                    }
                    "jpeg", "jpg" -> {
                        val scale = options?.getDouble("scale")?.toFloat() ?: 1.5f
                        val quality = options?.getInt("quality") ?: 90
                        exportFile = exporter.exportImage(doc, "jpeg", transparentBackground = false, scale = scale, jpegQuality = quality)
                        mimeType = "image/jpeg"
                    }
                    else -> { // PNG
                        val scale = options?.getDouble("scale")?.toFloat() ?: 1.5f
                        val transparent = options?.getBoolean("transparentBackground") ?: false
                        exportFile = exporter.exportImage(doc, "png", transparentBackground = transparent, scale = scale)
                        mimeType = "image/png"
                    }
                }

                val result = Arguments.createMap().apply {
                    putString("filePath", exportFile.absolutePath)
                    putString("mimeType", mimeType)
                    putString("fileName", exportFile.name)
                }
                promise.resolve(result)
            } catch (e: Exception) {
                e.printStackTrace()
                promise.reject("EXPORT_ERROR", "خطا در خروجی گرفتن از بوم: ${e.message}")
            }
        }
    }

    @ReactMethod
    fun shareFile(filePath: String, mimeType: String, title: String?, promise: Promise) {
        try {
            val cleanPath = filePath.replace("file://", "")
            val file = File(cleanPath)
            if (!file.exists()) {
                promise.reject("FILE_NOT_FOUND", "فایل جهت اشتراک‌گذاری یافت نشد")
                return
            }

            exporter.shareFile(file, mimeType, title ?: "اشتراک‌گذاری بوم")
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SHARE_ERROR", "خطا در اشتراک‌گذاری: ${e.message}")
        }
    }
}
