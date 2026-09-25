package com.kitayar.audiorecorder

import android.media.MediaRecorder
import android.media.MediaPlayer
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
            // Compress by using AAC format, good quality vs size ratio
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
                    release()
                    player = null
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
        if (!isPlaying) {
            promise.resolve(null)
            return
        }
        try {
            player?.apply {
                stop()
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
}
