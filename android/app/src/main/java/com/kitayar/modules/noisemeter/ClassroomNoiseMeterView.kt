package com.kitayar.modules.noisemeter

import android.content.Context
import android.graphics.*
import android.view.Choreographer
import android.view.View
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.events.RCTEventEmitter
import kotlin.math.*
import kotlin.random.Random

/**
 * Native Android View implementing the high-performance physics-based Classroom Noise Meter.
 * Inspired by Bouncy Balls (bouncyballs.org).
 * Renders at 60-120fps with zero React Native bridge overhead for animation frames.
 */
class ClassroomNoiseMeterView(context: Context) : View(context), Choreographer.FrameCallback {

    companion object {
        private const val DEFAULT_BALL_COUNT = 45
        private const val EVENT_THROTTLE_MS = 75L // ~13 event dispatches per sec to React Native
    }

    // Subsystems
    val audioDetector = AudioNoiseDetector(context)
    val alertManager = ClassroomAlertManager(context)

    // Configuration
    var isRunning = true
        set(value) {
            field = value
            if (value) {
                if (isAttachedToWindow) {
                    audioDetector.start()
                    startPhysicsLoop()
                }
            } else {
                audioDetector.stop()
                alertManager.stopAllAlerts()
            }
            invalidate()
        }

    var ballStyle: String = "emojis" // "emojis", "balls", "bubbles", "eyes"
        set(value) {
            field = value
            invalidate()
        }

    var ballCount: Int = DEFAULT_BALL_COUNT
        set(value) {
            field = value.coerceIn(15, 80)
            if (width > 0 && height > 0) {
                initBouncyItems(width.toFloat(), height.toFloat())
            }
        }

    // Physics items
    private val items = ArrayList<BouncyItem>()
    private var lastFrameTimeNanos = 0L
    private var isLoopActive = false

    // Real-time audio and status
    @Volatile
    private var currentSoundLevel = 0f
    @Volatile
    private var currentRms = 0f
    private var lastEventEmitTime = 0L

