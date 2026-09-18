import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { Button } from '@/components/common';
import type { PackageTier } from '@/types';

export function PackagesScreen() {
  const { scholarshipId } = useLocalSearchParams<{ scholarshipId: string }>();

  const packages = [
    {
      tier: 'basic' as PackageTier,
      name: 'Basic Assistance',
      tagline: 'Essential Roadmap & Review',
      description: 'Ideal for self-starters who need a clear roadmap and professional initial review.',
      features: ['University shortlist (3 options)', 'Application checklist', 'Document review (1 round)', '1 consultation call (45 min)'],
      excluded: ['SOP writing support', 'Visa preparation', 'Post-offer support'],
      featured: false,
    },
    {
      tier: 'standard' as PackageTier,
      name: 'Standard Full-Cycle',
      tagline: 'Comprehensive Support',
      description: 'Complete end-to-end guidance for students aiming for maximum admission success.',
      features: ['Everything in Basic', 'SOP writing + 3 editing rounds', 'Full document review', '3 consultation calls', 'Application management'],
      excluded: ['Visa preparation'],
      featured: true,
    },
    {
      tier: 'premium' as PackageTier,
      name: 'Premium Elite',
      tagline: 'VIP White-Glove Service',
      description: 'Dedicated mentorship where our senior consultants handle and polish every detail.',
      features: ['Everything in Standard', 'Visa application guidance', 'Interview preparation (Mock)', 'Scholarship essay support', 'Pre-departure orientation'],
      excluded: [],
      featured: false,
    },
  ];

  return (
    <SafeAreaView style={CommonStyles.screenBg} edges={['top', 'bottom']}>
      <View style={pkgStyles.header}>
        <TouchableOpacity style={pkgStyles.backBtn} onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={{ fontSize: 20, color: Colors.text }}>←</Text>
        </TouchableOpacity>
        <Text style={pkgStyles.title}>Select Package</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: Spacing.xl, paddingBottom: 120, gap: Spacing.lg }}>
        <Text style={pkgStyles.intro}>Our consultants guide you through every step of your application. Choose the support tier that matches your goals.</Text>

        {packages.map(pkg => (
          <View key={pkg.tier} style={[pkgStyles.card, pkg.featured && pkgStyles.cardFeatured]}>
            <View style={pkgStyles.cardHeader}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' }}>
                  <Text style={pkgStyles.pkgName}>{pkg.name}</Text>
                  {pkg.featured && (
                    <View style={pkgStyles.recommendedBadge}>
                      <Text style={pkgStyles.recommendedText}>Most Popular</Text>
                    </View>
                  )}
                </View>
                <Text style={pkgStyles.pkgTagline}>{pkg.tagline}</Text>
                <Text style={[pkgStyles.pkgDesc, pkg.featured && { color: Colors.goldDark }]}>{pkg.description}</Text>
              </View>
            </View>

            <View style={pkgStyles.featureList}>
              {pkg.features.map(f => (
                <View key={f} style={pkgStyles.featureRow}>
                  <View style={[pkgStyles.featureIconCircle, { backgroundColor: Colors.blueLight }]}>
                    <Text style={{ color: Colors.blue, fontSize: 10, fontWeight: 'bold' }}>✓</Text>
                  </View>
                  <Text style={pkgStyles.featureText}>{f}</Text>
                </View>
              ))}
              {pkg.excluded.map(f => (
                <View key={f} style={pkgStyles.featureRow}>
                  <View style={[pkgStyles.featureIconCircle, { backgroundColor: Colors.grayLight }]}>
                    <Text style={{ color: Colors.textSecondary, fontSize: 10 }}>×</Text>
                  </View>
                  <Text style={[pkgStyles.featureText, { color: Colors.textSecondary }]}>{f}</Text>
                </View>
              ))}
            </View>

            <Button
              title={pkg.featured ? `Continue with ${pkg.name}` : `Choose ${pkg.name}`}
              variant={pkg.featured ? 'primary' : 'outline'}
              onPress={() => router.push({ pathname: '/apply', params: { scholarshipId, packageTier: pkg.tier } })}
              style={{ marginTop: Spacing.lg }}
              fullWidth
            />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const pkgStyles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.xl, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 36, height: 36, backgroundColor: Colors.grayLight, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: Typography['3xl'], fontWeight: Typography.bold, color: Colors.text },
  intro: { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.xs },
  card: { backgroundColor: Colors.card, borderRadius: Radius['2xl'], padding: Spacing.xl, borderWidth: 1.5, borderColor: Colors.border },
  cardFeatured: { borderColor: Colors.gold, backgroundColor: '#fffdf5' },
  cardHeader: { marginBottom: Spacing.md },
  recommendedBadge: { backgroundColor: Colors.gold, paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.lg },
  recommendedText: { fontSize: 10, fontWeight: Typography.bold, color: Colors.white },
  pkgName: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.text },
  pkgTagline: { fontSize: Typography.xs, fontWeight: Typography.semibold, color: Colors.blue, marginTop: 2, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  pkgDesc: { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 18, marginTop: 2 },
  featureList: { gap: Spacing.sm, marginTop: Spacing.xs, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  featureRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  featureIconCircle: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  featureText: { fontSize: Typography.base, color: Colors.text, flex: 1 },
});
