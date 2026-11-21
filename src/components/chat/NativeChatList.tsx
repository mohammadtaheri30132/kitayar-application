import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import {
  requireNativeComponent,
  UIManager,
  findNodeHandle,
  ViewProps,
  NativeSyntheticEvent,
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { FileText, Volume2 } from 'lucide-react-native';

interface NativeChatListViewProps extends ViewProps {
  currentUserId: string;
  messagesJson: string;
  onImagePress?: (event: NativeSyntheticEvent<{ imageUrl: string }>) => void;
}

// Safely probe if native view manager is available
const isNativeAvailable = Boolean(UIManager.getViewManagerConfig && UIManager.getViewManagerConfig('NativeChatListView'));
const NativeChatListView = isNativeAvailable
  ? requireNativeComponent<NativeChatListViewProps>('NativeChatListView')
  : null;

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
  ({ currentUserId, messages = [], onImagePress, style, ...rest }, ref) => {
    const nativeRef = useRef<any>(null);
    const flatListRef = useRef<FlatList>(null);

    useImperativeHandle(ref, () => ({
      scrollToBottom: () => {
        if (isNativeAvailable && nativeRef.current) {
          const handle = findNodeHandle(nativeRef.current);
          if (handle) {
            const config: any = UIManager.getViewManagerConfig('NativeChatListView');
            UIManager.dispatchViewManagerCommand(
              handle,
              config?.Commands?.scrollToBottom || 1,
              []
            );
          }
        } else {
          flatListRef.current?.scrollToEnd({ animated: true });
        }
      },
    }));

    if (isNativeAvailable && NativeChatListView) {
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

    // Pure React Native Fallback Renderer
    const renderFallbackItem = ({ item }: { item: ChatMessageItem }) => {
      const senderIdStr = typeof item.senderId === 'object' ? item.senderId?._id : item.senderId;
      const isMe = item.isMe !== undefined ? item.isMe : (currentUserId && senderIdStr === currentUserId);
      const timeStr = item.createdAt ? new Date(item.createdAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }) : '';

      return (
        <View style={[styles.bubbleWrapper, isMe ? styles.bubbleMeWrapper : styles.bubbleOtherWrapper]}>
          <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
            {!isMe && item.senderName ? (
              <Text style={styles.senderLabel}>{item.senderName}</Text>
            ) : null}

            {item.type === 'text' && (
              <Text style={[styles.textMsg, isMe ? styles.textMsgMe : styles.textMsgOther]}>
                {item.content}
              </Text>
            )}

            {item.type === 'voice' && (
              <View style={styles.voiceRow}>
                <Volume2 size={18} color={isMe ? '#ffffff' : '#0284c7'} />
                <Text style={[styles.voiceDuration, isMe ? styles.textMsgMe : styles.textMsgOther]}>
                  پیام صوتی {item.mediaDuration ? `(${item.mediaDuration} ثانیه)` : ''}
                </Text>
              </View>
            )}

            {item.type === 'image' && item.mediaUrl && (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => onImagePress && onImagePress(item.mediaUrl!)}
                style={styles.imageWrap}
              >
                <Image source={{ uri: item.mediaUrl }} style={styles.imageMsg} resizeMode="cover" />
                {item.content ? (
                  <Text style={[styles.captionText, isMe ? styles.textMsgMe : styles.textMsgOther]}>
                    {item.content}
                  </Text>
                ) : null}
              </TouchableOpacity>
            )}

            {(item.type === 'file' || item.type === 'video') && (
              <View style={styles.fileRow}>
                <FileText size={18} color={isMe ? '#ffffff' : '#64748b'} />
                <Text style={[styles.fileText, isMe ? styles.textMsgMe : styles.textMsgOther]} numberOfLines={1}>
                  {item.content || 'فایل ضمیمه'}
                </Text>
              </View>
            )}

            <Text style={[styles.timeLabel, isMe ? styles.timeMe : styles.timeOther]}>
              {timeStr}
            </Text>
          </View>
        </View>
      );
    };

    return (
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, index) => item._id || index.toString()}
        renderItem={renderFallbackItem}
        contentContainerStyle={[styles.listContainer, messages.length === 0 && styles.emptyContainer]}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>هنوز پیامی در این گفتگو ارسال نشده است.</Text>
            <Text style={styles.emptySubText}>اولین پیام خود را بنویسید یا ضبط کنید.</Text>
          </View>
        }
        style={[{ flex: 1 }, style]}
        {...rest}
      />
    );
  }
);

const styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Vazirmatn-Medium',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 12,
    color: '#94a3b8',
    fontFamily: 'Vazirmatn-Regular',
    textAlign: 'center',
  },
  bubbleWrapper: {
    width: '100%',
    marginVertical: 4,
    flexDirection: 'row',
  },
  bubbleMeWrapper: {
    justifyContent: 'flex-start',
  },
  bubbleOtherWrapper: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  bubbleMe: {
    backgroundColor: '#0284c7',
    borderBottomRightRadius: 2,
  },
  bubbleOther: {
    backgroundColor: '#f1f5f9',
    borderBottomLeftRadius: 2,
  },
  senderLabel: {
    fontSize: 11,
    fontFamily: 'Vazirmatn-Bold',
    color: '#0284c7',
    marginBottom: 2,
    textAlign: 'right',
  },
  textMsg: {
    fontSize: 13,
    fontFamily: 'Vazirmatn-Regular',
    lineHeight: 20,
    textAlign: 'right',
  },
  textMsgMe: {
    color: '#ffffff',
  },
  textMsgOther: {
    color: '#0f172a',
  },
  voiceRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  voiceDuration: {
    fontSize: 12,
    fontFamily: 'Vazirmatn-Medium',
  },
  imageWrap: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  imageMsg: {
    width: 220,
    height: 160,
    borderRadius: 8,
  },
  captionText: {
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Vazirmatn-Regular',
    textAlign: 'right',
  },
  fileRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  fileText: {
    fontSize: 12,
    fontFamily: 'Vazirmatn-Medium',
    maxWidth: 180,
  },
  timeLabel: {
    fontSize: 10,
    fontFamily: 'Vazirmatn-Light',
    marginTop: 4,
    textAlign: 'left',
  },
  timeMe: {
    color: 'rgba(255,255,255,0.7)',
  },
  timeOther: {
    color: '#94a3b8',
  },
});
