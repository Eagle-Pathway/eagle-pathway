import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { format } from 'date-fns';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { Button, Pill, StatusTimeline, ScaleBounce } from '@/components/common';
import { CardSkeleton } from '@/components/LoadingSkeleton';
import { EmptyState, ErrorState } from '@/components/common';
import { useAuthStore } from '@/store/authStore';
import { useScholarshipStore } from '@/store/scholarshipStore';
import type { Application } from '@/types';
import { getFlagEmoji } from '@eagle-pathway/shared';
import { Ionicons } from '@expo/vector-icons';

import { withTimeout } from '@/utils/asyncUtils';

const AuthenticationTracker = ({ isPremium }: { isPremium: boolean }) => (
  <View style={[CommonStyles.card, { marginTop: Spacing.xl, marginHorizontal: Spacing.xl }]}>
    <Text style={{ fontSize: Typography.base, fontWeight: 'bold', marginBottom: Spacing.sm, color: Colors.text }}>
      Legal Authentication Tracker
    </Text>
    <Text style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: Spacing.md, lineHeight: 18 }}>
      Track your document authentication via the Ministry of Education (MoE) and Ministry of Foreign Affairs (MoFA).
    </Text>
    
    <View style={{ gap: Spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
        <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.green }} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: 'bold' }}>MoE Academic Verification</Text>
          <Text style={{ fontSize: 12, color: Colors.textSecondary }}>Authenticated</Text>
        </View>
        <Text style={{ fontSize: 10, color: Colors.green, fontWeight: 'bold' }}>DONE</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
        <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.gold }} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: 'bold' }}>MoFA Stamp & Seal</Text>
          <Text style={{ fontSize: 12, color: Colors.textSecondary }}>Waiting for embassy appointment</Text>
        </View>
        <Text style={{ fontSize: 10, color: Colors.gold, fontWeight: 'bold' }}>PENDING</Text>
      </View>
    </View>

    {isPremium && (
      <View style={{ marginTop: Spacing.lg, padding: Spacing.md, backgroundColor: '#f0f9ff', borderRadius: Radius.md, borderLeftWidth: 4, borderLeftColor: Colors.blue, flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
        <Ionicons name="bulb-outline" size={14} color={Colors.gold} style={{ marginTop: 2 }} />
        <Text style={{ flex: 1, fontSize: 12, fontStyle: 'italic', color: '#0369a1' }}>
          Premium Feature: Our courier team is managing this queue for you automatically at the ministry.
        </Text>
      </View>
    )}
  </View>
);

export function TrackerScreen({ hideHeader = false }: { hideHeader?: boolean }) {
  const { user } = useAuthStore();
  const { applicationId } = useLocalSearchParams<{ applicationId: string }>();
  const { applications, loadApplications } = useScholarshipStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(false);
    try { await withTimeout(loadApplications(user.id), 3500); } catch { setError(true); } finally { setLoading(false); }
  }, [user?.id, loadApplications]);

  useEffect(() => { load(); }, [user?.id]);

  useEffect(() => {
    if (!loading && applicationId && (applications || []).length > 0) {
      const found = (applications || []).find(a => a.id === applicationId);
      if (found) setSelectedApp(found);
    }
  }, [loading, applicationId, applications]);

  const active = (applications || []).filter(a => !['accepted', 'rejected'].includes(a.status));
  const completed = (applications || []).filter(a => ['accepted', 'rejected'].includes(a.status));

  if (selectedApp) {
    return (
      <SafeAreaView style={CommonStyles.screenBg} edges={['top', 'bottom']}>
        <View style={trackerStyles.detailHeader}>
          <ScaleBounce style={trackerStyles.backBtn} onPress={() => setSelectedApp(null)}>
            <Text style={{ fontSize: 20 }}>←</Text>
          </ScaleBounce>
          <Text style={trackerStyles.detailTitle}>Application Status</Text>
        </View>
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          <View style={trackerStyles.summaryCard}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm, padding: 6, borderWidth: 1, borderColor: Colors.border }}>
              {(() => {
                const flag = getFlagEmoji(selectedApp.scholarship?.country_flag);
                const isWord = /[a-zA-Z]/.test(flag);
                return (
                  <Text 
                    numberOfLines={1} 
                    adjustsFontSizeToFit 
                    minimumFontScale={0.5} 
                    style={{ 
                      fontSize: isWord ? 12 : 38, 
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
            <Text style={trackerStyles.summaryName}>{selectedApp.scholarship?.name}</Text>
            <Text style={trackerStyles.summaryOrg}>{selectedApp.scholarship?.organization}</Text>
            <View style={trackerStyles.badgeRow}>
              <Pill label={selectedApp.package_tier.toUpperCase()} variant="gold" />
              <Pill label={selectedApp.status.replace('_', ' ').toUpperCase()} variant="blue" />
            </View>
          </View>

          <StatusTimeline currentStatus={selectedApp.status} updatedAt={selectedApp.updated_at} />

          <AuthenticationTracker isPremium={selectedApp.package_tier === 'premium'} />

          {selectedApp.ai_feedback && (
            <View style={trackerStyles.notesBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <View style={{ width: 32, height: 32, backgroundColor: Colors.blueLight, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="create-outline" size={16} color={Colors.blue} />
                </View>
                <Text style={trackerStyles.notesTitle}>AI Feedback</Text>
              </View>
              <Text style={trackerStyles.notesText}>{selectedApp.ai_feedback.feedback}</Text>
              <Text style={{ fontSize: 10, color: Colors.textSecondary, marginTop: 12, fontStyle: 'italic' }}>
                Feedback left on {format(new Date(selectedApp.updated_at), 'MMM d, h:mm a')}
              </Text>
            </View>
          )}

          {selectedApp.consultant_feedback && (
            <View style={[trackerStyles.notesBox, { backgroundColor: Colors.goldLight, borderColor: Colors.gold }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <View style={{ width: 32, height: 32, backgroundColor: Colors.white, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="chatbubble-ellipses-outline" size={16} color={Colors.goldDark} />
                </View>
                <Text style={[trackerStyles.notesTitle, { color: Colors.goldDark }]}>Consultant Feedback</Text>
              </View>
              <Text style={[trackerStyles.notesText, { color: Colors.text }]}>{selectedApp.consultant_feedback}</Text>
            </View>
          )}

          {(['documents', 'sop', 'submitted'].includes(selectedApp.status)) && (
            <View style={{ padding: Spacing.xl, paddingBottom: 0 }}>
              <View style={trackerStyles.aiActionBox}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="sparkles" size={14} color={Colors.text} />
                    <Text style={trackerStyles.aiActionTitle}>AI SOP Assistant</Text>
                  </View>
                  <Text style={trackerStyles.aiActionSub}>Get real-time feedback on your Statement of Purpose from Eagle AI.</Text>
                </View>
                <ScaleBounce 
                   style={trackerStyles.aiActionBtn} 
                   onPress={() => router.push({ 
                     pathname: '/scholarship/sop', 
                     params: { applicationId: selectedApp.id, scholarshipName: selectedApp.scholarship?.name } 
                   })}
                >
                  <Text style={trackerStyles.aiActionBtnText}>Edit & Review</Text>
                </ScaleBounce>
              </View>
            </View>
          )}

          {selectedApp.notes && (
            <View style={[trackerStyles.notesBox, { backgroundColor: Colors.grayLight, borderColor: Colors.border }]}>
              <Text style={[trackerStyles.notesTitle, { color: Colors.textSecondary }]}>Internal Reference</Text>
              <Text style={[trackerStyles.notesText, { color: Colors.textSecondary }]}>{selectedApp.notes}</Text>
            </View>
          )}

          {selectedApp.consultant && (
            <View style={{ padding: Spacing.xl }}>
              <Button 
                title="Message Consultant" 
                variant="primary" 
                onPress={() => router.push({ pathname: '/chat/[id]', params: { id: selectedApp.consultant_id!, fullName: selectedApp.consultant?.full_name || 'Consultant' } })} 
              />
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={CommonStyles.screenBg} edges={['top', 'bottom']}>
      <View style={trackerStyles.hero}>
        {!hideHeader && (
          <View style={trackerStyles.heroHeader}>
            <ScaleBounce style={trackerStyles.backBtnCircle} onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))}>
              <Text style={{ fontSize: 20, color: Colors.white }}>←</Text>
            </ScaleBounce>
          </View>
        )}
        <View style={trackerStyles.heroTop}>
          <View>
            <Text style={trackerStyles.heroLabel}>Application Tracker</Text>
            <Text style={trackerStyles.heroTitle}>Your Journey</Text>
          </View>
          <ScaleBounce style={trackerStyles.newBtn} onPress={() => router.push('/(tabs)/scholarships')}>
            <Text style={trackerStyles.newBtnText}>+ New Application</Text>
          </ScaleBounce>
        </View>
        <View style={trackerStyles.statsRow}>
          {[
            { num: active.length, lbl: 'Active' },
            { num: (applications || []).filter(a => a.status === 'submitted').length, lbl: 'Submitted' },
            { num: (applications || []).filter(a => a.status === 'accepted').length, lbl: 'Accepted' },
            { num: (applications || []).length, lbl: 'Total' },
          ].map(s => (
            <View key={s.lbl} style={trackerStyles.stat}>
              <Text style={trackerStyles.statNum}>{s.num}</Text>
              <Text style={trackerStyles.statLbl}>{s.lbl}</Text>
            </View>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, paddingTop: Spacing.lg, paddingHorizontal: Spacing.xl }}>
          <CardSkeleton count={3} />
        </View>
      ) : error && (applications || []).length === 0 ? (
        <ErrorState subtitle="We couldn't load your applications. Check your connection and retry." onRetry={load} />
      ) : (applications || []).length === 0 ? (
        <EmptyState
          icon="clipboard-outline"
          title="No applications yet"
          subtitle="Find a scholarship and start your application journey"
          actionLabel="Browse Scholarships"
          onAction={() => router.push('/(tabs)/scholarships')}
        />
      ) : (
        <ScrollView contentContainerStyle={{ padding: Spacing.xl, paddingBottom: 100 }} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.blue} />}>
          {[...active, ...completed].map(app => (
            <ScaleBounce key={app.id} style={{ marginBottom: Spacing.xl }} onPress={() => setSelectedApp(app)}>
              <View style={trackerStyles.appHeader}>
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
                <Text style={trackerStyles.appName}>{app.scholarship?.name || 'Scholarship'}</Text>
                {app.consultant && (
                  <View style={trackerStyles.consultantBtn}>
                    <Ionicons name="chatbubble-outline" size={13} color={Colors.blue} />
                  </View>
                )}
                {app.status === 'accepted' && <Pill label="ACCEPTED" variant="green" />}
              </View>

              <View style={trackerStyles.statusSection}>
                <Text style={trackerStyles.statusLabel}>Current Status</Text>
                <View style={trackerStyles.statusPills}>
                  <Pill label={app.status.replace('_', ' ').toUpperCase()} variant={app.status === 'accepted' ? 'green' : app.status === 'rejected' ? 'red' : 'blue'} />
                  <Pill label={app.package_tier.toUpperCase()} variant="gold" />
                </View>
              </View>
              <View style={trackerStyles.footerRow}>
                <Text style={trackerStyles.footerTxt}>Last update: {new Date(app.updated_at).toLocaleDateString()}</Text>
                <View style={trackerStyles.viewDetailBtn}>
                  <Text style={trackerStyles.viewDetailBtnText}>View Details</Text>
                  <Ionicons name="chevron-forward" size={12} color={Colors.white} />
                </View>
              </View>
            </ScaleBounce>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const trackerStyles = StyleSheet.create({
  hero: { backgroundColor: Colors.blueDark, padding: Spacing.xl, paddingBottom: Spacing['3xl'] },
  heroHeader: { marginBottom: Spacing.md },
  backBtnCircle: { width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  heroLabel: { fontSize: Typography.sm, fontWeight: Typography.bold, color: 'rgba(255,255,255,0.6)', letterSpacing: 1, textTransform: 'uppercase' },
  heroTitle: { fontSize: Typography['4xl'], fontWeight: Typography.bold, color: Colors.white, marginTop: 4 },
  newBtn: { backgroundColor: Colors.gold, paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.lg },
  newBtnText: { color: Colors.white, fontWeight: Typography.bold, fontSize: Typography.sm },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.sm },
  stat: { gap: 4 },
  statNum: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: Colors.white },
  statLbl: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.6)', fontWeight: Typography.medium },
  appHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, backgroundColor: Colors.card, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, borderBottomWidth: 1, borderBottomColor: Colors.border },
  appName: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.text, flex: 1 },
  appFlag: { fontSize: 24 },
  consultantBtn: { width: 32, height: 32, backgroundColor: Colors.blueLight, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  statusSection: { padding: Spacing.lg, paddingBottom: Spacing.xl, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  statusLabel: { fontSize: Typography.xs, fontWeight: Typography.bold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.md },
  statusPills: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', padding: Spacing.md, backgroundColor: Colors.grayLight, borderBottomLeftRadius: Radius.xl, borderBottomRightRadius: Radius.xl },
  footerTxt: { fontSize: 11, color: Colors.textSecondary },

  // Detail Styles
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.xl, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  detailTitle: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.text },
  backBtn: { width: 36, height: 36, backgroundColor: Colors.grayLight, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  summaryCard: { padding: Spacing.xl, alignItems: 'center', backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  summaryFlag: { fontSize: 48, marginBottom: Spacing.sm },
  summaryName: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: Colors.text, textAlign: 'center' },
  summaryOrg: { fontSize: Typography.base, color: Colors.textSecondary, marginBottom: Spacing.md },
  badgeRow: { flexDirection: 'row', gap: Spacing.sm },
  notesBox: { margin: Spacing.xl, padding: Spacing.lg, backgroundColor: Colors.goldLight, borderRadius: Radius.xl, borderWidth: 1, borderColor: '#e8d5a0' },
  notesTitle: { fontWeight: 'bold', color: '#7a5c1e', marginBottom: 8, fontSize: Typography.base },
  notesText: { fontSize: Typography.md, color: '#9a7230', lineHeight: 22 },
  aiActionBox: {
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: Spacing.md,
  },
  aiActionTitle: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.text },
  aiActionSub: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  aiActionBtn: { backgroundColor: Colors.blue, paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.lg },
  aiActionBtnText: { color: Colors.white, fontWeight: Typography.bold, fontSize: 13 },
  viewDetailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.blue,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.md,
  },
  viewDetailBtnText: {
    color: Colors.white,
    fontWeight: Typography.bold,
    fontSize: 11,
  },
});
