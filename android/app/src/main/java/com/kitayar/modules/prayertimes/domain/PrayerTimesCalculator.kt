package com.kitayar.modules.prayertimes.domain

import com.batoulapps.adhan.CalculationMethod
import com.batoulapps.adhan.CalculationParameters
import com.batoulapps.adhan.Coordinates
import com.batoulapps.adhan.data.DateComponents
import com.batoulapps.adhan.data.TimeComponents
import com.batoulapps.adhan.internal.SolarTime
import com.kitayar.modules.prayertimes.domain.calendar.SolarCalendarHelper
import com.kitayar.modules.prayertimes.domain.model.PrayerTimesResult
import java.time.*
import java.time.format.DateTimeFormatter
import java.util.Locale

/**
 * محاسبه‌گر اوقات شرعی (PrayerTimesCalculator)
 *
 * مشخصات و قوانین پیاده‌سازی:
 * 1. کاملاً آفلاین و بدون وابستگی به اینترنت
 * 2. استفاده از کتابخانه رسمی Adhan (com.batoulapps.adhan:adhan:1.2.1)
 * 3. روش محاسبه: مؤسسه ژئوفیزیک دانشگاه تهران
 *    - از آنجا که در نسخه رسمی کتابخانه Adhan گزینه CalculationMethod.TEHRAN به صورت پیش‌فرض
 *      در enum وجود ندارد، پارامترها طبق دستورالعمل به صورت دستی تنظیم شده‌اند:
 *      * زاویه فجر (اذان صبح): 17.7 درجه
 *      * زاویه عشاء: 14.0 درجه
 *      * زاویه مغرب (اذان مغرب): 4.5 درجه زیر افق بعد از ظهر (حمره‌ی مشرقیه)
 * 4. منطقه زمانی: انحصارا "Asia/Tehran" (UTC+3:30) بدون اعمال هرگونه ساعت تابستانی (با توجه به لغو قانون DST در ایران)
 * 5. خروجی زمان‌ها در قالب HH:mm و با ارقام فارسی
 * 6. نیمه‌شب شرعی: نقطه وسط بین غروب آفتاب و اذان صبح فردای آن روز (استاندارد فقهی شیعه / ژئوفیزیک تهران)
 */
class PrayerTimesCalculator {

    companion object {
        val TEHRAN_ZONE: ZoneId = ZoneId.of("Asia/Tehran")

        // پارامترهای دستی مؤسسه ژئوفیزیک دانشگاه تهران
        const val FAJR_ANGLE = 17.7
        const val ISHA_ANGLE = 14.0
        const val MAGHRIB_ANGLE = -4.5 // 4.5 درجه زیر افق برای ناپدید شدن حمره مشرقیه
    }

