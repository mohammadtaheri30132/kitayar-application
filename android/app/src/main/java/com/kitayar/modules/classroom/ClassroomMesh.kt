package com.kitayar.modules.classroom

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import org.webrtc.AudioTrack
import org.webrtc.Camera2Enumerator
import org.webrtc.CameraVideoCapturer
import org.webrtc.DataChannel
import org.webrtc.DefaultVideoDecoderFactory
import org.webrtc.DefaultVideoEncoderFactory
import org.webrtc.EglBase
import org.webrtc.IceCandidate
import org.webrtc.MediaConstraints
import org.webrtc.MediaStream
import org.webrtc.PeerConnection
import org.webrtc.PeerConnectionFactory
import org.webrtc.RtpReceiver
import org.webrtc.RtpTransceiver
import org.webrtc.SdpObserver
import org.webrtc.SessionDescription
import org.webrtc.SurfaceTextureHelper
import org.webrtc.VideoTrack

/**
 * Native WebRTC mesh: the joiner offers to every existing peer (same convention as the web client),
 * existing peers answer. Audio plays natively; remote video tracks are handed to the UI.
 */
class ClassroomMesh(
    private val context: Context,
    private val sendSignal: (type: String, targetPeerId: String, payload: JSONObject) -> Unit,
    private val onRemoteVideo: (peerId: String, track: VideoTrack) -> Unit,
    private val onPeerState: (peerId: String, state: String) -> Unit
) {
    val eglBase: EglBase = EglBase.create()

    private val factory: PeerConnectionFactory
    private var iceServers: List<PeerConnection.IceServer> = listOf(
        PeerConnection.IceServer.builder("stun:stun.l.google.com:19302").createIceServer()
    )
    private val peers = HashMap<String, PeerConnection>()
    private val pendingCandidates = HashMap<String, MutableList<IceCandidate>>()

    private val localAudioSource: org.webrtc.AudioSource
    val localAudioTrack: AudioTrack
    private val localVideoSource: org.webrtc.VideoSource
    val localVideoTrack: VideoTrack
    private var capturer: CameraVideoCapturer? = null
    private var textureHelper: SurfaceTextureHelper? = null
    private var capturing = false
    private var useFront = true

    init {
        PeerConnectionFactory.initialize(
            PeerConnectionFactory.InitializationOptions.builder(context.applicationContext).createInitializationOptions()
        )
        factory = PeerConnectionFactory.builder()
            .setVideoEncoderFactory(DefaultVideoEncoderFactory(eglBase.eglBaseContext, true, true))
            .setVideoDecoderFactory(DefaultVideoDecoderFactory(eglBase.eglBaseContext))
            .createPeerConnectionFactory()

        localAudioSource = factory.createAudioSource(MediaConstraints().apply {
            mandatory.add(MediaConstraints.KeyValuePair("googEchoCancellation", "true"))
            mandatory.add(MediaConstraints.KeyValuePair("googNoiseSuppression", "true"))
            mandatory.add(MediaConstraints.KeyValuePair("googAutoGainControl", "true"))
        })
        localAudioTrack = factory.createAudioTrack("audio0", localAudioSource).apply { setEnabled(false) }

        localVideoSource = factory.createVideoSource(false)
        localVideoTrack = factory.createVideoTrack("video0", localVideoSource).apply { setEnabled(false) }
    }

    fun setIceServers(arr: JSONArray?) {
        if (arr == null || arr.length() == 0) return
        val list = ArrayList<PeerConnection.IceServer>()
        for (i in 0 until arr.length()) {
            val o = arr.optJSONObject(i) ?: continue
            val urls = ArrayList<String>()
            when (val u = o.opt("urls")) {
                is JSONArray -> for (j in 0 until u.length()) urls.add(u.getString(j))
                is String -> urls.add(u)
            }
            if (urls.isEmpty()) continue
            val b = PeerConnection.IceServer.builder(urls)
            o.optString("username").takeIf { it.isNotEmpty() }?.let { b.setUsername(it) }
            o.optString("credential").takeIf { it.isNotEmpty() }?.let { b.setPassword(it) }
            list.add(b.createIceServer())
        }
        if (list.isNotEmpty()) iceServers = list
    }

    private fun createPeer(peerId: String): PeerConnection {
        peers[peerId]?.let { return it }
        val config = PeerConnection.RTCConfiguration(iceServers).apply {
            sdpSemantics = PeerConnection.SdpSemantics.UNIFIED_PLAN
            continualGatheringPolicy = PeerConnection.ContinualGatheringPolicy.GATHER_CONTINUALLY
        }
        val pc = factory.createPeerConnection(config, object : PeerConnection.Observer {
            override fun onIceCandidate(c: IceCandidate) {
                val j = JSONObject()
                    .put("candidate", c.sdp)
                    .put("sdpMid", c.sdpMid)
                    .put("sdpMLineIndex", c.sdpMLineIndex)
                sendSignal("ice_candidate", peerId, JSONObject().put("candidate", j))
            }

            override fun onTrack(transceiver: RtpTransceiver) {
                val t = transceiver.receiver.track()
                if (t is VideoTrack) onRemoteVideo(peerId, t)
            }

            override fun onConnectionChange(newState: PeerConnection.PeerConnectionState) {
                onPeerState(peerId, newState.name)
            }

            override fun onSignalingChange(p0: PeerConnection.SignalingState?) {}
            override fun onIceConnectionChange(p0: PeerConnection.IceConnectionState?) {}
            override fun onIceConnectionReceivingChange(p0: Boolean) {}
            override fun onIceGatheringChange(p0: PeerConnection.IceGatheringState?) {}
            override fun onIceCandidatesRemoved(p0: Array<out IceCandidate>?) {}
            override fun onAddStream(p0: MediaStream?) {}
            override fun onRemoveStream(p0: MediaStream?) {}
            override fun onDataChannel(p0: DataChannel?) {}
            override fun onRenegotiationNeeded() {}
            override fun onAddTrack(p0: RtpReceiver?, p1: Array<out MediaStream>?) {}
        }) ?: throw IllegalStateException("PeerConnection creation failed")

        pc.addTrack(localAudioTrack, listOf("kitayar"))
        pc.addTrack(localVideoTrack, listOf("kitayar"))
        peers[peerId] = pc
        return pc
    }

    fun offerTo(peerId: String) {
        val pc = createPeer(peerId)
        pc.createOffer(object : SimpleSdp() {
            override fun onCreateSuccess(desc: SessionDescription) {
                pc.setLocalDescription(SimpleSdp(), desc)
                sendSignal("offer", peerId, JSONObject().put("sdp", sdpJson(desc)))
            }
        }, MediaConstraints())
    }

    fun handleOffer(peerId: String, sdp: JSONObject) {
        val pc = createPeer(peerId)
        val remote = SessionDescription(SessionDescription.Type.OFFER, sdp.optString("sdp"))
        pc.setRemoteDescription(object : SimpleSdp() {
            override fun onSetSuccess() {
                flushCandidates(peerId, pc)
                pc.createAnswer(object : SimpleSdp() {
                    override fun onCreateSuccess(desc: SessionDescription) {
                        pc.setLocalDescription(SimpleSdp(), desc)
                        sendSignal("answer", peerId, JSONObject().put("sdp", sdpJson(desc)))
                    }
                }, MediaConstraints())
            }
        }, remote)
    }

    fun handleAnswer(peerId: String, sdp: JSONObject) {
        val pc = peers[peerId] ?: return
        val remote = SessionDescription(SessionDescription.Type.ANSWER, sdp.optString("sdp"))
        pc.setRemoteDescription(object : SimpleSdp() {
            override fun onSetSuccess() = flushCandidates(peerId, pc)
        }, remote)
    }

    fun handleCandidate(peerId: String, cand: JSONObject) {
        val c = IceCandidate(cand.optString("sdpMid"), cand.optInt("sdpMLineIndex"), cand.optString("candidate"))
        val pc = createPeer(peerId)
        if (pc.remoteDescription == null) {
            pendingCandidates.getOrPut(peerId) { mutableListOf() }.add(c)
        } else {
            pc.addIceCandidate(c)
        }
    }

    private fun flushCandidates(peerId: String, pc: PeerConnection) {
        pendingCandidates.remove(peerId)?.forEach { pc.addIceCandidate(it) }
    }

    fun removePeer(peerId: String) {
        pendingCandidates.remove(peerId)
        peers.remove(peerId)?.close()
    }

    fun closeAllPeers() {
        peers.keys.toList().forEach { removePeer(it) }
    }

    fun setMicEnabled(enabled: Boolean) = localAudioTrack.setEnabled(enabled)

    /** Starts/stops the camera; capture only runs while the camera is on to save battery and bandwidth. */
    fun setCameraEnabled(enabled: Boolean): Boolean {
        if (!enabled) {
            localVideoTrack.setEnabled(false)
            stopCapture()
            return true
        }
        val ok = startCapture()
        localVideoTrack.setEnabled(ok)
        return ok
    }

    private fun startCapture(): Boolean {
        if (capturing) return true
        val enumerator = Camera2Enumerator(context)
        val name = enumerator.deviceNames.firstOrNull { enumerator.isFrontFacing(it) == useFront }
            ?: enumerator.deviceNames.firstOrNull() ?: return false
        val cap = enumerator.createCapturer(name, null) ?: return false
        textureHelper = SurfaceTextureHelper.create("capture", eglBase.eglBaseContext)
        cap.initialize(textureHelper, context, localVideoSource.capturerObserver)
        cap.startCapture(640, 480, 24)
        capturer = cap
        capturing = true
        return true
    }

    private fun stopCapture() {
        if (!capturing) return
        try { capturer?.stopCapture() } catch (e: InterruptedException) { }
        capturer?.dispose()
        capturer = null
        textureHelper?.dispose()
        textureHelper = null
        capturing = false
    }

    fun switchCamera() {
        capturer?.switchCamera(null)
        useFront = !useFront
    }

    fun release() {
        closeAllPeers()
        stopCapture()
        localAudioTrack.dispose()
        localVideoTrack.dispose()
        localAudioSource.dispose()
        localVideoSource.dispose()
        factory.dispose()
        eglBase.release()
    }

    private fun sdpJson(d: SessionDescription) =
        JSONObject().put("type", d.type.canonicalForm()).put("sdp", d.description)

    private open class SimpleSdp : SdpObserver {
        override fun onCreateSuccess(desc: SessionDescription) {}
        override fun onSetSuccess() {}
        override fun onCreateFailure(error: String?) {}
        override fun onSetFailure(error: String?) {}
    }
}
