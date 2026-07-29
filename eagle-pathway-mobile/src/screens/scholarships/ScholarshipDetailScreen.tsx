import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { format } from 'date-fns';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { Button, EmptyState, ScaleBounce } from '@/components/common';
import { DetailSkeleton } from '@/components/LoadingSkeleton';
import { scholarshipsService } from '@/services/scholarships';
import { useScholarshipStore } from '@/store/scholarshipStore';
import { useAuthStore } from '@/store/authStore';
import { analyzeEligibility } from '@/utils/eligibility';
import type { Scholarship } from '@/types';
import { getFlagEmoji } from '@eagle-pathway/shared';

// Helper to render text with clickable links
const renderLinkedText = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <Text
          key={index}
          style={{ color: Colors.blue, textDecorationLine: 'underline' }}
          onPress={() => Linking.openURL(part).catch(() => Alert.alert('Error', 'Could not open this link. Please check if you have a supported app installed.'))}
        >
          {part}
        </Text>
      );
    }
    return part;
  });
};

function sourceStatusLabel(scholarship: Scholarship) {
  if (scholarship.source_status === 'verified' && scholarship.verified_at) {
    return `Verified ${format(new Date(scholarship.verified_at), 'MMM d, yyyy')}`;
  }
  if (scholarship.source_status === 'stale') return 'Listing needs recheck';
  if (scholarship.source_status === 'broken') return 'Official link may be broken';
  return 'Not independently verified yet';
}

function sourceStatusTone(sourceStatus?: Scholarship['source_status']) {
  if (sourceStatus === 'verified') return { bg: Colors.greenLight, color: Colors.green };
  if (sourceStatus === 'broken') return { bg: Colors.redLight, color: Colors.red };
  return { bg: Colors.goldLight, color: Colors.goldDark };
}

