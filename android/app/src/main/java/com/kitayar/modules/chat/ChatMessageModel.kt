package com.kitayar.modules.chat

data class ChatMessageModel(
    val id: String,
    val senderId: String,
    val senderName: String,
    val content: String,
    val type: String, // "text", "voice", "image", "file"
    val mediaUrl: String,
    val mediaDuration: Int,
    val status: String, // "sent", "delivered", "read"
    val createdAt: String,
    val isMe: Boolean
)
