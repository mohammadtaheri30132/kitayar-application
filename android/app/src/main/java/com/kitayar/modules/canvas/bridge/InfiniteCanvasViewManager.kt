package com.kitayar.modules.canvas.bridge

import android.graphics.Color
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.common.MapBuilder
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.events.RCTEventEmitter
import com.kitayar.modules.canvas.engine.InfiniteCanvasView
import com.kitayar.modules.canvas.model.CanvasDocument
import org.json.JSONObject

class InfiniteCanvasViewManager : SimpleViewManager<InfiniteCanvasView>() {

    companion object {
        const val REACT_CLASS = "InfiniteCanvasView"

        const val COMMAND_UNDO = 1
        const val COMMAND_REDO = 2
        const val COMMAND_CLEAR = 3
        const val COMMAND_RESET_VIEWPORT = 4
        const val COMMAND_ZOOM_IN = 5
        const val COMMAND_ZOOM_OUT = 6
        const val COMMAND_FIT_TO_CONTENT = 7
        const val COMMAND_DELETE_SELECTED = 8
        const val COMMAND_DUPLICATE_SELECTED = 9
        const val COMMAND_BRING_FORWARD = 10
        const val COMMAND_SEND_BACKWARD = 11
        const val COMMAND_ADD_TEXT = 12
        const val COMMAND_UPDATE_TEXT = 13
        const val COMMAND_ADD_IMAGE = 14
        const val COMMAND_LOAD_DOCUMENT = 15
        const val COMMAND_SELECT_ALL = 16
    }

    override fun getName(): String = REACT_CLASS

    override fun createViewInstance(reactContext: ThemedReactContext): InfiniteCanvasView {
        val view = InfiniteCanvasView(reactContext)

        view.onViewportListener = { scale, panX, panY ->
            val event = Arguments.createMap().apply {
                putDouble("scale", scale.toDouble())
                putDouble("panX", panX.toDouble())
                putDouble("panY", panY.toDouble())
            }
            reactContext.getJSModule(RCTEventEmitter::class.java).receiveEvent(view.id, "topViewportChange", event)
        }

        view.onSelectionListener = { hasSelection, count, selectedType, text, color, width ->
            val event = Arguments.createMap().apply {
                putBoolean("hasSelection", hasSelection)
                putInt("count", count)
                putString("selectedType", selectedType)
                putString("text", text)
                putString("color", color)
                putDouble("width", width.toDouble())
            }
            reactContext.getJSModule(RCTEventEmitter::class.java).receiveEvent(view.id, "topSelectionChange", event)
        }

        view.onHistoryListener = { canUndo, canRedo ->
            val event = Arguments.createMap().apply {
                putBoolean("canUndo", canUndo)
                putBoolean("canRedo", canRedo)
            }
            reactContext.getJSModule(RCTEventEmitter::class.java).receiveEvent(view.id, "topHistoryChange", event)
        }

        view.onDocumentChangeListener = { elementCount ->
            val event = Arguments.createMap().apply {
                putInt("elementCount", elementCount)
            }
            reactContext.getJSModule(RCTEventEmitter::class.java).receiveEvent(view.id, "topDocumentChange", event)
        }

        view.onTextEditRequestListener = { elementId, currentText, fontSize, color, wx, wy ->
            val event = Arguments.createMap().apply {
                putString("elementId", elementId)
                putString("currentText", currentText)
                putDouble("fontSize", fontSize.toDouble())
                putString("color", color)
                putDouble("worldX", wx.toDouble())
                putDouble("worldY", wy.toDouble())
            }
            reactContext.getJSModule(RCTEventEmitter::class.java).receiveEvent(view.id, "topTextEditRequest", event)
        }

        return view
    }

    @ReactProp(name = "activeTool")
    fun setActiveTool(view: InfiniteCanvasView, tool: String?) {
        view.activeTool = tool ?: "pen"
    }

