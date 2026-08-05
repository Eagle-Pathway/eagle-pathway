import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { Avatar, Skeleton } from '@/components/common';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/ChatStore';
import { supabase } from '@/services/supabase';

export default function ChatDetailScreen() {
  const { id, fullName: paramFullName } = useLocalSearchParams<{ id: string, fullName?: string }>();
  const otherId = id;
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { 
    activeMessages, 
    loadMessages, 
    sendMessage, 
    isLoadingMessages,
    subscribeToMessages
  } = useChatStore();
  
  const [inputText, setInputText] = useState('');
  const [chatUserFullName, setChatUserFullName] = useState(paramFullName || '');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (paramFullName) {
      setChatUserFullName(paramFullName);
    }
  }, [paramFullName]);

  useEffect(() => {
    let isMounted = true;
    const fetchTargetUser = async () => {
      if (!otherId || chatUserFullName) return;
      try {
        const { data, error } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', otherId)
          .single();
        if (!error && data && isMounted) {
          setChatUserFullName(data.full_name);
        }
      } catch (e) {
        console.error('Error fetching chat target user:', e);
      }
    };
    fetchTargetUser();
    return () => { isMounted = false; };
  }, [otherId, chatUserFullName]);

  useEffect(() => {
    if (user && otherId) {
      loadMessages(user.id, otherId);
      const unsubscribe = subscribeToMessages(user.id);
      return unsubscribe;
    }
  }, [user?.id, otherId]);

  const handleSend = async () => {
    if (!inputText.trim() || !user || !otherId) return;
    const content = inputText.trim();
    setInputText('');
    try {
      await sendMessage(user.id, otherId, content);
      flatListRef.current?.scrollToEnd({ animated: true });
    } catch (e) {
      setInputText(content);
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMine = item.sender_id === user?.id;
    return (
      <View style={[styles.messageRow, isMine ? styles.myRow : styles.theirRow]}>
        {!isMine && <Avatar initials={chatUserFullName?.charAt(0) || 'T'} size={28} style={styles.miniAvatar} color={Colors.blue} />}
        <View style={[styles.bubble, isMine ? styles.myBubble : styles.theirBubble]}>
          <Text style={[styles.messageText, isMine ? styles.myText : styles.theirText]}>
            {item.content}
          </Text>
          <Text style={[styles.timeText, isMine ? styles.myTime : styles.theirTime]}>
            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[CommonStyles.flex1, { backgroundColor: Colors.bg }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))} accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={{ fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <Avatar initials={chatUserFullName?.charAt(0) || 'T'} size={36} color={Colors.blue} />
        <View style={{ flex: 1, marginLeft: Spacing.sm }}>
          <Text style={styles.headerName}>{chatUserFullName}</Text>
          <Text style={styles.statusText}>Online</Text>
        </View>
        <TouchableOpacity 
          accessibilityRole="button" 
          accessibilityLabel="Report or Block User"
          onPress={() => {
            Alert.alert(
              "Report User",
              "Are you sure you want to report or block this user for inappropriate behavior? This action will be reviewed by our team.",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Report", onPress: () => router.back(), style: "destructive" }
              ]
            );
          }}
        >
          <Ionicons name="ellipsis-vertical" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* Chat Messages + Input in KeyboardAvoidingView */}
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {isLoadingMessages && activeMessages.length === 0 ? (
          <View style={[CommonStyles.flex1, { padding: Spacing.lg }]}>
            <View style={[styles.messageRow, styles.theirRow]}>
              <Skeleton style={[styles.miniAvatar, { width: 28, height: 28, borderRadius: 14 }]} />
              <Skeleton style={[styles.bubble, { width: 200, height: 60 }]} />
            </View>
            <View style={[styles.messageRow, styles.myRow]}>
              <Skeleton style={[styles.bubble, { width: 150, height: 50, borderBottomRightRadius: 4 }]} />
            </View>
            <View style={[styles.messageRow, styles.theirRow]}>
              <Skeleton style={[styles.miniAvatar, { width: 28, height: 28, borderRadius: 14 }]} />
              <Skeleton style={[styles.bubble, { width: 240, height: 80 }]} />
            </View>
            <View style={[styles.messageRow, styles.myRow]}>
              <Skeleton style={[styles.bubble, { width: 180, height: 60, borderBottomRightRadius: 4 }]} />
            </View>
          </View>
        ) : (
          <FlatList
            keyboardShouldPersistTaps="handled"
            ref={flatListRef}
            data={activeMessages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.listContainer}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            initialNumToRender={8} maxToRenderPerBatch={8} windowSize={5} removeClippedSubviews={true}
          />
        )}

        {/* Input area */}
        <View style={[styles.inputArea, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={Colors.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendBtn, !inputText.trim() && { opacity: 0.5 }]} 
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Text style={styles.sendIcon}>🏹</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { padding: Spacing.sm, marginRight: Spacing.xs },
  headerName: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.text },
  statusText: { fontSize: 10, color: Colors.green, fontWeight: 'bold', textTransform: 'uppercase' },
  listContainer: { padding: Spacing.lg },
  messageRow: { marginBottom: Spacing.md, flexDirection: 'row', alignItems: 'flex-end', maxWidth: '85%' },
  myRow: { alignSelf: 'flex-end' },
  theirRow: { alignSelf: 'flex-start' },
  miniAvatar: { marginRight: 8, marginBottom: 4 },
  bubble: { padding: 12, borderRadius: 20 },
  myBubble: { backgroundColor: Colors.blue, borderBottomRightRadius: 4 },
  theirBubble: { backgroundColor: Colors.white, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: Colors.border },
  messageText: { fontSize: Typography.md, lineHeight: 20 },
  myText: { color: Colors.white },
  theirText: { color: Colors.text },
  timeText: { fontSize: 9, marginTop: 4, alignSelf: 'flex-end' },
  myTime: { color: 'rgba(255,255,255,0.7)' },
  theirTime: { color: Colors.textSecondary },
  inputArea: { flexDirection: 'row', padding: Spacing.md, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border, alignItems: 'center' },
  input: { flex: 1, backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 24, paddingHorizontal: Spacing.lg, paddingVertical: 8, maxHeight: 100, fontSize: Typography.md, color: Colors.text },
  sendBtn: { marginLeft: Spacing.md, width: 44, height: 44, backgroundColor: Colors.blue, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  sendIcon: { fontSize: 18, color: Colors.white },
});
