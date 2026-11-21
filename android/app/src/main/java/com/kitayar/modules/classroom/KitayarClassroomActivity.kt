package com.kitayar.modules.classroom

import android.Manifest
import android.content.pm.PackageManager
import android.graphics.Typeface
import android.media.AudioManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.*
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import org.json.JSONArray
import org.json.JSONObject
import org.webrtc.SurfaceViewRenderer
import org.webrtc.VideoTrack
import com.kitayar.modules.classroom.ClassroomUi.dp

/**
 * Fully native (no WebView) live classroom: WebRTC audio/video mesh, whiteboard/slides, chat,
 * hand-raise and moderator tools, talking to the existing /api/classroom/native/ws signaling server.
 */
class KitayarClassroomActivity : AppCompatActivity(), ClassroomSignaling.Listener, WhiteboardView.Callbacks {

    companion object {
        const val EXTRA_ROOM_URL = "EXTRA_ROOM_URL"
        const val EXTRA_ROOM_ID = "EXTRA_ROOM_ID"
        const val EXTRA_TITLE = "EXTRA_TITLE"
        const val EXTRA_IS_TEACHER = "EXTRA_IS_TEACHER"
        const val EXTRA_SESSION_ID = "EXTRA_SESSION_ID"
        const val EXTRA_TOKEN = "EXTRA_TOKEN"
        const val EXTRA_TICKET_CODE = "EXTRA_TICKET_CODE"
        const val EXTRA_USER_NAME = "EXTRA_USER_NAME"
        const val EXTRA_WS_URL = "EXTRA_WS_URL"
        private const val PERM_REQUEST = 8821
    }

    private val main = Handler(Looper.getMainLooper())
    private var signaling: ClassroomSignaling? = null
    private var mesh: ClassroomMesh? = null

    private var roomId = ""
    private var title = ""
    private var wantTeacher = false
    private var token = ""
    private var ticket = ""
    private var userName = ""
    private var wsUrl = ""

    private var selfPeerId = ""
    private var selfIsManager = false
    private var micState = "disabled"
    private var micOn = false
    private var camOn = false
    private var handUp = false
    private var allowStudentDraw = false
    private var isSeminar = false
    private var ended = false
    private var startedAt = System.currentTimeMillis()

    private val participants = LinkedHashMap<String, JSONObject>()
    private val chat = ArrayList<JSONObject>()
    private var unread = 0

    // views
    private lateinit var board: WhiteboardView
    private lateinit var statusTv: TextView
    private lateinit var timerTv: TextView
    private lateinit var countTv: TextView
    private lateinit var remoteRenderer: SurfaceViewRenderer
    private lateinit var localRenderer: SurfaceViewRenderer
    private lateinit var toolsRow: LinearLayout
    private lateinit var colorsRow: LinearLayout
    private lateinit var pageRow: LinearLayout
    private lateinit var pageTv: TextView
    private lateinit var micBtn: LinearLayout
    private lateinit var camBtn: LinearLayout
    private lateinit var handBtn: LinearLayout
    private lateinit var chatBtn: LinearLayout
    private lateinit var chatPanel: LinearLayout
    private lateinit var chatList: LinearLayout
    private lateinit var chatScroll: ScrollView
    private lateinit var chatInput: EditText
    private var remoteVideoPeer: String? = null
    private var remoteTrack: VideoTrack? = null
    private var localAttached = false
    private var selectedTool = "pen"

