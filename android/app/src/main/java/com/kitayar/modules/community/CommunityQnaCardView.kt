package com.kitayar.modules.community

import android.content.Context
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.text.TextUtils
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.widget.LinearLayout
import android.widget.TextView
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.events.RCTEventEmitter

class CommunityQnaCardView(context: Context) : LinearLayout(context) {

    private val cardBackground: GradientDrawable
    private val headerLayout: LinearLayout
    private val authorInfoLayout: LinearLayout
    private val avatarView: TextView
    private val authorNameView: TextView
    private val timeRoleView: TextView

    private val categoryPill: TextView
    private val titleView: TextView
    private val bodyView: TextView

    private val footerLayout: LinearLayout
    private val answerCountPill: TextView
    private val statusBadge: TextView

    private var questionId: String = ""
    private var isDarkMode: Boolean = false

    init {
        // Enforce strict RTL layout direction and vertical orientation
        orientation = VERTICAL
        layoutDirection = View.LAYOUT_DIRECTION_RTL

        val p = dpToPx(16f).toInt()
        setPadding(p, p, p, p)

        cardBackground = GradientDrawable().apply {
            cornerRadius = dpToPx(16f)
            setColor(Color.WHITE)
            setStroke(dpToPx(1f).toInt(), Color.parseColor("#E2E8F0"))
        }
        background = cardBackground
        elevation = dpToPx(3f)

        layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT)

        // --- Header (Avatar + Name/Role + Time) ---
        headerLayout = LinearLayout(context).apply {
            orientation = HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            layoutDirection = View.LAYOUT_DIRECTION_RTL
            layoutParams = LayoutParams(
                LayoutParams.MATCH_PARENT,
                LayoutParams.WRAP_CONTENT
            ).apply {
                bottomMargin = dpToPx(10f).toInt()
            }
        }

