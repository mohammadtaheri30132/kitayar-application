package com.kitayar.modules.noisemeter

import android.content.Context
import android.media.AudioManager
import android.media.ToneGenerator
import android.os.Handler
import android.os.Looper
import android.util.Log

/**
 * Manages two independent classroom noise alerts:
 * Alert 1: Moderate noise warning (short chime with cooldown)
 * Alert 2: Excessive noise alert (continuous repeating warning beep with hysteresis)
 */
class ClassroomAlertManager(private val context: Context) {

    companion object {
        private const val TAG = "ClassroomAlertManager"
        private const val MODERATE_COOLDOWN_MS = 3500L
        private const val EXCESSIVE_HYSTERESIS = 6.0f // Reset threshold is (excessiveThreshold - 6)
        private const val BEEP_PULSE_INTERVAL_MS = 280L
    }

    interface Listener {
        fun onModerateAlertTriggered()
        fun onExcessiveAlertStarted()
        fun onExcessiveAlertStopped()
    }

    var listener: Listener? = null
    var onTonePlayback: ((durationMs: Long) -> Unit)? = null

    // Thresholds (0-100)
    var moderateThreshold: Float = 50.0f
    var excessiveThreshold: Float = 75.0f

    // Alert toggles
    var isModerateAlertEnabled: Boolean = true
    var isExcessiveAlertEnabled: Boolean = true
    var isMuted: Boolean = false

    // State tracking
    private var lastModerateAlertTime = 0L
    private var isExcessiveAlertActive = false
    private var belowExcessiveCounter = 0

    private val mainHandler = Handler(Looper.getMainLooper())
    private var toneGenerator: ToneGenerator? = null

    private val continuousBeepRunnable = object : Runnable {
        override fun run() {
            if (!isExcessiveAlertActive || isMuted || !isExcessiveAlertEnabled) {
                stopExcessiveBeep()
                return
            }

            try {
                // Inform echo cancellation before blasting tone
                onTonePlayback?.invoke(150L)
                // Play short sharp warning pulse
                toneGenerator?.startTone(ToneGenerator.TONE_CDMA_ALERT_CALL_GUARD, 150)
            } catch (e: Exception) {
                Log.w(TAG, "Tone playback error", e)
            }

            mainHandler.postDelayed(this, BEEP_PULSE_INTERVAL_MS)
        }
    }

    init {
        initToneGenerator()
    }

    private fun initToneGenerator() {
        try {
            toneGenerator = ToneGenerator(AudioManager.STREAM_NOTIFICATION, 80)
        } catch (e: Exception) {
            Log.w(TAG, "Could not initialize ToneGenerator on STREAM_NOTIFICATION, falling back", e)
            try {
                toneGenerator = ToneGenerator(AudioManager.STREAM_MUSIC, 70)
            } catch (e2: Exception) {
                Log.e(TAG, "ToneGenerator init failed completely", e2)
            }
        }
    }

    /**
     * Evaluates the current normalized sound level against alert thresholds.
     * Called frequently from audio processor or animation frame.
     */
    fun evaluateLevel(level: Float) {
        val now = System.currentTimeMillis()

        // -------------------------------------------------------------
        // Alert 2: Excessive Noise (High Priority continuous warning)
        // -------------------------------------------------------------
        if (isExcessiveAlertEnabled && !isMuted) {
            if (level >= excessiveThreshold) {
                belowExcessiveCounter = 0
                if (!isExcessiveAlertActive) {
                    isExcessiveAlertActive = true
                    listener?.onExcessiveAlertStarted()
                    mainHandler.removeCallbacks(continuousBeepRunnable)
                    mainHandler.post(continuousBeepRunnable)
                }
            } else if (level < (excessiveThreshold - EXCESSIVE_HYSTERESIS)) {
                // Hysteresis counter to prevent flickering on threshold boundary
                belowExcessiveCounter++
                if (isExcessiveAlertActive && belowExcessiveCounter >= 2) {
                    stopExcessiveAlertInternal()
                }
            } else {
                belowExcessiveCounter = 0
            }
        } else if (isExcessiveAlertActive) {
            stopExcessiveAlertInternal()
        }

        // -------------------------------------------------------------
        // Alert 1: Moderate Noise (Short warning chime with cooldown)
        // -------------------------------------------------------------
        if (isModerateAlertEnabled && !isMuted && !isExcessiveAlertActive) {
            if (level >= moderateThreshold && level < excessiveThreshold) {
                if (now - lastModerateAlertTime >= MODERATE_COOLDOWN_MS) {
                    lastModerateAlertTime = now
                    playModerateTone()
                    listener?.onModerateAlertTriggered()
                }
            }
        }
    }

    private fun playModerateTone() {
        if (isMuted) return
        try {
            onTonePlayback?.invoke(200L)
            // Play a pleasant prompt beep
            toneGenerator?.startTone(ToneGenerator.TONE_PROP_BEEP, 200)
        } catch (e: Exception) {
            Log.w(TAG, "playModerateTone failed", e)
        }
    }

    private fun stopExcessiveBeep() {
        mainHandler.removeCallbacks(continuousBeepRunnable)
        try {
            toneGenerator?.stopTone()
        } catch (_: Exception) {}
    }

    private fun stopExcessiveAlertInternal() {
        isExcessiveAlertActive = false
        belowExcessiveCounter = 0
        stopExcessiveBeep()
        listener?.onExcessiveAlertStopped()
    }

    fun stopAllAlerts() {
        stopExcessiveAlertInternal()
    }

    fun release() {
        stopAllAlerts()
        try {
            toneGenerator?.release()
        } catch (_: Exception) {}
        toneGenerator = null
    }
}
