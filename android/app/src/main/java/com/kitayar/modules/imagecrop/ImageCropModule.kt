package com.kitayar.modules.imagecrop

import android.content.Intent
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class ImageCropModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName() = "ImageCropModule"

    @ReactMethod
    fun openCropMaker(uriStr: String, promise: Promise) {
        // استفاده از متد صحیح برای دریافت اکتیویتی فعلی
        val currentAct = getCurrentActivity() 
        
        if (currentAct == null) {
            promise.reject("ACTIVITY_ERROR", "اکتیویتی پیدا نشد")
            return
        }

        ImageCropActivity.currentPromise = promise
        val intent = Intent(currentAct, ImageCropActivity::class.java).apply {
            putExtra("IMAGE_URI", uriStr)
        }
        currentAct.startActivity(intent)
    }
}