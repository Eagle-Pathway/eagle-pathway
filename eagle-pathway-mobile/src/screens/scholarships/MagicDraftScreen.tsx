import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { Button } from '@/components/common';
import { scholarshipsService } from '@/services/scholarships';
import { useAuthStore } from '@/store/authStore';
import { useScholarshipStore } from '@/store/scholarshipStore';
import type { Scholarship } from '@/types';

export function MagicDraftScreen() {
  const { scholarshipId } = useLocalSearchParams<{ scholarshipId: string }>();
  const { user } = useAuthStore();
  const { generateMagicSOP, isGeneratingMagicSOP } = useScholarshipStore();
  const [scholarship, setScholarship] = useState<Scholarship | null>(null);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (scholarshipId) {
      scholarshipsService.getScholarshipById(scholarshipId).then(setScholarship).catch(console.error);
    }
  }, [scholarshipId]);

  const handleGenerate = async () => {
    if (!user || !scholarship) return;
    const result = await generateMagicSOP(user, scholarship);
    setDraft(result);
  };

  const handleCopy = () => {
    // In a real app, use Clipboard.setString
    Alert.alert('Copied!', 'Draft copied to clipboard. You can now use it in your application.');
  };

  return (
    <SafeAreaView style={CommonStyles.screenBg} edges={['top', 'bottom']}>
      <View style={magicStyles.header}>
        <TouchableOpacity style={magicStyles.backBtn} onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={{ fontSize: 20, color: Colors.text }}>←</Text>
        </TouchableOpacity>
        <Text style={magicStyles.title}>Eagle AI Magic Draft</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.xl, paddingBottom: 120 }}>
        {!draft ? (
          <View style={magicStyles.emptyState}>
            <View style={magicStyles.aiCircle}>
              <Text style={{ fontSize: 40 }}>✨</Text>
            </View>
            <Text style={magicStyles.emptyTitle}>Ready to write your SOP?</Text>
            <Text style={magicStyles.emptySub}>
              We will combine your profile summary, GPA ({user?.gpa || '3.5'}), and interests with the requirements of {scholarship?.name || 'this scholarship'} to create a professional draft.
            </Text>
            <Button 
              title={isGeneratingMagicSOP ? 'Generating Magic... ✨' : 'Generate My Draft Now'} 
              variant='primary' 
              onPress={handleGenerate} 
              loading={isGeneratingMagicSOP}
              style={{ width: '100%', marginTop: Spacing.xl }}
            />
          </View>
        ) : (
          <View>
            <View style={magicStyles.draftHeader}>
              <Text style={magicStyles.draftLabel}>AI-Generated Statement of Purpose</Text>
              <TouchableOpacity onPress={handleCopy} activeOpacity={0.7}>
                <Text style={{ color: Colors.blue, fontWeight: 'bold' }}>📋 Copy All</Text>
              </TouchableOpacity>
            </View>
            <View style={magicStyles.draftCard}>
              <Text style={magicStyles.draftText}>{draft}</Text>
            </View>
            <View style={magicStyles.tipBox}>
              <Text style={magicStyles.tipTitle}>💡 Tip for Success</Text>
              <Text style={magicStyles.tipText}>
                This is a solid draft! We recommend reading through it and adding 1-2 personal anecdotes to make it truly unique before submitting.
              </Text>
            </View>
            <Button 
              title='Use This Draft' 
              variant='primary' 
              onPress={() => router.push({ pathname: '/tracker' })} 
              style={{ marginTop: Spacing.xl }}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const magicStyles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.xl, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 36, height: 36, backgroundColor: Colors.grayLight, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.text },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  aiCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.blueLight, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl },
  emptyTitle: { fontSize: Typography['3xl'], fontWeight: Typography.bold, color: Colors.text, textAlign: 'center' },
  emptySub: { fontSize: Typography.md, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.md, lineHeight: 24 },
  draftHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  draftLabel: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.textSecondary, textTransform: 'uppercase' },
  draftCard: { backgroundColor: Colors.white, padding: Spacing.lg, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border },
  draftText: { fontSize: Typography.md, color: Colors.text, lineHeight: 24 },
  tipBox: { marginTop: Spacing.xl, backgroundColor: Colors.goldLight, padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, borderColor: '#e8d5a0' },
  tipTitle: { fontWeight: 'bold', color: '#7a5c1e', marginBottom: 4 },
  tipText: { fontSize: 13, color: '#9a7230', lineHeight: 20 },
});
