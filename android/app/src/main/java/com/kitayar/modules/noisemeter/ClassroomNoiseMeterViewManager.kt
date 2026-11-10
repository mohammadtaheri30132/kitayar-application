package com.kitayar.modules.noisemeter

import com.facebook.react.bridge.ReadableArray
import com.facebook.react.common.MapBuilder
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

/**
 * Exposes ClassroomNoiseMeterView to React Native as a native component.
 */
class ClassroomNoiseMeterViewManager : SimpleViewManager<ClassroomNoiseMeterView>() {

    companion object {
        const val REACT_CLASS = "ClassroomNoiseMeterView"

        const val COMMAND_RESET = 1
        const val COMMAND_START = 2
        const val COMMAND_STOP = 3
    }

    override fun getName(): String = REACT_CLASS

    override fun createViewInstance(reactContext: ThemedReactContext): ClassroomNoiseMeterView {
        return ClassroomNoiseMeterView(reactContext)
    }

    @ReactProp(name = "isRunning", defaultBoolean = true)
    fun setIsRunning(view: ClassroomNoiseMeterView, isRunning: Boolean) {
        view.isRunning = isRunning
    }

    @ReactProp(name = "isMuted", defaultBoolean = false)
    fun setIsMuted(view: ClassroomNoiseMeterView, isMuted: Boolean) {
        view.alertManager.isMuted = isMuted
    }

    @ReactProp(name = "sensitivity", defaultFloat = 0.72f)
    fun setSensitivity(view: ClassroomNoiseMeterView, sensitivity: Float) {
        view.audioDetector.sensitivity = sensitivity.coerceIn(0.2f, 3.0f)
    }

    @ReactProp(name = "moderateThreshold", defaultFloat = 50.0f)
    fun setModerateThreshold(view: ClassroomNoiseMeterView, threshold: Float) {
        view.alertManager.moderateThreshold = threshold.coerceIn(10.0f, 95.0f)
    }

    @ReactProp(name = "excessiveThreshold", defaultFloat = 75.0f)
    fun setExcessiveThreshold(view: ClassroomNoiseMeterView, threshold: Float) {
        view.alertManager.excessiveThreshold = threshold.coerceIn(15.0f, 100.0f)
    }

    @ReactProp(name = "alertModerateEnabled", defaultBoolean = true)
    fun setAlertModerateEnabled(view: ClassroomNoiseMeterView, enabled: Boolean) {
        view.alertManager.isModerateAlertEnabled = enabled
    }

    @ReactProp(name = "alertExcessiveEnabled", defaultBoolean = true)
    fun setAlertExcessiveEnabled(view: ClassroomNoiseMeterView, enabled: Boolean) {
        view.alertManager.isExcessiveAlertEnabled = enabled
    }

    @ReactProp(name = "ballStyle")
    fun setBallStyle(view: ClassroomNoiseMeterView, style: String?) {
        if (!style.isNullOrEmpty()) {
            view.ballStyle = style
        }
    }

    @ReactProp(name = "ballCount", defaultInt = 45)
    fun setBallCount(view: ClassroomNoiseMeterView, count: Int) {
        view.ballCount = count
    }

    override fun getCommandsMap(): Map<String, Int> {
        return MapBuilder.of(
            "reset", COMMAND_RESET,
            "start", COMMAND_START,
            "stop", COMMAND_STOP
        )
    }

    override fun receiveCommand(view: ClassroomNoiseMeterView, commandId: String?, args: ReadableArray?) {
        when (commandId) {
            "reset", COMMAND_RESET.toString() -> view.resetSimulation()
            "start", COMMAND_START.toString() -> view.isRunning = true
            "stop", COMMAND_STOP.toString() -> view.isRunning = false
        }
    }

    override fun receiveCommand(view: ClassroomNoiseMeterView, commandId: Int, args: ReadableArray?) {
        when (commandId) {
            COMMAND_RESET -> view.resetSimulation()
            COMMAND_START -> view.isRunning = true
            COMMAND_STOP -> view.isRunning = false
        }
    }

    override fun getExportedCustomDirectEventTypeConstants(): Map<String, Any> {
        return MapBuilder.builder<String, Any>()
            .put("topSoundLevelChange", MapBuilder.of("registrationName", "onSoundLevelChange"))
            .put("topAlertTriggered", MapBuilder.of("registrationName", "onAlertTriggered"))
            .put("topError", MapBuilder.of("registrationName", "onError"))
            .build()
    }
}
