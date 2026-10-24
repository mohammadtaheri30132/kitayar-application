package com.kitayar.modules.canvas.model

import android.graphics.*
import android.os.Build
import android.text.Layout
import android.text.StaticLayout
import android.text.TextPaint
import org.json.JSONObject
import kotlin.math.*

class TextElement(
    id: String = java.util.UUID.randomUUID().toString(),
    zIndex: Int = 0,
    isLocked: Boolean = false,
    opacity: Float = 1.0f,
    var text: String = "",
    var x: Float = 0f,
    var y: Float = 0f,
    var width: Float = 260f,
    var fontSize: Float = 22f,
    var textColor: Int = Color.BLACK,
    var isBold: Boolean = false,
    var isItalic: Boolean = false,
    var alignment: String = "right", // "right" (RTL), "center", "left"
    var backgroundColor: Int? = null,
    var borderColor: Int? = null,
    var rotation: Float = 0f
) : CanvasElement(id, zIndex, isLocked, opacity) {

    override val type: String = "text"

    @Transient
    private var cachedLayout: StaticLayout? = null
    @Transient
    private var cachedTextPaint: TextPaint? = null
    @Transient
    private var cachedHeight: Float = 50f

    private fun getTextPaint(): TextPaint {
        val tp = cachedTextPaint ?: TextPaint(Paint.ANTI_ALIAS_FLAG).also { cachedTextPaint = it }
        val a = (Color.alpha(textColor) * opacity).toInt().coerceIn(0, 255)
        tp.color = Color.argb(a, Color.red(textColor), Color.green(textColor), Color.blue(textColor))
        tp.textSize = fontSize

        val typefaceStyle = when {
            isBold && isItalic -> Typeface.BOLD_ITALIC
            isBold -> Typeface.BOLD
            isItalic -> Typeface.ITALIC
            else -> Typeface.NORMAL
        }
        tp.typeface = Typeface.create(Typeface.DEFAULT, typefaceStyle)
        return tp
    }

    fun getLayout(): StaticLayout {
        cachedLayout?.let { return it }

        val paint = getTextPaint()
        val textWidth = max(80f, width).toInt()

        val textAlignment = when (alignment) {
            "center" -> Layout.Alignment.ALIGN_CENTER
            "left" -> Layout.Alignment.ALIGN_NORMAL
            else -> Layout.Alignment.ALIGN_OPPOSITE // Default for Persian/Arabic RTL
        }

        val layout = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            StaticLayout.Builder.obtain(text, 0, text.length, paint, textWidth)
                .setAlignment(textAlignment)
                .setLineSpacing(0f, 1.25f)
                .setIncludePad(true)
                .build()
        } else {
            @Suppress("DEPRECATION")
            StaticLayout(text, paint, textWidth, textAlignment, 1.25f, 0f, true)
        }

        cachedLayout = layout
        cachedHeight = max(layout.height.toFloat(), fontSize * 1.5f)
        return layout
    }

    fun invalidateLayout() {
        cachedLayout = null
        cachedTextPaint = null
    }

    override fun getBounds(): RectF {
        val layout = getLayout()
        val h = max(layout.height.toFloat(), fontSize * 1.5f)
        val pad = 12f
        val r = RectF(x - pad, y - pad, x + width + pad, y + h + pad)

        if (rotation == 0f) return r

        val cx = r.centerX()
        val cy = r.centerY()
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
        val layout = getLayout()
        val h = max(layout.height.toFloat(), fontSize * 1.5f)

        canvas.save()
        if (rotation != 0f) {
            val cx = x + width / 2f
            val cy = y + h / 2f
            canvas.rotate(rotation, cx, cy)
        }

        // Draw background if specified
        backgroundColor?.let { bg ->
            val bgPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                val a = (Color.alpha(bg) * opacity).toInt().coerceIn(0, 255)
                color = Color.argb(a, Color.red(bg), Color.green(bg), Color.blue(bg))
                style = Paint.Style.FILL
            }
            val bgRect = RectF(x - 6f, y - 4f, x + width + 6f, y + h + 6f)
            canvas.drawRoundRect(bgRect, 8f, 8f, bgPaint)
        }

        // Draw border if specified
        borderColor?.let { bc ->
            val bPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                val a = (Color.alpha(bc) * opacity).toInt().coerceIn(0, 255)
                color = Color.argb(a, Color.red(bc), Color.green(bc), Color.blue(bc))
                style = Paint.Style.STROKE
                strokeWidth = 2f
            }
            val bgRect = RectF(x - 6f, y - 4f, x + width + 6f, y + h + 6f)
            canvas.drawRoundRect(bgRect, 8f, 8f, bPaint)
        }

        canvas.translate(x, y)
        layout.draw(canvas)
        canvas.restore()
    }

    override fun containsPoint(wx: Float, wy: Float, tolerance: Float): Boolean {
        var px = wx
        var py = wy
        val bounds = getBounds()
        if (rotation != 0f) {
            val cx = bounds.centerX()
            val cy = bounds.centerY()
            val rad = Math.toRadians(-rotation.toDouble())
            val cosA = cos(rad).toFloat()
            val sinA = sin(rad).toFloat()
            val dx = wx - cx
            val dy = wy - cy
            px = cx + dx * cosA - dy * sinA
            py = cy + dx * sinA + dy * cosA
        }

        val effTol = max(tolerance, 12f)
        val hitRect = RectF(x - effTol, y - effTol, x + width + effTol, y + cachedHeight + effTol)
        return hitRect.contains(px, py)
    }

    override fun translate(dx: Float, dy: Float) {
        x += dx
        y += dy
    }

    override fun scale(scaleX: Float, scaleY: Float, pivotX: Float, pivotY: Float) {
        x = pivotX + (x - pivotX) * scaleX
        y = pivotY + (y - pivotY) * scaleY
        width = max(80f, width * abs(scaleX))
        fontSize = max(10f, fontSize * ((abs(scaleX) + abs(scaleY)) / 2f))
        invalidateLayout()
    }

    override fun rotate(angleDegrees: Float, pivotX: Float, pivotY: Float) {
        rotation = (rotation + angleDegrees) % 360f
    }

    override fun clone(): CanvasElement {
        return TextElement(
            id = java.util.UUID.randomUUID().toString(),
            zIndex = zIndex,
            isLocked = isLocked,
            opacity = opacity,
            text = text,
            x = x,
            y = y,
            width = width,
            fontSize = fontSize,
            textColor = textColor,
            isBold = isBold,
            isItalic = isItalic,
            alignment = alignment,
            backgroundColor = backgroundColor,
            borderColor = borderColor,
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
            put("text", text)
            put("x", x.toDouble())
            put("y", y.toDouble())
            put("width", width.toDouble())
            put("fontSize", fontSize.toDouble())
            put("textColor", textColor)
            put("isBold", isBold)
            put("isItalic", isItalic)
            put("alignment", alignment)
            backgroundColor?.let { put("backgroundColor", it) }
            borderColor?.let { put("borderColor", it) }
            put("rotation", rotation.toDouble())
        }
    }

    companion object {
        fun fromJson(json: JSONObject): TextElement {
            val id = json.optString("id", java.util.UUID.randomUUID().toString())
            val zIndex = json.optInt("zIndex", 0)
            val isLocked = json.optBoolean("isLocked", false)
            val opacity = json.optDouble("opacity", 1.0).toFloat()
            val text = json.optString("text", "")
            val x = json.optDouble("x", 0.0).toFloat()
            val y = json.optDouble("y", 0.0).toFloat()
            val width = json.optDouble("width", 260.0).toFloat()
            val fontSize = json.optDouble("fontSize", 22.0).toFloat()
            val textColor = json.optInt("textColor", Color.BLACK)
            val isBold = json.optBoolean("isBold", false)
            val isItalic = json.optBoolean("isItalic", false)
            val alignment = json.optString("alignment", "right")
            val backgroundColor = if (json.has("backgroundColor")) json.getInt("backgroundColor") else null
            val borderColor = if (json.has("borderColor")) json.getInt("borderColor") else null
            val rotation = json.optDouble("rotation", 0.0).toFloat()

            return TextElement(
                id = id,
                zIndex = zIndex,
                isLocked = isLocked,
                opacity = opacity,
                text = text,
                x = x,
                y = y,
                width = width,
                fontSize = fontSize,
                textColor = textColor,
                isBold = isBold,
                isItalic = isItalic,
                alignment = alignment,
                backgroundColor = backgroundColor,
                borderColor = borderColor,
                rotation = rotation
            )
        }
    }
}
