import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import GlobalHeader from '../../components/common/GlobalHeader';
import InteractionTabs, { TabType } from './components/InteractionTabs';
import QuestionsTab from './tabs/QuestionsTab';
import NewsTab from './tabs/NewsTab';
import PostsTab from './tabs/PostsTab';

const InteractionScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('qna');

  const handleSearchPress = () => {
    // This could open a search modal or expand a search bar. 
    // For now we will handle search inside the specific tab component if needed.
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <GlobalHeader 
        onProfilePress={() => navigation.navigate('ProfileScreen')} 
      />
      <InteractionTabs activeTab={activeTab} onChangeTab={setActiveTab} />
      
      <View style={styles.content}>
        {activeTab === 'qna' && <QuestionsTab navigation={navigation} />}
        {activeTab === 'news' && <NewsTab navigation={navigation} />}
        {activeTab === 'posts' && <PostsTab navigation={navigation} />}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  }
});

export default InteractionScreen;
