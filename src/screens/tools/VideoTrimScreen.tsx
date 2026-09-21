import React, { useState, useEffect, useRef } from 'react';
import {
  NativeModules, View, Text, TouchableOpacity, FlatList, StyleSheet, Alert, 
  ActivityIndicator, TextInput, PanResponder, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { Share2, Trash2, Download, Scissors, FileVideo, Play, Pause } from 'lucide-react-native';

import KitayarVideo from '../../components/KitayarVideo';
import { saveToolHistory, getToolHistory, deleteToolHistory } from '../../services/ToolHistoryManager';
import { COLORS } from '../../theme/colors';

const { FileShareModule, FileSaverModule, VideoProcessorModule, VideoPickerModule } = NativeModules;
const TOOL_ID = 'VIDEO_TRIMMER';

// تایم‌لاین ادیتور پیشرفته با حل مشکل پرش
const EditorTimeline = ({ duration, startSec, endSec, currentTime, onBoundsChange, onSeek, onScrubStateChange }) => {
  const containerWidth = Dimensions.get('window').width - 60; 
  const thumbWidth = 18;

  // 👈 حل مشکل Stale Closures با ذخیره آخرین مقادیر در حافظه رفرنس
  const latest = useRef({ start: startSec, end: endSec, duration: duration });
  useEffect(() => {
    latest.current = { start: startSec, end: endSec, duration: duration };
  }, [startSec, endSec, duration]);

  // متغیر برای ذخیره نقطه شروع لمس کاربر
  const initialDragX = useRef(0);

  const leftPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        onScrubStateChange(true);
        // نقطه شروع دقیق دستگیره چپ را هنگام لمس ثبت می‌کنیم
        initialDragX.current = (latest.current.start / latest.current.duration) * containerWidth;
      },
      onPanResponderMove: (e, gesture) => {
        let newX = initialDragX.current + gesture.dx;
        const endX = (latest.current.end / latest.current.duration) * containerWidth;
        
        if (newX < 0) newX = 0;
        if (newX >= endX - thumbWidth) newX = endX - thumbWidth;
        
        const newStart = (newX / containerWidth) * latest.current.duration;
        onBoundsChange(newStart, latest.current.end);
        onSeek(newStart);
      },
      onPanResponderRelease: () => onScrubStateChange(false),
    })
  ).current;

  const rightPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        onScrubStateChange(true);
        // نقطه شروع دقیق دستگیره راست را هنگام لمس ثبت می‌کنیم
        initialDragX.current = (latest.current.end / latest.current.duration) * containerWidth;
      },
      onPanResponderMove: (e, gesture) => {
        let newX = initialDragX.current + gesture.dx;
        const startX = (latest.current.start / latest.current.duration) * containerWidth;
        
        if (newX > containerWidth) newX = containerWidth;
        if (newX <= startX + thumbWidth) newX = startX + thumbWidth;
        
        const newEnd = (newX / containerWidth) * latest.current.duration;
        onBoundsChange(latest.current.start, newEnd);
        onSeek(newEnd);
      },
      onPanResponderRelease: () => {
        onScrubStateChange(false);
        onSeek(latest.current.start);
      }
    })
  ).current;

  const playheadPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => onScrubStateChange(true),
      onPanResponderMove: (e, gesture) => {
        let newX = gesture.moveX - 30; // 30 پدینگ صفحه است
        const startX = (latest.current.start / latest.current.duration) * containerWidth;
        const endX = (latest.current.end / latest.current.duration) * containerWidth;

        if (newX < startX) newX = startX;
        if (newX > endX) newX = endX;
        
        const newTime = (newX / containerWidth) * latest.current.duration;
        onSeek(newTime);
      },
      onPanResponderRelease: () => onScrubStateChange(false),
    })
  ).current;

  // محاسبه موقعیت لحظه‌ای برای رندر بصری
  const startX = duration > 0 ? (startSec / duration) * containerWidth : 0;
  const endX = duration > 0 ? (endSec / duration) * containerWidth : containerWidth;
  const currentX = duration > 0 ? (currentTime / duration) * containerWidth : 0;

  return (
    <View style={sliderStyles.container}>
      <View style={sliderStyles.track} />
      <View style={[sliderStyles.selectedTrack, { left: startX, width: endX - startX }]} />
      <View style={[sliderStyles.thumbLeft, { left: startX }]} {...leftPanResponder.panHandlers}>
         <View style={sliderStyles.thumbGrip} />
      </View>
      <View style={[sliderStyles.thumbRight, { left: endX - thumbWidth }]} {...rightPanResponder.panHandlers}>
         <View style={sliderStyles.thumbGrip} />
      </View>
      <View style={[sliderStyles.playhead, { left: currentX }]} {...playheadPanResponder.panHandlers}>
        <View style={sliderStyles.playheadTop} />
        <View style={sliderStyles.playheadLine} />
      </View>
    </View>
  );
};

