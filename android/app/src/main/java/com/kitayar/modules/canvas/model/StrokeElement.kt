package com.kitayar.modules.canvas.model

import android.graphics.*
import org.json.JSONArray
import org.json.JSONObject
import kotlin.math.*

class StrokeElement(
    id: String = java.util.UUID.randomUUID().toString(),
    zIndex: Int = 0,
    isLocked: Boolean = false,
    opacity: Float = 1.0f,
    val toolType: String = "pen", // "pen", "pencil", "brush", "highlighter"
    var color: Int = Color.BLACK,
    var strokeWidth: Float = 5f,
    val points: MutableList<StrokePoint> = mutableListOf()
) : CanvasElement(id, zIndex, isLocked, opacity) {

    override val type: String = "stroke"

    @Transient
    private var cachedPath: Path? = null
    @Transient
    private var cachedBounds: RectF? = null
    @Transient
    private var cachedPaint: Paint? = null

    init {
        rebuildPath()
    }

    fun addPoint(point: StrokePoint) {
        points.add(point)
        cachedBounds = null
        if (cachedPath == null) {
            rebuildPath()
        } else {
            val count = points.size
            if (count == 2) {
                cachedPath?.lineTo(point.x, point.y)
            } else if (count > 2) {
                val prev = points[count - 2]
                val prevPrev = points[count - 3]
                val midX1 = (prevPrev.x + prev.x) / 2f
                val midY1 = (prevPrev.y + prev.y) / 2f
                val midX2 = (prev.x + point.x) / 2f
                val midY2 = (prev.y + point.y) / 2f
                cachedPath?.quadTo(prev.x, prev.y, midX2, midY2)
            }
        }
    }

    fun rebuildPath() {
        val path = Path()
        if (points.isEmpty()) {
            cachedPath = path
            return
        }

        if (points.size == 1) {
            val p = points[0]
            path.addCircle(p.x, p.y, strokeWidth / 2f, Path.Direction.CW)
            cachedPath = path
            return
        }

        val first = points[0]
        path.moveTo(first.x, first.y)

        if (points.size == 2) {
            val second = points[1]
            path.lineTo(second.x, second.y)
        } else {
            for (i in 1 until points.size - 1) {
                val pCurrent = points[i]
                val pNext = points[i + 1]
                val midX = (pCurrent.x + pNext.x) / 2f
                val midY = (pCurrent.y + pNext.y) / 2f
                path.quadTo(pCurrent.x, pCurrent.y, midX, midY)
            }
            val last = points.last()
            path.lineTo(last.x, last.y)
        }

        cachedPath = path
        cachedBounds = null
    }

    override fun getBounds(): RectF {
        cachedBounds?.let { return it }

        if (points.isEmpty()) {
            val empty = RectF(0f, 0f, 0f, 0f)
            cachedBounds = empty
            return empty
        }

        var minX = Float.MAX_VALUE
        var minY = Float.MAX_VALUE
        var maxX = -Float.MAX_VALUE
        var maxY = -Float.MAX_VALUE

        for (p in points) {
            if (p.x < minX) minX = p.x
            if (p.x > maxX) maxX = p.x
            if (p.y < minY) minY = p.y
            if (p.y > maxY) maxY = p.y
        }

        val padding = strokeWidth * 1.5f + 4f
        val bounds = RectF(minX - padding, minY - padding, maxX + padding, maxY + padding)
        cachedBounds = bounds
        return bounds
    }

    private fun getOrCreatePaint(): Paint {
        val paint = cachedPaint ?: Paint(Paint.ANTI_ALIAS_FLAG).apply {
            style = Paint.Style.STROKE
            strokeCap = Paint.Cap.ROUND
            strokeJoin = Paint.Join.ROUND
        }.also { cachedPaint = it }

        val baseAlpha = Color.alpha(color)
        val finalAlpha = when (toolType) {
            "highlighter" -> (baseAlpha * opacity * 0.38f).toInt().coerceIn(0, 255)
            "pencil" -> (baseAlpha * opacity * 0.75f).toInt().coerceIn(0, 255)
            else -> (baseAlpha * opacity).toInt().coerceIn(0, 255)
        }

        paint.color = Color.argb(finalAlpha, Color.red(color), Color.green(color), Color.blue(color))
        paint.strokeWidth = strokeWidth

        if (toolType == "highlighter") {
            paint.strokeCap = Paint.Cap.SQUARE
        } else {
            paint.strokeCap = Paint.Cap.ROUND
        }

        return paint
    }

    override fun draw(canvas: Canvas, isSelected: Boolean) {
        if (points.isEmpty()) return
        if (cachedPath == null) rebuildPath()

        val paint = getOrCreatePaint()
        cachedPath?.let { canvas.drawPath(it, paint) }
    }

    override fun containsPoint(wx: Float, wy: Float, tolerance: Float): Boolean {
        val bounds = getBounds()
        val effTolerance = max(tolerance, strokeWidth / 2f + 6f)
        if (wx < bounds.left - effTolerance || wx > bounds.right + effTolerance ||
            wy < bounds.top - effTolerance || wy > bounds.bottom + effTolerance
        ) {
            return false
        }

        if (points.size == 1) {
            val p = points[0]
            val distSq = (wx - p.x) * (wx - p.x) + (wy - p.y) * (wy - p.y)
            return distSq <= effTolerance * effTolerance
        }

        // Check distance to line segments
        for (i in 0 until points.size - 1) {
            val p1 = points[i]
            val p2 = points[i + 1]
            if (distToSegmentSquared(wx, wy, p1.x, p1.y, p2.x, p2.y) <= effTolerance * effTolerance) {
                return true
            }
        }
        return false
    }

    private fun distToSegmentSquared(px: Float, py: Float, vx: Float, vy: Float, wx: Float, wy: Float): Float {
        val l2 = (wx - vx) * (wx - vx) + (wy - vy) * (wy - vy)
        if (l2 == 0f) return (px - vx) * (px - vx) + (py - vy) * (py - vy)
        val t = max(0f, min(1f, ((px - vx) * (wx - vx) + (py - vy) * (wy - vy)) / l2))
        val projX = vx + t * (wx - vx)
        val projY = vy + t * (wy - vy)
        return (px - projX) * (px - projX) + (py - projY) * (py - projY)
    }

    override fun translate(dx: Float, dy: Float) {
        for (i in points.indices) {
            val p = points[i]
            points[i] = p.copy(x = p.x + dx, y = p.y + dy)
        }
        rebuildPath()
    }

    override fun scale(scaleX: Float, scaleY: Float, pivotX: Float, pivotY: Float) {
        for (i in points.indices) {
            val p = points[i]
            val nx = pivotX + (p.x - pivotX) * scaleX
            val ny = pivotY + (p.y - pivotY) * scaleY
            points[i] = p.copy(x = nx, y = ny)
        }
        strokeWidth *= (abs(scaleX) + abs(scaleY)) / 2f
        rebuildPath()
    }

    override fun rotate(angleDegrees: Float, pivotX: Float, pivotY: Float) {
        val rad = Math.toRadians(angleDegrees.toDouble())
        val cosA = cos(rad).toFloat()
        val sinA = sin(rad).toFloat()

        for (i in points.indices) {
            val p = points[i]
            val dx = p.x - pivotX
            val dy = p.y - pivotY
            val nx = pivotX + dx * cosA - dy * sinA
            val ny = pivotY + dx * sinA + dy * cosA
            points[i] = p.copy(x = nx, y = ny)
        }
        rebuildPath()
    }

    override fun clone(): CanvasElement {
        val clonedPoints = points.map { it.copy() }.toMutableList()
        return StrokeElement(
            id = java.util.UUID.randomUUID().toString(),
            zIndex = zIndex,
            isLocked = isLocked,
            opacity = opacity,
            toolType = toolType,
            color = color,
            strokeWidth = strokeWidth,
            points = clonedPoints
        )
    }

    override fun toJson(): JSONObject {
        return JSONObject().apply {
            put("id", id)
            put("type", type)
            put("zIndex", zIndex)
            put("isLocked", isLocked)
            put("opacity", opacity.toDouble())
            put("toolType", toolType)
            put("color", color)
            put("strokeWidth", strokeWidth.toDouble())

            val ptsArray = JSONArray()
            for (p in points) {
                ptsArray.put(p.toJson())
            }
            put("points", ptsArray)
        }
    }

    companion object {
        fun fromJson(json: JSONObject): StrokeElement {
            val id = json.optString("id", java.util.UUID.randomUUID().toString())
            val zIndex = json.optInt("zIndex", 0)
            val isLocked = json.optBoolean("isLocked", false)
            val opacity = json.optDouble("opacity", 1.0).toFloat()
            val toolType = json.optString("toolType", "pen")
            val color = json.optInt("color", Color.BLACK)
            val strokeWidth = json.optDouble("strokeWidth", 5.0).toFloat()

            val points = mutableListOf<StrokePoint>()
            val ptsArray = json.optJSONArray("points")
            if (ptsArray != null) {
                for (i in 0 until ptsArray.length()) {
                    val ptObj = ptsArray.optJSONObject(i)
                    if (ptObj != null) {
                        points.add(StrokePoint.fromJson(ptObj))
                    }
                }
            }

            return StrokeElement(
                id = id,
                zIndex = zIndex,
                isLocked = isLocked,
                opacity = opacity,
                toolType = toolType,
                color = color,
                strokeWidth = strokeWidth,
                points = points
            )
        }
    }
}
