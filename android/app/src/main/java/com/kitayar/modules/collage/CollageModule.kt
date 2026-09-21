package com.kitayar.modules.collage

import android.content.Intent
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class CollageModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "CollageModule"
    }

    @ReactMethod
    fun openCollageMaker(promise: Promise) {
        // استفاده از متد صحیح برای دریافت اکتیویتی فعلی
        val currentAct = getCurrentActivity() 
        
        if (currentAct == null) {
            promise.reject("ACTIVITY_ERROR", "اکتیویتی پیدا نشد")
            return
        }

        CollageActivity.currentPromise = promise
        val intent = Intent(currentAct, CollageActivity::class.java)
        currentAct.startActivity(intent)
    }
}