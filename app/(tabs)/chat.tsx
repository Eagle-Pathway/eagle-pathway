import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useAuthStore } from '../../src/store/authStore';
import { supabase } from '../../src/services/supabase';
import { Colors, Typography, CommonStyles } from '../../src/utils/theme';
import { router } from 'expo-router';

interface ChatPreview {
  id: string;
  other_user_id: string;
  other_user_name: string;
  last_message: string;
  unread_count: number;
  updated_at: string;
}

export default function ChatListScreen() {
  const { user } = useAuthStore();
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchChats();
    const subscription = supabase
      .channel('chat_list_updates')
      .on('postgres_changes', { event: '*', table: 'messages' }, () => {
        fetchChats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchChats = async () => {
    if (!user) return;
    
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*, sender:users!messages_sender_id_fkey(id, full_name), recipient:users!messages_recipient_id_fkey(id, full_name)')
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) return;

    const chatMap = new Map<string, ChatPreview>();
    
    messages.forEach((msg: any) => {
      const otherUser = msg.sender_id === user.id ? msg.recipient : msg.sender;
      if (!otherUser) return;
      
      if (!chatMap.has(otherUser.id)) {
        chatMap.set(otherUser.id, {
          id: msg.id,
          other_user_id: otherUser.id,
          other_user_name: otherUser.full_name,
          last_message: msg.content,
          unread_count: (msg.recipient_id === user.id && !msg.is_read) ? 1 : 0,
          updated_at: msg.created_at,
        });
      } else {
        if (msg.recipient_id === user.id && !msg.is_read) {
          const current = chatMap.get(otherUser.id)!;
          current.unread_count += 1;
        }
      }
    });

    setChats(Array.from(chatMap.values()));
  };

  const renderItem = ({ item }: { item: ChatPreview }) => (
    <TouchableOpacity 
      style={styles.chatCard}
      onPress={() => router.push(`/chat/${item.other_user_id}`)}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.other_user_name.charAt(0)}</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>{item.other_user_name}</Text>
          <Text style={styles.time}>{new Date(item.updated_at).toLocaleDateString()}</Text>
        </View>
        <Text style={styles.lastMessage} numberOfLines={1}>{item.last_message}</Text>
      </View>
      {item.unread_count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.unread_count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={CommonStyles.screenBg}>
      <View style={styles.topHeader}>
        <Text style={styles.title}>Messages</Text>
      </View>
      
      {chats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>💬</Text>
          <Text style={styles.emptyText}>No messages yet.</Text>
          <Text style={styles.emptySubtext}>Contact your assigned consultant to start a conversation.</Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          renderItem={renderItem}
          keyExtractor={(item) => item.other_user_id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchChats().finally(() => setRefreshing(false)); }} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  topHeader: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: Colors.white,
  },
  title: {
    fontSize: 28,
    fontFamily: Typography.bold,
    color: Colors.text,
  },
  list: { padding: 20 },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.blueLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontFamily: Typography.bold,
    color: Colors.blue,
  },
  content: {
    flex: 1,
    marginLeft: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontFamily: Typography.semibold,
    color: Colors.text,
    flex: 1,
  },
  time: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  lastMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  badge: {
    backgroundColor: Colors.blue,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 12,
    fontFamily: Typography.bold,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.5,
  },
  emptyEmoji: { fontSize: 60, marginBottom: 20 },
  emptyText: { fontSize: 18, fontFamily: Typography.bold, color: Colors.text },
  emptySubtext: { fontSize: 14, color: Colors.textSecondary, marginTop: 5, textAlign: 'center', paddingHorizontal: 40 },
});