    /**
     * محاسبه اوقات شرعی برای مختصات جغرافیایی و تاریخ مشخص
     *
     * @param lat عرض جغرافیایی (Latitude)
     * @param lon طول جغرافیایی (Longitude)
     * @param date تاریخ مورد نظر (پیش‌فرض امروز به وقت تهران)
     * @param currentTime زمان جاری اختیاری برای تعیین دقیق اذان بعدی (پیش‌فرض زمان کنونی سیستم در منطقه تهران)
     * @return شیء PrayerTimesResult حاوی رشته‌های زمان، تاریخ شمسی، قمری و اذان بعدی
     */
    fun calculate(
        lat: Double,
        lon: Double,
        date: LocalDate = LocalDate.now(TEHRAN_ZONE),
        currentTime: ZonedDateTime = ZonedDateTime.now(TEHRAN_ZONE)
    ): PrayerTimesResult {
        val coordinates = Coordinates(lat, lon)
        val dateComponents = DateComponents(date.year, date.monthValue, date.dayOfMonth)

        // 1. ایجاد شیء SolarTime از کتابخانه Adhan برای محاسبه زمان‌های خورشیدی
        val solarTime = SolarTime(dateComponents, coordinates)

        // اذان صبح (فجر) با زاویه 17.7 درجه
        val fajrDouble = solarTime.hourAngle(-FAJR_ANGLE, false)
        val fajrZoned = solarTimeToZonedDateTime(dateComponents, fajrDouble)

        // طلوع آفتاب
        val sunriseDouble = solarTime.sunrise
        val sunriseZoned = solarTimeToZonedDateTime(dateComponents, sunriseDouble)

        // اذان ظهر (زوال خورشید / Solar Transit)
        val dhuhrDouble = solarTime.transit
        val dhuhrZoned = solarTimeToZonedDateTime(dateComponents, dhuhrDouble)

        // غروب آفتاب (ناپدید شدن قرص خورشید در افق)
        val sunsetDouble = solarTime.sunset
        val sunsetZoned = solarTimeToZonedDateTime(dateComponents, sunsetDouble)

        // اذان مغرب بر اساس زاویه 4.5 درجه زیر افق پس از غروب آفتاب (استاندارد مؤسسه ژئوفیزیک تهران)
        val maghribDouble = solarTime.hourAngle(MAGHRIB_ANGLE, true)
        val maghribZoned = solarTimeToZonedDateTime(dateComponents, maghribDouble)

        // اذان عشاء بر اساس زاویه 14.0 درجه (استاندارد مؤسسه ژئوفیزیک تهران)
        val ishaDouble = solarTime.hourAngle(-ISHA_ANGLE, true)
        val ishaZoned = solarTimeToZonedDateTime(dateComponents, ishaDouble)

        // محاسبه اذان صبح فردا جهت تعیین دقیق «نیمه‌شب شرعی»
        val tomorrow = date.plusDays(1)
        val tomorrowComponents = DateComponents(tomorrow.year, tomorrow.monthValue, tomorrow.dayOfMonth)
        val tomorrowSolarTime = SolarTime(tomorrowComponents, coordinates)
        val nextFajrDouble = tomorrowSolarTime.hourAngle(-FAJR_ANGLE, false)
        val nextFajrZoned = solarTimeToZonedDateTime(tomorrowComponents, nextFajrDouble)

        // محاسبه نیمه‌شب شرعی (نقطه وسط بین غروب آفتاب و اذان صبح فردا)
        val sunsetMillis = sunsetZoned.toInstant().toEpochMilli()
        val ishaMillis = ishaZoned.toInstant().toEpochMilli()
        val nextFajrMillis = nextFajrZoned.toInstant().toEpochMilli()
        val midnightMillis = sunsetMillis + (nextFajrMillis - sunsetMillis) / 2
        val midnightZoned = Instant.ofEpochMilli(midnightMillis).atZone(TEHRAN_ZONE)

        // قالب‌بندی زمان‌ها به HH:mm با ارقام فارسی
        val fajrStr = formatTimePersian(fajrZoned)
        val sunriseStr = formatTimePersian(sunriseZoned)
        val dhuhrStr = formatTimePersian(dhuhrZoned)
        val sunsetStr = formatTimePersian(sunsetZoned)
        val maghribStr = formatTimePersian(maghribZoned)
        val ishaStr = formatTimePersian(ishaZoned)
        val midnightStr = formatTimePersian(midnightZoned)

        // محاسبه اذان بعدی و زمان باقیمانده
        val currentMillis = currentTime.toInstant().toEpochMilli()
        val prayers = listOf(
            PrayerItem("اذان صبح", fajrZoned.toInstant().toEpochMilli(), fajrStr),
            PrayerItem("طلوع آفتاب", sunriseZoned.toInstant().toEpochMilli(), sunriseStr),
            PrayerItem("اذان ظهر", dhuhrZoned.toInstant().toEpochMilli(), dhuhrStr),
            PrayerItem("غروب آفتاب", sunsetZoned.toInstant().toEpochMilli(), sunsetStr),
            PrayerItem("اذان مغرب", maghribZoned.toInstant().toEpochMilli(), maghribStr),
            PrayerItem("اذان عشاء", ishaMillis, ishaStr),
            PrayerItem("نیمه‌شب شرعی", midnightMillis, midnightStr)
        )

        var nextItem: PrayerItem? = null
        for (item in prayers) {
            if (item.millis > currentMillis) {
                nextItem = item
                break
            }
        }

        // اگر از تمام اوقات امروز گذشت، اذان بعدی اذان صبح فردا است
        if (nextItem == null) {
            val nextFajrStr = formatTimePersian(nextFajrZoned)
            nextItem = PrayerItem("اذان صبح", nextFajrMillis, nextFajrStr)
        }

        val remainingMillis = (nextItem.millis - currentMillis).coerceAtLeast(0L)
        val remainingFormatted = formatRemainingTime(remainingMillis)

        // تاریخ‌های شمسی و قمری
        val shamsiStr = SolarCalendarHelper.formatShamsiFull(date)
        val hijriStr = SolarCalendarHelper.formatHijri(date)
        val gregorianStr = date.format(DateTimeFormatter.ISO_LOCAL_DATE)

        return PrayerTimesResult(
            fajr = fajrStr,
            sunrise = sunriseStr,
            dhuhr = dhuhrStr,
            sunset = sunsetStr,
            maghrib = maghribStr,
            isha = ishaStr,
            midnight = midnightStr,
            fajrEpochMillis = fajrZoned.toInstant().toEpochMilli(),
            sunriseEpochMillis = sunriseZoned.toInstant().toEpochMilli(),
            dhuhrEpochMillis = dhuhrZoned.toInstant().toEpochMilli(),
            sunsetEpochMillis = sunsetMillis,
            maghribEpochMillis = maghribZoned.toInstant().toEpochMilli(),
            ishaEpochMillis = ishaMillis,
            midnightEpochMillis = midnightMillis,
            nextPrayerName = nextItem.name,
            nextPrayerTime = nextItem.timeStr,
            nextPrayerRemainingFormatted = remainingFormatted,
            shamsiDateFormatted = shamsiStr,
            hijriDateFormatted = hijriStr,
            gregorianDateFormatted = gregorianStr
        )
    }