        avatarView = TextView(context).apply {
            val size = dpToPx(36f).toInt()
            layoutParams = LayoutParams(size, size).apply {
                leftMargin = dpToPx(10f).toInt()
            }
            gravity = Gravity.CENTER
            setTextColor(Color.WHITE)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 15f)
            val bg = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(Color.parseColor("#4F46E5")) // Indigo
            }
            background = bg
        }

        authorInfoLayout = LinearLayout(context).apply {
            orientation = VERTICAL
            gravity = Gravity.CENTER_VERTICAL
            layoutDirection = View.LAYOUT_DIRECTION_RTL
            layoutParams = LayoutParams(0, LayoutParams.WRAP_CONTENT, 1f)
        }

        authorNameView = TextView(context).apply {
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 14f)
            setTextColor(Color.parseColor("#1E293B"))
            setTypeface(typeface, android.graphics.Typeface.BOLD)
            gravity = Gravity.RIGHT
            textDirection = View.TEXT_DIRECTION_RTL
        }

        timeRoleView = TextView(context).apply {
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 11f)
            setTextColor(Color.parseColor("#64748B"))
            gravity = Gravity.RIGHT
            textDirection = View.TEXT_DIRECTION_RTL
        }

        authorInfoLayout.addView(authorNameView)
        authorInfoLayout.addView(timeRoleView)

        // Category pill in header top-left (RTL)
        categoryPill = TextView(context).apply {
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 11f)
            val hp = dpToPx(8f).toInt()
            val vp = dpToPx(4f).toInt()
            setPadding(hp, vp, hp, vp)
            gravity = Gravity.CENTER
            visibility = View.GONE
        }

        headerLayout.addView(avatarView)
        headerLayout.addView(authorInfoLayout)
        headerLayout.addView(categoryPill)

        // --- Question Title ---
        titleView = TextView(context).apply {
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 15f)
            setTextColor(Color.parseColor("#0F172A"))
            setTypeface(typeface, android.graphics.Typeface.BOLD)
            gravity = Gravity.RIGHT
            textDirection = View.TEXT_DIRECTION_RTL
            maxLines = 2
            ellipsize = TextUtils.TruncateAt.END
            layoutParams = LayoutParams(
                LayoutParams.MATCH_PARENT,
                LayoutParams.WRAP_CONTENT
            ).apply {
                bottomMargin = dpToPx(6f).toInt()
            }
        }

        // --- Question Body Preview ---
        bodyView = TextView(context).apply {
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 13f)
            setTextColor(Color.parseColor("#475569"))
            gravity = Gravity.RIGHT
            textDirection = View.TEXT_DIRECTION_RTL
            maxLines = 3
            ellipsize = TextUtils.TruncateAt.END
            layoutParams = LayoutParams(
                LayoutParams.MATCH_PARENT,
                LayoutParams.WRAP_CONTENT
            ).apply {
                bottomMargin = dpToPx(12f).toInt()
            }
        }

        // --- Footer (Answer count & Status) ---
        footerLayout = LinearLayout(context).apply {
            orientation = HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            layoutDirection = View.LAYOUT_DIRECTION_RTL
            layoutParams = LayoutParams(
                LayoutParams.MATCH_PARENT,
                LayoutParams.WRAP_CONTENT
            )
        }

        answerCountPill = TextView(context).apply {
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f)
            setTextColor(Color.parseColor("#2563EB"))
            val hp = dpToPx(10f).toInt()
            val vp = dpToPx(4f).toInt()
            setPadding(hp, vp, hp, vp)
            val bg = GradientDrawable().apply {
                cornerRadius = dpToPx(8f)
                setColor(Color.parseColor("#EFF6FF"))
            }
            background = bg
            gravity = Gravity.CENTER
        }

        statusBadge = TextView(context).apply {
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 11f)
            val hp = dpToPx(8f).toInt()
            val vp = dpToPx(3f).toInt()
            setPadding(hp, vp, hp, vp)
            layoutParams = LayoutParams(
                LayoutParams.WRAP_CONTENT,
                LayoutParams.WRAP_CONTENT
            ).apply {
                rightMargin = dpToPx(8f).toInt()
            }
            visibility = View.GONE
        }

        footerLayout.addView(answerCountPill)
        footerLayout.addView(statusBadge)

        // Assemble direct views
        addView(headerLayout)
        addView(titleView)
        addView(bodyView)
        addView(footerLayout)

        // Native click event to React Native
        setOnClickListener {
            val reactContext = context as? ReactContext
            reactContext?.getJSModule(RCTEventEmitter::class.java)?.receiveEvent(
                id,
                "onCardPress",
                Arguments.createMap().apply {
                    putString("questionId", questionId)
                }
            )
        }
    }

    fun setQuestionId(id: String) {
        this.questionId = id
    }

    fun setTitle(title: String?) {
        titleView.text = title ?: ""
    }

    fun setBody(body: String?) {
        bodyView.text = body ?: ""
    }

    fun setAuthorName(name: String?) {
        val safeName = if (name.isNullOrBlank()) "کاربر کیتایار" else name
        authorNameView.text = safeName
        val initial = safeName.firstOrNull()?.toString() ?: "ک"
        avatarView.text = initial
    }

    fun setAuthorRole(role: String?) {
        val safeRole = if (role.isNullOrBlank()) "معلم" else role
        val currentText = timeRoleView.text.toString()
        if (currentText.contains("•")) {
            val parts = currentText.split("•")
            timeRoleView.text = "$safeRole • ${parts.getOrNull(1)?.trim() ?: ""}"
        } else {
            timeRoleView.text = safeRole
        }
    }

    fun setTimeText(time: String?) {
        val safeTime = time ?: ""
        if (safeTime.isNotEmpty()) {
            timeRoleView.text = safeTime
        }
    }

    fun setCategory(name: String?, colorHex: String?) {
        if (name.isNullOrBlank()) {
            categoryPill.visibility = View.GONE
            return
        }
        categoryPill.visibility = View.VISIBLE
        categoryPill.text = name

        val parsedColor = try {
            if (!colorHex.isNullOrBlank()) Color.parseColor(colorHex) else Color.parseColor("#4F46E5")
        } catch (e: Exception) {
            Color.parseColor("#4F46E5")
        }

        categoryPill.setTextColor(parsedColor)
        val bg = GradientDrawable().apply {
            cornerRadius = dpToPx(8f)
            setColor(Color.argb(35, Color.red(parsedColor), Color.green(parsedColor), Color.blue(parsedColor)))
            setStroke(dpToPx(1f).toInt(), parsedColor)
        }
        categoryPill.background = bg
    }

    fun setAnswerCount(count: Int) {
        val persianDigits = toPersianNumber(count)
        answerCountPill.text = "💬 $persianDigits پاسخ"
    }

    fun setStatus(status: String?) {
        when (status) {
            "pending_review" -> {
                statusBadge.visibility = View.VISIBLE
                statusBadge.text = "⏳ در حال بررسی ناظر"
                statusBadge.setTextColor(Color.parseColor("#B45309"))
                statusBadge.background = GradientDrawable().apply {
                    cornerRadius = dpToPx(6f)
                    setColor(Color.parseColor("#FEF3C7"))
                }
            }
            "active" -> {
                statusBadge.visibility = View.VISIBLE
                statusBadge.text = "✓ منتشر شده"
                statusBadge.setTextColor(Color.parseColor("#15803D"))
                statusBadge.background = GradientDrawable().apply {
                    cornerRadius = dpToPx(6f)
                    setColor(Color.parseColor("#DCFCE7"))
                }
            }
            else -> {
                statusBadge.visibility = View.GONE
            }
        }
    }

    fun setIsDarkMode(dark: Boolean) {
        this.isDarkMode = dark
        if (dark) {
            cardBackground.setColor(Color.parseColor("#1E293B"))
            cardBackground.setStroke(dpToPx(1f).toInt(), Color.parseColor("#334155"))
            authorNameView.setTextColor(Color.parseColor("#F1F5F9"))
            timeRoleView.setTextColor(Color.parseColor("#94A3B8"))
            titleView.setTextColor(Color.parseColor("#F8FAFC"))
            bodyView.setTextColor(Color.parseColor("#CBD5E1"))
            answerCountPill.setTextColor(Color.parseColor("#93C5FD"))
            (answerCountPill.background as? GradientDrawable)?.setColor(Color.parseColor("#1E3A8A"))
        } else {
            cardBackground.setColor(Color.WHITE)
            cardBackground.setStroke(dpToPx(1f).toInt(), Color.parseColor("#E2E8F0"))
            authorNameView.setTextColor(Color.parseColor("#1E293B"))
            timeRoleView.setTextColor(Color.parseColor("#64748B"))
            titleView.setTextColor(Color.parseColor("#0F172A"))
            bodyView.setTextColor(Color.parseColor("#475569"))
            answerCountPill.setTextColor(Color.parseColor("#2563EB"))
            (answerCountPill.background as? GradientDrawable)?.setColor(Color.parseColor("#EFF6FF"))
        }
        background = cardBackground
    }

    private fun dpToPx(dp: Float): Float {
        return dp * context.resources.displayMetrics.density
    }

    private fun toPersianNumber(number: Int): String {
        val persian = charArrayOf('۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹')
        val str = number.toString()
        val sb = StringBuilder()
        for (c in str) {
            if (c in '0'..'9') {
                sb.append(persian[c - '0'])
            } else {
                sb.append(c)
            }
        }
        return sb.toString()
    }
}
