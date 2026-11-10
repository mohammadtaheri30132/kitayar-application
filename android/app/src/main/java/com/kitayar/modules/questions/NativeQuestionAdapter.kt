package com.kitayar.modules.questions

import android.content.Context
import android.content.res.ColorStateList
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.graphics.drawable.RippleDrawable
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView

class NativeQuestionAdapter(
    private val context: Context,
    private val onToggleSelect: (questionId: String, isSelected: Boolean) -> Unit,
    private val onRemove: (questionId: String) -> Unit,
    private val onEdit: (questionId: String) -> Unit
) : RecyclerView.Adapter<NativeQuestionAdapter.QuestionViewHolder>() {

    private var items: List<QuestionItem> = emptyList()
    private val selectedIdSet: MutableSet<String> = mutableSetOf()
    private var isDarkMode: Boolean = false
    private var isBankMode: Boolean = true
    private var canDelete: Boolean = false

    private val fontRegular: Typeface by lazy {
        try {
            Typeface.createFromAsset(context.assets, "fonts/Estedad-FD-Regular.ttf")
        } catch (e: Exception) {
            Typeface.DEFAULT
        }
    }

    private val fontBold: Typeface by lazy {
        try {
            Typeface.createFromAsset(context.assets, "fonts/Estedad-FD-Bold.ttf")
        } catch (e: Exception) {
            Typeface.DEFAULT_BOLD
        }
    }

    private val fontMedium: Typeface by lazy {
        try {
            Typeface.createFromAsset(context.assets, "fonts/Estedad-FD-Medium.ttf")
        } catch (e: Exception) {
            Typeface.DEFAULT
        }
    }

    fun setData(
        newItems: List<QuestionItem>,
        newSelectedIds: Set<String>,
        darkMode: Boolean,
        bankMode: Boolean,
        allowDelete: Boolean
    ) {
        this.items = newItems
        this.selectedIdSet.clear()
        this.selectedIdSet.addAll(newSelectedIds)
        this.isDarkMode = darkMode
        this.isBankMode = bankMode
        this.canDelete = allowDelete
        notifyDataSetChanged()
    }

    fun updateSelectedIds(newSelectedIds: Set<String>) {
        this.selectedIdSet.clear()
        this.selectedIdSet.addAll(newSelectedIds)
        notifyDataSetChanged()
    }

    fun toggleSelectionLocally(questionId: String): Boolean {
        val newState = if (selectedIdSet.contains(questionId)) {
            selectedIdSet.remove(questionId)
            false
        } else {
            selectedIdSet.add(questionId)
            true
        }
        val pos = items.indexOfFirst { it.id == questionId }
        if (pos != -1) {
            notifyItemChanged(pos)
        }
        return newState
    }

    override fun getItemCount(): Int = items.size

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): QuestionViewHolder {
        val density = context.resources.displayMetrics.density
        fun dp(v: Float): Int = (v * density).toInt()

        val cardLayout = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            layoutDirection = View.LAYOUT_DIRECTION_RTL
            layoutParams = ViewGroup.MarginLayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply {
                setMargins(dp(16f), dp(6f), dp(16f), dp(8f))
            }
            setPadding(dp(16f), dp(14f), dp(16f), dp(16f))
            elevation = dp(2f).toFloat()
        }

        return QuestionViewHolder(cardLayout)
    }

    override fun onBindViewHolder(holder: QuestionViewHolder, position: Int) {
        val item = items[position]
        val isSelected = selectedIdSet.contains(item.id)
        holder.bind(item, isSelected, isDarkMode, isBankMode, canDelete)
    }

    inner class QuestionViewHolder(private val card: LinearLayout) : RecyclerView.ViewHolder(card) {
        private val headerLayout: LinearLayout
        private val checkboxView: TextView
        private val badgesLayout: LinearLayout
        private val diffBadge: TextView
        private val typeBadge: TextView
        private val removeButton: TextView
        private val editButton: TextView

        private val passageContainer: LinearLayout
        private val passageTitle: TextView
        private val passageText: TextView

        private val questionTextView: TextView
        private val questionImageView: ImageView
        private val optionsContainer: LinearLayout
        private val answerBox: LinearLayout
        private val answerHeader: TextView
        private val answerText: TextView

        private val density = context.resources.displayMetrics.density
        private fun dp(v: Float): Int = (v * density).toInt()

        init {
            // Header
            headerLayout = LinearLayout(context).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL
                layoutDirection = View.LAYOUT_DIRECTION_RTL
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply {
                    bottomMargin = dp(10f)
                }
            }

            // Checkbox
            checkboxView = TextView(context).apply {
                val size = dp(22f)
                layoutParams = LinearLayout.LayoutParams(size, size).apply {
                    leftMargin = dp(10f)
                }
                gravity = Gravity.CENTER
                textSize = 14f
                typeface = fontBold
                setTextColor(Color.WHITE)
            }
            headerLayout.addView(checkboxView)

            // Badges row
            badgesLayout = LinearLayout(context).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL
                layoutDirection = View.LAYOUT_DIRECTION_RTL
                layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
            }

            diffBadge = TextView(context).apply {
                setPadding(dp(10f), dp(3f), dp(10f), dp(3f))
                textSize = 11.5f
                typeface = fontBold
                gravity = Gravity.CENTER
            }
            badgesLayout.addView(diffBadge)

            typeBadge = TextView(context).apply {
                val lp = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply {
                    rightMargin = dp(6f)
                }
                layoutParams = lp
                setPadding(dp(10f), dp(3f), dp(10f), dp(3f))
                textSize = 11.5f
                typeface = fontMedium
                gravity = Gravity.CENTER
            }
            badgesLayout.addView(typeBadge)

            headerLayout.addView(badgesLayout)

            // Edit button (for 'mine' questions)
            editButton = TextView(context).apply {
                val lp = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply {
                    leftMargin = dp(6f)
                }
                layoutParams = lp
                setPadding(dp(8f), dp(4f), dp(8f), dp(4f))
                textSize = 11.5f
                typeface = fontBold
                text = "✏️ ویرایش"
                gravity = Gravity.CENTER
            }
            headerLayout.addView(editButton)

            // Remove button (for selected list or deletion)
            removeButton = TextView(context).apply {
                setPadding(dp(8f), dp(4f), dp(8f), dp(4f))
                textSize = 11.5f
                typeface = fontBold
                text = "🗑️ حذف"
                gravity = Gravity.CENTER
            }
            headerLayout.addView(removeButton)

            card.addView(headerLayout)

            // Passage / Main Question (hidden by default unless non-empty)
            passageContainer = LinearLayout(context).apply {
                orientation = LinearLayout.VERTICAL
                layoutDirection = View.LAYOUT_DIRECTION_RTL
                setPadding(dp(12f), dp(10f), dp(12f), dp(10f))
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply {
                    bottomMargin = dp(10f)
                }
                visibility = View.GONE
            }
            passageTitle = TextView(context).apply {
                textSize = 12f
                typeface = fontBold
                text = "📖 زمینه و متن سوال:"
                setTextColor(Color.parseColor("#4F46E5"))
            }
            passageText = TextView(context).apply {
                textSize = 13f
                typeface = fontRegular
                setLineSpacing(dp(4f).toFloat(), 1f)
                setPadding(0, dp(4f), 0, 0)
            }
            passageContainer.addView(passageTitle)
            passageContainer.addView(passageText)
            card.addView(passageContainer)

            // Question Text
            questionTextView = TextView(context).apply {
                textSize = 14.5f
                typeface = fontMedium
                setLineSpacing(dp(4f).toFloat(), 1f)
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply {
                    bottomMargin = dp(8f)
                }
            }
            card.addView(questionTextView)

            // Question Image: dynamic height, only shown when image actually loads
            questionImageView = ImageView(context).apply {
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply {
                    bottomMargin = dp(10f)
                }
                adjustViewBounds = true
                maxHeight = dp(240f)
                scaleType = ImageView.ScaleType.FIT_CENTER
                visibility = View.GONE
            }
            card.addView(questionImageView)

            // Options Container (hidden by default)
            optionsContainer = LinearLayout(context).apply {
                orientation = LinearLayout.VERTICAL
                layoutDirection = View.LAYOUT_DIRECTION_RTL
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply {
                    bottomMargin = dp(8f)
                }
                visibility = View.GONE
            }
            card.addView(optionsContainer)

            // Answer Box (hidden by default)
            answerBox = LinearLayout(context).apply {
                orientation = LinearLayout.VERTICAL
                layoutDirection = View.LAYOUT_DIRECTION_RTL
                setPadding(dp(12f), dp(10f), dp(12f), dp(10f))
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply {
                    topMargin = dp(4f)
                }
                visibility = View.GONE
            }
            answerHeader = TextView(context).apply {
                textSize = 12f
                typeface = fontBold
                text = "✅ پاسخ سوال / کلید آزمون:"
                setTextColor(Color.parseColor("#15803D"))
            }
            answerText = TextView(context).apply {
                textSize = 13f
                typeface = fontRegular
                setTextColor(Color.parseColor("#166534"))
                setLineSpacing(dp(4f).toFloat(), 1f)
                setPadding(0, dp(4f), 0, 0)
            }
            answerBox.addView(answerHeader)
            answerBox.addView(answerText)
            card.addView(answerBox)
        }

        fun bind(
            item: QuestionItem,
            isSelected: Boolean,
            dark: Boolean,
            bankMode: Boolean,
            allowDelete: Boolean
        ) {
            val primaryColor = Color.parseColor("#4F46E5")

            // Card Background & Border
            val bgDrawable = GradientDrawable().apply {
                cornerRadius = dp(16f).toFloat()
                if (isSelected) {
                    setColor(if (dark) Color.parseColor("#1E293B") else Color.parseColor("#F0FDF4"))
                    setStroke(dp(2f), primaryColor)
                } else {
                    setColor(if (dark) Color.parseColor("#1E293B") else Color.WHITE)
                    setStroke(dp(1f), if (dark) Color.parseColor("#334155") else Color.parseColor("#E2E8F0"))
                }
            }
            val rippleColor = ColorStateList.valueOf(Color.parseColor("#204F46E5"))
            card.background = RippleDrawable(rippleColor, bgDrawable, null)

            // Checkbox View (visible in bank mode)
            if (bankMode) {
                checkboxView.visibility = View.VISIBLE
                val checkBg = GradientDrawable().apply {
                    cornerRadius = dp(6f).toFloat()
                    if (isSelected) {
                        setColor(primaryColor)
                        setStroke(dp(1.5f), primaryColor)
                    } else {
                        setColor(Color.TRANSPARENT)
                        setStroke(dp(1.5f), if (dark) Color.parseColor("#64748B") else Color.parseColor("#CBD5E1"))
                    }
                }
                checkboxView.background = checkBg
                checkboxView.text = if (isSelected) "✓" else ""
            } else {
                checkboxView.visibility = View.GONE
            }

            // Badges
            val diff = item.difficulty ?: "متوسط"
            val diffColors = when (diff) {
                "ساده" -> Pair(
                    if (dark) Color.parseColor("#064E3B") else Color.parseColor("#DCFCE7"),
                    if (dark) Color.parseColor("#4ADE80") else Color.parseColor("#15803D")
                )
                "دشوار" -> Pair(
                    if (dark) Color.parseColor("#7F1D1D") else Color.parseColor("#FEE2E2"),
                    if (dark) Color.parseColor("#F87171") else Color.parseColor("#B91C1C")
                )
                else -> Pair(
                    if (dark) Color.parseColor("#78350F") else Color.parseColor("#FEF3C7"),
                    if (dark) Color.parseColor("#FBBF24") else Color.parseColor("#B45309")
                )
            }
            diffBadge.text = diff
            diffBadge.setTextColor(diffColors.second)
            diffBadge.background = GradientDrawable().apply {
                cornerRadius = dp(12f).toFloat()
                setColor(diffColors.first)
            }

            val typeText = when (item.type) {
                "تستی" -> "تستی (۴ گزینه‌ای)"
                "صحیح-غلط" -> "صحیح / غلط"
                "تشریحی" -> "تشریحی"
                "جاخالی" -> "جای خالی"
                else -> item.type ?: "تستی"
            }
            typeBadge.text = typeText
            typeBadge.setTextColor(if (dark) Color.parseColor("#93C5FD") else Color.parseColor("#2563EB"))
            typeBadge.background = GradientDrawable().apply {
                cornerRadius = dp(12f).toFloat()
                setColor(if (dark) Color.parseColor("#1E3A8A") else Color.parseColor("#EFF6FF"))
            }

            // Edit button (shown when origin is 'mine' or in bankMode)
            if (item.origin == "mine") {
                editButton.visibility = View.VISIBLE
                editButton.setTextColor(Color.parseColor("#D97706"))
                editButton.background = GradientDrawable().apply {
                    cornerRadius = dp(8f).toFloat()
                    setColor(if (dark) Color.parseColor("#78350F") else Color.parseColor("#FEF3C7"))
                }
                editButton.setOnClickListener {
                    onEdit(item.id)
                }
            } else {
                editButton.visibility = View.GONE
            }

            // Remove button (always available in selected questions list, or if allowDelete is true)
            if (!bankMode || allowDelete) {
                removeButton.visibility = View.VISIBLE
                removeButton.text = if (!bankMode) "✕ حذف از آزمون" else "🗑️ حذف"
                removeButton.setTextColor(Color.parseColor("#DC2626"))
                removeButton.background = GradientDrawable().apply {
                    cornerRadius = dp(8f).toFloat()
                    setColor(if (dark) Color.parseColor("#7F1D1D") else Color.parseColor("#FEE2E2"))
                }
                removeButton.setOnClickListener {
                    onRemove(item.id)
                }
            } else {
                removeButton.visibility = View.GONE
            }

            // Passage (Main Question) - Only visible if text is truly non-empty
            val cleanedPassage = cleanHtml(item.mainQuestion)
            if (cleanedPassage.isNotBlank()) {
                passageContainer.visibility = View.VISIBLE
                passageContainer.background = GradientDrawable().apply {
                    cornerRadius = dp(10f).toFloat()
                    setColor(if (dark) Color.parseColor("#0F172A") else Color.parseColor("#F8FAFC"))
                    setStroke(dp(1f), if (dark) Color.parseColor("#334155") else Color.parseColor("#E2E8F0"))
                }
                passageText.text = cleanedPassage
                passageText.setTextColor(if (dark) Color.parseColor("#94A3B8") else Color.parseColor("#64748B"))
            } else {
                passageContainer.visibility = View.GONE
            }

            // Question Text
            val cleanedQ = cleanHtml(item.question)
            questionTextView.text = cleanedQ
            questionTextView.setTextColor(if (dark) Color.parseColor("#F8FAFC") else Color.parseColor("#0F172A"))

            // Question Image: only show if valid image actually exists and loads
            questionImageView.visibility = View.GONE
            questionImageView.setImageBitmap(null)
            if (!item.sourceImage.isNullOrBlank()) {
                ImageCacheHelper.loadImage(item.sourceImage, questionImageView) { success ->
                    if (success) {
                        questionImageView.visibility = View.VISIBLE
                        questionImageView.background = GradientDrawable().apply {
                            cornerRadius = dp(10f).toFloat()
                            setColor(if (dark) Color.parseColor("#0F172A") else Color.parseColor("#F1F5F9"))
                        }
                    } else {
                        questionImageView.visibility = View.GONE
                    }
                }
            }

            // Multiple choice options
            optionsContainer.removeAllViews()
            val validOptions = item.options.map { cleanHtml(it).trim() }.filter { it.isNotBlank() }
            val cleanedAnswer = cleanHtml(item.answer).trim()

            var anyOptionHighlighted = false
            if (validOptions.isNotEmpty()) {
                optionsContainer.visibility = View.VISIBLE
                val persianDigits = listOf("۱", "۲", "۳", "۴", "۵", "۶")

                validOptions.forEachIndexed { idx, optText ->
                    val isCorrect = checkIsOptionCorrect(optText, idx, cleanedAnswer)
                    if (isCorrect) anyOptionHighlighted = true

                    val optRow = LinearLayout(context).apply {
                        orientation = LinearLayout.HORIZONTAL
                        gravity = Gravity.CENTER_VERTICAL
                        layoutDirection = View.LAYOUT_DIRECTION_RTL
                        layoutParams = LinearLayout.LayoutParams(
                            LinearLayout.LayoutParams.MATCH_PARENT,
                            LinearLayout.LayoutParams.WRAP_CONTENT
                        ).apply {
                            bottomMargin = dp(6f)
                        }
                        setPadding(dp(10f), dp(8f), dp(10f), dp(8f))

                        background = GradientDrawable().apply {
                            cornerRadius = dp(8f).toFloat()
                            if (isCorrect) {
                                setColor(if (dark) Color.parseColor("#064E3B") else Color.parseColor("#F0FDF4"))
                                setStroke(dp(1.5f), Color.parseColor("#16A34A"))
                            } else {
                                setColor(if (dark) Color.parseColor("#0F172A") else Color.parseColor("#F8FAFC"))
                                setStroke(dp(1f), if (dark) Color.parseColor("#334155") else Color.parseColor("#E2E8F0"))
                            }
                        }
                    }

                    // Number badge
                    val badge = TextView(context).apply {
                        val sz = dp(22f)
                        layoutParams = LinearLayout.LayoutParams(sz, sz).apply {
                            leftMargin = dp(8f)
                        }
                        gravity = Gravity.CENTER
                        textSize = 12f
                        typeface = fontBold
                        text = persianDigits.getOrNull(idx) ?: (idx + 1).toString()
                        setTextColor(if (isCorrect) Color.WHITE else if (dark) Color.parseColor("#E2E8F0") else Color.parseColor("#334155"))
                        background = GradientDrawable().apply {
                            cornerRadius = dp(11f).toFloat()
                            setColor(if (isCorrect) Color.parseColor("#16A34A") else if (dark) Color.parseColor("#334155") else Color.parseColor("#E2E8F0"))
                        }
                    }
                    optRow.addView(badge)

                    // Option Text
                    val txt = TextView(context).apply {
                        layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
                        textSize = 13.5f
                        typeface = fontRegular
                        text = optText
                        setTextColor(if (isCorrect) (if (dark) Color.parseColor("#86EFAC") else Color.parseColor("#15803D")) else if (dark) Color.parseColor("#E2E8F0") else Color.parseColor("#1E293B"))
                    }
                    optRow.addView(txt)

                    // Correct answer indicator
                    if (isCorrect) {
                        val correctPill = TextView(context).apply {
                            setPadding(dp(6f), dp(2f), dp(6f), dp(2f))
                            textSize = 11f
                            typeface = fontBold
                            text = "✓ پاسخ صحیح"
                            setTextColor(Color.parseColor("#16A34A"))
                        }
                        optRow.addView(correctPill)
                    }

                    optionsContainer.addView(optRow)
                }
            } else {
                optionsContainer.visibility = View.GONE
            }

            // Answer Box: Only display if answer has actual meaningful content
            // For test questions: don't show redundant empty/short box if already highlighted
            val showAnswer = cleanedAnswer.isNotBlank() && (
                if (item.type == "تستی") {
                    !anyOptionHighlighted && cleanedAnswer.length > 20
                } else {
                    cleanedAnswer.isNotBlank()
                }
            )

            if (showAnswer) {
                answerBox.visibility = View.VISIBLE
                answerBox.background = GradientDrawable().apply {
                    cornerRadius = dp(10f).toFloat()
                    setColor(if (dark) Color.parseColor("#064E3B") else Color.parseColor("#F0FDF4"))
                    setStroke(dp(1f), if (dark) Color.parseColor("#166534") else Color.parseColor("#BBF7D0"))
                }
                answerText.text = cleanedAnswer
                answerText.setTextColor(if (dark) Color.parseColor("#86EFAC") else Color.parseColor("#166534"))
            } else {
                answerBox.visibility = View.GONE
            }

            // Card click listener
            card.setOnClickListener {
                if (bankMode) {
                    val newState = toggleSelectionLocally(item.id)
                    onToggleSelect(item.id, newState)
                }
            }
        }

        private fun cleanHtml(html: String?): String {
            if (html.isNullOrBlank() || 
                html.equals("null", ignoreCase = true) || 
                html.equals("undefined", ignoreCase = true)) {
                return ""
            }
            return html
                .replace(Regex("<br\\s*/?>", RegexOption.IGNORE_CASE), "\n")
                .replace(Regex("</p>", RegexOption.IGNORE_CASE), "\n")
                .replace(Regex("</div>", RegexOption.IGNORE_CASE), "\n")
                .replace(Regex("</li>", RegexOption.IGNORE_CASE), "\n")
                .replace(Regex("<li>", RegexOption.IGNORE_CASE), "• ")
                .replace(Regex("<[^>]+>"), "")
                .replace("&nbsp;", " ")
                .replace("&zwnj;", "\u200C")
                .replace("&amp;", "&")
                .replace("&lt;", "<")
                .replace("&gt;", ">")
                .replace("&quot;", "\"")
                .replace("&#39;", "'")
                .replace(Regex("\n\\s*\n"), "\n")
                .trim()
        }

        private fun checkIsOptionCorrect(optText: String, optIndex: Int, answerText: String?): Boolean {
            if (answerText.isNullOrBlank()) return false
            val cleanAns = cleanHtml(answerText).trim()
            val cleanOpt = cleanHtml(optText).trim()
            if (cleanAns.isNotEmpty() && cleanOpt.isNotEmpty() && cleanAns == cleanOpt) return true
            if (cleanAns == (optIndex + 1).toString()) return true
            if (cleanAns.contains("گزینه ${optIndex + 1}")) return true

            val persianDigits = listOf("۱", "۲", "۳", "۴")
            if (optIndex in persianDigits.indices) {
                if (cleanAns == persianDigits[optIndex]) return true
                if (cleanAns.contains("گزینه ${persianDigits[optIndex]}")) return true
            }

            val persianLetters = listOf("الف", "ب", "ج", "د")
            if (optIndex in persianLetters.indices) {
                if (cleanAns == persianLetters[optIndex]) return true
                if (cleanAns.contains("گزینه ${persianLetters[optIndex]}")) return true
            }

            return false
        }
    }
}
