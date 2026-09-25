package com.kitayar.audiorecorder

import android.media.MediaRecorder
import android.media.MediaPlayer
import android.os.Build
import android.util.Log
import com.facebook.react.bridge.*
import java.io.File
import java.io.IOException

class AudioRecorderModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private var recorder: MediaRecorder? = null
    private var player: MediaPlayer? = null
    private var currentFilePath: String? = null
    private var isRecording = false
    private var isPlaying = false

    override fun getName(): String {
        return "AudioRecorderModule"
    }

    @ReactMethod
    fun startRecording(promise: Promise) {
        if (isRecording) {
            promise.reject("ALREADY_RECORDING", "A recording is already in progress.")
            return
        }

        try {
            val outputDir = reactApplicationContext.cacheDir
            val outputFile = File.createTempFile("audio_record_", ".m4a", outputDir)
            currentFilePath = outputFile.absolutePath

            recorder = MediaRecorder().apply {
                setAudioSource(MediaRecorder.AudioSource.MIC)
                setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
                setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                setOutputFile(currentFilePath)
                prepare()
                start()
            }
            isRecording = true
            promise.resolve(currentFilePath)
        } catch (e: IOException) {
            Log.e("AudioRecorderModule", "prepare() failed", e)
            promise.reject("START_RECORDING_FAILED", e)
        } catch (e: Exception) {
            Log.e("AudioRecorderModule", "startRecording failed", e)
            promise.reject("START_RECORDING_FAILED", e)
        }
    }

    @ReactMethod
    fun stopRecording(promise: Promise) {
        if (!isRecording) {
            promise.reject("NOT_RECORDING", "No recording in progress.")
            return
        }

        try {
            recorder?.apply {
                stop()
                release()
            }
            recorder = null
            isRecording = false
            promise.resolve(currentFilePath)
        } catch (e: Exception) {
            Log.e("AudioRecorderModule", "stopRecording failed", e)
            promise.reject("STOP_RECORDING_FAILED", e)
        }
    }

    @ReactMethod
    fun pauseRecording(promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            try {
                recorder?.pause()
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("PAUSE_FAILED", e.message)
            }
        } else {
            promise.reject("UNSUPPORTED", "Pause requires API level 24")
        }
    }

    @ReactMethod
    fun resumeRecording(promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            try {
                recorder?.resume()
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("RESUME_FAILED", e.message)
            }
        } else {
            promise.reject("UNSUPPORTED", "Resume requires API level 24")
        }
    }

    @ReactMethod
    fun play(filePath: String, promise: Promise) {
        if (isPlaying) {
            player?.stop()
            player?.release()
            player = null
        }

        try {
            player = MediaPlayer().apply {
                setDataSource(filePath)
                prepare()
                start()
                setOnCompletionListener {
                    this@AudioRecorderModule.isPlaying = false
                }
            }
            this@AudioRecorderModule.isPlaying = true
            promise.resolve(null)
        } catch (e: Exception) {
            Log.e("AudioRecorderModule", "play failed", e)
            promise.reject("PLAY_FAILED", e)
        }
    }

    @ReactMethod
    fun stopPlaying(promise: Promise) {
        try {
            player?.apply {
                if (isPlaying) stop()
                release()
            }
            player = null
            isPlaying = false
            promise.resolve(null)
        } catch (e: Exception) {
            Log.e("AudioRecorderModule", "stopPlaying failed", e)
            promise.reject("STOP_PLAYING_FAILED", e)
        }
    }

    @ReactMethod
    fun pausePlaying(promise: Promise) {
        try {
            player?.pause()
            isPlaying = false
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("PAUSE_FAILED", e)
        }
    }

    @ReactMethod
    fun resumePlaying(promise: Promise) {
        try {
            player?.start()
            isPlaying = true
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("RESUME_FAILED", e)
        }
    }

    @ReactMethod
    fun getPlaybackPosition(promise: Promise) {
        try {
            val position = player?.currentPosition ?: 0
            promise.resolve(position)
        } catch (e: Exception) {
            promise.resolve(0)
        }
    }

    @ReactMethod
    fun getPlaybackDuration(promise: Promise) {
        try {
            val duration = player?.duration ?: 0
            promise.resolve(duration)
        } catch (e: Exception) {
            promise.resolve(0)
        }
    }
}
