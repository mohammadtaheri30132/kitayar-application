import React, { useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import InteractionSearch from '../components/InteractionSearch';
import CategoryChips from '../components/CategoryChips';
import QuestionCard from '../components/QuestionCard';
import { MOCK_QUESTIONS } from '../mockData';

const CATEGORIES = ['همه', 'آموزشی', 'کلاسداری', 'ارزشیابی', 'سایر'];

const QuestionsTab = ({ navigation }: any) => {
  const { colors } = useTheme();
  
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('همه');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredQuestions = useMemo(() => {
    return MOCK_QUESTIONS.filter(q => {
      const matchesSearch = q.title.includes(search) || q.body.includes(search) || q.author.name.includes(search);
      const matchesCategory = selectedCategory === 'همه' || q.tags.includes(selectedCategory);
      return matchesSearch && matchesCategory;
    });
  }, [search, selectedCategory]);

  const onRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <View style={styles.container}>
      <InteractionSearch 
        value={search} 
        onChangeText={setSearch} 
        placeholder="جستجوی سوالات..." 
      />
      
      <View style={styles.chipsWrapper}>
        <CategoryChips 
          categories={CATEGORIES} 
          selectedCategory={selectedCategory} 
          onSelect={setSelectedCategory} 
        />
      </View>

      <FlatList
        data={filteredQuestions}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <QuestionCard 
            question={item} 
            onPress={() => navigation.navigate('QuestionDetailScreen', { questionId: item.id })}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      />

      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('NewQuestionScreen')}
        activeOpacity={0.8}
      >
        <Plus color="#fff" size={28} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chipsWrapper: {
    marginBottom: 8,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  }
});

export default QuestionsTab;
