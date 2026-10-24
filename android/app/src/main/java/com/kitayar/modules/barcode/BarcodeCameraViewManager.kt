package com.kitayar.modules.barcode

import com.facebook.react.common.MapBuilder
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

class BarcodeCameraViewManager : SimpleViewManager<BarcodeCameraView>() {

    override fun getName(): String = "BarcodeCameraView"

    override fun createViewInstance(reactContext: ThemedReactContext): BarcodeCameraView {
        return BarcodeCameraView(reactContext)
    }

    override fun onDropViewInstance(view: BarcodeCameraView) {
        super.onDropViewInstance(view)
        view.release()
    }

    @ReactProp(name = "flashEnabled", defaultBoolean = false)
    fun setFlashEnabled(view: BarcodeCameraView, enabled: Boolean) {
        view.setFlashEnabled(enabled)
    }

    @ReactProp(name = "lensFacing")
    fun setLensFacing(view: BarcodeCameraView, facing: String?) {
        view.setLensFacing(facing ?: "back")
    }

    @ReactProp(name = "isScanningActive", defaultBoolean = true)
    fun setScanningActive(view: BarcodeCameraView, active: Boolean) {
        view.setScanningActive(active)
    }

    override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any>? {
        return mutableMapOf(
            "onBarcodeDetected" to MapBuilder.of("registrationName", "onBarcodeDetected")
        )
    }
}
