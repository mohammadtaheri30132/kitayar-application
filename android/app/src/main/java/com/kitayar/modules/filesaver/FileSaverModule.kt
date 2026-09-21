package com.kitayar.modules.filesaver

import android.content.ContentValues
import android.media.MediaScannerConnection
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import com.facebook.react.bridge.*
import java.io.File
import java.io.FileInputStream

class FileSaverModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "FileSaverModule"

    // پارامتر isImage از سمت JS ارسال می‌شود اما ما فرمت را هوشمند از روی فایل می‌خوانیم
    @ReactMethod
    fun saveFile(filePath: String, isImage: Boolean, promise: Promise) {
        try {
            val cleanPath = filePath.replace("file://", "")
            val sourceFile = File(cleanPath)

            if (!sourceFile.exists()) {
                promise.reject("FILE_NOT_FOUND", "فایل اصلی پیدا نشد")
                return
            }

            val fileName = sourceFile.name
            val ext = fileName.lowercase()

            // تشخیص هوشمند نوع فایل
            val isVideo = ext.endsWith(".mp4") || ext.endsWith(".mov")
            val isAudio = ext.endsWith(".m4a") || ext.endsWith(".mp3")
            val isPdf = ext.endsWith(".pdf")

            val mimeType = when {
                isVideo -> "video/mp4"
                isAudio -> if (ext.endsWith(".m4a")) "audio/mp4" else "audio/mpeg"
                isPdf -> "application/pdf"
                ext.endsWith(".png") -> "image/png"
                ext.endsWith(".webp") -> "image/webp"
                else -> "image/jpeg"
            }

            val context = reactApplicationContext

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                // روش استاندارد اندروید 10 به بالا
                val relativePath = when {
                    isVideo -> Environment.DIRECTORY_MOVIES + "/Kitayar"
                    isAudio -> Environment.DIRECTORY_MUSIC + "/Kitayar"
                    isPdf -> Environment.DIRECTORY_DOWNLOADS + "/Kitayar"
                    else -> Environment.DIRECTORY_PICTURES + "/Kitayar"
                }

                val collection = when {
                    isVideo -> MediaStore.Video.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
                    isAudio -> MediaStore.Audio.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
                    isPdf -> MediaStore.Downloads.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
                    else -> MediaStore.Images.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
                }

                val contentValues = ContentValues().apply {
                    put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
                    put(MediaStore.MediaColumns.MIME_TYPE, mimeType)
                    put(MediaStore.MediaColumns.SIZE, sourceFile.length())
                    put(MediaStore.MediaColumns.RELATIVE_PATH, relativePath)
                }

                val uri: Uri? = context.contentResolver.insert(collection, contentValues)

                if (uri != null) {
                    context.contentResolver.openOutputStream(uri).use { outputStream ->
                        FileInputStream(sourceFile).use { inputStream ->
                            inputStream.copyTo(outputStream!!)
                        }
                    }
                    promise.resolve("SUCCESS")
                } else {
                    promise.reject("SAVE_FAILED", "خطا در ایجاد فایل در حافظه")
                }
            } else {
                // روش اندروید 9 و پایین‌تر
                val dirType = when {
                    isVideo -> Environment.DIRECTORY_MOVIES
                    isAudio -> Environment.DIRECTORY_MUSIC
                    isPdf -> Environment.DIRECTORY_DOWNLOADS
                    else -> Environment.DIRECTORY_PICTURES
                }
                
                val destDir = File(Environment.getExternalStoragePublicDirectory(dirType), "Kitayar")
                if (!destDir.exists()) destDir.mkdirs()

                val destFile = File(destDir, fileName)
                sourceFile.copyTo(destFile, overwrite = true)

                // اسکن فایل برای نمایش فوری در گالری، موزیک پلیر و مدیریت فایل
                MediaScannerConnection.scanFile(context, arrayOf(destFile.absolutePath), arrayOf(mimeType)) { _, _ -> }
                
                promise.resolve("SUCCESS")
            }
        } catch (e: Exception) {
            promise.reject("SAVE_ERROR", e.message)
        }
    }
}