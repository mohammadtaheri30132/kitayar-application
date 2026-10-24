package com.kitayar.modules.music

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import com.kitayar.MainActivity
import com.kitayar.R
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL
import kotlin.concurrent.thread

class KitayarMusicPlaybackService : Service() {

    companion object {
        private const val TAG = "MusicPlaybackService"
        const val CHANNEL_ID = "kitayar_music_playback_channel"
        const val NOTIFICATION_ID = 2001

        const val ACTION_START_OR_UPDATE = "com.kitayar.music.ACTION_START_OR_UPDATE"
        const val ACTION_STOP = "com.kitayar.music.ACTION_STOP"
        const val ACTION_PLAY = "com.kitayar.music.ACTION_PLAY"
        const val ACTION_PAUSE = "com.kitayar.music.ACTION_PAUSE"
        const val ACTION_NEXT = "com.kitayar.music.ACTION_NEXT"
        const val ACTION_PREV = "com.kitayar.music.ACTION_PREV"

        const val EXTRA_TITLE = "extra_title"
        const val EXTRA_ARTIST = "extra_artist"
        const val EXTRA_IS_PLAYING = "extra_is_playing"
        const val EXTRA_COVER_URL = "extra_cover_url"

        fun startOrUpdateNotification(
            context: Context,
            title: String,
            artist: String,
            isPlaying: Boolean,
            coverUrl: String?
        ) {
            val intent = Intent(context, KitayarMusicPlaybackService::class.java).apply {
                action = ACTION_START_OR_UPDATE
                putExtra(EXTRA_TITLE, title)
                putExtra(EXTRA_ARTIST, artist)
                putExtra(EXTRA_IS_PLAYING, isPlaying)
                putExtra(EXTRA_COVER_URL, coverUrl)
            }
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(intent)
                } else {
                    context.startService(intent)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error starting foreground service: ${e.message}")
            }
        }

        fun stopNotification(context: Context) {
            val intent = Intent(context, KitayarMusicPlaybackService::class.java).apply {
                action = ACTION_STOP
            }
            try {
                context.startService(intent)
            } catch (e: Exception) {
                Log.e(TAG, "Error stopping service: ${e.message}")
            }
        }
    }

    private var currentTitle: String = ""
    private var currentArtist: String = ""
    private var isPlayingState: Boolean = false
    private var currentCoverBitmap: Bitmap? = null
    private var lastCoverUrl: String? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent == null) return START_NOT_STICKY

        when (intent.action) {
            ACTION_START_OR_UPDATE -> {
                val title = intent.getStringExtra(EXTRA_TITLE) ?: "در حال پخش"
                val artist = intent.getStringExtra(EXTRA_ARTIST) ?: ""
                val isPlaying = intent.getBooleanExtra(EXTRA_IS_PLAYING, false)
                val coverUrl = intent.getStringExtra(EXTRA_COVER_URL)

                currentTitle = title
                currentArtist = artist
                isPlayingState = isPlaying

                val initialNotification = buildNotification(title, artist, isPlaying, currentCoverBitmap)
                try {
                    startForeground(NOTIFICATION_ID, initialNotification)
                } catch (e: Exception) {
                    Log.e(TAG, "Failed startForeground: ${e.message}")
                }

                if (!coverUrl.isNullOrBlank() && coverUrl != lastCoverUrl) {
                    lastCoverUrl = coverUrl
                    loadCoverBitmapAsync(coverUrl)
                }
            }
            ACTION_STOP -> {
                try {
                    stopForeground(true)
                    stopSelf()
                } catch (e: Exception) {
                    Log.e(TAG, "Failed stopForeground: ${e.message}")
                }
            }
        }

        return START_NOT_STICKY
    }

    private fun loadCoverBitmapAsync(urlStr: String) {
        thread {
            try {
                val url = URL(urlStr)
                val connection = url.openConnection() as HttpURLConnection
                connection.doInput = true
                connection.connectTimeout = 5000
                connection.readTimeout = 5000
                connection.connect()
                val input: InputStream = connection.inputStream
                val bitmap = BitmapFactory.decodeStream(input)
                input.close()
                currentCoverBitmap = bitmap

                val notification = buildNotification(
                    currentTitle,
                    currentArtist,
                    isPlayingState,
                    bitmap
                )
                val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                manager.notify(NOTIFICATION_ID, notification)
            } catch (e: Exception) {
                Log.w(TAG, "Failed to load album art for notification: ${e.message}")
            }
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val name = "پخش‌کننده صوتی کیتایار"
            val descriptionText = "اعلان کنترل پخش موسیقی و نواهای کیتایار"
            val importance = NotificationManager.IMPORTANCE_LOW
            val channel = NotificationChannel(CHANNEL_ID, name, importance).apply {
                description = descriptionText
                setShowBadge(false)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            }
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(
        title: String,
        artist: String,
        isPlaying: Boolean,
        coverBitmap: Bitmap?
    ): Notification {
        val openAppIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val openAppPendingIntent = PendingIntent.getActivity(
            this,
            0,
            openAppIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
        )

        val prevPending = createActionPendingIntent(ACTION_PREV, 1)
        val playPausePending = createActionPendingIntent(if (isPlaying) ACTION_PAUSE else ACTION_PLAY, 2)
        val nextPending = createActionPendingIntent(ACTION_NEXT, 3)
        val closePending = createActionPendingIntent(ACTION_STOP, 4)

        val playPauseIcon = if (isPlaying) android.R.drawable.ic_media_pause else android.R.drawable.ic_media_play
        val playPauseLabel = if (isPlaying) "توقف" else "پخش"

        val builder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(if (title.isNotBlank()) title else "کیتایار")
            .setContentText(if (artist.isNotBlank()) artist else "در حال پخش نوا...")
            .setContentIntent(openAppPendingIntent)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(isPlaying)
            .setOnlyAlertOnce(true)
            .addAction(android.R.drawable.ic_media_previous, "قبلی", prevPending)
            .addAction(playPauseIcon, playPauseLabel, playPausePending)
            .addAction(android.R.drawable.ic_media_next, "بعدی", nextPending)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "بستن", closePending)

        if (coverBitmap != null) {
            builder.setLargeIcon(coverBitmap)
        }

        return builder.build()
    }

    private fun createActionPendingIntent(action: String, requestCode: Int): PendingIntent {
        val intent = Intent(this, KitayarMusicNotificationReceiver::class.java).apply {
            this.action = action
        }
        val flags = PendingIntent.FLAG_UPDATE_CURRENT or
                (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
        return PendingIntent.getBroadcast(this, requestCode, intent, flags)
    }

    override fun onDestroy() {
        super.onDestroy()
        currentCoverBitmap = null
    }
}
