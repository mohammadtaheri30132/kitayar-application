import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, TextInput, 
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Modal, Switch, NativeModules, Image, Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, Image as ImageIcon, Mic, X, Play, Type } from 'lucide-react-native';
import { PlanningService } from '../../api/planningService';
import { getTodayJalali } from '../../utils/date/jalaliHelper';
import ImagePicker from 'react-native-image-crop-picker';

const { PersianDatePicker, AudioRecorderModule, AudioToTextModule } = NativeModules;

const PASTEL_COLORS = [
  '#fef08a', // yellow
  '#bae6fd', // blue
  '#bbf7d0', // green
  '#fecdd3', // pink
  '#e9d5ff', // purple
  '#fed7aa', // orange
  '#f8fafc', // almost white
];

interface Block {
  id: string;
  type: 'text' | 'image' | 'voice';
  content: string;
}

const AddNoteScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  
  const existingNote = route.params?.note;
  const isEditing = !!existingNote;

  const [title, setTitle] = useState(existingNote?.title || '');
  const [blocks, setBlocks] = useState<Block[]>(
    existingNote?.blocks && existingNote.blocks.length > 0 
      ? existingNote.blocks.map((b: any, i: number) => ({ id: i.toString(), type: b.type, content: b.content }))
      : [{ id: '1', type: 'text', content: existingNote?.content || '' }]
  );
  const [color, setColor] = useState(existingNote?.color || PASTEL_COLORS[0]);

  // Save Modal
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const { jy, jm, jd } = getTodayJalali();
  const [selectedDateStr, setSelectedDateStr] = useState(existingNote?.date || `${jy}-${jm.toString().padStart(2, '0')}-${jd.toString().padStart(2, '0')}`);
  
  const [isClassRelated, setIsClassRelated] = useState(!!existingNote?.classId || !!route.params?.classId);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(existingNote?.classId?._id || existingNote?.classId || route.params?.classId || null);
  const [classes, setClasses] = useState<any[]>([]);

  useEffect(() => {
    if (route.params?.classId) {
      setIsClassRelated(true);
    }
    PlanningService.getClasses().then(res => {
      if (res.success) setClasses(res.data);
    }).catch(console.warn);
  }, [route.params?.classId]);

  const updateTextBlock = (id: string, text: string) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, content: text } : b));
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
  };

  const addImageBlock = () => {
    Alert.alert(
      "انتخاب تصویر",
      "از کجا می‌خواهید تصویر را انتخاب کنید؟",
      [
        { text: "دوربین", onPress: () => openCamera() },
        { text: "گالری", onPress: () => openGallery() },
        { text: "انصراف", style: "cancel" }
      ]
    );
  };

  const openCamera = async () => {
    try {
      const image = await ImagePicker.openCamera({ cropping: false });
      setBlocks([...blocks, { id: Date.now().toString(), type: 'image', content: image.path }, { id: (Date.now()+1).toString(), type: 'text', content: '' }]);
    } catch (e) {
      console.log('Camera error', e);
    }
  };

  const openGallery = async () => {
    try {
      const image = await ImagePicker.openPicker({ cropping: false });
      setBlocks([...blocks, { id: Date.now().toString(), type: 'image', content: image.path }, { id: (Date.now()+1).toString(), type: 'text', content: '' }]);
    } catch (e) {
      console.log('Gallery error', e);
    }
  };

  const handleSpeechToText = async () => {
    try {
      const spokenText = await AudioToTextModule.startListening('fa-IR');
      if (spokenText) {
        // Append to the last text block if available, or create a new one
        const newBlocks = [...blocks];
        const lastBlock = newBlocks[newBlocks.length - 1];
        if (lastBlock && lastBlock.type === 'text') {
          lastBlock.content = lastBlock.content ? lastBlock.content + ' ' + spokenText : spokenText;
        } else {
          newBlocks.push({ id: Date.now().toString(), type: 'text', content: spokenText });
        }
        setBlocks(newBlocks);
      }
    } catch (e) {
      console.warn('Speech to text failed', e);
    }
  };

  const openDatePicker = async () => {
    try {
      const parts = selectedDateStr.split('-');
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      
      const res = await PersianDatePicker.show({ year: y, month: m, day: d });
      if (res) {
        setSelectedDateStr(`${res.year}-${res.month.toString().padStart(2, '0')}-${res.day.toString().padStart(2, '0')}`);
      }
    } catch (e) {
      console.log('User cancelled or error', e);
    }
  };

  const handleFinalSave = async () => {
    // Join all text blocks to provide a fallback plain text 'content' field as required by the schema
    const combinedText = blocks.filter(b => b.type === 'text').map(b => b.content).join('\n').trim();
    if (!combinedText && blocks.filter(b => b.type !== 'text').length === 0) return;

    setIsSaving(true);
    try {
      const payload = {
        title,
        content: combinedText || 'بدون متن',
        color,
        date: selectedDateStr,
        classId: isClassRelated ? selectedClassId : undefined,
        blocks: blocks
      };

      if (isEditing) {
        await PlanningService.updateNote(existingNote._id, payload);
      } else {
        await PlanningService.createNote(payload);
      }
      setSaveModalVisible(false);
      navigation.goBack();
    } catch (e) {
      console.warn(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: color }]}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <ChevronRight size={28} color="#334155" />
        </TouchableOpacity>
        
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.saveHeaderBtn} onPress={() => setSaveModalVisible(true)}>
            <Text style={styles.saveHeaderBtnText}>ذخیره نوشته</Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content}>
          <TextInput
            style={styles.titleInput}
            placeholder="موضوع..."
            placeholderTextColor="rgba(0,0,0,0.3)"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
          
          <TouchableOpacity onPress={openDatePicker}>
            <Text style={styles.dateLabel}>تاریخ: {selectedDateStr.replace(/-/g, '/')}</Text>
          </TouchableOpacity>

          {blocks.map((block, index) => {
            if (block.type === 'text') {
              return (
                <TextInput
                  key={block.id}
                  style={styles.mainInput}
                  placeholder={index === 0 ? "نوشتن را شروع کنید..." : ""}
                  placeholderTextColor="rgba(0,0,0,0.3)"
                  multiline
                  value={block.content}
                  onChangeText={(text) => updateTextBlock(block.id, text)}
                  textAlignVertical="top"
                  scrollEnabled={false}
                />
              );
            } else if (block.type === 'image') {
              return (
                <View key={block.id} style={styles.mediaBlock}>
                  <Image source={{ uri: block.content }} style={styles.imageMock} />
                  <TouchableOpacity style={styles.removeMediaBtn} onPress={() => removeBlock(block.id)}>
                    <X size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              );
            }
            return null;
          })}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Toolbar */}
      <View style={[styles.toolbar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.toolsLeft}>
          <TouchableOpacity style={styles.toolBtn} onPress={addImageBlock}>
            <ImageIcon size={22} color="#334155" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolBtn} onPress={handleSpeechToText}>
            <Mic size={22} color="#334155" />
          </TouchableOpacity>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorsList}>
          {PASTEL_COLORS.map(c => (
            <TouchableOpacity 
              key={c}
              style={[styles.colorCircle, { backgroundColor: c }, color === c && styles.colorCircleSelected]}
              onPress={() => setColor(c)}
            />
          ))}
        </ScrollView>
      </View>


      {/* Save Settings Modal */}
      <Modal visible={saveModalVisible} transparent animationType="slide">
        <View style={[styles.modalOverlay, { paddingBottom: insets.bottom, paddingTop: insets.top }]}>
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 24) }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>تنظیمات ذخیره‌سازی</Text>
              <TouchableOpacity onPress={() => setSaveModalVisible(false)}><X size={24} color="#64748b" /></TouchableOpacity>
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.label}>مربوط به کلاس خاصی است؟</Text>
              <Switch value={isClassRelated} onValueChange={setIsClassRelated} trackColor={{ true: '#3b82f6' }} />
            </View>

            {isClassRelated && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24, maxHeight: 50 }} contentContainerStyle={{ gap: 8 }}>
                {classes.map((cls) => (
                  <TouchableOpacity 
                    key={cls._id} 
                    style={[styles.chip, selectedClassId === cls._id && styles.chipActive]}
                    onPress={() => setSelectedClassId(cls._id)}
                  >
                    <Text style={[styles.chipText, selectedClassId === cls._id && { color: '#fff' }]}>{cls.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <View style={styles.dateSelectorRow}>
              <Text style={styles.label}>تاریخ ثبت نوشته:</Text>
              <TouchableOpacity style={styles.nativeDateBtn} onPress={openDatePicker}>
                <Text style={styles.nativeDateText}>{selectedDateStr.replace(/-/g, '/')}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.finalSaveBtn]} 
              onPress={handleFinalSave}
              disabled={isSaving}
            >
              {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.finalSaveBtnText}>ذخیره نهایی</Text>}
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  iconBtn: { padding: 4 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  saveHeaderBtn: { backgroundColor: '#334155', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  saveHeaderBtnText: { color: '#fff', fontSize: 13, fontFamily: 'IRANSansX', fontWeight: 'bold' },
  
  content: { padding: 20, paddingBottom: 100 },
  titleInput: { fontSize: 28, fontFamily: 'IRANSansX', fontWeight: 'bold', color: '#0f172a', textAlign: 'right', marginBottom: 8 },
  dateLabel: { fontSize: 12, fontFamily: 'IRANSansX', color: 'rgba(0,0,0,0.4)', textAlign: 'right', marginBottom: 20 },
  
  mainInput: { fontSize: 18, fontFamily: 'IRANSansX', color: '#1e293b', minHeight: 60, lineHeight: 32 },
  
  mediaBlock: { marginVertical: 12, borderRadius: 16, overflow: 'hidden', position: 'relative' },
  imageMock: { width: '100%', height: 200, resizeMode: 'cover', borderRadius: 16 },
  removeMediaBtn: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.5)', padding: 6, borderRadius: 16 },
  
  voiceBlock: { marginVertical: 12, flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  voiceInner: { flex: 1, backgroundColor: '#fff', borderRadius: 24, padding: 8, flexDirection: 'row-reverse', alignItems: 'center', gap: 12, elevation: 1 },
  playBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center' },
  waveform: { flex: 1, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2 },
  voiceDuration: { fontSize: 12, fontFamily: 'IRANSansX', color: '#64748b', marginRight: 8 },
  removeMediaBtnSmall: { padding: 8 },

  // Toolbar
  toolbar: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 16, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)',
    position: 'absolute', bottom: 0, width: '100%'
  },
  toolsLeft: { flexDirection: 'row-reverse', gap: 16 },
  toolBtn: { padding: 8, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 12 },
  
  colorsList: { gap: 12, paddingLeft: 16 },
  colorCircle: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  colorCircleSelected: { borderWidth: 3, borderColor: '#334155' },

  // Save Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 18, fontFamily: 'IRANSansX', fontWeight: 'bold', color: '#0f172a' },
  switchRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  label: { fontSize: 14, fontFamily: 'IRANSansX', fontWeight: 'bold', color: '#334155', textAlign: 'right' },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0', marginLeft: 8 },
  chipActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  chipText: { fontSize: 13, fontFamily: 'IRANSansX', color: '#475569' },
  
  dateSelectorRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, marginTop: 12 },
  nativeDateBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  nativeDateText: { fontSize: 16, fontFamily: 'IRANSansX', fontWeight: 'bold', color: '#334155' },

  finalSaveBtn: { backgroundColor: '#3b82f6', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  finalSaveBtnText: { color: '#fff', fontSize: 16, fontFamily: 'IRANSansX', fontWeight: 'bold' }
});

export default AddNoteScreen;
