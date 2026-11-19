package com.kitayar.modules.classroom

import android.graphics.Color

/** Single source of truth for native classroom colors, so the whole UI can be re-themed from here. */
object ClassroomTheme {
    val bg = Color.parseColor("#070B14")
    val surface = Color.parseColor("#0F172A")
    val surfaceHigh = Color.parseColor("#1E293B")
    val border = Color.parseColor("#263349")
    val text = Color.parseColor("#F8FAFC")
    val textMuted = Color.parseColor("#94A3B8")
    val primary = Color.parseColor("#06BA63")
    val primaryDark = Color.parseColor("#064E3B")
    val accent = Color.parseColor("#3B82F6")
    val warning = Color.parseColor("#F59E0B")
    val danger = Color.parseColor("#EF4444")
    val dangerDark = Color.parseColor("#3B1219")
    val page = Color.WHITE
    val pageGrid = Color.parseColor("#E2E8F0")

    val penColors = intArrayOf(
        Color.parseColor("#0F172A"),
        Color.parseColor("#2563EB"),
        Color.parseColor("#DC2626"),
        Color.parseColor("#16A34A"),
        Color.parseColor("#9333EA"),
        Color.parseColor("#EA580C"),
        Color.parseColor("#EAB308")
    )

    const val DEFAULT_WS_BASE = "wss://class.kitayar.ir/api/classroom/native/ws"
    const val DEFAULT_ORIGIN = "https://class.kitayar.ir"
}
