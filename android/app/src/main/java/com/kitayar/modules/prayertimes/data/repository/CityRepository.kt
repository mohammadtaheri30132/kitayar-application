package com.kitayar.modules.prayertimes.data.repository

import android.content.Context
import com.kitayar.modules.prayertimes.data.model.City
import com.kitayar.modules.prayertimes.data.model.Province
import org.json.JSONArray
import java.io.InputStream

/**
 * مخزن داده‌های شهرها و استان‌های ایران (CityRepository)
 * بارگذاری کاملاً آفلاین از فایل iran_cities.json در assets
 */
class CityRepository(private val context: Context? = null) {

    private var cachedProvinces: List<Province>? = null

    /**
     * بارگذاری تمام استان‌ها و شهرهای ایران از فایل JSON
     */
    fun getProvinces(): List<Province> {
        cachedProvinces?.let { return it }

        val inputStream: InputStream? = try {
            context?.assets?.open("iran_cities.json")
                ?: this::class.java.classLoader?.getResourceAsStream("assets/iran_cities.json")
                ?: this::class.java.classLoader?.getResourceAsStream("iran_cities.json")
        } catch (e: Exception) {
            null
        }

        val jsonString = inputStream?.bufferedReader()?.use { it.readText() } ?: "[]"
        val list = parseJson(jsonString)
        cachedProvinces = list
        return list
    }

    /**
     * تجزیه رشته JSON به لیست استان‌ها و شهرها با استفاده از org.json استاندارد اندروید
     */
    fun parseJson(jsonString: String): List<Province> {
        val result = mutableListOf<Province>()
        try {
            val jsonArray = JSONArray(jsonString)
            for (i in 0 until jsonArray.length()) {
                val provinceObj = jsonArray.getJSONObject(i)
                val provinceName = provinceObj.getString("province")
                val centerName = if (provinceObj.has("center")) provinceObj.getString("center") else null

                val citiesList = mutableListOf<City>()
                val citiesArray = provinceObj.getJSONArray("cities")
                for (j in 0 until citiesArray.length()) {
                    val cityObj = citiesArray.getJSONObject(j)
                    val cityName = cityObj.getString("name")
                    val lat = cityObj.getDouble("lat")
                    val lon = cityObj.getDouble("lon")
                    val elevation = if (cityObj.has("elevation")) cityObj.optDouble("elevation", 0.0) else 0.0
                    citiesList.add(City(name = cityName, lat = lat, lon = lon, elevation = elevation))
                }
                result.add(Province(province = provinceName, center = centerName, cities = citiesList))
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return result
    }

    /**
     * جستجوی استان‌ها براساس نام
     */
    fun searchProvinces(query: String): List<Province> {
        val trimmed = query.trim()
        val all = getProvinces()
        if (trimmed.isEmpty()) return all
        return all.filter { it.province.contains(trimmed, ignoreCase = true) }
    }

    /**
     * دریافت شهرهای یک استان
     */
    fun getCities(provinceName: String): List<City> {
        return getProvinces().find { it.province.equals(provinceName, ignoreCase = true) }?.cities ?: emptyList()
    }

    /**
     * جستجوی شهرها در یک استان براساس نام
     */
    fun searchCities(provinceName: String, query: String): List<City> {
        val cities = getCities(provinceName)
        val trimmed = query.trim()
        if (trimmed.isEmpty()) return cities
        return cities.filter { it.name.contains(trimmed, ignoreCase = true) }
    }

    /**
     * جستجوی سراسری شهر براساس نام
     */
    fun findCity(cityName: String): Pair<Province, City>? {
        val clean = cityName.trim()
        for (province in getProvinces()) {
            for (city in province.cities) {
                if (city.name.equals(clean, ignoreCase = true) || city.name.contains(clean)) {
                    return Pair(province, city)
                }
            }
        }
        return null
    }
}
