import React from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, CommonStyles } from '@/utils/theme';
import { Avatar, SectionTitle, EmptyState, Skeleton, ScaleBounce } from '@/components/common';
import { User, Application, Booking } from '@/types';
import { getFlagEmoji } from '@eagle-pathway/shared';

interface ParentHomeProps {
  user: User;
  firstName: string;
  greeting: string;
  initials: string;
  unreadCount: number;
  refreshing: boolean;
  onRefresh: () => Promise<void>;
  linkedStudents: User[];
  linkedStudentApplications: Record<string, Application[]>;
  linkedStudentBookings: Record<string, Booking[]>;
  loading?: boolean;
}

export const ParentHome: React.FC<ParentHomeProps> = ({
  firstName,
  greeting,
  initials,
  unreadCount,
  refreshing,
  onRefresh,
  linkedStudents,
  linkedStudentApplications,
  linkedStudentBookings,
  loading,
}) => {
  if (loading) {
    return (
      <SafeAreaView style={CommonStyles.screenBg} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          <View style={styles.hero}>
            <View style={styles.heroTop}>
              <View>
                <Text style={styles.greeting}>{greeting} 👨‍👩‍👧</Text>
                <Text style={styles.userName}>{firstName}</Text>
              </View>
              <View style={styles.heroActions}>
                <TouchableOpacity style={styles.notifBtn} activeOpacity={0.8}>
                  <Ionicons name="notifications-outline" size={18} color={Colors.white} />
                </TouchableOpacity>
                <Avatar initials={initials} size={38} borderRadius={11} />
              </View>
            </View>
          </View>

          {/* Children List Skeletons */}
          <SectionTitle title="My Children" />
          <View style={{ paddingHorizontal: Spacing.xl, gap: Spacing.sm }}>
            {[1].map(i => (
              <View key={i} style={[styles.sessionCard, { marginHorizontal: 0 }]}>
                <Skeleton width={44} height={44} borderRadius={22} />
                <View style={{ flex: 1, marginLeft: Spacing.md, gap: 6 }}>
                  <Skeleton width="60%" height={16} />
                  <Skeleton width="40%" height={12} />
                </View>
                <Skeleton width={60} height={20} borderRadius={8} />
              </View>
            ))}
          </View>

          {/* Recent Activity Skeletons */}
          <SectionTitle title="Recent Activity" />
          <View style={{ paddingHorizontal: Spacing.xl, gap: Spacing.sm }}>
            {[1, 2].map(i => (
              <View key={i} style={[styles.sessionCard, { marginHorizontal: 0 }]}>
                <Skeleton width={40} height={40} borderRadius={8} />
                <View style={{ flex: 1, marginLeft: Spacing.md, gap: 6 }}>
                  <Skeleton width="80%" height={14} />
                  <Skeleton width="50%" height={10} />
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const children = linkedStudents || [];
  const hasNoChildren = children.length === 0;

  return (
    <SafeAreaView style={CommonStyles.screenBg} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.white} />}>
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.greeting}>{greeting} 👨‍👩‍👧</Text>
              <Text style={styles.userName}>{firstName}</Text>
            </View>
            <View style={styles.heroActions}>
              <TouchableOpacity style={styles.notifBtn} onPress={() => router.push('/notifications')} activeOpacity={0.8}>
                 <Ionicons name="notifications-outline" size={18} color={Colors.white} />
                 {unreadCount > 0 && <View style={styles.notifDot}><Text style={styles.notifCount}>{unreadCount}</Text></View>}
              </TouchableOpacity>
              <Avatar initials={initials} size={38} borderRadius={11} />
            </View>
          </View>
        </View>

        {hasNoChildren ? (
          <View style={[CommonStyles.flex1, { padding: Spacing['4xl'] }]}>
            <EmptyState
              icon="people-outline"
              title="No linked students"
              subtitle="Link your child's account to track their scholarship applications and progress."
              actionLabel="How It Works"
              onAction={() => Alert.alert('Link Student', 'Ask your child to go to Profile → Link Parent and enter your phone number.')}
            />
          </View>
        ) : (
          <>
            <SectionTitle title="My Children" />
            {children.map(child => {
              const childApps = linkedStudentApplications[child.id] || [];
              const childBookings = linkedStudentBookings[child.id] || [];
              const activeApps = childApps.filter(a => !['accepted', 'rejected'].includes(a.status));
              const upcomingSessions = childBookings.filter(b => ['pending', 'confirmed'].includes(b.status));
              
              return (
                <ScaleBounce 
                  key={child.id} 
                  style={styles.sessionCard}
                  onPress={() => router.push({ pathname: '/children-sessions', params: { studentId: child.id, studentName: child.full_name } })}
                >
                  <Avatar 
                    initials={child.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'S'} 
                    size={44} 
                    color={Colors.gold} 
                  />
                  <View style={{ flex: 1, marginLeft: Spacing.md }}>
                    <Text style={styles.sessionName}>{child.full_name}</Text>
                    <Text style={styles.sessionSub}>
                      {activeApps.length} applications · {upcomingSessions.length} sessions
                    </Text>
                  </View>
                  <View style={styles.sessionTime}>
                    <Text style={styles.sessionTypeBadge}>View</Text>
                  </View>
                </ScaleBounce>
              );
            })}

            <SectionTitle title="Recent Activity" />
            {(() => {
              const recentApps = (Object.values(linkedStudentApplications).flat() as Application[]).slice(0, 3);
              if (recentApps.length === 0) {
                return (
                  <View style={styles.emptyActivityCard}>
                    <Ionicons name="time-outline" size={22} color={Colors.textSecondary} />
                    <Text style={styles.emptyActivityText}>No recent activity</Text>
                  </View>
                );
              }
              return recentApps.map(app => (
                <ScaleBounce 
                  key={app.id} 
                  style={styles.sessionCard}
                  onPress={() => router.push('/progress')}
                >
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border, padding: 4 }}>
                    {(() => {
                      const flag = getFlagEmoji(app.scholarship?.country_flag);
                      const isWord = /[a-zA-Z]/.test(flag);
                      return (
                        <Text 
                          numberOfLines={1} 
                          adjustsFontSizeToFit 
                          minimumFontScale={0.5} 
                          style={{ 
                            fontSize: isWord ? 9 : 22, 
                            fontWeight: isWord ? 'bold' : 'normal', 
                            textAlign: 'center', 
                            color: Colors.text 
                          }}
                        >
                          {flag}
                        </Text>
                      );
                    })()}
                  </View>
                  <View style={{ flex: 1, marginLeft: Spacing.md }}>
                    <Text style={styles.sessionName}>{app.scholarship?.name}</Text>
                    <Text style={styles.sessionSub}>{app.status.replace(/_/g, ' ').toUpperCase()}</Text>
                  </View>
                </ScaleBounce>
              ));
            })()}
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  hero: {
    backgroundColor: Colors.blueDark,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing['2xl'],
    overflow: 'hidden',
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  greeting: { fontSize: Typography.base, color: 'rgba(255,255,255,0.6)' },
  userName: { fontSize: Typography['4xl'], fontWeight: Typography.bold, color: Colors.white, marginTop: 2 },
  heroActions: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  notifBtn: {
    width: 38, height: 38,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  notifIcon: { fontSize: 18 },
  notifDot: {
    position: 'absolute', top: 6, right: 6,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: Colors.gold,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.blueDark,
  },
  notifCount: { fontSize: 8, color: Colors.white, fontWeight: Typography.bold },
  sessionCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sessionName: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.text },
  sessionSub: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  sessionTime: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: Colors.blueLight, borderRadius: 10 },
  sessionTypeBadge: { fontSize: 12, fontWeight: Typography.bold, color: Colors.blue },
  emptyActivityCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyActivityText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
});
