import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import GlobalHeader from '../../components/common/GlobalHeader';
import { ChevronLeft, FileText, Play, Plus } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const EducationLessonContentScreen = ({ route, navigation }: any) => {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<'notes' | 'book' | 'video'>('notes');
  
  // Params
  const { 
    subject, 
    level, 
    field, 
    grade,
    bookTitle,
    chapterTitle,
    lessonTitle = 'مجموعه‌های متناهی و نامتناهی',
    lessonId = 1
  } = route.params || {};

  const renderNotes = () => (
    <View style={styles.tabContent}>
      <Text style={[styles.contentTitle, { color: colors.text }]}>جزوه آموزشی معلم</Text>
      <Text style={[styles.contentText, { color: colors.text }]}>
        در این درس دانش‌آموزان با مفهوم مجموعه‌های متناهی و نامتناهی آشنا می‌شوند. ابتدا با مثال‌های ساده از مجموعه‌های قابل شمارش شروع کنید.
        {'\n\n'}
        نکات کلیدی برای تدریس:
        {'\n'}• تاکید بر تفاوت بین تعداد اعضای مجموعه و بزرگ بودن خود اعضا.
        {'\n'}• استفاده از نمودار ون برای نمایش بصری.
        {'\n'}• ارتباط دادن این مفهوم با مفاهیم قبلی مثل اعداد طبیعی و صحیح.
      </Text>
      <View style={[styles.infoBox, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
        <Text style={[styles.infoBoxText, { color: '#1e3a8a' }]}>پیشنهاد: برای درک بهتر مجموعه‌های نامتناهی، از مثال تعداد ستارگان یا دانه‌های شن استفاده نکنید (زیرا متناهی هستند)، بلکه از مجموعه اعداد طبیعی استفاده کنید.</Text>
      </View>
    </View>
  );

  const renderBook = () => (
    <View style={styles.tabContent}>
      <Text style={[styles.contentTitle, { color: colors.text }]}>محتوای کتاب درسی</Text>
      <View style={[styles.bookMock, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <Text style={[styles.contentText, { color: colors.text }]}>
          بخش‌هایی از محتوای عینی کتاب درسی در اینجا قرار می‌گیرد تا معلم نیازی به همراه داشتن کتاب فیزیکی نداشته باشد.
        </Text>
        <Image 
          source={{ uri: 'https://img.freepik.com/free-vector/hand-drawn-math-formulas-background_23-2148154124.jpg' }} 
          style={{ width: '100%', height: 200, borderRadius: 8, marginTop: 16 }} 
          resizeMode="cover" 
        />
      </View>
    </View>
  );

  const renderVideo = () => (
    <View style={styles.tabContent}>
      <Text style={[styles.contentTitle, { color: colors.text }]}>ویدیوهای آموزشی</Text>
      
      <TouchableOpacity style={[styles.videoCard, { backgroundColor: colors.surface, borderColor: colors.border }]} activeOpacity={0.8}>
        <View style={styles.thumbnailContainer}>
          <Image 
            source={{ uri: 'https://img.freepik.com/free-photo/teacher-explaining-math-problem-blackboard_23-2148201217.jpg' }} 
            style={styles.thumbnail} 
          />
          <View style={styles.playButtonOverlay}>
            <Play color="#fff" fill="#fff" size={24} />
          </View>
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>۱۲:۴۵</Text>
          </View>
        </View>
        <View style={styles.videoInfo}>
          <Text style={[styles.videoTitle, { color: colors.text }]}>روش تدریس مجموعه‌های متناهی</Text>
          <Text style={[styles.videoSub, { color: colors.textLight }]}>استاد احمدی • آموزش مفاهیم</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <GlobalHeader onProfilePress={() => navigation.navigate('ProfileScreen')} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Breadcrumb */}
        <View style={styles.breadcrumb}>
          <Text style={[styles.breadcrumbText, { color: colors.textLight }]}>{bookTitle}</Text>
          <ChevronLeft color={colors.textLight} size={14} style={styles.breadcrumbIcon} />
          <Text style={[styles.breadcrumbText, { color: colors.textLight }]}>درس {lessonId}</Text>
        </View>

        {/* Page Title */}
        <View style={styles.pageTitleContainer}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>{lessonTitle}</Text>
        </View>

        {/* Tabs */}
        <View style={[styles.tabsContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'notes' && { backgroundColor: colors.primary }]} 
            onPress={() => setActiveTab('notes')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'notes' ? '#fff' : colors.textLight }]}>جزوه</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'book' && { backgroundColor: colors.primary }]} 
            onPress={() => setActiveTab('book')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'book' ? '#fff' : colors.textLight }]}>کتاب خام</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'video' && { backgroundColor: colors.primary }]} 
            onPress={() => setActiveTab('video')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'video' ? '#fff' : colors.textLight }]}>ویدیو</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {activeTab === 'notes' && renderNotes()}
        {activeTab === 'book' && renderBook()}
        {activeTab === 'video' && renderVideo()}
        
        {/* Spacer for FAB */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Primary Contextual Action (FAB) */}
      <View style={styles.fabContainer}>
        <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} activeOpacity={0.9}>
          <Plus color="#fff" size={24} style={styles.fabIcon} />
          <Text style={styles.fabText}>ساخت طرح درس</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  breadcrumbText: { fontSize: 12, fontFamily: 'IRANSansX' },
  breadcrumbIcon: { marginHorizontal: 4 },

  pageTitleContainer: { marginBottom: 24 },
  pageTitle: { fontSize: 20, fontWeight: 'bold', fontFamily: 'IRANSansX', lineHeight: 32 },

  tabsContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
  },

  tabContent: {
    minHeight: 300,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
    marginBottom: 16,
  },
  contentText: {
    fontSize: 14,
    fontFamily: 'IRANSansX',
    lineHeight: 28,
    textAlign: 'justify',
  },
  infoBox: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoBoxText: {
    fontSize: 13,
    fontFamily: 'IRANSansX',
    lineHeight: 24,
  },

  bookMock: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },

  videoCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  thumbnailContainer: {
    height: 180,
    width: '100%',
    position: 'relative',
    backgroundColor: '#000',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  playButtonOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -24 }, { translateY: -24 }],
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  durationText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'IRANSansX',
  },
  videoInfo: {
    padding: 16,
  },
  videoTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
    marginBottom: 4,
  },
  videoSub: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
  },

  fabContainer: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  fabIcon: {
    marginRight: 8,
  },
  fabText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
  }
});

export default EducationLessonContentScreen;