    @ReactProp(name = "strokeColor")
    fun setStrokeColor(view: InfiniteCanvasView, colorStr: String?) {
        try {
            if (!colorStr.isNullOrEmpty()) {
                view.currentStrokeColor = Color.parseColor(colorStr)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    @ReactProp(name = "strokeWidth", defaultFloat = 6f)
    fun setStrokeWidth(view: InfiniteCanvasView, width: Float) {
        view.currentStrokeWidth = width
    }

    @ReactProp(name = "strokeOpacity", defaultFloat = 1.0f)
    fun setStrokeOpacity(view: InfiniteCanvasView, opacity: Float) {
        view.currentStrokeOpacity = opacity
    }

    @ReactProp(name = "shapeType")
    fun setShapeType(view: InfiniteCanvasView, shape: String?) {
        view.currentShapeType = shape ?: "rectangle"
    }

    @ReactProp(name = "shapeFillColor")
    fun setShapeFillColor(view: InfiniteCanvasView, colorStr: String?) {
        try {
            if (colorStr.isNullOrEmpty() || colorStr == "transparent") {
                view.currentShapeFillColor = null
            } else {
                view.currentShapeFillColor = Color.parseColor(colorStr)
            }
        } catch (e: Exception) {
            view.currentShapeFillColor = null
        }
    }

    @ReactProp(name = "shapeStrokeStyle")
    fun setShapeStrokeStyle(view: InfiniteCanvasView, style: String?) {
        view.currentShapeStrokeStyle = style ?: "solid"
    }

    @ReactProp(name = "shapeStartArrow", defaultBoolean = false)
    fun setShapeStartArrow(view: InfiniteCanvasView, startArrow: Boolean) {
        view.currentShapeStartArrow = startArrow
    }

    @ReactProp(name = "shapeEndArrow", defaultBoolean = false)
    fun setShapeEndArrow(view: InfiniteCanvasView, endArrow: Boolean) {
        view.currentShapeEndArrow = endArrow
    }

    @ReactProp(name = "gridType")
    fun setGridType(view: InfiniteCanvasView, gridType: String?) {
        view.document.gridType = gridType ?: "grid"
        view.invalidate()
    }

    @ReactProp(name = "gridColor")
    fun setGridColor(view: InfiniteCanvasView, colorStr: String?) {
        try {
            if (!colorStr.isNullOrEmpty()) {
                view.document.gridColor = Color.parseColor(colorStr)
                view.invalidate()
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    @ReactProp(name = "gridSpacing", defaultFloat = 40f)
    fun setGridSpacing(view: InfiniteCanvasView, spacing: Float) {
        view.document.gridSpacing = spacing
        view.invalidate()
    }

    @ReactProp(name = "canvasBackgroundColor")
    fun setCanvasBackgroundColor(view: InfiniteCanvasView, colorStr: String?) {
        try {
            if (!colorStr.isNullOrEmpty()) {
                view.document.backgroundColor = Color.parseColor(colorStr)
                view.invalidate()
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    @ReactProp(name = "isReadOnly", defaultBoolean = false)
    fun setIsReadOnly(view: InfiniteCanvasView, readOnly: Boolean) {
        view.isReadOnly = readOnly
    }

    override fun getCommandsMap(): Map<String, Int> {
        return MapBuilder.builder<String, Int>()
            .put("undo", COMMAND_UNDO)
            .put("redo", COMMAND_REDO)
            .put("clear", COMMAND_CLEAR)
            .put("resetViewport", COMMAND_RESET_VIEWPORT)
            .put("zoomIn", COMMAND_ZOOM_IN)
            .put("zoomOut", COMMAND_ZOOM_OUT)
            .put("fitToContent", COMMAND_FIT_TO_CONTENT)
            .put("deleteSelected", COMMAND_DELETE_SELECTED)
            .put("duplicateSelected", COMMAND_DUPLICATE_SELECTED)
            .put("bringForward", COMMAND_BRING_FORWARD)
            .put("sendBackward", COMMAND_SEND_BACKWARD)
            .put("addText", COMMAND_ADD_TEXT)
            .put("updateText", COMMAND_UPDATE_TEXT)
            .put("addImage", COMMAND_ADD_IMAGE)
            .put("loadDocument", COMMAND_LOAD_DOCUMENT)
            .put("selectAll", COMMAND_SELECT_ALL)
            .build()
    }

    override fun receiveCommand(view: InfiniteCanvasView, commandId: Int, args: ReadableArray?) {
        when (commandId) {
            COMMAND_UNDO -> view.history.undo().also { view.invalidate() }
            COMMAND_REDO -> view.history.redo().also { view.invalidate() }
            COMMAND_CLEAR -> view.clearCanvas()
            COMMAND_RESET_VIEWPORT -> {
                view.viewport.reset()
                view.invalidate()
            }
            COMMAND_ZOOM_IN -> {
                view.viewport.zoomIn()
                view.invalidate()
            }
            COMMAND_ZOOM_OUT -> {
                view.viewport.zoomOut()
                view.invalidate()
            }
            COMMAND_FIT_TO_CONTENT -> {
                view.viewport.fitToBounds(view.document.getBoundingBox())
                view.invalidate()
            }
            COMMAND_DELETE_SELECTED -> view.deleteSelected()
            COMMAND_DUPLICATE_SELECTED -> view.duplicateSelected()
            COMMAND_BRING_FORWARD -> view.bringForwardSelected()
            COMMAND_SEND_BACKWARD -> view.sendBackwardSelected()
            COMMAND_ADD_TEXT -> {
                val text = args?.getString(0) ?: ""
                val fontSize = args?.getDouble(1)?.toFloat() ?: 24f
                val colorStr = args?.getString(2) ?: "#000000"
                val isBold = args?.getBoolean(3) ?: false
                val isItalic = args?.getBoolean(4) ?: false
                val wx = if (args != null && args.size() > 5) args.getDouble(5).toFloat() else null
                val wy = if (args != null && args.size() > 6) args.getDouble(6).toFloat() else null
                val color = try { Color.parseColor(colorStr) } catch (e: Exception) { Color.BLACK }
                view.addTextElement(text, fontSize, color, isBold, isItalic, wx, wy)
            }
            COMMAND_UPDATE_TEXT -> {
                val newText = args?.getString(0) ?: ""
                val fontSize = if (args != null && args.size() > 1 && !args.isNull(1)) args.getDouble(1).toFloat() else null
                val colorStr = if (args != null && args.size() > 2 && !args.isNull(2)) args.getString(2) else null
                val color = colorStr?.let { try { Color.parseColor(it) } catch (e: Exception) { null } }
                view.updateSelectedText(newText, fontSize, color)
            }
            COMMAND_ADD_IMAGE -> {
                val uri = args?.getString(0) ?: ""
                if (uri.isNotEmpty()) {
                    view.addImageElement(uri)
                }
            }
            COMMAND_LOAD_DOCUMENT -> {
                val jsonStr = args?.getString(0) ?: ""
                if (jsonStr.isNotEmpty()) {
                    try {
                        val doc = CanvasDocument.fromJson(JSONObject(jsonStr))
                        view.loadDocument(doc)
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }
            }
            COMMAND_SELECT_ALL -> {
                view.selectionManager.selectAll()
                view.invalidate()
            }
        }
    }

    override fun receiveCommand(view: InfiniteCanvasView, commandId: String, args: ReadableArray?) {
        val id = when (commandId) {
            "undo" -> COMMAND_UNDO
            "redo" -> COMMAND_REDO
            "clear" -> COMMAND_CLEAR
            "resetViewport" -> COMMAND_RESET_VIEWPORT
            "zoomIn" -> COMMAND_ZOOM_IN
            "zoomOut" -> COMMAND_ZOOM_OUT
            "fitToContent" -> COMMAND_FIT_TO_CONTENT
            "deleteSelected" -> COMMAND_DELETE_SELECTED
            "duplicateSelected" -> COMMAND_DUPLICATE_SELECTED
            "bringForward" -> COMMAND_BRING_FORWARD
            "sendBackward" -> COMMAND_SEND_BACKWARD
            "addText" -> COMMAND_ADD_TEXT
            "updateText" -> COMMAND_UPDATE_TEXT
            "addImage" -> COMMAND_ADD_IMAGE
            "loadDocument" -> COMMAND_LOAD_DOCUMENT
            "selectAll" -> COMMAND_SELECT_ALL
            else -> null
        }
        id?.let { receiveCommand(view, it, args) }
    }

    override fun getExportedCustomDirectEventTypeConstants(): Map<String, Any> {
        return MapBuilder.builder<String, Any>()
            .put("topViewportChange", MapBuilder.of("registrationName", "onViewportChange"))
            .put("topSelectionChange", MapBuilder.of("registrationName", "onSelectionChange"))
            .put("topHistoryChange", MapBuilder.of("registrationName", "onHistoryChange"))
            .put("topDocumentChange", MapBuilder.of("registrationName", "onDocumentChange"))
            .put("topTextEditRequest", MapBuilder.of("registrationName", "onTextEditRequest"))
            .build()
    }
}
