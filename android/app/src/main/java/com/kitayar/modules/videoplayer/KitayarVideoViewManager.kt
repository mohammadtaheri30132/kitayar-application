package com.kitayar.modules.videoplayer

import com.facebook.react.bridge.ReadableArray
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

class KitayarVideoViewManager : SimpleViewManager<KitayarVideoView>() {

    override fun getName(): String = "KitayarVideoView"

    override fun createViewInstance(reactContext: ThemedReactContext): KitayarVideoView {
        return KitayarVideoView(reactContext)
    }

    @ReactProp(name = "src")
    fun setSrc(view: KitayarVideoView, src: String?) {
        view.setSrc(src)
    }

    @ReactProp(name = "paused")
    fun setPaused(view: KitayarVideoView, paused: Boolean) {
        view.setPaused(paused)
    }

    // 👈 استفاده از mutableMapOf کاتلین برای رفع ارور نوع داده
    override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any>? {
        return mutableMapOf(
            "onVideoProgress" to mapOf("registrationName" to "onVideoProgress")
        )
    }

    // متصل کردن دستور Seek (پرش به زمان مشخص)
    override fun receiveCommand(root: KitayarVideoView, commandId: String, args: ReadableArray?) {
        when (commandId) {
            "seek" -> {
                val timeInSeconds = args?.getDouble(0) ?: 0.0
                root.seekTo(timeInSeconds)
            }
        }
    }

    override fun onDropViewInstance(view: KitayarVideoView) {
        super.onDropViewInstance(view)
        view.cleanUp() // پاکسازی حافظه هنگام بسته شدن صفحه
    }
}