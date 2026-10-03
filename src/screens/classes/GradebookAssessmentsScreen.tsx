import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  FlatList,
  Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, Plus, FileText, PieChart } from 'lucide-react-native';
import { COLORS } from '../../theme/colors';

const GradebookAssessmentsScreen = ({ route, navigation }: any) => {
  const { currentClassId, currentClassName } = route.params;
  const insets = useSafeAreaInsets();
  
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState<any[]>([]);

  useEffect(() => {
    // Mocking Data
    setTimeout(() => {
      setAssessments([
        { id: '1', title: 'کوییز ۱', type: 'کوییز', date: '۱۴۰۲/۰۷/۱۵', maxScore: 20, weight: 10, average: 17.5 },
        { id: '2', title: 'فعالیت کلاسی', type: 'فعالیت', date: '۱۴۰۲/۰۷/۲۰', maxScore: 20, weight: 20, average: 18.2 },
        { id: '3', title: 'آزمون میان‌ترم', type: 'آزمون', date: '۱۴۰۲/۰۸/۱۰', maxScore: 20, weight: 40, average: 16.8 },
      ]);
      setLoading(false);
    }, 800);
  }, []);

  const renderAssessmentItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
           <View style={styles.iconContainer}>
             <FileText size={20} color={COLORS.primary} />
           </View>
           <Text style={styles.title}>{item.title}</Text>
        </View>
        <Text style={styles.typeBadge}>{item.type}</Text>
      </View>
      <View style={styles.cardBody}>
         <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>تاریخ:</Text>
            <Text style={styles.infoValue}>{item.date}</Text>
         </View>
         <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>حداکثر نمره:</Text>
            <Text style={styles.infoValue}>{item.maxScore}</Text>
         </View>
         <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ضریب تأثیر:</Text>
            <Text style={styles.infoValue}>{item.weight}٪</Text>
         </View>
      </View>
      <View style={styles.cardFooter}>
         <View style={styles.statsContainer}>
            <PieChart size={16} color={COLORS.textLight} />
            <Text style={styles.statsText}>میانگین: {item.average}</Text>
         </View>
         <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>مشاهده نمرات</Text>
         </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronRight size={24} color={COLORS.textLight} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>مدیریت ارزیابی‌ها</Text>
          <Text style={styles.headerSubtitle}>{currentClassName}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <TouchableOpacity style={styles.createButton} activeOpacity={0.8}>
           <Plus size={20} color="#ffffff" style={{ marginLeft: 8 }} />
           <Text style={styles.createButtonText}>تعریف ارزیابی جدید</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : assessments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FileText size={48} color={COLORS.border} style={{ marginBottom: 16 }} />
            <Text style={styles.emptyText}>هیچ ارزیابی‌ای تعریف نشده است.</Text>
            <Text style={styles.emptySubText}>برای شروع ثبت نمرات، ابتدا یک ارزیابی تعریف کنید.</Text>
          </View>
        ) : (
          <FlatList
            data={assessments}
            keyExtractor={(item) => item.id}
            renderItem={renderAssessmentItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16, 
    backgroundColor: COLORS.surface, 
    elevation: 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  backButton: { padding: 8 },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  headerSubtitle: { fontSize: 13, color: COLORS.textLight, marginTop: 4 },
  
  content: { flex: 1 },
  
  createButton: {
     backgroundColor: COLORS.primary,
     flexDirection: 'row-reverse',
     alignItems: 'center',
     justifyContent: 'center',
     padding: 14,
     margin: 16,
     borderRadius: 12,
     elevation: 2,
  },
  createButtonText: {
     color: '#ffffff',
     fontSize: 15,
     fontWeight: 'bold',
  },

  listContent: { padding: 16, paddingTop: 0, paddingBottom: 100 },
  
  card: {
     backgroundColor: COLORS.surface,
     borderRadius: 16,
     padding: 16,
     marginBottom: 16,
     borderWidth: 1,
     borderColor: COLORS.border,
     elevation: 1,
  },
  cardHeader: {
     flexDirection: 'row-reverse',
     justifyContent: 'space-between',
     alignItems: 'center',
     marginBottom: 16,
  },
  titleContainer: {
     flexDirection: 'row-reverse',
     alignItems: 'center',
  },
  iconContainer: {
     width: 40,
     height: 40,
     borderRadius: 20,
     backgroundColor: '#eff6ff',
     justifyContent: 'center',
     alignItems: 'center',
     marginLeft: 12,
  },
  title: {
     fontSize: 16,
     fontWeight: 'bold',
     color: COLORS.text,
  },
  typeBadge: {
     backgroundColor: '#f1f5f9',
     color: COLORS.textLight,
     paddingHorizontal: 10,
     paddingVertical: 4,
     borderRadius: 8,
     fontSize: 12,
     fontWeight: 'bold',
  },
  cardBody: {
     marginBottom: 16,
  },
  infoRow: {
     flexDirection: 'row-reverse',
     alignItems: 'center',
     marginBottom: 6,
  },
  infoLabel: {
     width: 90,
     fontSize: 13,
     color: COLORS.textLight,
     textAlign: 'right',
     marginLeft: 8,
  },
  infoValue: {
     fontSize: 14,
     fontWeight: '600',
     color: COLORS.text,
     textAlign: 'right',
  },
  cardFooter: {
     flexDirection: 'row-reverse',
     justifyContent: 'space-between',
     alignItems: 'center',
     borderTopWidth: 1,
     borderTopColor: '#f1f5f9',
     paddingTop: 12,
  },
  statsContainer: {
     flexDirection: 'row-reverse',
     alignItems: 'center',
  },
  statsText: {
     fontSize: 13,
     color: COLORS.textLight,
     marginRight: 6,
     fontWeight: 'bold',
  },
  editButton: {
     paddingHorizontal: 12,
     paddingVertical: 6,
     borderRadius: 8,
     backgroundColor: '#eff6ff',
  },
  editButtonText: {
     color: COLORS.primary,
     fontSize: 13,
     fontWeight: 'bold',
  },
  
  emptyContainer: {
     flex: 1,
     justifyContent: 'center',
     alignItems: 'center',
     padding: 20,
  },
  emptyText: {
     fontSize: 16,
     fontWeight: 'bold',
     color: COLORS.text,
     marginBottom: 8,
     textAlign: 'center',
  },
  emptySubText: {
     fontSize: 14,
     color: COLORS.textLight,
     textAlign: 'center',
     lineHeight: 22,
  }
});

export default GradebookAssessmentsScreen;
