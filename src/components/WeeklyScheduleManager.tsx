import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Switch,
  TextInput,
  ScrollView,
} from 'react-native';
import { Clock, Plus, Trash2, Edit2, X, Check, AlertCircle } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { FONT_FAMILY } from '../theme/typography';
import { toPersianNumbers } from '../utils/date/jalaliHelper';
import { showWarning } from './feedback';

export type WeekdayKey =
  | 'saturday'
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday';

export interface WeeklyTimeRange {
  startTime: string;
  endTime: string;
}

export type WeeklyScheduleMap = Record<WeekdayKey, WeeklyTimeRange[]>;

export const WEEKDAYS_META: { key: WeekdayKey; label: string }[] = [
  { key: 'saturday', label: 'شنبه' },
  { key: 'sunday', label: 'یکشنبه' },
  { key: 'monday', label: 'دوشنبه' },
  { key: 'tuesday', label: 'سه‌شنبه' },
  { key: 'wednesday', label: 'چهارشنبه' },
  { key: 'thursday', label: 'پنج‌شنبه' },
  { key: 'friday', label: 'جمعه' },
];

export const createEmptyWeeklySchedule = (): WeeklyScheduleMap => ({
  saturday: [],
  sunday: [],
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
});

const DIGIT_MAP: Record<string, string> = {
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
};

export function toEnglishDigits(value: string): string {
  return String(value || '').replace(/[۰-۹٠-٩]/g, (ch) => DIGIT_MAP[ch] ?? ch);
}

function parseToMinutes(hhmm: string): number | null {
  const clean = toEnglishDigits(hhmm).trim();
  const match = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h === 24 && m === 0) return 1440;
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

