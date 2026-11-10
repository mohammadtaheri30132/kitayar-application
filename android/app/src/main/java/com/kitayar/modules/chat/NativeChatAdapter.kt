package com.kitayar.modules.chat

import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.*
import androidx.recyclerview.widget.RecyclerView
import com.kitayar.modules.questions.ImageCacheHelper

class NativeChatAdapter(
    private val context: Context,
    private val onImageClick: ((String) -> Unit)? = null
) : RecyclerView.Adapter<NativeChatAdapter.MessageViewHolder>() {

    private val messages = ArrayList<ChatMessageModel>()

    private val fontRegular: Typeface by lazy {
        try {
            Typeface.createFromAsset(context.assets, "fonts/Estedad-FD-Regular.ttf")
        } catch (e: Exception) {
            Typeface.DEFAULT
        }
    }

    private val fontBold: Typeface by lazy {
        try {
            Typeface.createFromAsset(context.assets, "fonts/Estedad-FD-Bold.ttf")
        } catch (e: Exception) {
            Typeface.DEFAULT_BOLD
        }
    }

    companion object {
        const val VIEW_TYPE_ME = 1
        const val VIEW_TYPE_OTHER = 2
    }

    fun setMessages(newMessages: List<ChatMessageModel>) {
        messages.clear()
        messages.addAll(newMessages)
        notifyDataSetChanged()
    }

    override fun getItemCount(): Int = messages.size

    override fun getItemViewType(position: Int): Int {
        return if (messages[position].isMe) VIEW_TYPE_ME else VIEW_TYPE_OTHER
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): MessageViewHolder {
        val isMe = viewType == VIEW_TYPE_ME
        val rowLayout = LinearLayout(context).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            )
            orientation = LinearLayout.VERTICAL
            gravity = if (isMe) Gravity.END else Gravity.START
            setPadding(dp(12), dp(4), dp(12), dp(4))
            layoutDirection = View.LAYOUT_DIRECTION_RTL
        }

        // Bubble container
        val bubbleLayout = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            val bubbleBg = GradientDrawable().apply {
                cornerRadius = dp(16).toFloat()
                if (isMe) {
                    setColor(Color.parseColor("#2563EB")) // Primary Blue
                    cornerRadii = floatArrayOf(
                        dp(16).toFloat(), dp(16).toFloat(),
                        dp(4).toFloat(), dp(4).toFloat(),
                        dp(16).toFloat(), dp(16).toFloat(),
                        dp(16).toFloat(), dp(16).toFloat()
                    )
                } else {
                    setColor(Color.parseColor("#F1F5F9")) // Slate 100
                    setStroke(dp(1), Color.parseColor("#E2E8F0"))
                    cornerRadii = floatArrayOf(
                        dp(4).toFloat(), dp(4).toFloat(),
                        dp(16).toFloat(), dp(16).toFloat(),
                        dp(16).toFloat(), dp(16).toFloat(),
                        dp(16).toFloat(), dp(16).toFloat()
                    )
                }
            }
            background = bubbleBg
            setPadding(dp(12), dp(10), dp(12), dp(8))
            val lp = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                // Max width approx 78% of parent
                val maxWidthPx = (context.resources.displayMetrics.widthPixels * 0.78).toInt()
                width = LinearLayout.LayoutParams.WRAP_CONTENT
            }
            layoutParams = lp
        }

        // Sender name (for group/other)
        val senderTextView = TextView(context).apply {
            typeface = fontBold
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f)
            setTextColor(Color.parseColor("#64748B"))
            visibility = View.GONE
            setPadding(0, 0, 0, dp(4))
        }
        bubbleLayout.addView(senderTextView)

        // Text content
        val contentTextView = TextView(context).apply {
            typeface = fontRegular
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 14f)
            setTextColor(if (isMe) Color.WHITE else Color.parseColor("#1E293B"))
            setLineSpacing(dp(3).toFloat(), 1f)
            layoutDirection = View.LAYOUT_DIRECTION_RTL
        }
        bubbleLayout.addView(contentTextView)

        // Image view for image messages
        val messageImageView = ImageView(context).apply {
            layoutParams = LinearLayout.LayoutParams(dp(220), dp(160)).apply {
                setMargins(0, dp(4), 0, dp(4))
            }
            scaleType = ImageView.ScaleType.CENTER_CROP
            visibility = View.GONE
        }
        bubbleLayout.addView(messageImageView)

        // Voice playback row
        val voiceRowLayout = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            visibility = View.GONE
            setPadding(0, dp(4), 0, dp(4))
        }

        val playBtn = TextView(context).apply {
            typeface = fontBold
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 14f)
            setTextColor(if (isMe) Color.WHITE else Color.parseColor("#2563EB"))
            text = "▶ پخش"
            setPadding(dp(6), dp(4), dp(6), dp(4))
        }
        voiceRowLayout.addView(playBtn)

        val voiceDurationText = TextView(context).apply {
            typeface = fontRegular
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 11f)
            setTextColor(if (isMe) Color.parseColor("#E0E7FF") else Color.parseColor("#64748B"))
            setPadding(dp(8), 0, dp(8), 0)
        }
        voiceRowLayout.addView(voiceDurationText)

        bubbleLayout.addView(voiceRowLayout)

        // Metadata row (Time and check status)
        val metaRowLayout = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.END or Gravity.CENTER_VERTICAL
            setPadding(0, dp(4), 0, 0)
        }

        val timeTextView = TextView(context).apply {
            typeface = fontRegular
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 10f)
            setTextColor(if (isMe) Color.parseColor("#CBD5E1") else Color.parseColor("#94A3B8"))
        }
        metaRowLayout.addView(timeTextView)

        val statusTextView = TextView(context).apply {
            typeface = fontRegular
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 10f)
            setTextColor(if (isMe) Color.parseColor("#93C5FD") else Color.parseColor("#94A3B8"))
            setPadding(dp(4), 0, 0, 0)
        }
        if (isMe) {
            metaRowLayout.addView(statusTextView)
        }

        bubbleLayout.addView(metaRowLayout)
        rowLayout.addView(bubbleLayout)

        return MessageViewHolder(
            rowLayout,
            senderTextView,
            contentTextView,
            messageImageView,
            voiceRowLayout,
            playBtn,
            voiceDurationText,
            timeTextView,
            statusTextView
        )
    }

    override fun onBindViewHolder(holder: MessageViewHolder, position: Int) {
        val msg = messages[position]

        // Sender name
        if (!msg.isMe && msg.senderName.isNotEmpty()) {
            holder.senderTextView.text = msg.senderName
            holder.senderTextView.visibility = View.VISIBLE
        } else {
            holder.senderTextView.visibility = View.GONE
        }

        // Time
        holder.timeTextView.text = formatTimestamp(msg.createdAt)

        // Status tick
        if (msg.isMe) {
            holder.statusTextView.text = when (msg.status) {
                "read" -> "✓✓"
                "delivered" -> "✓✓"
                else -> "✓"
            }
        }

        // Content types
        when (msg.type) {
            "image" -> {
                holder.contentTextView.visibility = if (msg.content.isNotEmpty()) View.VISIBLE else View.GONE
                holder.contentTextView.text = msg.content
                holder.voiceRow.visibility = View.GONE
                holder.imageView.visibility = View.VISIBLE

                ImageCacheHelper.loadImage(msg.mediaUrl, holder.imageView)
                holder.imageView.setOnClickListener {
                    onImageClick?.invoke(msg.mediaUrl)
                }
            }
            "voice" -> {
                holder.contentTextView.visibility = View.GONE
                holder.imageView.visibility = View.GONE
                holder.voiceRow.visibility = View.VISIBLE

                val duration = if (msg.mediaDuration > 0) "${msg.mediaDuration}s" else "🎙 پیام صوتی"
                holder.voiceDurationText.text = duration

                val isPlaying = ChatAudioPlayerHelper.isPlaying(msg.mediaUrl)
                holder.playBtn.text = if (isPlaying) "⏸ توقف" else "▶ پخش"

                holder.playBtn.setOnClickListener {
                    if (ChatAudioPlayerHelper.isPlaying(msg.mediaUrl)) {
                        ChatAudioPlayerHelper.pause()
                        holder.playBtn.text = "▶ پخش"
                    } else {
                        holder.playBtn.text = "⏸ توقف"
                        ChatAudioPlayerHelper.play(
                            msg.mediaUrl,
                            onProgress = { current, total ->
                                val sec = current / 1000
                                holder.voiceDurationText.text = "${sec}s / ${total / 1000}s"
                            },
                            onComplete = {
                                holder.playBtn.text = "▶ پخش"
                                holder.voiceDurationText.text = duration
                            }
                        )
                    }
                }
            }
            else -> {
                // Text
                holder.contentTextView.visibility = View.VISIBLE
                holder.contentTextView.text = msg.content
                holder.imageView.visibility = View.GONE
                holder.voiceRow.visibility = View.GONE
            }
        }
    }

    private fun formatTimestamp(isoStr: String): String {
        return try {
            if (isoStr.contains("T")) {
                val timePart = isoStr.split("T")[1].substring(0, 5)
                timePart
            } else {
                isoStr
            }
        } catch (e: Exception) {
            isoStr
        }
    }

    private fun dp(dpValue: Int): Int {
        return (dpValue * context.resources.displayMetrics.density).toInt()
    }

    class MessageViewHolder(
        itemView: View,
        val senderTextView: TextView,
        val contentTextView: TextView,
        val imageView: ImageView,
        val voiceRow: LinearLayout,
        val playBtn: TextView,
        val voiceDurationText: TextView,
        val timeTextView: TextView,
        val statusTextView: TextView
    ) : RecyclerView.ViewHolder(itemView)
}
