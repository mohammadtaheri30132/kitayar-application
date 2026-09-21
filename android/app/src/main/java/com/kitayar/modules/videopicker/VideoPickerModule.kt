package com.kitayar.modules.videopicker

import android.app.Activity
import android.content.Intent
import com.facebook.react.bridge.*

class VideoPickerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext), ActivityEventListener {

    private var pickerPromise: Promise? = null
    private val PICK_VIDEO_REQUEST_CODE = 1005

    init {
        reactContext.addActivityEventListener(this)
    }

    override fun getName(): String {
        return "VideoPickerModule"
    }

    @ReactMethod
    fun pickVideo(promise: Promise) {
        // استفاده از متد صحیح برای دریافت اکتیویتی
        val currentAct = getCurrentActivity() 
        
        if (currentAct == null) {
            promise.reject("ACTIVITY_ERROR", "اکتیویتی پیدا نشد")
            return
        }

        pickerPromise = promise

        try {
            val intent = Intent(Intent.ACTION_GET_CONTENT).apply {
                addCategory(Intent.CATEGORY_OPENABLE)
                type = "video/*"
            }
            currentAct.startActivityForResult(intent, PICK_VIDEO_REQUEST_CODE)
        } catch (e: Exception) {
            pickerPromise?.reject("PICKER_ERROR", "خطا در باز کردن فایل منیجر")
            pickerPromise = null
        }
    }

    override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode == PICK_VIDEO_REQUEST_CODE) {
            if (resultCode == Activity.RESULT_OK && data != null && data.data != null) {
                pickerPromise?.resolve(data.data.toString())
            } else {
                pickerPromise?.reject("CANCELLED", "انتخاب ویدیو لغو شد")
            }
            pickerPromise = null
        }
    }

    override fun onNewIntent(intent: Intent) {}
}