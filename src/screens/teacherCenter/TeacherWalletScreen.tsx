import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../api/axiosConfig';
import {
  ChevronRight,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  ShieldCheck,
  Clock,
  AlertTriangle,
} from 'lucide-react-native';

export const TeacherWalletScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [walletData, setWalletData] = useState<any>(null);

  const fetchWallet = async () => {
    try {
      const response = await api.get('/teacher/center/wallet');
      if (response.data?.success) {
        setWalletData(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching teacher wallet:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchWallet();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchWallet();
  };

  const getTransactionTypeTitle = (type: string) => {
    switch (type) {
      case 'material_sale':
        return 'فروش جزوه آموزشی';
      case 'question_reward':
        return 'پاداش پاسخ به سوال';
      case 'class_earning':
        return 'درآمد کلاس آنلاین';
      case 'class_fee':
        return 'هزینه ساخت کلاس مجازی / رزرو';
      case 'admin_credit':
        return 'افزایش اعتبار توسط مدیریت';
      case 'admin_debit':
        return 'کسر اعتبار توسط مدیریت';
      case 'withdrawal':
        return 'تسویه و واریز به حساب بانکی';
      case 'deposit':
        return 'افزایش موجودی';
      default:
        return 'تراکنش مالی';
    }
  };

  const transactions = walletData?.transactions || [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronRight size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>کیف پول و دفتر کل مالی</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
          }
        >
          {/* Main Balance Hero Card */}
          <View style={[styles.heroCard, { backgroundColor: isDark ? '#1E3A8A' : '#2563EB' }]}>
            <View style={styles.heroTopRow}>
              <View style={styles.walletIconWrap}>
                <Wallet size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.heroTitle}>موجودی کیف پول شما</Text>
            </View>

            <View style={styles.balanceRow}>
              <Text style={styles.balanceNum}>
                {Number(walletData?.balance || 0).toLocaleString()}
              </Text>
              <Text style={styles.balanceUnit}>تومان</Text>
            </View>

            <View style={styles.heroStatsRow}>
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatLabel}>کل درآمدها:</Text>
                <Text style={styles.heroStatVal}>
                  {Number(walletData?.totalEarned || 0).toLocaleString()} تومان
                </Text>
              </View>
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatLabel}>وضعیت حساب:</Text>
                <Text style={styles.heroStatVal}>
                  {walletData?.isFrozen ? 'مسدود' : 'فعال و تایید شده'}
                </Text>
              </View>
            </View>
          </View>

          {/* Top-up Button (Disabled until gateway integration) */}
          <View style={styles.topUpRow}>
            <TouchableOpacity
              style={[styles.topUpBtn, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}
              disabled={true}
              activeOpacity={0.8}
            >
              <CreditCard size={18} color="#64748b" />
              <Text style={styles.topUpBtnText}>شارژ آنلاین کیف پول</Text>
              <View style={styles.disabledBadge}>
                <Text style={styles.disabledBadgeText}>به‌زودی (غیرفعال)</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Settlement Info Notice */}
          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ShieldCheck size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoTitle, { color: colors.text }]}>چرخه تسویه حساب منظم معلمان</Text>
              <Text style={[styles.infoText, { color: colors.textLight }]}>
                درآمدهای حاصل از تدریس، رفع اشکال و فروش جزوات، در روزهای ۱ و ۱۵ هر ماه به شماره شبای شما واریز می‌شود.
              </Text>
            </View>
          </View>

          {/* Transaction Ledger */}
          <Text style={[styles.sectionHeading, { color: colors.text }]}>گردش حساب و ریز تراکنش‌ها</Text>

          {transactions.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <CreditCard size={40} color={colors.textLight} />
              <Text style={[styles.emptyText, { color: colors.textLight }]}>
                هنوز هیچ تراکنشی در دفتر کل شما ثبت نشده است.
              </Text>
            </View>
          ) : (
            transactions.map((tx: any) => {
              const isCredit = tx.amount > 0;
              return (
                <View
                  key={tx._id}
                  style={[styles.txItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <View style={styles.txRight}>
                    <View
                      style={[
                        styles.txIconWrap,
                        { backgroundColor: isCredit ? '#10B98118' : '#EF444418' },
                      ]}
                    >
                      {isCredit ? (
                        <ArrowDownLeft size={18} color="#10B981" />
                      ) : (
                        <ArrowUpRight size={18} color="#EF4444" />
                      )}
                    </View>

                    <View style={styles.txInfo}>
                      <Text style={[styles.txTypeTitle, { color: colors.text }]}>
                        {getTransactionTypeTitle(tx.type)}
                      </Text>
                      {tx.description ? (
                        <Text style={[styles.txDesc, { color: colors.textLight }]} numberOfLines={1}>
                          {tx.description}
                        </Text>
                      ) : null}
                      <Text style={[styles.txTracking, { color: colors.textLight }]}>
                        کد پیگیری: {tx.trackingCode}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.txLeft}>
                    <Text
                      style={[
                        styles.txAmount,
                        { color: isCredit ? '#059669' : '#DC2626' },
                      ]}
                    >
                      {isCredit ? '+' : ''}
                      {Number(tx.amount).toLocaleString()} تومان
                    </Text>
                    <Text style={[styles.txDate, { color: colors.textLight }]}>
                      {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('fa-IR') : ''}
                    </Text>
                    <Text style={[styles.txBalanceAfter, { color: colors.textLight }]}>
                      مانده: {Number(tx.balanceAfter || 0).toLocaleString()}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 16, fontFamily: 'Estedad-FD-Bold' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1 },
  contentContainer: { padding: 16, gap: 14 },
  heroCard: {
    padding: 20,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  heroTopRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  walletIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: { color: '#FFFFFF', fontSize: 14, fontFamily: 'Estedad-FD-Bold' },
  balanceRow: {
    flexDirection: 'row-reverse',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 16,
  },
  balanceNum: { color: '#FFFFFF', fontSize: 32, fontFamily: 'Estedad-FD-Black' },
  balanceUnit: { color: 'rgba(255,255,255,0.9)', fontSize: 15, fontFamily: 'Estedad-FD-Medium' },
  heroStatsRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 12,
  },
  heroStatItem: { alignItems: 'flex-end' },
  heroStatLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontFamily: 'Estedad-FD-Regular' },
  heroStatVal: { color: '#FFFFFF', fontSize: 12, fontFamily: 'Estedad-FD-Bold', marginTop: 2 },
  infoCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  infoTitle: { fontSize: 12, fontFamily: 'Estedad-FD-Bold', textAlign: 'right' },
  infoText: { fontSize: 11, fontFamily: 'Estedad-FD-Regular', textAlign: 'right', marginTop: 2, lineHeight: 16 },
  sectionHeading: { fontSize: 14, fontFamily: 'Estedad-FD-Bold', textAlign: 'right', marginTop: 6 },
  emptyCard: { padding: 36, borderRadius: 16, borderWidth: 1, alignItems: 'center', gap: 10 },
  emptyText: { fontSize: 12, fontFamily: 'Estedad-FD-Regular', textAlign: 'center' },
  txItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  txRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  txIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txInfo: { flex: 1 },
  txTypeTitle: { fontSize: 13, fontFamily: 'Estedad-FD-Bold', textAlign: 'right' },
  txDesc: { fontSize: 11, fontFamily: 'Estedad-FD-Regular', textAlign: 'right', marginTop: 2 },
  txTracking: { fontSize: 10, fontFamily: 'Estedad-FD-Regular', textAlign: 'right', marginTop: 2 },
  txLeft: { alignItems: 'flex-start', gap: 2 },
  txAmount: { fontSize: 13, fontFamily: 'Estedad-FD-Bold' },
  txDate: { fontSize: 10, fontFamily: 'Estedad-FD-Regular' },
  txBalanceAfter: { fontSize: 10, fontFamily: 'Estedad-FD-Regular' },
  topUpRow: {
    marginVertical: 4,
  },
  topUpBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    gap: 8,
  },
  topUpBtnText: {
    fontSize: 13,
    fontFamily: 'Estedad-FD-Bold',
    color: '#64748b',
  },
  disabledBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  disabledBadgeText: {
    fontSize: 10,
    fontFamily: 'Estedad-FD-Medium',
    color: '#94a3b8',
  },
});

export default TeacherWalletScreen;