    private val timerTick = object : Runnable {
        override fun run() {
            val s = (System.currentTimeMillis() - startedAt) / 1000
            timerTv.text = String.format("%02d:%02d", s / 60, s % 60)
            main.postDelayed(this, 1000)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        parseIntent()
        if (roomId.isEmpty()) {
            Toast.makeText(this, "آدرس کلاس نامعتبر است", Toast.LENGTH_LONG).show(); finish(); return
        }
        (getSystemService(AUDIO_SERVICE) as? AudioManager)?.apply {
            mode = AudioManager.MODE_IN_COMMUNICATION; isSpeakerphoneOn = true
        }
        mesh = ClassroomMesh(
            this,
            sendSignal = { type, target, payload -> sendSignal(type, target, payload) },
            onRemoteVideo = { peerId, track ->
                main.post {
                    val p = participants[peerId]
                    val camEnabled = p?.optBoolean("cameraEnabled") ?: false
                    if (camEnabled || !wantTeacher || remoteVideoPeer == peerId) {
                        showRemoteVideo(peerId, track)
                    }
                }
            },
            onPeerState = { _, _ -> }
        )
        setContentView(buildUi())
        requestPermissionsIfNeeded()
        connect()
        main.post(timerTick)
    }

    private fun parseIntent() {
        val i = intent
        val url = i.getStringExtra(EXTRA_ROOM_URL) ?: ""
        roomId = i.getStringExtra(EXTRA_ROOM_ID) ?: ""
        title = i.getStringExtra(EXTRA_TITLE) ?: "کلاس آنلاین"
        wantTeacher = i.getBooleanExtra(EXTRA_IS_TEACHER, false)
        token = i.getStringExtra(EXTRA_TOKEN) ?: ""
        ticket = i.getStringExtra(EXTRA_TICKET_CODE) ?: ""
        userName = i.getStringExtra(EXTRA_USER_NAME) ?: ""
        wsUrl = i.getStringExtra(EXTRA_WS_URL) ?: ""
        if (url.isNotEmpty()) {
            val uri = Uri.parse(url)
            if (roomId.isEmpty()) roomId = uri.pathSegments.lastOrNull() ?: ""
            if (ticket.isEmpty()) ticket = uri.getQueryParameter("ticket") ?: uri.getQueryParameter("ticketCode") ?: ""
            if (wsUrl.isEmpty()) {
                val scheme = if (uri.scheme == "http") "ws" else "wss"
                wsUrl = "$scheme://${uri.authority}/api/classroom/native/ws"
            }
        }
        if (wsUrl.isEmpty()) wsUrl = ClassroomTheme.DEFAULT_WS_BASE
    }

    // ------------------------------------------------------------------ UI
    private fun buildUi(): View {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            layoutDirection = View.LAYOUT_DIRECTION_RTL
            setBackgroundColor(ClassroomTheme.bg)
            fitsSystemWindows = true
        }
        root.addView(buildHeader())

        val stage = FrameLayout(this).apply {
            layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f)
        }
        board = WhiteboardView(this).apply { callbacks = this@KitayarClassroomActivity }
        stage.addView(board, FrameLayout.LayoutParams(-1, -1))

        remoteRenderer = SurfaceViewRenderer(this).apply {
            init(mesh!!.eglBase.eglBaseContext, null)
            setEnableHardwareScaler(true)
            setZOrderMediaOverlay(true)
            visibility = View.GONE
            background = ClassroomUi.rounded(this@KitayarClassroomActivity, ClassroomTheme.surface, 12)
            clipToOutline = true
        }
        stage.addView(remoteRenderer, FrameLayout.LayoutParams(dp(this, 110), dp(this, 150)).apply {
            gravity = Gravity.TOP or Gravity.START; topMargin = dp(this@KitayarClassroomActivity, 8); marginStart = dp(this@KitayarClassroomActivity, 8)
        })
        localRenderer = SurfaceViewRenderer(this).apply {
            init(mesh!!.eglBase.eglBaseContext, null)
            setMirror(true)
            setZOrderMediaOverlay(true)
            visibility = View.GONE
        }
        stage.addView(localRenderer, FrameLayout.LayoutParams(dp(this, 72), dp(this, 96)).apply {
            gravity = Gravity.BOTTOM or Gravity.START; bottomMargin = dp(this@KitayarClassroomActivity, 8); marginStart = dp(this@KitayarClassroomActivity, 8)
        })

        chatPanel = buildChatPanel()
        stage.addView(chatPanel, FrameLayout.LayoutParams(-1, dp(this, 300)).apply { gravity = Gravity.BOTTOM })
        root.addView(stage)

