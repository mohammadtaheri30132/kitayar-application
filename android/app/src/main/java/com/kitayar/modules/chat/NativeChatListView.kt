package com.kitayar.modules.chat

import android.content.Context
import android.widget.FrameLayout
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.events.RCTEventEmitter
import org.json.JSONArray
import org.json.JSONObject

class NativeChatListView(context: Context) : FrameLayout(context) {

    private val recyclerView: RecyclerView = RecyclerView(context)
    private val adapter: NativeChatAdapter
    private var currentUserId: String = ""

    init {
        val layoutManager = LinearLayoutManager(context).apply {
            orientation = LinearLayoutManager.VERTICAL
            stackFromEnd = true
        }
        recyclerView.layoutManager = layoutManager

        adapter = NativeChatAdapter(context) { imageUrl ->
            sendEvent("onImagePress", Arguments.createMap().apply {
                putString("imageUrl", imageUrl)
            })
        }
        recyclerView.adapter = adapter

        addView(
            recyclerView,
            LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
        )
    }

    fun setCurrentUserId(userId: String) {
        this.currentUserId = userId
    }

    fun setMessagesJson(jsonString: String) {
        if (jsonString.isEmpty()) {
            adapter.setMessages(emptyList())
            return
        }

        try {
            val jsonArray = JSONArray(jsonString)
            val parsedList = ArrayList<ChatMessageModel>()

            for (i in 0 until jsonArray.length()) {
                val item: JSONObject = jsonArray.getJSONObject(i)

                val senderObj = item.optJSONObject("senderId")
                val senderId = senderObj?.optString("_id") ?: item.optString("senderId", "")
                val senderName = senderObj?.optString("fullName") ?: item.optString("senderName", "")

                val isMe = if (currentUserId.isNotEmpty()) {
                    senderId == currentUserId
                } else {
                    item.optBoolean("isMe", false)
                }

                parsedList.add(
                    ChatMessageModel(
                        id = item.optString("_id", item.optString("id", "")),
                        senderId = senderId,
                        senderName = senderName,
                        content = item.optString("content", ""),
                        type = item.optString("type", "text"),
                        mediaUrl = item.optString("mediaUrl", ""),
                        mediaDuration = item.optInt("mediaDuration", 0),
                        status = item.optString("status", "sent"),
                        createdAt = item.optString("createdAt", ""),
                        isMe = isMe
                    )
                )
            }

            adapter.setMessages(parsedList)
            scrollToBottom()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun scrollToBottom() {
        if (adapter.itemCount > 0) {
            recyclerView.post {
                recyclerView.smoothScrollToPosition(adapter.itemCount - 1)
            }
        }
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        ChatAudioPlayerHelper.stop()
    }

    private fun sendEvent(eventName: String, params: com.facebook.react.bridge.WritableMap) {
        val reactContext = context as? ReactContext
        reactContext?.getJSModule(RCTEventEmitter::class.java)?.receiveEvent(
            id,
            eventName,
            params
        )
    }
}
