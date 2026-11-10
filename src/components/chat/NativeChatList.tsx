import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import {
  requireNativeComponent,
  UIManager,
  findNodeHandle,
  ViewProps,
  NativeSyntheticEvent,
} from 'react-native';

interface NativeChatListViewProps extends ViewProps {
  currentUserId: string;
  messagesJson: string;
  onImagePress?: (event: NativeSyntheticEvent<{ imageUrl: string }>) => void;
}

const NativeChatListView = requireNativeComponent<NativeChatListViewProps>('NativeChatListView');

export interface NativeChatListRef {
  scrollToBottom: () => void;
}

export interface ChatMessageItem {
  _id: string;
  senderId: string | { _id: string; fullName: string; avatar?: string };
  senderName?: string;
  content: string;
  type: 'text' | 'voice' | 'image' | 'file' | 'video';
  mediaUrl?: string;
  mediaDuration?: number;
  status?: 'sent' | 'delivered' | 'read';
  createdAt: string;
  isMe?: boolean;
}

interface Props extends ViewProps {
  currentUserId: string;
  messages: ChatMessageItem[];
  onImagePress?: (imageUrl: string) => void;
}

export const NativeChatList = forwardRef<NativeChatListRef, Props>(
  ({ currentUserId, messages, onImagePress, style, ...rest }, ref) => {
    const nativeRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      scrollToBottom: () => {
        const handle = findNodeHandle(nativeRef.current);
        if (handle) {
          const config: any = UIManager.getViewManagerConfig('NativeChatListView');
          UIManager.dispatchViewManagerCommand(
            handle,
            config?.Commands?.scrollToBottom || 1,
            []
          );
        }
      },
    }));

    const messagesJson = JSON.stringify(messages || []);

    return (
      <NativeChatListView
        ref={nativeRef}
        style={[{ flex: 1 }, style]}
        currentUserId={currentUserId}
        messagesJson={messagesJson}
        onImagePress={(e) => {
          if (onImagePress && e.nativeEvent?.imageUrl) {
            onImagePress(e.nativeEvent.imageUrl);
          }
        }}
        {...rest}
      />
    );
  }
);
