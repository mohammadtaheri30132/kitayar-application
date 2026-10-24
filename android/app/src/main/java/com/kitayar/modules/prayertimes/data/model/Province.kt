package com.kitayar.modules.prayertimes.data.model

/**
 * مدل داده‌ای استان برای دسته‌بندی شهرهای ایران
 *
 * @property province نام استان (مثلاً «تهران»، «اصفهان»)
 * @property center نام مرکز استان
 * @property cities فهرست شهرهای تحت پوشش این استان
 */
data class Province(
    val province: String,
    val center: String? = null,
    val cities: List<City> = emptyList()
)
