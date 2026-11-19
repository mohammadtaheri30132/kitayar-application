package com.kitayar.modules.classroom

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RectF
import android.util.Base64
import android.view.MotionEvent
import android.view.ScaleGestureDetector
import android.view.View
import org.json.JSONArray
import org.json.JSONObject
import java.net.URL
import java.util.concurrent.Executors
import kotlin.math.abs
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sin

/**
 * Hardware-accelerated whiteboard/slide surface. Elements use the same normalized (0..1) JSON schema
 * as the web client, so drawings stay in sync across platforms. Supports pinch-zoom and pan.
 */
class WhiteboardView(context: Context) : View(context) {

    interface Callbacks {
        fun onCommit(page: Int, element: JSONObject)
        fun onProgress(page: Int, element: JSONObject)
        fun onErase(page: Int, elementId: String)
        fun onLaser(page: Int, x: Double, y: Double, active: Boolean)
        fun onTextRequest(page: Int, x: Double, y: Double)
    }

    var callbacks: Callbacks? = null
    var canDraw = false
    var tool = "pen"
    var penColor = ClassroomTheme.penColors[0]
    var penSize = 4.5
    var currentPage = 1
        set(v) { field = v; resetViewport(); invalidate() }
    var gridMode = "blank"

    private val pages = HashMap<Int, MutableList<JSONObject>>()
    private val backgrounds = HashMap<Int, String>()
    private val bitmaps = HashMap<String, Bitmap>()
    private val loading = HashSet<String>()
    private val io = Executors.newFixedThreadPool(2)

    private var draft: JSONObject? = null
    private var draftPage = 1
    private var remoteDrafts = HashMap<String, Pair<Int, JSONObject>>()
    private var laser: Triple<Int, Float, Float>? = null
    private var lastProgressAt = 0L

    private var scale = 1f
    private var tx = 0f
    private var ty = 0f
    private var lastX = 0f
    private var lastY = 0f
    private var panning = false
    private var scaling = false

