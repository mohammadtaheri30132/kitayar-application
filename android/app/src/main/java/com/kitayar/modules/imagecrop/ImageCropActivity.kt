package com.kitayar.modules.imagecrop

import android.app.Activity
import android.content.Context
import android.graphics.*
import android.net.Uri
import android.os.Bundle
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import com.facebook.react.bridge.Promise
import java.io.File
import java.io.FileOutputStream

class ImageCropActivity : Activity() {

    companion object {
        var currentPromise: Promise? = null
    }

    private lateinit var cropView: CropView
    private var originalBitmap: Bitmap? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        val uriStr = intent.getStringExtra("IMAGE_URI")
        if (uriStr == null) {
            currentPromise?.reject("ERROR", "عکسی ارسال نشد")
            finish()
            return
        }

        try {
            val input = contentResolver.openInputStream(Uri.parse(uriStr))
            originalBitmap = BitmapFactory.decodeStream(input)
            input?.close()
        } catch (e: Exception) {
            currentPromise?.reject("ERROR", "خطا در بارگذاری عکس")
            finish()
            return
        }

        val rootLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.parseColor("#ECF0F1"))
            fitsSystemWindows = true
        }

        // Header
        val header = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            setPadding(40, 30, 40, 30)
            setBackgroundColor(Color.WHITE)
            gravity = Gravity.CENTER_VERTICAL
            elevation = 8f
        }

        val btnClose = Button(this).apply {
            text = "لغو"
            setTextColor(Color.parseColor("#7F8C8D"))
            background = getRoundedDrawable("#F1F2F6", 16f)
            setOnClickListener { 
                currentPromise?.reject("CANCEL", "کاربر لغو کرد")
                finish() 
            }
        }

        val txtTitle = TextView(this).apply {
            text = "برش تصویر"
            textSize = 18f
            setTextColor(Color.parseColor("#2C3E50"))
            gravity = Gravity.RIGHT or Gravity.CENTER_VERTICAL
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
            setPadding(0, 0, 30, 0)
        }

        header.addView(btnClose)
        header.addView(txtTitle)
        rootLayout.addView(header)

        // Crop View
        val frame = FrameLayout(this).apply {
            layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f)
            setPadding(40, 40, 40, 40)
        }
        
        cropView = CropView(this, originalBitmap!!)
        frame.addView(cropView)
        rootLayout.addView(frame)

        // Footer / Save Button
        val btnSave = Button(this).apply {
            text = "ذخیره برش"
            setTextColor(Color.WHITE)
            textSize = 16f
            background = getRoundedDrawable("#27AE60", 20f)
            layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 150).apply {
                setMargins(40, 20, 40, 40)
            }
            setOnClickListener { saveCrop() }
        }
        rootLayout.addView(btnSave)

        setContentView(rootLayout)
    }

    private fun getRoundedDrawable(colorHex: String, radius: Float): android.graphics.drawable.GradientDrawable {
        return android.graphics.drawable.GradientDrawable().apply {
            shape = android.graphics.drawable.GradientDrawable.RECTANGLE
            setColor(Color.parseColor(colorHex))
            cornerRadius = radius
        }
    }

    private fun saveCrop() {
        Toast.makeText(this, "در حال برش...", Toast.LENGTH_SHORT).show()
        Thread {
            try {
                val cropped = cropView.getCroppedBitmap()
                val file = File(cacheDir, "cropped_${System.currentTimeMillis()}.jpg")
                val fos = FileOutputStream(file)
                cropped.compress(Bitmap.CompressFormat.JPEG, 100, fos)
                fos.flush()
                fos.close()

                runOnUiThread {
                    currentPromise?.resolve(file.absolutePath)
                    currentPromise = null
                    finish()
                }
            } catch (e: Exception) {
                runOnUiThread { Toast.makeText(this, "خطا در برش عکس", Toast.LENGTH_SHORT).show() }
            }
        }.start()
    }

    override fun onDestroy() {
        super.onDestroy()
        currentPromise?.reject("CANCEL", "بسته شد")
        currentPromise = null
    }
}

// ویو اختصاصی برای مدیریت کادر برش
class CropView(context: Context, private val bitmap: Bitmap) : View(context) {
    private val imageRect = RectF()
    private var cropRect = RectF()
    
    private val overlayPaint = Paint().apply { color = Color.parseColor("#99000000") }
    private val borderPaint = Paint().apply { 
        color = Color.WHITE
        style = Paint.Style.STROKE
        strokeWidth = 6f
    }
    private val cornerPaint = Paint().apply { 
        color = Color.parseColor("#3498DB")
        style = Paint.Style.FILL 
    }

    private var activeCorner = -1 // 0:TL, 1:TR, 2:BL, 3:BR, 4:CENTER
    private var lastX = 0f
    private var lastY = 0f

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        super.onSizeChanged(w, h, oldw, oldh)
        val scale = Math.min(w.toFloat() / bitmap.width, h.toFloat() / bitmap.height)
        val iw = bitmap.width * scale
        val ih = bitmap.height * scale
        val dx = (w - iw) / 2f
        val dy = (h - ih) / 2f
        
