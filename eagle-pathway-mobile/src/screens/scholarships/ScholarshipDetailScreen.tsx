import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { format } from 'date-fns';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { Button, EmptyState } from '@/components/common';
import { DetailSkeleton } from '@/components/LoadingSkeleton';
import { scholarshipsService } from '@/services/scholarships';
import { useAppStore } from '@/store/appStore';
import type { Scholarship } from '@/types';

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
          onPress={() => Linking.openURL(part)}
        >
          {part}
        </Text>
      );
    }
    return part;
  });
};

export function ScholarshipDetailScreen() {
  const { scholarshipId } = useLocalSearchParams<{ scholarshipId: string }>();
  const { savedScholarshipIds, toggleSaveScholarship } = useAppStore();
  const [scholarship, setScholarship] = useState<Scholarship | null>(null);
  const [loading, setLoading] = useState(true);
  const isSaved = scholarshipId ? savedScholarshipIds.includes(scholarshipId) : false;

  useEffect(() => {
    if (scholarshipId) {
      setLoading(true);
      scholarshipsService.getScholarshipById(scholarshipId)
        .then(setScholarship)
        .catch(err => {
          console.error('Failed to load scholarship:', err);
          Alert.alert('Error', 'Failed to load scholarship details. Please check your connection.');
        })
        .finally(() => setLoading(false));
    }
  }, [scholarshipId]);

  if (loading) return (
    <SafeAreaView style={[CommonStyles.flex1, { backgroundColor: Colors.blueDark }]} edges={['top']}>
      <DetailSkeleton type="scholarship" />
    </SafeAreaView>
  );
  if (!scholarship) {
    return (
      <SafeAreaView style={CommonStyles.screenBg} edges={['top']}>
        <EmptyState 
          icon="❌" 
          title="Scholarship not found" 
          subtitle="This scholarship may have been removed."
          actionLabel="Go Back"
          onAction={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[CommonStyles.flex1, { backgroundColor: Colors.blueDark }]} edges={['top']}>
      <View style={sdStyles.hero}>
        <View style={sdStyles.heroNav}>
          <TouchableOpacity style={sdStyles.backBtn} onPress={() => router.back()} activeOpacity={0.8}><Text style={{ color: Colors.white, fontSize: 20 }}>←</Text></TouchableOpacity>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <TouchableOpacity style={sdStyles.iconBtn} activeOpacity={0.8}><Text style={{ fontSize: 16 }}>↗</Text></TouchableOpacity>
            <TouchableOpacity style={sdStyles.iconBtn} onPress={() => toggleSaveScholarship(scholarship.id)} activeOpacity={0.8}>
              <Text style={{ fontSize: 16 }}>{isSaved ? '🔖' : '🏷️'}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={sdStyles.flag}>{scholarship.country_flag}</Text>
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
          <View style={sdStyles.section}>
            <Text style={sdStyles.sectionTitle}>About This Scholarship</Text>
            <Text style={sdStyles.bodyText}>{renderLinkedText(scholarship.description)}</Text>
          </View>

          {scholarship.website_url && (
            <View style={sdStyles.section}>
              <Text style={sdStyles.sectionTitle}>Official Website</Text>
              <TouchableOpacity 
                style={sdStyles.linkButton} 
                onPress={() => Linking.openURL(scholarship.website_url!)}
                activeOpacity={0.7}
              >
                <Text style={sdStyles.linkButtonText}>🌐 Open Official Link</Text>
              </TouchableOpacity>
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
          
          <View style={[sdStyles.section, { backgroundColor: Colors.blueDark, margin: Spacing.md, borderRadius: Radius.xl, borderBottomWidth: 0 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Text style={{ fontSize: 24 }}>✨</Text>
              <Text style={[sdStyles.sectionTitle, { color: Colors.gold, marginBottom: 0 }]}>Eagle AI Assistant</Text>
            </View>
            <Text style={[sdStyles.bodyText, { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 16 }]}>
              Stop struggling with your essay. We'll use your academic profile to draft a winning Statement of Purpose for this scholarship in seconds.
            </Text>
            <TouchableOpacity 
              style={{ backgroundColor: Colors.gold, padding: 14, borderRadius: 12, alignItems: 'center' }}
              onPress={() => router.push({ pathname: '/scholarship/magic-draft', params: { scholarshipId: scholarship.id } })}
              activeOpacity={0.8}
            >
              <Text style={{ color: Colors.blueDark, fontWeight: 'bold', fontSize: 15 }}>Generate Magic Draft ✨</Text>
            </TouchableOpacity>
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

      <View style={sdStyles.bottomBar}>
        <Button title="View Packages" variant="outline" onPress={() => router.push({ pathname: '/packages', params: { scholarshipId: scholarship.id } })} style={{ flex: 1 }} fullWidth={false} />
        <Button title="Apply with Eagle Pathway" variant="primary" onPress={() => router.push({ pathname: '/packages', params: { scholarshipId: scholarship.id } })} style={{ flex: 1 }} fullWidth={false} />
      </View>
    </SafeAreaView>
  );
}

const sdStyles = StyleSheet.create({
  hero: { backgroundColor: Colors.blueDark, padding: Spacing.xl, paddingBottom: Spacing['3xl'] },
  heroNav: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md },
  backBtn: { width: 36, height: 36, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  iconBtn: { width: 36, height: 36, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
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
  reqItem: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.sm, alignItems: 'flex-start' },
  checkBox: { width: 18, height: 18, borderRadius: 5, backgroundColor: Colors.greenLight, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  reqText: { fontSize: Typography.md, color: Colors.text, flex: 1 },
  successBox: { backgroundColor: Colors.goldLight, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: '#e8d5a0' },
  successNum: { fontSize: Typography['5xl'], fontWeight: Typography.bold, color: '#7a5c1e', marginBottom: 4 },
  successText: { fontSize: Typography.base, color: '#9a7230', lineHeight: 20 },
  bottomBar: { padding: Spacing.lg, backgroundColor: Colors.card, borderTopWidth: 1, borderTopColor: Colors.border, flexDirection: 'row', gap: Spacing.sm },
  linkButton: { backgroundColor: Colors.blueLight, padding: Spacing.md, borderRadius: Radius.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.blue, marginBottom: Spacing.xs },
  linkButtonText: { color: Colors.blue, fontWeight: 'bold', fontSize: Typography.md },
  linkSubtext: { fontSize: Typography.xs, color: Colors.textSecondary, fontStyle: 'italic' },
});
