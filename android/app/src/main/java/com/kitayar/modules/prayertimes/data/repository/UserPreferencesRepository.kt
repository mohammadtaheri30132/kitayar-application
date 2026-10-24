package com.kitayar.modules.prayertimes.data.repository

import android.content.Context
import android.content.SharedPreferences
import com.kitayar.modules.prayertimes.data.model.City

/**
 * مدیریت ذخیره‌سازی آخرین شهر و استان انتخاب‌شده توسط کاربر با SharedPreferences
 */
class UserPreferencesRepository(context: Context) {

    private val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    companion object {
        private const val PREFS_NAME = "kitayar_prayer_times_prefs"
        private const val KEY_PROVINCE_NAME = "last_selected_province"
        private const val KEY_CITY_NAME = "last_selected_city"
        private const val KEY_LATITUDE = "last_selected_lat"
        private const val KEY_LONGITUDE = "last_selected_lon"
        private const val KEY_ELEVATION = "last_selected_elevation"

        // شهر پیش‌فرض در صورت نبود انتخاب قبلی: تهران
        const val DEFAULT_PROVINCE = "تهران"
        const val DEFAULT_CITY = "تهران"
        const val DEFAULT_LAT = 35.6892
        const val DEFAULT_LON = 51.3890
    }

    data class SelectedCityPreference(
        val provinceName: String,
        val city: City
    )

    /**
     * ذخیره شهر و استان انتخاب‌شده
     */
    fun saveSelectedCity(provinceName: String, city: City) {
        prefs.edit()
            .putString(KEY_PROVINCE_NAME, provinceName)
            .putString(KEY_CITY_NAME, city.name)
            .putFloat(KEY_LATITUDE, city.lat.toFloat())
            .putFloat(KEY_LONGITUDE, city.lon.toFloat())
            .putFloat(KEY_ELEVATION, city.elevation.toFloat())
            .apply()
    }

    /**
     * دریافت آخرین شهر ذخیره‌شده (در صورت نبود، پیش‌فرض تهران برگردانده می‌شود)
     */
    fun getSelectedCity(): SelectedCityPreference {
        val province = prefs.getString(KEY_PROVINCE_NAME, DEFAULT_PROVINCE) ?: DEFAULT_PROVINCE
        val cityName = prefs.getString(KEY_CITY_NAME, DEFAULT_CITY) ?: DEFAULT_CITY
        val lat = prefs.getFloat(KEY_LATITUDE, DEFAULT_LAT.toFloat()).toDouble()
        val lon = prefs.getFloat(KEY_LONGITUDE, DEFAULT_LON.toFloat()).toDouble()
        val elevation = prefs.getFloat(KEY_ELEVATION, 0.0f).toDouble()

        return SelectedCityPreference(
            provinceName = province,
            city = City(name = cityName, lat = lat, lon = lon, elevation = elevation)
        )
    }

    /**
     * آیا کاربر قبلاً شهری را انتخاب کرده است؟
     */
    fun hasSavedCity(): Boolean {
        return prefs.contains(KEY_CITY_NAME)
    }
}
