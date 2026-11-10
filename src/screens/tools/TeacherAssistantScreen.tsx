import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  NativeModules,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  Bell,
  ChevronLeft,
  BookOpen,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../api/axiosConfig';
import ToolIcon from '../../components/common/ToolIcon';
import CompressionHubModal from '../../components/tools/CompressionHubModal';
import ConversionHubModal from '../../components/tools/ConversionHubModal';
import {
  teacherAssistantCategories,
  ToolItemDef,
} from '../../data/teacherAssistantCategories';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const { TeacherAssistantPreloader } = NativeModules;

// Screen layout paddings
const SCREEN_PADDING = 14;
const POPULAR_GAP = 10;

// Available width for category grid across the screen (no boxed container)
const CATEGORY_GRID_WIDTH = SCREEN_WIDTH - (SCREEN_PADDING * 2);

// Column width (1/4th of grid width)
const COL_WIDTH = CATEGORY_GRID_WIDTH / 4;

// Dynamically scale category icon size (between 50 and 60)
const ICON_BOX_SIZE = Math.min(60, Math.max(50, Math.round(COL_WIDTH * 0.65)));

// Dimensions for course cards (3 columns)
const COURSE_CARD_WIDTH = Math.floor((SCREEN_WIDTH - SCREEN_PADDING * 2 - 20) / 3);

// Dimensions for popular tool cards (exactly 2 cards per row)
const POPULAR_CARD_WIDTH = Math.floor((SCREEN_WIDTH - (SCREEN_PADDING * 2) - POPULAR_GAP) / 2);

// Track if screen has already mounted once across tab switches
let g_hasMountedOnce = false;

interface CourseItem {
  _id: string;
  name: string;
  code: string;
  description?: string;
  order?: number;
  image?: string | null;
  color?: string | null;
}

// Default fallback courses with pre-assigned 3D asset images for 0ms initial render
const DEFAULT_FALLBACK_COURSES: CourseItem[] = [
  {
    _id: 'elementary',
    name: 'دبستان',
    code: 'ELEMENTARY',
    image: '/uploads/courses/course_1792874445829_c5xhmc.jpg',
    color: '#c2e7fe',
  },
  {
    _id: 'middle',
    name: 'متوسطه اول',
    code: 'MIDDLE',
    image: '/uploads/courses/course_1792874523407_igg74f.jpg',
    color: '#c6c0fd',
  },
  {
    _id: 'high',
    name: 'متوسطه دوم',
    code: 'HIGH',
    image: '/uploads/courses/course_1792874607147_g7871t.jpg',
    color: '#d5f7e6',
  },
];

// Popular Tools - Exactly 6 items organized in 3 rows of 2 items
interface PopularToolDef {
  id: string;
  toolId: string;
  title: string;
  subtitle: string;
  route: string;
}

const POPULAR_TOOLS: PopularToolDef[] = [
  {
    id: 'pop-print',
    toolId: 'examPrint',
    title: 'چاپ برگه امتحانی',
    subtitle: 'چاپ سریع برگه‌های آزمون',
    route: 'MobileQuestionBuilder',
  },
  {
    id: 'pop-online',
    toolId: 'onlineExam',
    title: 'آزمون آنلاین',
    subtitle: 'برگزاری آزمون و ارزیابی دانش‌آموزان',
    route: 'ExamListScreen',
  },
  {
    id: 'pop-convert',
    toolId: 'formatConversion',
    title: 'تبدیل فرمت',
    subtitle: 'تبدیل انواع فایل‌ها به یکدیگر',
    route: 'OPEN_CONVERSION_HUB',
  },
  {
    id: 'pop-compress',
    toolId: 'fileCompression',
    title: 'کاهش حجم',
    subtitle: 'فشرده‌سازی و بهینه‌سازی فایل‌ها',
    route: 'OPEN_COMPRESSION_HUB',
  },
  {
    id: 'pop-scanner',
    toolId: 'scanner',
    title: 'اسکنر',
    subtitle: 'اسکن سریع اسناد با دوربین',
    route: 'DocumentScannerScreen',
  },
  {
    id: 'pop-form',
    toolId: 'formBuilder',
    title: 'فرمساز',
    subtitle: 'ساخت فرم‌های دلخواه',
    route: 'FormDashboardScreen',
  },
];

