package com.kitayar.modules.scanner

import android.annotation.SuppressLint
import android.content.Context
import android.content.ContextWrapper
import android.graphics.*
import android.util.Log
import android.view.MotionEvent
import android.widget.FrameLayout
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.events.RCTEventEmitter
import org.opencv.core.Mat
import org.opencv.core.MatOfPoint
import org.opencv.core.MatOfPoint2f
import org.opencv.core.Size
import org.opencv.imgproc.Imgproc
import java.io.File
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

@SuppressLint("ViewConstructor")
class DocumentCameraView(context: Context) : FrameLayout(context) {

    private val previewView: PreviewView = PreviewView(context).apply {
        scaleType = PreviewView.ScaleType.FILL_CENTER
        // Use COMPATIBLE (TextureView) for seamless composition inside React Native views
        implementationMode = PreviewView.ImplementationMode.COMPATIBLE
        layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
    }

    private var cameraProvider: ProcessCameraProvider? = null
    private var camera: androidx.camera.core.Camera? = null
    private var imageCapture: ImageCapture? = null
    private var imageAnalysis: ImageAnalysis? = null
    private var cameraExecutor: ExecutorService = Executors.newSingleThreadExecutor()

    private var flashMode: Int = ImageCapture.FLASH_MODE_OFF
    private var lensFacing: Int = CameraSelector.LENS_FACING_BACK

    private var lastAnalysisTimestamp = 0L
    private val analysisThrottleMs = 300L
    private var isCameraStarted = false

    init {
        addView(previewView)
        setupTapToFocus()
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

    override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
        super.onLayout(changed, left, top, right, bottom)
        val w = right - left
        val h = bottom - top
        previewView.measure(
            MeasureSpec.makeMeasureSpec(w, MeasureSpec.EXACTLY),
            MeasureSpec.makeMeasureSpec(h, MeasureSpec.EXACTLY)
        )
        previewView.layout(0, 0, w, h)
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        post {
            startCamera()
        }
    }

    private fun findLifecycleOwner(): LifecycleOwner? {
        var ctx = context
        while (ctx is ContextWrapper) {
            if (ctx is LifecycleOwner) return ctx
            if (ctx is ReactContext) {
                val act = ctx.currentActivity
                if (act is LifecycleOwner) return act
            }
            ctx = ctx.baseContext
        }
        if (ctx is LifecycleOwner) return ctx
        val act = (context as? ReactContext)?.currentActivity
        if (act is LifecycleOwner) return act
        return null
    }

    fun setFlash(mode: String) {
        flashMode = when (mode.uppercase()) {
            "ON" -> ImageCapture.FLASH_MODE_ON
            "AUTO" -> ImageCapture.FLASH_MODE_AUTO
            else -> ImageCapture.FLASH_MODE_OFF
        }
        imageCapture?.flashMode = flashMode

        try {
            camera?.cameraControl?.enableTorch(mode.uppercase() == "ON")
        } catch (_: Exception) {}
    }

    fun setCameraType(type: String) {
        val newLens = if (type.uppercase() == "FRONT") {
            CameraSelector.LENS_FACING_FRONT
        } else {
            CameraSelector.LENS_FACING_BACK
        }
        if (newLens != lensFacing) {
            lensFacing = newLens
            isCameraStarted = false
            startCamera()
        }
    }

    fun startCamera() {
        val lifecycleOwner = findLifecycleOwner()
        if (lifecycleOwner == null) {
            Log.w("KitayarScanner", "LifecycleOwner not available yet, retrying in 200ms...")
            postDelayed({ startCamera() }, 200)
            return
        }

        val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
        cameraProviderFuture.addListener({
            try {
                cameraProvider = cameraProviderFuture.get()

                val preview = Preview.Builder().build().also {
                    it.setSurfaceProvider(previewView.surfaceProvider)
                }

                imageCapture = ImageCapture.Builder()
                    .setCaptureMode(ImageCapture.CAPTURE_MODE_MAXIMIZE_QUALITY)
                    .setFlashMode(flashMode)
                    .build()

                val cameraSelector = CameraSelector.Builder()
                    .requireLensFacing(lensFacing)
                    .build()

                cameraProvider?.unbindAll()

                camera = cameraProvider?.bindToLifecycle(
                    lifecycleOwner,
                    cameraSelector,
                    preview,
                    imageCapture
                )
                Log.d("KitayarScanner", "Camera bound with preview and high-quality capture")

                isCameraStarted = true
            } catch (e: Exception) {
                Log.e("KitayarScanner", "Error starting CameraX", e)
            }
        }, ContextCompat.getMainExecutor(context))
    }

    @SuppressLint("ClickableViewAccessibility")
    private fun setupTapToFocus() {
        previewView.setOnTouchListener { _, event ->
            if (event.action == MotionEvent.ACTION_UP) {
                try {
                    val factory = previewView.meteringPointFactory
                    val point = factory.createPoint(event.x, event.y)
                    val action = FocusMeteringAction.Builder(point).build()
                    camera?.cameraControl?.startFocusAndMetering(action)
                } catch (_: Exception) {}
            }
            true
        }
    }

