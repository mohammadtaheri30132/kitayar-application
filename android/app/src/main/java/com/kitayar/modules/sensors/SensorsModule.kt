package com.kitayar.modules.sensors

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.os.Build
import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import kotlin.math.abs
import kotlin.math.log10
import kotlin.math.sqrt

class SensorsModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), SensorEventListener {

    companion object {
        const val NAME = "KitayarSensorsModule"
        private const val TAG = "KitayarSensorsModule"
    }

    override fun getName(): String = NAME

    private var sensorManager: SensorManager? = null

    // Sensors
    private var rotationVectorSensor: Sensor? = null
    private var accelerometerSensor: Sensor? = null
    private var magneticSensor: Sensor? = null
    private var lightSensor: Sensor? = null
    private var linearAccSensor: Sensor? = null

    // State flags
    private var isCompassActive = false
    private var isLightActive = false
    private var isSeismoActive = false

    // Compass calculation matrices
    private val rotationMatrix = FloatArray(9)
    private val orientationAngles = FloatArray(3)
    private val gravityValues = FloatArray(3)
    private val magneticValues = FloatArray(3)
    private var hasGravity = false
    private var hasMagnetic = false
    private var lastCompassEmitTime = 0L

    // Seismograph calculation
    private var lastSeismoEmitTime = 0L
    private var seismoPeak = 0.0

    // Sound / Decibel recording thread
    private var audioRecord: AudioRecord? = null
    private var isSoundMeterActive = false
    private var soundThread: Thread? = null
    private var soundMinDb = 120.0
    private var soundMaxDb = 0.0
    private var soundSumDb = 0.0
    private var soundSampleCount = 0L

    init {
        sensorManager = reactContext.getSystemService(Context.SENSOR_SERVICE) as? SensorManager
        sensorManager?.let { sm ->
            rotationVectorSensor = sm.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR)
            accelerometerSensor = sm.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
            magneticSensor = sm.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD)
            lightSensor = sm.getDefaultSensor(Sensor.TYPE_LIGHT)
            linearAccSensor = sm.getDefaultSensor(Sensor.TYPE_LINEAR_ACCELERATION) ?: accelerometerSensor
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

    // ==========================================
    // 🧭 COMPASS / ORIENTATION (قطب‌نما و شیب‌سنج)
    // ==========================================

    @ReactMethod
    fun startCompass(promise: Promise) {
        val sm = sensorManager ?: run {
            promise.reject("NO_SENSOR_MANAGER", "SensorManager unavailable")
            return
        }

        hasGravity = false
        hasMagnetic = false
        isCompassActive = true

        if (rotationVectorSensor != null) {
            sm.registerListener(this, rotationVectorSensor, SensorManager.SENSOR_DELAY_UI)
        } else {
            sm.registerListener(this, accelerometerSensor, SensorManager.SENSOR_DELAY_UI)
            sm.registerListener(this, magneticSensor, SensorManager.SENSOR_DELAY_UI)
        }

        promise.resolve(true)
    }

    @ReactMethod
    fun stopCompass(promise: Promise) {
        isCompassActive = false
        sensorManager?.let { sm ->
            if (rotationVectorSensor != null) {
                sm.unregisterListener(this, rotationVectorSensor)
            }
            if (accelerometerSensor != null && !isSeismoActive) {
                sm.unregisterListener(this, accelerometerSensor)
            }
            if (magneticSensor != null) {
                sm.unregisterListener(this, magneticSensor)
            }
        }
        promise.resolve(true)
    }

    // ==========================================
    // 💡 LIGHT SENSOR (نورسنج)
    // ==========================================

    @ReactMethod
    fun isLightSensorAvailable(promise: Promise) {
        promise.resolve(lightSensor != null)
    }

    @ReactMethod
    fun startLightSensor(promise: Promise) {
        val sm = sensorManager ?: run {
            promise.reject("NO_SENSOR_MANAGER", "SensorManager unavailable")
            return
        }
        val sensor = lightSensor ?: run {
            promise.reject("NO_LIGHT_SENSOR", "Device does not have a light sensor")
            return
        }

        isLightActive = true
        sm.registerListener(this, sensor, SensorManager.SENSOR_DELAY_UI)
        promise.resolve(true)
    }

    @ReactMethod
    fun stopLightSensor(promise: Promise) {
        isLightActive = false
        lightSensor?.let { sensorManager?.unregisterListener(this, it) }
        promise.resolve(true)
    }

    // ==========================================
    // 📈 SEISMOGRAPH / VIBRATION (لرزه‌نگار)
    // ==========================================

