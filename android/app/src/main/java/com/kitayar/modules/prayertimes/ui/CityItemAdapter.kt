package com.kitayar.modules.prayertimes.ui

import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.graphics.drawable.RippleDrawable
import android.content.res.ColorStateList
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.kitayar.modules.prayertimes.data.model.City
import com.kitayar.modules.prayertimes.data.model.Province
import com.kitayar.modules.prayertimes.domain.calendar.SolarCalendarHelper

/**
 * آداپتور منعطف برای نمایش لیست استان‌ها یا شهرهای ایران
 */
class CityItemAdapter(
    private val context: Context,
    private val onProvinceClicked: ((Province) -> Unit)? = null,
    private val onCityClicked: ((City) -> Unit)? = null
) : RecyclerView.Adapter<CityItemAdapter.ViewHolder>() {

    private var provinces: List<Province> = emptyList()
    private var cities: List<City> = emptyList()
    private var isProvinceMode: Boolean = true

    fun setProvinces(list: List<Province>) {
        isProvinceMode = true
        provinces = list
        cities = emptyList()
        notifyDataSetChanged()
    }

    fun setCities(list: List<City>) {
        isProvinceMode = false
        cities = list
        provinces = emptyList()
        notifyDataSetChanged()
    }

    override fun getItemCount(): Int {
        return if (isProvinceMode) provinces.size else cities.size
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val rootCard = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            layoutParams = ViewGroup.MarginLayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply {
                setMargins(24, 12, 24, 12)
            }
            setPadding(32, 28, 32, 28)
            gravity = Gravity.CENTER_VERTICAL
            elevation = 2f

            // بک‌گراند گرد با قابلیت ریپل (Ripple) لمسی
            val bgDrawable = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                cornerRadius = 24f
                setColor(Color.WHITE)
                setStroke(1, Color.parseColor("#E5E7EB"))
            }
            val rippleColor = ColorStateList.valueOf(Color.parseColor("#E0E7FF"))
            background = RippleDrawable(rippleColor, bgDrawable, null)
            isClickable = true
            layoutDirection = View.LAYOUT_DIRECTION_LTR
        }

        // 1. علامت فلش هدایت در سمت چپ کارت
        val txtArrow = TextView(context).apply {
            text = "‹"
            textSize = 24f
            setTextColor(Color.parseColor("#9CA3AF"))
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER_VERTICAL
            setPadding(8, 0, 16, 0)
        }
        rootCard.addView(txtArrow)

        // 2. متن عنوان اصلی و زیرعنوان در سمت راست کارت
        val textContainer = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
            gravity = Gravity.RIGHT or Gravity.CENTER_VERTICAL
            layoutDirection = View.LAYOUT_DIRECTION_RTL
        }

        val txtTitle = TextView(context).apply {
            textSize = 16f
            setTextColor(Color.parseColor("#1F2937"))
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.RIGHT
        }

        val txtSubtitle = TextView(context).apply {
            textSize = 13f
            setTextColor(Color.parseColor("#6B7280"))
            setPadding(0, 6, 0, 0)
            gravity = Gravity.RIGHT
        }

        textContainer.addView(txtTitle)
        textContainer.addView(txtSubtitle)
        rootCard.addView(textContainer)

        return ViewHolder(rootCard, txtTitle, txtSubtitle)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        if (isProvinceMode) {
            val province = provinces[position]
            holder.txtTitle.text = province.province
            val cityCount = SolarCalendarHelper.toPersianDigits(province.cities.size)
            val centerText = province.center?.let { "مرکز: $it • " } ?: ""
            holder.txtSubtitle.text = "$centerText$cityCount شهر"
            holder.itemView.setOnClickListener {
                onProvinceClicked?.invoke(province)
            }
        } else {
            val city = cities[position]
            holder.txtTitle.text = city.name
            val latStr = SolarCalendarHelper.toPersianDigits(String.format("%.2f", city.lat))
            val lonStr = SolarCalendarHelper.toPersianDigits(String.format("%.2f", city.lon))
            holder.txtSubtitle.text = "مختصات: $latStr° شمالی، $lonStr° شرقی"
            holder.itemView.setOnClickListener {
                onCityClicked?.invoke(city)
            }
        }
    }

    class ViewHolder(
        view: View,
        val txtTitle: TextView,
        val txtSubtitle: TextView
    ) : RecyclerView.ViewHolder(view)
}
