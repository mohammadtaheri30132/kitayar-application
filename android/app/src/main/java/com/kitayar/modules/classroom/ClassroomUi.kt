package com.kitayar.modules.classroom

import android.content.Context
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import android.widget.TextView

/** Small programmatic-UI helpers so the Activity stays readable. All colors come from ClassroomTheme. */
object ClassroomUi {
    fun dp(ctx: Context, v: Int): Int =
        TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v.toFloat(), ctx.resources.displayMetrics).toInt()

    fun rounded(ctx: Context, fill: Int, radiusDp: Int, strokeColor: Int? = null): GradientDrawable =
        GradientDrawable().apply {
            setColor(fill)
            cornerRadius = dp(ctx, radiusDp).toFloat()
            if (strokeColor != null) setStroke(dp(ctx, 1), strokeColor)
        }

    /** Round control button: icon-like emoji on top, tiny label below. */
    fun controlButton(ctx: Context, icon: String, label: String, fill: Int, onClick: () -> Unit): LinearLayout =
        LinearLayout(ctx).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            minimumWidth = dp(ctx, 56)
            setPadding(dp(ctx, 8), dp(ctx, 6), dp(ctx, 8), dp(ctx, 6))
            background = rounded(ctx, fill, 16)
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f).apply {
                marginStart = dp(ctx, 3); marginEnd = dp(ctx, 3)
            }
            addView(TextView(ctx).apply { text = icon; textSize = 18f; gravity = Gravity.CENTER; tag = "icon" })
            addView(TextView(ctx).apply {
                text = label; textSize = 10f; gravity = Gravity.CENTER
                setTextColor(ClassroomTheme.text); tag = "label"
            })
            setOnClickListener { onClick() }
        }

    fun setControlState(btn: LinearLayout, icon: String, label: String, fill: Int) {
        (btn.findViewWithTag<TextView>("icon")).text = icon
        (btn.findViewWithTag<TextView>("label")).text = label
        btn.background = rounded(btn.context, fill, 16)
    }

    fun chip(ctx: Context, label: String, selected: Boolean, onClick: () -> Unit): TextView =
        TextView(ctx).apply {
            text = label
            textSize = 12f
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            setTextColor(if (selected) ClassroomTheme.text else ClassroomTheme.textMuted)
            setPadding(dp(ctx, 12), dp(ctx, 7), dp(ctx, 12), dp(ctx, 7))
            background = rounded(
                ctx,
                if (selected) ClassroomTheme.primaryDark else ClassroomTheme.surfaceHigh,
                14,
                if (selected) ClassroomTheme.primary else ClassroomTheme.border
            )
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply { marginStart = dp(ctx, 4); marginEnd = dp(ctx, 4) }
            setOnClickListener { onClick() }
        }

    fun colorDot(ctx: Context, color: Int, selected: Boolean, onClick: () -> Unit): View =
        View(ctx).apply {
            val size = dp(ctx, 26)
            layoutParams = LinearLayout.LayoutParams(size, size).apply {
                marginStart = dp(ctx, 5); marginEnd = dp(ctx, 5)
            }
            background = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(color)
                setStroke(dp(ctx, if (selected) 3 else 1), if (selected) ClassroomTheme.primary else ClassroomTheme.border)
            }
            setOnClickListener { onClick() }
        }
}
