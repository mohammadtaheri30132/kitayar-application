package com.kitayar

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.kitayar.modules.pdf.PdfConverterPackage
import com.kitayar.modules.filepicker.FilePickerPackage 
import com.kitayar.modules.share.FileSharePackage
import com.kitayar.modules.image.ImageCompressorPackage
import com.kitayar.modules.imageconvert.ImageConverterPackage
import com.kitayar.modules.filesaver.FileSaverPackage
import com.kitayar.modules.collage.CollagePackage
import com.kitayar.modules.imageresize.ImageResizePackage
import com.kitayar.modules.imagecrop.ImageCropPackage
import com.kitayar.modules.video.VideoProcessorPackage
import com.kitayar.modules.videopicker.VideoPickerPackage
import com.kitayar.modules.audiototext.AudioToTextPackage
import com.kitayar.modules.videoplayer.KitayarVideoPackage
import com.kitayar.modules.texttopdf.TextToPdfPackage
import com.kitayar.modules.advancedpdf.AdvancedPdfPackage
import com.kitayar.modules.pdfcore.PdfCorePackage
import com.kitayar.audiorecorder.AudioRecorderPackage
import com.kitayar.modules.persiandatepicker.PersianDatePickerPackage
import com.kitayar.modules.scanner.DocumentScannerPackage
import com.kitayar.modules.community.CommunityQnaPackage
import com.kitayar.modules.prayertimes.bridge.PrayerTimesPackage
import com.kitayar.modules.canvas.bridge.InfiniteCanvasPackage
import com.kitayar.modules.music.KitayarMusicPlayerPackage
import com.kitayar.modules.barcode.BarcodePackage
import com.kitayar.modules.sensors.SensorsPackage
import com.kitayar.modules.ir.KitayarIrPackage
import com.kitayar.modules.smartsheet.SmartSheetPackage

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
          add(FilePickerPackage())
          add(PdfConverterPackage())
          add(FileSharePackage())
          add(ImageCompressorPackage())
          add(ImageConverterPackage())
          add(FileSaverPackage())
          add(CollagePackage())
          add(ImageResizePackage())
          add(ImageCropPackage())
          add(VideoProcessorPackage())
          add(VideoPickerPackage())
          add(KitayarVideoPackage())
          add(AudioToTextPackage())
          add(TextToPdfPackage())
          add(AdvancedPdfPackage())
          add(PdfCorePackage())
          add(AudioRecorderPackage())
          add(PersianDatePickerPackage())
          add(DocumentScannerPackage())
          add(CommunityQnaPackage())
          add(PrayerTimesPackage())
          add(InfiniteCanvasPackage())
          add(KitayarMusicPlayerPackage())
          add(BarcodePackage())
          add(SensorsPackage())
          add(KitayarIrPackage())
          add(SmartSheetPackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()

    if (!org.opencv.android.OpenCVLoader.initDebug()) {
      android.util.Log.e("KitayarScanner", "Unable to load OpenCV")
    } else {
      android.util.Log.d("KitayarScanner", "OpenCV loaded successfully")
    }

    loadReactNative(this)
  }
}
