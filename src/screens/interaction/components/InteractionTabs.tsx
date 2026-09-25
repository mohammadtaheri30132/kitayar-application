import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, I18nManager } from 'react-native';
import { MessageCircleQuestion, Newspaper, MessagesSquare } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';

export type TabType = 'qna' | 'news' | 'posts';

interface Props {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

const InteractionTabs = ({ activeTab, onChangeTab }: Props) => {
  const { colors } = useTheme();

  const renderTab = (id: TabType, label: string, Icon: any) => {
    const isActive = activeTab === id;
    return (
      <TouchableOpacity 
        style={[styles.tab, isActive && { borderBottomColor: colors.primary, borderBottomWidth: 3 }]} 
        onPress={() => onChangeTab(id)}
      >
        <Icon color={isActive ? colors.primary : colors.textLight} size={20} />
        <Text style={[styles.tabText, { color: isActive ? colors.primary : colors.textLight }]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      {renderTab('qna', 'پرسش و پاسخ', MessageCircleQuestion)}
      {renderTab('news', 'اخبار', Newspaper)}
      {renderTab('posts', 'پست‌ها', MessagesSquare)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    borderBottomWidth: 1,
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  tabText: {
    fontFamily: 'IRANSansX',
    fontSize: 14,
    fontWeight: 'bold',
    marginHorizontal: 8,
  }
});

export default InteractionTabs;
