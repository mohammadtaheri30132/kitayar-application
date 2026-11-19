package com.kitayar.modules.classroom

import android.os.Handler
import android.os.Looper
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import org.json.JSONObject
import java.util.concurrent.TimeUnit

/** Thin OkHttp WebSocket client for /api/classroom/native/ws. All callbacks run on the main thread. */
class ClassroomSignaling(
    private val url: String,
    private val listener: Listener
) {
    interface Listener {
        fun onOpen()
        fun onMessage(msg: JSONObject)
        fun onClosed(reason: String)
    }

    private val main = Handler(Looper.getMainLooper())
    private val client = OkHttpClient.Builder()
        .pingInterval(20, TimeUnit.SECONDS)
        .readTimeout(0, TimeUnit.MILLISECONDS)
        .build()
    private var socket: WebSocket? = null
    @Volatile private var closedByUser = false

    fun connect() {
        closedByUser = false
        socket = client.newWebSocket(Request.Builder().url(url).build(), object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                main.post { listener.onOpen() }
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                val json = try { JSONObject(text) } catch (e: Exception) { return }
                main.post { listener.onMessage(json) }
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                if (code == 4001) closedByUser = true
                if (!closedByUser) main.post { listener.onClosed(reason) }
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                if (!closedByUser) main.post { listener.onClosed(t.message ?: "connection failed") }
            }
        })
    }

    fun send(json: JSONObject): Boolean = socket?.send(json.toString()) ?: false

    fun close() {
        closedByUser = true
        try { socket?.close(1000, "bye") } catch (e: Exception) { }
        socket = null
        client.dispatcher.executorService.shutdown()
    }
}
