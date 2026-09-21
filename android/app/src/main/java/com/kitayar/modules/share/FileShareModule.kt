package com.kitayar.modules.share

import android.content.Intent
import android.net.Uri
import androidx.core.content.FileProvider
import com.facebook.react.bridge.*
import java.io.File

class FileShareModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "FileShareModule"
    }

    @ReactMethod
    fun shareFile(filePath: String, mimeType: String, promise: Promise) {
        try {
            val activity = getCurrentActivity()
            if (activity == null) {
                promise.reject("ERROR", "اکتیویتی پیدا نشد")
                return
            }

            // حذف file:// در صورت وجود، تا مسیر خالص سیستم‌عامل به دست بیاید
            val cleanPath = filePath.replace("file://", "")
            val file = File(cleanPath)

            if (!file.exists()) {
                promise.reject("ERROR", "فایل مورد نظر یافت نشد")
                return
            }

            // ساخت یک Uri امن (مجوزدار) با استفاده از FileProvider
            val authority = "${reactApplicationContext.packageName}.fileprovider"
            val uri: Uri = FileProvider.getUriForFile(reactApplicationContext, authority, file)

            // فراخوانی Intent بومی اندروید برای اشتراک‌گذاری
            val intent = Intent(Intent.ACTION_SEND).apply {
                type = mimeType
                putExtra(Intent.EXTRA_STREAM, uri)
                // دادن مجوز موقت به سایر اپلیکیشن‌ها برای خواندن این فایل
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION) 
            }

            val chooser = Intent.createChooser(intent, "اشتراک‌گذاری در...")
            activity.startActivity(chooser)
            
            promise.resolve("SUCCESS")

        } catch (e: Exception) {
            promise.reject("SHARE_ERROR", "خطا در سیستم اشتراک‌گذاری: ${e.message}")
        }
    }
}