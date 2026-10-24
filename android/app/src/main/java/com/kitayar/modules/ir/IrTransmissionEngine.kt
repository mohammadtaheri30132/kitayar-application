package com.kitayar.modules.ir

import android.content.Context
import android.hardware.ConsumerIrManager
import android.os.Build
import android.util.Log
import java.util.concurrent.Executors
import java.util.concurrent.Future

/**
 * Native Android IR Transmission Engine using ConsumerIrManager.
 * Handles validation, protocol encoding (NEC, Samsung, Sony SIRC, Raw),
 * and thread-safe background pulse transmission.
 */
class IrTransmissionEngine(private val context: Context) {

    companion object {
        private const val TAG = "KitayarIrEngine"
        private const val MIN_ALLOWED_FREQUENCY = 30_000
        private const val MAX_ALLOWED_FREQUENCY = 60_000
        private const val DEFAULT_CARRIER_FREQUENCY = 38_000
        private const val MAX_PATTERN_PULSES = 4096
        private const val MIN_PULSE_DURATION_US = 50
        private const val MAX_PULSE_DURATION_US = 150_000
    }

    private val irManager: ConsumerIrManager? by lazy {
        try {
            context.getSystemService(Context.CONSUMER_IR_SERVICE) as? ConsumerIrManager
        } catch (e: Exception) {
            Log.e(TAG, "Error obtaining ConsumerIrManager service", e)
            null
        }
    }

    private val executor = Executors.newSingleThreadExecutor()

    data class CarrierRange(val minFrequency: Int, val maxFrequency: Int)

    data class TransmitResult(
        val success: Boolean,
        val errorCode: String? = null,
        val errorMessage: String? = null,
        val pulseCount: Int = 0
    )

    /**
     * Check whether device physically has an infrared emitter
     */
    fun hasIrEmitter(): Boolean {
        val manager = irManager ?: return false
        return try {
            manager.hasIrEmitter()
        } catch (e: Exception) {
            Log.e(TAG, "Error checking hasIrEmitter()", e)
            false
        }
    }

    /**
     * Query supported carrier frequency ranges
     */
    fun getCarrierFrequencies(): List<CarrierRange> {
        val manager = irManager ?: return emptyList()
        return try {
            val ranges = manager.carrierFrequencies ?: return emptyList()
            ranges.map { CarrierRange(it.minFrequency, it.maxFrequency) }
        } catch (e: Exception) {
            Log.e(TAG, "Error reading carrier frequencies", e)
            emptyList()
        }
    }

    /**
     * Validate whether frequency is supported by hardware or falls within standard range
     */
    private fun validateFrequency(frequency: Int): Pair<Boolean, String?> {
        if (frequency < MIN_ALLOWED_FREQUENCY || frequency > MAX_ALLOWED_FREQUENCY) {
            return Pair(false, "فرکانس $frequency هرتز خارج از محدوده مجاز (30-60 کیلوهرتز) است.")
        }
        val supportedRanges = getCarrierFrequencies()
        if (supportedRanges.isNotEmpty()) {
            val isSupported = supportedRanges.any { frequency in it.minFrequency..it.maxFrequency }
            if (!isSupported) {
                // Warning only if hardware provides ranges, but still allow if emitter exists
                Log.w(TAG, "Frequency $frequency Hz is outside hardware reported ranges: $supportedRanges")
            }
        }
        return Pair(true, null)
    }


    /**
     * Transmit raw pulse timing pattern asynchronously
     */
    fun transmitRaw(
        frequency: Int,
        pattern: IntArray,
        callback: (TransmitResult) -> Unit
    ) {
        val manager = irManager
        if (manager == null || !hasIrEmitter()) {
            callback(
                TransmitResult(
                    success = false,
                    errorCode = "HARDWARE_NOT_SUPPORTED",
                    errorMessage = "گوشی شما به فرستنده مادون قرمز مجهز نیست و نمیتواند از این قابلیت استفاده کند."
                )
            )
            return
        }

        val effectiveFreq = if (frequency <= 0) DEFAULT_CARRIER_FREQUENCY else frequency
        val freqValidation = validateFrequency(effectiveFreq)
        if (!freqValidation.first) {
            callback(
                TransmitResult(
                    success = false,
                    errorCode = "INVALID_FREQUENCY",
                    errorMessage = freqValidation.second
                )
            )
            return
        }

        val patternValidation = IrProtocolEncoder.validatePattern(pattern)
        if (!patternValidation.first) {
            callback(
                TransmitResult(
                    success = false,
                    errorCode = "INVALID_PATTERN",
                    errorMessage = patternValidation.second
                )
            )
            return
        }

        executor.execute {
            try {
                manager.transmit(effectiveFreq, pattern)
                Log.d(TAG, "Successfully transmitted ${pattern.size} pulses at $effectiveFreq Hz")
                callback(
                    TransmitResult(
                        success = true,
                        pulseCount = pattern.size
                    )
                )
            } catch (e: Exception) {
                Log.e(TAG, "Transmission failed via ConsumerIrManager", e)
                callback(
                    TransmitResult(
                        success = false,
                        errorCode = "TRANSMIT_FAILED",
                        errorMessage = "خطا در ارسال امواج مادون قرمز: ${e.message}"
                    )
                )
            }
        }
    }

    // ==========================================
    // PROTOCOL ENCODER DELEGATES
    // ==========================================

    fun validatePattern(pattern: IntArray): Pair<Boolean, String?> =
        IrProtocolEncoder.validatePattern(pattern)

    fun encodeNec(address: Int, command: Int, isExtended: Boolean = false): IntArray =
        IrProtocolEncoder.encodeNec(address, command, isExtended)

    fun encodeSamsung(address: Int, command: Int): IntArray =
        IrProtocolEncoder.encodeSamsung(address, command)

    fun encodeSony(command: Int, address: Int, bits: Int = 12): IntArray =
        IrProtocolEncoder.encodeSony(command, address, bits)

    /**
     * Clean up executor
     */
    fun destroy() {
        try {
            executor.shutdown()
        } catch (e: Exception) {
            Log.e(TAG, "Error shutting down executor", e)
        }
    }
}
