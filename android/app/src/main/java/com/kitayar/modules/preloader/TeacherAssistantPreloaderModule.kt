package com.kitayar.modules.preloader

import android.content.Context
import android.content.SharedPreferences
import com.facebook.react.bridge.*
import kotlinx.coroutines.*
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL

class TeacherAssistantPreloaderModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val prefs: SharedPreferences by lazy {
        reactContext.getSharedPreferences("kitayar_teacher_assistant_cache", Context.MODE_PRIVATE)
    }

    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    private val DEFAULT_COURSES = """
        [
          {"_id":"elementary","name":"دبستان","code":"ELEMENTARY","image":"/uploads/courses/course_1792874445829_c5xhmc.jpg","color":"#c2e7fe"},
          {"_id":"middle","name":"متوسطه اول","code":"MIDDLE","image":"/uploads/courses/course_1792874523407_igg74f.jpg","color":"#c6c0fd"},
          {"_id":"high","name":"متوسطه دوم","code":"HIGH","image":"/uploads/courses/course_1792874607147_g7871t.jpg","color":"#d5f7e6"}
        ]
    """.trimIndent()

    override fun getName(): String = "TeacherAssistantPreloader"

    @ReactMethod
    fun getCachedCourses(promise: Promise) {
        try {
            val json = prefs.getString("cached_courses", null) ?: DEFAULT_COURSES
            promise.resolve(json)
        } catch (e: Exception) {
            promise.reject("CACHE_ERROR", e.message)
        }
    }

    @ReactMethod
    fun cacheCourses(coursesJson: String, promise: Promise) {
        try {
            prefs.edit().putString("cached_courses", coursesJson).apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("CACHE_ERROR", e.message)
        }
    }

    @ReactMethod
    fun preloadCourseImages(imageUrls: ReadableArray, promise: Promise) {
        scope.launch {
            try {
                val cacheDir = File(reactContext.cacheDir, "course_images_cache")
                if (!cacheDir.exists()) {
                    cacheDir.mkdirs()
                }

                for (i in 0 until imageUrls.size()) {
                    val urlStr = imageUrls.getString(i) ?: continue
                    if (!urlStr.startsWith("http")) continue

                    val fileName = urlStr.substringAfterLast("/")
                    val targetFile = File(cacheDir, fileName)
                    if (targetFile.exists() && targetFile.length() > 0) continue

                    try {
                        val url = URL(urlStr)
                        val conn = url.openConnection() as HttpURLConnection
                        conn.connectTimeout = 5000
                        conn.readTimeout = 5000
                        conn.connect()

                        if (conn.responseCode == HttpURLConnection.HTTP_OK) {
                            conn.inputStream.use { input ->
                                FileOutputStream(targetFile).use { output ->
                                    input.copyTo(output)
                                }
                            }
                        }
                        conn.disconnect()
                    } catch (_: Exception) {}
                }
                withContext(Dispatchers.Main) {
                    promise.resolve(true)
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    promise.resolve(false)
                }
            }
        }
    }

    @ReactMethod
    fun warmUp(promise: Promise) {
        // Fast warm-up for Android JVM & native resources
        scope.launch {
            withContext(Dispatchers.Main) {
                promise.resolve(true)
            }
        }
    }
}
