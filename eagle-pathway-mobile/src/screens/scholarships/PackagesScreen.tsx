import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { Button } from '@/components/common';
import { PACKAGE_PRICING, formatEtb } from '@/constants/packages';
import type { PackageTier } from '@/types';

export function PackagesScreen() {
  const { scholarshipId } = useLocalSearchParams<{ scholarshipId: string }>();

  const packages = [
    {
      tier: 'basic' as PackageTier, name: 'Basic Assistance', priceETB: formatEtb(PACKAGE_PRICING.basic.etb), priceUSD: String(PACKAGE_PRICING.basic.usd),
      description: 'Ideal for self-starters who need a roadmap and initial review.',
      features: ['University shortlist (3 options)', 'Application checklist', 'Document review (1 round)', '1 consultation call (45 min)'],
      excluded: ['SOP writing support', 'Visa preparation', 'Post-offer support'],
      featured: false,
    },
    {
      tier: 'standard' as PackageTier, name: 'Standard Full-Cycle', priceETB: formatEtb(PACKAGE_PRICING.standard.etb), priceUSD: String(PACKAGE_PRICING.standard.usd),
      description: 'Comprehensive guidance for students wanting maximum success.',
      features: ['Everything in Basic', 'SOP writing + 3 editing rounds', 'Full document review', '3 consultation calls', 'Application management'],
      excluded: ['Visa preparation'],
      featured: true,
    },
    {
      tier: 'premium' as PackageTier, name: 'Premium Elite', priceETB: formatEtb(PACKAGE_PRICING.premium.etb), priceUSD: String(PACKAGE_PRICING.premium.usd),
      description: 'The white-glove service. We handle every detail for you.',
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
        <Text style={pkgStyles.intro}>Our consultants guide you through every step of your application. Choose the support level that fits your goals.</Text>
        
        <View style={pkgStyles.currencyToggle}>
          <Text style={pkgStyles.currencyLabel}>Prices in ETB and USD (Diaspora)</Text>
        </View>

        {packages.map(pkg => (
          <View key={pkg.tier} style={[pkgStyles.card, pkg.featured && pkgStyles.cardFeatured]}>
            <View style={pkgStyles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={pkgStyles.pkgName}>{pkg.name}</Text>
                <Text style={[pkgStyles.pkgDesc, pkg.featured && { color: Colors.goldDark }]}>{pkg.description}</Text>
              </View>
              {pkg.featured && <View style={pkgStyles.recommendedBadge}><Text style={pkgStyles.recommendedText}>Most Popular</Text></View>}
            </View>

            <View style={pkgStyles.priceContainer}>
              <View>
                <Text style={pkgStyles.pkgPrice}>ETB {pkg.priceETB}</Text>
                <Text style={pkgStyles.pkgPriceUSD}>≈ ${pkg.priceUSD} USD</Text>
              </View>
              <View style={pkgStyles.oneTimeBadge}>
                <Text style={pkgStyles.oneTimeText}>One-time fee</Text>
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
              style={{ marginTop: Spacing.xl }}
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
  currencyToggle: { marginBottom: Spacing.md },
  currencyLabel: { fontSize: Typography.xs, fontWeight: Typography.bold, color: Colors.blue, textTransform: 'uppercase' },
  card: { backgroundColor: Colors.card, borderRadius: Radius['2xl'], padding: Spacing.xl, borderWidth: 1.5, borderColor: Colors.border },
  cardFeatured: { borderColor: Colors.gold, backgroundColor: '#fffdf5' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md },
  recommendedBadge: { backgroundColor: Colors.gold, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.lg, height: 26 },
  recommendedText: { fontSize: 10, fontWeight: Typography.bold, color: Colors.white },
  pkgName: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.text, marginBottom: 4 },
  pkgDesc: { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 18 },
  priceContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: Spacing.md, marginBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  pkgPrice: { fontSize: 28, fontWeight: Typography.bold, color: Colors.text },
  pkgPriceUSD: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.medium },
  oneTimeBadge: { backgroundColor: Colors.blueLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.lg },
  oneTimeText: { fontSize: 10, fontWeight: Typography.bold, color: Colors.blue },
  featureList: { gap: Spacing.sm },
  featureRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  featureIconCircle: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  featureText: { fontSize: Typography.base, color: Colors.text, flex: 1 },
});
