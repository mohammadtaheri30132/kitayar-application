import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  Share,
  RefreshControl,
  Modal,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Plus,
  Search,
  Share2,
  Copy,
  BarChart2,
  Edit3,
  Eye,
  MoreVertical,
  Trash2,
  Layers,
  CheckCircle,
  Clock,
  Lock,
  ArrowRight,
  Filter,
  FileSpreadsheet,
  FileText,
} from 'lucide-react-native';
import { formService, FormDataModel } from '../../services/forms/formService';
import { COLORS } from '../../theme/colors';
import { formatIsoToJalali } from '../../utils/date/jalaliHelper';

interface FormDashboardScreenProps {
  navigation: any;
}

export const FormDashboardScreen: React.FC<FormDashboardScreenProps> = ({ navigation }) => {
  const [forms, setForms] = useState<FormDataModel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedFormForMenu, setSelectedFormForMenu] = useState<FormDataModel | null>(null);
  const [actionMenuVisible, setActionMenuVisible] = useState<boolean>(false);

  const fetchForms = useCallback(async () => {
    try {
      setLoading(true);
      const data = await formService.getForms({
        status: statusFilter,
        search: searchQuery,
      });
      setForms(data);
    } catch (err: any) {
      Alert.alert('خطا', err?.response?.data?.message || 'خطا در بارگذاری لیست فرم‌ها');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchForms();
  };

  const handleCopyLink = (form: FormDataModel) => {
    const url = formService.getPublicFormUrl(form.publicSlug);
    Clipboard.setString(url);
    Alert.alert('لینک کپی شد', 'لینک عمومی فرم با موفقیت در حافظه کپی شد:\n' + url);
    setActionMenuVisible(false);
  };

  const handleShareLink = async (form: FormDataModel) => {
    setActionMenuVisible(false);
    const url = formService.getPublicFormUrl(form.publicSlug);
    try {
      await Share.share({
        title: form.title,
        message: `دعوت به تکمیل فرم «${form.title}» در کیتایار:\n${url}`,
        url,
      });
    } catch (err) {}
  };

  const handleDuplicate = async (form: FormDataModel) => {
    setActionMenuVisible(false);
    try {
      setLoading(true);
      await formService.duplicateForm(form._id);
      fetchForms();
      Alert.alert('موفق', 'فرم با موفقیت کپی شد');
    } catch (err: any) {
      setLoading(false);
      Alert.alert('خطا', 'کپی فرم با خطا مواجه شد');
    }
  };

  const handleToggleStatus = async (form: FormDataModel) => {
    setActionMenuVisible(false);
    const newStatus = form.status === 'published' ? 'closed' : 'published';
    try {
      setLoading(true);
      await formService.updateStatus(form._id, newStatus);
      fetchForms();
    } catch (err) {
      setLoading(false);
      Alert.alert('خطا', 'تغییر وضعیت فرم ناموفق بود');
    }
  };

  const confirmCloseForm = (form: FormDataModel) => {
    Alert.alert(
      'بستن فرم',
      `آیا از بستن فرم «${form.title}» و متوقف کردن دریافت پاسخ اطمینان دارید؟\nپس از بستن، مخاطبان امکان ارسال پاسخ جدید نخواهند داشت.`,
      [
        { text: 'انصراف', style: 'cancel' },
        {
          text: 'بستن فرم',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await formService.updateStatus(form._id, 'closed');
              fetchForms();
            } catch (e) {
              setLoading(false);
              Alert.alert('خطا', 'خطا در بستن فرم');
            }
          },
        },
      ]
    );
  };

  const confirmReopenForm = (form: FormDataModel) => {
    Alert.alert(
      'بازگشایی فرم',
      `آیا مایل به فعال‌سازی مجدد فرم «${form.title}» هستید؟`,
      [
        { text: 'انصراف', style: 'cancel' },
        {
          text: 'فعال‌سازی',
          onPress: async () => {
            try {
              setLoading(true);
              await formService.updateStatus(form._id, 'published');
              fetchForms();
            } catch (e) {
              setLoading(false);
              Alert.alert('خطا', 'خطا در فعال‌سازی فرم');
            }
          },
        },
      ]
    );
  };

  const handleDelete = (form: FormDataModel) => {
    setActionMenuVisible(false);
    Alert.alert(
      'حذف فرم',
      `آیا از حذف کامل فرم «${form.title}» و تمام پاسخ‌های آن اطمینان دارید؟`,
      [
        { text: 'انصراف', style: 'cancel' },
        {
          text: 'حذف دائمی',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await formService.deleteForm(form._id);
              fetchForms();
            } catch (err) {
              setLoading(false);
              Alert.alert('خطا', 'حذف فرم با خطا مواجه شد');
            }
          },
        },
      ]
    );
  };

  const openActionMenu = (form: FormDataModel) => {
    setSelectedFormForMenu(form);
    setActionMenuVisible(true);
  };

  // Metrics
  const totalResponses = forms.reduce((acc, f) => acc + (f.responseCount || 0), 0);
  const publishedCount = forms.filter((f) => f.status === 'published').length;

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return (
          <View style={[styles.statusBadge, { backgroundColor: '#dcfce7' }]}>
            <CheckCircle size={12} color="#15803d" style={{ marginLeft: 4 }} />
            <Text style={[styles.statusBadgeText, { color: '#15803d' }]}>منتشر شده</Text>
          </View>
        );
      case 'closed':
        return (
          <View style={[styles.statusBadge, { backgroundColor: '#f1f5f9' }]}>
            <Lock size={12} color="#64748b" style={{ marginLeft: 4 }} />
            <Text style={[styles.statusBadgeText, { color: '#64748b' }]}>بسته شده</Text>
          </View>
        );
      default:
        return (
          <View style={[styles.statusBadge, { backgroundColor: '#fef3c7' }]}>
            <Clock size={12} color="#b45309" style={{ marginLeft: 4 }} />
            <Text style={[styles.statusBadgeText, { color: '#b45309' }]}>پیش‌نویس</Text>
          </View>
        );
    }
  };

  const renderFormCard = ({ item }: { item: FormDataModel }) => (
    <View style={styles.formCard}>
      {/* Top Header of Card */}
      <View style={styles.cardHeader}>
        <View style={styles.cardMetaRight}>
          {renderStatusBadge(item.status)}
        </View>

        <TouchableOpacity
          style={styles.menuIconBtn}
          onPress={() => openActionMenu(item)}
          activeOpacity={0.7}
        >
          <MoreVertical size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* Title & Description */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.navigate('CreateOrEditFormScreen', { formId: item._id })}
      >
        <Text style={styles.formTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {item.description ? (
          <Text style={styles.formDesc} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
      </TouchableOpacity>

      {/* Info Row: Responses and Questions count */}
      <View style={styles.cardStatsRow}>
        <View style={styles.statItem}>
          <FileText size={15} color="#3b82f6" style={{ marginLeft: 5 }} />
          <Text style={styles.statText}>{item.questions?.length || 0} سوال</Text>
        </View>

        <View style={styles.statItem}>
          <BarChart2 size={15} color="#10b981" style={{ marginLeft: 5 }} />
          <Text style={styles.statText}>{item.responseCount || 0} پاسخ دریافتی</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.dateText}>
            {item.status === 'published'
              ? `انتشار: ${formatIsoToJalali(item.publishedAt || item.createdAt)}`
              : item.status === 'closed'
              ? `بسته شده: ${formatIsoToJalali(item.updatedAt || item.createdAt)}`
              : item.status === 'scheduled'
              ? `زمان‌بندی: ${formatIsoToJalali(item.settings?.startDate || item.createdAt)}`
              : `پیش‌نویس: ${formatIsoToJalali(item.createdAt)}`}
          </Text>
        </View>
      </View>

      {/* Action Buttons Row with Short Labels & Icons */}
      <View style={styles.cardActionsRow}>
        {/* Results Button */}
        <TouchableOpacity
          style={styles.actionBtnLabel}
          onPress={() => navigation.navigate('FormResponsesScreen', { formId: item._id, formTitle: item.title })}
          activeOpacity={0.7}
        >
          <BarChart2 size={15} color="#3b82f6" style={{ marginLeft: 4 }} />
          <Text style={[styles.actionBtnLabelText, { color: '#2563eb' }]}>نتایج</Text>
        </TouchableOpacity>

        {/* Copy Link Button */}
        <TouchableOpacity
          style={styles.actionBtnLabel}
          onPress={() => handleCopyLink(item)}
          activeOpacity={0.7}
        >
          <Copy size={15} color="#475569" style={{ marginLeft: 4 }} />
          <Text style={styles.actionBtnLabelText}>کپی لینک</Text>
        </TouchableOpacity>

        {/* Edit Button */}
        <TouchableOpacity
          style={styles.actionBtnLabel}
          onPress={() => navigation.navigate('CreateOrEditFormScreen', { formId: item._id })}
          activeOpacity={0.7}
        >
          <Edit3 size={15} color="#475569" style={{ marginLeft: 4 }} />
          <Text style={styles.actionBtnLabelText}>ویرایش</Text>
        </TouchableOpacity>

        {/* Close Form or Reopen Button */}
        {item.status === 'published' ? (
          <TouchableOpacity
            style={[styles.actionBtnLabel, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}
            onPress={() => confirmCloseForm(item)}
            activeOpacity={0.7}
          >
            <Lock size={15} color="#ef4444" style={{ marginLeft: 4 }} />
            <Text style={[styles.actionBtnLabelText, { color: '#dc2626', fontWeight: 'bold' }]}>بستن فرم</Text>
          </TouchableOpacity>
        ) : item.status === 'closed' ? (
          <TouchableOpacity
            style={[styles.actionBtnLabel, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}
            onPress={() => confirmReopenForm(item)}
            activeOpacity={0.7}
          >
            <CheckCircle size={15} color="#16a34a" style={{ marginLeft: 4 }} />
            <Text style={[styles.actionBtnLabelText, { color: '#16a34a', fontWeight: 'bold' }]}>بازگشایی</Text>
          </TouchableOpacity>
        ) : null}
      </View>
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
          <Text style={styles.headerTitle}>فرم‌ها و نظرسنجی‌ها</Text>
          <Text style={styles.headerSubtitle}>مدیریت پرسشنامه‌ها و نظرسنجی‌ها</Text>
        </View>

        <TouchableOpacity
          style={styles.newHeaderBtn}
          onPress={() => navigation.navigate('CreateOrEditFormScreen')}
          activeOpacity={0.8}
        >
          <Plus size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Metric Cards Row */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricNumber}>{forms.length}</Text>
          <Text style={styles.metricLabel}>کل فرم‌ها</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={[styles.metricNumber, { color: '#10b981' }]}>{totalResponses}</Text>
          <Text style={styles.metricLabel}>پاسخ‌ها</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={[styles.metricNumber, { color: '#3b82f6' }]}>{publishedCount}</Text>
          <Text style={styles.metricLabel}>منتشر شده</Text>
        </View>
      </View>

      {/* Search & Filter Bar */}
      <View style={styles.filterSection}>
        <View style={styles.searchBox}>
          <Search size={18} color="#94a3b8" style={{ marginLeft: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="جستجو در عنوان یا توضیحات..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Status Filter Tabs */}
        <View style={styles.filterTabsRow}>
          {[
            { id: 'all', title: 'همه' },
            { id: 'published', title: 'منتشر شده' },
            { id: 'draft', title: 'پیش‌نویس' },
            { id: 'closed', title: 'بسته شده' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.filterTab, statusFilter === tab.id && styles.filterTabActive]}
              onPress={() => setStatusFilter(tab.id)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterTabText,
                  statusFilter === tab.id && styles.filterTabTextActive,
                ]}
              >
                {tab.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Forms List */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>در حال دریافت فرم‌ها...</Text>
        </View>
      ) : (
        <FlatList
          data={forms}
          keyExtractor={(item) => item._id}
          renderItem={renderFormCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Layers size={56} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>فرمی یافت نشد</Text>
              <Text style={styles.emptySubtitle}>
                هنوز فرمی نساخته‌اید یا با این فیلتر نتیجه‌ای وجود ندارد.
              </Text>
              <TouchableOpacity
                style={styles.emptyCreateBtn}
                onPress={() => navigation.navigate('CreateOrEditFormScreen')}
              >
                <Plus size={18} color="#ffffff" style={{ marginLeft: 6 }} />
                <Text style={styles.emptyCreateBtnText}>ایجاد اولین فرم</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Action Menu Bottom Sheet Modal */}
      <Modal
        visible={actionMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setActionMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setActionMenuVisible(false)}
        >
          <View style={styles.actionSheetContainer}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle} numberOfLines={1}>
              {selectedFormForMenu?.title}
            </Text>

            <TouchableOpacity
              style={styles.sheetActionItem}
              onPress={() => {
                if (selectedFormForMenu) {
                  setActionMenuVisible(false);
                  navigation.navigate('CreateOrEditFormScreen', { formId: selectedFormForMenu._id });
                }
              }}
            >
              <Edit3 size={18} color="#334155" style={{ marginLeft: 12 }} />
              <Text style={styles.sheetActionText}>ویرایش فرم و سوالات</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetActionItem}
              onPress={() => {
                if (selectedFormForMenu) {
                  setActionMenuVisible(false);
                  navigation.navigate('FormPreviewScreen', { formId: selectedFormForMenu._id });
                }
              }}
            >
              <Eye size={18} color="#334155" style={{ marginLeft: 12 }} />
              <Text style={styles.sheetActionText}>پیش‌نمایش فرم</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetActionItem}
              onPress={() => selectedFormForMenu && handleCopyLink(selectedFormForMenu)}
            >
              <Copy size={18} color="#334155" style={{ marginLeft: 12 }} />
              <Text style={styles.sheetActionText}>کپی لینک عمومی</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetActionItem}
              onPress={() => selectedFormForMenu && handleShareLink(selectedFormForMenu)}
            >
              <Share2 size={18} color="#334155" style={{ marginLeft: 12 }} />
              <Text style={styles.sheetActionText}>اشتراک‌گذاری لینک</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetActionItem}
              onPress={() => selectedFormForMenu && handleDuplicate(selectedFormForMenu)}
            >
              <Copy size={18} color="#334155" style={{ marginLeft: 12 }} />
              <Text style={styles.sheetActionText}>کپی کردن فرم (Duplicate)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetActionItem}
              onPress={() => selectedFormForMenu && handleToggleStatus(selectedFormForMenu)}
            >
              <Lock size={18} color="#334155" style={{ marginLeft: 12 }} />
              <Text style={styles.sheetActionText}>
                {selectedFormForMenu?.status === 'published' ? 'بستن فرم (توقف پاسخ)' : 'انتشار مجدد فرم'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sheetActionItem, styles.sheetActionDanger]}
              onPress={() => selectedFormForMenu && handleDelete(selectedFormForMenu)}
            >
              <Trash2 size={18} color="#ef4444" style={{ marginLeft: 12 }} />
              <Text style={[styles.sheetActionText, { color: '#ef4444' }]}>حذف کامل فرم</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
    marginHorizontal: 10,
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
  newHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  metricNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  filterSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    textAlign: 'right',
  },
  filterTabsRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  filterTab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
  },
  filterTabText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardMetaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  categoryChip: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  categoryChipText: {
    fontSize: 11,
    color: '#475569',
  },
  menuIconBtn: {
    padding: 4,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    lineHeight: 22,
    textAlign: 'left',
  },
  formDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
    lineHeight: 18,
    textAlign: 'left',
  },
  cardStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  dateText: {
    fontSize: 11,
    color: '#94A3B8',
    marginRight: 'auto',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 8,
  },
  actionBtnLabel: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 10,
  },
  actionBtnLabelText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
  },
  resultsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 9,
    borderRadius: 10,
  },
  resultsBtnText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: 'bold',
  },
  iconActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748B',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#334155',
    marginTop: 14,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 240,
  },
  emptyCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 20,
  },
  emptyCreateBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  actionSheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 16,
  },
  sheetActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sheetActionDanger: {
    borderBottomWidth: 0,
    marginTop: 4,
  },
  sheetActionText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
  },
  newChoiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  choiceIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 14,
  },
  choiceTextBox: {
    flex: 1,
  },
  choiceTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  choiceDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 16,
  },
});

export default FormDashboardScreen;