// Group popular tools into rows of 2 (Row 1: [چاپ برگه امتحانی, آزمون آنلاین], Row 2: [تبدیل فرمت, کاهش حجم], Row 3: [اسکنر, فرمساز])
const POPULAR_ROWS: [PopularToolDef, PopularToolDef][] = [
  [POPULAR_TOOLS[0], POPULAR_TOOLS[1]],
  [POPULAR_TOOLS[2], POPULAR_TOOLS[3]],
  [POPULAR_TOOLS[4], POPULAR_TOOLS[5]],
];

// Helper to resolve full image URL
const getFullImageUrl = (imagePath?: string | null) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  const baseHost = (api.defaults.baseURL || 'https://class.kitayar.ir/api').replace(/\/api\/?$/, '');
  return `${baseHost}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
};

// Helper for friendly course display name
const getCourseDisplayName = (course: CourseItem) => {
  if (course.code === 'ELEMENTARY' || course.name === 'دبستان') return 'ابتدایی';
  return course.name;
};

interface TintConfig {
  bgLight: string;
  borderLight: string;
  bgDark: string;
  borderDark: string;
}

const POPULAR_TINTS: Record<string, TintConfig> = {
  examPrint: {
    bgLight: '#FAF5FF', // Subtle purple tint matching icon
    borderLight: '#F3E8FF',
    bgDark: 'rgba(168, 85, 232, 0.12)',
    borderDark: 'rgba(168, 85, 232, 0.25)',
  },
  onlineExam: {
    bgLight: '#FFF1F4', // Subtle rose/pink tint matching icon
    borderLight: '#FFE4E8',
    bgDark: 'rgba(244, 91, 120, 0.12)',
    borderDark: 'rgba(244, 91, 120, 0.25)',
  },
  formatConversion: {
    bgLight: '#F0F9FF', // Subtle sky blue tint matching icon
    borderLight: '#E0F2FE',
    bgDark: 'rgba(56, 189, 248, 0.12)',
    borderDark: 'rgba(56, 189, 248, 0.25)',
  },
  fileCompression: {
    bgLight: '#F0FDF5', // Subtle emerald/mint tint matching icon
    borderLight: '#DCFCE7',
    bgDark: 'rgba(25, 201, 149, 0.12)',
    borderDark: 'rgba(25, 201, 149, 0.25)',
  },
  scanner: {
    bgLight: '#F0F7FF', // Subtle blue tint matching icon
    borderLight: '#DBEAFE',
    bgDark: 'rgba(67, 143, 245, 0.12)',
    borderDark: 'rgba(67, 143, 245, 0.25)',
  },
  formBuilder: {
    bgLight: '#FFFBEB', // Subtle amber/orange tint matching icon
    borderLight: '#FEF3C7',
    bgDark: 'rgba(245, 158, 11, 0.12)',
    borderDark: 'rgba(245, 158, 11, 0.25)',
  },
};

// Memoized Popular Tool Card with harmonious icon-tinted background matching reference screenshot
const PopularCard = React.memo(
  ({
    tool,
    isDark,
    colors,
    cardWidth,
    onPress,
  }: {
    tool: PopularToolDef;
    isDark: boolean;
    colors: any;
    cardWidth: number;
    onPress: () => void;
  }) => {
    const tint = POPULAR_TINTS[tool.toolId] || {
      bgLight: '#FFFFFF',
      borderLight: '#F1F5F9',
      bgDark: colors.surface,
      borderDark: 'rgba(255,255,255,0.08)',
    };
    const cardBg = isDark ? tint.bgDark : tint.bgLight;
    const cardBorder = isDark ? tint.borderDark : tint.borderLight;

    return (
      <TouchableOpacity
        style={[
          styles.popularCard,
          {
            width: cardWidth,
            backgroundColor: cardBg,
            borderColor: cardBorder,
          },
        ]}
        activeOpacity={0.75}
        onPress={onPress}
      >
        {/* Left Side: Large Colored Squircle Icon */}
        <ToolIcon toolId={tool.toolId} size={46} borderRadius={15} iconSize={24} />

        {/* Right Side: Title with Chevron + Subtitle */}
        <View style={styles.popularCardTextCol}>
          <View style={styles.popularCardTitleRow}>
            <ChevronLeft size={13} color="#3B82F6" strokeWidth={2.5} style={{ marginLeft: 2 }} />
            <Text
              style={[styles.popularCardTitle, { color: colors.text }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {tool.title}
            </Text>
          </View>
          <Text
            style={[styles.popularCardSubtitle, { color: colors.textLight }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {tool.subtitle}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }
);

// Memoized 4-Column Tool Item (NO white outer box, large colored icon, text below)
const CategoryToolItem = React.memo(
  ({
    tool,
    iconSize,
    colors,
    onPress,
  }: {
    tool: ToolItemDef;
    iconSize: number;
    colors: any;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={styles.gridColItem}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <ToolIcon toolId={tool.toolId} size={iconSize} />
      <Text
        style={[styles.gridToolTitle, { color: colors.text }]}
        numberOfLines={2}
      >
        {tool.title}
      </Text>
    </TouchableOpacity>
  )
);

// Helper to darken a hex color for borders
const darkenHex = (hex: string, amount = 28): string => {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
  if (clean.length !== 6) return 'rgba(0,0,0,0.1)';
  const num = parseInt(clean, 16);
  let r = Math.max(0, (num >> 16) - amount);
  let g = Math.max(0, ((num >> 8) & 0x00FF) - amount);
  let b = Math.max(0, (num & 0x0000FF) - amount);
  return `#${(g | (b << 8) | (r << 16)).toString(16).padStart(6, '0')}`;
};

