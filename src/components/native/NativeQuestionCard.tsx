import React from 'react';
import { Platform, requireNativeComponent, ViewStyle, StyleSheet } from 'react-native';
import QuestionCard from '../../screens/interaction/components/QuestionCard';
import { CommunityQuestionItem } from '../../services/community/communityService';
import { formatRelativeTime } from '../../utils/communityHelpers';
import { useTheme } from '../../context/ThemeContext';

interface NativeCardProps {
  questionId: string;
  title: string;
  body: string;
  authorName: string;
  authorRole: string;
  timeText: string;
  categoryName: string;
  categoryColor: string;
  answerCount: number;
  status?: string;
  isDarkMode?: boolean;
  onCardPress?: (e: any) => void;
  style?: ViewStyle;
}

const CommunityQnaNative = Platform.OS === 'android'
  ? requireNativeComponent<NativeCardProps>('CommunityQnaCardView')
  : null;

interface Props {
  question: CommunityQuestionItem;
  onPress: () => void;
  isDarkMode?: boolean;
  style?: ViewStyle;
}

export const NativeQuestionCard: React.FC<Props> = ({ question, onPress, isDarkMode, style }) => {
  const { isDark } = useTheme();
  const effectiveDark = isDarkMode !== undefined ? isDarkMode : isDark;

  if (Platform.OS === 'android' && CommunityQnaNative) {
    const authorName = (question as any).authorName || question.author?.name || 'کاربر کیتایار';
    const authorRole = (question as any).authorRole || question.author?.role || 'معلم';
    const timeText = question.createdAt ? formatRelativeTime(question.createdAt) : '';
    const categoryName = question.category?.name || '';
    const categoryColor = question.category?.color || '#2563EB';

    const NativeComp = CommunityQnaNative as any;
    return (
      <NativeComp
        style={[styles.nativeCard, style]}
        questionId={question._id}
        title={question.title || ''}
        body={question.body || ''}
        authorName={authorName}
        authorRole={authorRole}
        timeText={timeText}
        categoryName={categoryName}
        categoryColor={categoryColor}
        answerCount={question.answerCount || 0}
        status={(question as any).status || 'active'}
        isDarkMode={effectiveDark}
        onCardPress={onPress}
      />
    );
  }

  // Cross-platform Fallback
  return <QuestionCard question={question} onPress={onPress} />;
};

const styles = StyleSheet.create({
  nativeCard: {
    width: '100%',
    minHeight: 140,
    marginBottom: 12,
  },
});

export default NativeQuestionCard;
