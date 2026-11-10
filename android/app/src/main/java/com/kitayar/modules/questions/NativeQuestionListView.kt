package com.kitayar.modules.questions

import android.content.Context
import android.graphics.Color
import android.view.View
import android.widget.FrameLayout
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.uimanager.events.RCTEventEmitter

class NativeQuestionListView(context: Context) : FrameLayout(context) {

    private val recyclerView: RecyclerView
    private val adapter: NativeQuestionAdapter
    private val layoutManager: LinearLayoutManager

    private var questionsList: List<QuestionItem> = emptyList()
    private val selectedIdsSet: MutableSet<String> = mutableSetOf()
    private var isDarkMode: Boolean = false
    private var isBankMode: Boolean = true
    private var canDelete: Boolean = false

    private var isLoadingMore: Boolean = false

    init {
        layoutDirection = View.LAYOUT_DIRECTION_RTL

        recyclerView = RecyclerView(context).apply {
            layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
            layoutDirection = View.LAYOUT_DIRECTION_RTL
            clipToPadding = false
            setPadding(0, 0, 0, (80 * context.resources.displayMetrics.density).toInt())
        }

        layoutManager = LinearLayoutManager(context, LinearLayoutManager.VERTICAL, false)
        recyclerView.layoutManager = layoutManager

        adapter = NativeQuestionAdapter(
            context = context,
            onToggleSelect = { questionId, isSelected ->
                emitEvent("onToggleSelect", Arguments.createMap().apply {
                    putString("questionId", questionId)
                    putBoolean("isSelected", isSelected)
                })
            },
            onRemove = { questionId ->
                emitEvent("onRemove", Arguments.createMap().apply {
                    putString("questionId", questionId)
                })
            },
            onEdit = { questionId ->
                emitEvent("onEdit", Arguments.createMap().apply {
                    putString("questionId", questionId)
                })
            }
        )
        recyclerView.adapter = adapter

        // Infinite scroll listener
        recyclerView.addOnScrollListener(object : RecyclerView.OnScrollListener() {
            override fun onScrolled(rv: RecyclerView, dx: Int, dy: Int) {
                super.onScrolled(rv, dx, dy)
                if (dy > 0 && isBankMode) {
                    val visibleItemCount = layoutManager.childCount
                    val totalItemCount = layoutManager.itemCount
                    val firstVisibleItemPosition = layoutManager.findFirstVisibleItemPosition()

                    if (!isLoadingMore && (visibleItemCount + firstVisibleItemPosition) >= totalItemCount - 3) {
                        isLoadingMore = true
                        emitEvent("onLoadMore", Arguments.createMap())
                    }
                }
            }
        })

        addView(recyclerView)
    }

    private fun emitEvent(eventName: String, data: com.facebook.react.bridge.WritableMap) {
        val reactContext = context as? ReactContext
        reactContext?.getJSModule(RCTEventEmitter::class.java)?.receiveEvent(
            id,
            eventName,
            data
        )
    }

    fun setQuestions(array: ReadableArray?) {
        isLoadingMore = false
        questionsList = if (array != null) QuestionItem.fromReadableArray(array) else emptyList()
        applyData()
    }

    fun setSelectedIds(array: ReadableArray?) {
        selectedIdsSet.clear()
        if (array != null) {
            for (i in 0 until array.size()) {
                val str = array.getString(i)
                if (!str.isNullOrBlank()) {
                    selectedIdsSet.add(str)
                }
            }
        }
        adapter.updateSelectedIds(selectedIdsSet)
    }

    fun setIsDarkMode(dark: Boolean) {
        this.isDarkMode = dark
        recyclerView.setBackgroundColor(if (dark) Color.parseColor("#0F172A") else Color.parseColor("#F8FAFC"))
        applyData()
    }

    fun setIsBankMode(bankMode: Boolean) {
        this.isBankMode = bankMode
        applyData()
    }

    fun setCanDelete(allowDelete: Boolean) {
        this.canDelete = allowDelete
        applyData()
    }

    private fun applyData() {
        adapter.setData(questionsList, selectedIdsSet, isDarkMode, isBankMode, canDelete)
    }

    // Fix for React Native not calling layout on dynamic child RecyclerView updates
    private val measureAndLayoutRunnable = Runnable {
        measure(
            MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
            MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY)
        )
        layout(left, top, right, bottom)
    }

    override fun requestLayout() {
        super.requestLayout()
        post(measureAndLayoutRunnable)
    }
}
