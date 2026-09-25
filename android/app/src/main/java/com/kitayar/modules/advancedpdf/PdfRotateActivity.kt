package com.kitayar.modules.advancedpdf

import android.app.Activity
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.graphics.pdf.PdfRenderer
import android.net.Uri
import android.os.Bundle
import android.os.ParcelFileDescriptor
import android.view.Gravity
import android.view.ViewGroup
import android.widget.*
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.facebook.react.bridge.Promise
import com.tom_roush.pdfbox.pdmodel.PDDocument
import java.io.File
import kotlin.concurrent.thread

class PdfRotateActivity : Activity() {

    companion object {
        var currentPromise: Promise? = null
    }

    private var pdfRenderer: PdfRenderer? = null
    private var fileDescriptor: ParcelFileDescriptor? = null
    private lateinit var adapter: PdfRotateAdapter
    private lateinit var pdfUri: Uri
    private val pagesList = mutableListOf<PdfRotateModel>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        val pdfUriStr = intent.getStringExtra("pdfUri")
        if (pdfUriStr == null) {
            finishWithError("PDF_URI_MISSING", "PDF URI is missing")
            return
        }

        pdfUri = Uri.parse(pdfUriStr)

        try {
            fileDescriptor = contentResolver.openFileDescriptor(pdfUri, "r")
            pdfRenderer = PdfRenderer(fileDescriptor!!)
            for (i in 0 until pdfRenderer!!.pageCount) {
                pagesList.add(PdfRotateModel(originalIndex = i))
            }
        } catch (e: Exception) {
            finishWithError("PDF_OPEN_ERROR", e.message ?: "خطا در باز کردن PDF")
            return
        }

        setupUI()
    }

    private fun getRoundedDrawable(colorHex: String, radius: Float): GradientDrawable {
        return GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            setColor(Color.parseColor(colorHex))
            cornerRadius = radius
        }
    }

    private fun setupUI() {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.parseColor("#F5F6FA"))
            fitsSystemWindows = true 
        }

        // Header
        val header = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            setPadding(40, 40, 40, 40)
            setBackgroundColor(Color.WHITE)
            gravity = Gravity.CENTER_VERTICAL
            elevation = 4f
        }
        
        val btnRotateAllRight = Button(this).apply { 
            text = "همه ↻ 90°"
            setTextColor(Color.WHITE)
            background = getRoundedDrawable("#3498DB", 16f)
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f).apply { setMargins(10, 0, 0, 0) }
            setPadding(10, 0, 10, 0)
        }

        val btnRotateAllLeft = Button(this).apply { 
            text = "همه ↺ 90°"
            setTextColor(Color.WHITE)
            background = getRoundedDrawable("#3498DB", 16f)
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f).apply { setMargins(0, 0, 10, 0) }
            setPadding(10, 0, 10, 0)
        }
        
        val txtTitle = TextView(this).apply { 
            text = "پیش‌نمایش چرخش صفحات PDF"
            textSize = 15f
            setTextColor(Color.parseColor("#2C3E50"))
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.5f)
            typeface = android.graphics.Typeface.DEFAULT_BOLD
        }
        
        header.addView(btnRotateAllRight)
        header.addView(txtTitle)
        header.addView(btnRotateAllLeft)
        root.addView(header)

        // RecyclerView
        val recyclerView = RecyclerView(this).apply {
            layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f)
            layoutManager = LinearLayoutManager(this@PdfRotateActivity)
            clipToPadding = false
            setPadding(0, 20, 0, 20)
        }
        
        adapter = PdfRotateAdapter(this, pagesList, pdfRenderer)
        recyclerView.adapter = adapter
        root.addView(recyclerView)

        btnRotateAllRight.setOnClickListener { adapter.rotateAll(90) }
        btnRotateAllLeft.setOnClickListener { adapter.rotateAll(-90) }

        // Footer
        val footer = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            setPadding(40, 30, 40, 30)
            setBackgroundColor(Color.WHITE)
            elevation = 8f
        }
        
        val btnCancel = Button(this).apply { 
            text = "انصراف"
            setTextColor(Color.parseColor("#7F8C8D"))
            background = getRoundedDrawable("#F1F2F6", 20f)
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
        }
        
        val btnConfirm = Button(this).apply { 
            text = "تایید و ذخیره"
            setTextColor(Color.WHITE)
            background = getRoundedDrawable("#3498DB", 20f)
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 2f)
            (layoutParams as LinearLayout.LayoutParams).setMargins(25, 0, 0, 0)
        }

        footer.addView(btnCancel)
        footer.addView(btnConfirm)
        root.addView(footer)

        btnCancel.setOnClickListener { finishWithError("CANCELLED", "عملیات لغو شد") }
        btnConfirm.setOnClickListener { savePdfAndFinish() }

        setContentView(root)
    }

    private fun savePdfAndFinish() {
        Toast.makeText(this, "در حال پردازش و ذخیره PDF...", Toast.LENGTH_LONG).show()

        thread {
            var doc: PDDocument? = null
            try {
                val inputStream = contentResolver.openInputStream(pdfUri)
                doc = PDDocument.load(inputStream)

                val pages = adapter.getPages()
                for (pageModel in pages) {
                    val originalPage = doc.getPage(pageModel.originalIndex)
                    if (pageModel.rotationAngle != 0) {
                        originalPage.rotation = originalPage.rotation + pageModel.rotationAngle
                    }
                }

                val outputDir = File(cacheDir, "kitayar_pdf")
                if (!outputDir.exists()) outputDir.mkdirs()
                
                val outputFile = File(outputDir, "RotatedPdf_${System.currentTimeMillis()}.pdf")
                doc.save(outputFile)

                runOnUiThread {
                    currentPromise?.resolve(outputFile.absolutePath)
                    currentPromise = null
                    finish()
                }
            } catch (e: Exception) {
                runOnUiThread {
                    finishWithError("SAVE_ERROR", e.message ?: "خطا در ذخیره PDF")
                }
            } finally {
                doc?.close()
            }
        }
    }

    private fun finishWithError(code: String, message: String) {
        currentPromise?.reject(code, message)
        currentPromise = null
        finish()
    }

    override fun onDestroy() {
        super.onDestroy()
        adapter.shutdown()
        pdfRenderer?.close()
        fileDescriptor?.close()
        currentPromise?.reject("CANCELLED", "عملیات لغو شد")
        currentPromise = null
    }
}
