package com.kitayar.modules.classroom

import android.content.Intent
import com.facebook.react.bridge.*

class KitayarClassroomModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

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
            val roomUrl = if (options.hasKey("roomUrl") && !options.isNull("roomUrl")) options.getString("roomUrl") ?: "" else ""
            val title = if (options.hasKey("title") && !options.isNull("title")) options.getString("title") ?: "کلاس آنلاین" else "کلاس آنلاین"
            val isTeacher = if (options.hasKey("isTeacher") && !options.isNull("isTeacher")) options.getBoolean("isTeacher") else false
            val sessionId = if (options.hasKey("sessionId") && !options.isNull("sessionId")) options.getString("sessionId") ?: "" else ""
            val roomId = if (options.hasKey("roomId") && !options.isNull("roomId")) options.getString("roomId") ?: sessionId else sessionId
            val token = if (options.hasKey("token") && !options.isNull("token")) options.getString("token") ?: "" else ""
            val ticketCode = if (options.hasKey("ticketCode") && !options.isNull("ticketCode")) options.getString("ticketCode") ?: "" else ""
            val userName = if (options.hasKey("userName") && !options.isNull("userName")) options.getString("userName") ?: "" else ""
            val wsUrl = if (options.hasKey("wsUrl") && !options.isNull("wsUrl")) options.getString("wsUrl") ?: "" else ""

            if (roomId.isEmpty() && roomUrl.isEmpty()) {
                promise.reject("ROOM_EMPTY", "شناسه کلاس آنلاین ارسال نشده است")
                return
            }

            val intent = Intent(activity, KitayarClassroomActivity::class.java).apply {
                putExtra(KitayarClassroomActivity.EXTRA_ROOM_URL, roomUrl)
                putExtra(KitayarClassroomActivity.EXTRA_ROOM_ID, roomId)
                putExtra(KitayarClassroomActivity.EXTRA_TITLE, title)
                putExtra(KitayarClassroomActivity.EXTRA_IS_TEACHER, isTeacher)
                putExtra(KitayarClassroomActivity.EXTRA_SESSION_ID, sessionId)
                putExtra(KitayarClassroomActivity.EXTRA_TOKEN, token)
                putExtra(KitayarClassroomActivity.EXTRA_TICKET_CODE, ticketCode)
                putExtra(KitayarClassroomActivity.EXTRA_USER_NAME, userName)
                putExtra(KitayarClassroomActivity.EXTRA_WS_URL, wsUrl)
            }

            activity.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("LAUNCH_ERROR", "خطا در اجرای کلاس آنلاین نیتیو: ${e.message}")
        }
    }
}
