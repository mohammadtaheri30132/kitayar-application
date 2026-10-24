package com.kitayar.modules.canvas.model

import android.graphics.*
import org.json.JSONObject
import java.io.File
import kotlin.math.*

class ImageElement(
    id: String = java.util.UUID.randomUUID().toString(),
    zIndex: Int = 0,
    isLocked: Boolean = false,
    opacity: Float = 1.0f,
    var imageUri: String = "",
    var imageBounds: RectF = RectF(0f, 0f, 200f, 200f),
    var rotation: Float = 0f
) : CanvasElement(id, zIndex, isLocked, opacity) {

    override val type: String = "image"

    @Transient
    private var cachedBitmap: Bitmap? = null
    @Transient
    private var isBitmapLoaded: Boolean = false
    @Transient
    private var cachedPaint: Paint? = null

    private fun loadBitmapIfNeeded() {
        if (isBitmapLoaded) return
        isBitmapLoaded = true

        try {
            val cleanPath = imageUri.replace("file://", "")
            val file = File(cleanPath)
            if (!file.exists()) return

            val options = BitmapFactory.Options().apply {
                inJustDecodeBounds = true
            }
            BitmapFactory.decodeFile(cleanPath, options)

            var sampleSize = 1
            val maxDim = max(options.outWidth, options.outHeight)
            while (maxDim / sampleSize > 1024) {
                sampleSize *= 2
            }

            val decodeOptions = BitmapFactory.Options().apply {
                inSampleSize = sampleSize
                inPreferredConfig = Bitmap.Config.RGB_565
            }
            cachedBitmap = BitmapFactory.decodeFile(cleanPath, decodeOptions)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    override fun getBounds(): RectF {
        val pad = 8f
        val r = RectF(imageBounds.left - pad, imageBounds.top - pad, imageBounds.right + pad, imageBounds.bottom + pad)
        if (rotation == 0f) return r

        val cx = imageBounds.centerX()
        val cy = imageBounds.centerY()
        val rad = Math.toRadians(rotation.toDouble())
        val cosA = cos(rad).toFloat()
        val sinA = sin(rad).toFloat()

        val corners = arrayOf(
            floatArrayOf(r.left, r.top),
            floatArrayOf(r.right, r.top),
            floatArrayOf(r.right, r.bottom),
            floatArrayOf(r.left, r.bottom)
        )

        var minX = Float.MAX_VALUE
        var minY = Float.MAX_VALUE
        var maxX = -Float.MAX_VALUE
        var maxY = -Float.MAX_VALUE

        for (c in corners) {
            val dx = c[0] - cx
            val dy = c[1] - cy
            val nx = cx + dx * cosA - dy * sinA
            val ny = cy + dx * sinA + dy * cosA
            if (nx < minX) minX = nx
            if (nx > maxX) maxX = nx
            if (ny < minY) minY = ny
            if (ny > maxY) maxY = ny
        }
        return RectF(minX, minY, maxX, maxY)
    }

    override fun draw(canvas: Canvas, isSelected: Boolean) {
        loadBitmapIfNeeded()
        val bmp = cachedBitmap ?: return

        canvas.save()
        if (rotation != 0f) {
            canvas.rotate(rotation, imageBounds.centerX(), imageBounds.centerY())
        }

        val paint = cachedPaint ?: Paint(Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG).also { cachedPaint = it }
        paint.alpha = (opacity * 255).toInt().coerceIn(0, 255)

        val srcRect = Rect(0, 0, bmp.width, bmp.height)
        canvas.drawBitmap(bmp, srcRect, imageBounds, paint)

        canvas.restore()
    }

    override fun containsPoint(wx: Float, wy: Float, tolerance: Float): Boolean {
        var px = wx
        var py = wy
        if (rotation != 0f) {
            val cx = imageBounds.centerX()
            val cy = imageBounds.centerY()
            val rad = Math.toRadians(-rotation.toDouble())
            val cosA = cos(rad).toFloat()
            val sinA = sin(rad).toFloat()
            val dx = wx - cx
            val dy = wy - cy
            px = cx + dx * cosA - dy * sinA
            py = cy + dx * sinA + dy * cosA
        }

        val effTol = max(tolerance, 12f)
        val expanded = RectF(imageBounds.left - effTol, imageBounds.top - effTol, imageBounds.right + effTol, imageBounds.bottom + effTol)
        return expanded.contains(px, py)
    }

    override fun translate(dx: Float, dy: Float) {
        imageBounds.offset(dx, dy)
    }

    override fun scale(scaleX: Float, scaleY: Float, pivotX: Float, pivotY: Float) {
        val nl = pivotX + (imageBounds.left - pivotX) * scaleX
        val nr = pivotX + (imageBounds.right - pivotX) * scaleX
        val nt = pivotY + (imageBounds.top - pivotY) * scaleY
        val nb = pivotY + (imageBounds.bottom - pivotY) * scaleY
        imageBounds.set(min(nl, nr), min(nt, nb), max(nl, nr), max(nt, nb))
    }

    override fun rotate(angleDegrees: Float, pivotX: Float, pivotY: Float) {
        rotation = (rotation + angleDegrees) % 360f
    }

    override fun clone(): CanvasElement {
        return ImageElement(
            id = java.util.UUID.randomUUID().toString(),
            zIndex = zIndex,
            isLocked = isLocked,
            opacity = opacity,
            imageUri = imageUri,
            imageBounds = RectF(imageBounds),
            rotation = rotation
        )
    }

    override fun toJson(): JSONObject {
        return JSONObject().apply {
            put("id", id)
            put("type", type)
            put("zIndex", zIndex)
            put("isLocked", isLocked)
            put("opacity", opacity.toDouble())
            put("imageUri", imageUri)
            put("rotation", rotation.toDouble())
            put("bounds", JSONObject().apply {
                put("left", imageBounds.left.toDouble())
                put("top", imageBounds.top.toDouble())
                put("right", imageBounds.right.toDouble())
                put("bottom", imageBounds.bottom.toDouble())
            })
        }
    }

    companion object {
        fun fromJson(json: JSONObject): ImageElement {
            val id = json.optString("id", java.util.UUID.randomUUID().toString())
            val zIndex = json.optInt("zIndex", 0)
            val isLocked = json.optBoolean("isLocked", false)
            val opacity = json.optDouble("opacity", 1.0).toFloat()
            val imageUri = json.optString("imageUri", "")
            val rotation = json.optDouble("rotation", 0.0).toFloat()

            val bObj = json.optJSONObject("bounds")
            val bounds = if (bObj != null) {
                RectF(
                    bObj.optDouble("left", 0.0).toFloat(),
                    bObj.optDouble("top", 0.0).toFloat(),
                    bObj.optDouble("right", 200.0).toFloat(),
                    bObj.optDouble("bottom", 200.0).toFloat()
                )
            } else {
                RectF(0f, 0f, 200f, 200f)
            }

            return ImageElement(
                id = id,
                zIndex = zIndex,
                isLocked = isLocked,
                opacity = opacity,
                imageUri = imageUri,
                imageBounds = bounds,
                rotation = rotation
            )
        }
    }
}