    @ReactMethod
    fun startSeismograph(promise: Promise) {
        val sm = sensorManager ?: run {
            promise.reject("NO_SENSOR_MANAGER", "SensorManager unavailable")
            return
        }
        val sensor = linearAccSensor ?: accelerometerSensor ?: run {
            promise.reject("NO_ACCEL_SENSOR", "No accelerometer sensor found")
            return
        }

        isSeismoActive = true
        seismoPeak = 0.0
        sm.registerListener(this, sensor, SensorManager.SENSOR_DELAY_GAME)
        promise.resolve(true)
    }

    @ReactMethod
    fun stopSeismograph(promise: Promise) {
        isSeismoActive = false
        linearAccSensor?.let { sensorManager?.unregisterListener(this, it) }
        if (!isCompassActive) {
            accelerometerSensor?.let { sensorManager?.unregisterListener(this, it) }
        }
        promise.resolve(true)
    }

    // ==========================================
    // 🎙️ SOUND / DECIBEL METER (صداسنج)
    // ==========================================

    @ReactMethod
    fun startSoundMeter(intervalMs: Int, promise: Promise) {
        if (isSoundMeterActive) {
            promise.resolve(true)
            return
        }

        try {
            val sampleRate = 44100
            val channelConfig = AudioFormat.CHANNEL_IN_MONO
            val audioFormat = AudioFormat.ENCODING_PCM_16BIT
            val minBufSize = AudioRecord.getMinBufferSize(sampleRate, channelConfig, audioFormat)
            val bufferSize = (minBufSize * 2).coerceAtLeast(2048)

            audioRecord = AudioRecord(
                MediaRecorder.AudioSource.MIC,
                sampleRate,
                channelConfig,
                audioFormat,
                bufferSize
            )

            if (audioRecord?.state != AudioRecord.STATE_INITIALIZED) {
                promise.reject("RECORD_INIT_FAILED", "Failed to initialize AudioRecord")
                return
            }

            audioRecord?.startRecording()
            isSoundMeterActive = true
            soundMinDb = 120.0
            soundMaxDb = 0.0
            soundSumDb = 0.0
            soundSampleCount = 0L

            val delayTime = intervalMs.coerceIn(50, 500).toLong()

            soundThread = Thread {
                val buffer = ShortArray(bufferSize)
                while (isSoundMeterActive) {
                    val readCount = audioRecord?.read(buffer, 0, buffer.size) ?: 0
                    if (readCount > 0) {
                        var sumSquare = 0.0
                        var maxAmp = 0
                        for (i in 0 until readCount) {
                            val sample = buffer[i].toInt()
                            sumSquare += sample * sample
                            val absSample = abs(sample)
                            if (absSample > maxAmp) maxAmp = absSample
                        }

                        val rms = sqrt(sumSquare / readCount)
                        // Standard sound pressure decibel formula relative to 1.0 (ref: 1)
                        val db = if (rms > 1.0) {
                            (20.0 * log10(rms)).coerceIn(10.0, 110.0)
                        } else {
                            10.0
                        }

                        if (db < soundMinDb) soundMinDb = db
                        if (db > soundMaxDb) soundMaxDb = db
                        soundSumDb += db
                        soundSampleCount++
                        val avgDb = soundSumDb / soundSampleCount

                        val map = Arguments.createMap().apply {
                            putDouble("db", Math.round(db * 10.0) / 10.0)
                            putDouble("min", Math.round(soundMinDb * 10.0) / 10.0)
                            putDouble("max", Math.round(soundMaxDb * 10.0) / 10.0)
                            putDouble("avg", Math.round(avgDb * 10.0) / 10.0)
                            putInt("amplitude", maxAmp)
                        }
                        sendEvent("onSoundMeterUpdate", map)
                    }

                    try {
                        Thread.sleep(delayTime)
                    } catch (e: InterruptedException) {
                        break
                    }
                }
            }.apply { start() }

            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "startSoundMeter error", e)
            promise.reject("SOUND_METER_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun stopSoundMeter(promise: Promise) {
        isSoundMeterActive = false
        try {
            soundThread?.interrupt()
            soundThread = null
            audioRecord?.apply {
                if (recordingState == AudioRecord.RECORDSTATE_RECORDING) {
                    stop()
                }
                release()
            }
            audioRecord = null
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("STOP_ERROR", e.message, e)
        }
    }

    // ==========================================
    // 📡 SENSOR EVENT LISTENER CALLBACKS
    // ==========================================

    override fun onSensorChanged(event: SensorEvent) {
        val now = System.currentTimeMillis()

        when (event.sensor.type) {
            Sensor.TYPE_ROTATION_VECTOR -> {
                if (isCompassActive && now - lastCompassEmitTime >= 35) {
                    lastCompassEmitTime = now
                    SensorManager.getRotationMatrixFromVector(rotationMatrix, event.values)
                    SensorManager.getOrientation(rotationMatrix, orientationAngles)

                    var azimuthRad = orientationAngles[0]
                    var azimuthDeg = Math.toDegrees(azimuthRad.toDouble())
                    if (azimuthDeg < 0) azimuthDeg += 360.0

                    val pitchDeg = Math.toDegrees(orientationAngles[1].toDouble())
                    val rollDeg = Math.toDegrees(orientationAngles[2].toDouble())

                    val map = Arguments.createMap().apply {
                        putDouble("heading", Math.round(azimuthDeg * 10.0) / 10.0)
                        putDouble("pitch", Math.round(pitchDeg * 10.0) / 10.0)
                        putDouble("roll", Math.round(rollDeg * 10.0) / 10.0)
                    }
                    sendEvent("onCompassUpdate", map)
                }
            }

            Sensor.TYPE_ACCELEROMETER -> {
                if (isCompassActive && rotationVectorSensor == null) {
                    System.arraycopy(event.values, 0, gravityValues, 0, 3)
                    hasGravity = true
                    processCompassFallback(now)
                }
                if (isSeismoActive && linearAccSensor == accelerometerSensor) {
                    processSeismicEvent(event.values, now, true)
                }
            }

            Sensor.TYPE_MAGNETIC_FIELD -> {
                if (isCompassActive && rotationVectorSensor == null) {
                    System.arraycopy(event.values, 0, magneticValues, 0, 3)
                    hasMagnetic = true
                    processCompassFallback(now)
                }
            }

            Sensor.TYPE_LIGHT -> {
                if (isLightActive) {
                    val lux = event.values[0]
                    val map = Arguments.createMap().apply {
                        putDouble("lux", Math.round(lux * 10.0) / 10.0)
                    }
                    sendEvent("onLightUpdate", map)
                }
            }

            Sensor.TYPE_LINEAR_ACCELERATION -> {
                if (isSeismoActive) {
                    processSeismicEvent(event.values, now, false)
                }
            }
        }
    }

    private fun processCompassFallback(now: Long) {
        if (hasGravity && hasMagnetic && now - lastCompassEmitTime >= 40) {
            lastCompassEmitTime = now
            if (SensorManager.getRotationMatrix(rotationMatrix, null, gravityValues, magneticValues)) {
                SensorManager.getOrientation(rotationMatrix, orientationAngles)
                var azimuthDeg = Math.toDegrees(orientationAngles[0].toDouble())
                if (azimuthDeg < 0) azimuthDeg += 360.0

                val pitchDeg = Math.toDegrees(orientationAngles[1].toDouble())
                val rollDeg = Math.toDegrees(orientationAngles[2].toDouble())

                val map = Arguments.createMap().apply {
                    putDouble("heading", Math.round(azimuthDeg * 10.0) / 10.0)
                    putDouble("pitch", Math.round(pitchDeg * 10.0) / 10.0)
                    putDouble("roll", Math.round(rollDeg * 10.0) / 10.0)
                }
                sendEvent("onCompassUpdate", map)
            }
        }
    }

    private fun processSeismicEvent(values: FloatArray, now: Long, subtractGravity: Boolean) {
        if (now - lastSeismoEmitTime < 35) return
        lastSeismoEmitTime = now

        val x = values[0].toDouble()
        val y = values[1].toDouble()
        val z = if (subtractGravity) values[2].toDouble() - 9.80665 else values[2].toDouble()

        val magnitude = sqrt(x * x + y * y + z * z)
        if (magnitude > seismoPeak) {
            seismoPeak = magnitude
        }

        val map = Arguments.createMap().apply {
            putDouble("x", Math.round(x * 100.0) / 100.0)
            putDouble("y", Math.round(y * 100.0) / 100.0)
            putDouble("z", Math.round(z * 100.0) / 100.0)
            putDouble("magnitude", Math.round(magnitude * 100.0) / 100.0)
            putDouble("peak", Math.round(seismoPeak * 100.0) / 100.0)
            putDouble("timestamp", now.toDouble())
        }
        sendEvent("onSeismicUpdate", map)
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}

    @Suppress("DEPRECATION")
    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        isCompassActive = false
        isLightActive = false
        isSeismoActive = false
        isSoundMeterActive = false
        sensorManager?.unregisterListener(this)
        soundThread?.interrupt()
        try {
            audioRecord?.release()
        } catch (_: Exception) {}
    }
}
