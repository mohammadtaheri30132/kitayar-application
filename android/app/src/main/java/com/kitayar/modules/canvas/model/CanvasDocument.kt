package com.kitayar.modules.canvas.model

import android.graphics.Color
import android.graphics.RectF
import org.json.JSONArray
import org.json.JSONObject
import kotlin.math.max
import kotlin.math.min

class CanvasDocument(
    var id: String = java.util.UUID.randomUUID().toString(),
    var title: String = "بوم بدون نام",
    var createdAt: Long = System.currentTimeMillis(),
    var updatedAt: Long = System.currentTimeMillis(),
    var version: Int = 1,
    var backgroundColor: Int = Color.WHITE,
    var gridType: String = "grid", // "none", "grid", "dots", "lines"
    var gridColor: Int = Color.parseColor("#E0E0E0"),
    var gridSpacing: Float = 40f,
    var viewportPanX: Float = 0f,
    var viewportPanY: Float = 0f,
    var viewportScale: Float = 1.0f,
    val elements: MutableList<CanvasElement> = mutableListOf()
) {

    fun addElement(element: CanvasElement) {
        val maxZ = elements.maxOfOrNull { it.zIndex } ?: 0
        element.zIndex = maxZ + 1
        elements.add(element)
        updatedAt = System.currentTimeMillis()
    }

    fun removeElement(elementId: String): CanvasElement? {
        val index = elements.indexOfFirst { it.id == elementId }
        if (index != -1) {
            val removed = elements.removeAt(index)
            updatedAt = System.currentTimeMillis()
            return removed
        }
        return null
    }

    fun getElementById(elementId: String): CanvasElement? {
        return elements.find { it.id == elementId }
    }

    fun bringForward(elementId: String) {
        val idx = elements.indexOfFirst { it.id == elementId }
        if (idx in 0 until elements.size - 1) {
            val el = elements.removeAt(idx)
            elements.add(idx + 1, el)
            reindexZ()
            updatedAt = System.currentTimeMillis()
        }
    }

    fun sendBackward(elementId: String) {
        val idx = elements.indexOfFirst { it.id == elementId }
        if (idx > 0) {
            val el = elements.removeAt(idx)
            elements.add(idx - 1, el)
            reindexZ()
            updatedAt = System.currentTimeMillis()
        }
    }

    fun bringToFront(elementId: String) {
        val idx = elements.indexOfFirst { it.id == elementId }
        if (idx != -1 && idx < elements.size - 1) {
            val el = elements.removeAt(idx)
            elements.add(el)
            reindexZ()
            updatedAt = System.currentTimeMillis()
        }
    }

    fun sendToBack(elementId: String) {
        val idx = elements.indexOfFirst { it.id == elementId }
        if (idx > 0) {
            val el = elements.removeAt(idx)
            elements.add(0, el)
            reindexZ()
            updatedAt = System.currentTimeMillis()
        }
    }

    private fun reindexZ() {
        for (i in elements.indices) {
            elements[i].zIndex = i
        }
    }

    fun getBoundingBox(): RectF {
        if (elements.isEmpty()) {
            return RectF(-500f, -500f, 500f, 500f)
        }

        var minX = Float.MAX_VALUE
        var minY = Float.MAX_VALUE
        var maxX = -Float.MAX_VALUE
        var maxY = -Float.MAX_VALUE

        for (el in elements) {
            val b = el.getBounds()
            minX = min(minX, b.left)
            minY = min(minY, b.top)
            maxX = max(maxX, b.right)
            maxY = max(maxY, b.bottom)
        }

        // Add 50px margin
        return RectF(minX - 50f, minY - 50f, maxX + 50f, maxY + 50f)
    }

    fun toJson(): JSONObject {
        return JSONObject().apply {
            put("id", id)
            put("title", title)
            put("createdAt", createdAt)
            put("updatedAt", updatedAt)
            put("version", version)
            put("backgroundColor", backgroundColor)
            put("gridType", gridType)
            put("gridColor", gridColor)
            put("gridSpacing", gridSpacing.toDouble())
            put("viewportPanX", viewportPanX.toDouble())
            put("viewportPanY", viewportPanY.toDouble())
            put("viewportScale", viewportScale.toDouble())

            val elsArray = JSONArray()
            for (el in elements) {
                elsArray.put(el.toJson())
            }
            put("elements", elsArray)
        }
    }

    companion object {
        fun fromJson(json: JSONObject): CanvasDocument {
            val id = json.optString("id", java.util.UUID.randomUUID().toString())
            val title = json.optString("title", "بوم بدون نام")
            val createdAt = json.optLong("createdAt", System.currentTimeMillis())
            val updatedAt = json.optLong("updatedAt", System.currentTimeMillis())
            val version = json.optInt("version", 1)
            val backgroundColor = json.optInt("backgroundColor", Color.WHITE)
            val gridType = json.optString("gridType", "grid")
            val gridColor = json.optInt("gridColor", Color.parseColor("#E0E0E0"))
            val gridSpacing = json.optDouble("gridSpacing", 40.0).toFloat()
            val panX = json.optDouble("viewportPanX", 0.0).toFloat()
            val panY = json.optDouble("viewportPanY", 0.0).toFloat()
            val scale = json.optDouble("viewportScale", 1.0).toFloat()

            val doc = CanvasDocument(
                id = id,
                title = title,
                createdAt = createdAt,
                updatedAt = updatedAt,
                version = version,
                backgroundColor = backgroundColor,
                gridType = gridType,
                gridColor = gridColor,
                gridSpacing = gridSpacing,
                viewportPanX = panX,
                viewportPanY = panY,
                viewportScale = scale
            )

            val elsArray = json.optJSONArray("elements")
            if (elsArray != null) {
                for (i in 0 until elsArray.length()) {
                    val elObj = elsArray.optJSONObject(i)
                    if (elObj != null) {
                        CanvasElement.fromJson(elObj)?.let { doc.elements.add(it) }
                    }
                }
            }

            return doc
        }
    }
}
