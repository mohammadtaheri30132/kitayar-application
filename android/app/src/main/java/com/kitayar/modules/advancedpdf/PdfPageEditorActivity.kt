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
import androidx.recyclerview.widget.ItemTouchHelper
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.facebook.react.bridge.Promise
import com.tom_roush.pdfbox.pdmodel.PDDocument
import java.io.File
import kotlin.concurrent.thread

class PdfPageEditorActivity : Activity() {

    companion object {
        var currentPromise: Promise? = null
    }

    private var pdfRenderer: PdfRenderer? = null
    private var fileDescriptor: ParcelFileDescriptor? = null
    private lateinit var adapter: PdfPageEditorAdapter
    private lateinit var pdfUri: Uri
    private val pagesList = mutableListOf<PdfPageModel>()

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
                pagesList.add(PdfPageModel(originalIndex = i))
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
        
        val txtTitle = TextView(this).apply { 
            text = "ویرایش صفحات PDF (حذف و جابه‌جایی)"
            textSize = 17f
            setTextColor(Color.parseColor("#2C3E50"))
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
            typeface = android.graphics.Typeface.DEFAULT_BOLD
        }
        
        header.addView(txtTitle)
        root.addView(header)

        // RecyclerView
        val recyclerView = RecyclerView(this).apply {
            layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f)
            layoutManager = LinearLayoutManager(this@PdfPageEditorActivity)
            clipToPadding = false
            setPadding(0, 20, 0, 20)
        }
        
        adapter = PdfPageEditorAdapter(this, pagesList, pdfRenderer)
        recyclerView.adapter = adapter
        root.addView(recyclerView)

        // Drag and Drop
        val itemTouchHelperCallback = object : ItemTouchHelper.SimpleCallback(
            ItemTouchHelper.UP or ItemTouchHelper.DOWN, 0
        ) {
            override fun onMove(
                recyclerView: RecyclerView,
                viewHolder: RecyclerView.ViewHolder,
                target: RecyclerView.ViewHolder
            ): Boolean {
                val fromPos = viewHolder.adapterPosition
                val toPos = target.adapterPosition
                adapter.swapItems(fromPos, toPos)
                return true
            }

            override fun onSwiped(viewHolder: RecyclerView.ViewHolder, direction: Int) {
                // Not using swipe to delete
            }
        }
        ItemTouchHelper(itemTouchHelperCallback).attachToRecyclerView(recyclerView)

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
        
        Toast.makeText(this, "برای جابه‌جایی، صفحات را بکشید", Toast.LENGTH_SHORT).show()
    }

    private fun savePdfAndFinish() {
        if (adapter.getPages().isEmpty()) {
            Toast.makeText(this, "هیچ صفحه‌ای باقی نمانده است!", Toast.LENGTH_SHORT).show()
            return
        }

        Toast.makeText(this, "در حال ذخیره PDF جدید...", Toast.LENGTH_LONG).show()

        thread {
            var originalDoc: PDDocument? = null
            var newDoc: PDDocument? = null
            try {
                val inputStream = contentResolver.openInputStream(pdfUri)
                originalDoc = PDDocument.load(inputStream)
                newDoc = PDDocument()

                val finalPages = adapter.getPages()
                for (pageModel in finalPages) {
                    val originalPage = originalDoc.getPage(pageModel.originalIndex)
                    newDoc.addPage(originalPage)
                }

                val outputDir = File(cacheDir, "kitayar_pdf")
                if (!outputDir.exists()) outputDir.mkdirs()
                
                val outputFile = File(outputDir, "EditedPdf_${System.currentTimeMillis()}.pdf")
                newDoc.save(outputFile)

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
                originalDoc?.close()
                newDoc?.close()
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
