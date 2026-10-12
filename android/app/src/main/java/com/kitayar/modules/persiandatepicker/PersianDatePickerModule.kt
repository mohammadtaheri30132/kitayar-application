package com.kitayar.modules.persiandatepicker

import android.app.AlertDialog
import android.widget.LinearLayout
import android.widget.NumberPicker
import com.facebook.react.bridge.*
import java.util.Calendar

class PersianDatePickerModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "PersianDatePicker"
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
                val layout = LinearLayout(currentActivity).apply {
                    orientation = LinearLayout.HORIZONTAL
                    gravity = android.view.Gravity.CENTER
                    setPadding(50, 50, 50, 50)
                }

                // Default to today if not provided
                val initialYear = if (options.hasKey("year")) options.getInt("year") else 1403
                val initialMonth = if (options.hasKey("month")) options.getInt("month") else 7
                val initialDay = if (options.hasKey("day")) options.getInt("day") else 1

                val yearPicker = NumberPicker(currentActivity).apply {
                    minValue = 1300
                    maxValue = 1500
                    value = initialYear
                }

                val monthPicker = NumberPicker(currentActivity).apply {
                    minValue = 1
                    maxValue = 12
                    value = initialMonth
                    displayedValues = arrayOf(
                        "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
                        "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
                    )
                }

                val dayPicker = NumberPicker(currentActivity).apply {
                    minValue = 1
                    maxValue = 31
                    value = initialDay
                }

                monthPicker.setOnValueChangedListener { _, _, newVal ->
                    if (newVal > 6) {
                        dayPicker.maxValue = if (newVal == 12) 29 else 30
                    } else {
                        dayPicker.maxValue = 31
                    }
                }
                
                // Add in RTL order (Year, Month, Day) or (Day, Month, Year)
                layout.addView(yearPicker)
                layout.addView(monthPicker)
                layout.addView(dayPicker)

                AlertDialog.Builder(currentActivity)
                    .setTitle("انتخاب تاریخ")
                    .setView(layout)
                    .setPositiveButton("تایید") { _, _ ->
                        val result = Arguments.createMap()
                        result.putInt("year", yearPicker.value)
                        result.putInt("month", monthPicker.value)
                        result.putInt("day", dayPicker.value)
                        promise.resolve(result)
                    }
                    .setNegativeButton("لغو") { _, _ ->
                        promise.reject("USER_CANCELLED", "User cancelled date picker")
                    }
                    .show()

            } catch (e: Exception) {
                promise.reject("ERROR", e.message)
            }
        }
    }
}
