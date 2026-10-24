package com.kitayar.modules.prayertimes.ui

import com.kitayar.modules.prayertimes.data.model.City
import com.kitayar.modules.prayertimes.data.model.Province
import com.kitayar.modules.prayertimes.data.repository.CityRepository
import com.kitayar.modules.prayertimes.data.repository.UserPreferencesRepository
import com.kitayar.modules.prayertimes.domain.PrayerTimesCalculator
import com.kitayar.modules.prayertimes.domain.model.PrayerTimesResult
import java.time.LocalDate

/**
 * مدیریت وضعیت و منطق نمایش رابط کاربری اوقات شرعی (PrayerTimesViewModel)
 *
 * بدون وابستگی به فریم‌ورک‌های سنگین؛ به شکل تمیز و قابل تست.
 */
class PrayerTimesViewModel(
    private val cityRepository: CityRepository,
    private val preferencesRepository: UserPreferencesRepository,
    private val calculator: PrayerTimesCalculator = PrayerTimesCalculator()
) {

    enum class ScreenState {
        PRAYER_TIMES, // نمایش کارت‌های اوقات شرعی شهر انتخاب‌شده
        PROVINCES,    // لیست قابل جستجوی استان‌ها
        CITIES        // لیست قابل جستجوی شهرهای استان انتخاب‌شده
    }

    var currentState: ScreenState = ScreenState.PRAYER_TIMES
        private set

    var currentProvinceName: String = "تهران"
        private set

    var currentCity: City = City("تهران", 35.6892, 51.3890)
        private set

    var prayerTimesResult: PrayerTimesResult? = null
        private set

    var filteredProvinces: List<Province> = emptyList()
        private set

    var filteredCities: List<City> = emptyList()
        private set

    var searchQuery: String = ""
        private set

    var onStateChanged: (() -> Unit)? = null

    /**
     * راه‌اندازی اولیه: بارگذاری آخرین شهر ذخیره‌شده یا پیش‌فرض تهران
     */
    fun initialize() {
        val pref = preferencesRepository.getSelectedCity()
        currentProvinceName = pref.provinceName
        currentCity = pref.city
        recalculatePrayerTimes()
        currentState = ScreenState.PRAYER_TIMES
        onStateChanged?.invoke()
    }

    /**
     * محاسبه مجدد اوقات شرعی برای شهر فعلی و تاریخ امروز
     */
    fun recalculatePrayerTimes() {
        prayerTimesResult = calculator.calculate(
            lat = currentCity.lat,
            lon = currentCity.lon,
            date = LocalDate.now(PrayerTimesCalculator.TEHRAN_ZONE)
        )
    }

    /**
     * باز کردن صفحه انتخاب استان
     */
    fun openProvinceSelection() {
        currentState = ScreenState.PROVINCES
        searchQuery = ""
        filteredProvinces = cityRepository.getProvinces()
        onStateChanged?.invoke()
    }

    /**
     * انتخاب استان و رفتن به لیست شهرهای آن
     */
    fun selectProvince(province: Province) {
        currentProvinceName = province.province
        currentState = ScreenState.CITIES
        searchQuery = ""
        filteredCities = province.cities
        onStateChanged?.invoke()
    }

    /**
     * انتخاب شهر، ذخیره به عنوان آخرین شهر و بازگشت به اوقات شرعی
     */
    fun selectCity(city: City) {
        currentCity = city
        preferencesRepository.saveSelectedCity(currentProvinceName, city)
        recalculatePrayerTimes()
        currentState = ScreenState.PRAYER_TIMES
        onStateChanged?.invoke()
    }

    /**
     * جستجو در استان‌ها یا شهرها
     */
    fun onSearchQueryChanged(query: String) {
        searchQuery = query
        when (currentState) {
            ScreenState.PROVINCES -> {
                filteredProvinces = cityRepository.searchProvinces(query)
            }
            ScreenState.CITIES -> {
                filteredCities = cityRepository.searchCities(currentProvinceName, query)
            }
            else -> {}
        }
        onStateChanged?.invoke()
    }

    /**
     * بازگشت به صفحه قبل
     * @return true اگر در داخل همین ویومدل مدیریت شد، false اگر باید اکتیویتی بسته شود
     */
    fun handleBackPress(): Boolean {
        return when (currentState) {
            ScreenState.CITIES -> {
                currentState = ScreenState.PROVINCES
                searchQuery = ""
                filteredProvinces = cityRepository.getProvinces()
                onStateChanged?.invoke()
                true
            }
            ScreenState.PROVINCES -> {
                currentState = ScreenState.PRAYER_TIMES
                onStateChanged?.invoke()
                true
            }
            ScreenState.PRAYER_TIMES -> {
                false // اکتیویتی بسته شود
            }
        }
    }
}
