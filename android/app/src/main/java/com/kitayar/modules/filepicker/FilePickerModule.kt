package com.kitayar.modules.filepicker

import android.app.Activity
import android.content.Intent
import com.facebook.react.bridge.*

class FilePickerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext), ActivityEventListener {

    private var pickerPromise: Promise? = null
    private val PICK_FILE_REQUEST_CODE = 4132

    init {
        reactContext.addActivityEventListener(this)
    }

    override fun getName(): String {
        return "FilePickerModule"
    }

    // 👈 اضافه شدن متد انتخاب تک‌عکس برای OCR و سایر بخش‌ها
    @ReactMethod
    fun pickImage(promise: Promise) {
        val activity = getCurrentActivity()
        if (activity == null) {
            promise.reject("ACTIVITY_ERROR", "صفحه اکتیویتی پیدا نشد")
            return
        }
        pickerPromise = promise
        try {
            val intent = Intent(Intent.ACTION_GET_CONTENT).apply {
                addCategory(Intent.CATEGORY_OPENABLE)
                type = "image/*"
            }
            activity.startActivityForResult(intent, PICK_FILE_REQUEST_CODE)
        } catch (e: Exception) {
            pickerPromise?.reject("PICKER_ERROR", "خطا در باز کردن فایل منیجر")
            pickerPromise = null
        }
    }
    @ReactMethod
    fun pickDocument(mimeType: String, promise: Promise) {
        val currentAct = getCurrentActivity()
        if (currentAct == null) {
            promise.reject("ACTIVITY_ERROR", "اکتیویتی پیدا نشد")
            return
        }
        pickerPromise = promise
        try {
            val intent = Intent(Intent.ACTION_GET_CONTENT).apply {
                addCategory(Intent.CATEGORY_OPENABLE)
                type = mimeType
            }
            currentAct.startActivityForResult(intent, PICK_FILE_REQUEST_CODE)
        } catch (e: Exception) {
            pickerPromise?.reject("PICKER_ERROR", "خطا در باز کردن فایل منیجر")
            pickerPromise = null
        }
    }
    @ReactMethod
    fun pickMultipleImages(promise: Promise) {
        val activity = getCurrentActivity()
        if (activity == null) {
            promise.reject("ACTIVITY_ERROR", "صفحه اکتیویتی پیدا نشد")
            return
        }
        pickerPromise = promise
        try {
            val intent = Intent(Intent.ACTION_GET_CONTENT).apply {
                addCategory(Intent.CATEGORY_OPENABLE)
                type = "image/*"
                putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true)
            }
            activity.startActivityForResult(intent, PICK_FILE_REQUEST_CODE)
        } catch (e: Exception) {
            pickerPromise?.reject("PICKER_ERROR", "خطا در باز کردن فایل منیجر")
            pickerPromise = null
        }
    }

    @ReactMethod
    fun pickPdf(promise: Promise) {
        val activity = getCurrentActivity()
        if (activity == null) {
            promise.reject("ACTIVITY_ERROR", "صفحه اکتیویتی پیدا نشد")
            return
        }
        pickerPromise = promise
        try {
            val intent = Intent(Intent.ACTION_GET_CONTENT).apply {
                addCategory(Intent.CATEGORY_OPENABLE)
                type = "application/pdf"
            }
            activity.startActivityForResult(intent, PICK_FILE_REQUEST_CODE)
        } catch (e: Exception) {
            pickerPromise?.reject("PICKER_ERROR", "خطا در باز کردن فایل منیجر")
            pickerPromise = null
        }
    }

    override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode == PICK_FILE_REQUEST_CODE && pickerPromise != null) {
            if (resultCode == Activity.RESULT_OK && data != null) {
                val uriArray = Arguments.createArray()
                
                if (data.clipData != null) {
                    val count = data.clipData!!.itemCount
                    for (i in 0 until count) {
                        uriArray.pushString(data.clipData!!.getItemAt(i).uri.toString())
                    }
                } else if (data.data != null) {
                    uriArray.pushString(data.data.toString())
                }
                
                pickerPromise?.resolve(uriArray)
            } else {
                pickerPromise?.reject("CANCELLED", "انتخاب فایل لغو شد")
            }
            pickerPromise = null
        }
    }

    override fun onNewIntent(intent: Intent) {}
}