import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import GlobalHeader from '../../components/common/GlobalHeader';
import { ChevronLeft, Wrench, PenTool, Radio } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const EducationSubjectScreen = ({ route, navigation }: any) => {
  const { colors } = useTheme();
  const { subjectTitle = 'دبیر ریاضی', subjectColor = '#f59e0b' } = route.params || {};

  const tools = [
    { id: 1, title: 'کمک ابزار کلاسی', icon: Wrench, color: '#f59e0b' },
    { id: 2, title: 'ساخت آزمون', icon: PenTool, color: '#10b981' },
    { id: 3, title: 'برگزاری آزمون آنلاین', icon: Radio, color: '#8b5cf6' },
  ];

  // Flat list of books
  const books = [
    { id: 1, title: 'ریاضی هفتم', grade: 'هفتم (متوسطه اول)', cover: 'https://img.freepik.com/premium-vector/math-book-icon-isometric-style_98396-1891.jpg' },
    { id: 2, title: 'ریاضی هشتم', grade: 'هشتم (متوسطه اول)', cover: 'https://img.freepik.com/premium-vector/math-book-icon-isometric-style_98396-1891.jpg' },
    { id: 3, title: 'ریاضی نهم', grade: 'نهم (متوسطه اول)', cover: 'https://img.freepik.com/premium-vector/math-book-icon-isometric-style_98396-1891.jpg' },
    { id: 4, title: 'ریاضی ۱', grade: 'دهم (ریاضی و تجربی)', cover: 'https://img.freepik.com/premium-vector/math-book-icon-isometric-style_98396-1891.jpg' },
    { id: 5, title: 'هندسه ۱', grade: 'دهم (ریاضی فیزیک)', cover: 'https://img.freepik.com/premium-vector/geometry-book-icon-isometric-style_98396-1893.jpg' },
    { id: 6, title: 'آمار و احتمال', grade: 'یازدهم (ریاضی فیزیک)', cover: 'https://img.freepik.com/premium-vector/statistics-book-icon-isometric-style_98396-1895.jpg' }
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <GlobalHeader onProfilePress={() => navigation.navigate('ProfileScreen')} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Breadcrumb */}
        <View style={styles.breadcrumb}>
          <Text style={[styles.breadcrumbText, { color: colors.primary, fontWeight: 'bold' }]}>{subjectTitle}</Text>
        </View>

        {/* Tools Section */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>ابزارهای کاربردی</Text>
        <View style={styles.toolsContainer}>
          {tools.map(tool => {
            const IconComponent = tool.icon;
            return (
              <TouchableOpacity 
                key={tool.id} 
                style={[styles.toolCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                activeOpacity={0.8}
              >
                <View style={[styles.toolIconBox, { backgroundColor: `${tool.color}15` }]}>
                  <IconComponent color={tool.color} size={28} />
                </View>
                <Text style={[styles.toolTitle, { color: colors.text }]}>{tool.title}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Books Section */}
        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 32 }]}>لیست کتاب‌های درسی</Text>
        <View style={styles.booksList}>
          {books.map((book) => (
            <TouchableOpacity 
              key={book.id} 
              style={[styles.bookCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('EducationChaptersScreen', { subject: subjectTitle, grade: book.grade, bookTitle: book.title })}
            >
              <View style={[styles.coverBox, { backgroundColor: '#f1f5f9' }]}>
                <Image source={{ uri: book.cover }} style={styles.bookCover} resizeMode="contain" />
              </View>
              <View style={styles.bookInfo}>
                <Text style={[styles.bookTitle, { color: colors.text }]}>{book.title}</Text>
                <Text style={[styles.bookSub, { color: colors.textLight }]}>{book.grade}</Text>
              </View>
              <ChevronLeft color={colors.textLight} size={20} />
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  breadcrumbText: {
    fontSize: 16,
    fontFamily: 'IRANSansX',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
    marginBottom: 16,
  },

  toolsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  toolCard: {
    width: (width - 32 - 16) / 3, // 3 columns
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  toolIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  toolTitle: {
    fontSize: 11,
    fontFamily: 'IRANSansX',
    fontWeight: 'bold',
    textAlign: 'center',
  },

  booksList: {
    gap: 12,
  },
  bookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  coverBox: {
    width: 60,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
    overflow: 'hidden',
  },
  bookCover: { width: '100%', height: '100%' },
  bookInfo: { flex: 1, justifyContent: 'center' },
  bookTitle: { fontSize: 16, fontWeight: 'bold', fontFamily: 'IRANSansX', marginBottom: 4 },
  bookSub: { fontSize: 12, fontFamily: 'IRANSansX' },
});

export default EducationSubjectScreen;
