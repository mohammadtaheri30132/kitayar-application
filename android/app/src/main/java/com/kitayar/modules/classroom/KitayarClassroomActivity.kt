package com.kitayar.modules.classroom

import android.Manifest
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.media.AudioManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.webkit.*
import android.widget.*
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

/**
 * High-performance Native Android Classroom Activity in Kotlin
 * Provides hardware-accelerated WebRTC, native microphone/camera permissions,
 * continuous screen-on state, and native file choosing (PDF, images, documents).
 */
class KitayarClassroomActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var progressBar: ProgressBar
    private var fileUploadCallback: ValueCallback<Array<Uri>>? = null
    private var audioManager: AudioManager? = null

    private var roomUrl: String = ""
    private var classTitle: String = "کلاس آنلاین کیتایار"
    private var isTeacher: Boolean = false
    private var sessionId: String = ""

    companion object {
        const val EXTRA_ROOM_URL = "EXTRA_ROOM_URL"
        const val EXTRA_TITLE = "EXTRA_TITLE"
        const val EXTRA_IS_TEACHER = "EXTRA_IS_TEACHER"
        const val EXTRA_SESSION_ID = "EXTRA_SESSION_ID"

        private const val PERMISSION_REQUEST_CODE = 8821
        private const val FILE_CHOOSER_REQUEST_CODE = 8822
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // 1. Keep display on continuously during online class
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        // 2. Extract Intent parameters
        roomUrl = intent.getStringExtra(EXTRA_ROOM_URL) ?: ""
        classTitle = intent.getStringExtra(EXTRA_TITLE) ?: "کلاس آنلاین کیتایار"
        isTeacher = intent.getBooleanExtra(EXTRA_IS_TEACHER, false)
        sessionId = intent.getStringExtra(EXTRA_SESSION_ID) ?: ""

        // 3. Configure Audio Manager for communication
        setupAudioManager()

        // 4. Request Native Camera & Mic Permissions
        checkAndRequestNativePermissions()

        // 5. Build Native UI Layout Programmatically
        val rootLayout = createRootView()
        setContentView(rootLayout)

        // 6. Setup and load hardware-accelerated WebView
        setupClassroomWebView()

        if (roomUrl.isNotEmpty()) {
            webView.loadUrl(roomUrl)
        } else {
            Toast.makeText(this, "آدرس کلاس نامعتبر است", Toast.LENGTH_LONG).show()
            finish()
        }
    }

    private fun setupAudioManager() {
        try {
            audioManager = getSystemService(Context.AUDIO_SERVICE) as? AudioManager
            audioManager?.mode = AudioManager.MODE_IN_COMMUNICATION
            audioManager?.isSpeakerphoneOn = true
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun checkAndRequestNativePermissions() {
        val permissionsToRequest = mutableListOf<String>()

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            permissionsToRequest.add(Manifest.permission.RECORD_AUDIO)
        }
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            permissionsToRequest.add(Manifest.permission.CAMERA)
        }
        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.S_V2) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                permissionsToRequest.add(Manifest.permission.READ_EXTERNAL_STORAGE)
            }
        }

        if (permissionsToRequest.isNotEmpty()) {
            ActivityCompat.requestPermissions(
                this,
                permissionsToRequest.toTypedArray(),
                PERMISSION_REQUEST_CODE
            )
        }
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == PERMISSION_REQUEST_CODE) {
            var allGranted = true
            for (res in grantResults) {
                if (res != PackageManager.PERMISSION_GRANTED) {
                    allGranted = false
                    break
                }
            }
            if (!allGranted) {
                Toast.makeText(
                    this,
                    "جهت برقراری صدای شفاف، لطفاً دسترسی میکروفون را تایید فرمایید",
                    Toast.LENGTH_LONG
                ).show()
            }
        }
    }

    private fun createRootView(): View {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(Color.parseColor("#070B14"))
        }

        // Header Bar
        val header = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                dpToPx(56)
            )
            setBackgroundColor(Color.parseColor("#0B1122"))
            gravity = Gravity.CENTER_VERTICAL
            setPadding(dpToPx(12), 0, dpToPx(12), 0)
        }

        // Exit / Close button
        val exitBtn = TextView(this).apply {
            text = "✕ خروج"
            setTextColor(Color.parseColor("#ef4444"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f)
            typeface = Typeface.DEFAULT_BOLD
            setPadding(dpToPx(10), dpToPx(6), dpToPx(10), dpToPx(6))
            background = GradientDrawable().apply {
                setColor(Color.parseColor("#2a1215"))
                cornerRadius = dpToPx(8).toFloat()
                setStroke(dpToPx(1), Color.parseColor("#ef4444").apply { })
            }
            setOnClickListener {
                confirmExit()
            }
        }

        // Title and Topic Layout
        val titleLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f).apply {
                marginStart = dpToPx(12)
                marginEnd = dpToPx(12)
            }
        }

        val titleTv = TextView(this).apply {
            text = classTitle
            setTextColor(Color.WHITE)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 14f)
            typeface = Typeface.DEFAULT_BOLD
            maxLines = 1
        }

        val roleBadge = TextView(this).apply {
            text = if (isTeacher) "استاد و مدیر کلاس" else "دانش‌آموز"
            setTextColor(if (isTeacher) Color.parseColor("#f59e0b") else Color.parseColor("#38bdf8"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 10f)
        }

        titleLayout.addView(titleTv)
        titleLayout.addView(roleBadge)

        // Reload / Refresh Button
        val refreshBtn = TextView(this).apply {
            text = "🔄"
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 16f)
            setPadding(dpToPx(8), dpToPx(6), dpToPx(8), dpToPx(6))
            setOnClickListener {
                webView.reload()
            }
        }

        // Brand Icon
        val brandIcon = TextView(this).apply {
            text = "KY"
            setTextColor(Color.WHITE)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f)
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(dpToPx(32), dpToPx(32))
            background = GradientDrawable().apply {
                setColor(Color.parseColor("#4f46e5"))
                cornerRadius = dpToPx(8).toFloat()
            }
        }

        header.addView(brandIcon)
        header.addView(titleLayout)
        header.addView(refreshBtn)
        header.addView(exitBtn)

        root.addView(header)

        // Web Stage Container
        val stageContainer = FrameLayout(this).apply {
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                0,
                1f
            )
        }

        webView = WebView(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(Color.parseColor("#070B14"))
        }

        progressBar = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                dpToPx(4)
            ).apply {
                gravity = Gravity.TOP
            }
            isIndeterminate = true
            visibility = View.VISIBLE
        }

        stageContainer.addView(webView)
        stageContainer.addView(progressBar)

        root.addView(stageContainer)

        return root
    }

    private fun setupClassroomWebView() {
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null)

        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.mediaPlaybackRequiresUserGesture = false
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        settings.cacheMode = WebSettings.LOAD_DEFAULT
        settings.loadWithOverviewMode = true
        settings.useWideViewPort = true

        // Clean modern Chromium mobile agent
        settings.userAgentString = settings.userAgentString + " KitayarNativeApp/2.0"

        webView.webChromeClient = object : WebChromeClient() {
            // Natively grant WebRTC camera and mic resources
            override fun onPermissionRequest(request: PermissionRequest?) {
                runOnUiThread {
                    if (request != null) {
                        request.grant(request.resources)
                    }
                }
            }

            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                if (newProgress >= 90) {
                    progressBar.visibility = View.GONE
                } else {
                    progressBar.visibility = View.VISIBLE
                }
            }

            // Native File Chooser (PDF, Images, Presentations, Documents)
            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                fileUploadCallback?.onReceiveValue(null)
                fileUploadCallback = filePathCallback

                val intent = Intent(Intent.ACTION_GET_CONTENT).apply {
                    addCategory(Intent.CATEGORY_OPENABLE)
                    type = "*/*"
                    putExtra(
                        Intent.EXTRA_MIME_TYPES,
                        arrayOf(
                            "application/pdf",
                            "image/*",
                            "video/*",
                            "application/msword",
                            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                            "application/vnd.ms-powerpoint",
                            "application/vnd.openxmlformats-officedocument.presentationml.presentation"
                        )
                    )
                }

                return try {
                    startActivityForResult(
                        Intent.createChooser(intent, "انتخاب فایل برای کلاس آنلاین (PDF یا تصویر)"),
                        FILE_CHOOSER_REQUEST_CODE
                    )
                    true
                } catch (e: Exception) {
                    fileUploadCallback?.onReceiveValue(null)
                    fileUploadCallback = null
                    false
                }
            }
        }

        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                progressBar.visibility = View.GONE
            }

            override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
                super.onReceivedError(view, request, error)
            }
        }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == FILE_CHOOSER_REQUEST_CODE) {
            val result = if (data == null || resultCode != Activity.RESULT_OK) {
                null
            } else {
                val dataUri = data.data
                if (dataUri != null) arrayOf(dataUri) else null
            }
            fileUploadCallback?.onReceiveValue(result)
            fileUploadCallback = null
        }
    }

    private fun confirmExit() {
        AlertDialog.Builder(this)
            .setTitle("خروج از کلاس آنلاین")
            .setMessage("آیا از خروج از محیط کلاس آنلاین کیتایار اطمینان دارید؟")
            .setPositiveButton("بله، خروج") { _, _ ->
                finish()
            }
            .setNegativeButton("انصراف", null)
            .show()
    }

    override fun onBackPressed() {
        confirmExit()
    }

    override fun onDestroy() {
        try {
            audioManager?.mode = AudioManager.MODE_NORMAL
            audioManager?.isSpeakerphoneOn = false
            webView.stopLoading()
            webView.clearHistory()
            webView.destroy()
        } catch (e: Exception) {
            e.printStackTrace()
        }
        super.onDestroy()
    }

    private fun dpToPx(dp: Int): Int {
        return TypedValue.applyDimension(
            TypedValue.COMPLEX_UNIT_DIP,
            dp.toFloat(),
            resources.displayMetrics
        ).toInt()
    }
}

