package com.kitayar.modules.ir

import org.junit.Assert.*
import org.junit.Test

/**
 * Unit tests for Kotlin Infrared Protocol Encoders (NEC, Samsung, Sony SIRC)
 * and Pulse Pattern Validators.
 */
class IrProtocolEncoderTest {

    @Test
    fun testNecEncodingStructure() {
        val address = 0x04 // Standard LG address
        val command = 0x08 // Power command
        val pattern = IrProtocolEncoder.encodeNec(address, command, isExtended = false)

        // 1 leader mark + 1 leader space + 32 data bits * 2 + 1 stop mark = 67 pulses
        assertEquals(67, pattern.size)

        // Leader code
        assertEquals(9000, pattern[0]) // Leader mark
        assertEquals(4500, pattern[1]) // Leader space

        // Stop bit
        assertEquals(560, pattern[66]) // Stop mark

        // Verify marks and spaces structure for all 32 bits
        for (i in 2 until 66 step 2) {
            assertEquals("Pulse at $i should be 560us mark", 560, pattern[i])
            val space = pattern[i + 1]
            assertTrue("Pulse at ${i + 1} should be 560us (bit 0) or 1690us (bit 1), got $space",
                space == 560 || space == 1690)
        }
    }

    @Test
    fun testNecExtendedEncoding() {
        val address16 = 0x41B6 // Epson projector extended address
        val command = 0x08
        val pattern = IrProtocolEncoder.encodeNec(address16, command, isExtended = true)

        assertEquals(67, pattern.size)
        assertEquals(9000, pattern[0])
        assertEquals(4500, pattern[1])
        assertEquals(560, pattern[66])
    }

    @Test
    fun testSamsungEncodingStructure() {
        val address = 0x07 // Samsung TV address
        val command = 0x02 // Power command
        val pattern = IrProtocolEncoder.encodeSamsung(address, command)

        assertEquals(67, pattern.size)

        // Samsung leader: 4500us mark, 4500us space
        assertEquals(4500, pattern[0])
        assertEquals(4500, pattern[1])
        assertEquals(560, pattern[66]) // Stop bit
    }

    @Test
    fun testSonySircEncodingStructure() {
        // Sony SIRC 12-bit
        val command = 0x15 // Power
        val address = 0x01 // TV
        val pattern12 = IrProtocolEncoder.encodeSony(command, address, bits = 12)

        // 2 header + 12 * 2 = 26 pulses
        assertEquals(26, pattern12.size)
        assertEquals(2400, pattern12[0]) // Leader mark
        assertEquals(600, pattern12[1])  // Leader space

        // Sony SIRC 15-bit (Projector)
        val pattern15 = IrProtocolEncoder.encodeSony(command, 0x54, bits = 15)
        // 2 header + 15 * 2 = 32 pulses
        assertEquals(32, pattern15.size)
        assertEquals(2400, pattern15[0])
        assertEquals(600, pattern15[1])
    }

    @Test
    fun testPatternValidationRejectsEmptyPattern() {
        val (valid, error) = IrProtocolEncoder.validatePattern(intArrayOf())
        assertFalse(valid)
        assertNotNull(error)
    }

    @Test
    fun testPatternValidationAcceptsValidPattern() {
        val validPattern = intArrayOf(9000, 4500, 560, 560, 560, 1690, 560)
        val (valid, error) = IrProtocolEncoder.validatePattern(validPattern)
        assertTrue(valid)
        assertNull(error)
    }

    @Test
    fun testPatternValidationRejectsNegativeOrZeroPulse() {
        val invalidPattern = intArrayOf(9000, -500, 560)
        val (valid, error) = IrProtocolEncoder.validatePattern(invalidPattern)
        assertFalse(valid)
        assertNotNull(error)
    }

    @Test
    fun testPatternValidationRejectsExcessivelyLongPulses() {
        val invalidPattern = intArrayOf(9000, 200_000, 560) // > 150_000us
        val (valid, error) = IrProtocolEncoder.validatePattern(invalidPattern)
        assertFalse(valid)
        assertNotNull(error)
    }

    @Test
    fun testPatternValidationRejectsExcessivePulseCount() {
        val oversized = IntArray(4097) { 560 }
        val (valid, error) = IrProtocolEncoder.validatePattern(oversized)
        assertFalse(valid)
        assertNotNull(error)
    }
}