export function ScholarshipDetailScreen() {
  const { scholarshipId } = useLocalSearchParams<{ scholarshipId: string }>();
  const { savedScholarshipIds, toggleSaveScholarship } = useScholarshipStore();
  const { user } = useAuthStore();
  const [scholarship, setScholarship] = useState<Scholarship | null>(null);
  const [loading, setLoading] = useState(true);
  const isSaved = scholarshipId ? savedScholarshipIds.includes(scholarshipId) : false;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    let isMounted = true;
    if (scholarshipId) {
      setLoading(true);
      scholarshipsService.getScholarshipById(scholarshipId)
        .then(data => {
          if (isMounted) setScholarship(data);
        })
        .catch(err => {
          if (isMounted) {
            console.error('Failed to load scholarship:', err);
            Alert.alert('Error', 'Failed to load scholarship details. Please check your connection.');
          }
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    }
    return () => { isMounted = false; };
  }, [scholarshipId]);

  if (loading) return (
    <SafeAreaView style={[CommonStyles.flex1, { backgroundColor: Colors.blueDark }]} edges={['top', 'bottom']}>
      <DetailSkeleton type="scholarship" />
    </SafeAreaView>
  );
  if (!scholarship) {
    return (
      <SafeAreaView style={CommonStyles.screenBg} edges={['top', 'bottom']}>
        <EmptyState 
          icon="close-circle-outline" 
          title="Scholarship not found" 
          subtitle="This scholarship may have been removed."
          actionLabel="Go Back"
          onAction={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))}
        />
      </SafeAreaView>
    );
  }

  const eligibility = analyzeEligibility(user, scholarship);
  const eligibilityChip = eligibility.blockers > 0
    ? { text: `${eligibility.blockers} to address`, color: Colors.red, bg: Colors.redLight }
    : eligibility.hasProfileGaps
    ? { text: 'Finish profile to check', color: Colors.goldDark, bg: Colors.goldLight }
    : { text: "You're eligible ✓", color: Colors.green, bg: Colors.greenLight };
  const sourceTone = sourceStatusTone(scholarship.source_status);

  return (
    <SafeAreaView style={[CommonStyles.flex1, { backgroundColor: Colors.blueDark }]} edges={['top', 'bottom']}>
      <View style={sdStyles.hero}>
        <View style={sdStyles.heroNav}>
          <ScaleBounce style={sdStyles.backBtn} onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))}><Text style={{ color: Colors.white, fontSize: 20 }}>←</Text></ScaleBounce>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <ScaleBounce style={sdStyles.iconBtn}><Text style={{ fontSize: 16 }}>↗</Text></ScaleBounce>
            <ScaleBounce style={sdStyles.iconBtn} onPress={() => toggleSaveScholarship(scholarship.id)}>
              <Text style={{ fontSize: 16 }}>{isSaved ? '🔖' : '🏷️'}</Text>
            </ScaleBounce>
          </View>
        </View>
        <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm, padding: 6 }}>
          {(() => {
            const flag = getFlagEmoji(scholarship.country_flag);
            const isWord = /[a-zA-Z]/.test(flag);
            return (
              <Text 
                numberOfLines={1} 
                adjustsFontSizeToFit 
                minimumFontScale={0.5} 
                style={{ 
                  fontSize: isWord ? 11 : 32, 
                  fontWeight: isWord ? 'bold' : 'normal', 
                  textAlign: 'center', 
                  color: Colors.white 
                }}
              >
                {flag}
              </Text>
            );
          })()}
        </View>
        <Text style={sdStyles.name}>{scholarship.name}</Text>
        <Text style={sdStyles.org}>{scholarship.organization}</Text>
        <View style={sdStyles.pills}>
          <View style={[sdStyles.pill, { backgroundColor: Colors.redLight }]}><Text style={[sdStyles.pillText, { color: Colors.red }]}>Deadline: {format(new Date(scholarship.deadline), 'MMM d, yyyy')}</Text></View>
          {scholarship.degree_levels.map(d => (
            <View key={d} style={[sdStyles.pill, { backgroundColor: 'rgba(255,255,255,0.12)' }]}><Text style={[sdStyles.pillText, { color: 'rgba(255,255,255,0.9)' }]}>{d.charAt(0).toUpperCase() + d.slice(1)}</Text></View>
          ))}
          <View style={[sdStyles.pill, { backgroundColor: '#d1fae5' }]}><Text style={[sdStyles.pillText, { color: '#065f46' }]}>{scholarship.funding_type === 'fully_funded' ? 'Fully Funded' : renderLinkedText(scholarship.funding_details)}</Text></View>
        </View>
      </View>

      <ScrollView style={{ backgroundColor: Colors.bg }} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={[CommonStyles.card, { marginTop: Spacing.lg }]}>
          {eligibility.total > 0 && (
            <View style={sdStyles.section}>
              <View style={sdStyles.eligHeader}>
                <Text style={sdStyles.sectionTitle}>Your Eligibility</Text>
                <View style={[sdStyles.eligChip, { backgroundColor: eligibilityChip.bg }]}>
                  <Text style={[sdStyles.eligChipText, { color: eligibilityChip.color }]}>{eligibilityChip.text}</Text>
                </View>
              </View>

              {eligibility.criteria.map(c => {
                const tone = c.status === 'met'
                  ? { icon: '✓', color: Colors.green, bg: Colors.greenLight }
                  : c.status === 'unmet'
                  ? { icon: '✕', color: Colors.red, bg: Colors.redLight }
                  : { icon: '?', color: Colors.goldDark, bg: Colors.goldLight };
                return (
                  <View key={c.key} style={sdStyles.eligRow}>
                    <View style={[sdStyles.eligIcon, { backgroundColor: tone.bg }]}>
                      <Text style={{ color: tone.color, fontSize: 12, fontWeight: 'bold' }}>{tone.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={sdStyles.eligLabel}>{c.label}</Text>
                      <Text style={sdStyles.eligDetail}>{c.detail}</Text>
                      {c.status === 'unmet' && c.action && (
                        <ScaleBounce style={sdStyles.eligCta} onPress={() => router.push(c.action!.route as any)}>
                          <Text style={sdStyles.eligCtaText}>{c.action.label} →</Text>
                        </ScaleBounce>
                      )}
                    </View>
                  </View>
                );
              })}

              {eligibility.hasProfileGaps && (
                <ScaleBounce
                  style={sdStyles.profileCta}
                  onPress={() => router.push('/profile/edit')}
                >
                  <Text style={sdStyles.profileCtaText}>Complete your profile to check eligibility →</Text>
                </ScaleBounce>
              )}
            </View>
          )}

          <View style={sdStyles.section}>
            <Text style={sdStyles.sectionTitle}>About This Scholarship</Text>
            <Text style={sdStyles.bodyText}>{renderLinkedText(scholarship.description)}</Text>
          </View>

          {scholarship.website_url && (
            <View style={sdStyles.section}>
              <Text style={sdStyles.sectionTitle}>Official Website</Text>
              <View style={[sdStyles.sourceStatus, { backgroundColor: sourceTone.bg }]}>
                <Text style={[sdStyles.sourceStatusText, { color: sourceTone.color }]}>
                  {sourceStatusLabel(scholarship)}
                </Text>
              </View>
              <ScaleBounce 
                style={sdStyles.linkButton} 
                onPress={() => Linking.openURL(scholarship.website_url!).catch(() => Alert.alert('Error', 'Could not open this link. Please check if you have a supported app installed.'))}
              >
                <Text style={sdStyles.linkButtonText}>🌐 Open Official Link</Text>
              </ScaleBounce>
              <Text style={sdStyles.linkSubtext}>Visit the university's portal for raw details and official forms.</Text>
            </View>
          )}

          <View style={sdStyles.section}>
            <Text style={sdStyles.sectionTitle}>Benefits</Text>
            {Object.entries(scholarship.benefits).map(([k, v]) => (
              <View key={k} style={sdStyles.benefitRow}>
                <Text style={sdStyles.benefitLabel}>{k}</Text>
                <Text style={sdStyles.benefitValue}>{renderLinkedText(v)}</Text>
              </View>
            ))}
          </View>
          <View style={sdStyles.section}>
            <Text style={sdStyles.sectionTitle}>Requirements</Text>
            {scholarship.requirements.map((r, i) => (
              <View key={i} style={sdStyles.reqItem}>
                <View style={sdStyles.checkBox}><Text style={{ fontSize: 10, color: Colors.green }}>✓</Text></View>
                <Text style={sdStyles.reqText}>{renderLinkedText(r)}</Text>
              </View>
            ))}
          </View>
          
          <View style={[
            sdStyles.section, 
            { 
              backgroundColor: Colors.blueDark, 
              margin: Spacing.md, 
              borderRadius: Radius.xl, 
              borderBottomWidth: 0,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
              shadowColor: Colors.gold,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.12,
              shadowRadius: 12,
              elevation: 3,
            }
          ]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Text style={{ fontSize: 24 }}>✨</Text>
              <Text style={[sdStyles.sectionTitle, { color: Colors.gold, marginBottom: 0 }]}>Eagle AI Assistant</Text>
            </View>
            <Text style={[sdStyles.bodyText, { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 16 }]}>
              Stop struggling with your essay. We'll use your academic profile to draft a winning Statement of Purpose for this scholarship in seconds.
            </Text>
            <ScaleBounce
              style={{ backgroundColor: Colors.gold, padding: 14, borderRadius: 12, alignItems: 'center' }}
              onPress={() => router.push({ pathname: '/scholarship/magic-draft', params: { scholarshipId: scholarship.id } })}
            >
              <Text style={{ color: Colors.blueDark, fontWeight: 'bold', fontSize: 15 }}>Generate Magic Draft ✨</Text>
            </ScaleBounce>
            <ScaleBounce
              style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 10 }}
              onPress={() => router.push({ pathname: '/scholarship/interview', params: { scholarshipId: scholarship.id } })}
            >
              <Text style={{ color: Colors.white, fontWeight: 'bold', fontSize: 15 }}>Practice Interview 🎤</Text>
            </ScaleBounce>
          </View>

          <View style={[sdStyles.section, { borderBottomWidth: 0 }]}>
            <ScaleBounce
              style={sdStyles.storiesBtn}
              onPress={() => router.push({ pathname: '/success-stories', params: { scholarshipName: scholarship.name } })}
            >
              <Text style={sdStyles.storiesBtnText}>🏆 Read success stories</Text>
            </ScaleBounce>
            <Text style={sdStyles.linkSubtext}>See how past Eagle Pathway students won this scholarship.</Text>
          </View>

          {scholarship.eagle_success_rate && (
            <View style={[sdStyles.section, { borderBottomWidth: 0 }]}>
              <Text style={sdStyles.sectionTitle}>Eagle Pathway Success Rate</Text>
              <View style={sdStyles.successBox}>
                <Text style={sdStyles.successNum}>{scholarship.eagle_success_rate}%</Text>
                <Text style={sdStyles.successText}>of Eagle Pathway clients who applied received offers in the last 2 years</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[sdStyles.bottomBar, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
        <Button title="View Packages" variant="outline" onPress={() => router.push({ pathname: '/packages', params: { scholarshipId: scholarship.id } })} style={{ flex: 1 }} fullWidth={false} />
        <Button title="Apply with Eagle Pathway" variant="primary" onPress={() => router.push({ pathname: '/packages', params: { scholarshipId: scholarship.id } })} style={{ flex: 1 }} fullWidth={false} />
      </View>
    </SafeAreaView>
  );
}

const sdStyles = StyleSheet.create({
  hero: { 
    backgroundColor: Colors.blueDark, 
    padding: Spacing.xl, 
    paddingBottom: Spacing['3xl'],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  heroNav: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md },
  backBtn: { 
    width: 36, 
    height: 36, 
    backgroundColor: 'rgba(255,255,255,0.12)', 
    borderRadius: 10, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  iconBtn: { 
    width: 36, 
    height: 36, 
    backgroundColor: 'rgba(255,255,255,0.12)', 
    borderRadius: 10, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  flag: { fontSize: 40, marginBottom: Spacing.sm },
  name: { fontSize: Typography['4xl'], fontWeight: Typography.bold, color: Colors.white },
  org: { fontSize: Typography.base, color: 'rgba(255,255,255,0.65)', marginTop: 4 },
  pills: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md, flexWrap: 'wrap' },
  pill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: Radius.full },
  pillText: { fontSize: Typography.sm, fontWeight: Typography.semibold },
  section: { padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  sectionTitle: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.textSecondary, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: Spacing.md },
  bodyText: { fontSize: Typography.md, color: Colors.text, lineHeight: 22 },
  benefitRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.grayLight },
  benefitLabel: { fontSize: Typography.base, color: Colors.textSecondary },
  benefitValue: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.text },
  eligHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  eligChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  eligChipText: { fontSize: Typography.xs, fontWeight: Typography.bold },
  eligRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md, alignItems: 'flex-start' },
  eligIcon: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  eligLabel: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.text },
  eligDetail: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2, lineHeight: 18 },
  eligCta: { alignSelf: 'flex-start', backgroundColor: Colors.blue, paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.md, marginTop: Spacing.sm },
  eligCtaText: { color: Colors.white, fontSize: Typography.sm, fontWeight: Typography.bold },
  profileCta: { backgroundColor: Colors.blueLight, padding: Spacing.md, borderRadius: Radius.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.blue, marginTop: Spacing.xs },
  profileCtaText: { color: Colors.blue, fontSize: Typography.sm, fontWeight: Typography.bold },
  reqItem: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.sm, alignItems: 'flex-start' },
  checkBox: { width: 18, height: 18, borderRadius: 5, backgroundColor: Colors.greenLight, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  reqText: { fontSize: Typography.md, color: Colors.text, flex: 1 },
  successBox: { backgroundColor: Colors.goldLight, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: '#e8d5a0' },
  successNum: { fontSize: Typography['5xl'], fontWeight: Typography.bold, color: '#7a5c1e', marginBottom: 4 },
  successText: { fontSize: Typography.base, color: '#9a7230', lineHeight: 20 },
  bottomBar: { padding: Spacing.lg, backgroundColor: Colors.card, borderTopWidth: 1, borderTopColor: Colors.border, flexDirection: 'row', gap: Spacing.sm },
  linkButton: { backgroundColor: Colors.blueLight, padding: Spacing.md, borderRadius: Radius.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.blue, marginBottom: Spacing.xs },
  linkButtonText: { color: Colors.blue, fontWeight: 'bold', fontSize: Typography.md },
  sourceStatus: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full, marginBottom: Spacing.sm },
  sourceStatusText: { fontSize: Typography.xs, fontWeight: Typography.bold },
  linkSubtext: { fontSize: Typography.xs, color: Colors.textSecondary, fontStyle: 'italic' },
  storiesBtn: { backgroundColor: Colors.goldLight, padding: Spacing.md, borderRadius: Radius.md, alignItems: 'center', borderWidth: 1, borderColor: '#e8d5a0', marginBottom: Spacing.xs },
  storiesBtnText: { color: '#7a5c1e', fontWeight: 'bold', fontSize: Typography.md },
});
