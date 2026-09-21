package com.kitayar.modules.imageconvert

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.media.ExifInterface
import android.net.Uri
import com.facebook.react.bridge.*
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream

class ImageConverterModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "ImageConverterModule"

    // -------------------------------------------------------------
    // ۱. تشخیص فرمت عکس بر اساس magic bytes (مطمئن‌تر از پسوند فایل)
    // -------------------------------------------------------------
    @ReactMethod
    fun detectFormat(imageUriString: String, promise: Promise) {
        try {
            val uri = Uri.parse(imageUriString)
            val inputStream = reactApplicationContext.contentResolver.openInputStream(uri)
                ?: throw IllegalStateException("امکان خواندن فایل وجود ندارد")

            val header = ByteArray(16)
            inputStream.read(header)
            inputStream.close()

            val format = identifyFormat(header)

            val result = Arguments.createMap().apply {
                putString("format", format)
                putBoolean("supported", format != "UNKNOWN")
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("DETECT_FAILED", "خطا در تشخیص فرمت: ${e.message}", e)
        }
    }

    private fun identifyFormat(header: ByteArray): String {
        // JPEG: FF D8 FF
        if (header.size >= 3 &&
            header[0] == 0xFF.toByte() && header[1] == 0xD8.toByte() && header[2] == 0xFF.toByte()
        ) return "JPEG"

        // PNG: 89 50 4E 47
        if (header.size >= 4 &&
            header[0] == 0x89.toByte() && header[1] == 0x50.toByte() &&
            header[2] == 0x4E.toByte() && header[3] == 0x47.toByte()
        ) return "PNG"

        // GIF: 47 49 46 38 ("GIF8")
        if (header.size >= 4 &&
            header[0] == 0x47.toByte() && header[1] == 0x49.toByte() &&
            header[2] == 0x46.toByte() && header[3] == 0x38.toByte()
        ) return "GIF"

        // BMP: 42 4D ("BM")
        if (header.size >= 2 && header[0] == 0x42.toByte() && header[1] == 0x4D.toByte()) return "BMP"

        // WEBP: "RIFF"....."WEBP"
        if (header.size >= 12 &&
            header[0] == 'R'.code.toByte() && header[1] == 'I'.code.toByte() &&
            header[2] == 'F'.code.toByte() && header[3] == 'F'.code.toByte() &&
            header[8] == 'W'.code.toByte() && header[9] == 'E'.code.toByte() &&
            header[10] == 'B'.code.toByte() && header[11] == 'P'.code.toByte()
        ) return "WEBP"

        // HEIC/HEIF: بایت‌های 4 تا 11 معمولاً شامل "ftyp" هستن + برند heic/mif1/heix
        if (header.size >= 12) {
            val brandBox = String(header, 4, 8, Charsets.US_ASCII)
            if (brandBox.startsWith("ftyp")) {
                val brand = String(header, 8, 4, Charsets.US_ASCII)
                if (brand.startsWith("hei") || brand.startsWith("mif") || brand.startsWith("hev")) {
                    return "HEIC"
                }
            }
        }

        return "UNKNOWN"
    }

    // -------------------------------------------------------------
    // ۲. تبدیل فرمت — targetFormat یکی از: "JPEG", "PNG", "WEBP", "BMP"
    // quality بین 0 تا 100 (فقط برای JPEG و WEBP کاربرد داره)
    // -------------------------------------------------------------
    @ReactMethod
    fun convertImage(imageUriString: String, targetFormat: String, quality: Int, promise: Promise) {
        Thread {
            var bitmap: Bitmap? = null
            try {
                val uri = Uri.parse(imageUriString)
                bitmap = loadBitmapWithCorrectOrientation(uri)
                    ?: throw IllegalStateException("خطا در خواندن تصویر ورودی")

                val outputDir = File(reactApplicationContext.cacheDir, "converted_images")
                if (!outputDir.exists()) outputDir.mkdirs()

                val fileName = "converted_${System.currentTimeMillis()}.${extensionFor(targetFormat)}"
                val outputFile = File(outputDir, fileName)

                when (targetFormat.uppercase()) {
                    "JPEG", "JPG" -> {
                        FileOutputStream(outputFile).use { out ->
                            bitmap.compress(Bitmap.CompressFormat.JPEG, quality.coerceIn(0, 100), out)
                        }
                    }
                    "PNG" -> {
                        FileOutputStream(outputFile).use { out ->
                            bitmap.compress(Bitmap.CompressFormat.PNG, 100, out) // PNG بدون افت است، quality تاثیری ندارد
                        }
                    }
                    "WEBP" -> {
                        FileOutputStream(outputFile).use { out ->
                            @Suppress("DEPRECATION")
                            val webpFormat = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
                                Bitmap.CompressFormat.WEBP_LOSSY
                            } else {
                                Bitmap.CompressFormat.WEBP
                            }
                            bitmap.compress(webpFormat, quality.coerceIn(0, 100), out)
                        }
                    }
                    "BMP" -> {
                        writeBitmapAsBmp(bitmap, outputFile)
                    }
                    else -> throw IllegalArgumentException("فرمت مقصد پشتیبانی نمی‌شود: $targetFormat")
                }

                val result = Arguments.createMap().apply {
                    putString("path", outputFile.absolutePath)
                    putString("uri", "file://${outputFile.absolutePath}")
                    putDouble("sizeBytes", outputFile.length().toDouble())
                }
                promise.resolve(result)

            } catch (t: Throwable) {
                promise.reject("CONVERT_FAILED", "خطا در تبدیل فرمت: ${t.message}", t)
            } finally {
                bitmap?.recycle()
            }
        }.start()
    }

    private fun extensionFor(format: String): String = when (format.uppercase()) {
        "JPEG", "JPG" -> "jpg"
        "PNG" -> "png"
        "WEBP" -> "webp"
        "BMP" -> "bmp"
        else -> "dat"
    }

    // خواندن تصویر + اصلاح چرخش EXIF (برای JPEG رایج است که چرخش داشته باشه)
    private fun loadBitmapWithCorrectOrientation(uri: Uri): Bitmap? {
        val contentResolver = reactApplicationContext.contentResolver

        var orientation = ExifInterface.ORIENTATION_NORMAL
        try {
            val exifStream: InputStream? = contentResolver.openInputStream(uri)
            exifStream?.let {
                val exif = ExifInterface(it)
                orientation = exif.getAttributeInt(
                    ExifInterface.TAG_ORIENTATION,
                    ExifInterface.ORIENTATION_NORMAL
                )
                it.close()
            }
        } catch (e: Exception) {
            // بعضی فرمت‌ها (مثل PNG) اصلا EXIF ندارن؛ مشکلی نیست، همون NORMAL می‌مونه
        }

        val imageStream = contentResolver.openInputStream(uri) ?: return null
        val original = BitmapFactory.decodeStream(imageStream)
        imageStream.close()
        original ?: return null

        val matrix = Matrix()
        when (orientation) {
            ExifInterface.ORIENTATION_ROTATE_90 -> matrix.postRotate(90f)
            ExifInterface.ORIENTATION_ROTATE_180 -> matrix.postRotate(180f)
            ExifInterface.ORIENTATION_ROTATE_270 -> matrix.postRotate(270f)
            else -> return original
        }

        val rotated = Bitmap.createBitmap(original, 0, 0, original.width, original.height, matrix, true)
        if (rotated != original) original.recycle()
        return rotated
    }

    // اندروید به‌صورت بومی BMP رو در Bitmap.CompressFormat پشتیبانی نمی‌کنه؛
    // این یک انکودر ساده BMP (24-bit, uncompressed) است
    private fun writeBitmapAsBmp(bitmap: Bitmap, outputFile: File) {
        val width = bitmap.width
        val height = bitmap.height
        val rowPaddedSize = (width * 3 + 3) / 4 * 4
        val dataSize = rowPaddedSize * height
        val fileSize = 54 + dataSize

        val buffer = ByteArrayOutputStream(fileSize)

        fun writeLE(vararg bytes: Int) {
            for (b in bytes) buffer.write(b and 0xFF)
        }

        fun writeIntLE(value: Int) {
            buffer.write(value and 0xFF)
            buffer.write((value shr 8) and 0xFF)
            buffer.write((value shr 16) and 0xFF)
            buffer.write((value shr 24) and 0xFF)
        }

        fun writeShortLE(value: Int) {
            buffer.write(value and 0xFF)
            buffer.write((value shr 8) and 0xFF)
        }

        // Header فایل BMP
        writeLE('B'.code, 'M'.code)
        writeIntLE(fileSize)
        writeIntLE(0) // reserved
        writeIntLE(54) // offset به شروع داده تصویر

        // DIB Header (BITMAPINFOHEADER)
        writeIntLE(40) // اندازه این هدر
        writeIntLE(width)
        writeIntLE(height)
        writeShortLE(1) // planes
        writeShortLE(24) // bits per pixel
        writeIntLE(0) // بدون فشرده‌سازی
        writeIntLE(dataSize)
        writeIntLE(2835) // رزولوشن افقی (پیکسل بر متر، تقریبا 72 DPI)
        writeIntLE(2835)
        writeIntLE(0) // تعداد رنگ‌های پالت
        writeIntLE(0) // رنگ‌های مهم

        // داده پیکسل‌ها — BMP از پایین به بالا و به ترتیب BGR ذخیره می‌شه
        val row = ByteArray(rowPaddedSize)
        for (y in height - 1 downTo 0) {
            var idx = 0
            for (x in 0 until width) {
                val pixel = bitmap.getPixel(x, y)
                row[idx++] = ((pixel shr 0) and 0xFF).toByte()  // Blue
                row[idx++] = ((pixel shr 8) and 0xFF).toByte()  // Green
                row[idx++] = ((pixel shr 16) and 0xFF).toByte() // Red
            }
            // بقیه بایت‌های padding صفر می‌مونن (پیش‌فرض ByteArray)
            buffer.write(row)
        }

        FileOutputStream(outputFile).use { out ->
            buffer.writeTo(out)
        }
    }
}