package com.kitayar.modules.prayertimes.bridge

import android.content.Intent
import com.facebook.react.bridge.*
import com.kitayar.modules.prayertimes.data.repository.CityRepository
import com.kitayar.modules.prayertimes.data.repository.UserPreferencesRepository
import com.kitayar.modules.prayertimes.domain.PrayerTimesCalculator
import com.kitayar.modules.prayertimes.ui.PrayerTimesActivity

/**
 * ماژول بریج React Native برای اتصال به اوقات شرعی بومی کاتلین
 */
class PrayerTimesModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val cityRepository = CityRepository(reactContext)
    private val preferencesRepository = UserPreferencesRepository(reactContext)
    private val calculator = PrayerTimesCalculator()

    override fun getName(): String = "PrayerTimesModule"

    /**
     * باز کردن رابط کاربری بومی کاتلین اوقات شرعی
     */
    @ReactMethod
    fun open(promise: Promise) {
        try {
            val intent = Intent(reactContext, PrayerTimesActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            reactContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("OPEN_ERROR", e.message ?: "خطا در باز کردن اوقات شرعی")
        }
    }

    /**
     * محاسبه اوقات شرعی امروز بر اساس مختصات جغرافیایی به صورت آفلاین
     */
    @ReactMethod
    fun getTodayPrayerTimes(lat: Double, lon: Double, promise: Promise) {
        try {
            val result = calculator.calculate(lat, lon)
            val map = Arguments.createMap().apply {
                putString("fajr", result.fajr)
                putString("sunrise", result.sunrise)
                putString("dhuhr", result.dhuhr)
                putString("sunset", result.sunset)
                putString("maghrib", result.maghrib)
                putString("isha", result.isha)
                putString("midnight", result.midnight)
                putString("nextPrayerName", result.nextPrayerName)
                putString("nextPrayerTime", result.nextPrayerTime)
                putString("nextPrayerRemaining", result.nextPrayerRemainingFormatted)
                putString("shamsiDate", result.shamsiDateFormatted)
                putString("hijriDate", result.hijriDateFormatted)
                putString("gregorianDate", result.gregorianDateFormatted)
            }
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("CALCULATION_ERROR", e.message ?: "خطا در محاسبه اوقات شرعی")
        }
    }

    /**
     * دریافت اوقات شرعی امروز برای شهر پیش‌فرض/انتخاب‌شده کاربر
     */
    @ReactMethod
    fun getTodayPrayerTimesForSelectedCity(promise: Promise) {
        try {
            val pref = preferencesRepository.getSelectedCity()
            val result = calculator.calculate(pref.city.lat, pref.city.lon)
            val map = Arguments.createMap().apply {
                putString("province", pref.provinceName)
                putString("cityName", pref.city.name)
                putDouble("lat", pref.city.lat)
                putDouble("lon", pref.city.lon)
                putString("fajr", result.fajr)
                putString("sunrise", result.sunrise)
                putString("dhuhr", result.dhuhr)
                putString("sunset", result.sunset)
                putString("maghrib", result.maghrib)
                putString("isha", result.isha)
                putString("midnight", result.midnight)
                putString("nextPrayerName", result.nextPrayerName)
                putString("nextPrayerTime", result.nextPrayerTime)
                putString("nextPrayerRemaining", result.nextPrayerRemainingFormatted)
                putString("shamsiDate", result.shamsiDateFormatted)
                putString("hijriDate", result.hijriDateFormatted)
                putString("gregorianDate", result.gregorianDateFormatted)
            }
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("CALCULATION_ERROR", e.message ?: "خطا در محاسبه اوقات شرعی شهر پیش‌فرض")
        }
    }

    /**
     * دریافت آخرین شهر ذخیره‌شده
     */
    @ReactMethod
    fun getLastSelectedCity(promise: Promise) {
        try {
            val pref = preferencesRepository.getSelectedCity()
            val map = Arguments.createMap().apply {
                putString("province", pref.provinceName)
                putString("cityName", pref.city.name)
                putDouble("lat", pref.city.lat)
                putDouble("lon", pref.city.lon)
            }
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("PREF_ERROR", e.message ?: "خطا در دریافت آخرین شهر")
        }
    }
}
