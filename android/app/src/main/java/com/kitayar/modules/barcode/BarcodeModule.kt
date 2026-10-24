package com.kitayar.modules.barcode

import android.content.ContentValues
import android.graphics.*
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.util.Base64
import android.util.Log
import com.facebook.react.bridge.*
import com.google.mlkit.vision.barcode.BarcodeScannerOptions
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage
import com.google.zxing.BarcodeFormat
import com.google.zxing.EncodeHintType
import com.google.zxing.MultiFormatWriter
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import java.util.*

class BarcodeModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "BarcodeModule"
        private const val TAG = "BarcodeModule"
    }

    override fun getName(): String = NAME

    @ReactMethod
    fun generateBarcode(options: ReadableMap, promise: Promise) {
        Thread {
            try {
                val content = if (options.hasKey("content")) options.getString("content") else null
                if (content.isNullOrEmpty()) {
                    promise.reject("EMPTY_CONTENT", "Barcode content cannot be empty")
                    return@Thread
                }

                val formatStr = if (options.hasKey("format")) options.getString("format") ?: "QR_CODE" else "QR_CODE"
                val format = mapToBarcodeFormat(formatStr)
                val is1D = isOneDimensionalBarcode(format)

                val width = if (options.hasKey("width")) options.getInt("width") else if (is1D) 600 else 512
                val height = if (options.hasKey("height")) options.getInt("height") else if (is1D) 240 else 512
                val fgColorHex = if (options.hasKey("color")) options.getString("color") ?: "#000000" else "#000000"
                val bgColorHex = if (options.hasKey("backgroundColor")) options.getString("backgroundColor") ?: "#FFFFFF" else "#FFFFFF"
                val includeText = if (options.hasKey("includeText")) options.getBoolean("includeText") else false

                val fgColor = parseColorSafely(fgColorHex, Color.BLACK)
                val bgColor = parseColorSafely(bgColorHex, Color.WHITE)

                val hints = EnumMap<EncodeHintType, Any>(EncodeHintType::class.java).apply {
                    put(EncodeHintType.CHARACTER_SET, "UTF-8")
                    put(EncodeHintType.MARGIN, if (is1D) 1 else 2)
                    if (format == BarcodeFormat.QR_CODE) {
                        put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.H)
                    }
                }

                val writer = MultiFormatWriter()
                val bitMatrix = writer.encode(content, format, width, height, hints)
                val matrixWidth = bitMatrix.width
                val matrixHeight = bitMatrix.height

                val pixels = IntArray(matrixWidth * matrixHeight)
                for (y in 0 until matrixHeight) {
                    val offset = y * matrixWidth
                    for (x in 0 until matrixWidth) {
                        pixels[offset + x] = if (bitMatrix.get(x, y)) fgColor else bgColor
                    }
                }

                var barcodeBitmap = Bitmap.createBitmap(matrixWidth, matrixHeight, Bitmap.Config.ARGB_8888)
                barcodeBitmap.setPixels(pixels, 0, matrixWidth, 0, 0, matrixWidth, matrixHeight)

                // If 1D barcode and includeText is true, render label underneath
                if (is1D && includeText) {
                    barcodeBitmap = addTextUnderBarcode(barcodeBitmap, content, fgColor, bgColor)
                }

                // Compress to PNG & Base64
                val outputStream = ByteArrayOutputStream()
                barcodeBitmap.compress(Bitmap.CompressFormat.PNG, 100, outputStream)
                val byteArray = outputStream.toByteArray()
                val base64 = Base64.encodeToString(byteArray, Base64.NO_WRAP)
                val dataUri = "data:image/png;base64,$base64"

                // Save to temporary cache file
                val cacheDir = reactContext.cacheDir
                val file = File(cacheDir, "barcode_${UUID.randomUUID()}.png")
                FileOutputStream(file).use { fos ->
                    fos.write(byteArray)
                }

                val result = Arguments.createMap().apply {
                    putString("uri", Uri.fromFile(file).toString())
                    putString("filePath", file.absolutePath)
                    putString("base64", dataUri)
                    putInt("width", barcodeBitmap.width)
                    putInt("height", barcodeBitmap.height)
                    putString("format", formatStr)
                    putString("content", content)
                }

                promise.resolve(result)
            } catch (e: Exception) {
                Log.e(TAG, "generateBarcode error", e)
                promise.reject("GENERATE_FAILED", e.message, e)
            }
        }.start()
    }

    private fun addTextUnderBarcode(
        barcodeBitmap: Bitmap,
        text: String,
        textColor: Int,
        bgColor: Int
    ): Bitmap {
        val extraHeight = 50
        val combinedWidth = barcodeBitmap.width
        val combinedHeight = barcodeBitmap.height + extraHeight

        val resultBitmap = Bitmap.createBitmap(combinedWidth, combinedHeight, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(resultBitmap)

        // Draw background
        val bgPaint = Paint().apply { color = bgColor }
        canvas.drawRect(0f, 0f, combinedWidth.toFloat(), combinedHeight.toFloat(), bgPaint)

        // Draw barcode
        canvas.drawBitmap(barcodeBitmap, 0f, 0f, null)

        // Draw text
        val textPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = textColor
            textSize = 28f
            textAlign = Paint.Align.CENTER
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        }

        val textX = combinedWidth / 2f
        val textY = combinedHeight - 16f
        canvas.drawText(text, textX, textY, textPaint)

        return resultBitmap
    }

    @ReactMethod
    fun scanFromImage(imageUriStr: String, promise: Promise) {
        Thread {
            try {
                val uri = Uri.parse(imageUriStr)
                val bitmap = loadBitmapFromUri(uri)
                if (bitmap == null) {
                    promise.reject("LOAD_IMAGE_FAILED", "Could not load image from URI: $imageUriStr")
                    return@Thread
                }

                val inputImage = InputImage.fromBitmap(bitmap, 0)
                val options = BarcodeScannerOptions.Builder()
                    .setBarcodeFormats(Barcode.FORMAT_ALL_FORMATS)
                    .build()
                val scanner = BarcodeScanning.getClient(options)

                scanner.process(inputImage)
                    .addOnSuccessListener { barcodes ->
                        if (barcodes.isNotEmpty()) {
                            val barcode = barcodes[0]
                            val map = Arguments.createMap().apply {
                                putBoolean("found", true)
                                putString("value", barcode.rawValue ?: barcode.displayValue ?: "")
                                putString("displayValue", barcode.displayValue ?: "")
                                putString("format", getFormatName(barcode.format))
                                putString("type", getTypeName(barcode.valueType))

                                when (barcode.valueType) {
                                    Barcode.TYPE_URL -> {
                                        putMap("url", Arguments.createMap().apply {
                                            putString("url", barcode.url?.url ?: "")
                                            putString("title", barcode.url?.title ?: "")
                                        })
                                    }
                                    Barcode.TYPE_WIFI -> {
                                        putMap("wifi", Arguments.createMap().apply {
                                            putString("ssid", barcode.wifi?.ssid ?: "")
                                            putString("password", barcode.wifi?.password ?: "")
                                            putInt("encryptionType", barcode.wifi?.encryptionType ?: 0)
                                        })
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
                                }
                            }
                            promise.resolve(map)
                        } else {
                            val emptyMap = Arguments.createMap().apply {
                                putBoolean("found", false)
                            }
                            promise.resolve(emptyMap)
                        }
                    }
                    .addOnFailureListener { e ->
                        promise.reject("SCAN_FAILED", e.message, e)
                    }
            } catch (e: Exception) {
                Log.e(TAG, "scanFromImage error", e)
                promise.reject("SCAN_FAILED", e.message, e)
            }
        }.start()
    }

    private fun loadBitmapFromUri(uri: Uri): Bitmap? {
        return try {
            val scheme = uri.scheme
            if (scheme == "file" || scheme == null) {
                BitmapFactory.decodeFile(uri.path)
            } else {
                val inputStream: InputStream? = reactContext.contentResolver.openInputStream(uri)
                BitmapFactory.decodeStream(inputStream).also {
                    inputStream?.close()
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error decoding bitmap: ${e.message}")
            null
        }
    }

    @ReactMethod
    fun saveBarcodeToGallery(filePathOrUri: String, fileName: String, promise: Promise) {
        Thread {
            try {
                val file = if (filePathOrUri.startsWith("file://")) {
                    File(Uri.parse(filePathOrUri).path ?: "")
                } else {
                    File(filePathOrUri)
                }

                if (!file.exists()) {
                    promise.reject("FILE_NOT_FOUND", "File does not exist: $filePathOrUri")
                    return@Thread
                }

                val bitmap = BitmapFactory.decodeFile(file.absolutePath)
                if (bitmap == null) {
                    promise.reject("INVALID_BITMAP", "Failed to decode barcode bitmap")
                    return@Thread
                }

                val safeFileName = if (fileName.endsWith(".png")) fileName else "$fileName.png"
                val resolver = reactContext.contentResolver

                val imageUri: Uri?
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    val values = ContentValues().apply {
                        put(MediaStore.Images.Media.DISPLAY_NAME, safeFileName)
                        put(MediaStore.Images.Media.MIME_TYPE, "image/png")
                        put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/Kitayar/Barcodes")
                        put(MediaStore.Images.Media.IS_PENDING, 1)
                    }
                    imageUri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values)
                    if (imageUri != null) {
                        resolver.openOutputStream(imageUri).use { out ->
                            if (out != null) bitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
                        }
                        values.clear()
                        values.put(MediaStore.Images.Media.IS_PENDING, 0)
                        resolver.update(imageUri, values, null, null)
                    }
                } else {
                    val picturesDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES)
                    val kitayarDir = File(picturesDir, "Kitayar/Barcodes")
                    if (!kitayarDir.exists()) kitayarDir.mkdirs()

                    val targetFile = File(kitayarDir, safeFileName)
                    FileOutputStream(targetFile).use { out ->
                        bitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
                    }

                    val values = ContentValues().apply {
                        put(MediaStore.Images.Media.DATA, targetFile.absolutePath)
                        put(MediaStore.Images.Media.MIME_TYPE, "image/png")
                    }
                    imageUri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values)
                }

                promise.resolve(imageUri?.toString() ?: file.absolutePath)
            } catch (e: Exception) {
                Log.e(TAG, "saveBarcodeToGallery error", e)
                promise.reject("SAVE_FAILED", e.message, e)
            }
        }.start()
    }

    private fun mapToBarcodeFormat(formatStr: String): BarcodeFormat {
        return when (formatStr.uppercase()) {
            "QR_CODE", "QR" -> BarcodeFormat.QR_CODE
            "CODE_128", "CODE128" -> BarcodeFormat.CODE_128
            "CODE_39", "CODE39" -> BarcodeFormat.CODE_39
            "EAN_13", "EAN13" -> BarcodeFormat.EAN_13
            "EAN_8", "EAN8" -> BarcodeFormat.EAN_8
            "UPC_A", "UPCA" -> BarcodeFormat.UPC_A
            "UPC_E", "UPCE" -> BarcodeFormat.UPC_E
            "PDF_417", "PDF417" -> BarcodeFormat.PDF_417
            "ITF" -> BarcodeFormat.ITF
            "AZTEC" -> BarcodeFormat.AZTEC
            "DATA_MATRIX" -> BarcodeFormat.DATA_MATRIX
            else -> BarcodeFormat.QR_CODE
        }
    }

    private fun isOneDimensionalBarcode(format: BarcodeFormat): Boolean {
        return when (format) {
            BarcodeFormat.CODE_128,
            BarcodeFormat.CODE_39,
            BarcodeFormat.CODE_93,
            BarcodeFormat.CODABAR,
            BarcodeFormat.EAN_13,
            BarcodeFormat.EAN_8,
            BarcodeFormat.ITF,
            BarcodeFormat.UPC_A,
            BarcodeFormat.UPC_E -> true
            else -> false
        }
    }

    private fun parseColorSafely(hex: String, defaultColor: Int): Int {
        return try {
            Color.parseColor(hex)
        } catch (e: Exception) {
            defaultColor
        }
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
}
