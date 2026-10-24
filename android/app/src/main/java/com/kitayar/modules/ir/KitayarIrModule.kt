package com.kitayar.modules.ir

import android.util.Log
import com.facebook.react.bridge.*

class KitayarIrModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "KitayarIrModule"
        private const val TAG = "KitayarIrModule"
        const val HARDWARE_UNSUPPORTED_MESSAGE = "گوشی شما به فرستنده مادون قرمز مجهز نیست و نمیتواند از این قابلیت استفاده کند."
    }

    override fun getName(): String = NAME

    private val engine = IrTransmissionEngine(reactContext)

    @ReactMethod
    fun hasIrEmitter(promise: Promise) {
        try {
            val hasEmitter = engine.hasIrEmitter()
            promise.resolve(hasEmitter)
        } catch (e: Exception) {
            Log.e(TAG, "Error checking IR emitter", e)
            promise.reject("IR_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun getCarrierFrequencies(promise: Promise) {
        try {
            val ranges = engine.getCarrierFrequencies()
            val array = Arguments.createArray()
            for (range in ranges) {
                val map = Arguments.createMap()
                map.putInt("minFrequency", range.minFrequency)
                map.putInt("maxFrequency", range.maxFrequency)
                array.pushMap(map)
            }
            promise.resolve(array)
        } catch (e: Exception) {
            Log.e(TAG, "Error fetching carrier frequencies", e)
            promise.reject("IR_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun getIrCapabilities(promise: Promise) {
        try {
            val hasEmitter = engine.hasIrEmitter()
            val ranges = engine.getCarrierFrequencies()

            val freqArray = Arguments.createArray()
            for (range in ranges) {
                val map = Arguments.createMap()
                map.putInt("minFrequency", range.minFrequency)
                map.putInt("maxFrequency", range.maxFrequency)
                freqArray.pushMap(map)
            }

            val result = Arguments.createMap()
            result.putBoolean("hasEmitter", hasEmitter)
            result.putArray("carrierFrequencies", freqArray)
            if (!hasEmitter) {
                result.putString("unsupportedMessage", HARDWARE_UNSUPPORTED_MESSAGE)
            }
            promise.resolve(result)
        } catch (e: Exception) {
            Log.e(TAG, "Error fetching IR capabilities", e)
            promise.reject("IR_CAPABILITIES_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun transmitRaw(frequency: Int, patternArray: ReadableArray, promise: Promise) {
        try {
            val size = patternArray.size()
            val pattern = IntArray(size)
            for (i in 0 until size) {
                pattern[i] = patternArray.getInt(i)
            }

            engine.transmitRaw(frequency, pattern) { result ->
                val resultMap = Arguments.createMap()
                resultMap.putBoolean("success", result.success)
                if (result.success) {
                    resultMap.putInt("pulseCount", result.pulseCount)
                    promise.resolve(resultMap)
                } else {
                    resultMap.putString("errorCode", result.errorCode ?: "UNKNOWN_ERROR")
                    resultMap.putString("errorMessage", result.errorMessage ?: "خطای ناشناخته")
                    promise.resolve(resultMap)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Exception during transmitRaw", e)
            promise.reject("TRANSMIT_EXCEPTION", e.message, e)
        }
    }

    @ReactMethod
    fun transmitNec(address: Int, command: Int, isExtended: Boolean, frequency: Int, promise: Promise) {
        try {
            val pattern = engine.encodeNec(address, command, isExtended)
            val effFreq = if (frequency <= 0) 38000 else frequency

            engine.transmitRaw(effFreq, pattern) { result ->
                val resultMap = Arguments.createMap()
                resultMap.putBoolean("success", result.success)
                if (result.success) {
                    resultMap.putInt("pulseCount", result.pulseCount)
                    resultMap.putString("protocol", if (isExtended) "NEC_EXTENDED" else "NEC")
                    promise.resolve(resultMap)
                } else {
                    resultMap.putString("errorCode", result.errorCode ?: "UNKNOWN_ERROR")
                    resultMap.putString("errorMessage", result.errorMessage ?: "خطای ناشناخته")
                    promise.resolve(resultMap)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Exception during transmitNec", e)
            promise.reject("TRANSMIT_EXCEPTION", e.message, e)
        }
    }

    @ReactMethod
    fun transmitSamsung(address: Int, command: Int, promise: Promise) {
        try {
            val pattern = engine.encodeSamsung(address, command)
            engine.transmitRaw(38000, pattern) { result ->
                val resultMap = Arguments.createMap()
                resultMap.putBoolean("success", result.success)
                if (result.success) {
                    resultMap.putInt("pulseCount", result.pulseCount)
                    resultMap.putString("protocol", "SAMSUNG")
                    promise.resolve(resultMap)
                } else {
                    resultMap.putString("errorCode", result.errorCode ?: "UNKNOWN_ERROR")
                    resultMap.putString("errorMessage", result.errorMessage ?: "خطای ناشناخته")
                    promise.resolve(resultMap)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Exception during transmitSamsung", e)
            promise.reject("TRANSMIT_EXCEPTION", e.message, e)
        }
    }

    @ReactMethod
    fun transmitSony(command: Int, address: Int, bits: Int, promise: Promise) {
        try {
            val actualBits = if (bits <= 0) 12 else bits
            val pattern = engine.encodeSony(command, address, actualBits)
            engine.transmitRaw(40000, pattern) { result ->
                val resultMap = Arguments.createMap()
                resultMap.putBoolean("success", result.success)
                if (result.success) {
                    resultMap.putInt("pulseCount", result.pulseCount)
                    resultMap.putString("protocol", "SONY_$actualBits")
                    promise.resolve(resultMap)
                } else {
                    resultMap.putString("errorCode", result.errorCode ?: "UNKNOWN_ERROR")
                    resultMap.putString("errorMessage", result.errorMessage ?: "خطای ناشناخته")
                    promise.resolve(resultMap)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Exception during transmitSony", e)
            promise.reject("TRANSMIT_EXCEPTION", e.message, e)
        }
    }

    override fun invalidate() {
        super.invalidate()
        engine.destroy()
    }
}
