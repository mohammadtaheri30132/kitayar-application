package com.kitayar.modules.prayertimes.data.model

/**
 * مدل داده‌ای شهر برای محاسبه اوقات شرعی
 *
 * @property name نام فارسی شهر با املای رسمی
 * @property lat عرض جغرافیایی (Latitude) برحسب درجه اعشاری
 * @property lon طول جغرافیایی (Longitude) برحسب درجه اعشاری
 * @property elevation ارتفاع از سطح دریا بر حسب متر (اختیاری، پیش‌فرض 0.0)
 */
data class City(
    val name: String,
    val lat: Double,
    val lon: Double,
    val elevation: Double = 0.0
)
