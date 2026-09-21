package com.kitayar.modules.pdfcore

import android.net.Uri
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableArray
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.events.RCTEventEmitter
import com.github.barteksc.pdfviewer.PDFView
import com.github.barteksc.pdfviewer.scroll.DefaultScrollHandle
import com.github.barteksc.pdfviewer.util.FitPolicy
import com.shockwave.pdfium.PdfDocument

class PdfViewerManager : SimpleViewManager<PDFView>() {

    override fun getName(): String = "KitayarNativePdfView"

    companion object {
        const val COMMAND_JUMP_TO_PAGE = 1
        const val COMMAND_RESET_ZOOM = 2
    }

    override fun createViewInstance(reactContext: ThemedReactContext): PDFView {
        return PDFView(reactContext, null)
    }

    override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any> {
        return mutableMapOf(
            "onPageChanged" to mutableMapOf("registrationName" to "onPageChanged"),
            "onDocumentLoaded" to mutableMapOf("registrationName" to "onDocumentLoaded"),
            "onError" to mutableMapOf("registrationName" to "onError"),
            "onTap" to mutableMapOf("registrationName" to "onTap") // 🟢 ایونت جدید لمس صفحه
        )
    }

    override fun getCommandsMap(): Map<String, Int> {
        return mapOf("jumpToPage" to COMMAND_JUMP_TO_PAGE, "resetZoom" to COMMAND_RESET_ZOOM)
    }

    override fun receiveCommand(root: PDFView, commandId: Int, args: ReadableArray?) {
        super.receiveCommand(root, commandId, args)
        when (commandId) {
            COMMAND_JUMP_TO_PAGE -> root.jumpTo(args?.getInt(0) ?: 0, true)
            COMMAND_RESET_ZOOM -> root.resetZoomWithAnimation()
        }
    }

    private fun parseToc(bookmarks: List<PdfDocument.Bookmark>?): WritableArray {
        val array = Arguments.createArray()
        if (bookmarks == null) return array
        for (b in bookmarks) {
            val map = Arguments.createMap()
            map.putString("title", b.title)
            map.putInt("pageIdx", b.pageIdx.toInt())
            if (b.children != null && b.children.isNotEmpty()) map.putArray("children", parseToc(b.children))
            array.pushMap(map)
        }
        return array
    }

    @ReactProp(name = "config")
    fun setConfig(view: PDFView, config: ReadableMap?) {
        if (config == null || !config.hasKey("path")) return
        val path = config.getString("path") ?: return
        if (path.isEmpty()) return

        val password = if (config.hasKey("password")) config.getString("password") else null
        val nightMode = if (config.hasKey("nightMode")) config.getBoolean("nightMode") else false
        val horizontal = if (config.hasKey("horizontal")) config.getBoolean("horizontal") else false
        val fitToWidth = if (config.hasKey("fitToWidth")) config.getBoolean("fitToWidth") else true
        val enableSwipe = if (config.hasKey("enableSwipe")) config.getBoolean("enableSwipe") else true
        val context = view.context as ThemedReactContext

        val configurator = view.fromUri(Uri.parse(path))
            .enableSwipe(enableSwipe)
            .swipeHorizontal(horizontal)
            .enableDoubletap(!enableSwipe.not())
            .defaultPage(0)
            .enableAnnotationRendering(true)
            .spacing(10)
            .scrollHandle(DefaultScrollHandle(context)) // 🟢 نوار اسکرول کناری
            .pageFitPolicy(if (fitToWidth) FitPolicy.WIDTH else FitPolicy.BOTH)
            .nightMode(nightMode)
            .onTap { _ ->
                val event = Arguments.createMap()
                context.getJSModule(RCTEventEmitter::class.java).receiveEvent(view.id, "onTap", event)
                true
            }
            .onLoad { pageCount ->
                val event = Arguments.createMap()
                event.putInt("pageCount", pageCount)
                event.putInt("pagecount", pageCount)
                event.putArray("toc", parseToc(view.tableOfContents))
                context.getJSModule(RCTEventEmitter::class.java).receiveEvent(view.id, "onDocumentLoaded", event)
            }
            .onPageChange { page, pageCount ->
                val event = Arguments.createMap()
                event.putInt("page", page + 1)
                event.putInt("pageCount", pageCount)
                event.putInt("pagecount", pageCount)
                context.getJSModule(RCTEventEmitter::class.java).receiveEvent(view.id, "onPageChanged", event)
            }
            .onError { t ->
                val event = Arguments.createMap()
                event.putString("message", t.message ?: "خطای بارگذاری PDF")
                context.getJSModule(RCTEventEmitter::class.java).receiveEvent(view.id, "onError", event)
            }

        if (!password.isNullOrEmpty()) configurator.password(password)
        configurator.load()
    }
}