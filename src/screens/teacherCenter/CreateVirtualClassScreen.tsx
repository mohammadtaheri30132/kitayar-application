import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../api/axiosConfig';
import {
  ChevronRight,
  Video,
  Wallet,
  Users,
  Plus,
  Minus,
  CheckCircle2,
  Copy,
  ExternalLink,
  UserPlus,
  X,
} from 'lucide-react-native';
import { FONT_FAMILY } from '../../theme/typography';
import { toPersianNumbers } from '../../utils/date/jalaliHelper';
import { toEnglishDigits } from '../../components/WeeklyScheduleManager';
import { showSuccess, showError, showWarning } from '../../components/feedback';


const FEE_PER_STUDENT = 50000;

export const CreateVirtualClassScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();

  const [className, setClassName] = useState('');
  const [subject, setSubject] = useState('ریاضی');
  const [studentCount, setStudentCount] = useState<number>(1);
  const [invitedStudents, setInvitedStudents] = useState<Array<{ phoneNumber: string; fullName: string }>>([]);
  const [invitePhoneInput, setInvitePhoneInput] = useState('');
  const [inviteNameInput, setInviteNameInput] = useState('');
  const [searchingPhone, setSearchingPhone] = useState(false);

  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loadingBalance, setLoadingBalance] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [createdClass, setCreatedClass] = useState<any | null>(null);

  const fetchWallet = async () => {
    try {
      setLoadingBalance(true);
      const res = await api.get('/teacher/center/wallet');
      if (res.data?.success && res.data.data?.balance !== undefined) {
        setWalletBalance(res.data.data.balance);
      }
    } catch (e) {
      console.warn('Error fetching wallet:', e);
    } finally {
      setLoadingBalance(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchWallet();
    }, [])
  );

  const handlePhoneInputChange = async (val: string) => {
    setInvitePhoneInput(val);
    const clean = toEnglishDigits(val).replace(/[^0-9]/g, '');
    if (clean.length === 11 && clean.startsWith('09')) {
      try {
        setSearchingPhone(true);
        const res = await api.get(`/teacher/center/search-student?phone=${clean}`);
        if (res.data?.success && res.data.exists && res.data.user?.fullName) {
          setInviteNameInput(res.data.user.fullName);
        }
      } catch {
      } finally {
        setSearchingPhone(false);
      }
    }
  };

  const handleAddInvitedStudent = () => {
    const clean = toEnglishDigits(invitePhoneInput).replace(/[^0-9]/g, '');
    if (clean.length < 10) {
      showWarning('لطفاً شماره موبایل معتبر دانش‌آموز را وارد کنید.');
      return;
    }
    if (invitedStudents.some((s) => s.phoneNumber === clean)) {
      showWarning('این شماره قبلاً به لیست دعوت اضافه شده است.');
      return;
    }
    const nextList = [
      ...invitedStudents,
      { phoneNumber: clean, fullName: inviteNameInput.trim() || 'دانش‌آموز دعوت‌شده' },
    ];
    setInvitedStudents(nextList);
    if (nextList.length > studentCount) {
      setStudentCount(Math.min(25, nextList.length));
    }
    setInvitePhoneInput('');
    setInviteNameInput('');
  };

  const handleRemoveInvitedStudent = (phone: string) => {
    setInvitedStudents((prev) => prev.filter((s) => s.phoneNumber !== phone));
  };

  const effectiveCount = Math.max(studentCount, invitedStudents.length || 1);
  const totalCost = effectiveCount * FEE_PER_STUDENT;
  const isBalanceSufficient = walletBalance >= totalCost;

  const handleCreate = async () => {
    if (!className.trim()) {
      showWarning('لطفاً عنوان کلاس را وارد کنید.');
      return;
    }
    if (!isBalanceSufficient) {
      showError('موجودی کیف پول شما برای ایجاد این کلاس کافی نیست.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/teacher/center/virtual-classroom', {
        name: className.trim(),
        title: className.trim(),
        subject: subject.trim(),
        maxStudents: effectiveCount,
        studentCount: effectiveCount,
        invitedStudents,
      });

      if (res.data?.success) {
        showSuccess('کلاس مجازی با موفقیت ایجاد و برای دانش‌آموزان دعوت‌شده ثبت شد.');
        setCreatedClass(res.data.data);
        setWalletBalance((prev) => Math.max(0, prev - totalCost));
      } else {
        showError(res.data?.message || 'خطا در ایجاد کلاس');
      }
    } catch (err: any) {
      showError(err.response?.data?.message || 'خطا در برقراری ارتباط با سرور');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
    showSuccess('لینک کلاس کپی شد.');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronRight size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>ایجاد کلاس مجازی آنلاین</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Wallet Balance Status Card */}
        <View style={[styles.walletCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.walletRightCol}>
            <Text style={[styles.walletLabel, { color: colors.textLight }]}>موجودی کیف پول شما:</Text>
            {loadingBalance ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[styles.walletBalanceText, { color: colors.primary }]}>
                {toPersianNumbers(walletBalance.toLocaleString('fa-IR'))} تومان
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.chargeWalletBtn}
            onPress={() => navigation.navigate('TeacherWalletScreen')}
            activeOpacity={0.8}
          >
            <Wallet size={16} color="#ffffff" />
            <Text style={styles.chargeWalletBtnText}>کیف پول</Text>
          </TouchableOpacity>
        </View>

        {createdClass ? (
          /* SUCCESS RESULT CARD */
          <View style={[styles.successCard, { backgroundColor: colors.successBackground, borderColor: colors.success }]}>
            <CheckCircle2 size={40} color={colors.success} />
            <Text style={[styles.successTitle, { color: colors.text }]}>
              کلاس مجازی «{createdClass.title}» ایجاد شد!
            </Text>
            <Text style={[styles.successSub, { color: colors.textLight }]}>
              این کلاس در فهرست «مدیریت کلاس‌های آنلاین» شما و بخش «کلاس‌های من» دانش‌آموزان دعوت‌شده نمایش داده می‌شود.
            </Text>

            {createdClass.joinUrl ? (
              <View style={[styles.linkBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TouchableOpacity onPress={() => copyToClipboard(createdClass.joinUrl)} style={styles.copyBtn}>
                  <Copy size={18} color={colors.primary} />
                </TouchableOpacity>
                <Text style={[styles.linkText, { color: colors.primary }]} numberOfLines={1}>
                  {createdClass.joinUrl}
                </Text>
              </View>
            ) : null}

            <View style={styles.successActionsRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.success }]}
                onPress={() =>
                  navigation.navigate('LiveClassroomScreen', {
                    sessionId: createdClass._id,
                    bookingCode: createdClass.bookingCode,
                    title: createdClass.title,
                  })
                }
                activeOpacity={0.85}
              >
                <Video size={16} color={colors.card} />
                <Text style={styles.actionBtnText}>ورود به کلاس آنلاین</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('OnlineClassesScreen')}
                activeOpacity={0.85}
              >
                <ExternalLink size={16} color={colors.card} />
                <Text style={styles.actionBtnText}>مدیریت کلاس‌ها</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtnSecondary, { borderColor: colors.border }]}
                onPress={() => {
                  setCreatedClass(null);
                  setClassName('');
                  setInvitedStudents([]);
                }}
                activeOpacity={0.85}
              >
                <Text style={[styles.actionBtnSecondaryText, { color: colors.text }]}>ایجاد کلاس جدید</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* CLASS CREATION FORM */
          <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.infoBanner}>
              <Video size={18} color="#2563eb" />
              <Text style={styles.infoBannerText}>
                هزینه ایجاد کلاس مجازی به ازای هر دانش‌آموز ۵۰,۰۰۰ تومان است که از شارژ کیف پول شما پرداخت می‌شود.
              </Text>
            </View>

            {/* Class Name Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>عنوان کلاس مجازی:</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', color: colors.text, borderColor: colors.border }]}
                placeholder="مثال: جلسه جمع‌بندی و رفع اشکال حسابان"
                placeholderTextColor={colors.textLight}
                value={className}
                onChangeText={setClassName}
                textAlign="right"
              />
            </View>

            {/* Subject Selector */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>درس یا موضوع:</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', color: colors.text, borderColor: colors.border }]}
                placeholder="مثال: ریاضی، شیمی، زبان انگلیسی..."
                placeholderTextColor={colors.textLight}
                value={subject}
                onChangeText={setSubject}
                textAlign="right"
              />
            </View>

            {/* Student Count Picker */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>تعداد مجاز دانش‌آموزان:</Text>
              <View style={styles.counterRow}>
                <TouchableOpacity
                  style={[styles.counterBtn, { borderColor: colors.border }]}
                  onPress={() => setStudentCount((c) => Math.min(25, c + 1))}
                  activeOpacity={0.7}
                >
                  <Plus size={18} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.counterDisplay}>
                  <Text style={[styles.counterNumber, { color: colors.text }]}>
                    {toPersianNumbers(effectiveCount)} نفر
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.counterBtn, { borderColor: colors.border }]}
                  onPress={() => setStudentCount((c) => Math.max(invitedStudents.length || 1, c - 1))}
                  activeOpacity={0.7}
                >
                  <Minus size={18} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Invite Students by Phone Number */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                دعوت مستقیم دانش‌آموزان (اختیاری - نمایش در لیست کلاس‌های دانش‌آموز در نوکیتا):
              </Text>
              <View style={styles.inviteRow}>
                <TouchableOpacity
                  style={[styles.inviteAddBtn, { backgroundColor: colors.primary }]}
                  onPress={handleAddInvitedStudent}
                  activeOpacity={0.8}
                >
                  <UserPlus size={16} color={colors.card} />
                  <Text style={styles.inviteAddBtnText}>افزودن</Text>
                </TouchableOpacity>
                <TextInput
                  style={[
                    styles.textInput,
                    { flex: 1, backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border },
                  ]}
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                  placeholderTextColor={colors.textLight}
                  value={invitePhoneInput}
                  onChangeText={handlePhoneInputChange}
                  keyboardType="phone-pad"
                  textAlign="right"
                />
              </View>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border, marginTop: 6 },
                ]}
                placeholder={searchingPhone ? 'در حال استعلام نام دانش‌آموز...' : 'نام دانش‌آموز (اختیاری)'}
                placeholderTextColor={colors.textLight}
                value={inviteNameInput}
                onChangeText={setInviteNameInput}
                textAlign="right"
              />

              {invitedStudents.length > 0 && (
                <View style={styles.invitedChipsWrap}>
                  {invitedStudents.map((st) => (
                    <View
                      key={st.phoneNumber}
                      style={[
                        styles.invitedChip,
                        { backgroundColor: colors.infoBackground, borderColor: colors.border },
                      ]}
                    >
                      <TouchableOpacity onPress={() => handleRemoveInvitedStudent(st.phoneNumber)}>
                        <X size={14} color={colors.error} />
                      </TouchableOpacity>
                      <Text style={[styles.invitedChipText, { color: colors.text }]}>
                        {st.fullName} ({toPersianNumbers(st.phoneNumber)})
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Price Calculation Summary */}
            <View style={[styles.costSummaryCard, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
              <View style={styles.costRow}>
                <Text style={[styles.costValue, { color: colors.text }]}>
                  {toPersianNumbers(effectiveCount)} × ۵۰,۰۰۰ تومان
                </Text>
                <Text style={[styles.costLabel, { color: colors.textLight }]}>محاسبه هزینه:</Text>
              </View>
              <View style={[styles.costDivider, { backgroundColor: colors.border }]} />
              <View style={styles.costRow}>
                <Text style={[styles.totalCostValue, { color: isBalanceSufficient ? colors.success : colors.error }]}>
                  {toPersianNumbers(totalCost.toLocaleString('fa-IR'))} تومان
                </Text>
                <Text style={[styles.totalCostLabel, { color: colors.text }]}>مبلغ قابل پرداخت:</Text>
              </View>
            </View>

            {/* Error notice if balance is low */}
            {!isBalanceSufficient && (
              <View style={styles.insufficientBanner}>
                <Text style={styles.insufficientText}>
                  موجودی کافی نیست. لطفاً کیف پول خود را حداقل به میزان{' '}
                  {toPersianNumbers((totalCost - walletBalance).toLocaleString('fa-IR'))} تومان شارژ کنید.
                </Text>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                { backgroundColor: isBalanceSufficient ? colors.primary : '#94a3b8' },
              ]}
              onPress={handleCreate}
              disabled={submitting || !isBalanceSufficient}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>پرداخت و ایجاد کلاس مجازی</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: FONT_FAMILY.bold,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  walletCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  walletRightCol: {
    alignItems: 'flex-start',
    gap: 2,
  },
  walletLabel: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.regular,
  },
  walletBalanceText: {
    fontSize: 15,
    fontFamily: FONT_FAMILY.bold,
  },
  chargeWalletBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  chargeWalletBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: FONT_FAMILY.bold,
  },
  formCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  infoBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  infoBannerText: {
    flex: 1,
    fontSize: 11.5,
    fontFamily: FONT_FAMILY.regular,
    color: '#1e40af',
    textAlign: 'right',
    lineHeight: 18,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12.5,
    fontFamily: FONT_FAMILY.bold,
    textAlign: 'right',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    fontFamily: FONT_FAMILY.regular,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 4,
  },
  counterBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterDisplay: {
    minWidth: 80,
    alignItems: 'center',
  },
  counterNumber: {
    fontSize: 16,
    fontFamily: FONT_FAMILY.bold,
  },
  costSummaryCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 8,
    marginTop: 4,
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  costLabel: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.regular,
  },
  costValue: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.medium,
  },
  costDivider: {
    height: 1,
    width: '100%',
  },
  totalCostLabel: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.bold,
  },
  totalCostValue: {
    fontSize: 15,
    fontFamily: FONT_FAMILY.bold,
  },
  insufficientBanner: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    padding: 10,
    borderRadius: 10,
  },
  insufficientText: {
    color: '#b91c1c',
    fontSize: 11,
    fontFamily: FONT_FAMILY.medium,
    textAlign: 'right',
    lineHeight: 17,
  },
  submitBtn: {
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontFamily: FONT_FAMILY.bold,
  },
  successCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  successTitle: {
    fontSize: 16,
    fontFamily: FONT_FAMILY.bold,
    textAlign: 'center',
  },
  successSub: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.regular,
    textAlign: 'center',
    lineHeight: 18,
  },
  linkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  linkText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FONT_FAMILY.bold,
    textAlign: 'left',
  },
  copyBtn: {
    padding: 6,
  },
  successActionsRow: {
    width: '100%',
    gap: 8,
    marginTop: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: FONT_FAMILY.bold,
  },
  actionBtnSecondary: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionBtnSecondaryText: {
    fontSize: 12.5,
    fontFamily: FONT_FAMILY.medium,
  },
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inviteAddBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingStart: 12,
    paddingEnd: 12,
    paddingVertical: 11,
    borderRadius: 12,
    gap: 4,
  },
  inviteAddBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: FONT_FAMILY.bold,
  },
  invitedChipsWrap: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  invitedChip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingStart: 10,
    paddingEnd: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  invitedChipText: {
    fontSize: 11.5,
    fontFamily: FONT_FAMILY.medium,
    fontVariant: ['tabular-nums'],
  },
});

export default CreateVirtualClassScreen;
