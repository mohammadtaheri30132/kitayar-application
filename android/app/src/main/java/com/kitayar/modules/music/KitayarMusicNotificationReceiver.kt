package com.kitayar.modules.music

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class KitayarMusicNotificationReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "MusicNotifReceiver"
    }

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action ?: return
        Log.d(TAG, "Received notification action: $action")

        val module = KitayarMusicPlayerModule.instance
        if (module == null) {
            Log.w(TAG, "KitayarMusicPlayerModule instance is null")
            return
        }

        when (action) {
            KitayarMusicPlaybackService.ACTION_PLAY -> {
                module.resumeFromNotification()
            }
            KitayarMusicPlaybackService.ACTION_PAUSE -> {
                module.pauseFromNotification()
            }
            KitayarMusicPlaybackService.ACTION_NEXT -> {
                module.nextFromNotification()
            }
            KitayarMusicPlaybackService.ACTION_PREV -> {
                module.prevFromNotification()
            }
            KitayarMusicPlaybackService.ACTION_STOP -> {
                module.stopFromNotification()
            }
        }
    }
}