    // Paints
    private val emojiPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        textAlign = Paint.Align.CENTER
        typeface = Typeface.DEFAULT
    }

    private val ballPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
    }

    private val highlightPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
        color = Color.argb(170, 255, 255, 255)
    }

    private val bubbleStrokePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeWidth = 2.5f
        color = Color.argb(180, 147, 197, 253)
    }

    private val bubbleFillPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
        color = Color.argb(60, 191, 219, 254)
    }

    private val floorLinePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeWidth = 3f
        color = Color.argb(40, 148, 163, 184)
    }

    // Pre-allocated palette of vibrant colors
    private val ballColors = intArrayOf(
        Color.rgb(239, 68, 68),   // Red
        Color.rgb(59, 130, 246),  // Blue
        Color.rgb(16, 185, 129),  // Emerald
        Color.rgb(245, 158, 11),  // Amber
        Color.rgb(139, 92, 246),  // Violet
        Color.rgb(236, 72, 153),  // Pink
        Color.rgb(249, 115, 22),  // Orange
        Color.rgb(20, 184, 166),  // Teal
        Color.rgb(99, 102, 241)   // Indigo
    )

    private val baseEmojis = arrayOf("😊", "😃", "😺", "🌟", "🎈", "🐥", "🍀", "🌸", "⭐")

    init {
        // Audio detector listener
        audioDetector.listener = object : AudioNoiseDetector.Listener {
            override fun onSoundLevel(level: Float, rawRms: Float, isTransientSpike: Boolean) {
                currentSoundLevel = level
                currentRms = rawRms

                // Trigger alerts
                alertManager.evaluateLevel(level)

                // Apply impulses to bouncy items
                if (level > 12.0f || isTransientSpike) {
                    val force = 180f + (level / 100.0f).pow(1.35f) * 1600f
                    applyImpulsesToItems(force, isTransientSpike)
                }
            }

            override fun onError(errorCode: String, message: String) {
                emitErrorToJs(errorCode, message)
            }
        }

        // Alert manager listener
        alertManager.listener = object : ClassroomAlertManager.Listener {
            override fun onModerateAlertTriggered() {
                emitAlertToJs("moderate")
            }

            override fun onExcessiveAlertStarted() {
                emitAlertToJs("excessive")
            }

            override fun onExcessiveAlertStopped() {
                emitAlertToJs("excessive_cleared")
            }
        }

        // Connect acoustic echo cancellation: suppress mic input during speaker alert beeps
        alertManager.onTonePlayback = { durationMs ->
            audioDetector.notifyTonePlaying(durationMs)
        }
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        if (isRunning) {
            audioDetector.start()
            startPhysicsLoop()
        }
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        stopPhysicsLoop()
        audioDetector.stop()
        alertManager.release()
    }

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        super.onSizeChanged(w, h, oldw, oldh)
        if (w > 0 && h > 0) {
            initBouncyItems(w.toFloat(), h.toFloat())
        }
    }

    private fun initBouncyItems(w: Float, h: Float) {
        items.clear()
        val density = resources.displayMetrics.density
        val baseRadius = 24f * density

        for (i in 0 until ballCount) {
            val r = baseRadius * (0.85f + Random.nextFloat() * 0.35f)
            val spawnX = r + Random.nextFloat() * (w - 2f * r)
            val spawnY = (h - r - 4f) - Random.nextFloat() * (h * 0.25f)
            val color = ballColors[i % ballColors.size]
            val highlight = Color.argb(160, 255, 255, 255)
            val emoji = baseEmojis[i % baseEmojis.size]

            val item = BouncyItem(spawnX, spawnY, r, color, highlight, emoji)
            items.add(item)
        }
    }

    private fun startPhysicsLoop() {
        if (!isLoopActive) {
            isLoopActive = true
            lastFrameTimeNanos = System.nanoTime()
            Choreographer.getInstance().postFrameCallback(this)
        }
    }

    private fun stopPhysicsLoop() {
        isLoopActive = false
        Choreographer.getInstance().removeFrameCallback(this)
    }

    override fun doFrame(frameTimeNanos: Long) {
        if (!isLoopActive || !isAttachedToWindow) return

        if (lastFrameTimeNanos != 0L) {
            val dtSec = ((frameTimeNanos - lastFrameTimeNanos) / 1_000_000_000f).coerceIn(0.001f, 0.033f)
            updatePhysics(dtSec)
            invalidate()
        }
        lastFrameTimeNanos = frameTimeNanos

        // Schedule next frame
        Choreographer.getInstance().postFrameCallback(this)
    }

    private fun updatePhysics(dt: Float) {
        val w = width.toFloat()
        val h = height.toFloat()
        if (w <= 0 || h <= 0) return

        val density = resources.displayMetrics.density
        val gravity = 1200f * density
        val currentLevel = currentSoundLevel

        val noiseState = when {
            currentLevel >= alertManager.excessiveThreshold -> "excessive"
            currentLevel >= alertManager.moderateThreshold -> "moderate"
            else -> "quiet"
        }

        // Update each item
        for (item in items) {
            item.update(dt, gravity, w, h, currentLevel)
            item.updateStateEmoji(noiseState)
        }

        // Ball-to-ball soft repulsion to prevent overlap clump
        resolveBallCollisions()

        // Throttled event dispatch to React Native
        val now = System.currentTimeMillis()
        if (now - lastEventEmitTime >= EVENT_THROTTLE_MS) {
            lastEventEmitTime = now
            emitSoundLevelToJs(currentLevel, noiseState)
        }
    }

    private fun applyImpulsesToItems(force: Float, isSpike: Boolean) {
        val h = height.toFloat()
        if (h <= 0) return

        for (item in items) {
            // Balls near floor get maximum impulse, floating ones get proportional impulse
            val heightRatio = (item.y / h).coerceIn(0.2f, 1.0f)
            val effectiveForce = force * heightRatio
            item.applyAcousticImpulse(effectiveForce, isSpike)
        }
    }

    private fun resolveBallCollisions() {
        val count = items.size
        for (i in 0 until count) {
            val a = items[i]
            for (j in (i + 1) until count) {
                val b = items[j]
                val dx = b.x - a.x
                val dy = b.y - a.y
                val distSq = dx * dx + dy * dy
                val minDist = a.radius + b.radius

                if (distSq < minDist * minDist && distSq > 0.001f) {
                    val dist = sqrt(distSq)
                    val overlap = 0.5f * (minDist - dist)
                    val nx = dx / dist
                    val ny = dy / dist

                    // Separate balls
                    a.x -= nx * overlap
                    a.y -= ny * overlap
                    b.x += nx * overlap
                    b.y += ny * overlap

                    // Partial momentum exchange
                    val kx = a.vx - b.vx
                    val ky = a.vy - b.vy
                    val p = 2f * (nx * kx + ny * ky) / 2f
                    a.vx -= p * nx * 0.45f
                    a.vy -= p * ny * 0.45f
                    b.vx += p * nx * 0.45f
                    b.vy += p * ny * 0.45f
                }
            }
        }
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)

        val w = width.toFloat()
        val h = height.toFloat()
        if (w <= 0 || h <= 0) return

        // Subtle baseline boundary line at floor
        canvas.drawLine(16f, h - 3f, w - 16f, h - 3f, floorLinePaint)

        when (ballStyle) {
            "balls" -> drawBallsStyle(canvas)
            "bubbles" -> drawBubblesStyle(canvas)
            "eyes" -> drawEyesStyle(canvas)
            else -> drawEmojisStyle(canvas)
        }
    }

    private fun drawEmojisStyle(canvas: Canvas) {
        for (item in items) {
            canvas.save()
            canvas.translate(item.x, item.y)
            canvas.rotate(item.rotation)

            emojiPaint.textSize = item.radius * 1.85f
            // Vertical centering adjustment for font metrics
            val textOffset = (emojiPaint.descent() + emojiPaint.ascent()) / 2f
            canvas.drawText(item.currentEmoji, 0f, -textOffset, emojiPaint)

            canvas.restore()
        }
    }

    private fun drawBallsStyle(canvas: Canvas) {
        for (item in items) {
            val r = item.radius
            // 3D Shaded radial sphere
            val shader = RadialGradient(
                item.x - r * 0.35f,
                item.y - r * 0.35f,
                r * 1.2f,
                Color.WHITE,
                item.color,
                Shader.TileMode.CLAMP
            )
            ballPaint.shader = shader
            canvas.drawCircle(item.x, item.y, r, ballPaint)

            // Specular shiny highlight reflection
            canvas.drawCircle(item.x - r * 0.32f, item.y - r * 0.32f, r * 0.28f, highlightPaint)
        }
    }

    private fun drawBubblesStyle(canvas: Canvas) {
        for (item in items) {
            val r = item.radius
            // Bubble fill
            canvas.drawCircle(item.x, item.y, r, bubbleFillPaint)
            // Outer membrane
            canvas.drawCircle(item.x, item.y, r, bubbleStrokePaint)
            // Specular crescent gleam
            canvas.drawCircle(item.x - r * 0.3f, item.y - r * 0.3f, r * 0.22f, highlightPaint)
        }
    }

    private fun drawEyesStyle(canvas: Canvas) {
        ballPaint.shader = null
        for (item in items) {
            val r = item.radius
            // White eyeball sclera
            ballPaint.color = Color.WHITE
            canvas.drawCircle(item.x, item.y, r, ballPaint)

            // Outer ring
            bubbleStrokePaint.color = Color.rgb(203, 213, 225)
            canvas.drawCircle(item.x, item.y, r, bubbleStrokePaint)

            // Pupil offset (looks upward when high velocity)
            val pupilOffset = (-item.vy / 1200f).coerceIn(-0.45f, 0.45f) * r
            val pupilX = item.x
            val pupilY = item.y + pupilOffset

            // Iris / Pupil
            ballPaint.color = Color.rgb(15, 23, 42)
            canvas.drawCircle(pupilX, pupilY, r * 0.42f, ballPaint)

            // Pupil gleam
            canvas.drawCircle(pupilX - r * 0.12f, pupilY - r * 0.12f, r * 0.12f, highlightPaint)
        }
    }

    // ==========================================
    // 📢 React Native Event Dispatchers
    // ==========================================

    private fun emitSoundLevelToJs(level: Float, noiseState: String) {
        val reactContext = context as? ReactContext ?: return
        val event = Arguments.createMap().apply {
            putDouble("level", round(level * 10.0) / 10.0)
            putString("state", noiseState)
            putDouble("rms", round(currentRms * 10.0) / 10.0)
        }
        try {
            reactContext.getJSModule(RCTEventEmitter::class.java).receiveEvent(id, "topSoundLevelChange", event)
        } catch (_: Exception) {}
    }

    private fun emitAlertToJs(alertType: String) {
        val reactContext = context as? ReactContext ?: return
        val event = Arguments.createMap().apply {
            putString("alertType", alertType)
        }
        try {
            reactContext.getJSModule(RCTEventEmitter::class.java).receiveEvent(id, "topAlertTriggered", event)
        } catch (_: Exception) {}
    }

    private fun emitErrorToJs(errorCode: String, message: String) {
        val reactContext = context as? ReactContext ?: return
        val event = Arguments.createMap().apply {
            putString("code", errorCode)
            putString("message", message)
        }
        try {
            reactContext.getJSModule(RCTEventEmitter::class.java).receiveEvent(id, "topError", event)
        } catch (_: Exception) {}
    }

    fun resetSimulation() {
        val w = width.toFloat()
        val h = height.toFloat()
        if (w > 0 && h > 0) {
            initBouncyItems(w, h)
        }
    }
}
