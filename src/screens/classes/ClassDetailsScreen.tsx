import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Share,
  Clipboard,
  Platform
} from 'react-native';
import { showSuccess } from '../../components/feedback';
import { COLORS } from '../../theme/colors';
import { useTheme } from '../../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  ChevronRight, 
  ChevronLeft,
  Settings, 
  Users, 
  BookOpen, 
  BarChart2, 
  Gift, 
  Calendar, 
  CheckSquare, 
  Plus, 
  FileText, 
  StickyNote,
  Share2,
  Copy,
  Link,
  Hash,
  ExternalLink,
  UserCheck,
  BadgeCheck,
  AlertTriangle,
  MessageSquare,
  ScanLine
} from 'lucide-react-native';
import GradebookTable from '../../components/classes/GradebookTable';
import { JoinRequestsModal } from '../../components/classes/JoinRequestsModal';
import { PlanningService } from '../../api/planningService';
import { api } from '../../api/axiosConfig';
import { useFocusEffect } from '@react-navigation/native';
import { getHomeworkRemainingDays } from '../../utils/date/homeworkSessionHelper';

const ClassDetailsScreen = ({ route, navigation }: any) => {
  const { colors, isDark } = useTheme();
  const { classroom, classId, className } = route.params;
  const currentClassId = classId || classroom?._id;
  const currentClassName = className || classroom?.name;
  const insets = useSafeAreaInsets();

  const [notes, setNotes] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [classData, setClassData] = useState<any>(classroom || null);
  const [isNoteModalVisible, setIsNoteModalVisible] = useState(false);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [isJoinRequestsModalVisible, setIsJoinRequestsModalVisible] = useState(false);
  const [homeworks, setHomeworks] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const [notesRes, scheduleRes, classRes, requestsRes, homeworksRes] = await Promise.all([
        PlanningService.getNotes(undefined, currentClassId),
        api.get('/teacher/schedule', { params: { classId: currentClassId } }),
        api.get(`/teacher/classrooms/${currentClassId}`),
        api.get(`/teacher/classrooms/${currentClassId}/join-requests`).catch(() => ({ data: { success: false, data: [] } })),
        PlanningService.getHomeworks({ classId: currentClassId }).catch(() => ({ success: false, data: [] }))
      ]);
      if (notesRes.success && notesRes.data) {
        setNotes(notesRes.data);
      }
      if (scheduleRes.data.success) {
        console.log(`[ClassDetailsScreen] fetched schedule for class ${currentClassId}:`, scheduleRes.data.data.length, 'items');
        setSchedule(scheduleRes.data.data || []);
      }
      if (classRes.data.success && classRes.data.data) {
        setClassData(classRes.data.data);
      }
      if (requestsRes?.data?.success) {
        setJoinRequests(requestsRes.data.data || []);
      }
      if (homeworksRes?.success && homeworksRes.data) {
        setHomeworks(homeworksRes.data);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const toPersianDigits = (str: string | number) => {
    if (!str) return '';
    const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return str.toString().replace(/\d/g, (x) => farsiDigits[parseInt(x, 10)]);
  };

  const classCode = classData?.code || classroom?.code || '';
  const serverBaseUrl = (api.defaults.baseURL || 'http://192.168.1.128:5001/api').replace(/\/api\/?$/, '');
  const registrationUrl = classCode ? `${serverBaseUrl}/c/${classCode}` : '';

  const handleCopyCode = () => {
    if (!classCode) return;
    Clipboard.setString(classCode);
    showSuccess(`شناسه کلاس (${toPersianDigits(classCode)}) در حافظه کپی شد.`);
  };

  const handleCopyLink = () => {
    if (!registrationUrl) return;
    Clipboard.setString(registrationUrl);
    showSuccess('لینک فرم ثبت‌نام دانش‌آموز در کلیپ‌بورد کپی شد.');
  };

  const handleShareLink = async () => {
    if (!registrationUrl || !classCode) return;
    try {
      const shareMessage = `دانش‌آموز گرامی،\nبرای ثبت‌نام و عضویت در کلاس «${currentClassName}»، لطفاً از طریق لینک زیر مشخصات خود را تکمیل نمایید:\n\n🔗 لینک ثبت‌نام:\n${registrationUrl}\n\n🔢 کد اختصاصی کلاس: ${classCode}\n\nپس از تکمیل ثبت‌نام، می‌توانید اپلیکیشن «نوکیتا» را برای دریافت تکالیف و نمرات دانلود کنید.`;
      await Share.share({
        title: `ثبت‌نام در کلاس ${currentClassName}`,
        message: shareMessage,
        url: registrationUrl,
      });
    } catch (error) {
      console.warn(error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, [currentClassId])
  );

  const groupedSchedule = React.useMemo(() => {
    console.log(`[ClassDetailsScreen] grouping schedule items... count: ${schedule.length}`);
    const daysMap = {
      6: { id: 6, name: 'شنبه', items: [] as any[] },
      0: { id: 0, name: 'یکشنبه', items: [] as any[] },
      1: { id: 1, name: 'دوشنبه', items: [] as any[] },
      2: { id: 2, name: 'سه‌شنبه', items: [] as any[] },
      3: { id: 3, name: 'چهارشنبه', items: [] as any[] },
      4: { id: 4, name: 'پنج‌شنبه', items: [] as any[] },
      5: { id: 5, name: 'جمعه', items: [] as any[] },
    };

    schedule.forEach((item) => {
      const dayIndex = item.dayOfWeek as keyof typeof daysMap;
      if (daysMap[dayIndex]) {
        daysMap[dayIndex].items.push(item);
      }
    });

    // Order from Saturday to Friday
    const orderedKeys: (keyof typeof daysMap)[] = [6, 0, 1, 2, 3, 4, 5];
    
    return orderedKeys
      .map(key => daysMap[key])
      .filter(d => d.items.length > 0);
  }, [schedule, currentClassId]);

  const handleSaveNote = async (noteData: any) => {
    const res = await PlanningService.createNote({ ...noteData, classId: currentClassId });
    if (res.success) {
      fetchData();
    }
  };

  const menuItems = [
    {
      id: 'CHAT',
      title: 'پیام‌ها و چت کلاس',
      icon: <MessageSquare size={32} color={colors.primary} />,
      route: 'ClassChatScreen'
    },
    {
      id: 'STUDENTS',
      title: 'دانش‌آموزان',
      icon: <Users size={32} color={colors.primary} />,
      route: 'ClassStudentsScreen'
    },
    {
      id: 'EXAMS',
      title: 'آزمون‌ها',
      icon: <BookOpen size={32} color={colors.primary} />,
      route: 'ClassExamsScreen'
    },
    {
      id: 'SMART_SHEETS',
      title: 'پاسخ‌برگ هوشمند',
      icon: <ScanLine size={32} color={colors.primary} />,
      route: 'SmartSheetHubScreen'
    },
    {
      id: 'REPORTS',
      title: 'گزارشات',
      icon: <BarChart2 size={32} color={colors.primary} />,
      route: 'ClassReportsScreen'
    },
    {
      id: 'BIRTHDAYS',
      title: 'تولدها',
      icon: <Gift size={32} color={colors.primary} />,
      route: 'ClassBirthdaysScreen'
    },
    {
      id: 'SCHEDULE',
      title: 'برنامه هفتگی',
      icon: <Calendar size={32} color={colors.primary} />,
      route: 'WeeklyScheduleBuilderScreen'
    },
    {
      id: 'ATTENDANCE',
      title: 'حضور و غیاب',
      icon: <CheckSquare size={32} color={colors.primary} />,
      route: 'ClassAttendanceScreen'
    }
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, paddingTop: Math.max(insets.top, 20) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronRight size={24} color={colors.textLight} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{currentClassName}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textLight }]}>داشبورد کلاس</Text>
        </View>
        <TouchableOpacity 
          style={styles.settingsButton} 
          onPress={() => navigation.navigate('ClassSettingsScreen', { classroom, classId: currentClassId, className: currentClassName })}
        >
          <Settings size={24} color={colors.textLight} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* بنر درخواست‌های عضویت به سبک اینستاگرام */}
        {joinRequests.length > 0 ? (
          <TouchableOpacity
            style={[styles.igRequestsCard, { backgroundColor: colors.surface, borderColor: isDark ? '#334155' : '#e0e7ff' }]}
            onPress={() => setIsJoinRequestsModalVisible(true)}
            activeOpacity={0.85}
          >
            <View style={styles.igRequestsContent}>
              <View style={styles.igAvatarStack}>
                <View style={[styles.igAvatarItem, { zIndex: 3, backgroundColor: isDark ? '#1e3a5f' : '#eff6ff', borderColor: '#3b82f6' }]}>
                  <Text style={[styles.igAvatarText, { color: isDark ? '#93c5fd' : '#1d4ed8' }]}>
                    {joinRequests[0]?.firstName ? joinRequests[0].firstName.charAt(0) : '؟'}
                  </Text>
                </View>
                {joinRequests.length > 1 ? (
                  <View style={[styles.igAvatarItem, styles.igAvatarItemSecond, { zIndex: 2, backgroundColor: isDark ? '#064e3b' : '#f0fdf4', borderColor: '#22c55e' }]}>
                    <Text style={[styles.igAvatarText, { color: '#16a34a' }]}>
                      {joinRequests[1]?.firstName ? joinRequests[1].firstName.charAt(0) : '؟'}
                    </Text>
                  </View>
                ) : null}
                <View style={styles.igNotificationDot} />
              </View>

              <View style={styles.igTextContainer}>
                <View style={styles.igTitleRow}>
                  <Text style={[styles.igTitle, { color: colors.text }]}>درخواست‌های عضویت در کلاس</Text>
                  <View style={styles.igBadge}>
                    <Text style={styles.igBadgeText}>{toPersianDigits(joinRequests.length)}</Text>
                  </View>
                </View>
                <Text style={[styles.igSubtitle, { color: colors.textLight }]} numberOfLines={1}>
                  {joinRequests.length === 1
                    ? `«${joinRequests[0].firstName || ''} ${joinRequests[0].lastName || ''}» منتظر تایید شما است`
                    : `«${joinRequests[0].firstName || ''} ${joinRequests[0].lastName || ''}» و ${toPersianDigits(joinRequests.length - 1)} نفر دیگر درخواست عضویت دارند`}
                </Text>
              </View>
            </View>

            <ChevronLeft size={20} color={colors.textLight} />
          </TouchableOpacity>
        ) : null}

        {/* کارت شناسه کلاس و ثبت‌نام مستقیم دانش‌آموزان */}
        <View style={[styles.inviteCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.inviteCardHeader, { borderBottomColor: isDark ? '#334155' : '#f1f5f9' }]}>
            <View style={styles.inviteCardHeaderRight}>
              <View style={[styles.inviteBadgeIcon, { backgroundColor: isDark ? '#1e3a5f' : '#eff6ff' }]}>
                <Hash size={16} color={colors.primary} />
              </View>
              <Text style={[styles.inviteCardHeaderTitle, { color: colors.textLight }]}>شناسه کلاسی:</Text>
              <View style={[styles.classCodeBadge, { backgroundColor: isDark ? '#1e3a5f' : '#eff6ff', borderColor: isDark ? '#2563eb' : '#bfdbfe' }]}>
                <Text style={[styles.classCodeText, { color: isDark ? '#93c5fd' : '#1d4ed8' }]}>
                  {classCode ? toPersianDigits(classCode) : 'در حال دریافت...'}
                </Text>
              </View>
            </View>
            {classCode ? (
              <TouchableOpacity 
                style={[styles.copyCodeMiniBtn, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: colors.border }]} 
                onPress={handleCopyCode}
                activeOpacity={0.7}
              >
                <Copy size={13} color={colors.primary} />
                <Text style={[styles.copyCodeMiniText, { color: colors.primary }]}>کپی کد</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.inviteCardBody}>
            <Text style={[styles.inviteBodyTitle, { color: colors.text }]}>لینک ثبت‌نام دانش‌آموزان در کلاس</Text>
            <Text style={[styles.inviteBodySubtitle, { color: colors.textLight }]}>
              با ارسال این لینک، دانش‌آموزان با تایید پیامکی مشخصات خود را تکمیل کرده و مستقیماً وارد کلاس شما می‌شوند.
            </Text>

            {registrationUrl ? (
              <View style={[styles.urlPreviewBox, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: colors.border }]}>
                <Link size={14} color={colors.textLight} style={{ marginLeft: 6 }} />
                <Text style={[styles.urlPreviewText, { color: isDark ? '#94a3b8' : '#475569' }]} numberOfLines={1}>
                  {registrationUrl}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.inviteActionsRow}>
            <TouchableOpacity 
              style={[styles.shareActionBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]} 
              onPress={handleShareLink}
              activeOpacity={0.8}
            >
              <Share2 size={16} color="#ffffff" style={{ marginLeft: 6 }} />
              <Text style={styles.shareActionText}>ارسال لینک به دانش‌آموزان</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.copyLinkActionBtn, { backgroundColor: isDark ? '#1e3a5f' : '#eff6ff', borderColor: isDark ? '#2563eb' : '#bfdbfe' }]} 
              onPress={handleCopyLink}
              activeOpacity={0.8}
            >
              <Copy size={16} color={isDark ? '#93c5fd' : colors.primary} style={{ marginLeft: 6 }} />
              <Text style={[styles.copyLinkActionText, { color: isDark ? '#93c5fd' : colors.primary }]}>کپی لینک</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.gridContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={[styles.gridItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => {
                if (item.route === 'WeeklyScheduleBuilderScreen') {
                  navigation.navigate(item.route, { 
                    classId: currentClassId, 
                    className: currentClassName,
                    schoolName: classroom?.school?.name || ''
                  });
                } else if (item.route === 'SmartSheetHubScreen') {
                  const resolvedSchool = classData?.school?.name || classroom?.school?.name || classData?.schoolName || classroom?.schoolName || '';
                  navigation.navigate(item.route, {
                    classId: currentClassId,
                    currentClassId,
                    className: currentClassName,
                    currentClassName,
                    schoolName: resolvedSchool,
                    classroom: classData || classroom,
                  });
                } else {
                  navigation.navigate(item.route, { classroom, currentClassId, currentClassName });
                }
              }}
            >
              <View style={[styles.iconContainer, { backgroundColor: isDark ? '#0f172a' : '#eff6ff' }]}>
                {item.icon}
              </View>
              <Text style={[styles.gridItemTitle, { color: colors.text }]}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Weekly Schedule Section */}
        <View style={[styles.scheduleSection, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
          <View style={[styles.scheduleHeader, { borderBottomColor: isDark ? '#334155' : '#f1f5f9' }]}>
            <Text style={[styles.scheduleTitle, { color: colors.text }]}>برنامه کلاسی</Text>
            <TouchableOpacity onPress={() => navigation.navigate('WeeklyScheduleBuilderScreen', { 
              classId: currentClassId, 
              className: currentClassName,
              schoolName: classroom?.school?.name || ''
            })}>
              <Text style={[styles.editScheduleBtn, { backgroundColor: isDark ? '#1e3a5f' : '#eff6ff', color: isDark ? '#93c5fd' : colors.primary }]}>ویرایش برنامه کلاسی</Text>
            </TouchableOpacity>
          </View>
          
          {groupedSchedule.length > 0 ? (
            groupedSchedule.map((day) => (
              <View key={day.id} style={styles.scheduleDayRow}>
                <Text style={[styles.scheduleDayName, { color: isDark ? '#93c5fd' : colors.primary, backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}>{day.name}</Text>
                <View style={[styles.scheduleItemsCol, { borderRightColor: isDark ? '#3b82f6' : '#bae6fd' }]}>
                  {day.items.map((item: any, idx: number) => {
                    let durationText = '';
                    if (item.startTime && item.endTime) {
                      try {
                        const [sh, sm] = item.startTime.split(':').map(Number);
                        const [eh, em] = item.endTime.split(':').map(Number);
                        const diff = (eh * 60 + em) - (sh * 60 + sm);
                        if (diff > 0) {
                          if (diff === 60) durationText = '۱ ساعت';
                          else if (diff === 90) durationText = '۱ ساعت و نیم';
                          else durationText = `${diff} دقیقه`;
                        }
                      } catch (e) {}
                    }
                    
                    const timeStr = (item.startTime && item.endTime) ? `${item.startTime} الی ${item.endTime}` : 'بدون زمان';

                    return (
                      <View key={idx} style={[styles.scheduleItemCard, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: colors.border }]}>
                        <View style={styles.scheduleItemHeader}>
                          <Text style={[styles.scheduleItemSubject, { color: colors.text }]}>{item.subject || item.className}</Text>
                          <View style={[styles.schedulePeriodBadge, { backgroundColor: isDark ? '#1e3a5f' : '#dbeafe' }]}>
                            <Text style={[styles.schedulePeriodText, { color: isDark ? '#93c5fd' : '#1d4ed8' }]}>زنگ {idx + 1}</Text>
                          </View>
                        </View>
                        <View style={styles.scheduleItemFooter}>
                          <View style={styles.scheduleTimeWrapper}>
                            <Calendar size={12} color={colors.textLight} style={{ marginLeft: 4 }} />
                            <Text style={[styles.scheduleTimeText, { color: colors.textLight }]}>{timeStr}</Text>
                          </View>
                          {durationText ? (
                            <View style={[styles.scheduleDurationWrapper, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}>
                              <Text style={[styles.scheduleDurationText, { color: isDark ? '#cbd5e1' : '#475569' }]}>{durationText}</Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyScheduleText, { color: colors.textLight }]}>برنامه کلاسی ثبت نشده است.</Text>
          )}
        </View>

        {/* بخش تکالیف کلاس */}
        <View style={styles.homeworkSection}>
          <View style={styles.homeworkHeader}>
            <View style={styles.homeworkHeaderActions}>
              <TouchableOpacity
                onPress={() => navigation.navigate('CreateHomeworkScreen', { classId: currentClassId, className: currentClassName, subject: classData?.subjectName })}
                style={[styles.addHomeworkBtn, { backgroundColor: isDark ? '#1e3a5f' : '#eff6ff' }]}
                activeOpacity={0.7}
              >
                <Plus size={15} color={isDark ? '#93c5fd' : colors.primary} />
                <Text style={[styles.addHomeworkText, { color: isDark ? '#93c5fd' : colors.primary }]}>تکلیف جدید</Text>
              </TouchableOpacity>
              {homeworks.length > 0 && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('HomeworkListScreen', { classId: currentClassId, className: currentClassName })}
                  style={styles.viewAllHomeworkBtn}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.viewAllHomeworkText, { color: colors.primary }]}>مشاهده همه</Text>
                  <ChevronLeft size={14} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>
            <Text style={[styles.homeworkTitle, { color: colors.text }]}>لیست تکالیف</Text>
          </View>

          {homeworks.length === 0 ? (
            <Text style={[styles.emptyHomeworkText, { color: colors.textLight }]}>تکلیفی برای این کلاس ثبت نشده است.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.homeworkList}>
              {homeworks.map((hw) => {
                const remaining = getHomeworkRemainingDays(hw.dueDate);
                const visibleItems = (hw.items || []).slice(0, 3);
                const extraItems = Math.max(0, (hw.items || []).length - 3);

                return (
                  <TouchableOpacity
                    key={hw._id}
                    style={[
                      styles.homeworkCard,
                      {
                        borderColor: remaining.isToday ? '#ef4444' : colors.border,
                        backgroundColor: colors.surface,
                      },
                    ]}
                    onPress={() => navigation.navigate('HomeworkDetailsScreen', { homeworkId: hw._id })}
                    activeOpacity={0.8}
                  >
                    {/* Header: Subject & Remaining Badge */}
                    <View style={styles.hwCardHeader}>
                      <View style={[styles.hwRemainingBadge, { backgroundColor: remaining.badgeBg }]}>
                        {remaining.isToday && <AlertTriangle size={11} color={remaining.badgeColor} style={{ marginLeft: 2 }} />}
                        <Text style={[styles.hwRemainingText, { color: remaining.badgeColor }]}>
                          {remaining.badgeText}
                        </Text>
                      </View>
                      <Text style={[styles.hwSubjectText, { color: colors.primary }]}>{hw.subject}</Text>
                    </View>

                    {/* Title */}
                    <Text style={[styles.hwTitleText, { color: colors.text }]} numberOfLines={1}>
                      {hw.title}
                    </Text>

                    {/* First 3 items */}
                    <View style={[styles.hwItemsContainer, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
                      {visibleItems.map((it: any, i: number) => (
                        <View key={i} style={styles.hwItemRow}>
                          <View style={[styles.hwItemDot, { backgroundColor: colors.primary }]} />
                          <Text style={[styles.hwItemText, { color: colors.text }]} numberOfLines={1}>
                            {it.title}
                          </Text>
                        </View>
                      ))}
                    </View>

                    {/* Footer */}
                    <View style={styles.hwCardFooter}>
                      {extraItems > 0 ? (
                        <View style={[styles.hwExtraBadge, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]}>
                          <Text style={[styles.hwExtraBadgeText, { color: isDark ? '#cbd5e1' : '#475569' }]}>+{toPersianDigits(extraItems)}</Text>
                        </View>
                      ) : <View />}

                      <Text style={[styles.hwDueDateText, { color: colors.textLight }]}>
                        موعد: {toPersianDigits(hw.dueDateJalali || hw.dueDate)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        <View style={styles.notesSection}>
          <View style={styles.notesHeader}>
            <TouchableOpacity 
              onPress={() => navigation.navigate('AddNoteScreen', { classId: currentClassId })} 
              style={[styles.addNoteBtn, { backgroundColor: isDark ? '#1e3a5f' : '#eff6ff' }]}
            >
              <Plus size={16} color={isDark ? '#93c5fd' : colors.primary} />
              <Text style={[styles.addNoteText, { color: isDark ? '#93c5fd' : colors.primary }]}>یادداشت جدید</Text>
            </TouchableOpacity>
            <Text style={[styles.notesTitle, { color: colors.text }]}>یادداشت‌های کلاس</Text>
          </View>
          
          {notes.length === 0 ? (
            <Text style={[styles.emptyNotesText, { color: colors.textLight }]}>یادداشتی ثبت نشده است.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.notesList}>
              {notes.map((note) => (
                <TouchableOpacity 
                  key={note._id} 
                  style={[styles.noteCard, { backgroundColor: note.color || '#fef08a' }]}
                  onPress={() => navigation.navigate('AddNoteScreen', { note })}
                  activeOpacity={0.8}
                >
                  <Text style={styles.noteDate}>{note.date}</Text>
                  {note.title && <Text style={styles.noteCardTitle}>{note.title}</Text>}
                  <Text style={styles.noteContent} numberOfLines={3}>{note.content}</Text>
                  {note.tasks && note.tasks.length > 0 && (
                    <View style={{ marginTop: 8 }}>
                      <Text style={{ fontSize: 11, color: 'rgba(0,0,0,0.5)', fontFamily: 'IRANSansX' }}>{note.tasks.length} تسک</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        <GradebookTable classId={currentClassId} classroom={classData || classroom} />
      </ScrollView>

      <JoinRequestsModal
        visible={isJoinRequestsModalVisible}
        onClose={() => setIsJoinRequestsModalVisible(false)}
        classroomId={currentClassId}
        classroomName={currentClassName}
        onRequestsUpdated={fetchData}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: COLORS.surface, elevation: 2 },
  backButton: { padding: 8 },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  headerSubtitle: { fontSize: 13, color: COLORS.textLight, marginTop: 4 },
  settingsButton: { padding: 8 },
  
  content: { flexGrow: 1, padding: 20 },
  gridContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  // Weekly Schedule styles
  scheduleSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  scheduleHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 8,
  },
  scheduleTitle: {
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
    fontSize: 16,
    color: COLORS.text,
  },
  editScheduleBtn: {
    fontFamily: 'IRANSansX',
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: 'bold',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  scheduleDayRow: {
    flexDirection: 'row-reverse',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  scheduleDayName: {
    width: 70,
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
    fontSize: 14,
    color: COLORS.primary,
    textAlign: 'right',
    backgroundColor: '#f8fafc',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  scheduleItemsCol: {
    flex: 1,
    paddingRight: 10,
    borderRightWidth: 3,
    borderRightColor: '#bae6fd',
  },
  scheduleItemCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  scheduleItemHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scheduleItemSubject: {
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
    fontSize: 15,
    color: '#0f172a',
  },
  schedulePeriodBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  schedulePeriodText: {
    fontFamily: 'IRANSansX',
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1d4ed8',
  },
  scheduleItemFooter: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scheduleTimeWrapper: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  scheduleTimeText: {
    fontFamily: 'IRANSansX',
    fontSize: 12,
    color: '#64748b',
  },
  scheduleDurationWrapper: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  scheduleDurationText: {
    fontFamily: 'IRANSansX',
    fontSize: 11,
    color: '#475569',
  },
  emptyScheduleText: {
    fontFamily: 'IRANSansX',
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 12,
  },

  notesSection: { marginBottom: 24 },
  notesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  notesTitle: { fontSize: 16, fontFamily: 'IRANSansX', fontWeight: 'bold', color: COLORS.text },
  addNoteBtn: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  addNoteText: { fontSize: 13, fontFamily: 'IRANSansX', color: COLORS.primary, marginRight: 4, fontWeight: 'bold' },
  emptyNotesText: { textAlign: 'center', color: COLORS.textLight, fontFamily: 'IRANSansX', marginTop: 12, fontSize: 13 },
  notesList: { gap: 12 },
  noteCard: { width: 220, padding: 16, borderRadius: 16, elevation: 1, marginLeft: 12 },
  noteDate: { fontSize: 11, fontFamily: 'IRANSansX', color: '#475569', fontWeight: 'bold', marginBottom: 6 },
  noteCardTitle: { fontSize: 14, fontFamily: 'IRANSansX', color: '#0f172a', fontWeight: 'bold', marginBottom: 4 },
  noteContent: { fontSize: 13, fontFamily: 'IRANSansX', color: '#1e293b', lineHeight: 22 },
  gridItem: {
    width: '31%', // 3 columns
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 1,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  gridItemTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
  },

  /* Invite & Registration Card Styles */
  inviteCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  inviteCardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  inviteCardHeaderRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  inviteBadgeIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteCardHeaderTitle: {
    fontSize: 13,
    fontFamily: 'IRANSansX',
    color: '#64748b',
    fontWeight: 'bold',
  },
  classCodeBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  classCodeText: {
    fontSize: 16,
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
    color: '#1d4ed8',
    letterSpacing: 1,
  },
  copyCodeMiniBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 4,
  },
  copyCodeMiniText: {
    fontSize: 11,
    fontFamily: 'IRANSansX',
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  inviteCardBody: {
    paddingVertical: 12,
  },
  inviteBodyTitle: {
    fontSize: 14,
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
    textAlign: 'right',
  },
  inviteBodySubtitle: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
    color: '#64748b',
    lineHeight: 18,
    textAlign: 'right',
    marginBottom: 10,
  },
  urlPreviewBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  urlPreviewText: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
    textAlign: 'left',
    direction: 'ltr',
    fontFamily: 'monospace',
  },
  inviteActionsRow: {
    flexDirection: 'row-reverse',
    gap: 10,
    paddingTop: 8,
  },
  shareActionBtn: {
    flex: 1.6,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  shareActionText: {
    fontSize: 13,
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
    color: '#ffffff',
  },
  copyLinkActionBtn: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  copyLinkActionText: {
    fontSize: 13,
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
    color: COLORS.primary,
  },

  // Instagram-style Join Requests Banner
  igRequestsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#e0e7ff',
    ...Platform.select({
      ios: {
        shadowColor: '#4f46e5',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  igRequestsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  igAvatarStack: {
    width: 48,
    height: 40,
    position: 'relative',
    marginLeft: 12,
    justifyContent: 'center',
  },
  igAvatarItem: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    right: 0,
    top: 3,
  },
  igAvatarItemSecond: {
    right: 14,
    top: 3,
  },
  igAvatarText: {
    fontSize: 14,
    fontFamily: 'IRANSansX',
    fontWeight: '700',
    color: '#2563eb',
  },
  igNotificationDot: {
    position: 'absolute',
    top: 2,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: '#ffffff',
    zIndex: 10,
  },
  igTextContainer: {
    flex: 1,
  },
  igTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  igTitle: {
    fontSize: 14,
    fontFamily: 'IRANSansX',
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'left',
  },
  igBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 10,
    marginRight: 8,
  },
  igBadgeText: {
    fontSize: 11,
    fontFamily: 'IRANSansX',
    fontWeight: '700',
    color: '#ffffff',
  },
  igSubtitle: {
    fontSize: 12,
    fontFamily: 'IRANSansX',
    color: '#64748b',
    textAlign: 'left',
  },
  // Homework section styles
  homeworkSection: {
    marginBottom: 24,
  },
  homeworkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  homeworkTitle: {
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
    fontSize: 16,
    color: COLORS.text,
  },
  homeworkHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addHomeworkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addHomeworkText: {
    fontSize: 12,
    color: COLORS.primary,
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
    marginRight: 4,
  },
  viewAllHomeworkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  viewAllHomeworkText: {
    fontSize: 12,
    color: COLORS.primary,
    fontFamily: 'IRANSansX',
    fontWeight: '600',
  },
  emptyHomeworkText: {
    fontFamily: 'IRANSansX',
    color: COLORS.textLight,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 16,
  },
  homeworkList: {
    paddingVertical: 4,
  },
  homeworkCard: {
    width: 210,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginLeft: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  hwCardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  hwSubjectText: {
    fontSize: 11,
    fontFamily: 'IRANSansX',
    color: COLORS.primary,
    fontWeight: '700',
  },
  hwRemainingBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 5,
  },
  hwRemainingText: {
    fontSize: 9.5,
    fontFamily: 'IRANSansX',
    fontWeight: '700',
  },
  hwTitleText: {
    fontSize: 13.5,
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'right',
    marginBottom: 8,
  },
  hwItemsContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 6,
    marginBottom: 8,
  },
  hwItemRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 3,
  },
  hwItemDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    marginLeft: 5,
  },
  hwItemText: {
    fontSize: 11,
    fontFamily: 'IRANSansX',
    color: COLORS.text,
    flex: 1,
    textAlign: 'right',
  },
  hwCardFooter: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hwExtraBadge: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  hwExtraBadgeText: {
    fontSize: 10,
    fontFamily: 'IRANSansX',
    color: '#475569',
    fontWeight: '700',
  },
  hwDueDateText: {
    fontSize: 10,
    fontFamily: 'IRANSansX',
    color: COLORS.textLight,
  },
});

export default ClassDetailsScreen;
