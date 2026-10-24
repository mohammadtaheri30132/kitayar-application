package com.kitayar.modules.canvas.storage

import android.content.Context
import com.kitayar.modules.canvas.model.CanvasDocument
import org.json.JSONObject
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.nio.charset.StandardCharsets

data class DocumentInfo(
    val id: String,
    val title: String,
    val updatedAt: Long,
    val elementCount: Int,
    val filePath: String
)

class CanvasDocumentStore(private val context: Context) {

    private val baseDir: File by lazy {
        File(context.filesDir, "infinite_canvas").apply {
            if (!exists()) mkdirs()
        }
    }

    @Synchronized
    fun saveDocument(doc: CanvasDocument): File {
        doc.updatedAt = System.currentTimeMillis()
        val json = doc.toJson().toString()
        val tempFile = File(baseDir, "${doc.id}.tmp")
        val finalFile = File(baseDir, "${doc.id}.json")

        FileOutputStream(tempFile).use { fos ->
            fos.write(json.toByteArray(StandardCharsets.UTF_8))
            fos.flush()
        }

        if (finalFile.exists()) {
            finalFile.delete()
        }
        tempFile.renameTo(finalFile)
        return finalFile
    }

    @Synchronized
    fun loadDocument(docId: String): CanvasDocument? {
        val file = File(baseDir, "$docId.json")
        if (!file.exists()) return null

        return try {
            val jsonStr = FileInputStream(file).use { fis ->
                val bytes = ByteArray(file.length().toInt())
                fis.read(bytes)
                String(bytes, StandardCharsets.UTF_8)
            }
            CanvasDocument.fromJson(JSONObject(jsonStr))
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    @Synchronized
    fun listDocuments(): List<DocumentInfo> {
        val list = mutableListOf<DocumentInfo>()
        val files = baseDir.listFiles { _, name -> name.endsWith(".json") } ?: return list

        for (file in files) {
            try {
                val jsonStr = FileInputStream(file).use { fis ->
                    val bytes = ByteArray(file.length().toInt())
                    fis.read(bytes)
                    String(bytes, StandardCharsets.UTF_8)
                }
                val obj = JSONObject(jsonStr)
                val id = obj.optString("id", file.nameWithoutExtension)
                val title = obj.optString("title", "بوم بدون نام")
                val updatedAt = obj.optLong("updatedAt", file.lastModified())
                val els = obj.optJSONArray("elements")?.length() ?: 0
                list.add(DocumentInfo(id, title, updatedAt, els, file.absolutePath))
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }

        return list.sortedByDescending { it.updatedAt }
    }

    @Synchronized
    fun deleteDocument(docId: String): Boolean {
        val file = File(baseDir, "$docId.json")
        return if (file.exists()) file.delete() else false
    }

    @Synchronized
    fun renameDocument(docId: String, newTitle: String): Boolean {
        val doc = loadDocument(docId) ?: return false
        doc.title = newTitle
        saveDocument(doc)
        return true
    }

    @Synchronized
    fun duplicateDocument(docId: String): CanvasDocument? {
        val original = loadDocument(docId) ?: return null
        val copy = CanvasDocument.fromJson(original.toJson())
        copy.id = java.util.UUID.randomUUID().toString()
        copy.title = "${original.title} (کپی)"
        copy.createdAt = System.currentTimeMillis()
        saveDocument(copy)
        return copy
    }
}
