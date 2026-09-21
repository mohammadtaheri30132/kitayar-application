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
          add(FileSharePackage()) // 👈 این خط را اضافه کن
          add(ImageCompressorPackage()) // 👈 این خط اضافه شود
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
        },
    )
  }

  override fun onCreate() {
    super.onCreate()

    loadReactNative(this)
  }
}
