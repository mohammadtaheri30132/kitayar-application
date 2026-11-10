package com.kitayar.modules.chat

import com.facebook.react.bridge.ReadableArray
import com.facebook.react.common.MapBuilder
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

class NativeChatListViewManager : SimpleViewManager<NativeChatListView>() {

    override fun getName(): String = "NativeChatListView"

    override fun createViewInstance(reactContext: ThemedReactContext): NativeChatListView {
        return NativeChatListView(reactContext)
    }

    @ReactProp(name = "currentUserId")
    fun setCurrentUserId(view: NativeChatListView, currentUserId: String?) {
        view.setCurrentUserId(currentUserId ?: "")
    }

    @ReactProp(name = "messagesJson")
    fun setMessagesJson(view: NativeChatListView, jsonString: String?) {
        view.setMessagesJson(jsonString ?: "")
    }

    override fun getCommandsMap(): Map<String, Int> {
        return MapBuilder.of(
            "scrollToBottom", 1
        )
    }

    override fun receiveCommand(root: NativeChatListView, commandId: String?, args: ReadableArray?) {
        super.receiveCommand(root, commandId, args)
        if (commandId == "scrollToBottom" || commandId == "1") {
            root.scrollToBottom()
        }
    }

    override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any>? {
        val baseMap = super.getExportedCustomDirectEventTypeConstants() ?: MapBuilder.newHashMap()
        baseMap["onImagePress"] = MapBuilder.of("registrationName", "onImagePress")
        return baseMap
    }
}
