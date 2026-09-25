import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import GlobalHeader from '../../components/common/GlobalHeader';
import { ChevronLeft } from 'lucide-react-native';

const EducationBooksScreen = ({ route, navigation }: any) => {
  const { colors } = useTheme();
  
  // Params
  const { 
    subject = 'دبیر ریاضی', 
    level = 'متوسطه دوم', 
    field, 
    grade = 'دهم' 
  } = route.params || {};

  // Mock Books
  const books = [
    { id: 1, title: 'ریاضی ۱', cover: 'https://img.freepik.com/premium-vector/math-book-icon-isometric-style_98396-1891.jpg' },
    { id: 2, title: 'هندسه ۱', cover: 'https://img.freepik.com/premium-vector/geometry-book-icon-isometric-style_98396-1893.jpg' },
    { id: 3, title: 'آمار و احتمال', cover: 'https://img.freepik.com/premium-vector/statistics-book-icon-isometric-style_98396-1895.jpg' }
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <GlobalHeader onProfilePress={() => navigation.navigate('ProfileScreen')} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Breadcrumb */}
        <View style={styles.breadcrumb}>
          <Text style={[styles.breadcrumbText, { color: colors.textLight }]}>{subject}</Text>
          <ChevronLeft color={colors.textLight} size={14} style={styles.breadcrumbIcon} />
          {field ? (
            <>
              <Text style={[styles.breadcrumbText, { color: colors.textLight }]}>{field}</Text>
              <ChevronLeft color={colors.textLight} size={14} style={styles.breadcrumbIcon} />
            </>
          ) : (
            <>
              <Text style={[styles.breadcrumbText, { color: colors.textLight }]}>{level}</Text>
              <ChevronLeft color={colors.textLight} size={14} style={styles.breadcrumbIcon} />
            </>
          )}
          <Text style={[styles.breadcrumbText, { color: colors.primary, fontWeight: 'bold' }]}>پایه {grade}</Text>
        </View>

        {/* Page Title */}
        <View style={styles.pageTitleContainer}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>کتاب‌های درسی</Text>
        </View>

        {/* Books Grid */}
        <View style={styles.booksGrid}>
          {books.map((book) => {
            return (
              <TouchableOpacity 
                key={book.id} 
                style={[styles.bookCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('EducationChaptersScreen', { subject, level, field, grade, bookTitle: book.title })}
              >
                <View style={[styles.coverBox, { backgroundColor: '#f1f5f9' }]}>
                  <Image source={{ uri: book.cover }} style={styles.bookCover} resizeMode="contain" />
                </View>
                <View style={styles.bookInfo}>
                  <Text style={[styles.bookTitle, { color: colors.text }]}>{book.title}</Text>
                  <Text style={[styles.bookSub, { color: colors.textLight }]}>پایه {grade}</Text>
                </View>
                <ChevronLeft color={colors.textLight} size={20} />
              </TouchableOpacity>
            );
          })}
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
    flexWrap: 'wrap',
  },
  breadcrumbText: { fontSize: 11, fontFamily: 'IRANSansX' },
  breadcrumbIcon: { marginHorizontal: 4 },

  pageTitleContainer: { marginBottom: 24 },
  pageTitle: { fontSize: 22, fontWeight: 'bold', fontFamily: 'IRANSansX' },

  booksGrid: { gap: 16 },
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

export default EducationBooksScreen;
