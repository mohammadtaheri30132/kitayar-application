package com.kitayar.modules.chat

import android.media.AudioAttributes
import android.media.MediaPlayer
import android.os.Handler
import android.os.Looper
import android.util.Log

object ChatAudioPlayerHelper {
    private var mediaPlayer: MediaPlayer? = null
    private var currentPlayingUrl: String? = null
    private var progressListener: ((Int, Int) -> Unit)? = null
    private var completionListener: (() -> Unit)? = null

    private val handler = Handler(Looper.getMainLooper())
    private val progressRunnable = object : Runnable {
        override fun run() {
            mediaPlayer?.let { player ->
                if (player.isPlaying) {
                    val current = player.currentPosition
                    val total = player.duration
                    progressListener?.invoke(current, total)
                    handler.postDelayed(this, 100)
                }
            }
        }
    }

    fun play(
        url: String,
        onProgress: (Int, Int) -> Unit,
        onComplete: () -> Unit
    ) {
        if (currentPlayingUrl == url && mediaPlayer?.isPlaying == true) {
            pause()
            return
        }

        stop()

        try {
            currentPlayingUrl = url
            progressListener = onProgress
            completionListener = onComplete

            mediaPlayer = MediaPlayer().apply {
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .build()
                )
                setDataSource(url)
                prepareAsync()
                setOnPreparedListener { player ->
                    player.start()
                    handler.post(progressRunnable)
                }
                setOnCompletionListener {
                    stop()
                    onComplete.invoke()
                }
                setOnErrorListener { _, what, extra ->
                    Log.e("ChatAudioPlayer", "Playback error: what=$what extra=$extra")
                    stop()
                    onComplete.invoke()
                    true
                }
            }
        } catch (e: Exception) {
            Log.e("ChatAudioPlayer", "Error starting playback", e)
            stop()
            onComplete.invoke()
        }
    }

    fun pause() {
        handler.removeCallbacks(progressRunnable)
        mediaPlayer?.let {
            if (it.isPlaying) {
                it.pause()
            }
        }
    }

    fun stop() {
        handler.removeCallbacks(progressRunnable)
        try {
            mediaPlayer?.stop()
            mediaPlayer?.release()
        } catch (e: Exception) {
            // Ignore release errors
        } finally {
            mediaPlayer = null
            currentPlayingUrl = null
            progressListener = null
            completionListener = null
        }
    }

    fun isPlaying(url: String): Boolean {
        return currentPlayingUrl == url && mediaPlayer?.isPlaying == true
    }
}
