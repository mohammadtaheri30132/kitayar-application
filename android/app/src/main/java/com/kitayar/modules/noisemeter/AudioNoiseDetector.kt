package com.kitayar.modules.noisemeter

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.util.Log
import androidx.core.content.ContextCompat
import kotlin.math.log10
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sqrt

/**
 * High-performance, lightweight background audio level detector.
 * Captures microphone PCM samples, computes rolling RMS and normalized 0-100 sound level.
 * Features real-time blocking audio reads and acoustic echo blanking to prevent speaker feedback loops.
 * Never stores or transmits audio. Completely local and memory-efficient.
 */
class AudioNoiseDetector(private val context: Context) {

    companion object {
        private const val TAG = "AudioNoiseDetector"
        private const val SAMPLE_RATE = 44100
        private const val CHANNEL_CONFIG = AudioFormat.CHANNEL_IN_MONO
        private const val AUDIO_FORMAT = AudioFormat.ENCODING_PCM_16BIT
    }

    interface Listener {
        fun onSoundLevel(level: Float, rawRms: Float, isTransientSpike: Boolean)
        fun onError(errorCode: String, message: String)
    }

    var listener: Listener? = null

    // Sensitivity factor: 0.2 to 3.0 (default for level 3 is ~0.72)
    @Volatile
    var sensitivity: Float = 0.72f

    @Volatile
    private var isRecording = false

    // Acoustic Echo Suppression: timestamp until which self-generated speaker tones are blanked
    @Volatile
    private var echoBlankUntilMs = 0L

    private var audioRecord: AudioRecord? = null
    private var workerThread: Thread? = null

    // Smoothing filter state
    private var smoothedLevel = 0f
    private var lastRawLevel = 0f

    fun notifyTonePlaying(durationMs: Long) {
        // Suppress microphone input from phone's own speaker during beep + room reverberation
        echoBlankUntilMs = System.currentTimeMillis() + durationMs + 100L
    }

    fun start(): Boolean {
        if (isRecording) return true

        // 1. Verify runtime permission
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO)
            != PackageManager.PERMISSION_GRANTED
        ) {
            listener?.onError("PERMISSION_DENIED", "دسترسی به میکروفون داده نشده است")
            return false
        }

        try {
            val minBufSize = AudioRecord.getMinBufferSize(SAMPLE_RATE, CHANNEL_CONFIG, AUDIO_FORMAT)
            if (minBufSize <= 0) {
                listener?.onError("AUDIO_INIT_FAILED", "خطا در تنظیمات بافر صوتی")
                return false
            }

            // Keep buffer small (e.g. 2048 shorts ~46ms) for lowest real-time latency
            val bufferSize = max(minBufSize, 2048)
            val record = AudioRecord(
                MediaRecorder.AudioSource.MIC,
                SAMPLE_RATE,
                CHANNEL_CONFIG,
                AUDIO_FORMAT,
                bufferSize
            )

            if (record.state != AudioRecord.STATE_INITIALIZED) {
                record.release()
                listener?.onError("AUDIO_INIT_FAILED", "سخت‌افزار میکروفون در دسترس نیست")
                return false
            }

            audioRecord = record
            record.startRecording()
            isRecording = true

            workerThread = Thread({
                processAudioLoop(bufferSize)
            }, "KitayarNoiseDetectorThread").apply {
                priority = Thread.NORM_PRIORITY + 1
                start()
            }

            return true
        } catch (e: Exception) {
            Log.e(TAG, "Error starting AudioNoiseDetector", e)
            listener?.onError("AUDIO_START_EXCEPTION", e.message ?: "خطای ناشناخته صوتی")
            stop()
            return false
        }
    }

    private fun processAudioLoop(bufferSize: Int) {
        val sampleBuffer = ShortArray(bufferSize / 2)

        while (isRecording && !Thread.currentThread().isInterrupted) {
            val record = audioRecord ?: break

            // record.read() in blocking mode naturally synchronizes with audio hardware
            val readCount = record.read(sampleBuffer, 0, sampleBuffer.size)

            if (readCount > 0) {
                val now = System.currentTimeMillis()

                // Check if self-generated alert beep is currently playing from speaker
                if (now < echoBlankUntilMs) {
                    // Smoothly decay during own beep so sound level doesn't get stuck high
                    smoothedLevel = max(0.0f, smoothedLevel * 0.88f)
                    listener?.onSoundLevel(smoothedLevel, 0.0f, false)
                    continue
                }

                // Calculate RMS (Root Mean Square)
                var sumSquares = 0.0
                for (i in 0 until readCount) {
                    val s = sampleBuffer[i].toDouble()
                    sumSquares += s * s
                }
                val rms = sqrt(sumSquares / readCount).toFloat()

                // Calculate relative decibel level
                // Range for 16-bit audio is roughly 0 to 90 dB
                val db = 20.0f * log10(max(1.0f, rms))

                // Map relative dB to 0-100 scale:
                // Ambient baseline in quiet classroom is ~32 dB
                val dbEffective = max(0.0f, db - 32.0f)
                val baseNorm = (dbEffective / 48.0f) * 100.0f
                val scaledNorm = max(0.0f, min(100.0f, baseNorm * sensitivity))

                // Asymmetric smoothing: fast attack (responds immediately to loud noise)
                // and responsive decay (falls down quickly as soon as classroom quiets down)
                val alpha = if (scaledNorm > smoothedLevel) 0.50f else 0.28f
                smoothedLevel = alpha * scaledNorm + (1.0f - alpha) * smoothedLevel

                if (smoothedLevel < 0.5f) {
                    smoothedLevel = 0.0f
                }

                // Detect transient claps or sudden loud peaks
                val isSpike = (scaledNorm - lastRawLevel) > 12.0f && scaledNorm > 40.0f
                lastRawLevel = scaledNorm

                listener?.onSoundLevel(smoothedLevel, rms, isSpike)
            }
        }
    }

    fun stop() {
        isRecording = false
        try {
            workerThread?.interrupt()
            workerThread = null
        } catch (_: Exception) {}

        try {
            audioRecord?.apply {
                if (recordingState == AudioRecord.RECORDSTATE_RECORDING) {
                    stop()
                }
                release()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping AudioRecord", e)
        } finally {
            audioRecord = null
            smoothedLevel = 0f
            lastRawLevel = 0f
            echoBlankUntilMs = 0L
        }
    }

    fun isRunning(): Boolean = isRecording
}
