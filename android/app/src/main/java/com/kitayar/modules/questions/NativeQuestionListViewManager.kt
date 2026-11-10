package com.kitayar.modules.questions

import com.facebook.react.bridge.ReadableArray
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

class NativeQuestionListViewManager : SimpleViewManager<NativeQuestionListView>() {

    override fun getName(): String = "NativeQuestionListView"

    override fun createViewInstance(reactContext: ThemedReactContext): NativeQuestionListView {
        return NativeQuestionListView(reactContext)
    }

    @ReactProp(name = "questions")
    fun setQuestions(view: NativeQuestionListView, array: ReadableArray?) {
        view.setQuestions(array)
    }

    @ReactProp(name = "selectedIds")
    fun setSelectedIds(view: NativeQuestionListView, array: ReadableArray?) {
        view.setSelectedIds(array)
    }

    @ReactProp(name = "isDarkMode", defaultBoolean = false)
    fun setIsDarkMode(view: NativeQuestionListView, isDark: Boolean) {
        view.setIsDarkMode(isDark)
    }

    @ReactProp(name = "isBankMode", defaultBoolean = true)
    fun setIsBankMode(view: NativeQuestionListView, isBank: Boolean) {
        view.setIsBankMode(isBank)
    }

    @ReactProp(name = "canDelete", defaultBoolean = false)
    fun setCanDelete(view: NativeQuestionListView, canDel: Boolean) {
        view.setCanDelete(canDel)
    }

    override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any>? {
        return mutableMapOf(
            "onToggleSelect" to mapOf("registrationName" to "onToggleSelect"),
            "onRemove" to mapOf("registrationName" to "onRemove"),
            "onEdit" to mapOf("registrationName" to "onEdit"),
            "onLoadMore" to mapOf("registrationName" to "onLoadMore")
        )
    }
}