const VideoTrimScreen = ({ navigation }) => {
  const [history, setHistory] = useState([]);
  const [savedItems, setSavedItems] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [duration, setDuration] = useState(0);
  const [startSec, setStartSec] = useState(0);
  const [endSec, setEndSec] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  
  const [paused, setPaused] = useState(true);
  const isScrubbing = useRef(false);
  const videoRef = useRef(null);

  useEffect(() => { loadHistory(); }, []);
  const loadHistory = async () => { setHistory(await getToolHistory(TOOL_ID)); };

  const handlePickVideo = async () => {
    try {
      const uri = await VideoPickerModule.pickVideo();
      if (!uri) return;

      setIsLoading(true);
      const info = await VideoProcessorModule.getVideoInfo(uri);
      
      setSelectedVideo(uri);
      const totalSec = Math.floor(info.durationSeconds * 10) / 10;
      setDuration(totalSec);
      setStartSec(0);
      setEndSec(totalSec);
      setCurrentTime(0);
      
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      if (err !== 'CANCELLED' && err?.code !== 'CANCELLED') Alert.alert("خطا", err.message);
    }
  };

  const handleTrim = async () => {
    if (!selectedVideo) return;
    
    if (isNaN(startSec) || isNaN(endSec) || startSec >= endSec || endSec > duration || startSec < 0) {
      Alert.alert("خطا", "زمان‌های وارد شده نامعتبر است.");
      return;
    }

    setIsLoading(true);
    setPaused(true);
    try {
      const resultPath = await VideoProcessorModule.trimVideo(selectedVideo, startSec, endSec);
      const stat = await ReactNativeBlobUtil.fs.stat(resultPath);
      const sizeStr = (stat.size / (1024 * 1024)).toFixed(2) + " MB";
      const fileName = `trimmed_${Date.now()}.mp4`;
      
      await saveToolHistory(TOOL_ID, fileName, resultPath, sizeStr, 'MP4');
      loadHistory();
      setSelectedVideo(null);
      Alert.alert("عملیات موفق", "ویدیو با موفقیت برش داده شد.");
    } catch (err) {
      Alert.alert("خطا در برش", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProgress = (data) => {
    if (!isScrubbing.current) {
      const time = data.currentTime;
      if (time >= endSec || time >= duration - 0.1) {
        videoRef.current?.seek(startSec);
        setCurrentTime(startSec);
      } else if (time < startSec) {
        videoRef.current?.seek(startSec);
        setCurrentTime(startSec);
      } else {
        setCurrentTime(time);
      }
    }
  };

  const handleSeek = (time) => {
    setCurrentTime(time);
    videoRef.current?.seek(time);
  };

  const handleDelete = async (id) => { setHistory(await deleteToolHistory(TOOL_ID, id)); };
  const handleShare = async (path) => {
    try { await FileShareModule.shareFile(path, 'video/mp4'); } catch (err) {}
  };
  const handleSaveToDevice = async (item) => {
    try {
      await FileSaverModule.saveFile(item.resultPath, false);
      setSavedItems(prev => ({ ...prev, [item.id]: true }));
      setTimeout(() => setSavedItems(prev => ({ ...prev, [item.id]: false })), 3000);
    } catch (err) { Alert.alert("خطا", "ذخیره فایل با مشکل مواجه شد."); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.actionBox}>
        <View style={styles.actionHeader}>
          <Scissors color={COLORS.primary} size={35} />
          <Text style={styles.actionTitle}>برش حرفه‌ای ویدیو</Text>
        </View>

        {!selectedVideo ? (
          <TouchableOpacity style={styles.convertButton} onPress={handlePickVideo} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.convertButtonText}>انتخاب ویدیو</Text>}
          </TouchableOpacity>
        ) : (
          <View style={styles.editorBox}>
            
            <View style={styles.playerContainer}>
              <KitayarVideo
                ref={videoRef}
                src={selectedVideo}
                style={styles.videoPlayer}
                paused={paused}
                onProgress={handleProgress}
              />
              <TouchableOpacity style={styles.playPauseBtn} onPress={() => setPaused(!paused)}>
                {paused ? <Play color="#fff" fill="#fff" size={24} /> : <Pause color="#fff" fill="#fff" size={24} />}
              </TouchableOpacity>
            </View>
            
            <View style={styles.timeInfoRow}>
              <Text style={styles.timeText}>{(currentTime).toFixed(1)}s</Text>
              <Text style={styles.timeTextDark}>{(endSec - startSec).toFixed(1)}s انتخاب شده</Text>
              <Text style={styles.timeText}>{(duration).toFixed(1)}s</Text>
            </View>

            <EditorTimeline 
              duration={duration} 
              startSec={startSec} 
              endSec={endSec} 
              currentTime={currentTime}
              onBoundsChange={(s, e) => { setStartSec(s); setEndSec(e); }}
              onSeek={handleSeek}
              onScrubStateChange={(state) => {
                isScrubbing.current = state;
                if (state) setPaused(true); 
              }}
            />

            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>شروع (s)</Text>
                <TextInput 
                  style={styles.input} keyboardType="numeric" 
                  value={startSec.toFixed(1)} 
                  onChangeText={(val) => {
                    const num = parseFloat(val);
                    if(!isNaN(num) && num < endSec) { setStartSec(num); handleSeek(num); }
                  }} 
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>پایان (s)</Text>
                <TextInput 
                  style={styles.input} keyboardType="numeric" 
                  value={endSec.toFixed(1)} 
                  onChangeText={(val) => {
                    const num = parseFloat(val);
                    if(!isNaN(num) && num > startSec && num <= duration) { setEndSec(num); handleSeek(num); }
                  }} 
                />
              </View>
            </View>

            <View style={{flexDirection: 'row-reverse', gap: 10, marginTop: 15}}>
              <TouchableOpacity style={[styles.convertButton, {flex: 1, backgroundColor: '#95a5a6'}]} onPress={() => { setSelectedVideo(null); setPaused(true); }}>
                <Text style={styles.convertButtonText}>لغو</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.convertButton, {flex: 2, backgroundColor: '#27ae60'}]} onPress={handleTrim} disabled={isLoading}>
                {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.convertButtonText}>بُـرش دادن</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <Text style={styles.sectionTitle}>تاریخچه خروجی‌ها</Text>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View style={styles.historyCard}>
            <TouchableOpacity style={styles.absoluteDeleteBtn} onPress={() => handleDelete(item.id)}>
              <Trash2 color="#e74c3c" size={18} />
            </TouchableOpacity>
            <View style={styles.historyContent}>
              <View style={styles.iconWrapper}><FileVideo color="#2980b9" size={30} /></View>
              <View style={[styles.infoBox, { paddingRight: 40 }]}>
                <Text style={styles.historyTitle} numberOfLines={1}>{item.title}</Text>
                <View style={styles.metaDataRow}>
                  <Text style={styles.metaText}>{item.size}</Text>
                  <Text style={styles.metaDivider}>|</Text>
                  <Text style={styles.metaText}>{item.format}</Text> 
                </View>
              </View>
            </View>
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity style={[styles.actionBtn, styles.saveBtn]} onPress={() => handleSaveToDevice(item)}>
                <Download color="#27ae60" size={16} />
                <View style={styles.actionTextCol}>
                  <Text style={[styles.actionText, {color: '#27ae60'}]}>ذخیره فایل</Text>
                  {savedItems[item.id] && <Text style={styles.savedSuccessText}>✓ ذخیره شد</Text>}
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.shareBtn]} onPress={() => handleShare(item.resultPath)}>
                <Share2 color="#3498db" size={16} /><Text style={[styles.actionText, {color: '#3498db'}]}>اشتراک</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const sliderStyles = StyleSheet.create({
  container: { height: 60, width: '100%', justifyContent: 'center', marginVertical: 10, position: 'relative' },
  track: { height: 35, backgroundColor: '#e1e8ed', borderRadius: 8, width: '100%', position: 'absolute' },
  selectedTrack: { height: 35, backgroundColor: 'rgba(52, 152, 219, 0.4)', borderWidth: 2, borderColor: COLORS.primary, position: 'absolute' },
  thumbLeft: { width: 18, height: 40, backgroundColor: COLORS.primary, borderTopLeftRadius: 6, borderBottomLeftRadius: 6, position: 'absolute', justifyContent: 'center', alignItems: 'center' },
  thumbRight: { width: 18, height: 40, backgroundColor: COLORS.primary, borderTopRightRadius: 6, borderBottomRightRadius: 6, position: 'absolute', justifyContent: 'center', alignItems: 'center' },
  thumbGrip: { width: 2, height: 15, backgroundColor: '#fff', borderRadius: 2 },
  playhead: { position: 'absolute', width: 14, height: 50, alignItems: 'center', zIndex: 10, marginLeft: -7 },
  playheadTop: { width: 12, height: 12, backgroundColor: '#fff', borderRadius: 6, elevation: 4 },
  playheadLine: { width: 2, flex: 1, backgroundColor: '#fff', elevation: 4 }
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  actionBox: { backgroundColor: '#fff', padding: 20, borderRadius: 15, elevation: 3, marginBottom: 25 },
  actionHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', marginBottom: 20, gap: 10 },
  actionTitle: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50' },
  convertButton: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 10, alignItems: 'center' },
  convertButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  editorBox: { backgroundColor: '#f8f9fa', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#e1e8ed' },
  playerContainer: { width: '100%', height: 220, backgroundColor: '#000', borderRadius: 10, overflow: 'hidden', marginBottom: 10, position: 'relative' },
  videoPlayer: { width: '100%', height: '100%' },
  playPauseBtn: { position: 'absolute', bottom: 10, left: 10, backgroundColor: 'rgba(0,0,0,0.6)', padding: 10, borderRadius: 25, zIndex: 10 },
  
  timeInfoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 5 },
  timeText: { fontSize: 11, color: '#95a5a6', fontWeight: 'bold' },
  timeTextDark: { fontSize: 12, color: '#34495e', fontWeight: 'bold' },
  
  inputRow: { flexDirection: 'row-reverse', gap: 15, marginBottom: 5 },
  inputGroup: { flex: 1 },
  inputLabel: { fontSize: 12, color: '#7f8c8d', textAlign: 'right', marginBottom: 5, fontWeight: 'bold' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#dcdde1', borderRadius: 8, height: 45, textAlign: 'center', fontSize: 16 },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'right', color: '#333' },
  historyCard: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 15, elevation: 2, overflow: 'hidden', position: 'relative' },
  absoluteDeleteBtn: { position: 'absolute', top: 10, right: 10, zIndex: 10, padding: 6, backgroundColor: 'rgba(253, 237, 236, 0.9)', borderRadius: 8 },
  historyContent: { flexDirection: 'row-reverse', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f1f2f6', alignItems: 'center' },
  iconWrapper: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#eaf2f8', justifyContent: 'center', alignItems: 'center', marginLeft: 15 },
  infoBox: { flex: 1, alignItems: 'flex-end', justifyContent: 'center' },
  historyTitle: { fontWeight: 'bold', fontSize: 14, color: '#2c3e50', marginBottom: 6, textAlign: 'right', direction: 'ltr' },
  metaDataRow: { flexDirection: 'row-reverse', alignItems: 'center' },
  metaText: { fontSize: 11, color: '#7f8c8d', fontWeight: 'bold' },
  metaDivider: { marginHorizontal: 6, color: '#bdc3c7', fontSize: 10 },
  actionButtonsRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', padding: 10, gap: 8, backgroundColor: '#fafbfc' },
  actionBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, gap: 5 },
  saveBtn: { flex: 1.2, backgroundColor: '#e9f7ef' },
  shareBtn: { flex: 1, backgroundColor: '#ebf5fb' },
  actionTextCol: { alignItems: 'center' },
  actionText: { fontSize: 12, fontWeight: 'bold' },
  savedSuccessText: { color: '#27ae60', fontSize: 10, fontWeight: 'bold', marginTop: 2 },
});

export default VideoTrimScreen;