// Dynamically compute card theme based on course.color provided from backend
const getCourseTheme = (course: CourseItem, index: number, isDark: boolean) => {
  let baseColor = course.color;
  if (!baseColor) {
    if (course.code === 'MIDDLE' || course.name?.includes('اول')) {
      baseColor = '#c6c0fd';
    } else if (course.code === 'HIGH' || course.name?.includes('دوم')) {
      baseColor = '#d5f7e6';
    } else if (course.code === 'ELEMENTARY' || course.name?.includes('دبستان') || course.name?.includes('ابتدایی')) {
      baseColor = '#c2e7fe';
    } else {
      const fallbackPalette = ['#c2e7fe', '#c6c0fd', '#d5f7e6'];
      baseColor = fallbackPalette[index % fallbackPalette.length];
    }
  }

  if (!baseColor.startsWith('#')) {
    baseColor = `#${baseColor}`;
  }

  // The card background uses the backend color directly so it covers the entire item seamlessly
  const bg = baseColor;
  // Border is a complementary slightly deeper shade of the base color
  const border = darkenHex(baseColor, 28);

  return { bg, border, baseColor };
};

// Memoized Course Card with solid backend color background covering the whole item
const CourseCard = React.memo(
  ({
    course,
    index,
    isDark,
    colors,
    onPress,
  }: {
    course: CourseItem;
    index: number;
    isDark: boolean;
    colors: any;
    onPress: () => void;
  }) => {
    const imageUrl = getFullImageUrl(course.image);
    const theme = getCourseTheme(course, index, isDark);

    return (
      <TouchableOpacity
        style={[
          styles.courseCard,
          {
            backgroundColor: theme.bg,
            borderColor: theme.border,
          },
        ]}
        activeOpacity={0.8}
        onPress={onPress}
      >
        <View style={styles.courseImageWrapper}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.courseImage}
              resizeMode="contain"
              fadeDuration={0}
            />
          ) : (
            <View style={styles.courseFallbackBox}>
              <BookOpen size={32} color="#3B82F6" />
            </View>
          )}
        </View>
        <View style={styles.courseCardBottom}>
          <ChevronLeft size={13} color="#1E293B" strokeWidth={2.5} />
          <Text style={styles.courseTitleText}>
            {getCourseDisplayName(course)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }
);