function formatHHMM(totalMinutes: number): string {
  if (totalMinutes === 1440) return '24:00';
  const clamped = Math.max(0, Math.min(1439, totalMinutes));
  const h = Math.floor(clamped / 60).toString().padStart(2, '0');
  const m = (clamped % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

interface WeeklyScheduleManagerProps {
  value: WeeklyScheduleMap;
  onChange: (next: WeeklyScheduleMap) => void;
}

export const WeeklyScheduleManager: React.FC<WeeklyScheduleManagerProps> = ({
  value,
  onChange,
}) => {
  const { colors, isDark } = useTheme();

  // Modal state for adding / editing a single interval
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDay, setEditingDay] = useState<WeekdayKey>('saturday');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [startHour, setStartHour] = useState('16');
  const [startMinute, setStartMinute] = useState('00');
  const [endHour, setEndHour] = useState('18');
  const [endMinute, setEndMinute] = useState('00');
  const [modalError, setModalError] = useState<string | null>(null);

  const openAddModal = (day: WeekdayKey) => {
    const existing = value[day] || [];
    let defaultStartH = 16;
    if (existing.length > 0) {
      const lastEnd = parseToMinutes(existing[existing.length - 1].endTime) ?? 18 * 60;
      const suggestedStart = Math.min(22 * 60, lastEnd + 60);
      defaultStartH = Math.floor(suggestedStart / 60);
    }
    const defaultEndH = Math.min(23, defaultStartH + 2);
    setEditingDay(day);
    setEditingIndex(null);
    setStartHour(defaultStartH.toString().padStart(2, '0'));
    setStartMinute('00');
    setEndHour(defaultEndH.toString().padStart(2, '0'));
    setEndMinute('00');
    setModalError(null);
    setModalVisible(true);
  };

  const openEditModal = (day: WeekdayKey, index: number, range: WeeklyTimeRange) => {
    const [sh = '16', sm = '00'] = (range.startTime || '16:00').split(':');
    const [eh = '18', em = '00'] = (range.endTime || '18:00').split(':');
    setEditingDay(day);
    setEditingIndex(index);
    setStartHour(sh.padStart(2, '0'));
    setStartMinute(sm.padStart(2, '0'));
    setEndHour(eh.padStart(2, '0'));
    setEndMinute(em.padStart(2, '0'));
    setModalError(null);
    setModalVisible(true);
  };

  const handleToggleDay = (day: WeekdayKey, enabled: boolean) => {
    if (!enabled) {
      onChange({ ...value, [day]: [] });
    } else {
      const existing = value[day] || [];
      if (existing.length === 0) {
        onChange({
          ...value,
          [day]: [{ startTime: '08:00', endTime: '23:59' }],
        });
      }
    }
  };

  const handleRemoveRange = (day: WeekdayKey, index: number) => {
    const nextList = (value[day] || []).filter((_, i) => i !== index);
    onChange({ ...value, [day]: nextList });
  };

  const handleConfirmRange = () => {
    const sh = toEnglishDigits(startHour).replace(/\D/g, '').padStart(2, '0');
    const sm = toEnglishDigits(startMinute).replace(/\D/g, '').padStart(2, '0');
    const eh = toEnglishDigits(endHour).replace(/\D/g, '').padStart(2, '0');
    const em = toEnglishDigits(endMinute).replace(/\D/g, '').padStart(2, '0');

    const startMin = parseToMinutes(`${sh}:${sm}`);
    const endMin = parseToMinutes(`${eh}:${em}`);

    if (startMin === null || endMin === null) {
      setModalError('فرمت ساعت وارد شده معتبر نیست (ساعت ۰ تا ۲۳ و دقیقه ۰ تا ۵۹).');
      return;
    }
    if (startMin >= endMin) {
      setModalError('ساعت شروع باید قبل از ساعت پایان باشد.');
      return;
    }
    if (endMin - startMin < 15) {
      setModalError('طول هر بازه باید حداقل ۱۵ دقیقه باشد.');
      return;
    }

    const currentList = [...(value[editingDay] || [])];
    for (let i = 0; i < currentList.length; i++) {
      if (i === editingIndex) continue;
      const otherStart = parseToMinutes(currentList[i].startTime);
      const otherEnd = parseToMinutes(currentList[i].endTime);
      if (otherStart !== null && otherEnd !== null && startMin < otherEnd && otherStart < endMin) {
        setModalError(
          `این بازه با بازه ${toPersianNumbers(currentList[i].startTime)} تا ${toPersianNumbers(
            currentList[i].endTime
          )} تداخل دارد.`
        );
        return;
      }
    }

    const nextItem: WeeklyTimeRange = {
      startTime: formatHHMM(startMin),
      endTime: formatHHMM(endMin),
    };

    if (editingIndex !== null) {
      currentList[editingIndex] = nextItem;
    } else {
      currentList.push(nextItem);
    }

    currentList.sort((a, b) => (parseToMinutes(a.startTime) || 0) - (parseToMinutes(b.startTime) || 0));
    onChange({ ...value, [editingDay]: currentList });
    setModalVisible(false);
  };

  const adjustTimeField = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    current: string,
    delta: number,
    max: number
  ) => {
    const num = Number(toEnglishDigits(current)) || 0;
    const next = (num + delta + (max + 1)) % (max + 1);
    setter(next.toString().padStart(2, '0'));
    setModalError(null);
  };

  const editingDayLabel = WEEKDAYS_META.find((d) => d.key === editingDay)?.label || '';

  return (
    <View style={styles.container}>
      {WEEKDAYS_META.map((day) => {
        const ranges = value[day.key] || [];
        const isActive = ranges.length > 0;

        return (
          <View
            key={day.key}
            style={[
              styles.dayCard,
              {
                backgroundColor: isDark ? colors.surfaceVariant : colors.background,
                borderColor: isActive ? colors.primary : colors.border,
              },
            ]}
          >
            {/* Day Header: Title + Active/Closed Toggle */}
            <View style={styles.dayHeader}>
              <View style={styles.dayTitleGroup}>
                <Text style={[styles.dayTitle, { color: colors.text }]}>{day.label}</Text>
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: isActive ? colors.successBackground : colors.surfaceVariant,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      { color: isActive ? colors.success : colors.textLight },
                    ]}
                  >
                    {isActive
                      ? `${toPersianNumbers(ranges.length)} بازه فعال`
                      : 'تعطیل / غیرفعال'}
                  </Text>
                </View>
              </View>

              <Switch
                value={isActive}
                onValueChange={(val) => handleToggleDay(day.key, val)}
                trackColor={{ false: colors.border, true: colors.secondary }}
                thumbColor={isActive ? colors.primary : colors.textMuted}
              />
            </View>

            {/* Ranges List */}
            {isActive ? (
              <View style={styles.rangesList}>
                {ranges.map((range, idx) => (
                  <View
                    key={`${day.key}-${idx}-${range.startTime}`}
                    style={[
                      styles.rangeRow,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}
                  >
                    <View style={styles.rangeTimeDisplay}>
                      <Clock size={14} color={colors.primary} style={styles.clockIcon} />
                      <Text style={[styles.rangeTimeText, { color: colors.text }]}>
                        [{toPersianNumbers(range.startTime)}] تا [{toPersianNumbers(range.endTime)}]
                      </Text>
                    </View>

                    <View style={styles.rangeActions}>
                      <TouchableOpacity
                        style={[styles.iconActionBtn, { backgroundColor: colors.infoBackground }]}
                        onPress={() => openEditModal(day.key, idx, range)}
                        activeOpacity={0.75}
                      >
                        <Edit2 size={14} color={colors.info} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.iconActionBtn, { backgroundColor: colors.errorBackground }]}
                        onPress={() => handleRemoveRange(day.key, idx)}
                        activeOpacity={0.75}
                      >
                        <Trash2 size={14} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

                <TouchableOpacity
                  style={[styles.addRangeBtn, { borderColor: colors.primary, backgroundColor: colors.surface }]}
                  onPress={() => openAddModal(day.key)}
                  activeOpacity={0.8}
                >
                  <Plus size={15} color={colors.primary} style={styles.addBtnIcon} />
                  <Text style={[styles.addRangeText, { color: colors.primary }]}>
                    + افزودن بازه جدید
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.enableDayLink}
                onPress={() => openAddModal(day.key)}
                activeOpacity={0.75}
              >
                <Text style={[styles.enableDayLinkText, { color: colors.primary }]}>
                  + تعریف ساعت کاری برای {day.label}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}

      {/* Add / Edit Time Range Modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: colors.backdrop }]}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={20} color={colors.textLight} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingIndex !== null ? 'ویرایش بازه زمانی' : 'افزودن بازه زمانی'} ({editingDayLabel})
              </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Start Time Picker */}
              <Text style={[styles.sectionLabel, { color: colors.text }]}>ساعت شروع:</Text>
              <View style={[styles.timeBoxRow, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
                <View style={styles.timeUnitCol}>
                  <TouchableOpacity
                    style={[styles.stepperBtn, { backgroundColor: colors.surface }]}
                    onPress={() => adjustTimeField(setStartHour, startHour, 1, 23)}
                  >
                    <Text style={[styles.stepperText, { color: colors.primary }]}>+</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={[styles.timeInput, { color: colors.text, backgroundColor: colors.surface }]}
                    value={toPersianNumbers(startHour)}
                    onChangeText={(t) => {
                      setStartHour(toEnglishDigits(t).replace(/\D/g, '').slice(0, 2));
                      setModalError(null);
                    }}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                  <TouchableOpacity
                    style={[styles.stepperBtn, { backgroundColor: colors.surface }]}
                    onPress={() => adjustTimeField(setStartHour, startHour, -1, 23)}
                  >
                    <Text style={[styles.stepperText, { color: colors.primary }]}>-</Text>
                  </TouchableOpacity>
                  <Text style={[styles.unitHint, { color: colors.textLight }]}>ساعت</Text>
                </View>

                <Text style={[styles.colonText, { color: colors.text }]}>:</Text>

                <View style={styles.timeUnitCol}>
                  <TouchableOpacity
                    style={[styles.stepperBtn, { backgroundColor: colors.surface }]}
                    onPress={() => adjustTimeField(setStartMinute, startMinute, 15, 59)}
                  >
                    <Text style={[styles.stepperText, { color: colors.primary }]}>+</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={[styles.timeInput, { color: colors.text, backgroundColor: colors.surface }]}
                    value={toPersianNumbers(startMinute)}
                    onChangeText={(t) => {
                      setStartMinute(toEnglishDigits(t).replace(/\D/g, '').slice(0, 2));
                      setModalError(null);
                    }}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                  <TouchableOpacity
                    style={[styles.stepperBtn, { backgroundColor: colors.surface }]}
                    onPress={() => adjustTimeField(setStartMinute, startMinute, -15, 59)}
                  >
                    <Text style={[styles.stepperText, { color: colors.primary }]}>-</Text>
                  </TouchableOpacity>
                  <Text style={[styles.unitHint, { color: colors.textLight }]}>دقیقه</Text>
                </View>
              </View>

              {/* End Time Picker */}
              <Text style={[styles.sectionLabel, { color: colors.text, marginTop: 14 }]}>ساعت پایان:</Text>
              <View style={[styles.timeBoxRow, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
                <View style={styles.timeUnitCol}>
                  <TouchableOpacity
                    style={[styles.stepperBtn, { backgroundColor: colors.surface }]}
                    onPress={() => adjustTimeField(setEndHour, endHour, 1, 23)}
                  >
                    <Text style={[styles.stepperText, { color: colors.primary }]}>+</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={[styles.timeInput, { color: colors.text, backgroundColor: colors.surface }]}
                    value={toPersianNumbers(endHour)}
                    onChangeText={(t) => {
                      setEndHour(toEnglishDigits(t).replace(/\D/g, '').slice(0, 2));
                      setModalError(null);
                    }}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                  <TouchableOpacity
                    style={[styles.stepperBtn, { backgroundColor: colors.surface }]}
                    onPress={() => adjustTimeField(setEndHour, endHour, -1, 23)}
                  >
                    <Text style={[styles.stepperText, { color: colors.primary }]}>-</Text>
                  </TouchableOpacity>
                  <Text style={[styles.unitHint, { color: colors.textLight }]}>ساعت</Text>
                </View>

                <Text style={[styles.colonText, { color: colors.text }]}>:</Text>

                <View style={styles.timeUnitCol}>
                  <TouchableOpacity
                    style={[styles.stepperBtn, { backgroundColor: colors.surface }]}
                    onPress={() => adjustTimeField(setEndMinute, endMinute, 15, 59)}
                  >
                    <Text style={[styles.stepperText, { color: colors.primary }]}>+</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={[styles.timeInput, { color: colors.text, backgroundColor: colors.surface }]}
                    value={toPersianNumbers(endMinute)}
                    onChangeText={(t) => {
                      setEndMinute(toEnglishDigits(t).replace(/\D/g, '').slice(0, 2));
                      setModalError(null);
                    }}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                  <TouchableOpacity
                    style={[styles.stepperBtn, { backgroundColor: colors.surface }]}
                    onPress={() => adjustTimeField(setEndMinute, endMinute, -15, 59)}
                  >
                    <Text style={[styles.stepperText, { color: colors.primary }]}>-</Text>
                  </TouchableOpacity>
                  <Text style={[styles.unitHint, { color: colors.textLight }]}>دقیقه</Text>
                </View>
              </View>

              {modalError && (
                <View style={[styles.errorBox, { backgroundColor: colors.errorBackground, borderColor: colors.error }]}>
                  <AlertCircle size={15} color={colors.error} style={styles.errorIcon} />
                  <Text style={[styles.errorText, { color: colors.error }]}>{modalError}</Text>
                </View>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={[styles.modalCancelText, { color: colors.textLight }]}>انصراف</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalConfirmBtn, { backgroundColor: colors.primary }]}
                  onPress={handleConfirmRange}
                >
                  <Check size={16} color={colors.card} style={styles.confirmIcon} />
                  <Text style={[styles.modalConfirmText, { color: colors.card }]}>ثبت بازه</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  dayCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  dayHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayTitleGroup: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  dayTitle: {
    fontSize: 13.5,
    fontFamily: FONT_FAMILY.bold,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusPillText: {
    fontSize: 10.5,
    fontFamily: FONT_FAMILY.medium,
    fontVariant: ['tabular-nums'],
  },
  rangesList: {
    marginTop: 10,
    gap: 8,
  },
  rangeRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingStart: 10,
    paddingEnd: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  rangeTimeDisplay: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  clockIcon: {
    marginStart: 6,
  },
  rangeTimeText: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.bold,
    fontVariant: ['tabular-nums'],
  },
  rangeActions: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  iconActionBtn: {
    padding: 6,
    borderRadius: 8,
  },
  addRangeBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addBtnIcon: {
    marginStart: 4,
  },
  addRangeText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.bold,
  },
  enableDayLink: {
    marginTop: 8,
    paddingVertical: 4,
    alignItems: 'flex-end',
  },
  enableDayLinkText: {
    fontSize: 11.5,
    fontFamily: FONT_FAMILY.medium,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 15,
    fontFamily: FONT_FAMILY.bold,
  },
  sectionLabel: {
    fontSize: 12.5,
    fontFamily: FONT_FAMILY.bold,
    textAlign: 'right',
    marginBottom: 6,
  },
  timeBoxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  timeUnitCol: {
    alignItems: 'center',
    gap: 4,
  },
  stepperBtn: {
    width: 44,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperText: {
    fontSize: 18,
    fontFamily: FONT_FAMILY.bold,
  },
  timeInput: {
    width: 56,
    height: 44,
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 18,
    fontFamily: FONT_FAMILY.bold,
    fontVariant: ['tabular-nums'],
    padding: 0,
  },
  colonText: {
    fontSize: 22,
    fontFamily: FONT_FAMILY.bold,
    marginBottom: 18,
  },
  unitHint: {
    fontSize: 10.5,
    fontFamily: FONT_FAMILY.regular,
  },
  errorBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 12,
  },
  errorIcon: {
    marginStart: 6,
  },
  errorText: {
    flex: 1,
    fontSize: 11.5,
    fontFamily: FONT_FAMILY.medium,
    textAlign: 'right',
  },
  modalActions: {
    flexDirection: 'row-reverse',
    gap: 10,
    marginTop: 18,
  },
  modalCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.medium,
  },
  modalConfirmBtn: {
    flex: 1.4,
    borderRadius: 12,
    paddingVertical: 11,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmIcon: {
    marginStart: 6,
  },
  modalConfirmText: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.bold,
  },
});
