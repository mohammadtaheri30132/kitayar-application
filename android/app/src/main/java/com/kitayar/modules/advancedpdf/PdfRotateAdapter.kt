package com.kitayar.modules.advancedpdf

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.graphics.pdf.PdfRenderer
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

data class PdfRotateModel(val originalIndex: Int, var rotationAngle: Int = 0, var bitmap: Bitmap? = null, var isRendered: Boolean = false)

class PdfRotateAdapter(
    private val context: Context,
    private val pages: List<PdfRotateModel>,
    private val pdfRenderer: PdfRenderer?
) : RecyclerView.Adapter<PdfRotateAdapter.PageViewHolder>() {

    private val executor: ExecutorService = Executors.newFixedThreadPool(4)

    private fun getPageContainerDrawable(): GradientDrawable {
        return GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            setColor(Color.WHITE)
            cornerRadius = 24f
            setStroke(2, Color.parseColor("#BDC3C7"))
        }
    }

    private fun getRotateButtonDrawable(): GradientDrawable {
        return GradientDrawable().apply {
            shape = GradientDrawable.OVAL
            setColor(Color.parseColor("#3498DB"))
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): PageViewHolder {
        val root = FrameLayout(context).apply {
            layoutParams = ViewGroup.MarginLayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply {
                setMargins(40, 20, 40, 20)
            }
        }

        val container = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            background = getPageContainerDrawable()
            setPadding(30, 30, 30, 30)
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.WRAP_CONTENT
            )
            elevation = 4f
        }

        val imageView = ImageView(context).apply {
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            )
            adjustViewBounds = true
            minimumHeight = 300
        }

        val bottomRow = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
            setPadding(0, 20, 0, 0)
        }

        val btnRotateLeft = TextView(context).apply {
            text = "↺"
            textSize = 20f
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
            background = getRotateButtonDrawable()
            layoutParams = LinearLayout.LayoutParams(100, 100).apply { setMargins(0, 0, 20, 0) }
        }

        val txtPage = TextView(context).apply {
            textSize = 16f
            setTextColor(Color.parseColor("#2C3E50"))
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
            gravity = Gravity.CENTER
        }

        val btnRotateRight = TextView(context).apply {
            text = "↻"
            textSize = 20f
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
            background = getRotateButtonDrawable()
            layoutParams = LinearLayout.LayoutParams(100, 100).apply { setMargins(20, 0, 0, 0) }
        }

        bottomRow.addView(btnRotateRight)
        bottomRow.addView(txtPage)
        bottomRow.addView(btnRotateLeft)

        container.addView(imageView)
        container.addView(bottomRow)
        root.addView(container)

        return PageViewHolder(root, imageView, txtPage, btnRotateLeft, btnRotateRight)
    }

    override fun onBindViewHolder(holder: PageViewHolder, position: Int) {
        val pageModel = pages[position]
        holder.txtPage.text = "صفحه ${pageModel.originalIndex + 1}"
        
        holder.imageView.setImageBitmap(null)
        // Apply visual rotation based on model
        holder.imageView.rotation = pageModel.rotationAngle.toFloat()

        if (pageModel.bitmap != null) {
            holder.imageView.setImageBitmap(pageModel.bitmap)
        } else if (!pageModel.isRendered && pdfRenderer != null) {
            executor.execute {
                synchronized(pdfRenderer) {
                    try {
                        val page = pdfRenderer.openPage(pageModel.originalIndex)
                        val targetWidth = 600
                        val targetHeight = (targetWidth * page.height / page.width.toFloat()).toInt()

                        val bitmap = Bitmap.createBitmap(targetWidth, targetHeight, Bitmap.Config.ARGB_8888)
                        val canvas = Canvas(bitmap)
                        canvas.drawColor(Color.WHITE)
                        page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
                        page.close()

                        pageModel.bitmap = bitmap
                        pageModel.isRendered = true

                        (context as android.app.Activity).runOnUiThread {
                            if (holder.adapterPosition != RecyclerView.NO_POSITION && pages[holder.adapterPosition] == pageModel) {
                                holder.imageView.setImageBitmap(bitmap)
                            }
                        }
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }
            }
        }

        holder.btnRotateLeft.setOnClickListener {
            pageModel.rotationAngle = (pageModel.rotationAngle - 90) % 360
            holder.imageView.rotation = pageModel.rotationAngle.toFloat()
        }

        holder.btnRotateRight.setOnClickListener {
            pageModel.rotationAngle = (pageModel.rotationAngle + 90) % 360
            holder.imageView.rotation = pageModel.rotationAngle.toFloat()
        }
    }

    override fun getItemCount(): Int = pages.size

    fun getPages(): List<PdfRotateModel> = pages

    fun rotateAll(degrees: Int) {
        for (page in pages) {
            page.rotationAngle = (page.rotationAngle + degrees) % 360
        }
        notifyDataSetChanged()
    }

    fun shutdown() {
        executor.shutdownNow()
        for (page in pages) {
            page.bitmap?.recycle()
            page.bitmap = null
        }
    }

    class PageViewHolder(
        itemView: View,
        val imageView: ImageView,
        val txtPage: TextView,
        val btnRotateLeft: View,
        val btnRotateRight: View
    ) : RecyclerView.ViewHolder(itemView)
}
