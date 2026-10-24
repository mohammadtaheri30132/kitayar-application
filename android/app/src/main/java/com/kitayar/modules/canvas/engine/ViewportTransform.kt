package com.kitayar.modules.canvas.engine

import android.graphics.PointF
import android.graphics.RectF
import kotlin.math.max
import kotlin.math.min

class ViewportTransform {
    var scale: Float = 1.0f
        private set
    var panX: Float = 0f
        private set
    var panY: Float = 0f
        private set

    var screenWidth: Float = 1080f
    var screenHeight: Float = 1920f

    val minScale: Float = 0.08f
    val maxScale: Float = 12.0f

    fun setViewport(newScale: Float, newPanX: Float, newPanY: Float) {
        scale = newScale.coerceIn(minScale, maxScale)
        panX = newPanX
        panY = newPanY
    }

    fun screenToWorld(sx: Float, sy: Float): PointF {
        val wx = (sx - panX) / scale
        val wy = (sy - panY) / scale
        return PointF(wx, wy)
    }

    fun worldToScreen(wx: Float, wy: Float): PointF {
        val sx = wx * scale + panX
        val sy = wy * scale + panY
        return PointF(sx, sy)
    }

    fun screenDistToWorld(dist: Float): Float {
        return dist / scale
    }

    fun worldDistToScreen(dist: Float): Float {
        return dist * scale
    }

    fun getVisibleWorldBounds(): RectF {
        val tl = screenToWorld(0f, 0f)
        val br = screenToWorld(screenWidth, screenHeight)
        return RectF(tl.x, tl.y, br.x, br.y)
    }

    fun panBy(dx: Float, dy: Float) {
        panX += dx
        panY += dy
    }

    fun zoomAt(factor: Float, focusScreenX: Float, focusScreenY: Float) {
        val oldScale = scale
        val targetScale = (scale * factor).coerceIn(minScale, maxScale)
        if (oldScale == targetScale) return

        panX = focusScreenX - (focusScreenX - panX) * (targetScale / oldScale)
        panY = focusScreenY - (focusScreenY - panY) * (targetScale / oldScale)
        scale = targetScale
    }

    fun zoomIn(focusX: Float = screenWidth / 2f, focusY: Float = screenHeight / 2f) {
        zoomAt(1.25f, focusX, focusY)
    }

    fun zoomOut(focusX: Float = screenWidth / 2f, focusY: Float = screenHeight / 2f) {
        zoomAt(0.8f, focusX, focusY)
    }

    fun reset() {
        scale = 1.0f
        panX = screenWidth / 2f
        panY = screenHeight / 2f
    }

    fun fitToBounds(worldBounds: RectF, paddingDp: Float = 60f) {
        if (worldBounds.width() <= 0 || worldBounds.height() <= 0) {
            reset()
            return
        }

        val availW = screenWidth - paddingDp * 2f
        val availH = screenHeight - paddingDp * 2f
        val scaleX = availW / worldBounds.width()
        val scaleY = availH / worldBounds.height()
        val targetScale = min(scaleX, scaleY).coerceIn(minScale, maxScale)

        val worldCenterX = worldBounds.centerX()
        val worldCenterY = worldBounds.centerY()

        scale = targetScale
        panX = screenWidth / 2f - worldCenterX * targetScale
        panY = screenHeight / 2f - worldCenterY * targetScale
    }
}
