package com.kitayar.modules.prayertimes.ui

import android.app.Activity
import android.content.res.ColorStateList
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.graphics.drawable.RippleDrawable
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.*
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.kitayar.modules.prayertimes.data.repository.CityRepository
import com.kitayar.modules.prayertimes.data.repository.UserPreferencesRepository
import com.kitayar.modules.prayertimes.domain.PrayerTimesCalculator
import com.kitayar.modules.prayertimes.domain.model.PrayerTimesResult

/**
 * صفحه اصلی اوقات شرعی ایران در کیتایار (PrayerTimesActivity)
 *
 * شامل ۳ حالت یکپارچه:
 * 1. نمایش اوقات شرعی روزانه (صبح، طلوع، ظهر، غروب، مغرب، نیمه‌شب شرعی) همراه با کارت اذان بعدی و تاریخ‌های شمسی و قمری
 * 2. جستجو و انتخاب از بین ۳۱ استان کشور
 * 3. جستجو و انتخاب شهرستان‌های استان مربوطه
 */
class PrayerTimesActivity : Activity() {

    private lateinit var viewModel: PrayerTimesViewModel

    private lateinit var rootLayout: LinearLayout
    private lateinit var headerTitle: TextView
    private lateinit var headerSubtitle: TextView
    private lateinit var btnBack: TextView

    // بخش اوقات شرعی (Screen 3)
    private lateinit var prayerTimesScrollView: ScrollView
    private lateinit var prayerTimesContainer: LinearLayout
    private lateinit var txtCityName: TextView
    private lateinit var btnChangeCity: LinearLayout
    private lateinit var txtNextPrayerTitle: TextView
    private lateinit var txtNextPrayerTime: TextView
    private lateinit var txtNextPrayerRemaining: TextView
    private lateinit var txtDateShamsi: TextView
    private lateinit var txtDateHijri: TextView
    private lateinit var prayerCardsContainer: LinearLayout

    // بخش جستجو و لیست استان‌ها و شهرها (Screen 1 & 2)
    private lateinit var listContainer: LinearLayout
    private lateinit var searchEditText: EditText
    private lateinit var recyclerView: RecyclerView
    private lateinit var listAdapter: CityItemAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val cityRepo = CityRepository(this)
        val prefRepo = UserPreferencesRepository(this)
        val calculator = PrayerTimesCalculator()

        viewModel = PrayerTimesViewModel(cityRepo, prefRepo, calculator)

        buildViews()

        viewModel.onStateChanged = {
            runOnUiThread {
                renderState()
            }
        }

