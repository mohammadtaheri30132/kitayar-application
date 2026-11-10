import React from 'react';
import { requireNativeComponent, ViewProps, StyleSheet, NativeSyntheticEvent } from 'react-native';

export interface NativeQuestionItem {
  _id: string;
  id?: string;
  question: string;
  mainQuestion?: string;
  type?: string;
  difficulty?: string;
  options?: string[];
  answer?: string;
  source_image?: string;
  origin?: 'mine' | 'admin' | string;
  [key: string]: any;
}

export interface ToggleSelectEvent {
  questionId: string;
  isSelected: boolean;
}

export interface RemoveEvent {
  questionId: string;
}

export interface EditEvent {
  questionId: string;
}

export interface NativeQuestionListProps extends ViewProps {
  questions: NativeQuestionItem[];
  selectedIds: string[];
  isDarkMode?: boolean;
  isBankMode?: boolean;
  canDelete?: boolean;
  onToggleSelect?: (event: NativeSyntheticEvent<ToggleSelectEvent>) => void;
  onRemove?: (event: NativeSyntheticEvent<RemoveEvent>) => void;
  onEdit?: (event: NativeSyntheticEvent<EditEvent>) => void;
  onLoadMore?: (event: NativeSyntheticEvent<any>) => void;
}

const RNQuestionListView = requireNativeComponent<NativeQuestionListProps>('NativeQuestionListView');

export const NativeQuestionList: React.FC<NativeQuestionListProps> = (props) => {
  return (
    <RNQuestionListView
      {...props}
      style={[styles.container, props.style]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
});

export default NativeQuestionList;
