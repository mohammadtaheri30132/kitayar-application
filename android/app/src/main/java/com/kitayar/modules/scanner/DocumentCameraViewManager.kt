package com.kitayar.modules.scanner

import com.facebook.react.bridge.ReadableArray
import com.facebook.react.common.MapBuilder
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

class DocumentCameraViewManager : SimpleViewManager<DocumentCameraView>() {

    companion object {
        const val REACT_CLASS = "DocumentCameraView"
        const val COMMAND_TAKE_PHOTO = 1
        var activeCameraView: DocumentCameraView? = null
    }

    override fun getName(): String = REACT_CLASS

    override fun createViewInstance(reactContext: ThemedReactContext): DocumentCameraView {
        val view = DocumentCameraView(reactContext)
        activeCameraView = view
        view.post {
            view.startCamera()
        }
        return view
    }

    @ReactProp(name = "flashMode")
    fun setFlashMode(view: DocumentCameraView, flashMode: String?) {
        view.setFlash(flashMode ?: "OFF")
    }

    @ReactProp(name = "cameraType")
    fun setCameraType(view: DocumentCameraView, cameraType: String?) {
        view.setCameraType(cameraType ?: "BACK")
    }

    override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any>? {
        return mutableMapOf(
            "onDocumentDetected" to MapBuilder.of("registrationName", "onDocumentDetected")
        )
    }

    override fun getCommandsMap(): MutableMap<String, Int>? {
        return MapBuilder.of(
            "takePhoto", COMMAND_TAKE_PHOTO
        )
    }

    override fun onDropViewInstance(view: DocumentCameraView) {
        super.onDropViewInstance(view)
        if (activeCameraView == view) {
            activeCameraView = null
        }
    }
}
