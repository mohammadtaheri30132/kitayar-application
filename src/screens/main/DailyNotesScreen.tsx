import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { ChevronRight, Plus, FileText, MoreVertical } from 'lucide-react-native';
import { PlanningService, DailyNote } from '../../api/planningService';
import AddNoteModal from '../../components/planning/AddNoteModal';

const DailyNotesScreen = ({ navigation }: any) => {
  const { colors } = useTheme();

  const [notesState, setNotesState] = useState<DailyNote[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchNotes = async () => {
    setIsRefreshing(true);
    try {
      const res = await PlanningService.getNotes();
      if (res.success && res.data) {
        setNotesState(res.data);
      }
    } catch (err) {
      console.warn('Failed to fetch notes', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleSaveNote = async (noteData: any) => {
    const res = await PlanningService.createNote(noteData);
    if (res.success) {
      fetchNotes();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronRight color={colors.text} size={28} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>یادداشت‌های روزانه</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={fetchNotes} colors={[colors.primary]} />}
      >
        
        {notesState.length === 0 ? (
          <Text style={[styles.emptyState, { color: colors.textLight }]}>هیچ یادداشتی وجود ندارد.</Text>
        ) : (
          <View style={styles.notesGrid}>
            {notesState.map(note => (
              <TouchableOpacity key={note._id || Math.random().toString()} style={[styles.noteCard, { backgroundColor: note.color || '#fef08a' }]} activeOpacity={0.8}>
                <View style={styles.noteHeader}>
                  <Text style={styles.noteDate}>{note.date}</Text>
                  <TouchableOpacity><MoreVertical color="#475569" size={16} /></TouchableOpacity>
                </View>
                {note.title && <Text style={styles.noteTitle}>{note.title}</Text>}
                <Text style={styles.noteContent}>{note.content}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} activeOpacity={0.8} onPress={() => setIsModalVisible(true)}>
        <Plus color="#fff" size={28} />
      </TouchableOpacity>

      <AddNoteModal 
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSave={handleSaveNote}
      />

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', fontFamily: 'IRANSansX' },
  
  content: { padding: 16, paddingBottom: 80 },
  emptyState: { fontSize: 14, fontFamily: 'IRANSansX', fontStyle: 'italic', textAlign: 'center', marginTop: 40 },

  notesGrid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between'
  },
  noteCard: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  noteHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8
  },
  noteDate: {
    fontSize: 11, fontFamily: 'IRANSansX', color: '#475569', fontWeight: 'bold'
  },
  noteTitle: {
    fontSize: 14, fontFamily: 'IRANSansX', color: '#0f172a', fontWeight: 'bold', marginBottom: 4
  },
  noteContent: {
    fontSize: 13, fontFamily: 'IRANSansX', color: '#1e293b', lineHeight: 22
  },

  fab: {
    position: 'absolute', bottom: 24, left: 24, width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center', elevation: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 5,
  }
});

export default DailyNotesScreen;
