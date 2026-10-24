package com.kitayar.modules.canvas.engine

import android.content.Context
import android.graphics.*
import android.view.MotionEvent
import android.view.ScaleGestureDetector
import android.view.View
import com.kitayar.modules.canvas.history.*
import com.kitayar.modules.canvas.model.*
import kotlin.math.*

class InfiniteCanvasView(context: Context) : View(context) {

    val viewport = ViewportTransform()
    var document = CanvasDocument()
        private set

    val history: CanvasHistory = CanvasHistory()

    val selectionManager = SelectionManager(document, viewport)

    // Active tool settings
    var activeTool: String = "pen" // "pen", "pencil", "brush", "highlighter", "eraser", "shape", "text", "select"
    var currentStrokeColor: Int = Color.BLACK
    var currentStrokeWidth: Float = 6f
    var currentStrokeOpacity: Float = 1.0f

    var currentShapeType: String = "rectangle"
    var currentShapeFillColor: Int? = null
    var currentShapeStrokeStyle: String = "solid"
    var currentShapeStartArrow: Boolean = false
    var currentShapeEndArrow: Boolean = false

    var isReadOnly: Boolean = false

    // Callbacks to React Native
    var onViewportListener: ((scale: Float, panX: Float, panY: Float) -> Unit)? = null
    var onSelectionListener: ((hasSelection: Boolean, count: Int, selectedType: String, text: String, color: String, width: Float) -> Unit)? = null
    var onHistoryListener: ((canUndo: Boolean, canRedo: Boolean) -> Unit)? = null
    var onDocumentChangeListener: ((elementCount: Int) -> Unit)? = null
    var onTextEditRequestListener: ((elementId: String, currentText: String, fontSize: Float, color: String, wx: Float, wy: Float) -> Unit)? = null

