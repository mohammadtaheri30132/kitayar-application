package com.kitayar.modules.imageresize

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import com.facebook.react.bridge.*
import java.io.File
import java.io.FileOutputStream

class ImageResizeModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "ImageResizeModule"

    @ReactMethod
    fun getImageDimensions(uriStr: String, promise: Promise) {
        try {
            val uri = Uri.parse(uriStr)
            val options = BitmapFactory.Options().apply { inJustDecodeBounds = true }
            val input = reactApplicationContext.contentResolver.openInputStream(uri)
            BitmapFactory.decodeStream(input, null, options)
            input?.close()
            
            val map = Arguments.createMap()
            map.putInt("width", options.outWidth)
            map.putInt("height", options.outHeight)
            promise.resolve(map)
        } catch(e: Exception) {
            promise.reject("DIMENSION_ERROR", e.message)
        }
    }

    @ReactMethod
    fun resizeImage(uriStr: String, width: Int, height: Int, promise: Promise) {
        Thread {
            try {
                val uri = Uri.parse(uriStr)
                val input = reactApplicationContext.contentResolver.openInputStream(uri)
                val original = BitmapFactory.decodeStream(input)
                input?.close()
                
                if (original == null) throw Exception("امکان خواندن عکس وجود ندارد")

                // ساخت عکس با ابعاد جدید
                val resized = Bitmap.createScaledBitmap(original, width, height, true)

                val file = File(reactApplicationContext.cacheDir, "resized_${System.currentTimeMillis()}.jpg")
                val out = FileOutputStream(file)
                resized.compress(Bitmap.CompressFormat.JPEG, 100, out)
                out.flush()
                out.close()

                if (resized != original) {
                    original.recycle()
                }

                promise.resolve(file.absolutePath)
            } catch(e: Exception) {
                promise.reject("RESIZE_ERROR", e.message)
            }
        }.start()
    }
}