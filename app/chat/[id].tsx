import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { messageService, Message } from '../../src/services/messages';
import { Colors, Typography, CommonStyles } from '../../src/utils/theme';
import { supabase } from '../../src/services/supabase';

export default function ChatDetailScreen() {
  const { id: otherId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [otherUser, setOtherUser] = useState<any>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (user && otherId) {
      initChat();
      const subscription = subscribeLocal();
      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [otherId]);

  const initChat = async () => {
    try {
      setLoading(true);
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', otherId)
        .single();
      
      setOtherUser(userData);

      const data = await messageService.getMessages(user!.id, otherId as string);
      setMessages(data);
      await messageService.markAsRead(otherId as string, user!.id);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeLocal = () => {
    return supabase
      .channel(`chat_detail_${otherId}`)
      .on(
        'postgres_changes' as any,
        {
          event: 'INSERT',
          table: 'messages',
        },
        (payload: any) => {
          const newMsg = payload.new as Message;
          if (
            (newMsg.sender_id === otherId && newMsg.recipient_id === user!.id) ||
            (newMsg.sender_id === user!.id && newMsg.recipient_id === otherId)
          ) {
            setMessages(prev => [...prev, newMsg]);
            if (newMsg.sender_id === otherId) {
              messageService.markAsRead(otherId as string, user!.id);
            }
          }
        }
      )
      .subscribe();
  };

  const handleSend = async () => {
    if (!inputText.trim() || !user || !otherId) return;

    const text = inputText.trim();
    setInputText('');
    
    try {
      await messageService.sendMessage(user.id, otherId as string, text);
    } catch (error) {
      console.error(error);
      setInputText(text);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMine = item.sender_id === user?.id;
    return (
      <View style={[styles.messageRow, isMine ? styles.mineRow : styles.otherRow]}>
        <View style={[styles.bubble, isMine ? styles.mineBubble : styles.otherBubble]}>
          <Text style={[styles.messageText, isMine ? styles.mineText : styles.otherText]}>
            {item.content}
          </Text>
          <Text style={[styles.timeText, isMine ? styles.mineTime : styles.otherTime]}>
            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  if (loading && messages.length === 0) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.blue} /></View>;
  }

  return (
    <View style={CommonStyles.screenBg}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backEmoji}>⬅️</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{otherUser?.full_name || 'Loading...'}</Text>
          <Text style={styles.headerStatus}>Active Now</Text>
        </View>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        <View style={styles.inputArea}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]} 
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Text style={styles.sendEmoji}>🚀</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: { marginRight: 15 },
  backEmoji: { fontSize: 22 },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 18, fontFamily: Typography.bold, color: Colors.text },
  headerStatus: { fontSize: 12, color: Colors.green, fontFamily: Typography.medium },
  messageList: { padding: 20, paddingBottom: 10 },
  messageRow: { marginBottom: 15, flexDirection: 'row' },
  mineRow: { justifyContent: 'flex-end' },
  otherRow: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 20,
  },
  mineBubble: {
    backgroundColor: Colors.blue,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  messageText: { fontSize: 15, fontFamily: Typography.medium },
  mineText: { color: Colors.white },
  otherText: { color: Colors.text },
  timeText: { fontSize: 10, marginTop: 4, opacity: 0.7 },
  mineTime: { color: Colors.white, textAlign: 'right' },
  otherTime: { color: Colors.textSecondary },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 15,
    paddingTop: 10,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.bg,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    paddingTop: 10,
    fontSize: 15,
    maxHeight: 100,
    fontFamily: Typography.medium,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendEmoji: { fontSize: 20 },
});