        root.addView(buildBoardTools())
        root.addView(buildControls())
        return root
    }

    private fun buildHeader(): View {
        val bar = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setBackgroundColor(ClassroomTheme.surface)
            setPadding(dp(this@KitayarClassroomActivity, 12), dp(this@KitayarClassroomActivity, 8), dp(this@KitayarClassroomActivity, 12), dp(this@KitayarClassroomActivity, 8))
        }
        val col = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(0, -2, 1f)
        }
        col.addView(TextView(this).apply {
            text = title; setTextColor(ClassroomTheme.text); textSize = 14f
            typeface = Typeface.DEFAULT_BOLD; maxLines = 1
        })
        val sub = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL }
        statusTv = TextView(this).apply { text = "در حال اتصال…"; setTextColor(ClassroomTheme.warning); textSize = 11f }
        timerTv = TextView(this).apply { text = "00:00"; setTextColor(ClassroomTheme.textMuted); textSize = 11f; setPadding(dp(this@KitayarClassroomActivity, 10), 0, 0, 0) }
        sub.addView(statusTv); sub.addView(timerTv)
        col.addView(sub)
        bar.addView(col)
        countTv = TextView(this).apply {
            text = "👥 ۱"; setTextColor(ClassroomTheme.text); textSize = 12f
            setPadding(dp(this@KitayarClassroomActivity, 10), dp(this@KitayarClassroomActivity, 6), dp(this@KitayarClassroomActivity, 10), dp(this@KitayarClassroomActivity, 6))
            background = ClassroomUi.rounded(this@KitayarClassroomActivity, ClassroomTheme.surfaceHigh, 12)
            setOnClickListener { showParticipants() }
        }
        bar.addView(countTv)
        return bar
    }

    private fun buildBoardTools(): View {
        val wrap = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setBackgroundColor(ClassroomTheme.surface); visibility = View.GONE; tag = "tools" }
        toolsRow = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; setPadding(dp(this@KitayarClassroomActivity, 6), dp(this@KitayarClassroomActivity, 6), dp(this@KitayarClassroomActivity, 6), 0) }
        colorsRow = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL; setPadding(dp(this@KitayarClassroomActivity, 6), dp(this@KitayarClassroomActivity, 6), dp(this@KitayarClassroomActivity, 6), dp(this@KitayarClassroomActivity, 6)) }
        pageRow = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL; setPadding(dp(this@KitayarClassroomActivity, 6), 0, dp(this@KitayarClassroomActivity, 6), 0) }
        pageTv = TextView(this).apply { setTextColor(ClassroomTheme.text); textSize = 12f; setPadding(dp(this@KitayarClassroomActivity, 8), 0, dp(this@KitayarClassroomActivity, 8), 0) }

        val scroller = HorizontalScrollView(this).apply { isHorizontalScrollBarEnabled = false; addView(toolsRow) }
        val scroller2 = HorizontalScrollView(this).apply { isHorizontalScrollBarEnabled = false; addView(colorsRow) }
        wrap.addView(scroller); wrap.addView(scroller2); wrap.addView(pageRow)
        refreshTools()
        return wrap
    }

    private fun refreshTools() {
        val tools = listOf(
            "pen" to "✏️ قلم", "highlighter" to "🖍 هایلایت", "line" to "╱ خط", "arrow" to "➜ فلش",
            "rect" to "▭ مستطیل", "circle" to "◯ دایره", "text" to "🅣 متن", "eraser" to "🧽 پاک‌کن",
            "laser" to "🔴 لیزر", "pan" to "✋ جابجایی"
        )
        toolsRow.removeAllViews()
        tools.forEach { (id, label) ->
            toolsRow.addView(ClassroomUi.chip(this, label, selectedTool == id) {
                selectedTool = id; board.tool = id; refreshTools()
            })
        }
        colorsRow.removeAllViews()
        ClassroomTheme.penColors.forEach { c ->
            colorsRow.addView(ClassroomUi.colorDot(this, c, board.penColor == c) { board.penColor = c; refreshTools() })
        }
        colorsRow.addView(ClassroomUi.chip(this, "↩ واگرد", false) { sendWb("undo", JSONObject().put("page", board.currentPage)) })
        pageRow.removeAllViews()
        if (selfIsManager) {
            pageRow.addView(ClassroomUi.chip(this, "‹", false) { changePage(board.currentPage + 1) })
            pageRow.addView(pageTv)
            pageRow.addView(ClassroomUi.chip(this, "›", false) { changePage(board.currentPage - 1) })
            pageRow.addView(ClassroomUi.chip(this, "🗑 پاک‌سازی صفحه", false) { sendWb("clear_page", JSONObject().put("page", board.currentPage)) })
            pageRow.addView(ClassroomUi.chip(this, if (allowStudentDraw) "✏️ قلم دانش‌آموز: روشن" else "✏️ قلم دانش‌آموز: خاموش", allowStudentDraw) {
                sendWb("toggle_student_draw", JSONObject().put("allowStudentDraw", !allowStudentDraw))
            })
        }
        pageTv.text = "صفحه ${board.currentPage} از ${board.totalPages}"
        val canDraw = selfIsManager || allowStudentDraw
        board.canDraw = canDraw
        (toolsRow.parent.parent as? View)?.visibility = if (canDraw) View.VISIBLE else View.GONE
    }

    private fun changePage(p: Int) {
        val next = p.coerceIn(1, maxOf(board.totalPages, 1))
        sendWb("change_page", JSONObject().put("page", next))
    }

    private fun buildControls(): View {
        val bar = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            setBackgroundColor(ClassroomTheme.surface)
            setPadding(dp(this@KitayarClassroomActivity, 8), dp(this@KitayarClassroomActivity, 8), dp(this@KitayarClassroomActivity, 8), dp(this@KitayarClassroomActivity, 10))
        }
        micBtn = ClassroomUi.controlButton(this, "🎙", "میکروفون", ClassroomTheme.surfaceHigh) { toggleMic() }
        camBtn = ClassroomUi.controlButton(this, "📷", "دوربین", ClassroomTheme.surfaceHigh) { toggleCamera() }
        handBtn = ClassroomUi.controlButton(this, "✋", "دست", ClassroomTheme.surfaceHigh) { toggleHand() }
        chatBtn = ClassroomUi.controlButton(this, "💬", "گفتگو", ClassroomTheme.surfaceHigh) { toggleChat() }
        val leave = ClassroomUi.controlButton(this, "⏻", "خروج", ClassroomTheme.dangerDark) { confirmExit() }
        listOf(micBtn, camBtn, handBtn, chatBtn, leave).forEach { bar.addView(it) }
        return bar
    }

    private fun buildChatPanel(): LinearLayout {
        val panel = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            background = ClassroomUi.rounded(this@KitayarClassroomActivity, ClassroomTheme.surface, 16, ClassroomTheme.border)
            visibility = View.GONE
            setPadding(dp(this@KitayarClassroomActivity, 10), dp(this@KitayarClassroomActivity, 8), dp(this@KitayarClassroomActivity, 10), dp(this@KitayarClassroomActivity, 8))
        }
        chatScroll = ScrollView(this).apply { layoutParams = LinearLayout.LayoutParams(-1, 0, 1f) }
        chatList = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        chatScroll.addView(chatList)
        panel.addView(chatScroll)
        val row = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL }
        chatInput = EditText(this).apply {
            hint = "پیام خود را بنویسید…"; setHintTextColor(ClassroomTheme.textMuted); setTextColor(ClassroomTheme.text)
            textSize = 13f; maxLines = 3
            background = ClassroomUi.rounded(this@KitayarClassroomActivity, ClassroomTheme.surfaceHigh, 14)
            setPadding(dp(this@KitayarClassroomActivity, 12), dp(this@KitayarClassroomActivity, 8), dp(this@KitayarClassroomActivity, 12), dp(this@KitayarClassroomActivity, 8))
            layoutParams = LinearLayout.LayoutParams(0, -2, 1f)
        }
        val send = ClassroomUi.chip(this, "ارسال", true) { sendChat() }
        row.addView(chatInput); row.addView(send)
        panel.addView(row)
        return panel
    }

    // ------------------------------------------------------------------ signaling
    private fun connect() {
        signaling?.close()
        signaling = ClassroomSignaling(wsUrl, this).also { it.connect() }
    }

    private fun send(json: JSONObject) { signaling?.send(json) }

    private fun sendSignal(type: String, target: String, payload: JSONObject) {
        val j = JSONObject().put("type", type).put("roomId", roomId).put("targetPeerId", target)
        if (payload.has("sdp")) j.put("sdp", payload.get("sdp"))
        if (payload.has("candidate")) j.put("candidate", payload.get("candidate"))
        send(j)
    }

    private fun sendWb(action: String, payload: JSONObject) {
        send(JSONObject().put("type", "whiteboard_action").put("roomId", roomId).put("action", action).put("payload", payload))
    }

    override fun onOpen() {
        statusTv.text = "اتصال برقرار شد"
        val j = JSONObject().put("type", "join_room").put("roomId", roomId)
            .put("requestedRole", if (wantTeacher) "teacher" else "student")
        if (token.isNotEmpty()) j.put("token", token)
        if (ticket.isNotEmpty()) j.put("ticketCode", ticket)
        if (userName.isNotEmpty()) j.put("displayName", userName)
        send(j)
    }

    override fun onClosed(reason: String) {
        if (ended || isFinishing) return
        statusTv.text = "اتصال قطع شد؛ تلاش مجدد…"
        statusTv.setTextColor(ClassroomTheme.warning)
        mesh?.closeAllPeers()
        main.postDelayed({ if (!ended && !isFinishing) connect() }, 3000)
    }

    override fun onMessage(msg: JSONObject) {
        val p = msg.optJSONObject("payload") ?: JSONObject()
        val from = msg.optString("fromPeerId")
        when (msg.optString("type")) {
            "room_joined" -> onRoomJoined(p)
            "participant_joined" -> p.optJSONObject("participant")?.let { participants[it.optString("peerId")] = it; updateCount() }
            "participant_left" -> {
                val id = p.optString("peerId")
                participants.remove(id); mesh?.removePeer(id)
                if (remoteVideoPeer == id) hideRemoteVideo()
                updateCount()
            }
            "offer" -> p.optJSONObject("sdp")?.let { mesh?.handleOffer(from, it) }
            "answer" -> p.optJSONObject("sdp")?.let { mesh?.handleAnswer(from, it) }
            "ice_candidate" -> p.optJSONObject("candidate")?.let { mesh?.handleCandidate(from, it) }
            "microphone_state_changed", "permission_state_changed" -> onMicChanged(p)
            "camera_state_changed" -> {
                val id = p.optString("peerId")
                val enabled = p.optBoolean("enabled")
                participants[id]?.put("cameraEnabled", enabled)
                if (enabled) {
                    val track = mesh?.getRemoteVideoTrack(id)
                    if (track != null) {
                        showRemoteVideo(id, track)
                    }
                } else {
                    if (remoteVideoPeer == id) hideRemoteVideo()
                }
            }
            "hand_raise_changed" -> participants[p.optString("peerId")]?.put("handRaised", p.optBoolean("raised"))
            "speaker_status_changed", "moderator_status_changed" -> onRoleChanged(p, msg.optString("type"))
            "whiteboard_update" -> onWhiteboardUpdate(p)
            "chat_message" -> { addChat(p); if (chatPanel.visibility != View.VISIBLE) { unread++; updateButtons() } }
            "participant_removed" -> showKickedDialog(
                p.optString("reason", "از کلاس خارج شدید."),
                p.optString("code") == "DUPLICATE_DEVICE"
            )
            "class_end_warning" -> {
                val warnMsg = p.optString("message", "تنها ۵ دقیقه تا پایان کلاس آنلاین باقی مانده است ⏳")
                toast(warnMsg)
            }
            "teacher_presence" -> {
                val present = p.optBoolean("present")
                val graceMin = p.optInt("teacherGraceMinutes", 30)
                if (!wantTeacher && !present) {
                    showTeacherWaitingDialog(graceMin)
                } else if (present) {
                    dismissTeacherWaitingDialog()
                }
            }
            "room_ended" -> {
                ended = true
                try { signaling?.close() } catch (_: Exception) {}
                toast(p.optString("reason", "کلاس به پایان رسید."))
                endLocal()
            }
            "error" -> {
                val code = p.optString("code")
                val errMsg = p.optString("message", "خطا")
                if (code == "INVALID_TICKET" || code == "UNAUTHORIZED" || code == "ROOM_ENDED" || code == "TEACHER_ALREADY_PRESENT") {
                    showKickedDialog(errMsg, false)
                } else {
                    toast(errMsg)
                }
            }
        }
    }

    private fun onRoomJoined(p: JSONObject) {
        val self = p.optJSONObject("self") ?: return
        selfPeerId = self.optString("peerId")
        selfIsManager = self.optBoolean("isTeacher") || self.optBoolean("isModerator") || self.optString("role") == "teacher"
        micState = self.optString("micState", "disabled")
        participants.clear()
        participants[selfPeerId] = self
        p.optJSONArray("participants")?.let { arr ->
            for (i in 0 until arr.length()) arr.optJSONObject(i)?.let { participants[it.optString("peerId")] = it }
        }
        isSeminar = p.optJSONObject("room")?.optString("uiMode") == "seminar"
        p.optJSONObject("whiteboard")?.let { allowStudentDraw = it.optBoolean("allowStudentDraw"); board.syncState(it) }
        chat.clear(); chatList.removeAllViews()
        p.optJSONArray("chatMessages")?.let { arr -> for (i in 0 until arr.length()) arr.optJSONObject(i)?.let { addChat(it) } }

        mesh?.setIceServers(p.optJSONArray("iceServers"))
        mesh?.closeAllPeers()
        participants.keys.filter { it != selfPeerId }.forEach { mesh?.offerTo(it) }

        statusTv.text = "متصل"; statusTv.setTextColor(ClassroomTheme.primary)
        if (micOn) send(JSONObject().put("type", "set_microphone").put("roomId", roomId).put("enabled", true))
        updateCount(); updateButtons(); refreshTools()

        p.optJSONObject("teacherPresence")?.let { tp ->
            val present = tp.optBoolean("present")
            val graceMin = tp.optInt("teacherGraceMinutes", 30)
            if (!wantTeacher && !present) {
                showTeacherWaitingDialog(graceMin)
            }
        }
    }

    private fun onMicChanged(p: JSONObject) {
        val id = p.optString("peerId")
        val state = p.optString("micState", if (p.optBoolean("enabled")) "enabled" else "disabled")
        participants[id]?.put("micState", state)
        if (id == selfPeerId) {
            micState = state
            if (state != "enabled") { micOn = false; mesh?.setMicEnabled(false) }
            updateButtons()
        }
    }

    private fun onRoleChanged(p: JSONObject, type: String) {
        val id = p.optString("peerId")
        val entry = participants[id] ?: return
        if (type == "moderator_status_changed") entry.put("isModerator", p.optBoolean("isModerator"))
        else entry.put("isSpeaker", p.optBoolean("isSpeaker"))
        if (p.has("micState")) entry.put("micState", p.optString("micState"))
        if (id == selfPeerId) {
            selfIsManager = entry.optBoolean("isModerator") || entry.optBoolean("isTeacher")
            micState = entry.optString("micState", micState)
            toast(if (type == "moderator_status_changed" && selfIsManager) "شما مدیر جلسه شدید" else "دسترسی شما تغییر کرد")
            updateButtons(); refreshTools()
        }
    }

    private fun onWhiteboardUpdate(p: JSONObject) {
        when (p.optString("action")) {
            "add_element" -> p.optJSONObject("element")?.let { board.addElement(p.optInt("page", board.currentPage), it) }
            "erase_element" -> board.eraseElement(p.optInt("page", board.currentPage), p.optString("elementId"))
            "clear_page" -> board.clearPage(p.optInt("page", board.currentPage))
            "change_page" -> board.changePage(p.optInt("currentPage", 1), p.optJSONArray("elements"))
            "set_grid" -> { board.gridMode = p.optString("gridMode", "blank"); board.invalidate() }
            "toggle_student_draw" -> { allowStudentDraw = p.optBoolean("allowStudentDraw"); }
            "sync_state" -> p.optJSONObject("whiteboard")?.let { allowStudentDraw = it.optBoolean("allowStudentDraw"); board.syncState(it) }
            "draw_progress" -> p.optJSONObject("element")?.let { board.setRemoteDraft(p.optString("peerId"), p.optInt("page", board.currentPage), it) }
            "laser_move" -> board.setLaser(p.optInt("page", board.currentPage), p.optDouble("x").toFloat(), p.optDouble("y").toFloat(), p.optBoolean("active"))
        }
        if (p.optString("action") == "add_element") p.optString("peerId").takeIf { it.isNotEmpty() }?.let { board.clearRemoteDraft(it) }
        refreshTools()
    }

    // ------------------------------------------------------------------ whiteboard callbacks
    override fun onCommit(page: Int, element: JSONObject) = sendWb("add_element", JSONObject().put("page", page).put("element", element))
    override fun onProgress(page: Int, element: JSONObject) = sendWb("draw_progress", JSONObject().put("page", page).put("element", element))
    override fun onErase(page: Int, elementId: String) = sendWb("erase_element", JSONObject().put("page", page).put("elementId", elementId))
    override fun onLaser(page: Int, x: Double, y: Double, active: Boolean) =
        sendWb("laser_move", JSONObject().put("page", page).put("x", x).put("y", y).put("active", active))

    override fun onTextRequest(page: Int, x: Double, y: Double) {
        val input = EditText(this).apply { hint = "متن را بنویسید"; layoutDirection = View.LAYOUT_DIRECTION_RTL }
        AlertDialog.Builder(this).setTitle("افزودن متن").setView(input)
            .setPositiveButton("افزودن") { _, _ ->
                val txt = input.text.toString().trim()
                if (txt.isEmpty()) return@setPositiveButton
                val el = JSONObject().put("id", "el_${System.currentTimeMillis()}").put("tool", "text")
                    .put("color", String.format("#%06X", 0xFFFFFF and board.penColor)).put("size", board.penSize)
                    .put("start", JSONObject().put("x", x).put("y", y)).put("text", txt)
                board.addElement(page, el); onCommit(page, el)
            }.setNegativeButton("انصراف", null).show()
    }

    // ------------------------------------------------------------------ controls
    private fun hasPerm(p: String) = ContextCompat.checkSelfPermission(this, p) == PackageManager.PERMISSION_GRANTED

    private fun requestPermissionsIfNeeded() {
        val need = mutableListOf<String>()
        if (!hasPerm(Manifest.permission.RECORD_AUDIO)) need.add(Manifest.permission.RECORD_AUDIO)
        if (!hasPerm(Manifest.permission.CAMERA)) need.add(Manifest.permission.CAMERA)
        if (Build.VERSION.SDK_INT >= 33 && !hasPerm(Manifest.permission.POST_NOTIFICATIONS)) { /* not needed */ }
        if (need.isNotEmpty()) ActivityCompat.requestPermissions(this, need.toTypedArray(), PERM_REQUEST)
    }

    private fun toggleMic() {
        if (micState == "blocked") { toast("میکروفون شما توسط مدیر قفل شده است؛ از «دست» استفاده کنید."); return }
        if (!hasPerm(Manifest.permission.RECORD_AUDIO)) { requestPermissionsIfNeeded(); return }
        micOn = !micOn
        mesh?.setMicEnabled(micOn)
        send(JSONObject().put("type", "set_microphone").put("roomId", roomId).put("enabled", micOn))
        updateButtons()
    }

    private fun toggleCamera() {
        if (!hasPerm(Manifest.permission.CAMERA)) { requestPermissionsIfNeeded(); return }
        val want = !camOn
        val ok = mesh?.setCameraEnabled(want) ?: false
        if (want && !ok) { toast("دوربین در دسترس نیست"); return }
        camOn = want
        if (camOn) {
            if (!localAttached) { mesh?.localVideoTrack?.addSink(localRenderer); localAttached = true }
            localRenderer.visibility = View.VISIBLE
        } else {
            localRenderer.visibility = View.GONE
        }
        send(JSONObject().put("type", "set_camera").put("roomId", roomId).put("enabled", camOn))
        updateButtons()
    }

    private fun toggleHand() {
        handUp = !handUp
        send(JSONObject().put("type", "raise_hand").put("roomId", roomId).put("enabled", handUp))
        updateButtons()
    }

    private fun toggleChat() {
        val show = chatPanel.visibility != View.VISIBLE
        chatPanel.visibility = if (show) View.VISIBLE else View.GONE
        if (show) { unread = 0; chatScroll.post { chatScroll.fullScroll(View.FOCUS_DOWN) } }
        updateButtons()
    }

    private fun sendChat() {
        val t = chatInput.text.toString().trim()
        if (t.isEmpty()) return
        send(JSONObject().put("type", "chat_message").put("roomId", roomId).put("text", t))
        chatInput.setText("")
    }

    private fun addChat(m: JSONObject) {
        chat.add(m)
        val mine = m.optString("senderPeerId") == selfPeerId
        val tv = TextView(this).apply {
            val who = m.optString("senderName", "")
            text = "$who: ${m.optString("text", m.optString("message"))}"
            textSize = 13f
            setTextColor(ClassroomTheme.text)
            setPadding(dp(this@KitayarClassroomActivity, 10), dp(this@KitayarClassroomActivity, 6), dp(this@KitayarClassroomActivity, 10), dp(this@KitayarClassroomActivity, 6))
            background = ClassroomUi.rounded(this@KitayarClassroomActivity, if (mine) ClassroomTheme.primaryDark else ClassroomTheme.surfaceHigh, 12)
            layoutParams = LinearLayout.LayoutParams(-2, -2).apply { topMargin = dp(this@KitayarClassroomActivity, 4); gravity = if (mine) Gravity.START else Gravity.END }
        }
        chatList.addView(tv)
        chatScroll.post { chatScroll.fullScroll(View.FOCUS_DOWN) }
    }

    private fun updateButtons() {
        val T = ClassroomTheme
        val micBlocked = micState == "blocked"
        ClassroomUi.setControlState(micBtn, if (micBlocked) "🔒" else if (micOn) "🎙" else "🔇",
            if (micBlocked) "قفل" else if (micOn) "روشن" else "خاموش",
            if (micOn) T.primaryDark else T.surfaceHigh)
        ClassroomUi.setControlState(camBtn, if (camOn) "📹" else "📷", if (camOn) "روشن" else "دوربین", if (camOn) T.primaryDark else T.surfaceHigh)
        handBtn.visibility = if (selfIsManager) View.GONE else View.VISIBLE
        ClassroomUi.setControlState(handBtn, "✋", if (handUp) "پایین" else "دست", if (handUp) T.warning else T.surfaceHigh)
        ClassroomUi.setControlState(chatBtn, "💬", if (unread > 0) "گفتگو ($unread)" else "گفتگو", T.surfaceHigh)
    }

    private fun updateCount() { countTv.text = "👥 ${participants.size}" }

    private fun showParticipants() {
        val ids = participants.keys.toList()
        val labels = ids.map { id ->
            val p = participants[id]!!
            val role = if (p.optBoolean("isTeacher") || p.optBoolean("isModerator")) "مدیر" else "شرکت‌کننده"
            val hand = if (p.optBoolean("handRaised")) " ✋" else ""
            val mic = if (p.optString("micState") == "enabled") " 🎙" else ""
            "${p.optString("name")} — $role$hand$mic" + if (id == selfPeerId) " (شما)" else ""
        }.toTypedArray()
        AlertDialog.Builder(this).setTitle("حاضرین (${ids.size})").setItems(labels) { _, i ->
            if (selfIsManager && ids[i] != selfPeerId) manageParticipant(ids[i])
        }.setNegativeButton("بستن", null).show()
    }

    private fun manageParticipant(id: String) {
        val p = participants[id] ?: return
        val items = arrayOf("اعطای اجازه صحبت", "سلب اجازه صحبت", "قفل/باز کردن میکروفون", "انتخاب به‌عنوان مدیر", "اخراج از کلاس")
        AlertDialog.Builder(this).setTitle(p.optString("name")).setItems(items) { _, i ->
            val base = JSONObject().put("roomId", roomId).put("targetPeerId", id)
            when (i) {
                0 -> send(base.put("type", "grant_speaker"))
                1 -> send(base.put("type", "revoke_speaker"))
                2 -> send(base.put("type", "teacher_set_permission").put("micBlocked", p.optString("micState") != "blocked"))
                3 -> send(base.put("type", "grant_moderator"))
                4 -> send(base.put("type", "teacher_remove_participant"))
            }
        }.show()
    }

    private fun showRemoteVideo(peerId: String, track: VideoTrack) {
        if (remoteTrack != track) {
            remoteTrack?.removeSink(remoteRenderer)
            remoteTrack = track
            track.addSink(remoteRenderer)
        }
        remoteVideoPeer = peerId
        remoteRenderer.visibility = View.VISIBLE
    }

    private fun hideRemoteVideo() {
        remoteTrack?.removeSink(remoteRenderer)
        remoteTrack = null; remoteVideoPeer = null
        remoteRenderer.visibility = View.GONE
    }

    private fun confirmExit() {
        val builder = AlertDialog.Builder(this).setTitle("خروج از کلاس")
            .setNegativeButton("انصراف", null)
            .setPositiveButton("خروج") { _, _ -> endLocal() }
        if (selfIsManager) {
            builder.setMessage("می‌خواهید فقط خارج شوید یا کلاس را برای همه پایان دهید؟")
                .setNeutralButton("پایان کلاس برای همه") { _, _ ->
                    send(JSONObject().put("type", "teacher_end_room").put("roomId", roomId)); endLocal()
                }
        } else builder.setMessage("آیا از خروج از کلاس مطمئن هستید؟")
        builder.show()
    }

    private fun showKickedDialog(reason: String, isDuplicateDevice: Boolean) {
        ended = true
        main.removeCallbacksAndMessages(null)
        try { signaling?.close() } catch (_: Exception) {}
        micOn = false
        camOn = false
        mesh?.setMicEnabled(false)
        mesh?.setCameraEnabled(false)
        mesh?.closeAllPeers()
        remoteRenderer.visibility = View.GONE
        localRenderer.visibility = View.GONE
        statusTv.text = if (isDuplicateDevice) "قطع اتصال (دستگاه جدید)" else "قطع اتصال"
        statusTv.setTextColor(ClassroomTheme.warning)
        if (isFinishing || isDestroyed) return
        val builder = AlertDialog.Builder(this)
            .setCancelable(false)
            .setTitle(if (isDuplicateDevice) "ورود با دستگاه جدید" else "خروج از کلاس")
            .setMessage(reason)
            .setPositiveButton("بستن") { _, _ -> endLocal() }
        if (isDuplicateDevice) {
            builder.setNeutralButton("ورود مجدد از این دستگاه") { _, _ ->
                ended = false
                statusTv.text = "در حال اتصال…"
                statusTv.setTextColor(ClassroomTheme.warning)
                main.post(timerTick)
                connect()
            }
        }
        builder.show()
    }

    private var teacherWaitingDialog: AlertDialog? = null

    private fun showTeacherWaitingDialog(graceMinutes: Int) {
        if (wantTeacher || isFinishing || isDestroyed || teacherWaitingDialog?.isShowing == true) return
        val builder = AlertDialog.Builder(this)
            .setCancelable(true)
            .setTitle("در انتظار ورود معلم")
            .setMessage("معلم هنوز وارد کلاس نشده است.\n\nطبق قوانین کیتایار، معلم حداکثر تا $graceMinutes دقیقه پس از ساعت شروع می‌تواند وارد شود. در صورت عدم حضور، کلاس لغو شده و ۱۰۰٪ مبلغ پرداختی به کیف پول شما واریز خواهد شد.")
            .setPositiveButton("متوجه شدم (صبر می‌کنم)") { d, _ -> d.dismiss() }
        teacherWaitingDialog = builder.create()
        teacherWaitingDialog?.show()
    }

    private fun dismissTeacherWaitingDialog() {
        if (teacherWaitingDialog?.isShowing == true) {
            teacherWaitingDialog?.dismiss()
            toast("معلم وارد کلاس شد. کلاس آغاز گردید.")
        }
        teacherWaitingDialog = null
    }

    private fun endLocal() { ended = true; finish() }

    private fun toast(s: String) = Toast.makeText(this, s, Toast.LENGTH_SHORT).show()

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() = confirmExit()

    override fun onDestroy() {
        main.removeCallbacksAndMessages(null)
        ended = true
        try {
            send(JSONObject().put("type", "leave_room").put("roomId", roomId))
            signaling?.close()
            remoteTrack?.removeSink(remoteRenderer)
            mesh?.localVideoTrack?.removeSink(localRenderer)
            remoteRenderer.release(); localRenderer.release()
            mesh?.release()
            (getSystemService(AUDIO_SERVICE) as? AudioManager)?.apply { mode = AudioManager.MODE_NORMAL; isSpeakerphoneOn = false }
        } catch (e: Exception) { e.printStackTrace() }
        super.onDestroy()
    }
}
