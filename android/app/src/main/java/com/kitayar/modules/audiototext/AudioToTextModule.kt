package com.kitayar.modules.audiototext

import android.app.Activity
import android.content.Intent
import android.speech.RecognizerIntent
import com.facebook.react.bridge.*

class AudioToTextModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext), ActivityEventListener {

    private var speechPromise: Promise? = null
    private val SPEECH_REQUEST_CODE = 1010

    init {
        reactContext.addActivityEventListener(this)
    }

    override fun getName(): String {
        return "AudioToTextModule"
    }

    @ReactMethod
    fun startListening(languageCode: String, promise: Promise) {
        val currentAct = getCurrentActivity()
        if (currentAct == null) {
            promise.reject("ACTIVITY_ERROR", "اکتیویتی پیدا نشد")
            return
        }

        speechPromise = promise

        try {
            val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                // تنظیم زبان (مثلا "fa-IR" برای فارسی)
                putExtra(RecognizerIntent.EXTRA_LANGUAGE, languageCode)
                putExtra(RecognizerIntent.EXTRA_PROMPT, "لطفاً صحبت کنید...")
            }
            currentAct.startActivityForResult(intent, SPEECH_REQUEST_CODE)
        } catch (e: Exception) {
            speechPromise?.reject("SPEECH_ERROR", "موتور تشخیص صدای گوگل روی گوشی شما نصب نیست.")
            speechPromise = null
        }
    }

    override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode == SPEECH_REQUEST_CODE) {
            if (resultCode == Activity.RESULT_OK && data != null) {
                val results = data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS)
                val spokenText = results?.get(0) ?: ""
                speechPromise?.resolve(spokenText)
            } else {
                speechPromise?.reject("CANCELLED", "تشخیص صدا لغو شد یا صدایی دریافت نشد.")
            }
            speechPromise = null
        }
    }

    override fun onNewIntent(intent: Intent) {}
}