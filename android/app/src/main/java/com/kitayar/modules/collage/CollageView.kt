package com.kitayar.modules.collage

import android.content.Context
import android.graphics.*
import android.view.GestureDetector
import android.view.MotionEvent
import android.view.ScaleGestureDetector
import android.view.View

class CollageView(context: Context) : View(context) {

    class Slot(val relativeRect: RectF, var bitmap: Bitmap?) {
        val displayRect = RectF()
        val matrix = Matrix()
        var currentScale = 1f
    }

    private var slots = mutableListOf<Slot>()
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val borderPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.WHITE
        style = Paint.Style.STROKE
        strokeWidth = 10f
    }
    
    private var activeSlotIndex: Int = -1
    private var isSwapping = false
    private var dragX = 0f
    private var dragY = 0f

    private val scaleDetector: ScaleGestureDetector
    private val gestureDetector: GestureDetector

    init {
        scaleDetector = ScaleGestureDetector(context, object : ScaleGestureDetector.SimpleOnScaleGestureListener() {
            override fun onScale(detector: ScaleGestureDetector): Boolean {
                if (activeSlotIndex in slots.indices && !isSwapping) {
                    val slot = slots[activeSlotIndex]
                    val scaleFactor = detector.scaleFactor
                    slot.matrix.postScale(scaleFactor, scaleFactor, detector.focusX, detector.focusY)
                    slot.currentScale *= scaleFactor
                    invalidate()
                    return true
                }
                return false
            }
        })

        gestureDetector = GestureDetector(context, object : GestureDetector.SimpleOnGestureListener() {
            override fun onScroll(e1: MotionEvent?, e2: MotionEvent, distanceX: Float, distanceY: Float): Boolean {
                if (activeSlotIndex in slots.indices && !isSwapping) {
                    slots[activeSlotIndex].matrix.postTranslate(-distanceX, -distanceY)
                    invalidate()
                    return true
                }
                return false
            }

            override fun onLongPress(e: MotionEvent) {
                if (activeSlotIndex in slots.indices) {
                    isSwapping = true
                    dragX = e.x
                    dragY = e.y
                    invalidate()
                }
            }
        })
    }

    fun setTemplateAndImages(template: List<RectF>, images: List<Bitmap>) {
        slots.clear()
        template.forEachIndexed { index, rectF ->
            val slot = Slot(rectF, images.getOrNull(index))
            slots.add(slot)
        }
        requestLayout()
    }

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        super.onSizeChanged(w, h, oldw, oldh)
        setupSlotsDisplayRects()
    }

    private fun setupSlotsDisplayRects() {
        val w = width.toFloat()
        val h = height.toFloat()
        
        slots.forEach { slot ->
            slot.displayRect.set(
                slot.relativeRect.left * w,
                slot.relativeRect.top * h,
                slot.relativeRect.right * w,
                slot.relativeRect.bottom * h
            )
            // Center crop initial matrix
            slot.bitmap?.let { bmp ->
                val scale = Math.max(
                    slot.displayRect.width() / bmp.width,
                    slot.displayRect.height() / bmp.height
                )
                val dx = (slot.displayRect.width() - bmp.width * scale) / 2f
                val dy = (slot.displayRect.height() - bmp.height * scale) / 2f
                
                slot.matrix.setScale(scale, scale)
                slot.matrix.postTranslate(slot.displayRect.left + dx, slot.displayRect.top + dy)
                slot.currentScale = scale
            }
        }
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        canvas.drawColor(Color.WHITE) // پس‌زمینه کلاژ

        var dragSlot: Slot? = null

        slots.forEachIndexed { index, slot ->
            if (isSwapping && index == activeSlotIndex) {
                dragSlot = slot
                return@forEachIndexed // بعدا روی همه رسم میکنیم
            }

            canvas.save()
            canvas.clipRect(slot.displayRect)
            slot.bitmap?.let {
                canvas.drawBitmap(it, slot.matrix, paint)
            }
            canvas.restore()
            canvas.drawRect(slot.displayRect, borderPaint)
        }

        // رسم آیتمی که در حال درگ شدن است (نیمه‌شفاف)
        if (isSwapping && dragSlot != null) {
            paint.alpha = 150
            dragSlot?.bitmap?.let { bmp ->
                val thumbScale = dragSlot!!.displayRect.width() / bmp.width * 0.5f
                val tempMatrix = Matrix()
                tempMatrix.setScale(thumbScale, thumbScale)
                tempMatrix.postTranslate(dragX - (bmp.width * thumbScale) / 2f, dragY - (bmp.height * thumbScale) / 2f)
                canvas.drawBitmap(bmp, tempMatrix, paint)
            }
            paint.alpha = 255
        }
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        var handled = scaleDetector.onTouchEvent(event)
        if (!scaleDetector.isInProgress) {
            handled = gestureDetector.onTouchEvent(event) || handled
        }

        when (event.actionMasked) {
            MotionEvent.ACTION_DOWN -> {
                activeSlotIndex = slots.indexOfFirst { it.displayRect.contains(event.x, event.y) }
                handled = true
            }
            MotionEvent.ACTION_MOVE -> {
                if (isSwapping) {
                    dragX = event.x
                    dragY = event.y
                    invalidate()
                    handled = true
                }
            }
            MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                if (isSwapping) {
                    val targetIndex = slots.indexOfFirst { it.displayRect.contains(event.x, event.y) }
                    if (targetIndex != -1 && targetIndex != activeSlotIndex) {
                        // Swap Bitmaps
                        val tempBmp = slots[activeSlotIndex].bitmap
                        slots[activeSlotIndex].bitmap = slots[targetIndex].bitmap
                        slots[targetIndex].bitmap = tempBmp
                        setupSlotsDisplayRects() // Reset scales
                    }
                    isSwapping = false
                    activeSlotIndex = -1
                    invalidate()
                }
            }
        }
        return handled || super.onTouchEvent(event)
    }

    fun getCollageBitmap(): Bitmap {
        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        val wasSwapping = isSwapping
        isSwapping = false 
        draw(canvas)
        isSwapping = wasSwapping
        return bitmap
    }
}