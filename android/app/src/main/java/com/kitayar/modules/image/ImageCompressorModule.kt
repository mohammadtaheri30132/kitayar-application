package com.kitayar.modules.image

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import com.facebook.react.bridge.*
import java.io.File
import java.io.FileOutputStream

class ImageCompressorModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "ImageCompressorModule"
    }

    @ReactMethod
    fun compressImage(imageUriString: String, outputFileName: String, quality: Int, scale: Double, outputFormat: String, promise: Promise) {
        try {
            val uri = Uri.parse(imageUriString)
            val inputStream = reactApplicationContext.contentResolver.openInputStream(uri)
            val originalBitmap = BitmapFactory.decodeStream(inputStream)
            inputStream?.close()

            if (originalBitmap == null) {
                promise.reject("ERROR", "امکان خواندن تصویر وجود ندارد")
                return
            }

            var finalBitmap = originalBitmap
            if (scale < 1.0 && scale > 0.0) {
                val width = (originalBitmap.width * scale).toInt()
                val height = (originalBitmap.height * scale).toInt()
                finalBitmap = Bitmap.createScaledBitmap(originalBitmap, width, height, true)
            }

            val outputDir = reactApplicationContext.filesDir
            val extension = if (outputFormat.uppercase() == "WEBP") ".webp" else ".jpg"
            val outputFile = File(outputDir, "$outputFileName$extension")
            val outputStream = FileOutputStream(outputFile)

            // انتخاب فرمت بر اساس درخواست
            val format = if (outputFormat.uppercase() == "WEBP") {
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
                    Bitmap.CompressFormat.WEBP_LOSSY
                } else {
                    @Suppress("DEPRECATION")
                    Bitmap.CompressFormat.WEBP
                }
            } else {
                Bitmap.CompressFormat.JPEG
            }

            finalBitmap.compress(format, quality, outputStream)
            
            outputStream.flush()
            outputStream.close()
            
            if (finalBitmap != originalBitmap) {
                finalBitmap.recycle()
            }
            originalBitmap.recycle()

            promise.resolve(outputFile.absolutePath)
        } catch (e: Exception) {
            promise.reject("COMPRESS_ERROR", e.message)
        }
    }
}