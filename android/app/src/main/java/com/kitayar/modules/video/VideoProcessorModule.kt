package com.kitayar.modules.video

import android.media.MediaCodec
import android.media.MediaExtractor
import android.media.MediaFormat
import android.media.MediaMuxer
import android.net.Uri
import com.facebook.react.bridge.*
import java.io.File
import java.nio.ByteBuffer

class VideoProcessorModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "VideoProcessorModule"

    // دریافت اطلاعات ویدیو (مدت زمان به ثانیه)
    @ReactMethod
    fun getVideoInfo(uriStr: String, promise: Promise) {
        try {
            val uri = Uri.parse(uriStr)
            val extractor = MediaExtractor()
            reactApplicationContext.contentResolver.openFileDescriptor(uri, "r")?.fileDescriptor?.let {
                extractor.setDataSource(it)
            }
            
            var durationUs = 0L
            for (i in 0 until extractor.trackCount) {
                val format = extractor.getTrackFormat(i)
                if (format.containsKey(MediaFormat.KEY_DURATION)) {
                    val trackDuration = format.getLong(MediaFormat.KEY_DURATION)
                    if (trackDuration > durationUs) {
                        durationUs = trackDuration
                    }
                }
            }
            extractor.release()
            
            val map = Arguments.createMap()
            map.putDouble("durationSeconds", durationUs / 1000000.0)
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("INFO_ERROR", e.message)
        }
    }

    // استخراج صدای ویدیو
    @ReactMethod
    fun extractAudio(uriStr: String, promise: Promise) {
        Thread {
            try {
                val uri = Uri.parse(uriStr)
                val extractor = MediaExtractor()
                reactApplicationContext.contentResolver.openFileDescriptor(uri, "r")?.fileDescriptor?.let {
                    extractor.setDataSource(it)
                }

                var audioTrackIndex = -1
                for (i in 0 until extractor.trackCount) {
                    val format = extractor.getTrackFormat(i)
                    val mime = format.getString(MediaFormat.KEY_MIME) ?: ""
                    if (mime.startsWith("audio/")) {
                        audioTrackIndex = i
                        break
                    }
                }

                if (audioTrackIndex == -1) {
                    extractor.release()
                    promise.reject("NO_AUDIO", "ویدیوی انتخابی صدا ندارد")
                    return@Thread
                }

                extractor.selectTrack(audioTrackIndex)
                val audioFormat = extractor.getTrackFormat(audioTrackIndex)

                val outputFile = File(reactApplicationContext.cacheDir, "audio_${System.currentTimeMillis()}.m4a")
                val muxer = MediaMuxer(outputFile.absolutePath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)
                val muxerAudioTrackIndex = muxer.addTrack(audioFormat)
                muxer.start()

                val bufferSize = audioFormat.getInteger(MediaFormat.KEY_MAX_INPUT_SIZE).let {
                    if (it > 0) it else 1024 * 1024
                }
                val buffer = ByteBuffer.allocate(bufferSize)
                val bufferInfo = MediaCodec.BufferInfo()

                while (true) {
                    val sampleSize = extractor.readSampleData(buffer, 0)
                    if (sampleSize < 0) break

                    bufferInfo.offset = 0
                    bufferInfo.size = sampleSize
                    bufferInfo.presentationTimeUs = extractor.sampleTime
                    bufferInfo.flags = extractor.sampleFlags

                    muxer.writeSampleData(muxerAudioTrackIndex, buffer, bufferInfo)
                    extractor.advance()
                }

                muxer.stop()
                muxer.release()
                extractor.release()

                promise.resolve(outputFile.absolutePath)
            } catch (e: Exception) {
                promise.reject("EXTRACT_ERROR", e.message)
            }
        }.start()
    }

    // برش ویدیو (بدون افت کیفیت و بسیار سریع)
    @ReactMethod
    fun trimVideo(uriStr: String, startSec: Double, endSec: Double, promise: Promise) {
        Thread {
            try {
                val uri = Uri.parse(uriStr)
                val extractor = MediaExtractor()
                reactApplicationContext.contentResolver.openFileDescriptor(uri, "r")?.fileDescriptor?.let {
                    extractor.setDataSource(it)
                }

                val outputFile = File(reactApplicationContext.cacheDir, "trimmed_${System.currentTimeMillis()}.mp4")
                val muxer = MediaMuxer(outputFile.absolutePath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)

                val trackMap = HashMap<Int, Int>()
                var bufferSize = -1

                for (i in 0 until extractor.trackCount) {
                    val format = extractor.getTrackFormat(i)
                    val mime = format.getString(MediaFormat.KEY_MIME) ?: ""
                    if (mime.startsWith("video/") || mime.startsWith("audio/")) {
                        extractor.selectTrack(i)
                        val muxerTrackIndex = muxer.addTrack(format)
                        trackMap[i] = muxerTrackIndex
                        
                        val maxInputSize = if (format.containsKey(MediaFormat.KEY_MAX_INPUT_SIZE)) {
                            format.getInteger(MediaFormat.KEY_MAX_INPUT_SIZE)
                        } else 0
                        if (maxInputSize > bufferSize) {
                            bufferSize = maxInputSize
                        }
                    }
                }

                if (bufferSize < 0) bufferSize = 1024 * 1024
                val buffer = ByteBuffer.allocate(bufferSize)

                muxer.start()

                // پرش به زمان شروع (بر اساس میکروثانیه)
                val startUs = (startSec * 1000000).toLong()
                val endUs = (endSec * 1000000).toLong()
                extractor.seekTo(startUs, MediaExtractor.SEEK_TO_PREVIOUS_SYNC)

                val bufferInfo = MediaCodec.BufferInfo()

                while (true) {
                    val trackIndex = extractor.sampleTrackIndex
                    if (trackIndex == -1) break
                    
                    val presentationTimeUs = extractor.sampleTime
                    if (presentationTimeUs > endUs) {
                        // اگر تمام ترک‌ها از زمان پایان رد شده باشند متوقف می‌شویم
                        extractor.unselectTrack(trackIndex)
                        if (extractor.sampleTrackIndex == -1) break
                        continue
                    }

                    val muxerTrackIndex = trackMap[trackIndex]
                    if (muxerTrackIndex != null) {
                        bufferInfo.offset = 0
                        bufferInfo.size = extractor.readSampleData(buffer, 0)
                        bufferInfo.presentationTimeUs = presentationTimeUs
                        bufferInfo.flags = extractor.sampleFlags

                        muxer.writeSampleData(muxerTrackIndex, buffer, bufferInfo)
                    }
                    extractor.advance()
                }

                muxer.stop()
                muxer.release()
                extractor.release()

                promise.resolve(outputFile.absolutePath)
            } catch (e: Exception) {
                promise.reject("TRIM_ERROR", e.message)
            }
        }.start()
    }
}