        imageRect.set(dx, dy, dx + iw, dy + ih)
        // پیش‌فرض کادر برش روی 80 درصد وسط عکس
        cropRect.set(
            imageRect.left + iw * 0.1f, imageRect.top + ih * 0.1f,
            imageRect.right - iw * 0.1f, imageRect.bottom - ih * 0.1f
        )
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        canvas.drawBitmap(bitmap, null, imageRect, null)

        // کشیدن لایه تاریک بیرون کادر
        canvas.drawRect(imageRect.left, imageRect.top, imageRect.right, cropRect.top, overlayPaint) // بالا
        canvas.drawRect(imageRect.left, cropRect.bottom, imageRect.right, imageRect.bottom, overlayPaint) // پایین
        canvas.drawRect(imageRect.left, cropRect.top, cropRect.left, cropRect.bottom, overlayPaint) // چپ
        canvas.drawRect(cropRect.right, cropRect.top, imageRect.right, cropRect.bottom, overlayPaint) // راست

        canvas.drawRect(cropRect, borderPaint)

        // گوشه ها
        val cornerSize = 20f
        canvas.drawRect(cropRect.left - cornerSize, cropRect.top - cornerSize, cropRect.left + cornerSize, cropRect.top + cornerSize, cornerPaint)
        canvas.drawRect(cropRect.right - cornerSize, cropRect.top - cornerSize, cropRect.right + cornerSize, cropRect.top + cornerSize, cornerPaint)
        canvas.drawRect(cropRect.left - cornerSize, cropRect.bottom - cornerSize, cropRect.left + cornerSize, cropRect.bottom + cornerSize, cornerPaint)
        canvas.drawRect(cropRect.right - cornerSize, cropRect.bottom - cornerSize, cropRect.right + cornerSize, cropRect.bottom + cornerSize, cornerPaint)
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        val x = event.x
        val y = event.y
        val touchRadius = 60f

        when (event.action) {
            MotionEvent.ACTION_DOWN -> {
                activeCorner = when {
                    isNear(x, y, cropRect.left, cropRect.top, touchRadius) -> 0
                    isNear(x, y, cropRect.right, cropRect.top, touchRadius) -> 1
                    isNear(x, y, cropRect.left, cropRect.bottom, touchRadius) -> 2
                    isNear(x, y, cropRect.right, cropRect.bottom, touchRadius) -> 3
                    cropRect.contains(x, y) -> 4
                    else -> -1
                }
                lastX = x
                lastY = y
                return activeCorner != -1
            }
            MotionEvent.ACTION_MOVE -> {
                val dx = x - lastX
                val dy = y - lastY
                val minSize = 100f

                when (activeCorner) {
                    0 -> { cropRect.left = Math.min(cropRect.right - minSize, Math.max(imageRect.left, cropRect.left + dx)); cropRect.top = Math.min(cropRect.bottom - minSize, Math.max(imageRect.top, cropRect.top + dy)) }
                    1 -> { cropRect.right = Math.max(cropRect.left + minSize, Math.min(imageRect.right, cropRect.right + dx)); cropRect.top = Math.min(cropRect.bottom - minSize, Math.max(imageRect.top, cropRect.top + dy)) }
                    2 -> { cropRect.left = Math.min(cropRect.right - minSize, Math.max(imageRect.left, cropRect.left + dx)); cropRect.bottom = Math.max(cropRect.top + minSize, Math.min(imageRect.bottom, cropRect.bottom + dy)) }
                    3 -> { cropRect.right = Math.max(cropRect.left + minSize, Math.min(imageRect.right, cropRect.right + dx)); cropRect.bottom = Math.max(cropRect.top + minSize, Math.min(imageRect.bottom, cropRect.bottom + dy)) }
                    4 -> {
                        val moveX = Math.max(imageRect.left - cropRect.left, Math.min(imageRect.right - cropRect.right, dx))
                        val moveY = Math.max(imageRect.top - cropRect.top, Math.min(imageRect.bottom - cropRect.bottom, dy))
                        cropRect.offset(moveX, moveY)
                    }
                }
                lastX = x
                lastY = y
                invalidate()
            }
        }
        return true
    }

    private fun isNear(x: Float, y: Float, targetX: Float, targetY: Float, radius: Float): Boolean {
        return Math.abs(x - targetX) <= radius && Math.abs(y - targetY) <= radius
    }

    fun getCroppedBitmap(): Bitmap {
        val scaleX = bitmap.width / imageRect.width()
        val scaleY = bitmap.height / imageRect.height()

        val cropX = ((cropRect.left - imageRect.left) * scaleX).toInt()
        val cropY = ((cropRect.top - imageRect.top) * scaleY).toInt()
        val cropW = (cropRect.width() * scaleX).toInt()
        val cropH = (cropRect.height() * scaleY).toInt()

        return Bitmap.createBitmap(bitmap, cropX, cropY, cropW, cropH)
    }
}