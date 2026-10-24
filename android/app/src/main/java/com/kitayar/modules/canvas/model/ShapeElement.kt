package com.kitayar.modules.canvas.model

import android.graphics.*
import org.json.JSONObject
import kotlin.math.*

class ShapeElement(
    id: String = java.util.UUID.randomUUID().toString(),
    zIndex: Int = 0,
    isLocked: Boolean = false,
    opacity: Float = 1.0f,
    val shapeType: String = "rectangle",
    var shapeBounds: RectF = RectF(0f, 0f, 100f, 100f),
    var strokeColor: Int = Color.BLACK,
    var fillColor: Int? = null,
    var strokeWidth: Float = 4f,
    var strokeStyle: String = "solid", // "solid", "dashed", "dotted"
    var rotation: Float = 0f,
    var startArrow: Boolean = false,
    var endArrow: Boolean = false
) : CanvasElement(id, zIndex, isLocked, opacity) {

    override val type: String = "shape"

    @Transient
    private var cachedStrokePaint: Paint? = null
    @Transient
    private var cachedFillPaint: Paint? = null
    @Transient
    private var cachedPath: Path? = null

    override fun getBounds(): RectF {
        val pad = strokeWidth * 1.5f + 8f
        val r = RectF(shapeBounds.left - pad, shapeBounds.top - pad, shapeBounds.right + pad, shapeBounds.bottom + pad)
        if (rotation == 0f) return r

        // Rotated bounding box
        val cx = shapeBounds.centerX()
        val cy = shapeBounds.centerY()
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

    private fun getStrokePaint(): Paint {
        val paint = cachedStrokePaint ?: Paint(Paint.ANTI_ALIAS_FLAG).apply {
            style = Paint.Style.STROKE
            strokeCap = Paint.Cap.ROUND
            strokeJoin = Paint.Join.ROUND
        }.also { cachedStrokePaint = it }

        val a = (Color.alpha(strokeColor) * opacity).toInt().coerceIn(0, 255)
        paint.color = Color.argb(a, Color.red(strokeColor), Color.green(strokeColor), Color.blue(strokeColor))
        paint.strokeWidth = strokeWidth

        when (strokeStyle) {
            "dashed" -> paint.pathEffect = DashPathEffect(floatArrayOf(strokeWidth * 3f, strokeWidth * 2f), 0f)
            "dotted" -> paint.pathEffect = DashPathEffect(floatArrayOf(strokeWidth, strokeWidth * 1.5f), 0f)
            else -> paint.pathEffect = null
        }
        return paint
    }

    private fun getFillPaint(): Paint? {
        val fc = fillColor ?: return null
        val paint = cachedFillPaint ?: Paint(Paint.ANTI_ALIAS_FLAG).apply {
            style = Paint.Style.FILL
        }.also { cachedFillPaint = it }

        val a = (Color.alpha(fc) * opacity).toInt().coerceIn(0, 255)
        paint.color = Color.argb(a, Color.red(fc), Color.green(fc), Color.blue(fc))
        return paint
    }

    fun buildPath(): Path {
        val p = Path()
        val l = shapeBounds.left
        val t = shapeBounds.top
        val r = shapeBounds.right
        val b = shapeBounds.bottom
        val w = shapeBounds.width()
        val h = shapeBounds.height()
        val cx = shapeBounds.centerX()
        val cy = shapeBounds.centerY()

        when (shapeType) {
            "line", "arrow", "double_arrow" -> {
                p.moveTo(l, t)
                p.lineTo(r, b)
            }
            "rectangle", "process" -> {
                p.addRect(shapeBounds, Path.Direction.CW)
            }
            "rounded_rectangle" -> {
                val cornerRadius = min(w, h) * 0.15f
                p.addRoundRect(shapeBounds, cornerRadius, cornerRadius, Path.Direction.CW)
            }
            "circle", "ellipse" -> {
                p.addOval(shapeBounds, Path.Direction.CW)
            }
            "triangle" -> {
                p.moveTo(cx, t)
                p.lineTo(r, b)
                p.lineTo(l, b)
                p.close()
            }
            "diamond", "decision" -> {
                p.moveTo(cx, t)
                p.lineTo(r, cy)
                p.lineTo(cx, b)
                p.lineTo(l, cy)
                p.close()
            }
            "polygon" -> {
                val sides = 6
                val rx = w / 2f
                val ry = h / 2f
                for (i in 0 until sides) {
                    val angle = Math.toRadians((i * 360.0 / sides) - 90.0)
                    val px = cx + rx * cos(angle).toFloat()
                    val py = cy + ry * sin(angle).toFloat()
                    if (i == 0) p.moveTo(px, py) else p.lineTo(px, py)
                }
                p.close()
            }
            "star" -> {
                val outerRx = w / 2f
                val outerRy = h / 2f
                val innerRx = outerRx * 0.42f
                val innerRy = outerRy * 0.42f
                for (i in 0 until 10) {
                    val angle = Math.toRadians((i * 36.0) - 90.0)
                    val radX = if (i % 2 == 0) outerRx else innerRx
                    val radY = if (i % 2 == 0) outerRy else innerRy
                    val px = cx + radX * cos(angle).toFloat()
                    val py = cy + radY * sin(angle).toFloat()
                    if (i == 0) p.moveTo(px, py) else p.lineTo(px, py)
                }
                p.close()
            }
            "speech_bubble", "callout" -> {
                val tailH = h * 0.22f
                val boxB = b - tailH
                val cr = min(w, boxB - t) * 0.15f
                val boxRect = RectF(l, t, r, boxB)
                p.addRoundRect(boxRect, cr, cr, Path.Direction.CW)
                p.moveTo(l + w * 0.25f, boxB)
                p.lineTo(l + w * 0.15f, b)
                p.lineTo(l + w * 0.45f, boxB)
            }
            "document" -> {
                val waveH = h * 0.12f
                val topB = b - waveH
                p.moveTo(l, t)
                p.lineTo(r, t)
                p.lineTo(r, topB)
                p.cubicTo(r - w * 0.25f, topB + waveH, cx, topB - waveH, l + w * 0.25f, topB + waveH * 0.5f)
                p.lineTo(l, topB)
                p.close()
            }
            "cylinder" -> {
                val capH = h * 0.2f
                val topOval = RectF(l, t, r, t + capH)
                p.addOval(topOval, Path.Direction.CW)
                p.moveTo(l, t + capH / 2f)
                p.lineTo(l, b - capH / 2f)
                val bottomOval = RectF(l, b - capH, r, b)
                p.arcTo(bottomOval, 180f, -180f)
                p.lineTo(r, t + capH / 2f)
            }
            "cloud" -> {
                val pCloud = Path()
                pCloud.moveTo(l + w * 0.2f, b - h * 0.2f)
                pCloud.cubicTo(l - w * 0.05f, b - h * 0.2f, l - w * 0.05f, t + h * 0.4f, l + w * 0.2f, t + h * 0.35f)
                pCloud.cubicTo(l + w * 0.1f, t - h * 0.05f, l + w * 0.6f, t - h * 0.05f, cx, t + h * 0.25f)
                pCloud.cubicTo(r - w * 0.1f, t, r + w * 0.05f, t + h * 0.4f, r - w * 0.15f, b - h * 0.25f)
                pCloud.cubicTo(r + w * 0.05f, b + h * 0.05f, l + w * 0.4f, b + h * 0.05f, l + w * 0.2f, b - h * 0.2f)
                pCloud.close()
                return pCloud
            }
            "bracket" -> {
                p.moveTo(r, t)
                p.lineTo(l, t)
                p.lineTo(l, b)
                p.lineTo(r, b)
            }
            "connector" -> {
                p.moveTo(l, t)
                p.lineTo(cx, t)
                p.lineTo(cx, b)
                p.lineTo(r, b)
            }
            else -> {
                p.addRect(shapeBounds, Path.Direction.CW)
            }
        }
        return p
    }

    override fun draw(canvas: Canvas, isSelected: Boolean) {
        canvas.save()
        if (rotation != 0f) {
            canvas.rotate(rotation, shapeBounds.centerX(), shapeBounds.centerY())
        }

        val strokePaint = getStrokePaint()
        val fillPaint = getFillPaint()
        val path = buildPath()

        if (fillPaint != null && shapeType !in listOf("line", "arrow", "double_arrow", "bracket", "connector")) {
            canvas.drawPath(path, fillPaint)
        }

        canvas.drawPath(path, strokePaint)

        val isArrowType = shapeType == "arrow" || endArrow
        val isDoubleArrowType = shapeType == "double_arrow" || (startArrow && endArrow)

        if (shapeType in listOf("line", "arrow", "double_arrow", "connector")) {
            if (isArrowType || isDoubleArrowType) {
                drawArrowHead(canvas, shapeBounds.left, shapeBounds.top, shapeBounds.right, shapeBounds.bottom, strokePaint)
            }
            if (isDoubleArrowType || startArrow) {
                drawArrowHead(canvas, shapeBounds.right, shapeBounds.bottom, shapeBounds.left, shapeBounds.top, strokePaint)
            }
        }

        canvas.restore()
    }

    private fun drawArrowHead(canvas: Canvas, fromX: Float, fromY: Float, toX: Float, toY: Float, paint: Paint) {
        val angle = atan2((toY - fromY).toDouble(), (toX - fromX).toDouble())
        val arrowSize = max(18f, strokeWidth * 3.5f)
        val arrowAngle = Math.PI / 6.0

        val x1 = (toX - arrowSize * cos(angle - arrowAngle)).toFloat()
        val y1 = (toY - arrowSize * sin(angle - arrowAngle)).toFloat()
        val x2 = (toX - arrowSize * cos(angle + arrowAngle)).toFloat()
        val y2 = (toY - arrowSize * sin(angle + arrowAngle)).toFloat()

        val arrowPath = Path().apply {
            moveTo(toX, toY)
            lineTo(x1, y1)
            lineTo(x2, y2)
            close()
        }

        val arrowPaint = Paint(paint).apply {
            style = Paint.Style.FILL_AND_STROKE
        }
        canvas.drawPath(arrowPath, arrowPaint)
    }

    override fun containsPoint(wx: Float, wy: Float, tolerance: Float): Boolean {
        var px = wx
        var py = wy
        if (rotation != 0f) {
            val cx = shapeBounds.centerX()
            val cy = shapeBounds.centerY()
            val rad = Math.toRadians(-rotation.toDouble())
            val cosA = cos(rad).toFloat()
            val sinA = sin(rad).toFloat()
            val dx = wx - cx
            val dy = wy - cy
            px = cx + dx * cosA - dy * sinA
            py = cy + dx * sinA + dy * cosA
        }

        val effTol = max(tolerance, strokeWidth + 6f)
        val expanded = RectF(shapeBounds.left - effTol, shapeBounds.top - effTol, shapeBounds.right + effTol, shapeBounds.bottom + effTol)
        if (!expanded.contains(px, py)) return false

        if (shapeType in listOf("line", "arrow", "double_arrow")) {
            val l2 = (shapeBounds.right - shapeBounds.left).pow(2) + (shapeBounds.bottom - shapeBounds.top).pow(2)
            if (l2 == 0f) return true
            val t = max(0f, min(1f, ((px - shapeBounds.left) * (shapeBounds.right - shapeBounds.left) + (py - shapeBounds.top) * (shapeBounds.bottom - shapeBounds.top)) / l2))
            val projX = shapeBounds.left + t * (shapeBounds.right - shapeBounds.left)
            val projY = shapeBounds.top + t * (shapeBounds.bottom - shapeBounds.top)
            val distSq = (px - projX).pow(2) + (py - projY).pow(2)
            return distSq <= effTol * effTol
        }

        if (fillColor != null) {
            return shapeBounds.contains(px, py)
        }

        val inner = RectF(shapeBounds.left + effTol, shapeBounds.top + effTol, shapeBounds.right - effTol, shapeBounds.bottom - effTol)
        return !inner.contains(px, py)
    }

    override fun translate(dx: Float, dy: Float) {
        shapeBounds.offset(dx, dy)
    }

    override fun scale(scaleX: Float, scaleY: Float, pivotX: Float, pivotY: Float) {
        val nl = pivotX + (shapeBounds.left - pivotX) * scaleX
        val nr = pivotX + (shapeBounds.right - pivotX) * scaleX
        val nt = pivotY + (shapeBounds.top - pivotY) * scaleY
        val nb = pivotY + (shapeBounds.bottom - pivotY) * scaleY
        shapeBounds.set(min(nl, nr), min(nt, nb), max(nl, nr), max(nt, nb))
        strokeWidth *= (abs(scaleX) + abs(scaleY)) / 2f
    }

    override fun rotate(angleDegrees: Float, pivotX: Float, pivotY: Float) {
        rotation = (rotation + angleDegrees) % 360f
    }

    override fun clone(): CanvasElement {
        return ShapeElement(
            id = java.util.UUID.randomUUID().toString(),
            zIndex = zIndex,
            isLocked = isLocked,
            opacity = opacity,
            shapeType = shapeType,
            shapeBounds = RectF(shapeBounds),
            strokeColor = strokeColor,
            fillColor = fillColor,
            strokeWidth = strokeWidth,
            strokeStyle = strokeStyle,
            rotation = rotation,
            startArrow = startArrow,
            endArrow = endArrow
        )
    }

    override fun toJson(): JSONObject {
        return JSONObject().apply {
            put("id", id)
            put("type", type)
            put("zIndex", zIndex)
            put("isLocked", isLocked)
            put("opacity", opacity.toDouble())
            put("shapeType", shapeType)
            put("strokeColor", strokeColor)
            fillColor?.let { put("fillColor", it) }
            put("strokeWidth", strokeWidth.toDouble())
            put("strokeStyle", strokeStyle)
            put("rotation", rotation.toDouble())
            put("startArrow", startArrow)
            put("endArrow", endArrow)
            put("bounds", JSONObject().apply {
                put("left", shapeBounds.left.toDouble())
                put("top", shapeBounds.top.toDouble())
                put("right", shapeBounds.right.toDouble())
                put("bottom", shapeBounds.bottom.toDouble())
            })
        }
    }

    companion object {
        fun fromJson(json: JSONObject): ShapeElement {
            val id = json.optString("id", java.util.UUID.randomUUID().toString())
            val zIndex = json.optInt("zIndex", 0)
            val isLocked = json.optBoolean("isLocked", false)
            val opacity = json.optDouble("opacity", 1.0).toFloat()
            val shapeType = json.optString("shapeType", "rectangle")
            val strokeColor = json.optInt("strokeColor", Color.BLACK)
            val fillColor = if (json.has("fillColor")) json.getInt("fillColor") else null
            val strokeWidth = json.optDouble("strokeWidth", 4.0).toFloat()
            val strokeStyle = json.optString("strokeStyle", "solid")
            val rotation = json.optDouble("rotation", 0.0).toFloat()
            val startArrow = json.optBoolean("startArrow", false)
            val endArrow = json.optBoolean("endArrow", false)

            val bObj = json.optJSONObject("bounds")
            val bounds = if (bObj != null) {
                RectF(
                    bObj.optDouble("left", 0.0).toFloat(),
                    bObj.optDouble("top", 0.0).toFloat(),
                    bObj.optDouble("right", 100.0).toFloat(),
                    bObj.optDouble("bottom", 100.0).toFloat()
                )
            } else {
                RectF(0f, 0f, 100f, 100f)
            }

            return ShapeElement(
                id = id,
                zIndex = zIndex,
                isLocked = isLocked,
                opacity = opacity,
                shapeType = shapeType,
                shapeBounds = bounds,
                strokeColor = strokeColor,
                fillColor = fillColor,
                strokeWidth = strokeWidth,
                strokeStyle = strokeStyle,
                rotation = rotation,
                startArrow = startArrow,
                endArrow = endArrow
            )
        }
    }
}
