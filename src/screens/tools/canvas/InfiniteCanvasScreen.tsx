import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  BackHandler,
  ActivityIndicator,
  Dimensions,
  Platform,
  I18nManager,
  NativeModules
} from 'react-native';
import { showError, showSuccess, showConfirm, showInfo } from '../../../components/feedback';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronRight,
  RotateCcw,
  RotateCw,
  Maximize2,
  ZoomIn,
  ZoomOut,
  FolderOpen,
  Share2,
  Download,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Edit3,
  Pen,
  Brush,
  Highlighter,
  Eraser,
  Shapes,
  Type,
  Image as ImageIcon,
  MousePointer,
  Grid,
  Plus,
  Check,
  X,
  FileText,
  Sliders,
  Settings2
} from 'lucide-react-native';
import {
  InfiniteCanvasNativeView,
  InfiniteCanvasRef,
  ViewportChangeEvent,
  SelectionChangeEvent,
  HistoryChangeEvent,
  TextEditRequestEvent
} from './InfiniteCanvasNativeView';
import { InfiniteCanvasService, DocumentMeta } from './InfiniteCanvasService';
import ImageCropPicker from 'react-native-image-crop-picker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLOR_PALETTE = [
  '#000000',
  '#2563EB',
  '#DC2626',
  '#16A34A',
  '#CA8A04',
  '#9333EA',
  '#EA580C',
  '#0D9488',
  '#475569',
  '#FFFFFF'
];

const STROKE_WIDTHS = [2, 5, 10, 18, 28];

const BASIC_SHAPES = [
  { id: 'rectangle', label: 'مستطیل' },
  { id: 'rounded_rectangle', label: 'گوشه‌گرد' },
  { id: 'circle', label: 'دایره' },
  { id: 'ellipse', label: 'بیضی' },
  { id: 'triangle', label: 'مثلث' },
  { id: 'diamond', label: 'لوزی' },
  { id: 'polygon', label: 'شش‌ضلعی' },
  { id: 'star', label: 'ستاره' },
  { id: 'line', label: 'خط' },
  { id: 'arrow', label: 'پیکان' },
  { id: 'double_arrow', label: 'دوطرفه' },
  { id: 'speech_bubble', label: 'حباب گفتار' },
  { id: 'callout', label: 'کادر پیام' },
  { id: 'bracket', label: 'کروشه' }
];

const DIAGRAM_SHAPES = [
  { id: 'process', label: 'فرآیند (مستطیل)' },
  { id: 'decision', label: 'تصمیم‌گیری' },
  { id: 'document', label: 'سند موج‌دار' },
  { id: 'cylinder', label: 'پایگاه داده' },
  { id: 'cloud', label: 'ابر / شبکه' },
  { id: 'connector', label: 'خط اتصال' }
];

