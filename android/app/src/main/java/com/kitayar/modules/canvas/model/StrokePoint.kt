package com.kitayar.modules.canvas.model

import org.json.JSONObject

data class StrokePoint(
    val x: Float,
    val y: Float,
    val pressure: Float = 1.0f,
    val timestamp: Long = System.currentTimeMillis()
) {
    fun toJson(): JSONObject {
        return JSONObject().apply {
            put("x", x.toDouble())
            put("y", y.toDouble())
            put("p", pressure.toDouble())
            put("t", timestamp)
        }
    }

    companion object {
        fun fromJson(json: JSONObject): StrokePoint {
            return StrokePoint(
                x = json.optDouble("x", 0.0).toFloat(),
                y = json.optDouble("y", 0.0).toFloat(),
                pressure = json.optDouble("p", 1.0).toFloat(),
                timestamp = json.optLong("t", System.currentTimeMillis())
            )
        }
    }
}