    @androidx.annotation.OptIn(androidx.camera.core.ExperimentalGetImage::class)
    private fun processLiveFrame(imageProxy: ImageProxy) {
        val currentTimestamp = System.currentTimeMillis()
        if (currentTimestamp - lastAnalysisTimestamp < analysisThrottleMs) {
            imageProxy.close()
            return
        }
        lastAnalysisTimestamp = currentTimestamp

        try {
            val mediaImage = imageProxy.image
            if (mediaImage != null) {
                val yBuffer = mediaImage.planes[0].buffer
                val ySize = yBuffer.remaining()
                val yData = ByteArray(ySize)
                yBuffer.get(yData)

                val imgW = imageProxy.width
                val imgH = imageProxy.height

                val yMat = Mat(imgH, imgW, org.opencv.core.CvType.CV_8UC1)
                yMat.put(0, 0, yData)

                val downscaleW = 320
                val downscaleH = (imgH * (320.0 / imgW)).toInt()
                val smallMat = Mat()
                Imgproc.resize(yMat, smallMat, Size(downscaleW.toDouble(), downscaleH.toDouble()))
                yMat.release()

                val blurred = Mat()
                Imgproc.GaussianBlur(smallMat, blurred, Size(3.0, 3.0), 0.0)
                val edges = Mat()
                Imgproc.Canny(blurred, edges, 50.0, 150.0)

                val contours = ArrayList<MatOfPoint>()
                val hierarchy = Mat()
                Imgproc.findContours(edges, contours, hierarchy, Imgproc.RETR_LIST, Imgproc.CHAIN_APPROX_SIMPLE)

                var bestApprox: List<org.opencv.core.Point>? = null
                val totalArea = downscaleW * downscaleH.toDouble()
                var maxArea = 0.0

                for (c in contours) {
                    val c2f = MatOfPoint2f(*c.toArray())
                    val peri = Imgproc.arcLength(c2f, true)
                    val approx = MatOfPoint2f()
                    Imgproc.approxPolyDP(c2f, approx, 0.03 * peri, true)

                    if (approx.total() == 4L) {
                        val pts = approx.toArray().toList()
                        val area = Imgproc.contourArea(approx)
                        if (Imgproc.isContourConvex(MatOfPoint(*approx.toArray())) &&
                            area > totalArea * 0.10 && area < totalArea * 0.95 && area > maxArea
                        ) {
                            maxArea = area
                            bestApprox = pts
                        }
                    }
                    c2f.release()
                    approx.release()
                    c.release()
                }

                smallMat.release()
                blurred.release()
                edges.release()
                hierarchy.release()

                if (bestApprox != null && bestApprox.size == 4) {
                    val scaleX = 1.0 / downscaleW.toDouble()
                    val scaleY = 1.0 / downscaleH.toDouble()

                    val event = Arguments.createMap().apply {
                        val pointsArr = Arguments.createArray()
                        for (pt in bestApprox) {
                            val pMap = Arguments.createMap().apply {
                                putDouble("x", pt.x * scaleX)
                                putDouble("y", pt.y * scaleY)
                            }
                            pointsArr.pushMap(pMap)
                        }
                        putArray("corners", pointsArr)
                        putBoolean("detected", true)
                    }

                    val reactContext = context as? ReactContext
                    reactContext?.getJSModule(RCTEventEmitter::class.java)?.receiveEvent(
                        id,
                        "onDocumentDetected",
                        event
                    )
                }
            }
        } catch (_: Exception) {
        } finally {
            imageProxy.close()
        }
    }

    fun capturePhoto(promise: Promise) {
        val capture = imageCapture
        if (capture == null) {
            promise.reject("CAMERA_ERROR", "دوربین آماده نیست")
            return
        }

        val cacheDir = context.cacheDir
        val outputDir = File(cacheDir, "camera_captures").apply { mkdirs() }
        val photoFile = File(outputDir, "raw_${System.currentTimeMillis()}.jpg")

        val outputOptions = ImageCapture.OutputFileOptions.Builder(photoFile).build()

        capture.takePicture(
            outputOptions,
            cameraExecutor,
            object : ImageCapture.OnImageSavedCallback {
                override fun onImageSaved(outputFileResults: ImageCapture.OutputFileResults) {
                    val result = Arguments.createMap().apply {
                        putString("uri", "file://${photoFile.absolutePath}")
                    }
                    promise.resolve(result)
                }

                override fun onError(exception: ImageCaptureException) {
                    promise.reject("CAPTURE_ERROR", exception.message ?: "خطا در ثبت عکس", exception)
                }
            }
        )
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        try {
            cameraProvider?.unbindAll()
            cameraExecutor.shutdown()
        } catch (_: Exception) {}
    }
}
