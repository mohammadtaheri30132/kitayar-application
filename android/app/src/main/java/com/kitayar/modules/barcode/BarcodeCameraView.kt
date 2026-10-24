package com.kitayar.modules.barcode

import android.annotation.SuppressLint
import android.content.Context
import android.content.ContextWrapper
import android.util.Log
import android.widget.FrameLayout
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.events.RCTEventEmitter
import com.google.mlkit.vision.barcode.BarcodeScanner
import com.google.mlkit.vision.barcode.BarcodeScannerOptions
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

@SuppressLint("ViewConstructor")
class BarcodeCameraView(context: Context) : FrameLayout(context) {

    private val previewView: PreviewView = PreviewView(context).apply {
        scaleType = PreviewView.ScaleType.FILL_CENTER
        implementationMode = PreviewView.ImplementationMode.COMPATIBLE
        layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
    }

    private var cameraProvider: ProcessCameraProvider? = null
    private var camera: androidx.camera.core.Camera? = null
    private var imageAnalysis: ImageAnalysis? = null
    private var cameraExecutor: ExecutorService = Executors.newSingleThreadExecutor()
    private val barcodeScanner: BarcodeScanner

    private var flashEnabled: Boolean = false
    private var lensFacing: Int = CameraSelector.LENS_FACING_BACK
    private var isScanningActive: Boolean = true

    private var lastScannedValue: String? = null
    private var lastScannedTimestamp: Long = 0L
    private val scanThrottleMs = 1200L

    init {
        addView(previewView)

        val options = BarcodeScannerOptions.Builder()
            .setBarcodeFormats(Barcode.FORMAT_ALL_FORMATS)
            .build()
        barcodeScanner = BarcodeScanning.getClient(options)
    }

