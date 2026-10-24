package com.kitayar.modules.canvas.engine

import android.graphics.*
import com.kitayar.modules.canvas.model.CanvasDocument
import com.kitayar.modules.canvas.model.CanvasElement
import kotlin.math.*

enum class TransformHandle {
    NONE,
    BODY,
    TOP_LEFT,
    TOP,
    TOP_RIGHT,
    RIGHT,
    BOTTOM_RIGHT,
    BOTTOM,
    BOTTOM_LEFT,
    LEFT,
    ROTATE
}

class SelectionManager(
    private val document: CanvasDocument,
    private val viewport: ViewportTransform
) {
    val selectedElements: MutableList<CanvasElement> = mutableListOf()

    var activeHandle: TransformHandle = TransformHandle.NONE
        private set

    private var initialTouchWorld: PointF = PointF(0f, 0f)
    private var initialBounds: RectF = RectF()
    private var initialPivot: PointF = PointF(0f, 0f)
    private var initialRotations: MutableMap<String, Float> = mutableMapOf()

    // Styling
    private val selectionBoxPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        color = Color.parseColor("#2563EB") // Royal blue
        strokeWidth = 2.5f
        pathEffect = DashPathEffect(floatArrayOf(12f, 8f), 0f)
    }

    private val handleFillPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
        color = Color.WHITE
    }

    private val handleStrokePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        color = Color.parseColor("#2563EB")
        strokeWidth = 2.5f
    }

    private val rotateKnobPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
        color = Color.parseColor("#10B981") // Green
    }

    fun hasSelection(): Boolean = selectedElements.isNotEmpty()

    fun clearSelection() {
        selectedElements.clear()
        activeHandle = TransformHandle.NONE
    }

    fun selectElement(element: CanvasElement, addToSelection: Boolean = false) {
        if (!addToSelection) {
            selectedElements.clear()
        }
        if (!selectedElements.contains(element)) {
            selectedElements.add(element)
        }
    }

    fun selectAll() {
        selectedElements.clear()
        selectedElements.addAll(document.elements)
    }

    fun getSelectionBounds(): RectF? {
        if (selectedElements.isEmpty()) return null

        var minX = Float.MAX_VALUE
        var minY = Float.MAX_VALUE
        var maxX = -Float.MAX_VALUE
        var maxY = -Float.MAX_VALUE

        for (el in selectedElements) {
            val b = el.getBounds()
            minX = min(minX, b.left)
            minY = min(minY, b.top)
            maxX = max(maxX, b.right)
            maxY = max(maxY, b.bottom)
        }

        return RectF(minX, minY, maxX, maxY)
    }

    fun hitTest(worldX: Float, worldY: Float): CanvasElement? {
        // Iterate elements backwards (topmost z-index first)
        val sorted = document.elements.sortedByDescending { it.zIndex }
        for (el in sorted) {
            if (el.containsPoint(worldX, worldY, tolerance = 16f)) {
                return el
            }
        }
        return null
    }

    fun hitTestHandle(worldX: Float, worldY: Float): TransformHandle {
        val bounds = getSelectionBounds() ?: return TransformHandle.NONE
        val handleRadiusWorld = viewport.screenDistToWorld(28f) // 28px touch target in screen

        // Check rotate handle (above top center)
        val stemDist = viewport.screenDistToWorld(40f)
        val rx = bounds.centerX()
        val ry = bounds.top - stemDist
        if (dist(worldX, worldY, rx, ry) <= handleRadiusWorld) return TransformHandle.ROTATE

        // Check 8 resize handles
        if (dist(worldX, worldY, bounds.left, bounds.top) <= handleRadiusWorld) return TransformHandle.TOP_LEFT
        if (dist(worldX, worldY, bounds.centerX(), bounds.top) <= handleRadiusWorld) return TransformHandle.TOP
        if (dist(worldX, worldY, bounds.right, bounds.top) <= handleRadiusWorld) return TransformHandle.TOP_RIGHT
        if (dist(worldX, worldY, bounds.right, bounds.centerY()) <= handleRadiusWorld) return TransformHandle.RIGHT
        if (dist(worldX, worldY, bounds.right, bounds.bottom) <= handleRadiusWorld) return TransformHandle.BOTTOM_RIGHT
        if (dist(worldX, worldY, bounds.centerX(), bounds.bottom) <= handleRadiusWorld) return TransformHandle.BOTTOM
        if (dist(worldX, worldY, bounds.left, bounds.bottom) <= handleRadiusWorld) return TransformHandle.BOTTOM_LEFT
        if (dist(worldX, worldY, bounds.left, bounds.centerY()) <= handleRadiusWorld) return TransformHandle.LEFT

        // Check inside body
        if (bounds.contains(worldX, worldY)) return TransformHandle.BODY

        return TransformHandle.NONE
    }

    fun startTransform(handle: TransformHandle, worldX: Float, worldY: Float) {
        activeHandle = handle
        initialTouchWorld.set(worldX, worldY)
        val b = getSelectionBounds() ?: RectF()
        initialBounds.set(b)
        initialPivot.set(b.centerX(), b.centerY())
    }

    fun updateTransform(worldX: Float, worldY: Float, preserveRatio: Boolean = false) {
        if (activeHandle == TransformHandle.NONE || selectedElements.isEmpty()) return

        val dx = worldX - initialTouchWorld.x
        val dy = worldY - initialTouchWorld.y

        when (activeHandle) {
            TransformHandle.BODY -> {
                for (el in selectedElements) {
                    if (!el.isLocked) {
                        el.translate(dx, dy)
                    }
                }
                initialTouchWorld.set(worldX, worldY)
            }
            TransformHandle.ROTATE -> {
                val cx = initialPivot.x
                val cy = initialPivot.y
                val angleStart = atan2((initialTouchWorld.y - cy).toDouble(), (initialTouchWorld.x - cx).toDouble())
                val angleNow = atan2((worldY - cy).toDouble(), (worldX - cx).toDouble())
                val deltaDeg = Math.toDegrees(angleNow - angleStart).toFloat()

                for (el in selectedElements) {
                    if (!el.isLocked) {
                        el.rotate(deltaDeg, cx, cy)
                    }
                }
                initialTouchWorld.set(worldX, worldY)
            }
            else -> {
                // Resize based on handle
                applyResize(handle = activeHandle, curX = worldX, curY = worldY, preserveRatio = preserveRatio)
            }
        }
    }

    private fun applyResize(handle: TransformHandle, curX: Float, curY: Float, preserveRatio: Boolean) {
        val origW = max(10f, initialBounds.width())
        val origH = max(10f, initialBounds.height())

        var newLeft = initialBounds.left
        var newTop = initialBounds.top
        var newRight = initialBounds.right
        var newBottom = initialBounds.bottom

        when (handle) {
            TransformHandle.TOP_LEFT -> {
                newLeft = min(curX, initialBounds.right - 20f)
                newTop = min(curY, initialBounds.bottom - 20f)
            }
            TransformHandle.TOP -> {
                newTop = min(curY, initialBounds.bottom - 20f)
            }
            TransformHandle.TOP_RIGHT -> {
                newRight = max(curX, initialBounds.left + 20f)
                newTop = min(curY, initialBounds.bottom - 20f)
            }
            TransformHandle.RIGHT -> {
                newRight = max(curX, initialBounds.left + 20f)
            }
            TransformHandle.BOTTOM_RIGHT -> {
                newRight = max(curX, initialBounds.left + 20f)
                newBottom = max(curY, initialBounds.top + 20f)
            }
            TransformHandle.BOTTOM -> {
                newBottom = max(curY, initialBounds.top + 20f)
            }
            TransformHandle.BOTTOM_LEFT -> {
                newLeft = min(curX, initialBounds.right - 20f)
                newBottom = max(curY, initialBounds.top + 20f)
            }
            TransformHandle.LEFT -> {
                newLeft = min(curX, initialBounds.right - 20f)
            }
            else -> return
        }

        val newW = max(20f, newRight - newLeft)
        val newH = max(20f, newBottom - newTop)

        val scaleX = newW / origW
        val scaleY = newH / origH

        // Fixed pivot opposite to handle
        val pivotX = when (handle) {
            TransformHandle.TOP_LEFT, TransformHandle.BOTTOM_LEFT, TransformHandle.LEFT -> initialBounds.right
            TransformHandle.TOP_RIGHT, TransformHandle.BOTTOM_RIGHT, TransformHandle.RIGHT -> initialBounds.left
            else -> initialBounds.centerX()
        }
        val pivotY = when (handle) {
            TransformHandle.TOP_LEFT, TransformHandle.TOP, TransformHandle.TOP_RIGHT -> initialBounds.bottom
            TransformHandle.BOTTOM_LEFT, TransformHandle.BOTTOM, TransformHandle.BOTTOM_RIGHT -> initialBounds.top
            else -> initialBounds.centerY()
        }

        // Apply scale incrementally from initial
        val currentBounds = getSelectionBounds() ?: return
        val curW = max(10f, currentBounds.width())
        val curH = max(10f, currentBounds.height())
        val stepScaleX = newW / curW
        val stepScaleY = newH / curH

        for (el in selectedElements) {
            if (!el.isLocked) {
                el.scale(stepScaleX, stepScaleY, pivotX, pivotY)
            }
        }
    }

    fun endTransform() {
        activeHandle = TransformHandle.NONE
    }

    fun drawSelectionOverlay(canvas: Canvas) {
        val bounds = getSelectionBounds() ?: return

        // Convert world bounds to screen for fixed-pixel handle rendering
        val tl = viewport.worldToScreen(bounds.left, bounds.top)
        val br = viewport.worldToScreen(bounds.right, bounds.bottom)
        val screenBounds = RectF(tl.x, tl.y, br.x, br.y)

        // Draw bounding box
        canvas.drawRect(screenBounds, selectionBoxPaint)

        // Draw rotate stem & handle
        val stemLen = 32f
        val topCenterScreenX = screenBounds.centerX()
        val topCenterScreenY = screenBounds.top
        val rotateHandleY = topCenterScreenY - stemLen

        canvas.drawLine(topCenterScreenX, topCenterScreenY, topCenterScreenX, rotateHandleY, selectionBoxPaint)
        canvas.drawCircle(topCenterScreenX, rotateHandleY, 14f, rotateKnobPaint)
        canvas.drawCircle(topCenterScreenX, rotateHandleY, 14f, handleStrokePaint)

        // Draw 8 handles
        val handleRadius = 12f
        val handles = arrayOf(
            PointF(screenBounds.left, screenBounds.top),
            PointF(screenBounds.centerX(), screenBounds.top),
            PointF(screenBounds.right, screenBounds.top),
            PointF(screenBounds.right, screenBounds.centerY()),
            PointF(screenBounds.right, screenBounds.bottom),
            PointF(screenBounds.centerX(), screenBounds.bottom),
            PointF(screenBounds.left, screenBounds.bottom),
            PointF(screenBounds.left, screenBounds.centerY())
        )

        for (h in handles) {
            canvas.drawCircle(h.x, h.y, handleRadius, handleFillPaint)
            canvas.drawCircle(h.x, h.y, handleRadius, handleStrokePaint)
        }
    }

    private fun dist(x1: Float, y1: Float, x2: Float, y2: Float): Float {
        return sqrt((x1 - x2).pow(2) + (y1 - y2).pow(2))
    }
}
