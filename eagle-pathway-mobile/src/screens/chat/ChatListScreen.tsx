import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { Avatar, EmptyState, ErrorState, Skeleton } from '@/components/common';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '@/store/ChatStore';

import { getUserRole } from '@/utils/role';
import { withTimeout } from '@/utils/asyncUtils';

export default function ChatListScreen() {
  const { user } = useAuthStore();
  const isTutor = getUserRole(user).toLowerCase() === 'tutor';
  const { 
    conversations, 
    loadConversations, 
    isLoadingConversations, 
    subscribeToMessages 
  } = useChatStore();

  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setError(false);
    try { await withTimeout(loadConversations(user.id), 3500); } catch { setError(true); }
  }, [user?.id, loadConversations]);

  useEffect(() => {
    if (user) {
      load();
      const unsubscribe = subscribeToMessages(user.id);
      return unsubscribe;
    }
  }, [user?.id]);

  const onRefresh = () => { load(); };

  const renderItem = ({ item }: { item: any }) => {
    const initials = item.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?';
    
    return (
      <TouchableOpacity 
        style={styles.convCard} 
        onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.id, fullName: item.full_name } })}
        activeOpacity={0.7}
      >
        <Avatar initials={initials} size={50} color={item.role === 'admin' ? Colors.blue : Colors.gold} />
        <View style={styles.convInfo}>
          <View style={styles.convHeader}>
            <Text style={styles.convName}>{item.full_name}</Text>
            <Text style={styles.convTime}>
              {item.last_time ? new Date(item.last_time).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
            </Text>
          </View>
          <View style={styles.convFooter}>
            <Text style={[styles.lastMessage, item.unread_count > 0 && styles.unreadText]} numberOfLines={1}>
              {item.last_message}
            </Text>
            {item.unread_count > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>{item.unread_count}</Text>
              </View>
            )}
          </View>
          <View style={styles.roleBadge}>
             <Text style={styles.roleText}>{item.role.toUpperCase()}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={CommonStyles.screenBg} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={{ fontSize: 20, color: Colors.text }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      {isLoadingConversations && conversations.length === 0 ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: Spacing.md, paddingBottom: 100 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <View key={i} style={styles.convCard}>
              <Skeleton width={50} height={50} borderRadius={25} />
              <View style={[styles.convInfo, { gap: 6 }]}>
                <View style={[styles.convHeader, { gap: Spacing.md }]}>
                  <Skeleton width="40%" height={16} />
                  <Skeleton width="15%" height={12} />
                </View>
                <Skeleton width="70%" height={12} />
                <Skeleton width={60} height={14} borderRadius={10} style={{ marginTop: 4 }} />
              </View>
            </View>
          ))}
        </ScrollView>
      ) : error && conversations.length === 0 ? (
        <ErrorState subtitle="We couldn't load your messages. Check your connection and retry." onRetry={load} />
      ) : conversations.length === 0 ? (
        <EmptyState
          icon="chatbubbles-outline"
          title="No messages yet"
          subtitle={
            isTutor
              ? "Direct messages from students and parents will appear here when they book a session or send an inquiry."
              : "Direct messages from your consultants and tutors will appear here."
          }
          actionLabel={isTutor ? "View Tutor Jobs" : "Browse Tutors"}
          onAction={() => router.push(isTutor ? '/(tabs)/explore' : '/(tabs)/tutors')}
        />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={isLoadingConversations} onRefresh={onRefresh} tintColor={Colors.blue} />
          }
          initialNumToRender={8} maxToRenderPerBatch={8} windowSize={5} removeClippedSubviews={true}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: Spacing.md,
    padding: Spacing.xl, 
    backgroundColor: Colors.card, 
    borderBottomWidth: 1, 
    borderBottomColor: Colors.border 
  },
  headerTitle: { fontSize: Typography['3xl'], fontWeight: Typography.bold, color: Colors.text, flex: 1 },
  backBtn: { width: 36, height: 36, backgroundColor: Colors.grayLight, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  listContainer: { paddingBottom: 100 },
  convCard: { flexDirection: 'row', padding: Spacing.lg, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.grayLight, alignItems: 'center', gap: Spacing.md },
  convInfo: { flex: 1 },
  convHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  convName: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.text },
  convTime: { fontSize: Typography.xs, color: Colors.textSecondary },
  convFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lastMessage: { fontSize: Typography.sm, color: Colors.textSecondary, flex: 1, marginRight: Spacing.md },
  unreadText: { color: Colors.text, fontWeight: 'bold' },
  unreadBadge: { backgroundColor: Colors.blue, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  unreadCount: { color: Colors.white, fontSize: 10, fontWeight: 'bold' },
  roleBadge: { marginTop: 4, alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, backgroundColor: Colors.grayLight, borderRadius: Radius.full },
  roleText: { fontSize: 8, fontWeight: 'bold', color: Colors.textSecondary, letterSpacing: 0.5 },
});