    private val measureAndLayoutRunnable = Runnable {
        measure(
            MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
            MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY)
        )
        layout(left, top, right, bottom)
    }

    override fun requestLayout() {
        super.requestLayout()
        post(measureAndLayoutRunnable)
    }

    fun setFlashEnabled(enabled: Boolean) {
        if (flashEnabled != enabled) {
            flashEnabled = enabled
            applyTorchState()
        }
    }

    fun setLensFacing(facing: String) {
        val targetFacing = if (facing.equals("front", ignoreCase = true)) {
            CameraSelector.LENS_FACING_FRONT
        } else {
            CameraSelector.LENS_FACING_BACK
        }
        if (lensFacing != targetFacing) {
            lensFacing = targetFacing
            startCamera()
        }
    }

    fun setScanningActive(active: Boolean) {
        isScanningActive = active
        if (active) {
            lastScannedValue = null
        }
    }

    private fun applyTorchState() {
        try {
            camera?.cameraControl?.enableTorch(flashEnabled)
        } catch (e: Exception) {
            Log.w("BarcodeCameraView", "Failed to set torch: ${e.message}")
        }
    }

    private fun getLifecycleOwner(): LifecycleOwner? {
        var ctx = context
        while (ctx is ContextWrapper) {
            if (ctx is LifecycleOwner) {
                return ctx
            }
            ctx = ctx.baseContext
        }
        return null
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        startCamera()
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        stopCamera()
    }

    private fun startCamera() {
        val lifecycleOwner = getLifecycleOwner() ?: return

        val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
        cameraProviderFuture.addListener({
            try {
                cameraProvider = cameraProviderFuture.get()
                bindCameraUseCases(lifecycleOwner)
            } catch (e: Exception) {
                Log.e("BarcodeCameraView", "Error starting camera: ${e.message}", e)
            }
        }, ContextCompat.getMainExecutor(context))
    }

    private fun bindCameraUseCases(lifecycleOwner: LifecycleOwner) {
        val provider = cameraProvider ?: return
        provider.unbindAll()

        val cameraSelector = CameraSelector.Builder()
            .requireLensFacing(lensFacing)
            .build()

        val preview = Preview.Builder()
            .build()
            .also {
                it.setSurfaceProvider(previewView.surfaceProvider)
            }

        imageAnalysis = ImageAnalysis.Builder()
            .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
            .build()
            .also { analysis ->
                analysis.setAnalyzer(cameraExecutor) { imageProxy ->
                    processImageProxy(imageProxy)
                }
            }

        try {
            camera = provider.bindToLifecycle(
                lifecycleOwner,
                cameraSelector,
                preview,
                imageAnalysis
            )
            applyTorchState()
        } catch (e: Exception) {
            Log.e("BarcodeCameraView", "Use case binding failed", e)
        }
    }

    @androidx.annotation.OptIn(androidx.camera.core.ExperimentalGetImage::class)
    private fun processImageProxy(imageProxy: ImageProxy) {
        if (!isScanningActive) {
            imageProxy.close()
            return
        }

        val mediaImage = imageProxy.image
        if (mediaImage == null) {
            imageProxy.close()
            return
        }

        val image = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)

        barcodeScanner.process(image)
            .addOnSuccessListener { barcodes ->
                if (barcodes.isNotEmpty() && isScanningActive) {
                    val barcode = barcodes[0]
                    val rawValue = barcode.rawValue ?: barcode.displayValue

                    val currentTime = System.currentTimeMillis()
                    if (rawValue != null && (rawValue != lastScannedValue || currentTime - lastScannedTimestamp > scanThrottleMs)) {
                        lastScannedValue = rawValue
                        lastScannedTimestamp = currentTime
                        emitBarcodeDetected(barcode)
                    }
                }
            }
            .addOnFailureListener { e ->
                Log.w("BarcodeCameraView", "Barcode analysis failure: ${e.message}")
            }
            .addOnCompleteListener {
                imageProxy.close()
            }
    }

    private fun emitBarcodeDetected(barcode: Barcode) {
        val reactContext = context as? ReactContext ?: return
        val event = Arguments.createMap().apply {
            putString("value", barcode.rawValue ?: barcode.displayValue ?: "")
            putString("displayValue", barcode.displayValue ?: "")
            putString("format", getFormatName(barcode.format))
            putString("type", getTypeName(barcode.valueType))

            // Extra type-specific metadata
            when (barcode.valueType) {
                Barcode.TYPE_URL -> {
                    val urlMap = Arguments.createMap().apply {
                        putString("url", barcode.url?.url ?: "")
                        putString("title", barcode.url?.title ?: "")
                    }
                    putMap("url", urlMap)
                }
                Barcode.TYPE_WIFI -> {
                    val wifiMap = Arguments.createMap().apply {
                        putString("ssid", barcode.wifi?.ssid ?: "")
                        putString("password", barcode.wifi?.password ?: "")
                        putInt("encryptionType", barcode.wifi?.encryptionType ?: 0)
                    }
                    putMap("wifi", wifiMap)
                }
                Barcode.TYPE_PHONE -> {
                    putMap("phone", Arguments.createMap().apply {
                        putString("number", barcode.phone?.number ?: "")
                    })
                }
                Barcode.TYPE_SMS -> {
                    putMap("sms", Arguments.createMap().apply {
                        putString("phoneNumber", barcode.sms?.phoneNumber ?: "")
                        putString("message", barcode.sms?.message ?: "")
                    })
                }
                Barcode.TYPE_CONTACT_INFO -> {
                    val contact = barcode.contactInfo
                    val contactMap = Arguments.createMap().apply {
                        putString("name", contact?.name?.formattedName ?: "")
                        putString("organization", contact?.organization ?: "")
                        putString("title", contact?.title ?: "")
                        if (!contact?.phones.isNullOrEmpty()) {
                            putString("phone", contact?.phones?.get(0)?.number ?: "")
                        }
                        if (!contact?.emails.isNullOrEmpty()) {
                            putString("email", contact?.emails?.get(0)?.address ?: "")
                        }
                    }
                    putMap("contact", contactMap)
                }
            }
        }

        @Suppress("DEPRECATION")
        reactContext.getJSModule(RCTEventEmitter::class.java).receiveEvent(
            id,
            "onBarcodeDetected",
            event
        )
    }

    private fun getFormatName(format: Int): String {
        return when (format) {
            Barcode.FORMAT_QR_CODE -> "QR_CODE"
            Barcode.FORMAT_CODE_128 -> "CODE_128"
            Barcode.FORMAT_CODE_39 -> "CODE_39"
            Barcode.FORMAT_CODE_93 -> "CODE_93"
            Barcode.FORMAT_CODABAR -> "CODABAR"
            Barcode.FORMAT_DATA_MATRIX -> "DATA_MATRIX"
            Barcode.FORMAT_EAN_13 -> "EAN_13"
            Barcode.FORMAT_EAN_8 -> "EAN_8"
            Barcode.FORMAT_ITF -> "ITF"
            Barcode.FORMAT_UPC_A -> "UPC_A"
            Barcode.FORMAT_UPC_E -> "UPC_E"
            Barcode.FORMAT_PDF417 -> "PDF417"
            Barcode.FORMAT_AZTEC -> "AZTEC"
            else -> "UNKNOWN"
        }
    }

    private fun getTypeName(type: Int): String {
        return when (type) {
            Barcode.TYPE_URL -> "URL"
            Barcode.TYPE_TEXT -> "TEXT"
            Barcode.TYPE_WIFI -> "WIFI"
            Barcode.TYPE_PHONE -> "PHONE"
            Barcode.TYPE_SMS -> "SMS"
            Barcode.TYPE_EMAIL -> "EMAIL"
            Barcode.TYPE_GEO -> "GEO"
            Barcode.TYPE_CONTACT_INFO -> "CONTACT"
            Barcode.TYPE_PRODUCT -> "PRODUCT"
            Barcode.TYPE_ISBN -> "ISBN"
            else -> "TEXT"
        }
    }

    fun stopCamera() {
        try {
            cameraProvider?.unbindAll()
            camera = null
        } catch (e: Exception) {
            Log.e("BarcodeCameraView", "Error stopping camera: ${e.message}")
        }
    }

    fun release() {
        stopCamera()
        barcodeScanner.close()
        cameraExecutor.shutdown()
    }
}