    private data class PrayerItem(
        val name: String,
        val millis: Long,
        val timeStr: String
    )

    /**
     * تبدیل ساعت اعشاری خورشیدی به ZonedDateTime به وقت محلی تهران
     */
    private fun solarTimeToZonedDateTime(
        dateComponents: DateComponents,
        solarHours: Double
    ): ZonedDateTime {
        val components = TimeComponents.fromDouble(solarHours)
        val date = components?.dateComponents(dateComponents)
            ?: java.util.Date()
        return date.toInstant().atZone(TEHRAN_ZONE)
    }

    /**
     * قالب‌بندی زمان به صورت HH:mm با ارقام فارسی
     */
    private fun formatTimePersian(zdt: ZonedDateTime): String {
        val hour = zdt.hour
        val minute = zdt.minute
        val raw = String.format(Locale.US, "%02d:%02d", hour, minute)
        return SolarCalendarHelper.toPersianDigits(raw)
    }

    /**
     * قالب‌بندی زمان باقیمانده به زبان فارسی (مثلاً: «۲ ساعت و ۱۵ دقیقه» یا «۴۵ دقیقه»)
     */
    private fun formatRemainingTime(millis: Long): String {
        val totalMinutes = millis / (1000 * 60)
        val hours = totalMinutes / 60
        val minutes = totalMinutes % 60

        val hoursPersian = SolarCalendarHelper.toPersianDigits(hours)
        val minutesPersian = SolarCalendarHelper.toPersianDigits(minutes)

        return when {
            hours > 0 && minutes > 0 -> "$hoursPersian ساعت و $minutesPersian دقیقه"
            hours > 0 -> "$hoursPersian ساعت"
            minutes > 0 -> "$minutesPersian دقیقه"
            else -> "کمتر از ۱ دقیقه"
        }
    }
}
