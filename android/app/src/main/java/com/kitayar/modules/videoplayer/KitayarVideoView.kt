package com.kitayar.modules.videoplayer

import android.graphics.Matrix
import android.graphics.SurfaceTexture
import android.media.MediaPlayer
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.view.Surface
import android.view.TextureView
import android.widget.FrameLayout
import com.facebook.react.bridge.Arguments
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.events.RCTEventEmitter

class KitayarVideoView(private val reactContext: ThemedReactContext) : FrameLayout(reactContext),
    TextureView.SurfaceTextureListener, MediaPlayer.OnPreparedListener, MediaPlayer.OnCompletionListener, MediaPlayer.OnVideoSizeChangedListener {

    private val textureView = TextureView(reactContext)
    private var mediaPlayer: MediaPlayer? = null
    private var surface: Surface? = null

    private var videoSrc: String? = null
    private var isPaused = true
    private var isPrepared = false

    private val progressHandler = Handler(Looper.getMainLooper())
    private val progressRunnable = object : Runnable {
        override fun run() {
            if (mediaPlayer?.isPlaying == true) {
                val event = Arguments.createMap()
                event.putDouble("currentTime", (mediaPlayer?.currentPosition ?: 0) / 1000.0)
                reactContext.getJSModule(RCTEventEmitter::class.java).receiveEvent(id, "onVideoProgress", event)
            }
            // آپدیت سریع‌تر (50 میلی‌ثانیه) برای حرکت نرم‌ترِ خط پخش
            progressHandler.postDelayed(this, 50) 
        }
    }

    init {
        val params = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
        textureView.layoutParams = params
        textureView.surfaceTextureListener = this
        addView(textureView)
    }

    fun setSrc(src: String?) {
        videoSrc = src
        isPrepared = false
        setupMediaPlayer()
    }

    fun setPaused(paused: Boolean) {
        isPaused = paused
        if (isPrepared) {
            if (paused) {
                mediaPlayer?.pause()
                progressHandler.removeCallbacks(progressRunnable)
            } else {
                mediaPlayer?.start()
                progressHandler.post(progressRunnable)
            }
        }
    }

    fun seekTo(seconds: Double) {
        if (isPrepared) {
            val millis = (seconds * 1000).toLong()
            // استفاده از SEEK_CLOSEST برای پرش دقیق روی فریم‌ها در زمان کشیدن اسلایدر
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                mediaPlayer?.seekTo(millis, MediaPlayer.SEEK_CLOSEST)
            } else {
                mediaPlayer?.seekTo(millis.toInt())
            }
        }
    }

    private fun setupMediaPlayer() {
        if (videoSrc == null || surface == null) return

        try {
            mediaPlayer?.release()
            mediaPlayer = MediaPlayer().apply {
                setSurface(surface)
                // اصلاح نحوه خواندن فایل‌های content:// از گالری
                try {
                    val uri = Uri.parse(videoSrc)
                    setDataSource(reactContext, uri)
                } catch (e: Exception) {
                    setDataSource(videoSrc) // Fallback
                }
                
                setOnPreparedListener(this@KitayarVideoView)
                setOnCompletionListener(this@KitayarVideoView)
                setOnVideoSizeChangedListener(this@KitayarVideoView)
                prepareAsync()
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    override fun onPrepared(mp: MediaPlayer?) {
        isPrepared = true
        if (!isPaused) {
            mediaPlayer?.start()
            progressHandler.post(progressRunnable)
        }
    }

    override fun onCompletion(mp: MediaPlayer?) {
        // پایان ویدیو را به جاوااسکریپت اطلاع می‌دهیم تا لوپ کنترل شود
        val event = Arguments.createMap()
        event.putDouble("currentTime", (mediaPlayer?.duration ?: 0) / 1000.0)
        reactContext.getJSModule(RCTEventEmitter::class.java).receiveEvent(id, "onVideoProgress", event)
    }

    override fun onVideoSizeChanged(mp: MediaPlayer?, width: Int, height: Int) {
        if (width == 0 || height == 0) return
        val viewWidth = this.width.toFloat()
        val viewHeight = this.height.toFloat()
        val videoRatio = width.toFloat() / height.toFloat()
        val viewRatio = viewWidth / viewHeight

        val scaleX: Float
        val scaleY: Float

        if (videoRatio > viewRatio) {
            scaleX = 1f
            scaleY = viewWidth / videoRatio / viewHeight
        } else {
            scaleX = viewHeight * videoRatio / viewWidth
            scaleY = 1f
        }

        val matrix = Matrix()
        matrix.setScale(scaleX, scaleY, viewWidth / 2f, viewHeight / 2f)
        textureView.setTransform(matrix)
    }

    override fun onSurfaceTextureAvailable(st: SurfaceTexture, width: Int, height: Int) {
        surface = Surface(st)
        setupMediaPlayer()
    }

    override fun onSurfaceTextureSizeChanged(st: SurfaceTexture, width: Int, height: Int) {}
    override fun onSurfaceTextureUpdated(st: SurfaceTexture) {}

    override fun onSurfaceTextureDestroyed(st: SurfaceTexture): Boolean {
        surface?.release()
        surface = null
        mediaPlayer?.release()
        mediaPlayer = null
        progressHandler.removeCallbacks(progressRunnable)
        return true
    }

    fun cleanUp() {
        mediaPlayer?.release()
        mediaPlayer = null
        progressHandler.removeCallbacks(progressRunnable)
    }
}