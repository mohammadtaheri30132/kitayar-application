package com.kitayar.modules.persiandatepicker

import android.app.AlertDialog
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.NumberPicker
import android.widget.TextView
import com.facebook.react.bridge.*

class PersianDatePickerModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "PersianDatePicker"
    }

    private fun getEstedadTypeface(style: String = "Medium"): Typeface? {
        return try {
            Typeface.createFromAsset(reactContext.assets, "fonts/Estedad-FD-$style.ttf")
        } catch (e: Exception) {
            try {
                Typeface.createFromAsset(reactContext.assets, "fonts/Estedad-FD-Regular.ttf")
            } catch (ex: Exception) {
                Typeface.DEFAULT
            }
        }
    }

    private fun styleNumberPicker(picker: NumberPicker, typeface: Typeface?) {
        val count = picker.childCount
        for (i in 0 until count) {
            val child = picker.getChildAt(i)
            if (child is EditText) {
                try {
                    if (typeface != null) {
                        child.typeface = typeface
                    }
                    child.setTextSize(TypedValue.COMPLEX_UNIT_SP, 16f)
                    child.setTextColor(Color.parseColor("#1e293b"))
                    child.isFocusable = false
                } catch (e: Exception) {
                    // ignore
                }
            }
        }
    }

    @ReactMethod
    fun show(options: ReadableMap, promise: Promise) {
        val currentActivity = reactContext.currentActivity
        if (currentActivity == null) {
            promise.reject("ACTIVITY_DOES_NOT_EXIST", "Activity doesn't exist")
            return
        }

        currentActivity.runOnUiThread {
            try {
                val boldTypeface = getEstedadTypeface("Bold")
                val mediumTypeface = getEstedadTypeface("Medium")
                val regularTypeface = getEstedadTypeface("Regular")

                // Main card container
                val rootContainer = LinearLayout(currentActivity).apply {
                    orientation = LinearLayout.VERTICAL
                    gravity = Gravity.CENTER_HORIZONTAL
                    setPadding(40, 32, 40, 24)
                    background = GradientDrawable().apply {
                        setColor(Color.WHITE)
                        cornerRadius = 48f
                    }
                }

                // Header Title
                val titleView = TextView(currentActivity).apply {
                    text = if (options.hasKey("title")) options.getString("title") else "انتخاب تاریخ"
                    setTextSize(TypedValue.COMPLEX_UNIT_SP, 17f)
                    setTextColor(Color.parseColor("#0f172a"))
                    typeface = boldTypeface
                    gravity = Gravity.CENTER
                    setPadding(0, 0, 0, 8)
                }

                // Subtitle
                val subtitleView = TextView(currentActivity).apply {
                    text = "سال، ماه و روز را مشخص نمایید"
                    setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f)
                    setTextColor(Color.parseColor("#64748b"))
                    typeface = regularTypeface
                    gravity = Gravity.CENTER
                    setPadding(0, 0, 0, 24)
                }

                rootContainer.addView(titleView)
                rootContainer.addView(subtitleView)

                // Pickers container in Persian RTL order: Day (left) - Month (center) - Year (right)
                // When looking right to left: Year -> Month -> Day
                val pickersRow = LinearLayout(currentActivity).apply {
                    orientation = LinearLayout.HORIZONTAL
                    gravity = Gravity.CENTER
                    layoutDirection = View.LAYOUT_DIRECTION_RTL
                    setPadding(10, 0, 10, 16)
                }

                val initialYear = if (options.hasKey("year")) options.getInt("year") else 1403
                val initialMonth = if (options.hasKey("month")) options.getInt("month") else 7
                val initialDay = if (options.hasKey("day")) options.getInt("day") else 1

                val yearPicker = NumberPicker(currentActivity).apply {
                    minValue = 1300
                    maxValue = 1500
                    value = initialYear
                    descendantFocusability = NumberPicker.FOCUS_BLOCK_DESCENDANTS
                    layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.2f).apply {
                        setMargins(8, 0, 8, 0)
                    }
                }

                val monthPicker = NumberPicker(currentActivity).apply {
                    minValue = 1
                    maxValue = 12
                    value = initialMonth
                    displayedValues = arrayOf(
                        "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
                        "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
                    )
                    descendantFocusability = NumberPicker.FOCUS_BLOCK_DESCENDANTS
                    layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.6f).apply {
                        setMargins(8, 0, 8, 0)
                    }
                }

                val dayPicker = NumberPicker(currentActivity).apply {
                    minValue = 1
                    maxValue = 31
                    value = initialDay
                    descendantFocusability = NumberPicker.FOCUS_BLOCK_DESCENDANTS
                    layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f).apply {
                        setMargins(8, 0, 8, 0)
                    }
                }

                monthPicker.setOnValueChangedListener { _, _, newVal ->
                    if (newVal > 6) {
                        dayPicker.maxValue = if (newVal == 12) 29 else 30
                    } else {
                        dayPicker.maxValue = 31
                    }
                }

                // In RTL layout direction: add Year, then Month, then Day
                pickersRow.addView(yearPicker)
                pickersRow.addView(monthPicker)
                pickersRow.addView(dayPicker)
                rootContainer.addView(pickersRow)

                val dialog = AlertDialog.Builder(currentActivity)
                    .setView(rootContainer)
                    .setCancelable(true)
                    .create()

                // Buttons row in Persian standard
                val buttonsRow = LinearLayout(currentActivity).apply {
                    orientation = LinearLayout.HORIZONTAL
                    layoutDirection = View.LAYOUT_DIRECTION_RTL
                    layoutParams = LinearLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.WRAP_CONTENT
                    ).apply {
                        topMargin = 16
                    }
                }

                val confirmBtn = Button(currentActivity).apply {
                    text = "تایید تاریخ"
                    typeface = boldTypeface
                    setTextSize(TypedValue.COMPLEX_UNIT_SP, 14f)
                    setTextColor(Color.WHITE)
                    background = GradientDrawable().apply {
                        setColor(Color.parseColor("#2563eb")) // Kitayar Brand Primary Blue
                        cornerRadius = 24f
                    }
                    layoutParams = LinearLayout.LayoutParams(0, 120, 1.0f).apply {
                        setMargins(8, 0, 8, 0)
                    }
                    setOnClickListener {
                        val result = Arguments.createMap()
                        result.putInt("year", yearPicker.value)
                        result.putInt("month", monthPicker.value)
                        result.putInt("day", dayPicker.value)
                        promise.resolve(result)
                        dialog.dismiss()
                    }
                }

                val cancelBtn = Button(currentActivity).apply {
                    text = "انصراف"
                    typeface = mediumTypeface
                    setTextSize(TypedValue.COMPLEX_UNIT_SP, 14f)
                    setTextColor(Color.parseColor("#64748b"))
                    background = GradientDrawable().apply {
                        setColor(Color.parseColor("#f1f5f9"))
                        cornerRadius = 24f
                    }
                    layoutParams = LinearLayout.LayoutParams(0, 120, 1.0f).apply {
                        setMargins(8, 0, 8, 0)
                    }
                    setOnClickListener {
                        promise.reject("USER_CANCELLED", "User cancelled date picker")
                        dialog.dismiss()
                    }
                }

                buttonsRow.addView(confirmBtn)
                buttonsRow.addView(cancelBtn)
                rootContainer.addView(buttonsRow)

                dialog.window?.setBackgroundDrawableResource(android.R.color.transparent)
                dialog.show()

                styleNumberPicker(yearPicker, mediumTypeface)
                styleNumberPicker(monthPicker, mediumTypeface)
                styleNumberPicker(dayPicker, mediumTypeface)

            } catch (e: Exception) {
                promise.reject("ERROR", e.message)
            }
        }
    }
}