    private val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        strokeCap = Paint.Cap.ROUND
        strokeJoin = Paint.Join.ROUND
        style = Paint.Style.STROKE
    }
    private val textPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        textAlign = Paint.Align.RIGHT
        isFakeBoldText = true
    }
    private val gridPaint = Paint().apply { color = ClassroomTheme.pageGrid; strokeWidth = 1f }
    private val pageFill = Paint().apply { color = ClassroomTheme.page }
    private val laserPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = ClassroomTheme.danger; style = Paint.Style.FILL }

    private val scaleDetector = ScaleGestureDetector(context, object : ScaleGestureDetector.SimpleOnScaleGestureListener() {
        override fun onScale(d: ScaleGestureDetector): Boolean {
            val old = scale
            scale = (scale * d.scaleFactor).coerceIn(1f, 5f)
            val f = scale / old
            tx = d.focusX - (d.focusX - tx) * f
            ty = d.focusY - (d.focusY - ty) * f
            clampViewport()
            invalidate()
            return true
        }
    })

    // ---------- state sync ----------
    fun syncState(wb: JSONObject) {
        pages.clear()
        wb.optJSONObject("pages")?.let { p ->
            p.keys().forEach { k ->
                val arr = p.optJSONArray(k) ?: return@forEach
                pages[k.toInt()] = jsonList(arr)
            }
        }
        backgrounds.clear()
        wb.optJSONObject("pageBackgrounds")?.let { b ->
            b.keys().forEach { k -> backgrounds[k.toInt()] = b.optString(k) }
        }
        gridMode = wb.optString("gridMode", gridMode)
        val cur = wb.optInt("currentPage", currentPage)
        if (cur != currentPage) currentPage = cur
        totalPages = max(wb.optInt("totalPages", totalPages), 1)
        invalidate()
    }

    var totalPages = 1

    fun addElement(page: Int, el: JSONObject) {
        val list = pages.getOrPut(page) { mutableListOf() }
        // The server echoes our own add_element back; skip duplicates by id.
        if (list.none { it.optString("id") == el.optString("id") }) list.add(el)
        invalidate()
    }

    fun eraseElement(page: Int, id: String) {
        pages[page]?.removeAll { it.optString("id") == id }
        invalidate()
    }

    fun clearPage(page: Int) { pages[page]?.clear(); invalidate() }

    fun setRemoteDraft(peerId: String, page: Int, el: JSONObject) {
        remoteDrafts[peerId] = page to el
        invalidate()
    }

    fun clearRemoteDraft(peerId: String) { remoteDrafts.remove(peerId); invalidate() }

    fun setLaser(page: Int, x: Float, y: Float, active: Boolean) {
        laser = if (active) Triple(page, x, y) else null
        invalidate()
    }

    fun changePage(page: Int, elements: JSONArray?) {
        if (elements != null) pages[page] = jsonList(elements)
        currentPage = page
    }

    private fun jsonList(arr: JSONArray): MutableList<JSONObject> {
        val l = mutableListOf<JSONObject>()
        for (i in 0 until arr.length()) arr.optJSONObject(i)?.let { l.add(it) }
        return l
    }

    private fun resetViewport() { scale = 1f; tx = 0f; ty = 0f }

    // ---------- geometry ----------
    private fun pageRect(): RectF {
        val bmp = backgrounds[currentPage]?.let { bitmaps[it] }
        val aspect = if (bmp != null) bmp.width.toFloat() / bmp.height else 16f / 10f
        val availW = width.toFloat() - 16f
        val availH = height.toFloat() - 16f
        var w = availW
        var h = w / aspect
        if (h > availH) { h = availH; w = h * aspect }
        val l = (width - w) / 2f
        val t = (height - h) / 2f
        return RectF(l, t, l + w, t + h)
    }

    private fun clampViewport() {
        val maxX = (scale - 1f) * width
        val maxY = (scale - 1f) * height
        tx = tx.coerceIn(-maxX, 0f)
        ty = ty.coerceIn(-maxY, 0f)
    }

    private fun toNormalized(x: Float, y: Float): Pair<Double, Double> {
        val r = pageRect()
        val cx = (x - tx) / scale
        val cy = (y - ty) / scale
        return ((cx - r.left) / r.width()).toDouble().coerceIn(0.0, 1.0) to
            ((cy - r.top) / r.height()).toDouble().coerceIn(0.0, 1.0)
    }

    // ---------- drawing ----------
    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        canvas.save()
        canvas.translate(tx, ty)
        canvas.scale(scale, scale)
        val r = pageRect()
        canvas.drawRect(r, pageFill)

        val bgSrc = backgrounds[currentPage]
        if (bgSrc != null) {
            val bmp = bitmaps[bgSrc]
            if (bmp != null) canvas.drawBitmap(bmp, null, r, null) else loadBackground(bgSrc)
        } else {
            drawGrid(canvas, r)
        }

        canvas.clipRect(r)
        pages[currentPage]?.forEach { drawElement(canvas, it, r) }
        draft?.takeIf { draftPage == currentPage }?.let { drawElement(canvas, it, r) }
        remoteDrafts.values.forEach { (p, el) -> if (p == currentPage) drawElement(canvas, el, r) }
        laser?.let { (p, x, y) ->
            if (p == currentPage) canvas.drawCircle(r.left + x * r.width(), r.top + y * r.height(), 14f, laserPaint)
        }
        canvas.restore()
    }

    private fun drawGrid(canvas: Canvas, r: RectF) {
        when (gridMode) {
            "grid" -> {
                val step = r.width() / 24f
                var x = r.left; while (x <= r.right) { canvas.drawLine(x, r.top, x, r.bottom, gridPaint); x += step }
                var y = r.top; while (y <= r.bottom) { canvas.drawLine(r.left, y, r.right, y, gridPaint); y += step }
            }
            "lined" -> {
                val step = r.height() / 14f
                var y = r.top + step; while (y < r.bottom) { canvas.drawLine(r.left, y, r.right, y, gridPaint); y += step }
            }
            "dots" -> {
                val step = r.width() / 24f
                var y = r.top + step; while (y < r.bottom) {
                    var x = r.left + step
                    while (x < r.right) { canvas.drawCircle(x, y, 2f, gridPaint); x += step }
                    y += step
                }
            }
        }
    }

    private fun drawElement(canvas: Canvas, el: JSONObject, r: RectF) {
        val tool = el.optString("tool")
        val w = r.width(); val h = r.height()
        val color = runCatching { android.graphics.Color.parseColor(el.optString("color", "#0F172A")) }.getOrDefault(ClassroomTheme.penColors[0])
        val scaled = max(1.8f, (el.optDouble("size", 4.0).toFloat() / 1000f) * max(w, h))
        paint.color = color
        paint.style = Paint.Style.STROKE
        paint.strokeWidth = if (tool == "highlighter") scaled * 3 else scaled
        paint.alpha = if (tool == "highlighter") 90 else 255

        fun px(o: JSONObject?) = (r.left + (o?.optDouble("x", 0.0) ?: 0.0).toFloat() * w)
        fun py(o: JSONObject?) = (r.top + (o?.optDouble("y", 0.0) ?: 0.0).toFloat() * h)

        when (tool) {
            "pen", "highlighter" -> {
                val pts = el.optJSONArray("points") ?: return
                if (pts.length() == 0) return
                if (pts.length() == 1) {
                    paint.style = Paint.Style.FILL
                    canvas.drawCircle(px(pts.getJSONObject(0)), py(pts.getJSONObject(0)), scaled / 2, paint)
                } else {
                    val path = Path()
                    path.moveTo(px(pts.getJSONObject(0)), py(pts.getJSONObject(0)))
                    for (i in 1 until pts.length()) path.lineTo(px(pts.getJSONObject(i)), py(pts.getJSONObject(i)))
                    canvas.drawPath(path, paint)
                }
            }
            "line" -> {
                val s = el.optJSONObject("start"); val e = el.optJSONObject("end")
                canvas.drawLine(px(s), py(s), px(e), py(e), paint)
            }
            "arrow" -> {
                val s = el.optJSONObject("start"); val e = el.optJSONObject("end")
                val sx = px(s); val sy = py(s); val ex = px(e); val ey = py(e)
                canvas.drawLine(sx, sy, ex, ey, paint)
                val head = max(12f, scaled * 3.5f)
                val a = atan2(ey - sy, ex - sx)
                val p = Path().apply {
                    moveTo(ex, ey)
                    lineTo(ex - head * cos(a - Math.PI / 6).toFloat(), ey - head * sin(a - Math.PI / 6).toFloat())
                    lineTo(ex - head * cos(a + Math.PI / 6).toFloat(), ey - head * sin(a + Math.PI / 6).toFloat())
                    close()
                }
                paint.style = Paint.Style.FILL
                canvas.drawPath(p, paint)
            }
            "rect" -> {
                val s = el.optJSONObject("start"); val e = el.optJSONObject("end")
                canvas.drawRect(min(px(s), px(e)), min(py(s), py(e)), max(px(s), px(e)), max(py(s), py(e)), paint)
            }
            "circle" -> {
                val s = el.optJSONObject("start"); val e = el.optJSONObject("end")
                canvas.drawOval(RectF(min(px(s), px(e)), min(py(s), py(e)), max(px(s), px(e)), max(py(s), py(e))), paint)
            }
            "text" -> {
                val s = el.optJSONObject("start"); val txt = el.optString("text")
                if (txt.isEmpty()) return
                textPaint.color = color
                textPaint.textSize = max(15f, scaled * 4.2f)
                val fm = textPaint.fontMetrics
                canvas.drawText(txt, px(s), py(s) - fm.ascent, textPaint)
            }
        }
    }

    private fun loadBackground(src: String) {
        if (!loading.add(src)) return
        io.execute {
            val bmp = try {
                if (src.startsWith("data:")) {
                    val bytes = Base64.decode(src.substringAfter(","), Base64.DEFAULT)
                    BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
                } else {
                    val full = if (src.startsWith("http")) src else ClassroomTheme.DEFAULT_ORIGIN + src
                    URL(full).openStream().use { BitmapFactory.decodeStream(it) }
                }
            } catch (e: Exception) { null }
            post {
                if (bmp != null) bitmaps[src] = bmp
                loading.remove(src)
                invalidate()
            }
        }
    }

    // ---------- touch ----------
    override fun onTouchEvent(e: MotionEvent): Boolean {
        scaleDetector.onTouchEvent(e)
        if (e.pointerCount > 1) {
            scaling = true
            if (draft != null) { draft = null }
            val cx = (e.getX(0) + e.getX(1)) / 2; val cy = (e.getY(0) + e.getY(1)) / 2
            if (e.actionMasked == MotionEvent.ACTION_POINTER_DOWN) { lastX = cx; lastY = cy }
            else if (e.actionMasked == MotionEvent.ACTION_MOVE) {
                tx += cx - lastX; ty += cy - lastY; lastX = cx; lastY = cy
                clampViewport(); invalidate()
            }
            return true
        }
        if (scaling) {
            if (e.actionMasked == MotionEvent.ACTION_UP || e.actionMasked == MotionEvent.ACTION_CANCEL) scaling = false
            if (e.actionMasked == MotionEvent.ACTION_UP) { lastX = e.x; lastY = e.y }
            return true
        }

        val drawing = canDraw && tool != "pan"
        when (e.actionMasked) {
            MotionEvent.ACTION_DOWN -> {
                parent?.requestDisallowInterceptTouchEvent(true)
                lastX = e.x; lastY = e.y
                if (!drawing) { panning = true; return true }
                val (nx, ny) = toNormalized(e.x, e.y)
                draftPage = currentPage
                when (tool) {
                    "laser" -> { callbacks?.onLaser(currentPage, nx, ny, true); laser = Triple(currentPage, nx.toFloat(), ny.toFloat()) }
                    "eraser" -> eraseAt(nx, ny)
                    "text" -> callbacks?.onTextRequest(currentPage, nx, ny)
                    else -> draft = newElement(nx, ny)
                }
                invalidate()
            }
            MotionEvent.ACTION_MOVE -> {
                if (panning) {
                    tx += e.x - lastX; ty += e.y - lastY; lastX = e.x; lastY = e.y
                    clampViewport(); invalidate(); return true
                }
                if (!drawing) return true
                val (nx, ny) = toNormalized(e.x, e.y)
                when (tool) {
                    "laser" -> { laser = Triple(currentPage, nx.toFloat(), ny.toFloat()); callbacks?.onLaser(currentPage, nx, ny, true) }
                    "eraser" -> eraseAt(nx, ny)
                    "text" -> {}
                    else -> draft?.let { d ->
                        if (tool == "pen" || tool == "highlighter") {
                            d.getJSONArray("points").put(JSONObject().put("x", nx).put("y", ny))
                        } else d.put("end", JSONObject().put("x", nx).put("y", ny))
                        val now = System.currentTimeMillis()
                        if (now - lastProgressAt > 70) { lastProgressAt = now; callbacks?.onProgress(draftPage, d) }
                    }
                }
                invalidate()
            }
            MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                panning = false
                if (tool == "laser" && drawing) { laser = null; callbacks?.onLaser(currentPage, 0.0, 0.0, false) }
                draft?.let { d ->
                    draft = null
                    addElement(draftPage, d)
                    callbacks?.onCommit(draftPage, d)
                }
                invalidate()
            }
        }
        return true
    }

    private fun newElement(nx: Double, ny: Double): JSONObject {
        val el = JSONObject()
            .put("id", "el_${System.currentTimeMillis()}_${(Math.random() * 99999).toInt()}")
            .put("tool", tool)
            .put("color", String.format("#%06X", 0xFFFFFF and penColor))
            .put("size", penSize)
        val pt = JSONObject().put("x", nx).put("y", ny)
        if (tool == "pen" || tool == "highlighter") el.put("points", JSONArray().put(pt))
        else { el.put("start", pt); el.put("end", JSONObject().put("x", nx).put("y", ny)) }
        return el
    }

    private fun eraseAt(nx: Double, ny: Double) {
        val list = pages[currentPage] ?: return
        val hit = list.lastOrNull { el -> elementNear(el, nx, ny) } ?: return
        val id = hit.optString("id")
        list.remove(hit)
        callbacks?.onErase(currentPage, id)
    }

    private fun elementNear(el: JSONObject, nx: Double, ny: Double): Boolean {
        val tol = 0.025
        val pts = el.optJSONArray("points")
        if (pts != null) {
            for (i in 0 until pts.length()) {
                val p = pts.getJSONObject(i)
                if (abs(p.optDouble("x") - nx) < tol && abs(p.optDouble("y") - ny) < tol) return true
            }
            return false
        }
        val s = el.optJSONObject("start") ?: return false
        val e = el.optJSONObject("end") ?: s
        val minX = min(s.optDouble("x"), e.optDouble("x")) - tol; val maxX = max(s.optDouble("x"), e.optDouble("x")) + tol
        val minY = min(s.optDouble("y"), e.optDouble("y")) - tol; val maxY = max(s.optDouble("y"), e.optDouble("y")) + tol
        return nx in minX..maxX && ny in minY..maxY
    }

    fun undoLocal(): Boolean {
        val list = pages[currentPage] ?: return false
        if (list.isEmpty()) return false
        list.removeAt(list.size - 1); invalidate(); return true
    }
}
