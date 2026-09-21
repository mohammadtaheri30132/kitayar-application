import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Alert, TouchableOpacity, Modal,
  TextInput, FlatList, ActivityIndicator, Share, ScrollView,
  PanResponder
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft, Moon, Sun, Columns, Rows, Search, X, List,
  Bookmark, Share2, Type, Edit3, Trash2, Sliders
} from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';

let AsyncStorage = null;
try { AsyncStorage = require('@react-native-async-storage/async-storage').default; } catch (e) {}

import PdfCore from '../../native/pdf/PdfCore';
import KitayarNativePdfView from '../../native/pdf/NativePdfView';

const PEN_COLORS = ['#e74c3c', '#f1c40f', '#2ecc71', '#3498db', '#000000'];

const PdfReaderScreen = ({ route, navigation }) => {
  const initialPath = route.params?.path;
  const password = route.params?.password;
  const insets = useSafeAreaInsets();
  const pdfViewRef = useRef(null);

  const [pdfPath, setPdfPath] = useState(null);
  const [pageInfo, setPageInfo] = useState({ current: 1, total: 0 });
  const [isControlsVisible, setIsControlsVisible] = useState(true); // 🟢 پنهان‌سازی خودکار هدر/فوتر
  
  // تنظیمات بصری
  const [isNightMode, setIsNightMode] = useState(false);
  const [isHorizontal, setIsHorizontal] = useState(false);
  const [brightness, setBrightness] = useState(1.0);
  const [showBrightnessSlider, setShowBrightnessSlider] = useState(false);

  // نقاشی
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#e74c3c');
  const [pageDrawings, setPageDrawings] = useState({});
  const [currentPath, setCurrentPath] = useState('');

  // استخراج متن قابل کپی
  const [textModalVisible, setTextModalVisible] = useState(false);
  const [pageTextContent, setPageTextContent] = useState('');
  const [isExtractingText, setIsExtractingText] = useState(false);

  // فهرست و نشانک‌ها
  const [toc, setToc] = useState([]);
  const [myBookmarks, setMyBookmarks] = useState([]);
  const [navModalVisible, setNavModalVisible] = useState(false);
  const [navTab, setNavTab] = useState('toc');

  // جستجو
  const [isSearching, setIsSearching] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchingEngine, setIsSearchingEngine] = useState(false);

  useEffect(() => {
    const initializePdf = async () => {
      try {
        let uri = initialPath || await PdfCore.getInitialUri();
        if (!uri) return navigation.goBack();
        setPdfPath(uri);
      } catch (err) { Alert.alert("خطا", err.message); }
    };
    initializePdf();
  }, [initialPath]);

  // ذخیره خودکار آخرین صفحه
  useEffect(() => {
    if (AsyncStorage && pdfPath && pageInfo.current > 1) {
      AsyncStorage.setItem(`last_page_${pdfPath}`, pageInfo.current.toString());
    }
  }, [pageInfo.current, pdfPath]);

  // ثبت لمس نقاشی
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentPath(`M${locationX.toFixed(1)},${locationY.toFixed(1)}`);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentPath(prev => `${prev} L${locationX.toFixed(1)},${locationY.toFixed(1)}`);
      },
      onPanResponderRelease: () => {
        setCurrentPath(prev => {
          if (!prev) return '';
          const curPage = pageInfo.current;
          setPageDrawings(drawings => ({
            ...drawings,
            [curPage]: [...(drawings[curPage] || []), { path: prev, color: selectedColor }]
          }));
          return '';
        });
      }
    })
  ).current;

  const extractCurrentPageText = async () => {
    setIsExtractingText(true);
    setTextModalVisible(true);
    try {
      const text = await PdfCore.getPageText(pdfPath, password, pageInfo.current - 1);
      setPageTextContent(text || 'متنی در این صفحه یافت نشد (احتمالاً صفحه عکس است).');
    } catch {
      setPageTextContent('خطا در استخراج متن.');
    } finally {
      setIsExtractingText(false);
    }
  };

  const handleSearch = async () => {
    if (!searchText.trim()) return;
    setIsSearchingEngine(true);
    setSearchResults([]);
    try {
      const results = await PdfCore.searchTextInPdf(pdfPath, password, searchText);
      if (results.length > 0) setSearchResults(results);
      else Alert.alert("نتیجه‌ای یافت نشد", `کلمه "${searchText}" وجود ندارد.`);
    } catch (e) {
      Alert.alert("خطا در جستجو", e.message);
    } finally {
      setIsSearchingEngine(false);
    }
  };

  const renderSelectableText = () => {
    if (!pageTextContent) return null;
    if (searchText && searchText.trim().length > 0) {
      const parts = pageTextContent.split(new RegExp(`(${searchText})`, 'gi'));
      return (
        <Text style={styles.selectableText} selectable={true}>
          {parts.map((part, i) => part.toLowerCase() === searchText.toLowerCase() 
            ? <Text key={i} style={styles.highlightedTextMode}>{part}</Text> 
            : part
          )}
        </Text>
      );
    }
    return <Text style={styles.selectableText} selectable={true}>{pageTextContent}</Text>;
  };

  const renderSnippet = (snippet) => {
    if (!searchText) return <Text style={styles.snippetText}>{snippet}</Text>;
    const parts = snippet.split(new RegExp(`(${searchText})`, 'gi'));
    return (
      <Text style={styles.snippetText}>
        {parts.map((part, i) => part.toLowerCase() === searchText.toLowerCase() ? <Text key={i} style={styles.highlightedText}>{part}</Text> : part)}
      </Text>
    );
  };

  const toggleBookmark = () => {
    const page = pageInfo.current;
    if (myBookmarks.includes(page)) setMyBookmarks(myBookmarks.filter(p => p !== page));
    else setMyBookmarks([...myBookmarks, page].sort((a, b) => a - b));
  };

  if (!pdfPath) return null;

  return (
    <View style={styles.container}>
      {brightness < 1.0 && <View pointerEvents="none" style={[styles.brightnessOverlay, { opacity: 1.0 - brightness }]} />}

      {/* هدر کنترل‌ها */}
      {isControlsVisible && (
        <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top + 10 : 15 }]}>
          {isSearching ? (
            <View style={styles.searchBar}>
              <TouchableOpacity onPress={() => { setIsSearching(false); setSearchResults([]); }} style={styles.iconBtn}><ArrowLeft color="#fff" size={24} /></TouchableOpacity>
              <TextInput
                style={styles.searchInput} placeholder="جستجو..." placeholderTextColor="#bdc3c7"
                value={searchText} onChangeText={setSearchText} onSubmitEditing={handleSearch} autoFocus
              />
              {isSearchingEngine && <ActivityIndicator color="#fff" style={{ marginRight: 10 }} />}
            </View>
          ) : (
            <View style={styles.headerNormal}>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}><ArrowLeft color="#fff" size={24} /></TouchableOpacity>
                <TouchableOpacity onPress={() => { setNavTab('toc'); setNavModalVisible(true); }} style={[styles.iconBtn, { marginRight: 8 }]}><List color="#fff" size={22} /></TouchableOpacity>
                <TouchableOpacity onPress={() => { setNavTab('bookmarks'); setNavModalVisible(true); }} style={styles.iconBtn}><Bookmark color={myBookmarks.length > 0 ? "#f1c40f" : "#fff"} size={22} /></TouchableOpacity>
              </View>

              <View style={styles.headerActions}>
                <TouchableOpacity onPress={() => setIsDrawingMode(!isDrawingMode)} style={[styles.iconBtn, isDrawingMode && styles.activeIconBtn]}><Edit3 color={isDrawingMode ? "#f1c40f" : "#fff"} size={20} /></TouchableOpacity>
                <TouchableOpacity onPress={() => setShowBrightnessSlider(!showBrightnessSlider)} style={styles.iconBtn}><Sliders color="#fff" size={20} /></TouchableOpacity>
                <TouchableOpacity onPress={extractCurrentPageText} style={styles.iconBtn}><Type color="#fff" size={20} /></TouchableOpacity>
                <TouchableOpacity onPress={() => Share.share({ url: pdfPath })} style={styles.iconBtn}><Share2 color="#fff" size={20} /></TouchableOpacity>
                <TouchableOpacity onPress={() => setIsSearching(true)} style={styles.iconBtn}><Search color="#fff" size={20} /></TouchableOpacity>
                <TouchableOpacity onPress={() => setIsHorizontal(!isHorizontal)} style={styles.iconBtn}>{isHorizontal ? <Rows color="#fff" size={20} /> : <Columns color="#fff" size={20} />}</TouchableOpacity>
                <TouchableOpacity onPress={() => setIsNightMode(!isNightMode)} style={styles.iconBtn}>{isNightMode ? <Sun color="#fff" size={22} /> : <Moon color="#fff" size={22} />}</TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}

      {isControlsVisible && isDrawingMode && (
        <View style={[styles.drawingToolbar, { top: insets.top + 60 }]}>
          <View style={styles.colorRow}>
            {PEN_COLORS.map(c => <TouchableOpacity key={c} onPress={() => setSelectedColor(c)} style={[styles.colorDot, { backgroundColor: c }, selectedColor === c && styles.selectedDot]} />)}
          </View>
          <TouchableOpacity onPress={() => setPageDrawings(prev => ({ ...prev, [pageInfo.current]: [] }))} style={styles.clearBtn}><Trash2 color="#e74c3c" size={18} /></TouchableOpacity>
        </View>
      )}

      {isControlsVisible && showBrightnessSlider && (
        <View style={[styles.sliderBox, { top: insets.top + 60 }]}>
          <Text style={styles.sliderLabel}>نور صفحه:</Text>
          <View style={styles.stepBtnRow}>
            <TouchableOpacity onPress={() => setBrightness(b => Math.max(0.3, b - 0.1))} style={styles.stepBtn}><Text style={styles.stepBtnText}>تیره‌تر -</Text></TouchableOpacity>
            <Text style={styles.brightnessValText}>{Math.round(brightness * 100)}%</Text>
            <TouchableOpacity onPress={() => setBrightness(b => Math.min(1.0, b + 0.1))} style={styles.stepBtn}><Text style={styles.stepBtnText}>روشن‌تر +</Text></TouchableOpacity>
          </View>
        </View>
      )}

      {isSearching && searchResults.length > 0 && (
        <View style={styles.searchResultsPanel}>
          <Text style={styles.searchCountText}>{searchResults.length} نتیجه:</Text>
          <FlatList
            data={searchResults}
            keyExtractor={(item, idx) => `res_${idx}`}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.searchResultItem} onPress={() => pdfViewRef.current?.jumpToPage(item.page)}>
                <Text style={styles.searchResultPage}>پرش به صفحه {item.page + 1}</Text>
                {renderSnippet(item.snippet)}
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      <KitayarNativePdfView
        ref={pdfViewRef}
        style={styles.nativePdfViewer}
        config={{
          path: pdfPath, password: password, nightMode: isNightMode, horizontal: isHorizontal,
          fitToWidth: true, enableSwipe: !isDrawingMode
        }}
        onTap={() => setIsControlsVisible(prev => !prev)} // 🟢 پنهان/آشکار کردن کنترل‌ها با لمس
        onDocumentLoaded={(event) => {
          const total = event?.nativeEvent?.pageCount ?? event?.nativeEvent?.pagecount;
          if (total) setPageInfo(prev => ({ ...prev, total }));
          if (event?.nativeEvent?.toc) setToc(event.nativeEvent.toc);
          if (AsyncStorage) {
            AsyncStorage.getItem(`last_page_${pdfPath}`).then(lastPage => {
              if (lastPage && parseInt(lastPage) > 1) {
                Alert.alert("ادامه مطالعه", `می‌خواهید از صفحه ${lastPage} ادامه دهید؟`, [
                  { text: "خیر", style: "cancel" }, { text: "بله", onPress: () => pdfViewRef.current?.jumpToPage(parseInt(lastPage) - 1) }
                ]);
              }
            });
          }
        }}
        onPageChanged={(event) => {
          const current = event?.nativeEvent?.page;
          if (current != null) setPageInfo(prev => ({ ...prev, current }));
        }}
      />

      <View style={StyleSheet.absoluteFill} pointerEvents={isDrawingMode ? 'auto' : 'none'} {...(isDrawingMode ? panResponder.panHandlers : {})}>
        <Svg style={StyleSheet.absoluteFill}>
          {(pageDrawings[pageInfo.current] || []).map((item, idx) => (
            <Path key={`line_${idx}`} d={item.path} stroke={item.color} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {currentPath ? <Path d={currentPath} stroke={selectedColor} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" /> : null}
        </Svg>
      </View>

      {/* مدال استخراج متن و انتخاب/کپی */}
      <Modal visible={textModalVisible} transparent animationType="slide" onRequestClose={() => setTextModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.textExtractContent, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.navHeader}>
              <TouchableOpacity onPress={() => setTextModalVisible(false)}><X color="#2c3e50" size={24} /></TouchableOpacity>
              <Text style={styles.textExtractTitle}>متن صفحه {pageInfo.current}</Text>
            </View>
            <View style={styles.textTipBox}><Text style={styles.textTip}>برای کپی کردن، انگشت خود را روی کلمه نگه دارید (Long Press).</Text></View>
            {isExtractingText ? <View style={styles.emptyState}><ActivityIndicator size="large" color="#3498db" /></View> : (
              <ScrollView style={{ flex: 1 }}>{renderSelectableText()}</ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* مدال فهرست/نشانک */}
      <Modal visible={navModalVisible} transparent animationType="slide" onRequestClose={() => setNavModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.navContent, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.navHeader}>
              <TouchableOpacity onPress={() => setNavModalVisible(false)}><X color="#2c3e50" size={24} /></TouchableOpacity>
              <View style={styles.tabContainer}>
                <TouchableOpacity onPress={() => setNavTab('bookmarks')} style={[styles.tabBtn, navTab === 'bookmarks' && styles.activeTab]}><Text style={[styles.tabText, navTab === 'bookmarks' && styles.activeTabText]}>نشانک‌ها</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => setNavTab('toc')} style={[styles.tabBtn, navTab === 'toc' && styles.activeTab]}><Text style={[styles.tabText, navTab === 'toc' && styles.activeTabText]}>فهرست</Text></TouchableOpacity>
              </View>
            </View>
            {navTab === 'toc' ? (
              toc.length === 0 ? <View style={styles.emptyState}><Text style={styles.emptyText}>فهرست مطالبی یافت نشد.</Text></View> :
                <FlatList data={toc} keyExtractor={(item, index) => `toc_${index}`} renderItem={({ item }) => (
                  <TouchableOpacity style={styles.listItem} onPress={() => { pdfViewRef.current?.jumpToPage(item.pageIdx); setNavModalVisible(false); }}>
                    <Text style={styles.listTitle} numberOfLines={1}>{item.title}</Text><Text style={styles.listPage}>{item.pageIdx + 1}</Text>
                  </TouchableOpacity>
                )} />
            ) : (
              myBookmarks.length === 0 ? <View style={styles.emptyState}><Text style={styles.emptyText}>هیچ نشانکی ندارید.</Text></View> :
                <FlatList data={myBookmarks} keyExtractor={(item) => `bm_${item}`} renderItem={({ item }) => (
                  <TouchableOpacity style={styles.listItem} onPress={() => { pdfViewRef.current?.jumpToPage(item - 1); setNavModalVisible(false); }}>
                    <Text style={styles.listTitle}>نشانک صفحه {item}</Text><Text style={styles.listPage}>{item}</Text>
                  </TouchableOpacity>
                )} />
            )}
          </View>
        </View>
      </Modal>

      {/* فوتر */}
      {isControlsVisible && !isSearching && pageInfo.total > 0 && (
        <View style={[styles.footer, { paddingBottom: insets.bottom > 0 ? insets.bottom + 10 : 30 }]}>
          <View style={styles.pageIndicator}>
            <TouchableOpacity onPress={() => { toggleBookmark(); Alert.alert("نشانک", myBookmarks.includes(pageInfo.current) ? "نشانک حذف شد." : "صفحه نشانک شد."); }}>
              <Bookmark color={myBookmarks.includes(pageInfo.current) ? "#f1c40f" : "#fff"} fill={myBookmarks.includes(pageInfo.current) ? "#f1c40f" : "transparent"} size={16} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
            <Text style={styles.pageText}>صفحه {pageInfo.current} از {pageInfo.total}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  nativePdfViewer: { flex: 1, backgroundColor: '#2c3e50' },
  brightnessOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000', zIndex: 15 },
  header: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, backgroundColor: 'rgba(44, 62, 80, 0.95)', paddingBottom: 10, paddingHorizontal: 10 },
  headerNormal: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  headerActions: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  iconBtn: { padding: 5 },
  activeIconBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 6 },
  searchBar: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 8, paddingHorizontal: 8 },
  searchInput: { flex: 1, color: '#fff', fontSize: 15, textAlign: 'right', paddingVertical: 8 },
  drawingToolbar: { position: 'absolute', left: 15, right: 15, zIndex: 25, backgroundColor: '#fff', padding: 8, borderRadius: 10, flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', elevation: 5 },
  colorRow: { flexDirection: 'row-reverse', gap: 10 },
  colorDot: { width: 24, height: 24, borderRadius: 12 },
  selectedDot: { borderWidth: 2, borderColor: '#2c3e50' },
  clearBtn: { padding: 4 },
  sliderBox: { position: 'absolute', left: 20, right: 20, zIndex: 25, backgroundColor: '#fff', padding: 12, borderRadius: 10, elevation: 5, alignItems: 'center' },
  sliderLabel: { fontSize: 13, color: '#2c3e50', fontWeight: 'bold', marginBottom: 8 },
  stepBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  stepBtn: { backgroundColor: '#f1f2f6', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  stepBtnText: { fontSize: 13, color: '#2c3e50', fontWeight: 'bold' },
  brightnessValText: { fontSize: 14, fontWeight: 'bold', color: '#34495e', minWidth: 40, textAlign: 'center' },
  searchResultsPanel: { position: 'absolute', top: 90, left: 10, right: 10, backgroundColor: '#fff', borderRadius: 12, maxHeight: 350, zIndex: 20, elevation: 10 },
  searchCountText: { textAlign: 'right', padding: 10, fontSize: 13, color: '#7f8c8d', borderBottomWidth: 1, borderBottomColor: '#ecf0f1', fontWeight: 'bold' },
  searchResultItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#f1f2f6' },
  searchResultHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 5 },
  searchResultPage: { fontSize: 12, color: '#e67e22', fontWeight: 'bold' },
  snippetText: { fontSize: 14, color: '#34495e', textAlign: 'right', lineHeight: 22 },
  highlightedText: { backgroundColor: '#f1c40f', color: '#000', fontWeight: 'bold' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10, alignItems: 'center', pointerEvents: 'none' },
  pageIndicator: { backgroundColor: 'rgba(0,0,0,0.75)', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, flexDirection: 'row-reverse', alignItems: 'center' },
  pageText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-start' },
  navContent: { flex: 1, backgroundColor: '#fff', width: '85%', alignSelf: 'flex-end', paddingHorizontal: 20 },
  textExtractContent: { flex: 1, backgroundColor: '#fff', marginHorizontal: 10, borderRadius: 12, paddingHorizontal: 16, marginTop: 40 },
  navHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottomWidth: 1, borderColor: '#eee' },
  textExtractTitle: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50' },
  textTipBox: { backgroundColor: '#e8f8f5', padding: 10, borderRadius: 8, marginTop: 10, marginBottom: 15 },
  textTip: { color: '#1abc9c', fontSize: 12, textAlign: 'center' },
  selectableText: { fontSize: 15, lineHeight: 26, color: '#2c3e50', textAlign: 'right', marginTop: 10 },
  highlightedTextMode: { backgroundColor: '#f1c40f', color: '#000', fontWeight: 'bold' },
  tabContainer: { flexDirection: 'row-reverse', backgroundColor: '#f1f2f6', borderRadius: 8, padding: 3 },
  tabBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  activeTab: { backgroundColor: '#fff', elevation: 2 },
  tabText: { fontSize: 14, color: '#7f8c8d', fontWeight: 'bold' },
  activeTabText: { color: '#2c3e50' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#7f8c8d', fontSize: 14 },
  listItem: { flexDirection: 'row-reverse', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderColor: '#f8f9fa' },
  listTitle: { fontSize: 14, color: '#34495e', textAlign: 'right', flex: 1 },
  listPage: { fontSize: 13, color: '#95a5a6' }
});

export default PdfReaderScreen;