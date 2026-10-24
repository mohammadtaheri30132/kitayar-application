package com.kitayar.modules.canvas.model

import android.graphics.Canvas
import android.graphics.RectF
import org.json.JSONObject

abstract class CanvasElement(
    val id: String = java.util.UUID.randomUUID().toString(),
    var zIndex: Int = 0,
    var isLocked: Boolean = false,
    var opacity: Float = 1.0f
) {
    abstract val type: String

    abstract fun getBounds(): RectF

    abstract fun draw(canvas: Canvas, isSelected: Boolean = false)

    abstract fun containsPoint(wx: Float, wy: Float, tolerance: Float = 12f): Boolean

    abstract fun translate(dx: Float, dy: Float)

    abstract fun scale(scaleX: Float, scaleY: Float, pivotX: Float, pivotY: Float)

    abstract fun rotate(angleDegrees: Float, pivotX: Float, pivotY: Float)

    abstract fun clone(): CanvasElement

    abstract fun toJson(): JSONObject

    companion object {
        fun fromJson(json: JSONObject): CanvasElement? {
            return when (json.optString("type")) {
                "stroke" -> StrokeElement.fromJson(json)
                "shape" -> ShapeElement.fromJson(json)
                "text" -> TextElement.fromJson(json)
                "image" -> ImageElement.fromJson(json)
                else -> null
            }
        }
    }
}