export const InfiniteCanvasScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const canvasRef = useRef<InfiniteCanvasRef>(null);

  // Document state
  const [docId, setDocId] = useState<string>(() => 'doc_' + Date.now());
  const [docTitle, setDocTitle] = useState<string>('بوم بدون نام');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [elementCount, setElementCount] = useState<number>(0);

  // Active tool state
  const [activeTool, setActiveTool] = useState<
    'pen' | 'pencil' | 'brush' | 'highlighter' | 'eraser' | 'shape' | 'text' | 'select'
  >('pen');
  const [strokeColor, setStrokeColor] = useState<string>('#000000');
  const [strokeWidth, setStrokeWidth] = useState<number>(6);
  const [strokeOpacity, setStrokeOpacity] = useState<number>(1.0);

  // Shape properties
  const [selectedShapeType, setSelectedShapeType] = useState<string>('rectangle');
  const [shapeFillColor, setShapeFillColor] = useState<string>('transparent');
  const [shapeStrokeStyle, setShapeStrokeStyle] = useState<'solid' | 'dashed' | 'dotted'>('solid');

  // Background and Grid
  const [gridType, setGridType] = useState<'none' | 'grid' | 'dots' | 'lines'>('grid');
  const [canvasBgColor, setCanvasBgColor] = useState<string>('#FFFFFF');

  // History & Viewport
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);
  const [zoomScale, setZoomScale] = useState<number>(1.0);

  // Selection state
  const [selection, setSelection] = useState<SelectionChangeEvent>({
    hasSelection: false,
    count: 0,
    selectedType: '',
    text: '',
    color: '',
    width: 0
  });

  // Modals
  const [showShapesModal, setShowShapesModal] = useState<boolean>(false);
  const [showTextModal, setShowTextModal] = useState<boolean>(false);
  const [textModalInput, setTextModalInput] = useState<string>('');
  const [textModalFontSize, setTextModalFontSize] = useState<number>(24);
  const [textModalColor, setTextModalColor] = useState<string>('#000000');
  const [textModalBold, setTextModalBold] = useState<boolean>(false);
  const [textModalItalic, setTextModalItalic] = useState<boolean>(false);
  const [editingTextElementId, setEditingTextElementId] = useState<string | null>(null);
  const [pendingTextPos, setPendingTextPos] = useState<{ wx: number; wy: number } | null>(null);

  const [showProjectsModal, setShowProjectsModal] = useState<boolean>(false);
  const [savedProjects, setSavedProjects] = useState<DocumentMeta[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState<boolean>(false);

  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg' | 'pdf'>('png');
  const [pdfPageSize, setPdfPageSize] = useState<'fit' | 'a4_portrait' | 'a4_landscape'>('fit');
  const [pngTransparent, setPngTransparent] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Intercept back button for unsaved changes
  useEffect(() => {
    const onBackPress = () => {
      if (hasUnsavedChanges) {
        showConfirm({
          title: 'تغییرات ذخیره‌نشده',
          message: 'روی بوم تغییراتی ایجاد کرده‌اید. آیا مایلید خارج شوید؟',
          confirmText: 'خروج بدون ذخیره',
          cancelText: 'انصراف',
          isDestructive: true,
          onConfirm: () => navigation.goBack(),
        });
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [hasUnsavedChanges, docTitle, docId]);

  // Handle Save Project
  const handleSaveProject = async () => {
    try {
      const activeDocJson = await InfiniteCanvasService.getActiveDocumentJson();
      let docPayload: any = {};
      try {
        docPayload = JSON.parse(activeDocJson);
      } catch (e) {}

      docPayload.id = docId;
      docPayload.title = docTitle;
      docPayload.updatedAt = Date.now();
      docPayload.backgroundColor = canvasBgColor === '#FFFFFF' ? -1 : -16777216;
      docPayload.gridType = gridType;
      docPayload.gridColor = -2039584;
      docPayload.gridSpacing = 40;
      docPayload.viewportScale = zoomScale;

      await InfiniteCanvasService.saveDocument(JSON.stringify(docPayload));
      setHasUnsavedChanges(false);
      showSuccess(`بوم "${docTitle}" با موفقیت ذخیره گردید.`);
    } catch (e: any) {
      showError(e.message || 'خطا در ذخیره');
    }
  };

  // Handle Load Project List
  const loadProjectsList = async () => {
    setIsLoadingProjects(true);
    try {
      const list = await InfiniteCanvasService.listDocuments();
      setSavedProjects(list);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  // Open Project
  const handleOpenProject = async (id: string, title: string) => {
    try {
      const json = await InfiniteCanvasService.loadDocument(id);
      canvasRef.current?.loadDocument(json);
      setDocId(id);
      setDocTitle(title);
      setHasUnsavedChanges(false);
      setShowProjectsModal(false);
    } catch (e: any) {
      showError('عدم امکان بارگذاری بوم: ' + e.message);
    }
  };

  // New Canvas
  const handleNewCanvas = () => {
    showConfirm({
      title: 'ایجاد بوم جدید',
      message: 'آیا مطمئن هستید؟ بوم فعلی پاک خواهد شد.',
      confirmText: 'تایید',
      cancelText: 'انصراف',
      isDestructive: true,
      onConfirm: () => {
        canvasRef.current?.clear();
        setDocId('doc_' + Date.now());
        setDocTitle('بوم بدون نام');
        setHasUnsavedChanges(false);
        setShowProjectsModal(false);
      },
    });
  };

  // Image Picker
  const handlePickImage = async () => {
    try {
      const image = await ImageCropPicker.openPicker({
        mediaType: 'photo',
        cropping: false,
      });
      if (image?.path) {
        canvasRef.current?.addImage(image.path);
        setHasUnsavedChanges(true);
        return;
      }
    } catch (err: any) {
      if (err?.code !== 'E_PICKER_CANCELLED') {
        try {
          const { FilePickerModule } = NativeModules;
          if (FilePickerModule && FilePickerModule.pickImage) {
            const urisArray = await FilePickerModule.pickImage();
            const uri = Array.isArray(urisArray) ? urisArray[0] : urisArray;
            if (uri) {
              canvasRef.current?.addImage(uri);
              setHasUnsavedChanges(true);
            }
          }
        } catch (e) {}
      }
    }
  };

  // Export Document (Tightly cropped to actual content)
  const handleExport = async (andShare: boolean = false) => {
    setIsExporting(true);
    try {
      const res = await InfiniteCanvasService.exportActiveCanvas(
        exportFormat,
        {
          transparentBackground: pngTransparent,
          pageSize: pdfPageSize,
          scale: 1.5,
          quality: 92
        }
      );

      setIsExporting(false);
      setShowExportModal(false);

      if (andShare) {
        await InfiniteCanvasService.shareFile(res.filePath, res.mimeType, `اشتراک‌گذاری ${docTitle}`);
      } else {
        showConfirm({
          title: 'خروجی با موفقیت آماده شد',
          message: `فایل با نام ${res.fileName} ذخیره شد. آیا مایلید آن را به اشتراک بگذارید؟`,
          confirmText: 'اشتراک‌گذاری',
          cancelText: 'خیر',
          isDestructive: false,
          icon: Share2,
          onConfirm: () => InfiniteCanvasService.shareFile(res.filePath, res.mimeType, `اشتراک‌گذاری ${docTitle}`),
        });
      }
    } catch (e: any) {
      setIsExporting(false);
      showError(e.message || 'خطا در خروجی');
    }
  };

  // Save Text Modal
  const handleSaveTextModal = () => {
    if (!textModalInput.trim()) {
      setShowTextModal(false);
      return;
    }

    if (editingTextElementId) {
      canvasRef.current?.updateText(textModalInput, textModalFontSize, textModalColor);
    } else {
      canvasRef.current?.addText(
        textModalInput,
        textModalFontSize,
        textModalColor,
        textModalBold,
        textModalItalic,
        pendingTextPos?.wx,
        pendingTextPos?.wy
      );
    }

    setHasUnsavedChanges(true);
    setShowTextModal(false);
    setTextModalInput('');
    setEditingTextElementId(null);
    setPendingTextPos(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* 1. TOP HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => {
              if (hasUnsavedChanges) {
                showConfirm({
                  title: 'تغییرات ذخیره‌نشده',
                  message: 'روی بوم تغییراتی ایجاد کرده‌اید. آیا مایلید خارج شوید؟',
                  confirmText: 'خروج بدون ذخیره',
                  cancelText: 'انصراف',
                  isDestructive: true,
                  onConfirm: () => navigation.goBack(),
                });
              } else {
                navigation.goBack();
              }
            }}
          >
            <ChevronRight color="#1E293B" size={26} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.titleContainer}
            onPress={() => {
              showInfo(`عنوان فعلی بوم: ${docTitle}`);
            }}
          >
            <Text style={styles.titleText} numberOfLines={1}>
              {docTitle}
            </Text>
            {hasUnsavedChanges && <View style={styles.unsavedDot} />}
          </TouchableOpacity>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.headerIconBtn, !canUndo && styles.disabledBtn]}
            disabled={!canUndo}
            onPress={() => canvasRef.current?.undo()}
          >
            <RotateCcw color={canUndo ? '#1E293B' : '#94A3B8'} size={20} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.headerIconBtn, !canRedo && styles.disabledBtn]}
            disabled={!canRedo}
            onPress={() => canvasRef.current?.redo()}
          >
            <RotateCw color={canRedo ? '#1E293B' : '#94A3B8'} size={20} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.zoomPill}
            onPress={() => canvasRef.current?.resetViewport()}
          >
            <Text style={styles.zoomText}>{Math.round(zoomScale * 100)}%</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => canvasRef.current?.fitToContent()}
          >
            <Maximize2 color="#1E293B" size={19} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => {
              loadProjectsList();
              setShowProjectsModal(true);
            }}
          >
            <FolderOpen color="#1E293B" size={20} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.headerIconBtn, styles.exportBtn]}
            onPress={() => setShowExportModal(true)}
          >
            <Share2 color="#FFFFFF" size={19} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. NATIVE CANVAS VIEWPORT */}
      <View style={styles.canvasContainer}>
        <InfiniteCanvasNativeView
          ref={canvasRef}
          style={StyleSheet.absoluteFill}
          activeTool={activeTool}
          strokeColor={strokeColor}
          strokeWidth={strokeWidth}
          strokeOpacity={strokeOpacity}
          shapeType={selectedShapeType}
          shapeFillColor={shapeFillColor}
          shapeStrokeStyle={shapeStrokeStyle}
          gridType={gridType}
          canvasBackgroundColor={canvasBgColor}
          onViewportChange={(e) => {
            setZoomScale(e.nativeEvent.scale);
          }}
          onSelectionChange={(e) => {
            setSelection(e.nativeEvent);
          }}
          onHistoryChange={(e) => {
            setCanUndo(e.nativeEvent.canUndo);
            setCanRedo(e.nativeEvent.canRedo);
          }}
          onDocumentChange={(e) => {
            setElementCount(e.nativeEvent.elementCount);
            setHasUnsavedChanges(true);
          }}
          onTextEditRequest={(e) => {
            const { elementId, currentText, fontSize, color, worldX, worldY } = e.nativeEvent;
            setEditingTextElementId(elementId || null);
            setTextModalInput(currentText || '');
            setTextModalFontSize(fontSize || 24);
            setTextModalColor(color || '#000000');
            setPendingTextPos({ wx: worldX, wy: worldY });
            setShowTextModal(true);
          }}
        />

        {/* 3. CONTEXTUAL SELECTION TOOLBAR (Floating when object is selected) */}
        {selection.hasSelection && (
          <View style={styles.selectionBar}>
            <TouchableOpacity
              style={styles.selectionBarBtn}
              onPress={() => canvasRef.current?.deleteSelected()}
            >
              <Trash2 color="#EF4444" size={18} />
              <Text style={[styles.selectionBarText, { color: '#EF4444' }]}>حذف</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.selectionBarBtn}
              onPress={() => canvasRef.current?.duplicateSelected()}
            >
              <Copy color="#3B82F6" size={18} />
              <Text style={styles.selectionBarText}>تکثیر</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.selectionBarBtn}
              onPress={() => canvasRef.current?.bringForward()}
            >
              <ArrowUp color="#475569" size={18} />
              <Text style={styles.selectionBarText}>جلو</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.selectionBarBtn}
              onPress={() => canvasRef.current?.sendBackward()}
            >
              <ArrowDown color="#475569" size={18} />
              <Text style={styles.selectionBarText}>عقب</Text>
            </TouchableOpacity>

            {selection.selectedType === 'text' && (
              <TouchableOpacity
                style={styles.selectionBarBtn}
                onPress={() => {
                  setEditingTextElementId('active');
                  setTextModalInput(selection.text);
                  setTextModalFontSize(selection.width || 24);
                  setTextModalColor(selection.color || '#000000');
                  setShowTextModal(true);
                }}
              >
                <Edit3 color="#10B981" size={18} />
                <Text style={[styles.selectionBarText, { color: '#10B981' }]}>ویرایش</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* 4. SECONDARY SETTINGS STRIP (Palette, Width, Grid, Background) */}
      <View style={styles.secondarySettingsBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.settingsScroll}>
          {/* Colors */}
          <View style={styles.colorPaletteRow}>
            {COLOR_PALETTE.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.colorDot,
                  { backgroundColor: c },
                  strokeColor === c && styles.activeColorDot,
                  c === '#FFFFFF' && { borderWidth: 1, borderColor: '#CBD5E1' }
                ]}
                onPress={() => setStrokeColor(c)}
              />
            ))}
          </View>

          <View style={styles.verticalDivider} />

          {/* Stroke Widths */}
          <View style={styles.widthRow}>
            {STROKE_WIDTHS.map((w) => (
              <TouchableOpacity
                key={w}
                style={[styles.widthBtn, strokeWidth === w && styles.activeWidthBtn]}
                onPress={() => setStrokeWidth(w)}
              >
                <View style={[styles.widthDot, { width: w + 2, height: w + 2, backgroundColor: strokeColor }]} />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.verticalDivider} />

          {/* Grid Toggle */}
          <TouchableOpacity
            style={[styles.gridBtn, gridType !== 'none' && styles.activeGridBtn]}
            onPress={() => {
              const types: Array<'none' | 'grid' | 'dots' | 'lines'> = ['none', 'grid', 'dots', 'lines'];
              const next = types[(types.indexOf(gridType) + 1) % types.length];
              setGridType(next);
            }}
          >
            <Grid color={gridType !== 'none' ? '#2563EB' : '#64748B'} size={18} />
            <Text style={[styles.gridBtnText, gridType !== 'none' && { color: '#2563EB' }]}>
              {gridType === 'none' ? 'ساده' : gridType === 'grid' ? 'شطرنجی' : gridType === 'dots' ? 'نقطه‌ای' : 'خط‌دار'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* 5. PRIMARY BOTTOM TOOLBAR */}
      <View style={styles.bottomToolbar}>
        <TouchableOpacity
          style={[styles.toolBtn, activeTool === 'pen' && styles.activeToolBtn]}
          onPress={() => { setActiveTool('pen'); setStrokeOpacity(1.0); }}
        >
          <Pen color={activeTool === 'pen' ? '#FFFFFF' : '#475569'} size={21} />
          <Text style={[styles.toolBtnText, activeTool === 'pen' && styles.activeToolText]}>قلم</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolBtn, activeTool === 'brush' && styles.activeToolBtn]}
          onPress={() => { setActiveTool('brush'); setStrokeOpacity(0.85); }}
        >
          <Brush color={activeTool === 'brush' ? '#FFFFFF' : '#475569'} size={21} />
          <Text style={[styles.toolBtnText, activeTool === 'brush' && styles.activeToolText]}>قلم‌مو</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolBtn, activeTool === 'highlighter' && styles.activeToolBtn]}
          onPress={() => { setActiveTool('highlighter'); setStrokeOpacity(0.4); }}
        >
          <Highlighter color={activeTool === 'highlighter' ? '#FFFFFF' : '#475569'} size={21} />
          <Text style={[styles.toolBtnText, activeTool === 'highlighter' && styles.activeToolText]}>هایلایتر</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolBtn, activeTool === 'eraser' && styles.activeToolBtn]}
          onPress={() => setActiveTool('eraser')}
        >
          <Eraser color={activeTool === 'eraser' ? '#FFFFFF' : '#475569'} size={21} />
          <Text style={[styles.toolBtnText, activeTool === 'eraser' && styles.activeToolText]}>پاک‌کن</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolBtn, activeTool === 'shape' && styles.activeToolBtn]}
          onPress={() => {
            setActiveTool('shape');
            setShowShapesModal(true);
          }}
        >
          <Shapes color={activeTool === 'shape' ? '#FFFFFF' : '#475569'} size={21} />
          <Text style={[styles.toolBtnText, activeTool === 'shape' && styles.activeToolText]}>اشکال</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolBtn, activeTool === 'text' && styles.activeToolBtn]}
          onPress={() => {
            setActiveTool('text');
            setEditingTextElementId(null);
            setTextModalInput('');
            setShowTextModal(true);
          }}
        >
          <Type color={activeTool === 'text' ? '#FFFFFF' : '#475569'} size={21} />
          <Text style={[styles.toolBtnText, activeTool === 'text' && styles.activeToolText]}>متن</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toolBtn}
          onPress={handlePickImage}
        >
          <ImageIcon color="#475569" size={21} />
          <Text style={styles.toolBtnText}>عکس</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolBtn, activeTool === 'select' && styles.activeToolBtn]}
          onPress={() => setActiveTool('select')}
        >
          <MousePointer color={activeTool === 'select' ? '#FFFFFF' : '#475569'} size={21} />
          <Text style={[styles.toolBtnText, activeTool === 'select' && styles.activeToolText]}>انتخاب</Text>
        </TouchableOpacity>
      </View>

      {/* 6. SHAPES PICKER MODAL */}
      <Modal visible={showShapesModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>انتخاب شکل یا دیاگرام</Text>
              <TouchableOpacity onPress={() => setShowShapesModal(false)}>
                <X color="#64748B" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }}>
              <Text style={styles.categoryTitle}>اشکال پایه</Text>
              <View style={styles.shapesGrid}>
                {BASIC_SHAPES.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.shapePill, selectedShapeType === s.id && styles.activeShapePill]}
                    onPress={() => {
                      setSelectedShapeType(s.id);
                      setActiveTool('shape');
                      setShowShapesModal(false);
                    }}
                  >
                    <Text style={[styles.shapePillText, selectedShapeType === s.id && styles.activeShapePillText]}>
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.categoryTitle, { marginTop: 16 }]}>دیاگرام و فلوچارت</Text>
              <View style={styles.shapesGrid}>
                {DIAGRAM_SHAPES.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.shapePill, selectedShapeType === s.id && styles.activeShapePill]}
                    onPress={() => {
                      setSelectedShapeType(s.id);
                      setActiveTool('shape');
                      setShowShapesModal(false);
                    }}
                  >
                    <Text style={[styles.shapePillText, selectedShapeType === s.id && styles.activeShapePillText]}>
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ marginTop: 20 }}>
                <Text style={styles.categoryTitle}>سبک خط</Text>
                <View style={styles.rowCentered}>
                  {(['solid', 'dashed', 'dotted'] as const).map((st) => (
                    <TouchableOpacity
                      key={st}
                      style={[styles.styleBtn, shapeStrokeStyle === st && styles.activeStyleBtn]}
                      onPress={() => setShapeStrokeStyle(st)}
                    >
                      <Text style={styles.styleBtnText}>
                        {st === 'solid' ? 'پیوسته' : st === 'dashed' ? 'خط‌چین' : 'نقطه‌چین'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 7. TEXT INPUT MODAL */}
      <Modal visible={showTextModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingTextElementId ? 'ویرایش متن' : 'افزودن متن به بوم'}
              </Text>
              <TouchableOpacity onPress={() => setShowTextModal(false)}>
                <X color="#64748B" size={24} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.persianTextInput}
              multiline
              placeholder="متن خود را به فارسی یا لاتین اینجا بنویسید..."
              placeholderTextColor="#94A3B8"
              value={textModalInput}
              onChangeText={setTextModalInput}
              textAlign="right"
              autoFocus
            />

            <View style={styles.textFormattingRow}>
              <View style={styles.rowCentered}>
                <TouchableOpacity
                  style={[styles.formatToggle, textModalBold && styles.activeFormatToggle]}
                  onPress={() => setTextModalBold(!textModalBold)}
                >
                  <Text style={[styles.formatToggleText, { fontWeight: 'bold' }]}>B</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.formatToggle, textModalItalic && styles.activeFormatToggle]}
                  onPress={() => setTextModalItalic(!textModalItalic)}
                >
                  <Text style={[styles.formatToggleText, { fontStyle: 'italic' }]}>I</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.rowCentered}>
                <Text style={styles.fontSizeLabel}>اندازه:</Text>
                {[18, 24, 32, 42].map((sz) => (
                  <TouchableOpacity
                    key={sz}
                    style={[styles.sizePill, textModalFontSize === sz && styles.activeSizePill]}
                    onPress={() => setTextModalFontSize(sz)}
                  >
                    <Text style={styles.sizePillText}>{sz}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.primaryModalBtn} onPress={handleSaveTextModal}>
              <Check color="#FFFFFF" size={20} />
              <Text style={styles.primaryModalBtnText}>تایید و درج در بوم</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 8. PROJECTS MANAGER MODAL */}
      <Modal visible={showProjectsModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: 520 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>مدیریت پروژه‌ها و بوم‌های من</Text>
              <TouchableOpacity onPress={() => setShowProjectsModal(false)}>
                <X color="#64748B" size={24} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.newCanvasBtn} onPress={handleNewCanvas}>
              <Plus color="#FFFFFF" size={20} />
              <Text style={styles.newCanvasBtnText}>بوم سفید جدید</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveCurrentBtn} onPress={handleSaveProject}>
              <FileText color="#2563EB" size={19} />
              <Text style={styles.saveCurrentBtnText}>ذخیره بوم فعلی ({docTitle})</Text>
            </TouchableOpacity>

            <Text style={[styles.categoryTitle, { marginTop: 14, marginBottom: 8 }]}>بوم‌های ذخیره‌شده</Text>

            {isLoadingProjects ? (
              <ActivityIndicator size="small" color="#2563EB" style={{ marginVertical: 20 }} />
            ) : savedProjects.length === 0 ? (
              <Text style={styles.emptyText}>هنوز بومی ذخیره نشده است.</Text>
            ) : (
              <ScrollView style={{ maxHeight: 260 }}>
                {savedProjects.map((p) => (
                  <View key={p.id} style={styles.projectItem}>
                    <TouchableOpacity
                      style={styles.projectInfo}
                      onPress={() => handleOpenProject(p.id, p.title)}
                    >
                      <Text style={styles.projectTitle}>{p.title}</Text>
                      <Text style={styles.projectSubtitle}>
                        {new Date(p.updatedAt).toLocaleDateString('fa-IR')} • {p.elementCount} عنصر
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.projectDeleteBtn}
                      onPress={() => {
                        showConfirm({
                          title: 'حذف بوم',
                          message: `آیا از حذف "${p.title}" مطمئن هستید؟`,
                          confirmText: 'حذف',
                          cancelText: 'انصراف',
                          isDestructive: true,
                          icon: Trash2,
                          onConfirm: async () => {
                            await InfiniteCanvasService.deleteDocument(p.id);
                            showSuccess('بوم حذف شد');
                            loadProjectsList();
                          },
                        });
                      }}
                    >
                      <Trash2 color="#EF4444" size={18} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* 9. EXPORT MODAL */}
      <Modal visible={showExportModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>خروجی گرفتن و اشتراک‌گذاری</Text>
              <TouchableOpacity onPress={() => setShowExportModal(false)}>
                <X color="#64748B" size={24} />
              </TouchableOpacity>
            </View>

            <Text style={styles.categoryTitle}>فرمت خروجی</Text>
            <View style={styles.rowCentered}>
              {(['png', 'jpeg', 'pdf'] as const).map((fmt) => (
                <TouchableOpacity
                  key={fmt}
                  style={[styles.formatBtn, exportFormat === fmt && styles.activeFormatBtn]}
                  onPress={() => setExportFormat(fmt)}
                >
                  <Text style={[styles.formatBtnText, exportFormat === fmt && styles.activeFormatBtnText]}>
                    {fmt.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {exportFormat === 'pdf' ? (
              <View style={{ marginTop: 14 }}>
                <Text style={styles.categoryTitle}>اندازه صفحه PDF</Text>
                <View style={styles.rowCentered}>
                  {[
                    { id: 'fit', label: 'اندازه خودکار بوم' },
                    { id: 'a4_portrait', label: 'A4 عمودی' },
                    { id: 'a4_landscape', label: 'A4 افقی' }
                  ].map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.pdfSizeBtn, pdfPageSize === p.id && styles.activePdfSizeBtn]}
                      onPress={() => setPdfPageSize(p.id as any)}
                    >
                      <Text style={styles.pdfSizeText}>{p.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : (
              exportFormat === 'png' && (
                <TouchableOpacity
                  style={styles.transparentRow}
                  onPress={() => setPngTransparent(!pngTransparent)}
                >
                  <View style={[styles.checkbox, pngTransparent && styles.activeCheckbox]}>
                    {pngTransparent && <Check color="#FFFFFF" size={14} />}
                  </View>
                  <Text style={styles.checkboxLabel}>پس‌زمینه شفاف (بدون رنگ سفید)</Text>
                </TouchableOpacity>
              )
            )}

            <View style={{ marginTop: 22, gap: 10 }}>
              <TouchableOpacity
                style={styles.primaryModalBtn}
                disabled={isExporting}
                onPress={() => handleExport(false)}
              >
                {isExporting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Download color="#FFFFFF" size={20} />
                    <Text style={styles.primaryModalBtnText}>ذخیره فایل در گوشی</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryModalBtn, { backgroundColor: '#10B981' }]}
                disabled={isExporting}
                onPress={() => handleExport(true)}
              >
                <Share2 color="#FFFFFF" size={20} />
                <Text style={styles.primaryModalBtnText}>اشتراک‌گذاری مستقیم (شاد، ایتا، واتساپ و...)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A'
  },
  header: {
    height: 52,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  headerBtn: {
    padding: 6,
    marginRight: 4
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 160
  },
  titleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'right'
  },
  unsavedDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginLeft: 6
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  headerIconBtn: {
    padding: 7,
    borderRadius: 8,
    backgroundColor: '#F1F5F9'
  },
  disabledBtn: {
    opacity: 0.4
  },
  zoomPill: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#F1F5F9'
  },
  zoomText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155'
  },
  exportBtn: {
    backgroundColor: '#2563EB'
  },
  canvasContainer: {
    flex: 1,
    position: 'relative'
  },
  selectionBar: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 14,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    zIndex: 100
  },
  selectionBarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 6
  },
  selectionBarText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155'
  },
  secondarySettingsBar: {
    height: 48,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    justifyContent: 'center'
  },
  settingsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 10
  },
  colorPaletteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  colorDot: {
    width: 26,
    height: 26,
    borderRadius: 13
  },
  activeColorDot: {
    transform: [{ scale: 1.25 }],
    borderWidth: 2,
    borderColor: '#2563EB'
  },
  verticalDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 4
  },
  widthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  widthBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  activeWidthBtn: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF'
  },
  widthDot: {
    borderRadius: 100
  },
  gridBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F1F5F9'
  },
  activeGridBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  gridBtnText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600'
  },
  bottomToolbar: {
    height: 64,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 6
  },
  toolBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12
  },
  activeToolBtn: {
    backgroundColor: '#2563EB'
  },
  toolBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 3
  },
  activeToolText: {
    color: '#FFFFFF'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A'
  },
  categoryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
    textAlign: 'right'
  },
  shapesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  shapePill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F1F5F9'
  },
  activeShapePill: {
    backgroundColor: '#2563EB'
  },
  shapePillText: {
    fontSize: 13,
    color: '#334155'
  },
  activeShapePillText: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  rowCentered: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  styleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center'
  },
  activeStyleBtn: {
    backgroundColor: '#2563EB'
  },
  styleBtnText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600'
  },
  persianTextInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
    fontSize: 15,
    color: '#0F172A',
    textAlignVertical: 'top'
  },
  textFormattingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 16
  },
  formatToggle: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  activeFormatToggle: {
    backgroundColor: '#2563EB'
  },
  formatToggleText: {
    fontSize: 16,
    color: '#0F172A'
  },
  fontSizeLabel: {
    fontSize: 12,
    color: '#64748B'
  },
  sizePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F1F5F9'
  },
  activeSizePill: {
    backgroundColor: '#2563EB'
  },
  sizePillText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600'
  },
  primaryModalBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  primaryModalBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  },
  newCanvasBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8
  },
  newCanvasBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  },
  saveCurrentBtn: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  saveCurrentBtnText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '600'
  },
  projectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  projectInfo: {
    flex: 1
  },
  projectTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'right'
  },
  projectSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'right'
  },
  projectDeleteBtn: {
    padding: 8
  },
  emptyText: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 13,
    marginVertical: 20
  },
  formatBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center'
  },
  activeFormatBtn: {
    backgroundColor: '#2563EB'
  },
  formatBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569'
  },
  activeFormatBtnText: {
    color: '#FFFFFF'
  },
  pdfSizeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center'
  },
  activePdfSizeBtn: {
    backgroundColor: '#2563EB'
  },
  pdfSizeText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600'
  },
  transparentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center'
  },
  activeCheckbox: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB'
  },
  checkboxLabel: {
    fontSize: 13,
    color: '#334155'
  }
});

export default InfiniteCanvasScreen;
