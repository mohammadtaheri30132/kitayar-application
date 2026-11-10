package com.kitayar.modules.noisemeter

import android.graphics.*
import kotlin.math.*
import kotlin.random.Random

/**
 * Represents a single physics-driven bouncing object (ball, emoji, bubble, etc.)
 * Inspired by Bouncy Balls (bouncyballs.org).
 */
class BouncyItem(
    var x: Float,
    var y: Float,
    var radius: Float,
    val color: Int,
    val highlightColor: Int,
    var baseEmoji: String
) {
    var vx: Float = 0f
    var vy: Float = 0f

    var rotation: Float = 0f
    var vRot: Float = 0f

    var idlePhase: Float = Random.nextFloat() * (2.0f * Math.PI.toFloat())
    private val idleSpeed: Float = 1.2f + Random.nextFloat() * 1.5f

    // Dynamic emoji expression based on noise state
    var currentEmoji: String = baseEmoji

    fun update(
        dt: Float,
        gravity: Float,
        width: Float,
        height: Float,
        soundLevel: Float,
        restitution: Float = 0.80f
    ) {
        // 1. Gravity acceleration
        vy += gravity * dt

        // 2. Air resistance (slight damping)
        vx *= (1.0f - 0.05f * dt)

        // 3. Position integration
        x += vx * dt
        y += vy * dt

        // 4. Rotation update
        rotation += vRot * dt
        vRot *= (1.0f - 0.3f * dt)

        // 5. Floor boundary
        val floorY = height - radius - 4f
        if (y >= floorY) {
            y = floorY
            if (abs(vy) > 30f) {
                vy = -vy * restitution
                vx *= 0.92f // Ground friction
                vRot = vx * 0.4f
            } else {
                vy = 0f
                vx *= 0.85f

                // Gentle idle motion when resting in quiet room
                if (soundLevel < 20f) {
                    idlePhase += idleSpeed * dt
                    val gentleOffset = sin(idlePhase) * 2.0f
                    y = floorY + gentleOffset
                }
            }
        }

        // 6. Ceiling boundary
        val ceilY = radius + 4f
        if (y <= ceilY) {
            y = ceilY
            if (vy < 0) {
                vy = abs(vy) * restitution
            }
        }

        // 7. Left wall boundary
        val leftX = radius + 2f
        if (x <= leftX) {
            x = leftX
            vx = abs(vx) * restitution
            vRot = -vy * 0.3f
        }

        // 8. Right wall boundary
        val rightX = width - radius - 2f
        if (x >= rightX) {
            x = rightX
            vx = -abs(vx) * restitution
            vRot = vy * 0.3f
        }
    }

    /**
     * Applies an upward acoustic impulse from sound input
     */
    fun applyAcousticImpulse(force: Float, isSpike: Boolean) {
        if (force <= 0.01f) return

        val rndX = (Random.nextFloat() - 0.5f) * 2.0f
        val rndY = 0.65f + Random.nextFloat() * 0.70f
        val spikeMult = if (isSpike) 1.5f else 1.0f

        // Upward velocity impulse
        val impulseY = -force * rndY * spikeMult
        // Only override or add if pushing upwards
        if (impulseY < vy) {
            vy = impulseY
        } else {
            vy += impulseY * 0.5f
        }

        // Random horizontal spread
        vx += force * rndX * 0.55f * spikeMult

        // Rotation kick
        vRot += rndX * 180f
    }

    /**
     * Updates dynamic emoji expression according to classroom noise state
     */
    fun updateStateEmoji(noiseState: String) {
        currentEmoji = when (noiseState) {
            "excessive" -> {
                when (abs(color) % 6) {
                    0 -> "😱"
                    1 -> "🤯"
                    2 -> "🚨"
                    3 -> "💥"
                    4 -> "🙉"
                    else -> "⚡"
                }
            }
            "moderate" -> {
                when (abs(color) % 6) {
                    0 -> "😮"
                    1 -> "🤨"
                    2 -> "😐"
                    3 -> "👀"
                    4 -> "📢"
                    else -> "😳"
                }
            }
            else -> baseEmoji
        }
    }
}
