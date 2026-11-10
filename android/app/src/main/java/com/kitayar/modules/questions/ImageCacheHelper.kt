package com.kitayar.modules.questions

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.os.Handler
import android.os.Looper
import android.util.LruCache
import android.widget.ImageView
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors

object ImageCacheHelper {
    private val maxMemory = (Runtime.getRuntime().maxMemory() / 1024).toInt()
    private val cacheSize = maxMemory / 8

    private val memoryCache: LruCache<String, Bitmap> = object : LruCache<String, Bitmap>(cacheSize) {
        override fun sizeOf(key: String, bitmap: Bitmap): Int {
            return bitmap.byteCount / 1024
        }
    }

    private val executor = Executors.newFixedThreadPool(4)
    private val mainHandler = Handler(Looper.getMainLooper())

    private fun resolveUrl(rawUrl: String): String {
        val trimmed = rawUrl.trim()
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
            return trimmed
        }
        val path = if (trimmed.startsWith("/")) trimmed else "/$trimmed"
        return "https://kitayar.ir$path"
    }

    fun loadImage(rawUrl: String, imageView: ImageView, onComplete: ((Boolean) -> Unit)? = null) {
        val fullUrl = resolveUrl(rawUrl)
        imageView.tag = fullUrl

        // Check cache first
        val cached = memoryCache.get(fullUrl)
        if (cached != null) {
            imageView.setImageBitmap(cached)
            onComplete?.invoke(true)
            return
        }

        executor.execute {
            var bitmap: Bitmap? = null
            var connection: HttpURLConnection? = null
            var stream: InputStream? = null
            try {
                val connUrl = URL(fullUrl)
                connection = connUrl.openConnection() as HttpURLConnection
                connection.doInput = true
                connection.connectTimeout = 6000
                connection.readTimeout = 6000
                connection.connect()

                if (connection.responseCode == 200) {
                    stream = connection.inputStream
                    bitmap = BitmapFactory.decodeStream(stream)
                    if (bitmap != null) {
                        memoryCache.put(fullUrl, bitmap)
                    }
                }
            } catch (e: Exception) {
                // Ignore network errors
            } finally {
                try { stream?.close() } catch (ignored: Exception) {}
                try { connection?.disconnect() } catch (ignored: Exception) {}
            }

            val finalBitmap = bitmap
            mainHandler.post {
                if (imageView.tag == fullUrl) {
                    if (finalBitmap != null) {
                        imageView.setImageBitmap(finalBitmap)
                        onComplete?.invoke(true)
                    } else {
                        imageView.setImageBitmap(null)
                        onComplete?.invoke(false)
                    }
                }
            }
        }
    }
}
