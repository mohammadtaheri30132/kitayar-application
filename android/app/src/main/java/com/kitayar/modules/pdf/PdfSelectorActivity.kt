package com.kitayar.modules.pdf

import android.app.Activity
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.graphics.pdf.PdfRenderer
import android.net.Uri
import android.os.Bundle
import android.os.ParcelFileDescriptor
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.*
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import java.io.File
import java.io.FileOutputStream
import java.util.concurrent.Executors

class PdfSelectorActivity : Activity() {

    companion object {
        var currentPromise: Promise? = null
    }

    private var pdfRenderer: PdfRenderer? = null
    private var fileDescriptor: ParcelFileDescriptor? = null
    private val executor = Executors.newSingleThreadExecutor()
    private lateinit var adapter: PdfAdapter
    private lateinit var outputName: String

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        val pdfUri = intent.getStringExtra("pdfUri") ?: return finish()
        outputName = intent.getStringExtra("outputName") ?: "kitayar_img"

        try {
            val uri = Uri.parse(pdfUri)
            fileDescriptor = contentResolver.openFileDescriptor(uri, "r")
            pdfRenderer = PdfRenderer(fileDescriptor!!)
        } catch (e: Exception) {
            Toast.makeText(this, "خطا در باز کردن PDF", Toast.LENGTH_SHORT).show()
            return finish()
        }