// Skeleton Shimmer Box for Placeholder
const SkeletonBox = ({
  style,
  isDark,
}: {
  style: any;
  isDark: boolean;
}) => (
  <View
    style={[
      {
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#E2E8F0',
        borderRadius: 12,
      },
      style,
    ]}
  />
);

export const TeacherAssistantScreen = ({ navigation }: any) => {
  const { colors, isDark } = useTheme();

  // Instant switch state: renders lightweight placeholder on frame 0, full content right after
  const [isReady, setIsReady] = useState(g_hasMountedOnce);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Course data state - pre-populated with instant fallback to avoid delay
  const [courses, setCourses] = useState<CourseItem[]>(DEFAULT_FALLBACK_COURSES);

  // Hub modals state
  const [compressionModalVisible, setCompressionModalVisible] = useState(false);
  const [conversionModalVisible, setConversionModalVisible] = useState(false);

  // Frame-0 instant placeholder: switches tab immediately in 0ms, then renders tools on next tick
  useEffect(() => {
    if (g_hasMountedOnce) {
      setIsReady(true);
      return;
    }

    const raf = requestAnimationFrame(() => {
      setIsReady(true);
      g_hasMountedOnce = true;
    });

    const timer = setTimeout(() => {
      setIsReady(true);
      g_hasMountedOnce = true;
    }, 50);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, []);

  // Native WarmUp & Course Caching initialization
  useEffect(() => {
    // 1. Warm up native Android JVM & background thread
    TeacherAssistantPreloader?.warmUp?.();

    // 2. Read instant cached courses from Android SharedPreferences (0ms delay)
    if (TeacherAssistantPreloader?.getCachedCourses) {
      TeacherAssistantPreloader.getCachedCourses()
        .then((jsonStr: string) => {
          if (jsonStr) {
            try {
              const cached = JSON.parse(jsonStr);
              if (Array.isArray(cached) && cached.length > 0) {
                setCourses(cached);
              }
            } catch (_) {}
          }
        })
        .catch(() => {});
    }

    // 3. Asynchronously fetch fresh courses in background and update cache
    fetchFreshCourses();
  }, []);

  const fetchFreshCourses = async () => {
    try {
      const res = await api.get('/teacher/builder/courses');
      if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        const freshCourses = res.data.data;
        setCourses(freshCourses);

        // Cache in Android SharedPreferences via Kotlin Preloader
        TeacherAssistantPreloader?.cacheCourses?.(JSON.stringify(freshCourses));

        // Preload course images in Kotlin background thread
        const imageUrls = freshCourses
          .map((c: any) => getFullImageUrl(c.image))
          .filter(Boolean);
        if (imageUrls.length > 0) {
          TeacherAssistantPreloader?.preloadCourseImages?.(imageUrls);
        }
      }
    } catch (err) {
      console.log('Background course fetch error:', err);
    }
  };

  // Handle tool press
  const handleToolPress = useCallback(
    (tool: ToolItemDef | PopularToolDef) => {
      if (tool.route === 'OPEN_COMPRESSION_HUB') {
        setCompressionModalVisible(true);
        return;
      }
      if (tool.route === 'OPEN_CONVERSION_HUB') {
        setConversionModalVisible(true);
        return;
      }
      if (tool.route === 'GenericCategoryScreen') {
        navigation.navigate('GenericCategoryScreen', {
          title: tool.title,
          children: (tool as ToolItemDef).params?.children || [],
        });
        return;
      }
      navigation.navigate(tool.route, (tool as any).params);
    },
    [navigation]
  );

  // Handle Course card press
  const handleCoursePress = useCallback(
    (course: CourseItem) => {
      navigation.navigate('MobileQuestionBuilder', {
        selectedCourse: course,
        courseId: course._id,
        courseName: course.name,
      });
    },
    [navigation]
  );

  // Filter tools if search query is active
  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return teacherAssistantCategories
      .flatMap((cat) => cat.tools)
      .filter((t) => t.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery]);

  // Common Header (Without back icon, without center icon, title: دستیار معلم)
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Left: Notification Bell with Badge */}
      <TouchableOpacity
        style={[styles.circleButton, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0' }]}
        onPress={() => navigation.navigate('NotificationsScreen')}
      >
        <Bell size={20} color={colors.text} />
        <View style={styles.notificationDot} />
      </TouchableOpacity>

      {/* Center: Title & Subtitle without any icon */}
      <View style={styles.headerCenter}>
        <Text style={[styles.mainTitle, { color: colors.text }]}>دستیار معلم</Text>
        <Text style={[styles.subTitle, { color: colors.textLight }]}>
          همه ابزارهای مورد نیاز برای یک معلم حرفه‌ای
        </Text>
      </View>

      {/* Right: Empty spacer (width: 40) to keep center title 100% dead-centered */}
      <View style={styles.headerSpacer} />
    </View>
  );

  // Common Search Input Bar
  const renderSearchBar = () => (
    <View
      style={[
        styles.searchBar,
        {
          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
        },
      ]}
    >
      <Search size={18} color="#94A3B8" />
      <TextInput
        style={[styles.searchInput, { color: colors.text }]}
        placeholder="جستجوی ابزارها..."
        placeholderTextColor="#94A3B8"
        value={searchQuery}
        onChangeText={setSearchQuery}
        textAlign="right"
      />
    </View>
  );

  // Placeholder Screen: mounts in 0ms so tab switches instantly with no delay
  if (!isReady) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          { backgroundColor: isDark ? colors.background : '#F9FBFE' },
        ]}
        edges={['top']}
      >
        {renderHeader()}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderSearchBar()}

          {/* Courses Header & Skeletons */}
          <View style={styles.sectionHeaderBox}>
            <Text style={[styles.sectionTitleText, { color: colors.text }]}>
              محتوای آموزشی پایه‌ها
            </Text>
            <Text style={[styles.sectionSubtitleText, { color: colors.textLight }]}>
              شامل جزوه، کتاب، سوالات، گام به گام
            </Text>
          </View>
          <View style={styles.courseCardsRow}>
            {[0, 1, 2].map((i) => (
              <SkeletonBox
                key={`course-skel-${i}`}
                style={{ width: COURSE_CARD_WIDTH, height: 116, borderRadius: 20 }}
                isDark={isDark}
              />
            ))}
          </View>

          {/* Popular Tools Header & Skeletons (No blue container) */}
          <View style={styles.popularHeaderBox}>
            <Text style={[styles.sectionTitleText, { color: colors.text }]}>
              ابزارهای پرکاربرد
            </Text>
            <Text style={[styles.sectionSubtitleText, { color: colors.textLight }]}>
              ابزارهای پر استفاده برای معلم‌ها
            </Text>
          </View>
          {[0, 1, 2].map((r) => (
            <View key={`pop-skel-${r}`} style={styles.popularRow}>
              <SkeletonBox
                style={{ width: POPULAR_CARD_WIDTH, height: 84, borderRadius: 20 }}
                isDark={isDark}
              />
              <SkeletonBox
                style={{ width: POPULAR_CARD_WIDTH, height: 84, borderRadius: 20 }}
                isDark={isDark}
              />
            </View>
          ))}

          {/* Category Placeholder Grid (No boxed container) */}
          <View style={styles.categorySectionContainer}>
            <View style={styles.categoryHeader}>
              <SkeletonBox style={{ width: 120, height: 18, borderRadius: 6 }} isDark={isDark} />
              <SkeletonBox style={{ width: 160, height: 12, borderRadius: 4, marginTop: 6 }} isDark={isDark} />
            </View>
            <View style={styles.categoryGrid}>
              {[0, 1, 2, 3].map((c) => (
                <View key={`cat-skel-${c}`} style={styles.gridColItem}>
                  <SkeletonBox
                    style={{
                      width: ICON_BOX_SIZE,
                      height: ICON_BOX_SIZE,
                      borderRadius: Math.round(ICON_BOX_SIZE * 0.28),
                    }}
                    isDark={isDark}
                  />
                  <SkeletonBox
                    style={{ width: 44, height: 10, borderRadius: 4, marginTop: 8 }}
                    isDark={isDark}
                  />
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Interactive Screen once interactions are complete
  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: isDark ? colors.background : '#F9FBFE' },
      ]}
      edges={['top']}
    >
      {/* 1. Header Area */}
      {renderHeader()}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Search Input */}
        {renderSearchBar()}

        {/* If Search is Active -> Render Search Results */}
        {searchQuery.trim().length > 0 ? (
          <View style={styles.searchResultsContainer}>
            <Text style={[styles.sectionTitleText, { color: colors.text, marginBottom: 12 }]}>
              نتایج جستجو ({filteredTools.length})
            </Text>
            {filteredTools.length === 0 ? (
              <View style={styles.emptySearchBox}>
                <Text style={{ color: colors.textLight, fontFamily: 'Estedad-FD-Medium', fontSize: 13 }}>
                  ابزاری با این عنوان یافت نشد.
                </Text>
              </View>
            ) : (
              <View style={styles.categoryGrid}>
                {filteredTools.map((tool) => (
                  <CategoryToolItem
                    key={tool.id}
                    tool={tool}
                    iconSize={ICON_BOX_SIZE}
                    colors={colors}
                    onPress={() => handleToolPress(tool)}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <>
            {/* 3. Course Section: محتوای آموزشی پایه‌ها (Zero-delay cached display) */}
            <View style={styles.sectionHeaderBox}>
              <Text style={[styles.sectionTitleText, { color: colors.text }]}>
                محتوای آموزشی پایه‌ها
              </Text>
              <Text style={[styles.sectionSubtitleText, { color: colors.textLight }]}>
                شامل جزوه، کتاب، سوالات، گام به گام
              </Text>
            </View>

            <View style={styles.courseCardsRow}>
              {courses.map((course, idx) => (
                <CourseCard
                  key={course._id}
                  course={course}
                  index={idx}
                  isDark={isDark}
                  colors={colors}
                  onPress={() => handleCoursePress(course)}
                />
              ))}
            </View>

            {/* 4. Popular Tools Section: ابزارهای پرکاربرد (No blue box, spacious cards) */}
            <View style={styles.popularHeaderBox}>
              <Text style={[styles.sectionTitleText, { color: colors.text }]}>
                ابزارهای پرکاربرد
              </Text>
              <Text style={[styles.sectionSubtitleText, { color: colors.textLight }]}>
                ابزارهای پر استفاده برای معلم‌ها
              </Text>
            </View>

            {/* 3 distinct rows of 2 spacious cards matching user screenshot */}
            {POPULAR_ROWS.map((row, rowIndex) => (
              <View key={`pop-row-${rowIndex}`} style={styles.popularRow}>
                <PopularCard
                  tool={row[0]}
                  isDark={isDark}
                  colors={colors}
                  cardWidth={POPULAR_CARD_WIDTH}
                  onPress={() => handleToolPress(row[0])}
                />
                <PopularCard
                  tool={row[1]}
                  isDark={isDark}
                  colors={colors}
                  cardWidth={POPULAR_CARD_WIDTH}
                  onPress={() => handleToolPress(row[1])}
                />
              </View>
            ))}

            {/* 5. Complete Categorized Tools (No boxed container, maximum space and margin) */}
            {teacherAssistantCategories.map((cat) => (
              <View key={cat.id} style={styles.categorySectionContainer}>
                {/* Category Header (without emoji icon) */}
                <View style={styles.categoryHeader}>
                  <Text style={[styles.sectionTitleText, { color: colors.text }]}>
                    {cat.title}
                  </Text>
                  <Text style={[styles.sectionSubtitleText, { color: colors.textLight }]}>
                    {cat.subtitle}
                  </Text>
                </View>

                {/* 4-Column Grid: exactly 4 items per row, wrapping downwards, starting from right */}
                <View style={styles.categoryGrid}>
                  {cat.tools.map((item) => (
                    <CategoryToolItem
                      key={item.id}
                      tool={item}
                      iconSize={ICON_BOX_SIZE}
                      colors={colors}
                      onPress={() => handleToolPress(item)}
                    />
                  ))}
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Compression & Conversion Hub Modals */}
      <CompressionHubModal
        visible={compressionModalVisible}
        onClose={() => setCompressionModalVisible(false)}
        navigation={navigation}
      />
      <ConversionHubModal
        visible={conversionModalVisible}
        onClose={() => setConversionModalVisible(false)}
        navigation={navigation}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  notificationDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  mainTitle: {
    fontSize: 20,
    fontFamily: 'Estedad-FD-Bold',
    fontWeight: '800',
    textAlign: 'center',
  },
  subTitle: {
    fontSize: 11,
    fontFamily: 'Estedad-FD-Regular',
    marginTop: 2,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: SCREEN_PADDING,
    paddingBottom: 40,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Estedad-FD-Medium',
    marginRight: 10,
  },
  sectionHeaderBox: {
    marginBottom: 12,
    alignItems: 'flex-end',
    width: '100%',
  },
  sectionTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  sectionTitleText: {
    fontSize: 16.5,
    fontFamily: 'Estedad-FD-Bold',
    fontWeight: '700',
    textAlign: 'right',
    lineHeight: 25,
    paddingBottom: 2,
  },
  sectionSubtitleText: {
    fontSize: 11.5,
    fontFamily: 'Estedad-FD-Regular',
    textAlign: 'right',
    marginTop: 3,
    lineHeight: 18,
    paddingBottom: 2,
  },
  courseCardsRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  courseCard: {
    width: COURSE_CARD_WIDTH,
    borderRadius: 20,
    borderWidth: 1.2,
    padding: 8,
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1.5,
  },
  courseImageWrapper: {
    width: '100%',
    height: 76,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  courseImage: {
    width: '100%',
    height: '100%',
  },
  courseFallbackBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseCardBottom: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  courseTitleText: {
    fontSize: 13,
    fontFamily: 'Estedad-FD-Bold',
    fontWeight: '700',
    color: '#0F172A',
    marginRight: 4,
    lineHeight: 19,
    paddingBottom: 1,
    textAlign: 'center',
  },
  // Popular header without the outer blue container
  popularHeaderBox: {
    alignItems: 'flex-end',
    marginBottom: 12,
    width: '100%',
  },
  popularTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  // Row container for exactly 2 popular items per row
  popularRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: POPULAR_GAP,
  },
  // Spacious card matching reference screenshot
  popularCard: {
    maxWidth: POPULAR_CARD_WIDTH,
    borderRadius: 18,
    borderWidth: 1,
    minHeight: 74,
    paddingVertical: 10,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1.5,
  },
  popularCardTextCol: {
    flex: 1,
    minWidth: 0,
    marginLeft: 6,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  popularCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
  },
  popularCardTitle: {
    fontSize: 12.5,
    fontFamily: 'Estedad-FD-Bold',
    fontWeight: '700',
    textAlign: 'right',
    lineHeight: 18,
    flexShrink: 1,
  },
  popularCardSubtitle: {
    fontSize: 9.2,
    fontFamily: 'Estedad-FD-Regular',
    textAlign: 'right',
    marginTop: 2,
    lineHeight: 14,
    width: '100%',
  },
  categorySectionContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  categoryHeader: {
    alignItems: 'flex-end',
    marginBottom: 12,
    width: '100%',
  },
  // 4-column wrapping grid: exactly 4 items per row, equal distance, wraps to right on next row
  categoryGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    width: '100%',
  },
  gridColItem: {
    width: '25%', // Exactly 4 items per row!
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  gridToolTitle: {
    fontSize: 10.5,
    fontFamily: 'Estedad-FD-Bold',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 7,
    lineHeight: 17,
    paddingHorizontal: 2,
    paddingBottom: 2,
    minHeight: 34,
  },
  searchResultsContainer: {
    marginTop: 8,
  },
  emptySearchBox: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default TeacherAssistantScreen;
