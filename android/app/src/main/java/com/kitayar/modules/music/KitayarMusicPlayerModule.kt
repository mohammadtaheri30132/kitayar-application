package com.kitayar.modules.music

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.media.MediaPlayer
import android.media.PlaybackParams
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class KitayarMusicPlayerModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext),
    MediaPlayer.OnPreparedListener,
    MediaPlayer.OnCompletionListener,
    MediaPlayer.OnErrorListener,
    MediaPlayer.OnBufferingUpdateListener,
    AudioManager.OnAudioFocusChangeListener {

    companion object {
        const val NAME = "KitayarMusicPlayerModule"
        private const val TAG = "KitayarMusicPlayer"
        private const val PROGRESS_INTERVAL_MS = 250L

        const val STATE_IDLE = "idle"
        const val STATE_LOADING = "loading"
        const val STATE_PLAYING = "playing"
        const val STATE_PAUSED = "paused"
        const val STATE_STOPPED = "stopped"
        const val STATE_COMPLETED = "completed"
        const val STATE_ERROR = "error"

        var instance: KitayarMusicPlayerModule? = null
            private set
    }

    private var mediaPlayer: MediaPlayer? = null
    private var audioManager: AudioManager? = null
    private var audioFocusRequest: AudioFocusRequest? = null
    private var currentState: String = STATE_IDLE

    private var currentTrackId: String? = null
    private var currentTrackUrl: String? = null
    private var currentTrackTitle: String? = null
    private var currentTrackArtist: String? = null
    private var currentTrackCover: String? = null

    private var currentSpeed: Float = 1.0f
    private var isLoopingEnabled: Boolean = false
    private var bufferedPercent: Int = 0

    private val progressHandler = Handler(Looper.getMainLooper())
    private val progressRunnable = object : Runnable {
        override fun run() {
            try {
                val player = mediaPlayer
                if (player != null && player.isPlaying) {
                    val position = player.currentPosition
                    val duration = player.duration
                    emitProgress(position, duration, bufferedPercent)
                    progressHandler.postDelayed(this, PROGRESS_INTERVAL_MS)
                }
            } catch (e: Exception) {
                Log.w(TAG, "Error in progress loop: ${e.message}")
            }
        }
    }

    override fun getName(): String = NAME

    init {
        instance = this
        audioManager = reactContext.getSystemService(Context.AUDIO_SERVICE) as? AudioManager
    }

    private fun updateNotification(isPlaying: Boolean) {
        val title = currentTrackTitle ?: ""
        val artist = currentTrackArtist ?: ""
        val cover = currentTrackCover
        if (title.isNotEmpty() || artist.isNotEmpty() || currentTrackUrl != null) {
            KitayarMusicPlaybackService.startOrUpdateNotification(
                reactContext,
                title,
                artist,
                isPlaying,
                cover
            )
        }
    }

    private fun dismissNotification() {
        KitayarMusicPlaybackService.stopNotification(reactContext)
    }

    fun resumeFromNotification() {
        Handler(Looper.getMainLooper()).post {
            try {
                mediaPlayer?.let {
                    if (!it.isPlaying) {
                        requestAudioFocus()
                        applyPlaybackSpeed()
                        it.start()
                        startProgressTimer()
                        emitState(STATE_PLAYING)
                        updateNotification(true)
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "resumeFromNotification error", e)
            }
        }
    }

    fun pauseFromNotification() {
        Handler(Looper.getMainLooper()).post {
            try {
                pauseInternal()
            } catch (e: Exception) {
                Log.e(TAG, "pauseFromNotification error", e)
            }
        }
    }

    fun nextFromNotification() {
        Handler(Looper.getMainLooper()).post {
            sendEvent("onMusicNotificationNext", Arguments.createMap())
        }
    }

    fun prevFromNotification() {
        Handler(Looper.getMainLooper()).post {
            sendEvent("onMusicNotificationPrev", Arguments.createMap())
        }
    }

    fun stopFromNotification() {
        Handler(Looper.getMainLooper()).post {
            try {
                stopProgressTimer()
                mediaPlayer?.let {
                    if (it.isPlaying) {
                        it.stop()
                    }
                }
                abandonAudioFocus()
                dismissNotification()
                emitState(STATE_STOPPED)
                sendEvent("onMusicNotificationStop", Arguments.createMap())
            } catch (e: Exception) {
                Log.e(TAG, "stopFromNotification error", e)
            }
        }
    }

    private fun sendEvent(eventName: String, params: WritableMap?) {
        try {
            if (reactContext.hasActiveReactInstance()) {
                reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit(eventName, params)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error emitting event $eventName: ${e.message}")
        }
    }

    private fun emitState(state: String, extra: WritableMap? = null) {
        currentState = state
        val map = extra ?: Arguments.createMap()
        map.putString("state", state)
        map.putString("trackId", currentTrackId ?: "")
        sendEvent("onMusicStateChange", map)
    }

    private fun emitProgress(positionMs: Int, durationMs: Int, buffered: Int) {
        val map = Arguments.createMap().apply {
            putInt("position", positionMs)
            putInt("duration", durationMs)
            putInt("buffered", buffered)
            putString("trackId", currentTrackId ?: "")
        }
        sendEvent("onMusicProgress", map)
    }

    private fun requestAudioFocus(): Boolean {
        val am = audioManager ?: return true
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val playbackAttributes = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                .build()
            val request = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                .setAudioAttributes(playbackAttributes)
                .setAcceptsDelayedFocusGain(false)
                .setOnAudioFocusChangeListener(this)
                .build()
            audioFocusRequest = request
            am.requestAudioFocus(request) == AudioManager.AUDIOFOCUS_REQUEST_GRANTED
        } else {
            @Suppress("DEPRECATION")
            am.requestAudioFocus(
                this,
                AudioManager.STREAM_MUSIC,
                AudioManager.AUDIOFOCUS_GAIN
            ) == AudioManager.AUDIOFOCUS_REQUEST_GRANTED
        }
    }

    private fun abandonAudioFocus() {
        val am = audioManager ?: return
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            audioFocusRequest?.let { am.abandonAudioFocusRequest(it) }
            audioFocusRequest = null
        } else {
            @Suppress("DEPRECATION")
            am.abandonAudioFocus(this)
        }
    }

    override fun onAudioFocusChange(focusChange: Int) {
        when (focusChange) {
            AudioManager.AUDIOFOCUS_LOSS -> {
                pauseInternal()
            }
            AudioManager.AUDIOFOCUS_LOSS_TRANSIENT -> {
                pauseInternal()
            }
            AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK -> {
                try {
                    mediaPlayer?.setVolume(0.2f, 0.2f)
                } catch (e: Exception) {
                    Log.w(TAG, "Failed ducking volume")
                }
            }
            AudioManager.AUDIOFOCUS_GAIN -> {
                try {
                    mediaPlayer?.setVolume(1.0f, 1.0f)
                } catch (e: Exception) {
                    Log.w(TAG, "Failed restoring volume")
                }
            }
        }
    }

    @ReactMethod
    fun playTrack(trackData: ReadableMap, promise: Promise) {
        try {
            val url = if (trackData.hasKey("url")) trackData.getString("url") else null
            if (url.isNullOrBlank()) {
                promise.reject("INVALID_URL", "Audio URL is missing or empty")
                return
            }

            currentTrackId = if (trackData.hasKey("id")) trackData.getString("id") else null
            currentTrackUrl = url
            currentTrackTitle = if (trackData.hasKey("title")) trackData.getString("title") else ""
            currentTrackArtist = if (trackData.hasKey("artist")) trackData.getString("artist") else ""
            currentTrackCover = if (trackData.hasKey("coverUrl")) trackData.getString("coverUrl") else ""
            bufferedPercent = 0

            stopProgressTimer()
            releasePlayer()

            emitState(STATE_LOADING)
            updateNotification(false)

            val player = MediaPlayer().apply {
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .build()
                )
                setDataSource(url)
                setOnPreparedListener(this@KitayarMusicPlayerModule)
                setOnCompletionListener(this@KitayarMusicPlayerModule)
                setOnErrorListener(this@KitayarMusicPlayerModule)
                setOnBufferingUpdateListener(this@KitayarMusicPlayerModule)
                isLooping = isLoopingEnabled
            }

            mediaPlayer = player
            player.prepareAsync()

            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "playTrack error", e)
            emitState(STATE_ERROR, Arguments.createMap().apply { putString("error", e.message) })
            dismissNotification()
            promise.reject("PLAY_ERROR", e.message, e)
        }
    }

    override fun onPrepared(mp: MediaPlayer) {
        try {
            requestAudioFocus()
            applyPlaybackSpeed()
            mp.start()
            startProgressTimer()

            val map = Arguments.createMap().apply {
                putInt("duration", mp.duration)
                putInt("position", mp.currentPosition)
            }
            emitState(STATE_PLAYING, map)
            updateNotification(true)
        } catch (e: Exception) {
            Log.e(TAG, "Error starting onPrepared", e)
        }
    }

    override fun onCompletion(mp: MediaPlayer) {
        stopProgressTimer()
        val map = Arguments.createMap().apply {
            putString("trackId", currentTrackId ?: "")
        }
        sendEvent("onMusicCompleted", map)

        if (!isLoopingEnabled) {
            emitState(STATE_COMPLETED)
            updateNotification(false)
        } else {
            // Looping is active, keep playing
            startProgressTimer()
            updateNotification(true)
        }
    }

    override fun onError(mp: MediaPlayer, what: Int, extra: Int): Boolean {
        stopProgressTimer()
        val errorMsg = "MediaPlayer error: what=$what extra=$extra"
        Log.e(TAG, errorMsg)

        val map = Arguments.createMap().apply {
            putString("error", errorMsg)
            putInt("what", what)
            putInt("extra", extra)
        }
        emitState(STATE_ERROR, map)
        sendEvent("onMusicError", map)
        dismissNotification()
        return true
    }

    override fun onBufferingUpdate(mp: MediaPlayer, percent: Int) {
        bufferedPercent = percent
    }

    @ReactMethod
    fun pause(promise: Promise) {
        try {
            pauseInternal()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("PAUSE_ERROR", e.message, e)
        }
    }

    private fun pauseInternal() {
        mediaPlayer?.let {
            if (it.isPlaying) {
                it.pause()
                stopProgressTimer()
                emitState(STATE_PAUSED)
                updateNotification(false)
            }
        }
    }

    @ReactMethod
    fun resume(promise: Promise) {
        try {
            mediaPlayer?.let {
                if (!it.isPlaying) {
                    requestAudioFocus()
                    applyPlaybackSpeed()
                    it.start()
                    startProgressTimer()
                    emitState(STATE_PLAYING)
                    updateNotification(true)
                }
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("RESUME_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun stop(promise: Promise) {
        try {
            stopProgressTimer()
            mediaPlayer?.let {
                if (it.isPlaying) {
                    it.stop()
                }
            }
            abandonAudioFocus()
            dismissNotification()
            emitState(STATE_STOPPED)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("STOP_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun seekTo(positionMs: Double, promise: Promise) {
        try {
            mediaPlayer?.let {
                val targetMs = positionMs.toInt().coerceIn(0, it.duration)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    it.seekTo(targetMs.toLong(), MediaPlayer.SEEK_CLOSEST)
                } else {
                    it.seekTo(targetMs)
                }
                emitProgress(targetMs, it.duration, bufferedPercent)
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SEEK_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun setPlaybackSpeed(speed: Double, promise: Promise) {
        try {
            currentSpeed = speed.toFloat().coerceIn(0.25f, 3.0f)
            applyPlaybackSpeed()
            promise.resolve(currentSpeed.toDouble())
        } catch (e: Exception) {
            promise.reject("SPEED_ERROR", e.message, e)
        }
    }

    private fun applyPlaybackSpeed() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            mediaPlayer?.let { player ->
                try {
                    val isPlaying = player.isPlaying
                    val params = PlaybackParams()
                    params.speed = currentSpeed
                    player.playbackParams = params
                    if (!isPlaying) {
                        player.pause()
                    }
                } catch (e: Exception) {
                    Log.w(TAG, "Failed to set playbackParams speed: ${e.message}")
                }
            }
        }
    }

    @ReactMethod
    fun setLooping(enabled: Boolean, promise: Promise) {
        try {
            isLoopingEnabled = enabled
            mediaPlayer?.isLooping = enabled
            promise.resolve(isLoopingEnabled)
        } catch (e: Exception) {
            promise.reject("LOOP_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun getPlayerStatus(promise: Promise) {
        try {
            val map = Arguments.createMap().apply {
                putString("state", currentState)
                putString("trackId", currentTrackId ?: "")
                putString("title", currentTrackTitle ?: "")
                putString("artist", currentTrackArtist ?: "")
                putString("coverUrl", currentTrackCover ?: "")
                putDouble("speed", currentSpeed.toDouble())
                putBoolean("isLooping", isLoopingEnabled)
                val player = mediaPlayer
                if (player != null) {
                    try {
                        putInt("position", player.currentPosition)
                        putInt("duration", player.duration)
                        putBoolean("isPlaying", player.isPlaying)
                    } catch (e: Exception) {
                        putInt("position", 0)
                        putInt("duration", 0)
                        putBoolean("isPlaying", false)
                    }
                } else {
                    putInt("position", 0)
                    putInt("duration", 0)
                    putBoolean("isPlaying", false)
                }
                putInt("buffered", bufferedPercent)
            }
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("STATUS_ERROR", e.message, e)
        }
    }

    private fun startProgressTimer() {
        stopProgressTimer()
        progressHandler.post(progressRunnable)
    }

    private fun stopProgressTimer() {
        progressHandler.removeCallbacks(progressRunnable)
    }

    private fun releasePlayer() {
        try {
            mediaPlayer?.apply {
                reset()
                release()
            }
        } catch (e: Exception) {
            Log.w(TAG, "Error releasing player: ${e.message}")
        } finally {
            mediaPlayer = null
        }
    }

    @Suppress("DEPRECATION")
    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        if (instance == this) {
            instance = null
        }
        stopProgressTimer()
        releasePlayer()
        abandonAudioFocus()
        dismissNotification()
    }
}

