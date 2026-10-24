package com.kitayar.modules.prayertimes

import com.kitayar.modules.prayertimes.domain.PrayerTimesCalculator
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.time.LocalDate

/**
 * تست واحد برای اعتبارسنجی محاسبات اوقات شرعی در افق تهران
 *
 * هدف:
 * 1. بررسی درستی ترتیب زمان‌های شرعی: فجر < طلوع < ظهر < غروب < مغرب < نیمه‌شب
 * 2. بررسی قالب‌بندی زمان‌ها به فرمت HH:mm با ارقام فارسی
 * 3. تست در فصول مختلف سال (بهار، تابستان، پاییز، زمستان)
 */
class PrayerTimesCalculatorTest {

    private val calculator = PrayerTimesCalculator()

    // مختصات دقیق تهران
    private val tehranLat = 35.6892
    private val tehranLon = 51.3890

    @Test
    fun testTehranPrayerTimesOrderOnFixedDate() {
        // تاریخ مشخص در پاییز
        val testDate = LocalDate.of(2026, 10, 15)

        val result = calculator.calculate(tehranLat, tehranLon, testDate)

        println("=== اوقات شرعی تهران در تاریخ $testDate ===")
        println("اذان صبح (فجر): ${result.fajr}")
        println("طلوع آفتاب: ${result.sunrise}")
        println("اذان ظهر: ${result.dhuhr}")
        println("غروب آفتاب: ${result.sunset}")
        println("اذان مغرب: ${result.maghrib}")
        println("اذان عشاء: ${result.isha}")
        println("نیمه‌شب شرعی: ${result.midnight}")
        println("اذان بعدی: ${result.nextPrayerName} (${result.nextPrayerTime})")
        println("تاریخ شمسی: ${result.shamsiDateFormatted}")
        println("تاریخ قمری: ${result.hijriDateFormatted}")
        println("==========================================")

        // بررسی شرط الزامی: فجر < طلوع < ظهر < غروب < مغرب < عشاء < نیمه‌شب
        assertTrue(
            "فجر باید قبل از طلوع آفتاب باشد: ${result.fajr} < ${result.sunrise}",
            result.fajrEpochMillis < result.sunriseEpochMillis
        )
        assertTrue(
            "طلوع آفتاب باید قبل از اذان ظهر باشد: ${result.sunrise} < ${result.dhuhr}",
            result.sunriseEpochMillis < result.dhuhrEpochMillis
        )
        assertTrue(
            "اذان ظهر باید قبل از غروب آفتاب باشد: ${result.dhuhr} < ${result.sunset}",
            result.dhuhrEpochMillis < result.sunsetEpochMillis
        )
        assertTrue(
            "غروب آفتاب باید قبل از اذان مغرب باشد (زاویه 4.5 درجه پس از غروب): ${result.sunset} < ${result.maghrib}",
            result.sunsetEpochMillis < result.maghribEpochMillis
        )
        assertTrue(
            "اذان مغرب باید قبل از اذان عشاء باشد: ${result.maghrib} < ${result.isha}",
            result.maghribEpochMillis < result.ishaEpochMillis
        )
        assertTrue(
            "اذان عشاء باید قبل از نیمه‌شب شرعی باشد: ${result.isha} < ${result.midnight}",
            result.ishaEpochMillis < result.midnightEpochMillis
        )

        // بررسی اینکه رشته‌ها خالی نیستند و طول مناسب دارند (۵ کاراکتر به فرمت ۰۰:۰۰)
        assertEquals(5, result.fajr.length)
        assertEquals(5, result.sunrise.length)
        assertEquals(5, result.dhuhr.length)
        assertEquals(5, result.sunset.length)
        assertEquals(5, result.maghrib.length)
        assertEquals(5, result.isha.length)
        assertEquals(5, result.midnight.length)

        assertNotNull(result.shamsiDateFormatted)
        assertTrue(result.shamsiDateFormatted.isNotEmpty())
    }

    @Test
    fun testPrayerTimesOrderAcrossDifferentSeasons() {
        val sampleDates = listOf(
            LocalDate.of(2026, 1, 15),  // زمستان
            LocalDate.of(2026, 4, 15),  // بهار
            LocalDate.of(2026, 7, 15),  // تابستان
            LocalDate.of(2026, 10, 15)  // پاییز
        )

        for (date in sampleDates) {
            val res = calculator.calculate(tehranLat, tehranLon, date)

            assertTrue(
                "در تاریخ $date، فجر باید قبل از طلوع باشد",
                res.fajrEpochMillis < res.sunriseEpochMillis
            )
            assertTrue(
                "در تاریخ $date، طلوع باید قبل از ظهر باشد",
                res.sunriseEpochMillis < res.dhuhrEpochMillis
            )
            assertTrue(
                "در تاریخ $date، ظهر باید قبل از غروب باشد",
                res.dhuhrEpochMillis < res.sunsetEpochMillis
            )
            assertTrue(
                "در تاریخ $date، غروب باید قبل از مغرب باشد",
                res.sunsetEpochMillis < res.maghribEpochMillis
            )
            assertTrue(
                "در تاریخ $date، مغرب باید قبل از نیمه‌شب باشد",
                res.maghribEpochMillis < res.midnightEpochMillis
            )
        }
    }
}
