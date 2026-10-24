import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  PanResponder,
} from 'react-native';
import { showError } from '../../components/feedback';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowRight,
  Maximize2,
  Sparkles,
  RotateCcw,
  Check,
  RefreshCw,
} from 'lucide-react-native';
import Svg, { Polygon, Line, Circle } from 'react-native-svg';
import { scannerService, CornerPoint } from '../../services/scanner/scannerService';
import { COLORS } from '../../theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Available viewport area for image display
const VIEWPORT_WIDTH = SCREEN_WIDTH - 32;
const VIEWPORT_HEIGHT = SCREEN_HEIGHT - 220;

interface CropAdjustmentScreenProps {
  route: any;
  navigation: any;
}

interface ActiveDrag {
  type: 'CORNER' | 'EDGE' | 'WHOLE';
  index?: number;
}

interface DragState {
  type: 'CORNER' | 'EDGE' | 'WHOLE';
  index?: number;
  startCorners: CornerPoint[];
}

export const CropAdjustmentScreen: React.FC<CropAdjustmentScreenProps> = ({ route, navigation }) => {
  const { rawImageUri, initialCorners, imageWidth, imageHeight, isFallback } = route.params;

  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Calculate layout scale & display bounds
  const { displayWidth, displayHeight, offsetX, offsetY, scaleX, scaleY } = useMemo(() => {
    const imgAspect = imageWidth / imageHeight;
    const viewAspect = VIEWPORT_WIDTH / VIEWPORT_HEIGHT;

    let dispW = VIEWPORT_WIDTH;
    let dispH = VIEWPORT_HEIGHT;

    if (imgAspect > viewAspect) {
      dispH = VIEWPORT_WIDTH / imgAspect;
    } else {
      dispW = VIEWPORT_HEIGHT * imgAspect;
    }

    const offX = (VIEWPORT_WIDTH - dispW) / 2;
    const offY = (VIEWPORT_HEIGHT - dispH) / 2;

    const sX = dispW / imageWidth;
    const sY = dispH / imageHeight;

    return {
      displayWidth: dispW,
      displayHeight: dispH,
      offsetX: offX,
      offsetY: offY,
      scaleX: sX,
      scaleY: sY,
    };
  }, [imageWidth, imageHeight]);

  // Convert image pixel coordinates to viewport screen coordinates
  const initialScreenCorners = useMemo(() => {
    return (initialCorners as CornerPoint[]).map((pt) => ({
      x: offsetX + pt.x * scaleX,
      y: offsetY + pt.y * scaleY,
    }));
  }, [initialCorners, offsetX, offsetY, scaleX, scaleY]);

  const cornersRef = useRef<CornerPoint[]>(initialScreenCorners);
  const [corners, setCorners] = useState<CornerPoint[]>(initialScreenCorners);
  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null);
  const dragRef = useRef<DragState | null>(null);

  useEffect(() => {
    cornersRef.current = initialScreenCorners;
    setCorners(initialScreenCorners);
  }, [initialScreenCorners]);

  // Ray-casting algorithm to test if a point is inside the quadrilateral
  const isInsideQuad = (p: CornerPoint, quad: CornerPoint[]): boolean => {
    let inside = false;
    for (let i = 0, j = quad.length - 1; i < quad.length; j = i++) {
      const xi = quad[i].x, yi = quad[i].y;
      const xj = quad[j].x, yj = quad[j].y;
      const intersect =
        ((yi > p.y) !== (yj > p.y)) &&
        p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  };

  // Robust PanResponder with zero stale closures using mutable refs
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const touchX = evt.nativeEvent.locationX;
          const touchY = evt.nativeEvent.locationY;
          const currentCorners = cornersRef.current;

          // 1. Check if near any of the 4 corner handles (generous 75px radius)
          let closestCornerIdx = -1;
          let minCornerDist = 75;

          currentCorners.forEach((pt, idx) => {
            const dist = Math.hypot(pt.x - touchX, pt.y - touchY);
            if (dist < minCornerDist) {
              minCornerDist = dist;
              closestCornerIdx = idx;
            }
          });

          if (closestCornerIdx !== -1) {
            dragRef.current = {
              type: 'CORNER',
              index: closestCornerIdx,
              startCorners: currentCorners.map((p) => ({ ...p })),
            };
            setActiveDrag({ type: 'CORNER', index: closestCornerIdx });
            return;
          }

          // 2. Check if near any of the 4 edge midpoints (threshold 50px)
          let closestEdgeIdx = -1;
          let minEdgeDist = 50;

          for (let i = 0; i < 4; i++) {
            const cA = currentCorners[i];
            const cB = currentCorners[(i + 1) % 4];
            const midX = (cA.x + cB.x) / 2;
            const midY = (cA.y + cB.y) / 2;
            const dist = Math.hypot(midX - touchX, midY - touchY);
            if (dist < minEdgeDist) {
              minEdgeDist = dist;
              closestEdgeIdx = i;
            }
          }

          if (closestEdgeIdx !== -1) {
            dragRef.current = {
              type: 'EDGE',
              index: closestEdgeIdx,
              startCorners: currentCorners.map((p) => ({ ...p })),
            };
            setActiveDrag({ type: 'EDGE', index: closestEdgeIdx });
            return;
          }

          // 3. Check if inside quadrilateral to drag whole crop box
          if (isInsideQuad({ x: touchX, y: touchY }, currentCorners)) {
            dragRef.current = {
              type: 'WHOLE',
              startCorners: currentCorners.map((p) => ({ ...p })),
            };
            setActiveDrag({ type: 'WHOLE' });
            return;
          }

          // 4. Fallback: select closest corner overall
          let fallbackCornerIdx = 0;
          let minOverallDist = Infinity;
          currentCorners.forEach((pt, idx) => {
            const dist = Math.hypot(pt.x - touchX, pt.y - touchY);
            if (dist < minOverallDist) {
              minOverallDist = dist;
              fallbackCornerIdx = idx;
            }
          });

          dragRef.current = {
            type: 'CORNER',
            index: fallbackCornerIdx,
            startCorners: currentCorners.map((p) => ({ ...p })),
          };
          setActiveDrag({ type: 'CORNER', index: fallbackCornerIdx });
        },
        onPanResponderMove: (_, gestureState) => {
          const drag = dragRef.current;
          if (!drag) return;

          const dx = gestureState.dx;
          const dy = gestureState.dy;

          const minX = offsetX;
          const maxX = offsetX + displayWidth;
          const minY = offsetY;
          const maxY = offsetY + displayHeight;

          if (drag.type === 'CORNER' && drag.index !== undefined) {
            const startPt = drag.startCorners[drag.index];
            const newX = Math.max(minX, Math.min(maxX, startPt.x + dx));
            const newY = Math.max(minY, Math.min(maxY, startPt.y + dy));

            const updated = [...cornersRef.current];
            updated[drag.index] = { x: newX, y: newY };
            cornersRef.current = updated;
            setCorners(updated);
          } else if (drag.type === 'EDGE' && drag.index !== undefined) {
            const idxA = drag.index;
            const idxB = (drag.index + 1) % 4;
            const startA = drag.startCorners[idxA];
            const startB = drag.startCorners[idxB];

            const newAX = Math.max(minX, Math.min(maxX, startA.x + dx));
            const newAY = Math.max(minY, Math.min(maxY, startA.y + dy));
            const newBX = Math.max(minX, Math.min(maxX, startB.x + dx));
            const newBY = Math.max(minY, Math.min(maxY, startB.y + dy));

            const updated = [...cornersRef.current];
            updated[idxA] = { x: newAX, y: newAY };
            updated[idxB] = { x: newBX, y: newBY };
            cornersRef.current = updated;
            setCorners(updated);
          } else if (drag.type === 'WHOLE') {
            let allowDx = dx;
            let allowDy = dy;
            drag.startCorners.forEach((p) => {
              if (p.x + allowDx < minX) allowDx = minX - p.x;
              if (p.x + allowDx > maxX) allowDx = maxX - p.x;
              if (p.y + allowDy < minY) allowDy = minY - p.y;
              if (p.y + allowDy > maxY) allowDy = maxY - p.y;
            });

            const updated = drag.startCorners.map((p) => ({
              x: p.x + allowDx,
              y: p.y + allowDy,
            }));
            cornersRef.current = updated;
            setCorners(updated);
          }
        },
        onPanResponderRelease: () => {
          dragRef.current = null;
          setActiveDrag(null);
        },
        onPanResponderTerminate: () => {
          dragRef.current = null;
          setActiveDrag(null);
        },
      }),
    [offsetX, offsetY, displayWidth, displayHeight]
  );

  // Re-detect document automatically using OpenCV
  const handleAutoDetect = async () => {
    try {
      setIsProcessing(true);
      const detection = await scannerService.detectDocument(rawImageUri);
      const mapped = detection.corners.map((pt) => ({
        x: offsetX + pt.x * scaleX,
        y: offsetY + pt.y * scaleY,
      }));
      cornersRef.current = mapped;
      setCorners(mapped);
    } catch (err: any) {
      showError('تشخیص خودکار ناموفق بود');
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset corners to full image bounds
  const handleSelectFullImage = () => {
    const full = [
      { x: offsetX, y: offsetY }, // TL
      { x: offsetX + displayWidth, y: offsetY }, // TR
      { x: offsetX + displayWidth, y: offsetY + displayHeight }, // BR
      { x: offsetX, y: offsetY + displayHeight }, // BL
    ];
    cornersRef.current = full;
    setCorners(full);
  };

  // Reset corners to initial detected bounds
  const handleReset = () => {
    cornersRef.current = initialScreenCorners;
    setCorners(initialScreenCorners);
  };

  // Confirm corners and run native perspective transform
  const handleConfirmCrop = async () => {
    try {
      setIsProcessing(true);

      // Map screen coordinates back to original unscaled image pixels
      const mappedCorners: CornerPoint[] = cornersRef.current.map((pt) => ({
        x: Math.round(Math.max(0, Math.min(imageWidth, (pt.x - offsetX) / scaleX))),
        y: Math.round(Math.max(0, Math.min(imageHeight, (pt.y - offsetY) / scaleY))),
      }));

      // Process with AUTO_ENHANCE by default
      const result = await scannerService.processDocument(
        rawImageUri,
        mappedCorners,
        'AUTO_ENHANCE',
        0
      );

      setIsProcessing(false);

      navigation.navigate('ScannerPreviewScreen', {
        processedUri: result.uri,
        rawImageUri,
        corners: mappedCorners,
        originalWidth: imageWidth,
        originalHeight: imageHeight,
        currentFilter: 'AUTO_ENHANCE',
        rotation: 0,
        returnScreen: route.params?.returnScreen,
      });
    } catch (err: any) {
      setIsProcessing(false);
      showError(err?.message || 'پردازش تصویر با خطا مواجه شد');
    }
  };

  // Corner and Edge names in Persian
  const cornerLabels = ['گوشه بالا-چپ', 'گوشه بالا-راست', 'گوشه پایین-راست', 'گوشه پایین-چپ'];
  const edgeLabels = ['تنظیم لبه بالا', 'تنظیم لبه راست', 'تنظیم لبه پایین', 'تنظیم لبه چپ'];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <ArrowRight size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>تنظیم لبه‌های سند</Text>
          <Text style={styles.headerSubtitle}>گوشه‌ها یا لبه‌ها را بکشید تا کادر دقیق تنظیم شود</Text>
        </View>

        <TouchableOpacity style={styles.headerButton} onPress={handleAutoDetect}>
          <Sparkles size={20} color="#60A5FA" />
        </TouchableOpacity>
      </View>

      {/* Main Image Canvas & Interactive Crop Overlay */}
      <View style={styles.canvasContainer}>
        <View
          style={[styles.viewportBox, { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT }]}
          {...panResponder.panHandlers}
        >
          {/* Base Image */}
          <Image
            source={{ uri: rawImageUri }}
            style={{
              position: 'absolute',
              left: offsetX,
              top: offsetY,
              width: displayWidth,
              height: displayHeight,
            }}
            resizeMode="stretch"
            pointerEvents="none"
          />

          {/* SVG Crop Polygon & Edges */}
          <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
            {/* Shaded inside quad */}
            <Polygon
              points={corners.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="rgba(37, 99, 235, 0.16)"
              stroke="#2563EB"
              strokeWidth="2.5"
            />

            {/* Crosshair guide lines when dragging a corner */}
            {activeDrag?.type === 'CORNER' && activeDrag.index !== undefined && (
              <>
                <Line
                  x1={offsetX}
                  y1={corners[activeDrag.index].y}
                  x2={offsetX + displayWidth}
                  y2={corners[activeDrag.index].y}
                  stroke="rgba(96, 165, 250, 0.55)"
                  strokeWidth="1.5"
                  strokeDasharray="4,4"
                />
                <Line
                  x1={corners[activeDrag.index].x}
                  y1={offsetY}
                  x2={corners[activeDrag.index].x}
                  y2={offsetY + displayHeight}
                  stroke="rgba(96, 165, 250, 0.55)"
                  strokeWidth="1.5"
                  strokeDasharray="4,4"
                />
              </>
            )}

            {/* Corner handle connection lines */}
            {corners.map((p, idx) => {
              const nextP = corners[(idx + 1) % 4];
              const isEdgeActive = activeDrag?.type === 'EDGE' && activeDrag.index === idx;
              return (
                <Line
                  key={`line-${idx}`}
                  x1={p.x}
                  y1={p.y}
                  x2={nextP.x}
                  y2={nextP.y}
                  stroke={isEdgeActive ? '#60A5FA' : '#38BDF8'}
                  strokeWidth={isEdgeActive ? 3.5 : 2}
                  strokeDasharray={isEdgeActive ? undefined : '5,3'}
                />
              );
            })}

            {/* Edge Midpoint Handles */}
            {corners.map((p, idx) => {
              const nextP = corners[(idx + 1) % 4];
              const midX = (p.x + nextP.x) / 2;
              const midY = (p.y + nextP.y) / 2;
              const isEdgeActive = activeDrag?.type === 'EDGE' && activeDrag.index === idx;
              return (
                <React.Fragment key={`edge-mid-${idx}`}>
                  <Circle
                    cx={midX}
                    cy={midY}
                    r={isEdgeActive ? 12 : 9}
                    fill={isEdgeActive ? '#3B82F6' : '#FFFFFF'}
                    stroke="#0284C7"
                    strokeWidth="2.5"
                  />
                  <Circle
                    cx={midX}
                    cy={midY}
                    r={isEdgeActive ? 4 : 3}
                    fill={isEdgeActive ? '#FFFFFF' : '#0284C7'}
                  />
                </React.Fragment>
              );
            })}

            {/* Corner Handle Rings */}
            {corners.map((p, idx) => {
              const isCornerActive = activeDrag?.type === 'CORNER' && activeDrag.index === idx;
              return (
                <React.Fragment key={`corner-${idx}`}>
                  {/* Outer glow ring when active */}
                  {isCornerActive && (
                    <Circle
                      cx={p.x}
                      cy={p.y}
                      r={28}
                      fill="rgba(37, 99, 235, 0.3)"
                    />
                  )}
                  {/* Main Handle Circle */}
                  <Circle
                    cx={p.x}
                    cy={p.y}
                    r={isCornerActive ? 22 : 18}
                    fill={isCornerActive ? '#2563EB' : '#FFFFFF'}
                    stroke={isCornerActive ? '#93C5FD' : '#1D4ED8'}
                    strokeWidth={3.5}
                  />
                  {/* Precision Center Pin */}
                  <Circle
                    cx={p.x}
                    cy={p.y}
                    r={isCornerActive ? 6 : 4}
                    fill={isCornerActive ? '#FFFFFF' : '#1D4ED8'}
                  />
                </React.Fragment>
              );
            })}
          </Svg>

          {/* Active Loupe / Position Label */}
          {activeDrag && (
            <View
              style={[
                styles.loupeBadge,
                {
                  left: Math.max(
                    10,
                    Math.min(
                      VIEWPORT_WIDTH - 130,
                      activeDrag.type === 'CORNER' && activeDrag.index !== undefined
                        ? corners[activeDrag.index].x - 65
                        : activeDrag.type === 'EDGE' && activeDrag.index !== undefined
                        ? (corners[activeDrag.index].x + corners[(activeDrag.index + 1) % 4].x) / 2 - 65
                        : VIEWPORT_WIDTH / 2 - 65
                    )
                  ),
                  top: Math.max(
                    10,
                    activeDrag.type === 'CORNER' && activeDrag.index !== undefined
                      ? corners[activeDrag.index].y - 65
                      : activeDrag.type === 'EDGE' && activeDrag.index !== undefined
                      ? (corners[activeDrag.index].y + corners[(activeDrag.index + 1) % 4].y) / 2 - 65
                      : VIEWPORT_HEIGHT / 2 - 25
                  ),
                },
              ]}
              pointerEvents="none"
            >
              <Text style={styles.loupeText}>
                {activeDrag.type === 'CORNER' && activeDrag.index !== undefined
                  ? `📍 ${cornerLabels[activeDrag.index]}`
                  : activeDrag.type === 'EDGE' && activeDrag.index !== undefined
                  ? `↔️ ${edgeLabels[activeDrag.index]}`
                  : '✥ جابجایی کل کادر'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Quick Action Pills */}
      <View style={styles.quickBar}>
        <TouchableOpacity style={styles.quickPill} onPress={handleAutoDetect} activeOpacity={0.7}>
          <Sparkles size={16} color="#60A5FA" style={{ marginLeft: 6 }} />
          <Text style={styles.quickPillText}>تشخیص مجدد هوشمند</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickPill} onPress={handleSelectFullImage} activeOpacity={0.7}>
          <Maximize2 size={16} color="#A78BFA" style={{ marginLeft: 6 }} />
          <Text style={styles.quickPillText}>انتخاب کل صفحه</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickPill} onPress={handleReset} activeOpacity={0.7}>
          <RotateCcw size={16} color="#38BDF8" style={{ marginLeft: 6 }} />
          <Text style={styles.quickPillText}>بازنشانی</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Action Buttons */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.retakeButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <RotateCcw size={18} color="#94A3B8" style={{ marginLeft: 6 }} />
          <Text style={styles.retakeText}>عکاسی مجدد</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirmCrop}
          activeOpacity={0.8}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Check size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
              <Text style={styles.confirmText}>تایید و برش هوشمند</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Processing Overlay */}
      {isProcessing && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingTitle}>در حال تصحیح زاویه و صاف‌سازی...</Text>
            <Text style={styles.loadingSubtitle}>تبدیل هندسی پرسپکتیو به فرمت مستطیل</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleBox: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  canvasContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  viewportBox: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#334155',
  },
  loupeBadge: {
    position: 'absolute',
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    zIndex: 90,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
  },
  loupeText: {
    color: '#F0F9FF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  quickBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  quickPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  quickPillText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#0F172A',
  },
  retakeText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    flex: 1,
    marginRight: 12,
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
  },
  loadingBox: {
    backgroundColor: '#1E293B',
    padding: 24,
    borderRadius: 18,
    alignItems: 'center',
    width: '80%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  loadingTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 16,
  },
  loadingSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
});

export default CropAdjustmentScreen;
