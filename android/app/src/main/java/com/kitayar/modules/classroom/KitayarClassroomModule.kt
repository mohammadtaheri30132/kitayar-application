package com.kitayar.modules.classroom

import android.content.Intent
import com.facebook.react.bridge.*

class KitayarClassroomModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "KitayarClassroom"
    }

    @ReactMethod
    fun openClassroom(options: ReadableMap, promise: Promise) {
        val activity = reactApplicationContext.currentActivity ?: reactContext.currentActivity
        if (activity == null) {
            promise.reject("ACTIVITY_NULL", "اکتیویتی اصلی در دسترس نیست")
            return
        }

        try {
            val roomUrl = if (options.hasKey("roomUrl")) options.getString("roomUrl") else ""
            val title = if (options.hasKey("title")) options.getString("title") else "کلاس آنلاین کیتایار"
            val isTeacher = if (options.hasKey("isTeacher")) options.getBoolean("isTeacher") else false
            val sessionId = if (options.hasKey("sessionId")) options.getString("sessionId") else ""

            if (roomUrl.isNullOrEmpty()) {
                promise.reject("URL_EMPTY", "آدرس کلاس ارسال نشده است")
                return
            }

            val intent = Intent(activity, KitayarClassroomActivity::class.java).apply {
                putExtra(KitayarClassroomActivity.EXTRA_ROOM_URL, roomUrl)
                putExtra(KitayarClassroomActivity.EXTRA_TITLE, title)
                putExtra(KitayarClassroomActivity.EXTRA_IS_TEACHER, isTeacher)
                putExtra(KitayarClassroomActivity.EXTRA_SESSION_ID, sessionId)
            }

            activity.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("LAUNCH_ERROR", "خطا در اجرای کلاس آنلاین: ${e.message}")
        }
    }
}

