package com.kitayar

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.bridge.Arguments
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.facebook.react.modules.core.DeviceEventManagerModule

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "kitayar"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    handleIncomingIntent(intent)
  }

  // وقتی اپ از قبل باز است و کاربر دوباره روی "Open With" روی یک PDF می‌زند
  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    handleIncomingIntent(intent)
  }

  private fun handleIncomingIntent(intent: Intent?) {
    val uri: Uri? = when (intent?.action) {
      Intent.ACTION_VIEW -> intent.data
      Intent.ACTION_SEND -> {
        @Suppress("DEPRECATION")
        intent.getParcelableExtra(Intent.EXTRA_STREAM)
      }
      else -> null
    }

    if (uri != null) {
      val uriString = uri.toString()
      // برای cold start: JS هنوز mount نشده، پس در متغیر static نگه می‌داریم
      // و بعداً از طریق متد getInitialPdfUri در PdfCoreModule خوانده می‌شود.
      pendingUri = uriString

      // برای warm start (اپ از قبل باز است)، مستقیم event می‌فرستیم
      reactInstanceManager?.currentReactContext
          ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
          ?.emit("onOpenPdfIntent", Arguments.createMap().apply {
            putString("uri", uriString)
          })
    }
  }

  companion object {
    @JvmStatic
    var pendingUri: String? = null
  }
}