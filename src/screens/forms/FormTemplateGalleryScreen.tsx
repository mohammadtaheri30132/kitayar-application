import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowRight,
  Sparkles,
  HelpCircle,
  FileCheck,
  Award,
  Users,
  Mic,
  Calendar,
  ChevronLeft,
} from 'lucide-react-native';
import { formService, FormTemplateItem } from '../../services/forms/formService';
import { COLORS } from '../../theme/colors';

interface FormTemplateGalleryScreenProps {
  navigation: any;
}

export const FormTemplateGalleryScreen: React.FC<FormTemplateGalleryScreenProps> = ({ navigation }) => {
  const [templates, setTemplates] = useState<FormTemplateItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [creating, setCreating] = useState<boolean>(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const data = await formService.getTemplates();
      setTemplates(data);
    } catch (err: any) {
      Alert.alert('خطا', 'خطا در دریافت قالب‌ها');
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = async (template: FormTemplateItem) => {
    try {
      setCreating(true);
      const created = await formService.createForm({
        templateId: template.id,
        title: template.title,
      });
      setCreating(false);
      navigation.replace('CreateOrEditFormScreen', { formId: created._id });
    } catch (err: any) {
      setCreating(false);
      Alert.alert('خطا', 'ساخت فرم از قالب ناموفق بود');
    }
  };

  const getTemplateIcon = (formType: string) => {
    switch (formType) {
      case 'quiz':
        return <Award size={24} color="#16a34a" />;
      case 'student_survey':
        return <Users size={24} color="#2563eb" />;
      case 'assignment':
        return <Mic size={24} color="#9333ea" />;
      case 'attendance':
        return <Calendar size={24} color="#0284c7" />;
      case 'feedback':
        return <HelpCircle size={24} color="#d97706" />;
      default:
        return <Sparkles size={24} color="#475569" />;
    }
  };

  const renderTemplateCard = ({ item }: { item: FormTemplateItem }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.iconBox}>{getTemplateIcon(item.formType)}</View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.category}</Text>
        </View>
      </View>

      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardDesc} numberOfLines={3}>
        {item.description}
      </Text>

      <View style={styles.questionsPreviewRow}>
        <Text style={styles.qCountText}>{item.questions.length} سوال آماده</Text>
        <Text style={styles.modeText}>
          {item.theme.mode === 'conversational' ? 'حالت تعاملی (تک‌سواله)' : 'حالت سنتی (یکپارچه)'}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.useBtn}
        onPress={() => handleUseTemplate(item)}
        activeOpacity={0.8}
        disabled={creating}
      >
        <Text style={styles.useBtnText}>استفاده از این قالب</Text>
        <ChevronLeft size={18} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ArrowRight size={22} color="#1e293b" />
        </TouchableOpacity>

        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>قالب‌های آماده فرم</Text>
          <Text style={styles.headerSubtitle}>شروع سریع با قالب‌های استاندارد آموزشی</Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>در حال دریافت قالب‌های آموزشی...</Text>
        </View>
      ) : (
        <FlatList
          data={templates}
          keyExtractor={(item) => item.id}
          renderItem={renderTemplateCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {creating && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingBoxText}>در حال آماده‌سازی و ساخت فرم...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleBox: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'left',
  },
  cardDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 14,
    textAlign: 'left',
  },
  questionsPreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginBottom: 14,
  },
  qCountText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: 'bold',
  },
  modeText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  useBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
  },
  useBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
    marginLeft: 6,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748B',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingBox: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 8,
  },
  loadingBoxText: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
  },
});

export default FormTemplateGalleryScreen;
