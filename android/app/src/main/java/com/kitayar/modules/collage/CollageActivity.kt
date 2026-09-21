package com.kitayar.modules.collage

import android.app.Activity
import android.content.ContentValues
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import android.view.Gravity
import android.view.ViewGroup
import android.widget.*
import com.facebook.react.bridge.Promise
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream

class CollageActivity : Activity() {

    companion object {
        var currentPromise: Promise? = null
        private const val PICK_IMAGES_REQUEST = 1001
    }

    private lateinit var rootLayout: LinearLayout
    private lateinit var contentFrame: FrameLayout

    private var selectedRatioWidth = 1f
    private var selectedRatioHeight = 1f
    private var selectedCount = 2
    
    private var imageUris = mutableListOf<Uri>()
    private var loadedBitmaps = mutableListOf<Bitmap>()
    private var collageView: CollageView? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        rootLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.parseColor("#F8F9FA"))
            fitsSystemWindows = true
        }

        // --- هدر ---
        val header = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            setPadding(dpToPx(20), dpToPx(15), dpToPx(20), dpToPx(15))
            setBackgroundColor(Color.WHITE)
            gravity = Gravity.CENTER_VERTICAL
            elevation = dpToPx(4).toFloat()
        }

        val btnClose = Button(this).apply {
            text = "لغو"
            setTextColor(Color.parseColor("#7F8C8D"))
            background = getRoundedDrawable("#F1F2F6", dpToPx(10).toFloat())
            layoutParams = LinearLayout.LayoutParams(dpToPx(80), dpToPx(40))
            setOnClickListener { 
                currentPromise?.reject("CANCEL", "کاربر لغو کرد")
                currentPromise = null
                finish() 
            }
        }

        val txtTitle = TextView(this).apply {
            text = "ساخت کلاژ عکس"
            textSize = 18f
            setTextColor(Color.parseColor("#2C3E50"))
            gravity = Gravity.RIGHT or Gravity.CENTER_VERTICAL
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
            setPadding(0, 0, dpToPx(15), 0)
            setTypeface(null, android.graphics.Typeface.BOLD)
        }

        header.addView(btnClose)
        header.addView(txtTitle)
        rootLayout.addView(header)

        // --- قاب محتوا ---
        contentFrame = FrameLayout(this).apply {
            layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f)
        }
        rootLayout.addView(contentFrame)

        setContentView(rootLayout)
        
        // نمایش صفحه اول: انتخاب نسبت تصویر (شکل کادر)
        showRatioSelection()
    }

    // متد کمکی برای تبدیل dp به پیکسل برای طراحی واکنش‌گرا
    private fun dpToPx(dp: Int): Int {
        return (dp * resources.displayMetrics.density).toInt()
    }

    private fun getRoundedDrawable(colorHex: String, radius: Float): GradientDrawable {
        return GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            setColor(Color.parseColor(colorHex))
            cornerRadius = radius
        }
    }

    // --- مرحله ۱: انتخاب نسبت تصویر (UI بصری) ---
    private fun showRatioSelection() {
        contentFrame.removeAllViews()
        
        // لیست نسبت‌های تصویر
        val ratios = listOf(
            Triple("مربع (1:1)", 1f, 1f),
            Triple("استوری (9:16)", 9f, 16f),
            Triple("یوتیوب (16:9)", 16f, 9f),
            Triple("پست (4:5)", 4f, 5f),
            Triple("کلاسیک (2:3)", 2f, 3f)
        )

        val scroll = ScrollView(this).apply {
            layoutParams = ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
        }
        
        val container = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            setPadding(dpToPx(20), dpToPx(40), dpToPx(20), dpToPx(40))
        }

        val title = TextView(this).apply {
            text = "قالب و سایز نهایی را انتخاب کنید:"
            textSize = 17f
            setTextColor(Color.parseColor("#34495E"))
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, dpToPx(30))
            setTypeface(null, android.graphics.Typeface.BOLD)
        }
        container.addView(title)

        // ایجاد ردیف‌ها برای چیدمان دکمه‌ها
        val row1 = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER; setPadding(0, 0, 0, dpToPx(25)) }
        val row2 = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER; setPadding(0, 0, 0, dpToPx(25)) }
        val row3 = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER }

        val baseSize = dpToPx(110) // سایز پایه برای رسم مستطیل‌ها

        ratios.forEachIndexed { index, (name, rw, rh) ->
            val wrapper = LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                gravity = Gravity.CENTER
                setPadding(dpToPx(10), dpToPx(10), dpToPx(10), dpToPx(10))
            }

            // محاسبه ابعاد فیزیکی دکمه بر اساس نسبت تصویر تا کاربر شکل واقعی را ببیند
            val isWide = rw > rh
            val finalW = if (isWide) baseSize else (baseSize * (rw / rh)).toInt()
            val finalH = if (isWide) (baseSize * (rh / rw)).toInt() else baseSize

            val shapeBtn = FrameLayout(this).apply {
                layoutParams = LinearLayout.LayoutParams(finalW, finalH).apply {
                    setMargins(dpToPx(10), dpToPx(10), dpToPx(10), dpToPx(15))
                }
                background = getRoundedDrawable("#3498DB", dpToPx(8).toFloat()) // رنگ آبی اصلی
                elevation = dpToPx(5).toFloat()
            }
            
            val label = TextView(this).apply {
                text = name
                textSize = 14f
                setTextColor(Color.parseColor("#2C3E50"))
                gravity = Gravity.CENTER
                setTypeface(null, android.graphics.Typeface.BOLD)
            }
            
            wrapper.addView(shapeBtn)
            wrapper.addView(label)
            
            // با کلیک روی هر کادر، مستقیماً به گالری می‌رویم
            val clickListener = android.view.View.OnClickListener {
                selectedRatioWidth = rw
                selectedRatioHeight = rh
                launchPhotoPicker()
            }
            
            shapeBtn.setOnClickListener(clickListener)
            wrapper.setOnClickListener(clickListener)

            // توزیع در ردیف‌ها
            when (index) {
                0, 1 -> row1.addView(wrapper)
                2, 3 -> row2.addView(wrapper)
                4 -> row3.addView(wrapper)
            }
        }
        
        container.addView(row1)
        container.addView(row2)
        container.addView(row3)
        scroll.addView(container)
        contentFrame.addView(scroll)
    }

    // --- مرحله ۲: باز کردن گالری (بدون نیاز به پرسش تعداد) ---
    private fun launchPhotoPicker() {
        val intent = Intent(Intent.ACTION_GET_CONTENT).apply {
            type = "image/*"
            putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true)
        }
        startActivityForResult(Intent.createChooser(intent, "حداکثر ۶ عکس انتخاب کنید"), PICK_IMAGES_REQUEST)
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == PICK_IMAGES_REQUEST && resultCode == RESULT_OK) {
            imageUris.clear()
            
            // دریافت عکس‌های انتخاب شده از گالری
            if (data?.clipData != null) {
                val count = Math.min(data.clipData!!.itemCount, 6) // محدودیت سقف ۶ عکس
                for (i in 0 until count) {
                    imageUris.add(data.clipData!!.getItemAt(i).uri)
                }
            } else if (data?.data != null) {
                imageUris.add(data.data!!)
            }

            if (imageUris.size < 2) {
                Toast.makeText(this, "لطفاً حداقل ۲ عکس انتخاب کنید", Toast.LENGTH_LONG).show()
                return // کاربر در همان صفحه انتخاب کادر می‌ماند تا دوباره تلاش کند
            }
            
            selectedCount = imageUris.size 
            loadBitmapsAndStartEditor()
        }
    }

    // لود کردن امن عکس‌ها جهت جلوگیری از کرش کردن حافظه (OOM)
    private fun loadBitmapsAndStartEditor() {
        Toast.makeText(this, "در حال بارگذاری تصاویر...", Toast.LENGTH_SHORT).show()
        Thread {
            loadedBitmaps.forEach { it.recycle() }
            loadedBitmaps.clear()

            imageUris.forEach { uri ->
                try {
                    val input = contentResolver.openInputStream(uri)
                    val options = BitmapFactory.Options().apply { inJustDecodeBounds = true }
                    BitmapFactory.decodeStream(input, null, options)
                    input?.close()
                    
                    val reqSize = 1000 
                    var sampleSize = 1
                    while (options.outWidth / sampleSize > reqSize || options.outHeight / sampleSize > reqSize) {
                        sampleSize *= 2
                    }
                    
                    val loadOptions = BitmapFactory.Options().apply { inSampleSize = sampleSize }
                    val input2 = contentResolver.openInputStream(uri)
                    val bitmap = BitmapFactory.decodeStream(input2, null, loadOptions)
                    input2?.close()
                    if (bitmap != null) loadedBitmaps.add(bitmap)
                } catch (e: Exception) { }
            }
            
            runOnUiThread { showEditor() }
        }.start()
    }

    // --- مرحله ۳: ویرایشگر کلاژ ---
    private fun showEditor() {
        contentFrame.removeAllViews()

        val editorLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
            setBackgroundColor(Color.parseColor("#ECF0F1"))
        }

        // فضای نمایش کلاژ
        val collageContainer = FrameLayout(this).apply {
            layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f)
            setBackgroundColor(Color.parseColor("#ECF0F1"))
        }

        collageView = CollageView(this)
        
        // محاسبه ابعاد دقیق CollageView بر اساس نسبت تصویر انتخاب شده
        collageContainer.post {
            val cw = collageContainer.width.toFloat()
            val ch = collageContainer.height.toFloat()
            
            // مقداری حاشیه (Margin) در نظر می‌گیریم
            val padding = dpToPx(40).toFloat()
            val scale = Math.min((cw - padding) / selectedRatioWidth, (ch - padding) / selectedRatioHeight)
            val finalW = (selectedRatioWidth * scale).toInt()
            val finalH = (selectedRatioHeight * scale).toInt()

            val param = FrameLayout.LayoutParams(finalW, finalH).apply {
                gravity = Gravity.CENTER
            }
            collageView!!.layoutParams = param
            
            // گرفتن قالب متناسب با تعداد عکس‌ها (فقط قالب اول)
            val templates = CollageTemplates.getTemplatesForCount(selectedCount)
            if (templates.isNotEmpty()) {
                collageView!!.setTemplateAndImages(templates[0], loadedBitmaps)
            }
            
            collageContainer.addView(collageView)
        }
        editorLayout.addView(collageContainer)

        // متن راهنما
        val tipText = TextView(this).apply {
            text = "راهنما: جابجایی (یک انگشت) | زوم (دو انگشت)\nتعویض عکس‌ها با یکدیگر (نگه داشتن و کشیدن)"
            textSize = 13f
            setTextColor(Color.parseColor("#7F8C8D"))
            gravity = Gravity.CENTER
            setPadding(0, dpToPx(15), 0, dpToPx(15))
        }
        editorLayout.addView(tipText)

        // دکمه ذخیره بزرگ و جذاب
        val btnSave = Button(this).apply {
            text = "ذخیره در گالری"
            setTextColor(Color.WHITE)
            textSize = 16f
            setTypeface(null, android.graphics.Typeface.BOLD)
            background = getRoundedDrawable("#27AE60", dpToPx(12).toFloat()) // رنگ سبز برای تایید
            layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dpToPx(55)).apply {
                setMargins(dpToPx(20), dpToPx(10), dpToPx(20), dpToPx(25))
            }
            elevation = dpToPx(4).toFloat()
            
            setOnClickListener { saveCollage() }
        }
        editorLayout.addView(btnSave)

        contentFrame.addView(editorLayout)
    }

    private fun saveCollage() {
        collageView?.let { view ->
            val bitmap = view.getCollageBitmap()
            Toast.makeText(this, "در حال ذخیره...", Toast.LENGTH_SHORT).show()
            
            Thread {
                try {
                    // 1. ذخیره موقت
                    val file = File(cacheDir, "collage_${System.currentTimeMillis()}.jpg")
                    val fos = FileOutputStream(file)
                    bitmap.compress(Bitmap.CompressFormat.JPEG, 100, fos)
                    fos.flush()
                    fos.close()
                    
                    // 2. کپی به گالری و MediaStore
                    val contentValues = ContentValues().apply {
                        put(MediaStore.MediaColumns.DISPLAY_NAME, file.name)
                        put(MediaStore.MediaColumns.MIME_TYPE, "image/jpeg")
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                            put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/Kitayar")
                        }
                    }

                    val uri = contentResolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, contentValues)
                    if (uri != null) {
                        contentResolver.openOutputStream(uri).use { outStream ->
                            FileInputStream(file).use { inStream ->
                                inStream.copyTo(outStream!!)
                            }
                        }
                    }

                    runOnUiThread {
                        Toast.makeText(this, "کلاژ ساخته شد!", Toast.LENGTH_LONG).show()
                        currentPromise?.resolve(file.absolutePath)
                        currentPromise = null
                        finish()
                    }
                } catch (e: Exception) {
                    runOnUiThread { Toast.makeText(this, "خطا در پردازش تصویر", Toast.LENGTH_SHORT).show() }
                }
            }.start()
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        loadedBitmaps.forEach { it.recycle() }
        loadedBitmaps.clear()
        currentPromise?.reject("CANCELLED", "اکتیویتی بسته شد")
        currentPromise = null
    }
}