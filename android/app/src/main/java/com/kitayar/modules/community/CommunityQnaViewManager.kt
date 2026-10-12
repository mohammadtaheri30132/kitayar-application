package com.kitayar.modules.community

import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

class CommunityQnaViewManager : SimpleViewManager<CommunityQnaCardView>() {

    override fun getName(): String = "CommunityQnaCardView"

    override fun createViewInstance(reactContext: ThemedReactContext): CommunityQnaCardView {
        return CommunityQnaCardView(reactContext)
    }

    @ReactProp(name = "questionId")
    fun setQuestionId(view: CommunityQnaCardView, id: String?) {
        view.setQuestionId(id ?: "")
    }

    @ReactProp(name = "title")
    fun setTitle(view: CommunityQnaCardView, title: String?) {
        view.setTitle(title)
    }

    @ReactProp(name = "body")
    fun setBody(view: CommunityQnaCardView, body: String?) {
        view.setBody(body)
    }

    @ReactProp(name = "authorName")
    fun setAuthorName(view: CommunityQnaCardView, name: String?) {
        view.setAuthorName(name)
    }

    @ReactProp(name = "authorRole")
    fun setAuthorRole(view: CommunityQnaCardView, role: String?) {
        view.setAuthorRole(role)
    }

    @ReactProp(name = "timeText")
    fun setTimeText(view: CommunityQnaCardView, time: String?) {
        view.setTimeText(time)
    }

    @ReactProp(name = "categoryName")
    fun setCategoryName(view: CommunityQnaCardView, name: String?) {
        view.setCategory(name, null)
    }

    @ReactProp(name = "categoryColor")
    fun setCategoryColor(view: CommunityQnaCardView, color: String?) {
        view.setCategory(null, color)
    }

    @ReactProp(name = "answerCount", defaultInt = 0)
    fun setAnswerCount(view: CommunityQnaCardView, count: Int) {
        view.setAnswerCount(count)
    }

    @ReactProp(name = "status")
    fun setStatus(view: CommunityQnaCardView, status: String?) {
        view.setStatus(status)
    }

    @ReactProp(name = "isDarkMode", defaultBoolean = false)
    fun setIsDarkMode(view: CommunityQnaCardView, isDark: Boolean) {
        view.setIsDarkMode(isDark)
    }

    override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any>? {
        return mutableMapOf(
            "onCardPress" to mapOf("registrationName" to "onCardPress")
        )
    }
}
