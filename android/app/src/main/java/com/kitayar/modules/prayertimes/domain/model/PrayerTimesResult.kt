package com.kitayar.modules.prayertimes.domain.model

/**
 * نتیجه محاسبات اوقات شرعی برای یک شهر و تاریخ مشخص
 *
 * تمام رشته‌های زمانی با قالب HH:mm و اعداد فارسی هستند.
 */
data class PrayerTimesResult(
    val fajr: String,                 // اذان صبح (فجر)
    val sunrise: String,              // طلوع آفتاب
    val dhuhr: String,                // اذان ظهر
    val sunset: String,               // غروب آفتاب
    val maghrib: String,              // اذان مغرب
    val isha: String,                 // اذان عشاء
    val midnight: String,             // نیمه‌شب شرعی
    
    // مقادیر خام بر حسب میلی‌ثانیه برای مقایسه، تست، و محاسبه اذان بعدی
    val fajrEpochMillis: Long,
    val sunriseEpochMillis: Long,
    val dhuhrEpochMillis: Long,
    val sunsetEpochMillis: Long,
    val maghribEpochMillis: Long,
    val ishaEpochMillis: Long,
    val midnightEpochMillis: Long,

    // اطلاعات مربوط به اذان بعدی و زمان باقیمانده
    val nextPrayerName: String,
    val nextPrayerTime: String,
    val nextPrayerRemainingFormatted: String,

    // تاریخ‌های شمسی، قمری و میلادی
    val shamsiDateFormatted: String,  // مثلاً: «پنج‌شنبه، ۲۴ مهر ۱۴۰۵»
    val hijriDateFormatted: String,   // مثلاً: «۲ ربیع‌الثانی ۱۴۴۸»
    val gregorianDateFormatted: String // مثلاً: «2026-10-15»
)
