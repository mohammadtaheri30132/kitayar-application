package com.kitayar.modules.prayertimes.domain.calendar

import java.time.DayOfWeek
import java.time.LocalDate
import java.time.chrono.HijrahDate
import java.time.temporal.ChronoField

/**
 * تبدیل و قالب‌بندی تاریخ‌های شمسی و قمری با استاندارد رسمی ایران (100% آفلاین)
 */
object SolarCalendarHelper {

    val PERSIAN_MONTHS = arrayOf(
        "فروردین", "اردیبهشت", "خرداد",
        "تیر", "مرداد", "شهریور",
        "مهر", "آبان", "آذر",
        "دی", "بهمن", "اسفند"
    )

    val HIJRI_MONTHS = arrayOf(
        "محرم", "صفر", "ربیع‌الاول", "ربیع‌الثانی",
        "جمادی‌الاول", "جمادی‌الثانی", "رجب", "شعبان",
        "رمضان", "شوال", "ذی‌القعده", "ذی‌الحجه"
    )

    data class JalaliDate(
        val year: Int,
        val month: Int,
        val day: Int
    )

    /**
     * تبدیل ارقام لاتین (0-9) به فارسی (۰-۹)
     */
    fun toPersianDigits(input: Any?): String {
        if (input == null) return ""
        val s = input.toString()
        val builder = java.lang.StringBuilder(s.length)
        for (ch in s) {
            if (ch in '0'..'9') {
                builder.append((ch.code + 1728).toChar())
            } else {
                builder.append(ch)
            }
        }
        return builder.toString()
    }

    /**
     * تبدیل تاریخ میلادی (LocalDate) به شمسی (JalaliDate)
     * الگوریتم استاندارد نجومی گاهشماری جلالی
     */
    fun gregorianToJalali(date: LocalDate): JalaliDate {
        return gregorianToJalali(date.year, date.monthValue, date.dayOfMonth)
    }

    fun gregorianToJalali(gy: Int, gm: Int, gd: Int): JalaliDate {
        val gDm = intArrayOf(0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334)
        val gy2 = if (gm > 2) (gy + 1) else gy
        var days = 355666 + (365 * gy) + ((gy2 + 3) / 4) - ((gy2 + 99) / 100) + ((gy2 + 399) / 400) + gd + gDm[gm - 1]
        var jy = -1595 + (33 * (days / 12053))
        days %= 12053
        jy += 4 * (days / 1461)
        days %= 1461
        if (days > 365) {
            jy += ((days - 1) / 365)
            days = (days - 1) % 365
        }
        val jm: Int
        val jd: Int
        if (days < 186) {
            jm = 1 + (days / 31)
            jd = 1 + (days % 31)
        } else {
            val rem = days - 186
            jm = 7 + (rem / 30)
            jd = 1 + (rem % 30)
        }
        return JalaliDate(jy, jm, jd)
    }

    /**
     * دریافت نام روز هفته به فارسی
     */
    fun getPersianDayOfWeek(dayOfWeek: DayOfWeek): String {
        return when (dayOfWeek) {
            DayOfWeek.SATURDAY -> "شنبه"
            DayOfWeek.SUNDAY -> "یک‌شنبه"
            DayOfWeek.MONDAY -> "دوشنبه"
            DayOfWeek.TUESDAY -> "سه‌شنبه"
            DayOfWeek.WEDNESDAY -> "چهارشنبه"
            DayOfWeek.THURSDAY -> "پنج‌شنبه"
            DayOfWeek.FRIDAY -> "جمعه"
        }
    }

    /**
     * فرمت کامل تاریخ شمسی برای نمایش در بالای صفحه (مثلاً: «پنج‌شنبه، ۲۴ مهر ۱۴۰۵»)
     */
    fun formatShamsiFull(date: LocalDate): String {
        val weekday = getPersianDayOfWeek(date.dayOfWeek)
        val j = gregorianToJalali(date)
        val monthName = PERSIAN_MONTHS.getOrElse(j.month - 1) { "" }
        val dayStr = toPersianDigits(j.day)
        val yearStr = toPersianDigits(j.year)
        return "$weekday، $dayStr $monthName $yearStr"
    }

    /**
     * فرمت تاریخ قمری بر اساس تقویم استاندارد ام‌القری (HijrahDate از java.time)
     */
    fun formatHijri(date: LocalDate): String {
        return try {
            val hijrah = HijrahDate.from(date)
            val day = hijrah.get(ChronoField.DAY_OF_MONTH)
            val month = hijrah.get(ChronoField.MONTH_OF_YEAR)
            val year = hijrah.get(ChronoField.YEAR)
            val monthName = HIJRI_MONTHS.getOrElse(month - 1) { "" }
            "${toPersianDigits(day)} $monthName ${toPersianDigits(year)}"
        } catch (e: Exception) {
            ""
        }
    }
}