        viewModel.initialize()
    }

    private fun buildViews() {
        rootLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.parseColor("#F8FAFC"))
            fitsSystemWindows = true
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        }

        // 1. سربرگ (Header) بالا
        val header = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            setPadding(32, 28, 32, 28)
            setBackgroundColor(Color.WHITE)
            gravity = Gravity.CENTER_VERTICAL
            elevation = 4f
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            )
        }

        btnBack = TextView(this).apply {
            text = "→"
            textSize = 24f
            setTextColor(Color.parseColor("#1F2937"))
            typeface = Typeface.DEFAULT_BOLD
            setPadding(16, 8, 16, 8)
            setOnClickListener {
                if (!viewModel.handleBackPress()) {
                    finish()
                }
            }
        }
        header.addView(btnBack)

        val headerTextCol = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
            gravity = Gravity.RIGHT or Gravity.CENTER_VERTICAL
        }

        headerTitle = TextView(this).apply {
            text = "اوقات شرعی"
            textSize = 18f
            setTextColor(Color.parseColor("#0F172A"))
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.RIGHT
        }

        headerSubtitle = TextView(this).apply {
            text = "محاسبه دقیق و آفلاین بر اساس افق ایران"
            textSize = 12f
            setTextColor(Color.parseColor("#64748B"))
            gravity = Gravity.RIGHT
        }

        headerTextCol.addView(headerTitle)
        headerTextCol.addView(headerSubtitle)
        header.addView(headerTextCol)
        rootLayout.addView(header)

        // 2. کانتینر اصلی اوقات شرعی (ScrollView)
        prayerTimesScrollView = ScrollView(this).apply {
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            isFillViewport = true
        }

        prayerTimesContainer = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(28, 24, 28, 36)
        }

        // نوار شهر و دکمه تغییر شهر
        val cityBarCard = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(28, 20, 28, 20)
            background = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                cornerRadius = 24f
                setColor(Color.WHITE)
                setStroke(1, Color.parseColor("#E2E8F0"))
            }
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply {
                bottomMargin = 24
            }
        }

        btnChangeCity = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
            setPadding(24, 12, 24, 12)
            background = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                cornerRadius = 16f
                setColor(Color.parseColor("#EEF2F6"))
            }
            val txtBtn = TextView(this@PrayerTimesActivity).apply {
                text = "تغییر شهر"
                textSize = 13f
                setTextColor(Color.parseColor("#0D9488"))
                typeface = Typeface.DEFAULT_BOLD
            }
            addView(txtBtn)
            setOnClickListener {
                viewModel.openProvinceSelection()
            }
        }
        cityBarCard.addView(btnChangeCity)

        val cityTextCol = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
            gravity = Gravity.RIGHT
        }

        txtCityName = TextView(this).apply {
            textSize = 18f
            setTextColor(Color.parseColor("#0F172A"))
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.RIGHT
        }

        txtDateShamsi = TextView(this).apply {
            textSize = 13f
            setTextColor(Color.parseColor("#475569"))
            gravity = Gravity.RIGHT
            setPadding(0, 4, 0, 0)
        }

        txtDateHijri = TextView(this).apply {
            textSize = 12f
            setTextColor(Color.parseColor("#94A3B8"))
            gravity = Gravity.RIGHT
            setPadding(0, 2, 0, 0)
        }

        cityTextCol.addView(txtCityName)
        cityTextCol.addView(txtDateShamsi)
        cityTextCol.addView(txtDateHijri)
        cityBarCard.addView(cityTextCol)
        prayerTimesContainer.addView(cityBarCard)

        // کارت ویژه اذان بعدی (Hero Banner)
        val heroCard = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            setPadding(36, 32, 36, 32)
            background = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                cornerRadius = 32f
                colors = intArrayOf(Color.parseColor("#0F766E"), Color.parseColor("#14B8A6"))
                orientation = GradientDrawable.Orientation.TL_BR
            }
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply {
                bottomMargin = 24
            }
            elevation = 6f
        }

        txtNextPrayerTitle = TextView(this).apply {
            textSize = 15f
            setTextColor(Color.parseColor("#CCFBF1"))
            typeface = Typeface.DEFAULT_BOLD
        }

        txtNextPrayerTime = TextView(this).apply {
            textSize = 42f
            setTextColor(Color.WHITE)
            typeface = Typeface.DEFAULT_BOLD
            setPadding(0, 10, 0, 10)
        }

        txtNextPrayerRemaining = TextView(this).apply {
            textSize = 14f
            setTextColor(Color.parseColor("#E6FFFA"))
            setPadding(24, 8, 24, 8)
            background = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                cornerRadius = 20f
                setColor(Color.parseColor("#1A000000"))
            }
        }

        heroCard.addView(txtNextPrayerTitle)
        heroCard.addView(txtNextPrayerTime)
        heroCard.addView(txtNextPrayerRemaining)
        prayerTimesContainer.addView(heroCard)

        // بخش قرارگیری کارت‌های ۶ گانه اوقات شرعی
        prayerCardsContainer = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            )
        }
        prayerTimesContainer.addView(prayerCardsContainer)

        // پانویس و توضیحات مؤسسه ژئوفیزیک دانشگاه تهران
        val noteCard = TextView(this).apply {
            text = "محاسبه بر مبنای استاندارد مؤسسه ژئوفیزیک دانشگاه تهران (فجر ۱۷.۷°، عشاء ۱۴.۰°، مغرب ۴.۵° زیر افق). اختلاف ۱ الی ۳ دقیقه با تقویم به دلیل تقریب ثانیه‌ها طبیعی است."
            textSize = 11.5f
            setTextColor(Color.parseColor("#64748B"))
            gravity = Gravity.CENTER
            setPadding(20, 24, 20, 16)
            setLineSpacing(6f, 1f)
        }
        prayerTimesContainer.addView(noteCard)

        prayerTimesScrollView.addView(prayerTimesContainer)
        rootLayout.addView(prayerTimesScrollView)

        // 3. کانتینر جستجو و لیست (برای استان‌ها و شهرها)
        listContainer = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            visibility = View.GONE
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        }

        val searchWrapper = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            setPadding(24, 16, 24, 16)
            setBackgroundColor(Color.WHITE)
            elevation = 2f
        }

        searchEditText = EditText(this).apply {
            hint = "جستجو..."
            textSize = 15f
            setTextColor(Color.parseColor("#1F2937"))
            setHintTextColor(Color.parseColor("#9CA3AF"))
            gravity = Gravity.RIGHT or Gravity.CENTER_VERTICAL
            setPadding(32, 22, 32, 22)
            background = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                cornerRadius = 20f
                setColor(Color.parseColor("#F1F5F9"))
                setStroke(1, Color.parseColor("#E2E8F0"))
            }
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            )

            addTextChangedListener(object : TextWatcher {
                override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
                override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                    viewModel.onSearchQueryChanged(s?.toString() ?: "")
                }
                override fun afterTextChanged(s: Editable?) {}
            })
        }
        searchWrapper.addView(searchEditText)
        listContainer.addView(searchWrapper)

        recyclerView = RecyclerView(this).apply {
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                0,
                1f
            )
            layoutManager = LinearLayoutManager(this@PrayerTimesActivity)
            clipToPadding = false
            setPadding(0, 16, 0, 24)
        }

        listAdapter = CityItemAdapter(
            context = this,
            onProvinceClicked = { province ->
                viewModel.selectProvince(province)
            },
            onCityClicked = { city ->
                viewModel.selectCity(city)
            }
        )
        recyclerView.adapter = listAdapter
        listContainer.addView(recyclerView)
        rootLayout.addView(listContainer)

        setContentView(rootLayout)
    }

    private fun renderState() {
        when (viewModel.currentState) {
            PrayerTimesViewModel.ScreenState.PRAYER_TIMES -> {
                prayerTimesScrollView.visibility = View.VISIBLE
                listContainer.visibility = View.GONE

                headerTitle.text = "اوقات شرعی"
                headerSubtitle.text = "محاسبه آفلاین به افق ${viewModel.currentCity.name}"

                val res = viewModel.prayerTimesResult
                if (res != null) {
                    txtCityName.text = "${viewModel.currentCity.name} (استان ${viewModel.currentProvinceName})"
                    txtDateShamsi.text = res.shamsiDateFormatted
                    txtDateHijri.text = if (res.hijriDateFormatted.isNotEmpty()) "قمری: ${res.hijriDateFormatted}" else ""

                    txtNextPrayerTitle.text = "اذان بعدی: ${res.nextPrayerName}"
                    txtNextPrayerTime.text = res.nextPrayerTime
                    txtNextPrayerRemaining.text = "زمان باقیمانده: ${res.nextPrayerRemainingFormatted}"

                    populatePrayerCards(res)
                }
            }

            PrayerTimesViewModel.ScreenState.PROVINCES -> {
                prayerTimesScrollView.visibility = View.GONE
                listContainer.visibility = View.VISIBLE

                headerTitle.text = "انتخاب استان"
                headerSubtitle.text = "۳۱ استان تحت پوشش ایران"
                searchEditText.hint = "جستجوی استان (مثلاً: اصفهان، فارس)..."

                listAdapter.setProvinces(viewModel.filteredProvinces)
            }

            PrayerTimesViewModel.ScreenState.CITIES -> {
                prayerTimesScrollView.visibility = View.GONE
                listContainer.visibility = View.VISIBLE

                headerTitle.text = "انتخاب شهر"
                headerSubtitle.text = "استان ${viewModel.currentProvinceName}"
                searchEditText.hint = "جستجوی شهر در استان ${viewModel.currentProvinceName}..."

                listAdapter.setCities(viewModel.filteredCities)
            }
        }
    }

    private fun populatePrayerCards(result: PrayerTimesResult) {
        prayerCardsContainer.removeAllViews()

        val cardsData = listOf(
            PrayerCardData("اذان صبح (فجر)", "سحرگاه و وقت نماز صبح", result.fajr, "#3B82F6", "#EFF6FF"),
            PrayerCardData("طلوع آفتاب", "پایان وقت فضیلت نماز صبح", result.sunrise, "#F59E0B", "#FFFBEB"),
            PrayerCardData("اذان ظهر", "زوال خورشید و وقت نماز ظهر", result.dhuhr, "#0D9488", "#F0FDFA"),
            PrayerCardData("غروب آفتاب", "پایان وقت نماز عصر", result.sunset, "#EA580C", "#FFF7ED"),
            PrayerCardData("اذان مغرب", "وقت نماز مغرب (حمره‌ی مشرقیه)", result.maghrib, "#8B5CF6", "#F5F3FF"),
            PrayerCardData("اذان عشاء", "اقامه نماز عشاء", result.isha, "#6366F1", "#EEF2FF"),
            PrayerCardData("نیمه‌شب شرعی", "پایان وقت نماز عشاء", result.midnight, "#475569", "#F8FAFC")
        )

        for (data in cardsData) {
            val card = createPrayerItemCard(data)
            prayerCardsContainer.addView(card)
        }
    }

    private data class PrayerCardData(
        val title: String,
        val description: String,
        val time: String,
        val accentColor: String,
        val bgColor: String
    )

    private fun createPrayerItemCard(data: PrayerCardData): View {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(28, 22, 28, 22)
            background = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                cornerRadius = 24f
                setColor(Color.WHITE)
                setStroke(1, Color.parseColor("#E2E8F0"))
            }
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply {
                bottomMargin = 14
            }
            elevation = 1.5f
        }

        // زمان به صورت بولد و برجسته در سمت چپ
        val txtTime = TextView(this).apply {
            text = data.time
            textSize = 21f
            setTextColor(Color.parseColor("#0F172A"))
            typeface = Typeface.DEFAULT_BOLD
            setPadding(12, 0, 12, 0)
        }
        root.addView(txtTime)

        // عنوان و توضیح در سمت راست
        val textContainer = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
            gravity = Gravity.RIGHT
        }

        val txtTitle = TextView(this).apply {
            text = data.title
            textSize = 15f
            setTextColor(Color.parseColor("#1E293B"))
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.RIGHT
        }

        val txtDesc = TextView(this).apply {
            text = data.description
            textSize = 12f
            setTextColor(Color.parseColor("#64748B"))
            gravity = Gravity.RIGHT
            setPadding(0, 4, 0, 0)
        }

        textContainer.addView(txtTitle)
        textContainer.addView(txtDesc)
        root.addView(textContainer)

        // نشانگر رنگی عمودی در لبه راست
        val colorIndicator = View(this).apply {
            background = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                cornerRadius = 8f
                setColor(Color.parseColor(data.accentColor))
            }
            layoutParams = LinearLayout.LayoutParams(10, 50).apply {
                leftMargin = 20
            }
        }
        root.addView(colorIndicator)

        return root
    }

    override fun onBackPressed() {
        if (!viewModel.handleBackPress()) {
            super.onBackPressed()
        }
    }
}