        setupUI()
    }

    // متد کمکی برای ساخت پس‌زمینه دکمه‌های گرد
    private fun getRoundedDrawable(colorHex: String, radius: Float): GradientDrawable {
        return GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            setColor(Color.parseColor(colorHex))
            cornerRadius = radius
        }
    }

    // متد کمکی برای ساخت حاشیه نقطه‌چین دور صفحات
    private fun getDashedBorderDrawable(): GradientDrawable {
        return GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            setColor(Color.WHITE)
            cornerRadius = 24f
            // ضخامت خط، رنگ خط، طول خط‌چین، فاصله بین خط‌چین‌ها
            setStroke(4, Color.parseColor("#BDC3C7"), 20f, 15f)
        }
    }

    private fun setupUI() {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.parseColor("#F5F6FA"))
            // این خط باعث می‌شود محتوا زیر استاتوس‌بار (Status Bar) نرود
            fitsSystemWindows = true 
        }

        // --- هدر ---
        val header = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            setPadding(40, 40, 40, 40)
            setBackgroundColor(Color.WHITE)
            gravity = Gravity.CENTER_VERTICAL
            elevation = 4f
        }
        
        val btnSelectAll = Button(this).apply { 
            text = "انتخاب همه"
            setTextColor(Color.WHITE)
            background = getRoundedDrawable("#3498DB", 16f) // رنگ آبی دیزاین با گوشه گرد
            setPadding(30, 0, 30, 0)
        }
        
        val txtTitle = TextView(this).apply { 
            text = "انتخاب صفحات استخراجی"
            textSize = 17f
            setTextColor(Color.parseColor("#2C3E50"))
            gravity = Gravity.RIGHT
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
            setPadding(0, 0, 30, 0)
        }
        
        header.addView(btnSelectAll)
        header.addView(txtTitle)
        root.addView(header)

        // --- لیست صفحات ---
        val listView = ListView(this).apply {
            layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f)
            divider = null // حذف خط پیش‌فرض بین آیتم‌ها
            clipToPadding = false
            setPadding(0, 20, 0, 20)
        }
        adapter = PdfAdapter()
        listView.adapter = adapter
        root.addView(listView)

        btnSelectAll.setOnClickListener {
            if (adapter.selectedPages.size == pdfRenderer!!.pageCount) {
                adapter.selectedPages.clear()
            } else {
                adapter.selectedPages.addAll(0 until pdfRenderer!!.pageCount)
            }
            adapter.notifyDataSetChanged()
        }

        // --- فوتر ---
        val footer = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            setPadding(40, 30, 40, 30)
            setBackgroundColor(Color.WHITE)
            elevation = 8f
        }
        
        val btnCancel = Button(this).apply { 
            text = "انصراف"
            setTextColor(Color.parseColor("#7F8C8D"))
            background = getRoundedDrawable("#F1F2F6", 20f) // دکمه طوسی ملایم گرد
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
        }
        
        val btnConfirm = Button(this).apply { 
            text = "تایید و ساخت"
            setTextColor(Color.WHITE)
            background = getRoundedDrawable("#3498DB", 20f) // دکمه آبی گرد
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 2f)
            (layoutParams as LinearLayout.LayoutParams).setMargins(25, 0, 0, 0)
        }

        footer.addView(btnCancel)
        footer.addView(btnConfirm)
        root.addView(footer)

        btnCancel.setOnClickListener { finish() }
        btnConfirm.setOnClickListener { extractSelectedPages() }

        setContentView(root)
    }

    private fun extractSelectedPages() {
        if (adapter.selectedPages.isEmpty()) {
            Toast.makeText(this, "هیچ صفحه‌ای تیک نخورده است!", Toast.LENGTH_SHORT).show()
            return
        }

        Toast.makeText(this, "در حال استخراج تصاویر...", Toast.LENGTH_LONG).show()

        Thread {
            try {
                val outputPaths = Arguments.createArray()
                val density = resources.displayMetrics.density
                val outputDir = filesDir

                synchronized(pdfRenderer!!) {
                    for (i in adapter.selectedPages.sorted()) {
                        val page = pdfRenderer!!.openPage(i)
                        val bitmap = Bitmap.createBitmap((page.width * density).toInt(), (page.height * density).toInt(), Bitmap.Config.ARGB_8888)
                        val canvas = Canvas(bitmap)
                        canvas.drawColor(Color.WHITE)
                        page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
                        page.close()

                        val file = File(outputDir, "${outputName}_ص_${i + 1}.png")
                        val out = FileOutputStream(file)
                        bitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
                        out.close()
                        
                        outputPaths.pushString(file.absolutePath)
                    }
                }
                
                runOnUiThread {
                    currentPromise?.resolve(outputPaths)
                    currentPromise = null
                    finish()
                }
            } catch (e: Exception) {
                runOnUiThread {
                    currentPromise?.reject("EXTRACT_ERROR", e.message)
                    currentPromise = null
                    finish()
                }
            }
        }.start()
    }

    override fun onDestroy() {
        super.onDestroy()
        executor.shutdown()
        pdfRenderer?.close()
        fileDescriptor?.close()
        currentPromise?.reject("CANCELLED", "عملیات لغو شد")
        currentPromise = null
    }

    // --- آداپتور رندر صفحات ---
    inner class PdfAdapter : BaseAdapter() {
        val selectedPages = mutableSetOf<Int>()

        override fun getCount(): Int = pdfRenderer?.pageCount ?: 0
        override fun getItem(position: Int): Any = position
        override fun getItemId(position: Int): Long = position.toLong()

        override fun getView(position: Int, convertView: View?, parent: ViewGroup?): View {
            val wrapper: LinearLayout
            val container: LinearLayout
            val imageView: ImageView
            val checkBox: CheckBox
            val txtPage: TextView

            if (convertView == null) {
                // Wrapper برای ایجاد فاصله (Margin) بین صفحات
                wrapper = LinearLayout(this@PdfSelectorActivity).apply {
                    orientation = LinearLayout.VERTICAL
                    setPadding(50, 20, 50, 20)
                }
                
                // کادر نقطه‌چین دور صفحه
                container = LinearLayout(this@PdfSelectorActivity).apply {
                    orientation = LinearLayout.VERTICAL
                    setPadding(40, 40, 40, 40)
                    background = getDashedBorderDrawable() // استفاده از استایل نقطه‌چین
                    layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
                }
                
                imageView = ImageView(this@PdfSelectorActivity).apply {
                    layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
                    adjustViewBounds = true
                    setPadding(0, 0, 0, 30)
                }
                
                val bottomRow = LinearLayout(this@PdfSelectorActivity).apply { 
                    orientation = LinearLayout.HORIZONTAL
                    gravity = Gravity.RIGHT or Gravity.CENTER_VERTICAL 
                }
                
                txtPage = TextView(this@PdfSelectorActivity).apply { 
                    textSize = 18f
                    setTextColor(Color.parseColor("#2C3E50"))
                    setPadding(0, 0, 20, 0)
                }
                checkBox = CheckBox(this@PdfSelectorActivity).apply { scaleX = 1.3f; scaleY = 1.3f }

                bottomRow.addView(txtPage)
                bottomRow.addView(checkBox)
                container.addView(imageView)
                container.addView(bottomRow)
                wrapper.addView(container)

                wrapper.tag = ViewHolder(imageView, checkBox, txtPage, container)
            } else {
                wrapper = convertView as LinearLayout
                val holder = wrapper.tag as ViewHolder
                imageView = holder.imageView
                checkBox = holder.checkBox
                txtPage = holder.txtPage
                container = holder.container
            }

            txtPage.text = "صفحه ${position + 1}"
            checkBox.setOnCheckedChangeListener(null)
            checkBox.isChecked = selectedPages.contains(position)

            checkBox.setOnCheckedChangeListener { _, isChecked ->
                if (isChecked) selectedPages.add(position) else selectedPages.remove(position)
            }
            container.setOnClickListener { checkBox.isChecked = !checkBox.isChecked }

            imageView.setImageBitmap(null)
            imageView.tag = position

            executor.execute {
                synchronized(pdfRenderer!!) {
                    try {
                        val page = pdfRenderer!!.openPage(position)
                        val width = resources.displayMetrics.widthPixels - 180
                        val height = (width * page.height / page.width.toFloat()).toInt()

                        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
                        val canvas = Canvas(bitmap)
                        canvas.drawColor(Color.WHITE)
                        page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
                        page.close()

                        runOnUiThread {
                            if (imageView.tag == position) {
                                imageView.setImageBitmap(bitmap)
                            }
                        }
                    } catch (e: Exception) {}
                }
            }
            return wrapper
        }
    }
    class ViewHolder(val imageView: ImageView, val checkBox: CheckBox, val txtPage: TextView, val container: LinearLayout)
}