import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  ActivityIndicator,
  Share,
  Dimensions,
  StatusBar,
  ScrollView,
  Platform,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  Sliders,
  Volume2,
  Share2,
  Check,
  X,
  Repeat,
  Compass,
  Sparkles,
  RefreshCw,
  Search,
} from 'lucide-react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../context/ThemeContext';
import {
  quranService,
  SurahData,
  AyahItem,
  RECITERS,
  TRANSLATION_EDITIONS,
  toPersianDigits,
  QuranSettings,
  DEFAULT_SETTINGS,
} from '../../../services/quranService';
import { QURAN_SURAHS, SurahMeta } from '../../../data/quranSurahs';
import { nativeAudioPlayer } from '../../../services/nativeAudioPlayer';

const { width } = Dimensions.get('window');

// Bismillah text in beautiful Uthmanic Arabic
const BISMILLAH_ARABIC = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';

export const QuranReaderScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { colors: appColors, isDark: appIsDark } = useTheme();

  // Params
  const initialSurahId = route.params?.surahId || 1;
  const initialTargetVerse = route.params?.targetVerse || 1;

  // State
  const [currentSurahId, setCurrentSurahId] = useState<number>(initialSurahId);
  const [surahData, setSurahData] = useState<SurahData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Settings
  const [settings, setSettings] = useState<QuranSettings>(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState<boolean>(false);

  // Audio Playback State
  const [playingVerse, setPlayingVerse] = useState<number | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [audioProgress, setAudioProgress] = useState<{ position: number; duration: number }>({
    position: 0,
    duration: 0,
  });
  const [audioError, setAudioError] = useState<string | null>(null);

  // Modals
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showReciterModal, setShowReciterModal] = useState<boolean>(false);
  const [showSurahPickerModal, setShowSurahPickerModal] = useState<boolean>(false);
  const [showJumpModal, setShowJumpModal] = useState<boolean>(false);
  const [pickerSearch, setPickerSearch] = useState<string>('');

  // Refs
  const flatListRef = useRef<FlatList<any>>(null);
  const continuousAudioRef = useRef<boolean>(settings.continuousAudio);
  continuousAudioRef.current = settings.continuousAudio;

  const playingVerseRef = useRef<number | null>(playingVerse);
  playingVerseRef.current = playingVerse;

  const surahDataRef = useRef<SurahData | null>(surahData);
  surahDataRef.current = surahData;

  const settingsRef = useRef<QuranSettings>(settings);
  settingsRef.current = settings;

  // Reading Theme Palette (Light, Sepia / Warm Paper, Dark)
  const themeColors = useMemo(() => {
    if (settings.themeMode === 'sepia') {
      return {
        background: '#fbf0d9',
        surface: '#f4e4c1',
        card: '#fff7e6',
        text: '#2c1e13',
        textLight: '#7c5e42',
        border: '#e4d2ad',
        accent: '#92400e',
        activeHighlight: 'rgba(217, 119, 6, 0.18)',
        activeBorder: '#d97706',
        bismillahBorder: '#e4d2ad',
      };
    } else if (settings.themeMode === 'dark' || (settings.themeMode === 'light' && appIsDark)) {
      return {
        background: '#0b1324',
        surface: '#15213b',
        card: '#1e293b',
        text: '#f8fafc',
        textLight: '#94a3b8',
        border: '#334155',
        accent: '#10b981',
        activeHighlight: 'rgba(16, 185, 129, 0.18)',
        activeBorder: '#10b981',
        bismillahBorder: '#1e3a5f',
      };
    } else {
      // Default Light
      return {
        background: '#f8fafc',
        surface: '#ffffff',
        card: '#ffffff',
        text: '#0f172a',
        textLight: '#64748b',
        border: '#e2e8f0',
        accent: '#059669',
        activeHighlight: 'rgba(5, 150, 105, 0.1)',
        activeBorder: '#059669',
        bismillahBorder: '#d1fae5',
      };
    }
  }, [settings.themeMode, appIsDark]);

  // Load Settings on mount
  useEffect(() => {
    quranService.getSettings().then(s => {
      setSettings(s);
      setSettingsLoaded(true);
    });
  }, []);

  // Fetch Surah data whenever surah ID or translation edition changes
  useEffect(() => {
    if (!settingsLoaded) return;
    loadSurah(currentSurahId, settings.translationEditionId, settings.reciterId);
  }, [currentSurahId, settings.translationEditionId, settingsLoaded]);

  const loadSurah = async (surahId: number, translationId: string, reciterId: string) => {
    setLoading(true);
    setErrorMessage(null);
    stopAudio();

    try {
      const data = await quranService.getSurah(surahId, translationId, reciterId);
      setSurahData(data);

      // Bookmark last read surah
      quranService.saveLastRead(surahId, 1);

      // Scroll to target verse if requested
      if (initialTargetVerse > 1) {
        setTimeout(() => {
          scrollToVerse(initialTargetVerse);
        }, 400);
      }
    } catch (err: any) {
      console.warn('Error loading surah:', err);
      setErrorMessage(err.message || 'خطا در بارگذاری سوره. لطفاً دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  };

  // Scroll to a specific verse
  const scrollToVerse = (verseNum: number) => {
    if (!surahData?.verses || surahData.verses.length === 0) return;
    const index = surahData.verses.findIndex(v => v.verse === verseNum);
    if (index >= 0 && flatListRef.current) {
      try {
        flatListRef.current.scrollToIndex({
          index,
          animated: true,
          viewPosition: 0.2,
        });
      } catch (e) {
        flatListRef.current.scrollToOffset({ offset: index * 120, animated: true });
      }
    }
  };

  // Audio Playback Listener setup
  useEffect(() => {
    const subState = nativeAudioPlayer.onStateChange(evt => {
      if (evt.state === 'playing') {
        setIsAudioPlaying(true);
      } else if (evt.state === 'paused' || evt.state === 'stopped') {
        setIsAudioPlaying(false);
      } else if (evt.state === 'error') {
        setIsAudioPlaying(false);
        setAudioError(evt.error || 'خطا در پخش صوت');
      }
    });

    const subProgress = nativeAudioPlayer.onProgress(evt => {
      setAudioProgress({ position: evt.position, duration: evt.duration });
    });

    const subCompleted = nativeAudioPlayer.onCompleted(() => {
      handleVerseCompleted();
    });

    const subError = nativeAudioPlayer.onError(evt => {
      setIsAudioPlaying(false);
      setAudioError(evt.error || 'خطا در پخش آیه');
    });

    return () => {
      subState?.remove();
      subProgress?.remove();
      subCompleted?.remove();
      subError?.remove();
      nativeAudioPlayer.stop().catch(() => {});
    };
  }, []);

  // When a verse completes playback
  const handleVerseCompleted = useCallback(() => {
    const currentV = playingVerseRef.current;
    const surah = surahDataRef.current;

    if (!currentV || !surah) {
      setIsAudioPlaying(false);
      setPlayingVerse(null);
      return;
    }

    if (continuousAudioRef.current) {
      const nextVerseNum = currentV + 1;
      const nextAyah = surah.verses.find(v => v.verse === nextVerseNum);

      if (nextAyah) {
        // Play next verse
        playAyah(nextAyah);
        scrollToVerse(nextVerseNum);
        quranService.saveLastRead(surah.meta.id, nextVerseNum);
      } else {
        // Finished current surah
        setIsAudioPlaying(false);
        setPlayingVerse(null);
      }
    } else {
      setIsAudioPlaying(false);
      setPlayingVerse(null);
    }
  }, []);

  // Play a specific verse
  const playAyah = useCallback(
    async (ayah: AyahItem) => {
      const meta = surahDataRef.current?.meta;
      const reciter =
        RECITERS.find(r => r.id === settingsRef.current.reciterId) || RECITERS[0];

      setPlayingVerse(ayah.verse);
      setIsAudioPlaying(true);
      setAudioError(null);
      setAudioProgress({ position: 0, duration: 0 });

      // Save as last read
      if (meta) {
        quranService.saveLastRead(meta.id, ayah.verse);
      }

      try {
        await nativeAudioPlayer.playTrack({
          id: `quran_${ayah.chapter}_${ayah.verse}`,
          url: ayah.audioUrl,
          title: `سوره ${meta?.name || ''} - آیه ${toPersianDigits(ayah.verse)}`,
          artist: reciter.name,
        });
      } catch (err: any) {
        console.warn('Error playing audio:', err);
        setIsAudioPlaying(false);
        setAudioError('خطا در برقراری ارتباط با پخش‌کننده صوت');
      }
    },
    []
  );

  const togglePlayPause = async () => {
    if (!playingVerse) {
      if (surahData && surahData.verses.length > 0) {
        playAyah(surahData.verses[0]);
      }
      return;
    }

    if (isAudioPlaying) {
      await nativeAudioPlayer.pause();
      setIsAudioPlaying(false);
    } else {
      await nativeAudioPlayer.resume();
      setIsAudioPlaying(true);
    }
  };

  const playNextVerse = () => {
    if (!surahData) return;
    const current = playingVerse || 0;
    const nextAyah = surahData.verses.find(v => v.verse === current + 1);
    if (nextAyah) {
      playAyah(nextAyah);
      scrollToVerse(nextAyah.verse);
    }
  };

  const playPrevVerse = () => {
    if (!surahData) return;
    const current = playingVerse || 2;
    const prevAyah = surahData.verses.find(v => v.verse === current - 1);
    if (prevAyah) {
      playAyah(prevAyah);
      scrollToVerse(prevAyah.verse);
    }
  };

  const stopAudio = async () => {
    try {
      await nativeAudioPlayer.stop();
    } catch (e) {}
    setIsAudioPlaying(false);
    setPlayingVerse(null);
    setAudioProgress({ position: 0, duration: 0 });
  };

  // Surah navigation
  const goToNextSurah = () => {
    if (currentSurahId < 114) {
      setCurrentSurahId(prev => prev + 1);
    }
  };

  const goToPrevSurah = () => {
    if (currentSurahId > 1) {
      setCurrentSurahId(prev => prev - 1);
    }
  };

  // Share Ayah
  const handleShareAyah = async (ayah: AyahItem) => {
    const meta = surahData?.meta;
    const message = `﴿${ayah.arabicText}﴾\n[سوره ${meta?.name || ''} - آیه ${toPersianDigits(ayah.verse)}]\n\nترجمه:\n${ayah.persianTranslation}\n\n(از طریق کیتایار)`;
    try {
      await Share.share({ message });
    } catch (e) {}
  };

  // Update Settings
  const updateSettings = async (updates: Partial<QuranSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    await quranService.saveSettings(updates);
  };

  // Filtered surahs for picker modal
  const filteredSurahsForPicker = useMemo(() => {
    if (!pickerSearch.trim()) return QURAN_SURAHS;
    const q = pickerSearch.trim().toLowerCase();
    return QURAN_SURAHS.filter(
      s =>
        s.name.includes(q) ||
        s.arabicNameFull.includes(q) ||
        s.persianName.includes(q) ||
        String(s.id) === q ||
        toPersianDigits(s.id) === q
    );
  }, [pickerSearch]);

  const activeReciter = useMemo(() => {
    return RECITERS.find(r => r.id === settings.reciterId) || RECITERS[0];
  }, [settings.reciterId]);

  const activeTranslation = useMemo(() => {
    return (
      TRANSLATION_EDITIONS.find(t => t.id === settings.translationEditionId) ||
      TRANSLATION_EDITIONS[0]
    );
  }, [settings.translationEditionId]);

  // Render each verse item
  const renderVerseItem = ({ item }: { item: AyahItem }) => {
    const isPlaying = playingVerse === item.verse;

    return (
      <View
        style={[
          styles.verseCard,
          {
            backgroundColor: isPlaying ? themeColors.activeHighlight : themeColors.card,
            borderColor: isPlaying ? themeColors.activeBorder : themeColors.border,
          },
        ]}
      >
        {/* Ayah Action Bar */}
        <View style={styles.verseActionBar}>
          {/* Right: Verse Number Ornament */}
          <View
            style={[
              styles.verseNumberBadge,
              {
                backgroundColor: isPlaying ? themeColors.accent : themeColors.surface,
                borderColor: themeColors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.verseNumberText,
                { color: isPlaying ? '#ffffff' : themeColors.accent },
              ]}
            >
              ﴿{toPersianDigits(item.verse)}﴾
            </Text>
          </View>

          {/* Left: Quick Actions */}
          <View style={styles.verseActionsGroup}>
            {/* Play Button */}
            <TouchableOpacity
              style={[
                styles.verseActionButton,
                {
                  backgroundColor: isPlaying && isAudioPlaying ? themeColors.accent : themeColors.surface,
                  borderColor: themeColors.border,
                },
              ]}
              onPress={() => (isPlaying && isAudioPlaying ? togglePlayPause() : playAyah(item))}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {isPlaying && isAudioPlaying ? (
                <Pause size={15} color="#ffffff" />
              ) : (
                <Play size={15} color={themeColors.accent} />
              )}
            </TouchableOpacity>

            {/* Share Button */}
            <TouchableOpacity
              style={[
                styles.verseActionButton,
                { backgroundColor: themeColors.surface, borderColor: themeColors.border },
              ]}
              onPress={() => handleShareAyah(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Share2 size={15} color={themeColors.textLight} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Arabic Text */}
        <Text
          style={[
            styles.arabicText,
            {
              fontSize: settings.arabicFontSize,
              lineHeight: settings.arabicFontSize * 2.0,
              color: themeColors.text,
            },
          ]}
          selectable
        >
          {item.arabicText}
        </Text>

        {/* Persian Translation */}
        {settings.showTranslation && item.persianTranslation ? (
          <View style={styles.translationContainer}>
            <Text
              style={[
                styles.persianText,
                {
                  fontSize: settings.persianFontSize,
                  lineHeight: settings.persianFontSize * 1.8,
                  color: themeColors.textLight,
                },
              ]}
              selectable
            >
              {item.persianTranslation}
            </Text>
          </View>
        ) : null}
      </View>
    );
  };

  // Surah Header Banner Component
  const renderSurahHeader = () => {
    if (!surahData) return null;
    const meta = surahData.meta;
    const isMeccan = meta.revelationEn === 'Mecca';
    const showBismillahBanner = meta.id !== 1 && meta.id !== 9;

    return (
      <View style={styles.surahHeaderSection}>
        {/* Ornate Frame Card */}
        <View
          style={[
            styles.surahIntroCard,
            {
              backgroundColor: themeColors.card,
              borderColor: themeColors.border,
            },
          ]}
        >
          <View style={styles.surahIntroHeader}>
            <View
              style={[
                styles.revelationTag,
                {
                  backgroundColor: isMeccan ? '#fef3c7' : '#dcfce7',
                },
              ]}
            >
              <Text
                style={[
                  styles.revelationTagText,
                  { color: isMeccan ? '#b45309' : '#15803d' },
                ]}
              >
                {meta.revelation}
              </Text>
            </View>

            <Text style={[styles.surahIntroTitle, { color: themeColors.accent }]}>
              {meta.arabicNameFull}
            </Text>

            <View style={[styles.juzTag, { backgroundColor: themeColors.surface }]}>
              <Text style={[styles.juzTagText, { color: themeColors.textLight }]}>
                جزء {toPersianDigits(meta.juz)}
              </Text>
            </View>
          </View>

          <Text style={[styles.surahIntroMeaning, { color: themeColors.textLight }]}>
            {meta.persianName} • {toPersianDigits(meta.versesCount)} آیه • صفحه {toPersianDigits(meta.page)}
          </Text>
        </View>

        {/* Grand Bismillah Banner */}
        {showBismillahBanner && (
          <View
            style={[
              styles.bismillahBanner,
              {
                backgroundColor: themeColors.card,
                borderColor: themeColors.bismillahBorder,
              },
            ]}
          >
            <Text style={[styles.bismillahArabic, { color: themeColors.text }]}>
              {BISMILLAH_ARABIC}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: themeColors.background }]}
      edges={['top']}
    >
      <StatusBar
        barStyle={
          settings.themeMode === 'dark' || (settings.themeMode === 'light' && appIsDark)
            ? 'light-content'
            : 'dark-content'
        }
      />

      {/* Top Navbar */}
      <View
        style={[
          styles.navbar,
          {
            backgroundColor: themeColors.surface,
            borderBottomColor: themeColors.border,
          },
        ]}
      >
        {/* Right: Back button */}
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowRight size={22} color={themeColors.text} />
        </TouchableOpacity>

        {/* Center: Surah Selector Trigger & Prev/Next */}
        <View style={styles.navCenter}>
          <TouchableOpacity
            style={styles.navSurahSelector}
            onPress={() => setShowSurahPickerModal(true)}
            activeOpacity={0.8}
          >
            <Text style={[styles.navSurahTitle, { color: themeColors.text }]}>
              {surahData?.meta ? surahData.meta.name : `سوره ${currentSurahId}`}
            </Text>
            <ChevronLeft size={16} color={themeColors.textLight} />
          </TouchableOpacity>

          <View style={styles.navArrows}>
            <TouchableOpacity
              style={[
                styles.navArrowBtn,
                currentSurahId <= 1 && styles.navArrowDisabled,
              ]}
              onPress={goToPrevSurah}
              disabled={currentSurahId <= 1}
            >
              <ChevronRight
                size={20}
                color={currentSurahId <= 1 ? themeColors.border : themeColors.text}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.navArrowBtn,
                currentSurahId >= 114 && styles.navArrowDisabled,
              ]}
              onPress={goToNextSurah}
              disabled={currentSurahId >= 114}
            >
              <ChevronLeft
                size={20}
                color={currentSurahId >= 114 ? themeColors.border : themeColors.text}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Left: Quick Actions (Reciter, Jump, Settings) */}
        <View style={styles.navActions}>
          <TouchableOpacity
            style={styles.navIconBtn}
            onPress={() => setShowReciterModal(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Volume2 size={20} color={themeColors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navIconBtn}
            onPress={() => setShowJumpModal(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Compass size={20} color={themeColors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navIconBtn}
            onPress={() => setShowSettingsModal(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Sliders size={20} color={themeColors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.accent} />
          <Text style={[styles.loadingText, { color: themeColors.textLight }]}>
            در حال بارگذاری سوره مبارکه...
          </Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorTitle, { color: '#ef4444' }]}>خطا در دریافت متن</Text>
          <Text style={[styles.errorSubtitle, { color: themeColors.textLight }]}>
            {errorMessage}
          </Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: themeColors.accent }]}
            onPress={() => loadSurah(currentSurahId, settings.translationEditionId, settings.reciterId)}
          >
            <RefreshCw size={18} color="#ffffff" style={{ marginLeft: 6 }} />
            <Text style={styles.retryBtnText}>تلاش دوباره</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={surahData?.verses || []}
          keyExtractor={item => `${item.chapter}_${item.verse}`}
          renderItem={renderVerseItem}
          ListHeaderComponent={renderSurahHeader}
          contentContainerStyle={[
            styles.listContent,
            playingVerse !== null && { paddingBottom: 120 },
          ]}
          showsVerticalScrollIndicator={false}
          initialNumToRender={20}
          maxToRenderPerBatch={25}
          windowSize={11}
          getItemLayout={(data, index) => ({
            length: 160,
            offset: 160 * index,
            index,
          })}
        />
      )}

      {/* Sticky Bottom Audio Player Bar */}
      {playingVerse !== null && (
        <View
          style={[
            styles.playerBar,
            {
              backgroundColor: themeColors.surface,
              borderTopColor: themeColors.border,
            },
          ]}
        >
          {/* Progress Line */}
          {audioProgress.duration > 0 && (
            <View style={styles.playerProgressBg}>
              <View
                style={[
                  styles.playerProgressFill,
                  {
                    backgroundColor: themeColors.accent,
                    width: `${Math.min(
                      100,
                      (audioProgress.position / audioProgress.duration) * 100
                    )}%`,
                  },
                ]}
              />
            </View>
          )}

          <View style={styles.playerBarInner}>
            {/* Close audio dock */}
            <TouchableOpacity
              style={styles.playerCloseBtn}
              onPress={stopAudio}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={18} color={themeColors.textLight} />
            </TouchableOpacity>

            {/* Playback Controls */}
            <View style={styles.playerControls}>
              <TouchableOpacity
                style={styles.playerControlBtn}
                onPress={playNextVerse}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <SkipBack size={18} color={themeColors.text} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.playerMainPlayBtn, { backgroundColor: themeColors.accent }]}
                onPress={togglePlayPause}
              >
                {isAudioPlaying ? (
                  <Pause size={18} color="#ffffff" />
                ) : (
                  <Play size={18} color="#ffffff" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.playerControlBtn}
                onPress={playPrevVerse}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <SkipForward size={18} color={themeColors.text} />
              </TouchableOpacity>

              {/* Continuous Auto-play toggle */}
              <TouchableOpacity
                style={[
                  styles.continuousBtn,
                  settings.continuousAudio && {
                    backgroundColor: `${themeColors.accent}20`,
                  },
                ]}
                onPress={() => updateSettings({ continuousAudio: !settings.continuousAudio })}
              >
                <Repeat
                  size={15}
                  color={settings.continuousAudio ? themeColors.accent : themeColors.textLight}
                />
              </TouchableOpacity>
            </View>

            {/* Track Info (Right aligned) */}
            <View style={styles.playerInfo}>
              <Text
                style={[styles.playerAyahTitle, { color: themeColors.text }]}
                numberOfLines={1}
              >
                آیه {toPersianDigits(playingVerse)} • {surahData?.meta?.name}
              </Text>
              <Text
                style={[styles.playerReciterName, { color: themeColors.textLight }]}
                numberOfLines={1}
              >
                {activeReciter.name}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* MODAL 1: Display & Font Settings */}
      <Modal
        visible={showSettingsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: themeColors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>تنظیمات قلم و نمایش</Text>
              <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
                <X size={20} color={themeColors.textLight} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Reading Theme selector */}
              <Text style={[styles.settingLabel, { color: themeColors.text }]}>حالت مطالعه</Text>
              <View style={styles.themeOptionsRow}>
                <TouchableOpacity
                  style={[
                    styles.themeOptionBtn,
                    settings.themeMode === 'light' && styles.themeOptionBtnActive,
                    { backgroundColor: '#ffffff', borderColor: '#e2e8f0' },
                  ]}
                  onPress={() => updateSettings({ themeMode: 'light' })}
                >
                  <Text style={{ color: '#0f172a', fontWeight: '700' }}>روشن</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.themeOptionBtn,
                    settings.themeMode === 'sepia' && styles.themeOptionBtnActive,
                    { backgroundColor: '#fbf0d9', borderColor: '#e4d2ad' },
                  ]}
                  onPress={() => updateSettings({ themeMode: 'sepia' })}
                >
                  <Text style={{ color: '#2c1e13', fontWeight: '700' }}>کاغذی (سپیا)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.themeOptionBtn,
                    settings.themeMode === 'dark' && styles.themeOptionBtnActive,
                    { backgroundColor: '#0f172a', borderColor: '#334155' },
                  ]}
                  onPress={() => updateSettings({ themeMode: 'dark' })}
                >
                  <Text style={{ color: '#f8fafc', fontWeight: '700' }}>شب (تیره)</Text>
                </TouchableOpacity>
              </View>

              {/* Arabic Font Size */}
              <View style={styles.sizeSection}>
                <View style={styles.sizeSectionHeader}>
                  <Text style={[styles.settingLabel, { color: themeColors.text }]}>
                    اندازه متن عربی: {toPersianDigits(settings.arabicFontSize)}
                  </Text>
                </View>
                <View style={styles.sizeStepper}>
                  <TouchableOpacity
                    style={[styles.stepperBtn, { borderColor: themeColors.border }]}
                    onPress={() =>
                      updateSettings({
                        arabicFontSize: Math.max(16, settings.arabicFontSize - 2),
                      })
                    }
                  >
                    <Text style={[styles.stepperBtnText, { color: themeColors.text }]}>-</Text>
                  </TouchableOpacity>
                  <Text style={[styles.sampleArabic, { fontSize: settings.arabicFontSize, color: themeColors.text }]}>
                    بِسْمِ اللَّهِ
                  </Text>
                  <TouchableOpacity
                    style={[styles.stepperBtn, { borderColor: themeColors.border }]}
                    onPress={() =>
                      updateSettings({
                        arabicFontSize: Math.min(38, settings.arabicFontSize + 2),
                      })
                    }
                  >
                    <Text style={[styles.stepperBtnText, { color: themeColors.text }]}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Persian Font Size */}
              <View style={styles.sizeSection}>
                <View style={styles.sizeSectionHeader}>
                  <Text style={[styles.settingLabel, { color: themeColors.text }]}>
                    اندازه ترجمه فارسی: {toPersianDigits(settings.persianFontSize)}
                  </Text>
                </View>
                <View style={styles.sizeStepper}>
                  <TouchableOpacity
                    style={[styles.stepperBtn, { borderColor: themeColors.border }]}
                    onPress={() =>
                      updateSettings({
                        persianFontSize: Math.max(11, settings.persianFontSize - 1),
                      })
                    }
                  >
                    <Text style={[styles.stepperBtnText, { color: themeColors.text }]}>-</Text>
                  </TouchableOpacity>
                  <Text style={[styles.samplePersian, { fontSize: settings.persianFontSize, color: themeColors.textLight }]}>
                    به نام خداوند
                  </Text>
                  <TouchableOpacity
                    style={[styles.stepperBtn, { borderColor: themeColors.border }]}
                    onPress={() =>
                      updateSettings({
                        persianFontSize: Math.min(24, settings.persianFontSize + 1),
                      })
                    }
                  >
                    <Text style={[styles.stepperBtnText, { color: themeColors.text }]}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Show / Hide Translation */}
              <TouchableOpacity
                style={[
                  styles.toggleRow,
                  { borderColor: themeColors.border, backgroundColor: themeColors.card },
                ]}
                onPress={() =>
                  updateSettings({ showTranslation: !settings.showTranslation })
                }
              >
                <View
                  style={[
                    styles.checkbox,
                    settings.showTranslation && { backgroundColor: themeColors.accent },
                  ]}
                >
                  {settings.showTranslation && <Check size={14} color="#ffffff" />}
                </View>
                <Text style={[styles.toggleRowText, { color: themeColors.text }]}>
                  نمایش ترجمه فارسی زیر هر آیه
                </Text>
              </TouchableOpacity>

              {/* Translator Edition Selector */}
              <Text style={[styles.settingLabel, { color: themeColors.text, marginTop: 14 }]}>
                مترجم قرآن کریم
              </Text>
              {TRANSLATION_EDITIONS.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.editionItem,
                    settings.translationEditionId === item.id && {
                      backgroundColor: `${themeColors.accent}15`,
                      borderColor: themeColors.accent,
                    },
                    { borderColor: themeColors.border },
                  ]}
                  onPress={() => updateSettings({ translationEditionId: item.id })}
                >
                  <Text
                    style={[
                      styles.editionItemText,
                      {
                        color:
                          settings.translationEditionId === item.id
                            ? themeColors.accent
                            : themeColors.text,
                      },
                    ]}
                  >
                    {item.name}
                  </Text>
                  {settings.translationEditionId === item.id && (
                    <Check size={18} color={themeColors.accent} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: Reciter Selection */}
      <Modal
        visible={showReciterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReciterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: themeColors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>انتخاب قاری قرآن</Text>
              <TouchableOpacity onPress={() => setShowReciterModal(false)}>
                <X size={20} color={themeColors.textLight} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {RECITERS.map(reciter => {
                const isSelected = settings.reciterId === reciter.id;
                return (
                  <TouchableOpacity
                    key={reciter.id}
                    style={[
                      styles.reciterItem,
                      isSelected && {
                        backgroundColor: `${themeColors.accent}15`,
                        borderColor: themeColors.accent,
                      },
                      { borderColor: themeColors.border },
                    ]}
                    onPress={() => {
                      updateSettings({ reciterId: reciter.id });
                      setShowReciterModal(false);
                      // Update audio URLs in current surah
                      if (surahData) {
                        loadSurah(surahData.meta.id, settings.translationEditionId, reciter.id);
                      }
                    }}
                  >
                    <View style={styles.reciterItemRight}>
                      <View
                        style={[
                          styles.reciterIconCircle,
                          {
                            backgroundColor: isSelected
                              ? themeColors.accent
                              : `${themeColors.accent}20`,
                          },
                        ]}
                      >
                        <Volume2
                          size={18}
                          color={isSelected ? '#ffffff' : themeColors.accent}
                        />
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text
                          style={[
                            styles.reciterNameText,
                            {
                              color: isSelected ? themeColors.accent : themeColors.text,
                            },
                          ]}
                        >
                          {reciter.name}
                        </Text>
                        <Text style={[styles.reciterSubText, { color: themeColors.textLight }]}>
                          {reciter.subname} • {reciter.bitrate}
                        </Text>
                      </View>
                    </View>
                    {isSelected && <Check size={20} color={themeColors.accent} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: Surah Quick Picker */}
      <Modal
        visible={showSurahPickerModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSurahPickerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: themeColors.surface, maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>انتخاب سوره</Text>
              <TouchableOpacity onPress={() => setShowSurahPickerModal(false)}>
                <X size={20} color={themeColors.textLight} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View
              style={[
                styles.searchBoxModal,
                { backgroundColor: themeColors.card, borderColor: themeColors.border },
              ]}
            >
              <Search size={16} color={themeColors.textLight} />
              <TextInput
                style={[styles.searchModalInput, { color: themeColors.text }]}
                placeholder="جستجوی سوره..."
                placeholderTextColor={themeColors.textLight}
                value={pickerSearch}
                onChangeText={setPickerSearch}
                textAlign="right"
              />
            </View>

            <FlatList
              data={filteredSurahsForPicker}
              keyExtractor={item => String(item.id)}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = item.id === currentSurahId;
                return (
                  <TouchableOpacity
                    style={[
                      styles.pickerSurahRow,
                      isSelected && {
                        backgroundColor: `${themeColors.accent}15`,
                        borderColor: themeColors.accent,
                      },
                      { borderColor: themeColors.border },
                    ]}
                    onPress={() => {
                      setCurrentSurahId(item.id);
                      setShowSurahPickerModal(false);
                      setPickerSearch('');
                    }}
                  >
                    <Text style={[styles.pickerSurahAyahs, { color: themeColors.textLight }]}>
                      {toPersianDigits(item.versesCount)} آیه • جزء {toPersianDigits(item.juz)}
                    </Text>

                    <View style={styles.pickerSurahRight}>
                      <View style={{ alignItems: 'flex-end', marginRight: 10 }}>
                        <Text
                          style={[
                            styles.pickerSurahArabic,
                            {
                              color: isSelected ? themeColors.accent : themeColors.text,
                            },
                          ]}
                        >
                          {item.name}
                        </Text>
                        <Text
                          style={[styles.pickerSurahPersian, { color: themeColors.textLight }]}
                        >
                          {item.persianName}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.pickerNumberBox,
                          {
                            backgroundColor: isSelected
                              ? themeColors.accent
                              : `${themeColors.accent}15`,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.pickerNumberText,
                            { color: isSelected ? '#ffffff' : themeColors.accent },
                          ]}
                        >
                          {toPersianDigits(item.id)}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* MODAL 4: Jump to Ayah */}
      <Modal
        visible={showJumpModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowJumpModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: themeColors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>پرش به آیه</Text>
              <TouchableOpacity onPress={() => setShowJumpModal(false)}>
                <X size={20} color={themeColors.textLight} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.jumpSubtitle, { color: themeColors.textLight }]}>
              سوره {surahData?.meta?.name} دارای {toPersianDigits(surahData?.meta?.versesCount || 0)} آیه است.
            </Text>

            <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
              <View style={styles.jumpGrid}>
                {surahData?.verses.map(v => (
                  <TouchableOpacity
                    key={v.verse}
                    style={[
                      styles.jumpGridItem,
                      {
                        backgroundColor:
                          playingVerse === v.verse
                            ? themeColors.accent
                            : themeColors.card,
                        borderColor: themeColors.border,
                      },
                    ]}
                    onPress={() => {
                      scrollToVerse(v.verse);
                      setShowJumpModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.jumpGridText,
                        {
                          color:
                            playingVerse === v.verse
                              ? '#ffffff'
                              : themeColors.text,
                        },
                      ]}
                    >
                      {toPersianDigits(v.verse)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  navbar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  navButton: {
    padding: 6,
    borderRadius: 8,
  },
  navCenter: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  navSurahSelector: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginLeft: 6,
  },
  navSurahTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginLeft: 4,
  },
  navArrows: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  navArrowBtn: {
    padding: 4,
    borderRadius: 6,
  },
  navArrowDisabled: {
    opacity: 0.3,
  },
  navActions: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  navIconBtn: {
    padding: 6,
    borderRadius: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 40,
  },
  surahHeaderSection: {
    marginBottom: 16,
  },
  surahIntroCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  surahIntroHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  revelationTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  revelationTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  surahIntroTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  juzTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  juzTagText: {
    fontSize: 11,
  },
  surahIntroMeaning: {
    fontSize: 12,
    textAlign: 'center',
  },
  bismillahBanner: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  bismillahArabic: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: Platform.select({ ios: 'Geeza Pro', android: 'sans-serif' }),
  },
  verseCard: {
    borderRadius: 14,
    borderWidth: 1.2,
    padding: 14,
    marginBottom: 12,
  },
  verseActionBar: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  verseNumberBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  verseNumberText: {
    fontSize: 13,
    fontWeight: '700',
  },
  verseActionsGroup: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  verseActionButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arabicText: {
    textAlign: 'right',
    fontFamily: Platform.select({ ios: 'Geeza Pro', android: 'sans-serif' }),
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  translationContainer: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 0.6,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
  persianText: {
    textAlign: 'right',
  },
  playerBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  playerProgressBg: {
    height: 3,
    backgroundColor: 'rgba(150, 150, 150, 0.2)',
    width: '100%',
  },
  playerProgressFill: {
    height: 3,
  },
  playerBarInner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  playerInfo: {
    alignItems: 'flex-end',
    flex: 1,
    marginLeft: 12,
  },
  playerAyahTitle: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },
  playerReciterName: {
    fontSize: 11,
    marginTop: 2,
    textAlign: 'right',
  },
  playerControls: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  playerControlBtn: {
    padding: 6,
  },
  playerMainPlayBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continuousBtn: {
    padding: 6,
    borderRadius: 8,
  },
  playerCloseBtn: {
    padding: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  settingLabel: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 8,
  },
  themeOptionsRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginBottom: 18,
  },
  themeOptionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeOptionBtnActive: {
    borderColor: '#059669',
    borderWidth: 2,
  },
  sizeSection: {
    marginBottom: 16,
  },
  sizeSectionHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sizeStepper: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  stepperBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnText: {
    fontSize: 20,
    fontWeight: '700',
  },
  sampleArabic: {
    fontWeight: '600',
  },
  samplePersian: {
    fontWeight: '500',
  },
  toggleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  toggleRowText: {
    fontSize: 13,
    fontWeight: '600',
  },
  editionItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  editionItemText: {
    fontSize: 13,
    fontWeight: '600',
  },
  reciterItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  reciterItemRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  reciterIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  reciterNameText: {
    fontSize: 14,
    fontWeight: '700',
  },
  reciterSubText: {
    fontSize: 11,
    marginTop: 2,
  },
  searchBoxModal: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchModalInput: {
    flex: 1,
    marginRight: 8,
    fontSize: 13,
    paddingVertical: 0,
  },
  pickerSurahRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  pickerSurahRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  pickerNumberBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerNumberText: {
    fontSize: 12,
    fontWeight: '700',
  },
  pickerSurahArabic: {
    fontSize: 15,
    fontWeight: '700',
  },
  pickerSurahPersian: {
    fontSize: 11,
  },
  pickerSurahAyahs: {
    fontSize: 11,
  },
  jumpSubtitle: {
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 12,
  },
  jumpGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 4,
  },
  jumpGridItem: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  jumpGridText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