    // Background drawing paints
    private val backgroundPaint = Paint()
    private val gridLinePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeWidth = 1f
    }
    private val gridDotPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
    }

    // Touch & Gesture state
    private val scaleDetector: ScaleGestureDetector
    private var isMultiTouch = false
    private var lastTouchX = 0f
    private var lastTouchY = 0f

    // In-progress stroke
    private var activeStroke: StrokeElement? = null

    // In-progress shape
    private var shapeStartPoint: PointF? = null
    private var activeShapePreview: ShapeElement? = null

    // Selection transform tracking
    private var transformBeforeStates: List<CanvasElement>? = null

    init {
        setWillNotDraw(false)
        isFocusable = true
        isFocusableInTouchMode = true

        history.onHistoryChanged = {
            onHistoryListener?.invoke(history.canUndo, history.canRedo)
        }

        scaleDetector = ScaleGestureDetector(context, object : ScaleGestureDetector.SimpleOnScaleGestureListener() {
            override fun onScale(detector: ScaleGestureDetector): Boolean {
                viewport.zoomAt(detector.scaleFactor, detector.focusX, detector.focusY)
                invalidate()
                notifyViewportChanged()
                return true
            }
        })
    }

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        super.onSizeChanged(w, h, oldw, oldh)
        viewport.screenWidth = w.toFloat()
        viewport.screenHeight = h.toFloat()
        if (oldw == 0 && oldh == 0) {
            viewport.setViewport(document.viewportScale, document.viewportPanX, document.viewportPanY)
            if (document.viewportPanX == 0f && document.viewportPanY == 0f) {
                viewport.reset()
            }
        }
    }

    fun loadDocument(doc: CanvasDocument) {
        document = doc
        history.clear()
        selectionManager.clearSelection()
        viewport.setViewport(doc.viewportScale, doc.viewportPanX, doc.viewportPanY)
        invalidate()
        notifySelectionChanged()
        notifyDocumentChanged()
    }

    fun clearCanvas() {
        if (document.elements.isEmpty()) return
        val elementsSnapshot = document.elements.map { it.clone() }
        val clearCmd = object : CanvasCommand {
            override fun execute() {
                document.elements.clear()
            }
            override fun undo() {
                document.elements.addAll(elementsSnapshot.map { it.clone() })
            }
        }
        history.push(clearCmd)
        selectionManager.clearSelection()
        invalidate()
        notifySelectionChanged()
        notifyDocumentChanged()
    }

    fun deleteSelected(): Boolean {
        if (!selectionManager.hasSelection()) return false
        val selected = selectionManager.selectedElements.toList()
        val batch = mutableListOf<CanvasCommand>()
        for (el in selected) {
            batch.add(RemoveElementCommand(document, el))
        }
        history.push(BatchCommand(batch))
        selectionManager.clearSelection()
        invalidate()
        notifySelectionChanged()
        notifyDocumentChanged()
        return true
    }

    fun duplicateSelected(): Boolean {
        if (!selectionManager.hasSelection()) return false
        val duplicates = mutableListOf<CanvasElement>()
        val batch = mutableListOf<CanvasCommand>()
        for (el in selectionManager.selectedElements) {
            val dup = el.clone()
            dup.translate(30f, 30f)
            duplicates.add(dup)
            batch.add(AddElementCommand(document, dup))
        }
        history.push(BatchCommand(batch))
        selectionManager.clearSelection()
        duplicates.forEach { selectionManager.selectElement(it, addToSelection = true) }
        invalidate()
        notifySelectionChanged()
        notifyDocumentChanged()
        return true
    }

    fun bringForwardSelected() {
        for (el in selectionManager.selectedElements) {
            document.bringForward(el.id)
        }
        invalidate()
    }

    fun sendBackwardSelected() {
        for (el in selectionManager.selectedElements) {
            document.sendBackward(el.id)
        }
        invalidate()
    }

    fun addTextElement(text: String, fontSize: Float, color: Int, isBold: Boolean, isItalic: Boolean, wx: Float? = null, wy: Float? = null) {
        val targetX = wx ?: (viewport.screenToWorld(viewport.screenWidth / 2f, viewport.screenHeight / 2f).x - 100f)
        val targetY = wy ?: (viewport.screenToWorld(viewport.screenWidth / 2f, viewport.screenHeight / 2f).y - 30f)

        val textEl = TextElement(
            text = text,
            x = targetX,
            y = targetY,
            fontSize = fontSize,
            textColor = color,
            isBold = isBold,
            isItalic = isItalic,
            alignment = "right"
        )
        history.push(AddElementCommand(document, textEl))
        selectionManager.clearSelection()
        selectionManager.selectElement(textEl)
        invalidate()
        notifySelectionChanged()
        notifyDocumentChanged()
    }

    fun updateSelectedText(newText: String, fontSize: Float? = null, color: Int? = null) {
        val textEl = selectionManager.selectedElements.filterIsInstance<TextElement>().firstOrNull() ?: return
        val before = textEl.clone()
        textEl.text = newText
        fontSize?.let { textEl.fontSize = it }
        color?.let { textEl.textColor = it }
        textEl.invalidateLayout()
        val after = textEl.clone()
        history.push(TransformElementsCommand(document, listOf(before), listOf(after)), executeNow = false)
        invalidate()
        notifySelectionChanged()
    }

    companion object {
        var activeInstance: InfiniteCanvasView? = null
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        activeInstance = this
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        if (activeInstance == this) {
            activeInstance = null
        }
    }

    fun addImageElement(imageUri: String) {
        try {
            var finalPath = imageUri.replace("file://", "")
            
            // If it's a content:// URI from gallery/file picker, copy to local cache
            if (imageUri.startsWith("content://")) {
                val uri = android.net.Uri.parse(imageUri)
                val inputStream = context.contentResolver.openInputStream(uri)
                if (inputStream != null) {
                    val imagesDir = java.io.File(context.cacheDir, "canvas_images").apply {
                        if (!exists()) mkdirs()
                    }
                    val cachedFile = java.io.File(imagesDir, "img_${System.currentTimeMillis()}.png")
                    cachedFile.outputStream().use { out ->
                        inputStream.copyTo(out)
                    }
                    inputStream.close()
                    finalPath = cachedFile.absolutePath
                }
            }

            // Determine image dimensions to preserve natural aspect ratio
            val options = BitmapFactory.Options().apply {
                inJustDecodeBounds = true
            }
            BitmapFactory.decodeFile(finalPath, options)
            val naturalW = options.outWidth.toFloat().takeIf { it > 0 } ?: 300f
            val naturalH = options.outHeight.toFloat().takeIf { it > 0 } ?: 300f

            val maxDim = 380f
            val scaleRatio = if (naturalW > naturalH) {
                maxDim / naturalW
            } else {
                maxDim / naturalH
            }
            val elementW = naturalW * scaleRatio
            val elementH = naturalH * scaleRatio

            val center = viewport.screenToWorld(viewport.screenWidth / 2f, viewport.screenHeight / 2f)
            val halfW = elementW / 2f
            val halfH = elementH / 2f

            val imgEl = ImageElement(
                imageUri = finalPath,
                imageBounds = RectF(center.x - halfW, center.y - halfH, center.x + halfW, center.y + halfH)
            )
            history.push(AddElementCommand(document, imgEl))
            selectionManager.clearSelection()
            selectionManager.selectElement(imgEl)
            invalidate()
            notifySelectionChanged()
            notifyDocumentChanged()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        if (isReadOnly) return super.onTouchEvent(event)

        scaleDetector.onTouchEvent(event)

        val pointerCount = event.pointerCount
        if (pointerCount >= 2) {
            isMultiTouch = true
            // Handle 2-finger pan
            when (event.actionMasked) {
                MotionEvent.ACTION_MOVE -> {
                    val p0x = event.getX(0)
                    val p0y = event.getY(0)
                    val p1x = event.getX(1)
                    val p1y = event.getY(1)
                    val midX = (p0x + p1x) / 2f
                    val midY = (p0y + p1y) / 2f

                    if (lastTouchX != 0f && lastTouchY != 0f) {
                        val dx = midX - lastTouchX
                        val dy = midY - lastTouchY
                        viewport.panBy(dx, dy)
                        invalidate()
                        notifyViewportChanged()
                    }
                    lastTouchX = midX
                    lastTouchY = midY
                }
                MotionEvent.ACTION_POINTER_UP -> {
                    lastTouchX = 0f
                    lastTouchY = 0f
                }
            }
            return true
        }

        if (isMultiTouch) {
            if (event.action == MotionEvent.ACTION_UP || event.action == MotionEvent.ACTION_CANCEL) {
                isMultiTouch = false
                lastTouchX = 0f
                lastTouchY = 0f
            }
            return true
        }

        // Single finger / Stylus handling
        val screenX = event.x
        val screenY = event.y
        val worldPt = viewport.screenToWorld(screenX, screenY)
        val pressure = if (event.pressure > 0f) event.pressure else 1.0f

        when (event.action) {
            MotionEvent.ACTION_DOWN -> {
                lastTouchX = screenX
                lastTouchY = screenY

                when (activeTool) {
                    "pen", "pencil", "brush", "highlighter" -> {
                        selectionManager.clearSelection()
                        val stroke = StrokeElement(
                            toolType = activeTool,
                            color = currentStrokeColor,
                            strokeWidth = currentStrokeWidth,
                            opacity = currentStrokeOpacity
                        )
                        stroke.addPoint(StrokePoint(worldPt.x, worldPt.y, pressure))
                        activeStroke = stroke
                        invalidate()
                    }
                    "eraser" -> {
                        eraseAt(worldPt.x, worldPt.y)
                    }
                    "shape" -> {
                        selectionManager.clearSelection()
                        shapeStartPoint = PointF(worldPt.x, worldPt.y)
                        activeShapePreview = ShapeElement(
                            shapeType = currentShapeType,
                            shapeBounds = RectF(worldPt.x, worldPt.y, worldPt.x, worldPt.y),
                            strokeColor = currentStrokeColor,
                            fillColor = currentShapeFillColor,
                            strokeWidth = currentStrokeWidth,
                            strokeStyle = currentShapeStrokeStyle,
                            startArrow = currentShapeStartArrow,
                            endArrow = currentShapeEndArrow
                        )
                        invalidate()
                    }
                    "text" -> {
                        val hit = selectionManager.hitTest(worldPt.x, worldPt.y)
                        if (hit is TextElement) {
                            selectionManager.selectElement(hit)
                            onTextEditRequestListener?.invoke(hit.id, hit.text, hit.fontSize, String.format("#%06X", 0xFFFFFF and hit.textColor), hit.x, hit.y)
                        } else {
                            // Request adding new text at tap location
                            onTextEditRequestListener?.invoke("", "", 24f, String.format("#%06X", 0xFFFFFF and currentStrokeColor), worldPt.x, worldPt.y)
                        }
                    }
                    "select" -> {
                        val handle = selectionManager.hitTestHandle(worldPt.x, worldPt.y)
                        if (handle != TransformHandle.NONE) {
                            transformBeforeStates = selectionManager.selectedElements.map { it.clone() }
                            selectionManager.startTransform(handle, worldPt.x, worldPt.y)
                        } else {
                            val hit = selectionManager.hitTest(worldPt.x, worldPt.y)
                            if (hit != null) {
                                selectionManager.selectElement(hit)
                                transformBeforeStates = selectionManager.selectedElements.map { it.clone() }
                                selectionManager.startTransform(TransformHandle.BODY, worldPt.x, worldPt.y)
                            } else {
                                selectionManager.clearSelection()
                            }
                        }
                        invalidate()
                        notifySelectionChanged()
                    }
                }
            }

            MotionEvent.ACTION_MOVE -> {
                when (activeTool) {
                    "pen", "pencil", "brush", "highlighter" -> {
                        activeStroke?.let { stroke ->
                            stroke.addPoint(StrokePoint(worldPt.x, worldPt.y, pressure))
                            invalidate()
                        }
                    }
                    "eraser" -> {
                        eraseAt(worldPt.x, worldPt.y)
                    }
                    "shape" -> {
                        shapeStartPoint?.let { start ->
                            val l = min(start.x, worldPt.x)
                            val t = min(start.y, worldPt.y)
                            val r = max(start.x, worldPt.x)
                            val b = max(start.y, worldPt.y)
                            activeShapePreview?.shapeBounds?.set(l, t, r, b)
                            invalidate()
                        }
                    }
                    "select" -> {
                        if (selectionManager.activeHandle != TransformHandle.NONE) {
                            selectionManager.updateTransform(worldPt.x, worldPt.y)
                            invalidate()
                        }
                    }
                }
            }

            MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                when (activeTool) {
                    "pen", "pencil", "brush", "highlighter" -> {
                        activeStroke?.let { stroke ->
                            stroke.addPoint(StrokePoint(worldPt.x, worldPt.y, pressure))
                            stroke.rebuildPath()
                            history.push(AddElementCommand(document, stroke))
                            activeStroke = null
                            invalidate()
                            notifyDocumentChanged()
                        }
                    }
                    "shape" -> {
                        activeShapePreview?.let { shape ->
                            if (shape.shapeBounds.width() > 10f || shape.shapeBounds.height() > 10f) {
                                history.push(AddElementCommand(document, shape))
                                selectionManager.selectElement(shape)
                                notifyDocumentChanged()
                                notifySelectionChanged()
                            }
                        }
                        activeShapePreview = null
                        shapeStartPoint = null
                        invalidate()
                    }
                    "select" -> {
                        if (selectionManager.activeHandle != TransformHandle.NONE) {
                            selectionManager.endTransform()
                            val before = transformBeforeStates
                            if (before != null && selectionManager.hasSelection()) {
                                val after = selectionManager.selectedElements.map { it.clone() }
                                history.push(TransformElementsCommand(document, before, after), executeNow = false)
                            }
                            transformBeforeStates = null
                            invalidate()
                            notifySelectionChanged()
                        }
                    }
                }
            }
        }

        return true
    }

    private fun eraseAt(worldX: Float, worldY: Float) {
        val eraseRadius = viewport.screenDistToWorld(28f)
        val toRemove = mutableListOf<CanvasElement>()

        for (el in document.elements) {
            if (el.containsPoint(worldX, worldY, tolerance = eraseRadius)) {
                toRemove.add(el)
            }
        }

        if (toRemove.isNotEmpty()) {
            val batch = toRemove.map { RemoveElementCommand(document, it) }
            history.push(BatchCommand(batch))
            toRemove.forEach { selectionManager.selectedElements.remove(it) }
            invalidate()
            notifySelectionChanged()
            notifyDocumentChanged()
        }
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)

        // 1. Draw solid background
        backgroundPaint.color = document.backgroundColor
        canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), backgroundPaint)

        // 2. Draw infinite grid/dots/lines
        drawGrid(canvas)

        // 3. Apply Viewport Matrix for world-space objects
        canvas.save()
        canvas.translate(viewport.panX, viewport.panY)
        canvas.scale(viewport.scale, viewport.scale)

        val visibleBounds = viewport.getVisibleWorldBounds()

        // 4. Render elements with viewport culling
        val sorted = document.elements.sortedBy { it.zIndex }
        for (el in sorted) {
            if (RectF.intersects(el.getBounds(), visibleBounds)) {
                val isSelected = selectionManager.selectedElements.contains(el)
                el.draw(canvas, isSelected)
            }
        }

        // Draw in-progress stroke
        activeStroke?.draw(canvas, isSelected = false)

        // Draw in-progress shape
        activeShapePreview?.draw(canvas, isSelected = false)

        canvas.restore()

        // 5. Draw selection handles in screen coordinates
        if (selectionManager.hasSelection() && !isReadOnly) {
            selectionManager.drawSelectionOverlay(canvas)
        }
    }

    private fun drawGrid(canvas: Canvas) {
        if (document.gridType == "none") return

        val spacing = max(20f, document.gridSpacing * viewport.scale)
        val offsetX = viewport.panX % spacing
        val offsetY = viewport.panY % spacing

        gridLinePaint.color = document.gridColor
        gridDotPaint.color = document.gridColor

        when (document.gridType) {
            "grid" -> {
                var x = offsetX
                while (x <= width) {
                    canvas.drawLine(x, 0f, x, height.toFloat(), gridLinePaint)
                    x += spacing
                }
                var y = offsetY
                while (y <= height) {
                    canvas.drawLine(0f, y, width.toFloat(), y, gridLinePaint)
                    y += spacing
                }
            }
            "dots" -> {
                var x = offsetX
                while (x <= width) {
                    var y = offsetY
                    while (y <= height) {
                        canvas.drawCircle(x, y, 2.5f, gridDotPaint)
                        y += spacing
                    }
                    x += spacing
                }
            }
            "lines" -> {
                var y = offsetY
                while (y <= height) {
                    canvas.drawLine(0f, y, width.toFloat(), y, gridLinePaint)
                    y += spacing
                }
            }
        }
    }

    private fun notifyViewportChanged() {
        document.viewportScale = viewport.scale
        document.viewportPanX = viewport.panX
        document.viewportPanY = viewport.panY
        onViewportListener?.invoke(viewport.scale, viewport.panX, viewport.panY)
    }

    private fun notifySelectionChanged() {
        val hasSel = selectionManager.hasSelection()
        val count = selectionManager.selectedElements.size
        val first = selectionManager.selectedElements.firstOrNull()
        val type = first?.type ?: ""
        val text = (first as? TextElement)?.text ?: ""
        val color = when (first) {
            is StrokeElement -> String.format("#%06X", 0xFFFFFF and first.color)
            is ShapeElement -> String.format("#%06X", 0xFFFFFF and first.strokeColor)
            is TextElement -> String.format("#%06X", 0xFFFFFF and first.textColor)
            else -> ""
        }
        val width = when (first) {
            is StrokeElement -> first.strokeWidth
            is ShapeElement -> first.strokeWidth
            is TextElement -> first.fontSize
            else -> 0f
        }
        onSelectionListener?.invoke(hasSel, count, type, text, color, width)
    }

    private fun notifyDocumentChanged() {
        onDocumentChangeListener?.invoke(document.elements.size)
    }
}
