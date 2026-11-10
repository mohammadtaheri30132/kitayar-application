package com.kitayar.modules.noisemeter

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.media.AudioManager
import android.media.ToneGenerator
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*

/**
 * Native Module providing auxiliary controls for Classroom Noise Meter:
 * permission validation and audio testing.
 */
class ClassroomNoiseMeterModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "ClassroomNoiseMeterModule"
    }

    override fun getName(): String = NAME

    private var toneGenerator: ToneGenerator? = null

    init {
        try {
            toneGenerator = ToneGenerator(AudioManager.STREAM_NOTIFICATION, 80)
        } catch (_: Exception) {}
    }

    @ReactMethod
    fun checkPermission(promise: Promise) {
        val granted = ContextCompat.checkSelfPermission(
            reactContext,
            Manifest.permission.RECORD_AUDIO
        ) == PackageManager.PERMISSION_GRANTED
        promise.resolve(granted)
    }

    @ReactMethod
    fun testAlertSound(type: String, promise: Promise) {
        try {
            if (toneGenerator == null) {
                toneGenerator = ToneGenerator(AudioManager.STREAM_NOTIFICATION, 80)
            }
            if (type == "excessive") {
                toneGenerator?.startTone(ToneGenerator.TONE_CDMA_ALERT_CALL_GUARD, 400)
            } else {
                toneGenerator?.startTone(ToneGenerator.TONE_PROP_BEEP, 200)
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("TEST_SOUND_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun stopSounds(promise: Promise) {
        try {
            toneGenerator?.stopTone()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("STOP_ERROR", e.message, e)
        }
    }

    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        try {
            toneGenerator?.release()
        } catch (_: Exception) {}
        toneGenerator = null
    }
}
