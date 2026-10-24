package com.kitayar.modules.ir

/**
 * Protocol encoders and pulse duration pattern validators.
 * Separated from hardware transmission for pure unit testing and modularity.
 */
object IrProtocolEncoder {

    const val MIN_ALLOWED_FREQUENCY = 30_000
    const val MAX_ALLOWED_FREQUENCY = 60_000
    const val DEFAULT_CARRIER_FREQUENCY = 38_000
    const val MAX_PATTERN_PULSES = 4096
    const val MIN_PULSE_DURATION_US = 50
    const val MAX_PULSE_DURATION_US = 150_000

    /**
     * Validate pulse duration pattern
     */
    fun validatePattern(pattern: IntArray): Pair<Boolean, String?> {
        if (pattern.isEmpty()) {
            return Pair(false, "الگوی سیگنال مادون قرمز خالی است.")
        }
        if (pattern.size > MAX_PATTERN_PULSES) {
            return Pair(false, "تعداد پالس‌ها (${pattern.size}) بیش از حد مجاز ($MAX_PATTERN_PULSES) است.")
        }
        for (i in pattern.indices) {
            val pulse = pattern[i]
            if (pulse < MIN_PULSE_DURATION_US) {
                return Pair(false, "مدت زمان پالس در نمایه $i بسیار کوتاه است ($pulse میکروثانیه).")
            }
            if (pulse > MAX_PULSE_DURATION_US) {
                return Pair(false, "مدت زمان پالس در نمایه $i بیش از حد طولانی است ($pulse میکروثانیه).")
            }
        }
        return Pair(true, null)
    }

    /**
     * Encode standard or extended NEC protocol (38kHz)
     * Standard NEC: 8-bit Address, ~Address (8-bit), 8-bit Command, ~Command (8-bit)
     * Extended NEC: 16-bit Address (Address low, Address high), 8-bit Command, ~Command
     * Output: 67 pulses (Leader mark, Leader space, 32 bits * 2, Stop bit)
     */
    fun encodeNec(address: Int, command: Int, isExtended: Boolean = false): IntArray {
        // Leader: 9000us mark, 4500us space
        val pulses = ArrayList<Int>(67)
        pulses.add(9000)
        pulses.add(4500)

        val byte1: Int
        val byte2: Int
        if (isExtended) {
            byte1 = address and 0xFF
            byte2 = (address shr 8) and 0xFF
        } else {
            byte1 = address and 0xFF
            byte2 = (byte1 xor 0xFF) and 0xFF
        }

        val byte3 = command and 0xFF
        val byte4 = (byte3 xor 0xFF) and 0xFF

        val dataBytes = intArrayOf(byte1, byte2, byte3, byte4)

        for (b in dataBytes) {
            for (bit in 0 until 8) {
                val isOne = ((b shr bit) and 1) == 1
                pulses.add(560) // Mark
                pulses.add(if (isOne) 1690 else 560) // Space: 1690 for 1, 560 for 0
            }
        }

        // Stop bit
        pulses.add(560)

        return pulses.toIntArray()
    }

    /**
     * Encode Samsung protocol (38kHz)
     * 32 bits: 8-bit Address, 8-bit Address, 8-bit Command, ~Command
     * Output: 67 pulses
     */
    fun encodeSamsung(address: Int, command: Int): IntArray {
        // Leader: 4500us mark, 4500us space
        val pulses = ArrayList<Int>(67)
        pulses.add(4500)
        pulses.add(4500)

        val addr = address and 0xFF
        val cmd = command and 0xFF
        val invCmd = (cmd xor 0xFF) and 0xFF

        val dataBytes = intArrayOf(addr, addr, cmd, invCmd)

        for (b in dataBytes) {
            for (bit in 0 until 8) {
                val isOne = ((b shr bit) and 1) == 1
                pulses.add(560)
                pulses.add(if (isOne) 1690 else 560)
            }
        }

        // Stop bit
        pulses.add(560)

        return pulses.toIntArray()
    }

    /**
     * Encode Sony SIRC protocol (40kHz)
     * SIRC sends 7-bit command followed by 5-bit (12-bit total), 8-bit (15-bit total), or 13-bit (20-bit total) address.
     * Output: 2 + (bits * 2) pulses
     */
    fun encodeSony(command: Int, address: Int, bits: Int = 12): IntArray {
        val pulseCount = 2 + (bits * 2)
        val pulses = ArrayList<Int>(pulseCount)

        // Header: 2400us mark, 600us space
        pulses.add(2400)
        pulses.add(600)

        // 7 bits command (LSB first)
        for (bit in 0 until 7) {
            val isOne = ((command shr bit) and 1) == 1
            pulses.add(if (isOne) 1200 else 600)
            pulses.add(600)
        }

        // Remaining bits for address
        val addressBits = bits - 7
        for (bit in 0 until addressBits) {
            val isOne = ((address shr bit) and 1) == 1
            pulses.add(if (isOne) 1200 else 600)
            pulses.add(600)
        }

        return pulses.toIntArray()
    }
}
