import React, { useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { ProgressBar } from '@/components/common';
import { useAuthStore } from '@/store/authStore';
import { useScholarshipStore } from '@/store/scholarshipStore';
import { useBookingStore } from '@/store/bookingStore';
import { useDocumentStore } from '@/store/documentStore';
import { getFlagEmoji } from '@eagle-pathway/shared';
import { computeAchievements, earnedCount } from '@/utils/achievements';

export function ProgressScreen() {
  const { user } = useAuthStore();
  const { applications, loadApplications } = useScholarshipStore();
  const { bookings, loadBookings } = useBookingStore();
  const { documents, loadDocuments } = useDocumentStore();

  useEffect(() => {
    if (user) {
      loadApplications(user.id);
      loadBookings(user.id);
      loadDocuments(user.id);
    }
  }, [user?.id]);

  const checklist = [
    { label: "Bachelor's degree completed", done: true },
    { label: 'IELTS score obtained', done: (documents || []).some(d => d.document_type === 'ielts_certificate' && d.status === 'approved') },
    { label: 'CV uploaded & approved', done: (documents || []).some(d => d.document_type === 'cv' && d.status === 'approved') },
    { label: 'SOP in progress', done: (applications || []).some(a => ['sop', 'submitted', 'accepted'].includes(a.status)), inProgress: true },
    { label: 'Reference letters uploaded', done: (documents || []).filter(d => d.document_type === 'reference_letter').length >= 2 },
    { label: 'Interview preparation', done: (applications || []).some(a => a.status === 'accepted') },
  ];

  const doneCount = (checklist || []).filter(c => c.done).length;
  const readiness = Math.round((doneCount / (checklist || []).length) * 100);

  const achievements = computeAchievements({ user, applications, documents, bookings });
  const earned = earnedCount(achievements);

  const academicJourneys = [
    { title: 'Grade 12 Preparation', sub: 'Math & Physics', progress: 80, color: Colors.green, tag: 'Active' },
    { title: 'IELTS Preparation', sub: 'English', progress: 50, color: Colors.blue, tag: 'Active' },
  ];

  return (
    <SafeAreaView style={CommonStyles.screenBg} edges={['top', 'bottom']}>
      <View style={progStyles.hero}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl }}>
          <View><Text style={progStyles.heroLabel}>Your Journey</Text><Text style={progStyles.heroTitle}>My Progress</Text></View>
          <TouchableOpacity style={progStyles.backBtn} onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel="Go back"><Text style={{ color: Colors.white, fontSize: 20 }}>←</Text></TouchableOpacity>
        </View>
        <View style={progStyles.scoreBox}>
          <Text style={progStyles.scoreLabel}>Scholarship Readiness Score</Text>
          <Text style={progStyles.scoreNum}>{readiness}<Text style={progStyles.scorePct}>%</Text></Text>
          <ProgressBar progress={readiness} color={Colors.gold} height={8} style={{ marginVertical: Spacing.md }} />
          <Text style={progStyles.scoreSub}>Complete {checklist.length - doneCount} more tasks to reach 100%</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <Text style={CommonStyles.sectionTitle}>Academic Journey</Text>
        {academicJourneys.map(j => (
          <View key={j.title} style={progStyles.journeyCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View><Text style={progStyles.journeyTitle}>{j.title}</Text><Text style={progStyles.journeySub}>{j.sub} · {bookings.filter(b => b.status === 'completed').length} sessions</Text></View>
              <View style={[progStyles.tagPill, { backgroundColor: Colors.greenLight }]}><Text style={[progStyles.tagText, { color: Colors.green }]}>{j.tag}</Text></View>
            </View>
            <ProgressBar progress={j.progress} color={j.color} height={8} style={{ marginVertical: Spacing.md }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={progStyles.journeyMeta}>Progress</Text>
              <Text style={progStyles.journeyMeta}>{j.progress}% complete</Text>
            </View>
          </View>
        ))}

        <Text style={CommonStyles.sectionTitle}>Scholarship Pipeline</Text>
        {(applications || []).length === 0 ? (
          <View style={{ paddingHorizontal: Spacing.xl }}>
            <TouchableOpacity style={progStyles.startBtn} onPress={() => router.push('/(tabs)/scholarships')} activeOpacity={0.8}>
              <Text style={progStyles.startBtnText}>+ Start Your First Application</Text>
            </TouchableOpacity>
          </View>
        ) : (
          (applications || []).map(app => (
            <View key={app.id} style={progStyles.journeyCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'center', flex: 1 }}>
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
                  <View style={{ flex: 1 }}><Text style={progStyles.journeyTitle} numberOfLines={1}>{app.scholarship?.name}</Text><Text style={progStyles.journeySub}>{app.status.replace(/_/g, ' ')}</Text></View>
                </View>
                <View style={[progStyles.tagPill, { backgroundColor: app.status === 'accepted' ? Colors.greenLight : Colors.goldLight }]}>
                  <Text style={[progStyles.tagText, { color: app.status === 'accepted' ? Colors.green : Colors.goldDark }]}>
                    {app.status === 'accepted' ? 'Accepted 🎉' : 'In Progress'}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginRight: Spacing.xl }}>
          <Text style={CommonStyles.sectionTitle}>Milestones</Text>
          <Text style={progStyles.milestoneCount}>{earned} of {achievements.length} unlocked</Text>
        </View>
        <View style={progStyles.badgeGrid}>
          {achievements.map(a => (
            <View key={a.key} style={[progStyles.badge, !a.earned && progStyles.badgeLocked]}>
              <Text style={[progStyles.badgeIcon, !a.earned && { opacity: 0.4 }]}>{a.earned ? a.icon : '🔒'}</Text>
              <Text style={[progStyles.badgeTitle, !a.earned && { color: Colors.textSecondary }]} numberOfLines={1}>{a.title}</Text>
              <Text style={progStyles.badgeDesc} numberOfLines={2}>{a.description}</Text>
            </View>
          ))}
        </View>

        <Text style={CommonStyles.sectionTitle}>Readiness Checklist</Text>
        <View style={[CommonStyles.card, { padding: Spacing.lg }]}>
          {checklist.map((item, i) => (
            <View key={i} style={progStyles.checkItem}>
              <View style={[progStyles.checkBox, { backgroundColor: item.done ? Colors.greenLight : item.inProgress ? Colors.orangeLight : Colors.redLight }]}>
                <Text style={{ fontSize: 10, color: item.done ? Colors.green : item.inProgress ? Colors.orange : Colors.red }}>
                  {item.done ? '✓' : item.inProgress ? '~' : '+'}
                </Text>
              </View>
              <Text style={[progStyles.checkLabel, !item.done && { color: item.inProgress ? Colors.orange : Colors.red }]}>{item.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const progStyles = StyleSheet.create({
  hero: { backgroundColor: Colors.blueDark, padding: Spacing.xl, paddingBottom: Spacing['2xl'] },
  heroLabel: { fontSize: Typography.base, color: 'rgba(255,255,255,0.6)' },
  heroTitle: { fontSize: Typography['4xl'], fontWeight: Typography.bold, color: Colors.white },
  backBtn: { width: 36, height: 36, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  scoreBox: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: Radius['2xl'], padding: Spacing.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  scoreLabel: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },
  scoreNum: { fontSize: 52, fontWeight: Typography.bold, color: Colors.white, textAlign: 'center', lineHeight: 60 },
  scorePct: { fontSize: Typography['3xl'], color: 'rgba(255,255,255,0.6)' },
  scoreSub: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },
  journeyCard: { marginHorizontal: Spacing.xl, marginBottom: Spacing.md, backgroundColor: Colors.card, borderRadius: Radius['2xl'], padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  journeyTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.text },
  journeySub: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  journeyMeta: { fontSize: Typography.sm, color: Colors.textSecondary },
  tagPill: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.full },
  tagText: { fontSize: Typography.sm, fontWeight: Typography.semibold },
  startBtn: { backgroundColor: Colors.blueLight, borderRadius: Radius.xl, padding: Spacing.lg, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.blue, borderStyle: 'dashed' },
  startBtnText: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.blue },
  milestoneCount: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.gold },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.xl, gap: Spacing.sm, marginBottom: Spacing.md },
  badge: { width: '31%', backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.gold + '55', alignItems: 'center' },
  badgeLocked: { borderColor: Colors.border, backgroundColor: Colors.bg },
  badgeIcon: { fontSize: 26, marginBottom: 6 },
  badgeTitle: { fontSize: Typography.xs, fontWeight: Typography.bold, color: Colors.text, textAlign: 'center' },
  badgeDesc: { fontSize: 9, color: Colors.textSecondary, textAlign: 'center', marginTop: 2, lineHeight: 12 },
  checkItem: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center', marginBottom: Spacing.md },
  checkBox: { width: 20, height: 20, borderRadius: 6, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  checkLabel: { fontSize: Typography.base, color: Colors.text, flex: 1 },
});
