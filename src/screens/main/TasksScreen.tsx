import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { ChevronRight, Plus, CheckSquare, Clock, MapPin, User } from 'lucide-react-native';
import { toPersianNumbers, getTodayJalali, formatJalaliStandard } from '../../utils/date/jalaliHelper';
import { PlanningService, TeacherTask } from '../../api/planningService';
import AddTaskModal from '../../components/planning/AddTaskModal';

const TasksScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<'all' | 'today' | 'future' | 'done'>('today');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [tasksState, setTasksState] = useState<TeacherTask[]>([]);
  
  const { jy, jm, jd } = getTodayJalali();
  const todayStr = formatJalaliStandard(jy, jm, jd);

  const fetchTasks = async () => {
    try {
      const res = await PlanningService.getTasks();
      if (res.success && res.data) {
        setTasksState(res.data);
      }
    } catch (err) {}
  };

  React.useEffect(() => {
    fetchTasks();
  }, []);

  const handleSaveTask = async (taskData: any) => {
    await PlanningService.createTask(taskData);
    await fetchTasks();
  };

  const handleToggleDone = async (task: TeacherTask) => {
    if (task._id) {
      await PlanningService.updateTask(task._id, { status: task.status === 'completed' ? 'pending' : 'completed' });
      await fetchTasks();
    }
  };

  const getFilteredTasks = () => {
    switch (activeTab) {
      case 'today': return tasksState.filter(t => t.dueDate === todayStr && t.status !== 'completed');
      case 'future': return tasksState.filter(t => t.dueDate && t.dueDate > todayStr && t.status !== 'completed');
      case 'done': return tasksState.filter(t => t.status === 'completed');
      default: return tasksState;
    }
  };

  const tasks = getFilteredTasks();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronRight color={colors.text} size={28} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>مدیریت کارها</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={[styles.tabsContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {[
          { id: 'all', label: 'همه' },
          { id: 'today', label: 'امروز' },
          { id: 'future', label: 'آینده' },
          { id: 'done', label: 'انجام‌شده' },
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity 
              key={tab.id} 
              style={[styles.tabBtn, isActive && { borderBottomColor: colors.primary }]}
              onPress={() => setActiveTab(tab.id as any)}
            >
              <Text style={[styles.tabBtnText, { color: isActive ? colors.primary : colors.textLight }]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {tasks.length === 0 ? (
          <Text style={[styles.emptyState, { color: colors.textLight }]}>هیچ کاری در این بخش وجود ندارد.</Text>
        ) : (
          tasks.map(task => {
            const isDone = task.status === 'completed';
            return (
            <TouchableOpacity key={task._id || task.title} style={[styles.taskCard, { backgroundColor: colors.surface, borderColor: colors.border }]} activeOpacity={0.8} onPress={() => handleToggleDone(task)}>
              <View style={[styles.checkbox, isDone && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                {isDone && <CheckSquare color="#fff" size={14} />}
              </View>
              <View style={styles.taskInfo}>
                <Text style={[styles.taskTitle, { color: isDone ? colors.textLight : colors.text }, isDone && { textDecorationLine: 'line-through' }]}>
                  {task.title}
                </Text>
                
                <View style={styles.taskMetaRow}>
                  {task.dueDate && (
                    <View style={styles.taskMeta}>
                      <Clock color={colors.textLight} size={12} />
                      <Text style={[styles.taskDate, { color: colors.textLight }]}>{task.time ? `${task.dueDate} - ${task.time}` : task.dueDate}</Text>
                    </View>
                  )}
                  {task.forWhere && (
                    <View style={styles.taskMeta}>
                      <MapPin color={colors.textLight} size={12} />
                      <Text style={[styles.taskDate, { color: colors.textLight }]}>{task.forWhere}</Text>
                    </View>
                  )}
                  {task.forWhom && (
                    <View style={styles.taskMeta}>
                      <User color={colors.textLight} size={12} />
                      <Text style={[styles.taskDate, { color: colors.textLight }]}>{task.forWhom}</Text>
                    </View>
                  )}
                  {task.priority === 'urgent' && !isDone && (
                    <View style={styles.priorityBadge}>
                      <Text style={styles.priorityText}>فوری</Text>
                    </View>
                  )}
                  {task.priority === 'important' && !isDone && (
                    <View style={[styles.priorityBadge, { backgroundColor: '#fef3c7' }]}>
                      <Text style={[styles.priorityText, { color: '#d97706' }]}>مهم</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )})
        )}

      </ScrollView>

      {/* FAB */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: colors.primary }]} 
        activeOpacity={0.8}
        onPress={() => setIsAddModalVisible(true)}
      >
        <Plus color="#fff" size={28} />
      </TouchableOpacity>

      <AddTaskModal 
        visible={isAddModalVisible} 
        onClose={() => setIsAddModalVisible(false)} 
        onSave={handleSaveTask} 
      />

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', fontFamily: 'IRANSansX' },
  
  tabsContainer: {
    flexDirection: 'row', borderBottomWidth: 1,
  },
  tabBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 14, borderBottomWidth: 2, borderBottomColor: 'transparent'
  },
  tabBtnText: {
    fontSize: 13, fontWeight: 'bold', fontFamily: 'IRANSansX'
  },

  content: { padding: 16, paddingBottom: 80 },
  emptyState: { fontSize: 14, fontFamily: 'IRANSansX', fontStyle: 'italic', textAlign: 'center', marginTop: 40 },

  taskCard: {
    flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2,
  },
  checkbox: {
    width: 24, height: 24, borderRadius: 8, borderWidth: 1.5, borderColor: '#cbd5e1', marginRight: 12,
    justifyContent: 'center', alignItems: 'center'
  },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: 15, fontFamily: 'IRANSansX', fontWeight: 'bold', marginBottom: 8 },
  taskMetaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  taskMeta: { flexDirection: 'row', alignItems: 'center' },
  taskDate: { fontSize: 12, fontFamily: 'IRANSansX', marginLeft: 4 },
  priorityBadge: { backgroundColor: '#fee2e2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  priorityText: { color: '#dc2626', fontSize: 10, fontFamily: 'IRANSansX', fontWeight: 'bold' },

  fab: {
    position: 'absolute', bottom: 24, left: 24, width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center', elevation: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 5,
  }
});

export default TasksScreen;
