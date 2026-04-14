// ─── SCHOLARSHIP DETAIL ───────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  FlatList, Alert, Switch, Linking, ActivityIndicator, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { format } from 'date-fns';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { Button, Avatar, ProgressBar, EmptyState, Pill, StatusTimeline } from '@/components/common';
import { scholarshipsService } from '@/services/scholarships';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { Scholarship, Application, PackageTier, Document, DocumentType } from '@/types';
import { openWhatsApp } from '@/utils/linking';

// ─── SCHOLARSHIP DETAIL ───────────────────────────────────────────────────────
export function ScholarshipDetailScreen() {
  const { scholarshipId } = useLocalSearchParams<{ scholarshipId: string }>();
  const { savedScholarshipIds, toggleSaveScholarship } = useAppStore();
  const [scholarship, setScholarship] = useState<Scholarship | null>(null);
  const [loading, setLoading] = useState(true);
  const isSaved = scholarshipId ? savedScholarshipIds.includes(scholarshipId) : false;

  useEffect(() => {
    if (scholarshipId) {
      scholarshipsService.getScholarshipById(scholarshipId)
        .then(setScholarship)
        .finally(() => setLoading(false));
    }
  }, [scholarshipId]);

  if (loading) return <View style={[CommonStyles.flex1, CommonStyles.center]}><ActivityIndicator color={Colors.blue} size="large" /></View>;
  if (!scholarship) return null;

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
          <View style={[sdStyles.pill, { backgroundColor: '#d1fae5' }]}><Text style={[sdStyles.pillText, { color: '#065f46' }]}>{scholarship.funding_type === 'fully_funded' ? 'Fully Funded' : scholarship.funding_details}</Text></View>
        </View>
      </View>

      <ScrollView style={{ backgroundColor: Colors.bg }} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={[CommonStyles.card, { marginTop: Spacing.lg }]}>
          <View style={sdStyles.section}><Text style={sdStyles.sectionTitle}>About This Scholarship</Text><Text style={sdStyles.bodyText}>{scholarship.description}</Text></View>
          <View style={sdStyles.section}>
            <Text style={sdStyles.sectionTitle}>Benefits</Text>
            {Object.entries(scholarship.benefits).map(([k, v]) => (
              <View key={k} style={sdStyles.benefitRow}>
                <Text style={sdStyles.benefitLabel}>{k}</Text>
                <Text style={sdStyles.benefitValue}>{v}</Text>
              </View>
            ))}
          </View>
          <View style={sdStyles.section}>
            <Text style={sdStyles.sectionTitle}>Requirements</Text>
            {scholarship.requirements.map((r, i) => (
              <View key={i} style={sdStyles.reqItem}>
                <View style={sdStyles.checkBox}><Text style={{ fontSize: 10, color: Colors.green }}>✓</Text></View>
                <Text style={sdStyles.reqText}>{r}</Text>
              </View>
            ))}
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
});

// ─── PACKAGES ────────────────────────────────────────────────────────────────
export function PackagesScreen() {
  const { scholarshipId } = useLocalSearchParams<{ scholarshipId: string }>();

  const packages = [
    {
      tier: 'basic' as PackageTier, name: 'Basic Assistance', priceETB: '10,000', priceUSD: '85',
      description: 'Ideal for self-starters who need a roadmap and initial review.',
      features: ['University shortlist (3 options)', 'Application checklist', 'Document review (1 round)', '1 consultation call (45 min)'],
      excluded: ['SOP writing support', 'Visa preparation', 'Post-offer support'],
      featured: false,
    },
    {
      tier: 'standard' as PackageTier, name: 'Standard Full-Cycle', priceETB: '28,000', priceUSD: '225',
      description: 'Comprehensive guidance for students wanting maximum success.',
      features: ['Everything in Basic', 'SOP writing + 3 editing rounds', 'Full document review', '3 consultation calls', 'Application management'],
      excluded: ['Visa preparation'],
      featured: true,
    },
    {
      tier: 'premium' as PackageTier, name: 'Premium Elite', priceETB: '55,000', priceUSD: '450',
      description: 'The white-glove service. We handle every detail for you.',
      features: ['Everything in Standard', 'Visa application guidance', 'Interview preparation (Mock)', 'Scholarship essay support', 'Pre-departure orientation'],
      excluded: [],
      featured: false,
    },
  ];

  return (
    <SafeAreaView style={CommonStyles.screenBg} edges={['top']}>
      <View style={pkgStyles.header}>
        <TouchableOpacity style={pkgStyles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Text style={{ fontSize: 20, color: Colors.text }}>←</Text>
        </TouchableOpacity>
        <Text style={pkgStyles.title}>Select Package</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: Spacing.xl, paddingBottom: 60, gap: Spacing.lg }}>
        <Text style={pkgStyles.intro}>Our consultants have a 92% success rate. Choose the support level that secures your future.</Text>
        
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

// ─── APPLICATION FORM ────────────────────────────────────────────────────────
export function ApplyScreen() {
  const { scholarshipId, packageTier } = useLocalSearchParams<{ scholarshipId: string; packageTier: PackageTier }>();
  const { user } = useAuthStore();
  const { createApplication, loadDocuments, uploadDocument, documents } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<number>(1);

  useEffect(() => { if (user) loadDocuments(user.id); }, [user?.id]);

  const STEPS = ['Info', 'Docs', 'SOP', 'Pay', 'Final'];

  const handlePickAndUpload = async (docLabel: string) => {
    // Map UI labels to database enum document_type
    const typeMap: Record<string, DocumentType> = {
      'Degree Certificate': 'degree_certificate',
      'Official Transcript': 'transcript',
      'Passport Copy': 'passport',
      'IELTS Certificate': 'ielts_certificate',
      'CV / Resume': 'cv',
      'Reference Letter 1': 'reference_letter',
      'Reference Letter 2': 'reference_letter',
    };

    const docType = typeMap[docLabel] || 'other';

    try {
      const result = await scholarshipsService.pickDocument();
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      if (!user) return;
      Alert.alert('Uploading...', 'Please wait');
      await uploadDocument({ 
        userId: user.id, 
        applicationId: undefined, 
        documentType: docType, 
        fileUri: asset.uri, 
        fileName: asset.name 
      });
      Alert.alert('Success', 'Document uploaded successfully!');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Upload failed');
    }
  };

  const handleSubmit = async () => {
    if (!user || !scholarshipId || !packageTier) return;
    setLoading(true);
    try {
      const app = await createApplication(user.id, scholarshipId, packageTier);
      Alert.alert('Application Started! 🎉', 'Your consultant has been notified and will reach out shortly.', [
        { text: 'View Tracker', onPress: () => router.push('/tracker') },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create application');
    } finally {
      setLoading(false);
    }
  };

  const requiredDocs = ['Degree Certificate', 'Official Transcript', 'Passport Copy', 'IELTS Certificate', 'CV / Resume', 'Reference Letter 1', 'Reference Letter 2'];

  return (
    <SafeAreaView style={CommonStyles.screenBg} edges={['top']}>
      <View style={applyStyles.header}>
        <TouchableOpacity style={applyStyles.backBtn} onPress={() => router.back()} activeOpacity={0.8}><Text style={{ fontSize: 20, color: Colors.text }}>←</Text></TouchableOpacity>
        <Text style={applyStyles.title}>Your Application</Text>
      </View>
      <Text style={applyStyles.subtitle}>{packageTier?.charAt(0).toUpperCase()}{packageTier?.slice(1)} Package</Text>

      {/* Step indicator */}
      <View style={applyStyles.stepsRow}>
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <View style={applyStyles.stepItem}>
              <View style={[applyStyles.stepCircle, i + 1 < step && applyStyles.stepDone, i + 1 === step && applyStyles.stepActive, i + 1 > step && applyStyles.stepInactive]}>
                {i + 1 < step
                  ? <Text style={applyStyles.stepDoneText}>✓</Text>
                  : <Text style={[applyStyles.stepNum, i + 1 === step && { color: Colors.white }]}>{i + 1}</Text>}
              </View>
              <Text style={[applyStyles.stepLabel, i + 1 === step && { color: Colors.gold }]}>{s}</Text>
            </View>
            {i < STEPS.length - 1 && <View style={[applyStyles.stepLine, i + 1 < step && { backgroundColor: Colors.blue }]} />}
          </React.Fragment>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {step === 1 && (
          <View style={{ padding: Spacing.xl }}>
            <Text style={CommonStyles.sectionTitle}>Verification: Personal Info</Text>
            <Text style={applyStyles.intro}>
              Please confirm your profile details. These will be used for your official scholarship application.
            </Text>
            
            <View style={[CommonStyles.card, { marginTop: Spacing.xl, padding: Spacing.lg }]}>
              <View style={applyStyles.infoRow}>
                <Text style={applyStyles.infoLabel}>Full Name</Text>
                <Text style={applyStyles.infoValue}>{user?.full_name}</Text>
              </View>
              <View style={applyStyles.infoRow}>
                <Text style={applyStyles.infoLabel}>Email</Text>
                <Text style={applyStyles.infoValue}>{user?.email}</Text>
              </View>
              <View style={applyStyles.infoRow}>
                <Text style={applyStyles.infoLabel}>Current Level</Text>
                <Text style={applyStyles.infoValue}>{user?.grade_level || 'Not set'}</Text>
              </View>
              <View style={applyStyles.infoRow}>
                <Text style={applyStyles.infoLabel}>City</Text>
                <Text style={applyStyles.infoValue}>{user?.city || 'Not set'}</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={{ marginTop: Spacing.lg, alignSelf: 'center' }}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <Text style={{ color: Colors.blue, fontWeight: 'bold' }}>✏️ Edit Profile Info</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <>
            <View style={applyStyles.successBanner}>
              <Text style={{ color: Colors.green, fontSize: 16 }}>✓</Text>
              <Text style={applyStyles.successText}>Personal info collected — step 1 complete!</Text>
            </View>
            <Text style={CommonStyles.sectionTitle}>Upload Your Documents</Text>
            {requiredDocs.map(doc => {
              const typeMap: Record<string, string> = {
                'Degree Certificate': 'degree_certificate',
                'Official Transcript': 'transcript',
                'Passport Copy': 'passport',
                'IELTS Certificate': 'ielts_certificate',
                'CV / Resume': 'cv',
                'Reference Letter 1': 'reference_letter',
                'Reference Letter 2': 'reference_letter',
              };
              const mappedType = typeMap[doc] || 'other';
              const uploaded = documents.some(d => d.document_type === mappedType);

              return (
                <TouchableOpacity key={doc} style={[applyStyles.docRow, !uploaded && applyStyles.docRowMissing]} onPress={() => !uploaded && handlePickAndUpload(doc)} activeOpacity={0.8}>
                  <View style={[applyStyles.docIcon, { backgroundColor: uploaded ? Colors.blueLight : Colors.orangeLight }]}>
                    <Text style={{ fontSize: 16 }}>{uploaded ? '📄' : '📎'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[applyStyles.docName, !uploaded && { color: Colors.orange }]}>{doc}</Text>
                    <Text style={[applyStyles.docMeta, !uploaded && { color: Colors.orange }]}>{uploaded ? 'Uploaded ✓' : 'Tap to upload — Required'}</Text>
                  </View>
                  {uploaded
                    ? <View style={applyStyles.checkCircle}><Text style={{ fontSize: 10, color: Colors.green }}>✓</Text></View>
                    : <View style={applyStyles.crossCircle}><Text style={{ fontSize: 10, color: Colors.orange }}>!</Text></View>}
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {step === 3 && (
          <View style={{ padding: Spacing.xl }}>
            <Text style={CommonStyles.sectionTitle}>Statement of Purpose (SOP)</Text>
            <Text style={applyStyles.intro}>
              Your SOP is the most critical part of your application. Write it below, or paste your draft to get instant AI feedback.
            </Text>
            
            <TextInput
              style={applyStyles.sopInput}
              multiline
              placeholder="Start writing your statement of purpose here..."
              value={useAppStore.getState().applications.find(a => a.scholarship_id === scholarshipId)?.sop_content || ''}
              onChangeText={(txt) => {
                const app = useAppStore.getState().applications.find(a => a.scholarship_id === scholarshipId);
                if (app) useAppStore.getState().updateSOP(app.id, txt);
              }}
              textAlignVertical="top"
            />

            <Button 
              title="✨ Get AI Feedback" 
              variant="outline" 
              onPress={async () => {
                const content = useAppStore.getState().applications.find(a => a.scholarship_id === scholarshipId)?.sop_content;
                if (!content || content.length < 50) {
                  Alert.alert('Too short', 'Please write at least 50 characters to get meaningful feedback.');
                  return;
                }
                const result = await useAppStore.getState().reviewSOP(content);
                Alert.alert(`AI Score: ${result.score}/100`, result.feedback + '\n\n' + result.suggestions.map(s => '• ' + s).join('\n'));
              }}
              loading={useAppStore.getState().isReviewingSOP}
              style={{ marginTop: Spacing.md }}
            />
            
            <View style={applyStyles.aiTip}>
              <Text style={applyStyles.aiTipTitle}>💡 Pro Tip</Text>
              <Text style={applyStyles.aiTipText}>Consultants recommend focusing on your "Why" — why this program, why this country, and why now?</Text>
            </View>
          </View>
        )}

        {step === 4 && (
          <View style={{ padding: Spacing.xl }}>
            <Text style={CommonStyles.sectionTitle}>Secure Payment</Text>
            <Text style={[applyStyles.intro, { marginBottom: Spacing.lg }]}>
              To begin your {packageTier} consultation, please complete the payment below. A consultant will verify and reach out via WhatsApp.
            </Text>

            <View style={applyStyles.paymentCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md }}>
                <Text style={{ fontWeight: 'bold', fontSize: 16 }}>Amount Due</Text>
                <Text style={{ fontWeight: 'bold', fontSize: 18, color: Colors.blue }}>
                  {packageTier === 'premium' ? 'ETB 55,000' : packageTier === 'standard' ? 'ETB 28,000' : 'ETB 10,000'}
                </Text>
              </View>

              <Text style={applyStyles.paymentLabel}>Select Payment Method</Text>
              {[
                { name: 'Telebirr', icon: '📱' },
                { name: 'Chapa (Card/Transfer)', icon: '💳' },
                { name: 'CBE Birr / Bank Transfer', icon: '🏦' },
              ].map(pm => (
                <TouchableOpacity key={pm.name} style={applyStyles.methodRow} activeOpacity={0.8}>
                  <Text style={{ fontSize: 18 }}>{pm.icon}</Text>
                  <Text style={applyStyles.methodName}>{pm.name}</Text>
                  <View style={applyStyles.radio} />
                </TouchableOpacity>
              ))}

              <View style={applyStyles.paymentInfo}>
                <Text style={{ fontSize: 12, color: Colors.textSecondary }}>
                  💡 After payment, please keep your reference number or screenshot ready.
                </Text>
              </View>
            </View>
          </View>
        )}

        {step === 5 && (
          <View style={{ padding: Spacing.xl, alignItems: 'center' }}>
            <Text style={{ fontSize: 60, marginBottom: Spacing.lg }}>🚀</Text>
            <Text style={applyStyles.title}>Ready to Submit</Text>
            <Text style={[applyStyles.intro, { textAlign: 'center', marginTop: Spacing.md }]}>
              All steps are complete! Once you submit, your consultant will start working on your {packageTier} package.
            </Text>
            <View style={[CommonStyles.card, { width: '100%', marginTop: Spacing.xl, padding: Spacing.lg }]}>
              <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Summary</Text>
              <Text>• Scholarship: {scholarshipId?.split('-')[0]}</Text>
              <Text>• Package: {packageTier}</Text>
              <Text>• Documents: {documents.length} / {requiredDocs.length}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={applyStyles.bottomBar}>
        <Button title={step === 1 ? 'Cancel' : '← Back'} variant="secondary" onPress={() => step > 1 ? setStep(s => s - 1) : router.back()} style={{ flex: 0.5 }} fullWidth={false} />
        <Button title={step === 5 ? 'Confirm & Submit' : 'Continue →'} variant="primary" onPress={step < 5 ? () => setStep(s => s + 1) : handleSubmit} loading={loading} style={{ flex: 1 }} fullWidth={false} />
      </View>
    </SafeAreaView>
  );
}

const applyStyles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.xl, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 36, height: 36, backgroundColor: Colors.grayLight, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: Typography['3xl'], fontWeight: Typography.bold, color: Colors.text },
  subtitle: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm, fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.blue },
  stepsRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg },
  stepItem: { alignItems: 'center', gap: 4 },
  stepCircle: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepDone: { backgroundColor: Colors.blue },
  stepActive: { backgroundColor: Colors.gold },
  stepInactive: { backgroundColor: Colors.grayLight },
  stepDoneText: { color: Colors.white, fontSize: Typography.sm, fontWeight: Typography.bold },
  stepNum: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.textSecondary },
  stepLabel: { fontSize: 9, fontWeight: Typography.semibold, color: Colors.textSecondary, textAlign: 'center', width: 50 },
  stepLine: { flex: 1, height: 2, backgroundColor: Colors.border, marginBottom: 14 },
  successBanner: { marginHorizontal: Spacing.xl, marginBottom: Spacing.sm, backgroundColor: '#f0fdf4', borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: '#bbf7d0', flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  successText: { fontSize: Typography.base, color: '#166534', flex: 1 },
  docRow: { marginHorizontal: Spacing.xl, marginBottom: Spacing.sm, backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  docRowMissing: { borderColor: '#fca5a5', backgroundColor: '#fff5f5' },
  docIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  docName: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.text },
  docMeta: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  checkCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.greenLight, alignItems: 'center', justifyContent: 'center' },
  crossCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.orangeLight, alignItems: 'center', justifyContent: 'center' },
  bottomBar: { padding: Spacing.lg, backgroundColor: Colors.card, borderTopWidth: 1, borderTopColor: Colors.border, flexDirection: 'row', gap: Spacing.sm },
  paymentCard: { backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, marginTop: Spacing.md },
  paymentLabel: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.textSecondary, marginBottom: Spacing.sm, marginTop: Spacing.md },
  methodRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  methodName: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.text, flex: 1 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: Colors.border },
  paymentInfo: { marginTop: Spacing.lg, backgroundColor: Colors.bg, padding: Spacing.md, borderRadius: Radius.md },
  intro: { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 20 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  infoLabel: { color: Colors.textSecondary, fontSize: Typography.sm },
  infoValue: { color: Colors.text, fontWeight: 'bold', fontSize: Typography.base },
  sopInput: { minHeight: 250, backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, marginTop: Spacing.lg, fontSize: Typography.base, color: Colors.text, textAlignVertical: 'top' },
  aiTip: { marginTop: Spacing.xl, backgroundColor: Colors.goldLight, padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, borderColor: '#e8d5a0' },
  aiTipTitle: { fontWeight: 'bold', color: '#7a5c1e', marginBottom: 4 },
  aiTipText: { fontSize: 12, color: '#9a7230', lineHeight: 18 },
});

// ─── APPLICATION TRACKER ─────────────────────────────────────────────────────
export function TrackerScreen() {
  const { user } = useAuthStore();
  const { applications, loadApplications } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadApplications(user.id).finally(() => setLoading(false));
  }, [user?.id]);

  const STATUS_STEPS: Application['status'][] = ['personal_info', 'documents', 'sop', 'submitted', 'interview', 'accepted'];
  const STATUS_LABELS: Record<string, string> = {
    personal_info: 'Personal Information',
    documents: 'Documents Uploaded',
    sop: 'Statement of Purpose',
    submitted: 'Application Submitted',
    interview: 'Interview Round',
    accepted: 'Final Decision',
  };
  const STATUS_COLORS: Record<string, string> = {
    accepted: Colors.green,
    submitted: Colors.blue,
    interview: Colors.blue,
    sop: Colors.gold,
    documents: Colors.gold,
    personal_info: Colors.gold,
    draft: Colors.textSecondary,
    rejected: Colors.red,
  };

  const active = applications.filter(a => !['accepted', 'rejected'].includes(a.status));
  const completed = applications.filter(a => ['accepted', 'rejected'].includes(a.status));
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  if (selectedApp) {
    return (
      <SafeAreaView style={CommonStyles.screenBg} edges={['top']}>
        <View style={trackerStyles.detailHeader}>
          <TouchableOpacity style={trackerStyles.backBtn} onPress={() => setSelectedApp(null)} activeOpacity={0.8}>
            <Text style={{ fontSize: 20 }}>←</Text>
          </TouchableOpacity>
          <Text style={trackerStyles.detailTitle}>Application Status</Text>
        </View>
        <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
          <View style={trackerStyles.summaryCard}>
            <Text style={trackerStyles.summaryFlag}>{selectedApp.scholarship?.country_flag}</Text>
            <Text style={trackerStyles.summaryName}>{selectedApp.scholarship?.name}</Text>
            <Text style={trackerStyles.summaryOrg}>{selectedApp.scholarship?.organization}</Text>
            <View style={trackerStyles.badgeRow}>
              <Pill label={selectedApp.package_tier.toUpperCase()} variant="gold" />
              <Pill label={selectedApp.status.replace('_', ' ').toUpperCase()} variant="blue" />
            </View>
          </View>

          <StatusTimeline currentStatus={selectedApp.status} updatedAt={selectedApp.updated_at} />

          {selectedApp.notes && (
            <View style={trackerStyles.notesBox}>
              <Text style={trackerStyles.notesTitle}>Consultant Feedback</Text>
              <Text style={trackerStyles.notesText}>{selectedApp.notes}</Text>
            </View>
          )}

          {selectedApp.consultant && (
            <View style={{ padding: Spacing.xl }}>
              <Button 
                title="Message Consultant" 
                variant="primary" 
                onPress={() => openWhatsApp(selectedApp.consultant?.phone || '', `Hi ${selectedApp.consultant?.full_name}, I'm checking in on my ${selectedApp.scholarship?.name} application.`)} 
              />
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={CommonStyles.screenBg} edges={['top']}>
      <View style={trackerStyles.hero}>
        <View style={trackerStyles.heroTop}>
          <View>
            <Text style={trackerStyles.heroLabel}>Application Tracker</Text>
            <Text style={trackerStyles.heroTitle}>Your Journey</Text>
          </View>
          <TouchableOpacity style={trackerStyles.newBtn} onPress={() => router.push('/(tabs)/scholarships')} activeOpacity={0.8}>
            <Text style={trackerStyles.newBtnText}>+ New Application</Text>
          </TouchableOpacity>
        </View>
        <View style={trackerStyles.statsRow}>
          {[
            { num: active.length, lbl: 'Active' },
            { num: applications.filter(a => a.status === 'submitted').length, lbl: 'Submitted' },
            { num: applications.filter(a => a.status === 'accepted').length, lbl: 'Accepted' },
            { num: applications.length, lbl: 'Total' },
          ].map(s => (
            <View key={s.lbl} style={trackerStyles.stat}>
              <Text style={trackerStyles.statNum}>{s.num}</Text>
              <Text style={trackerStyles.statLbl}>{s.lbl}</Text>
            </View>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={[CommonStyles.flex1, CommonStyles.center]}><ActivityIndicator color={Colors.blue} size="large" /></View>
      ) : applications.length === 0 ? (
        <EmptyState icon="📋" title="No applications yet" subtitle="Find a scholarship and start your application journey" />
      ) : (
        <ScrollView contentContainerStyle={{ padding: Spacing.xl, paddingBottom: 100 }}>
          {[...active, ...completed].map(app => (
            <TouchableOpacity key={app.id} style={{ marginBottom: Spacing.xl }} onPress={() => setSelectedApp(app)} activeOpacity={0.9}>
              <View style={trackerStyles.appHeader}>
                <Text style={trackerStyles.appFlag}>{app.scholarship?.country_flag || '🌍'}</Text>
                <Text style={trackerStyles.appName}>{app.scholarship?.name || 'Scholarship'}</Text>
                {app.consultant && (
                  <View style={trackerStyles.consultantBtn}>
                    <Text style={{ fontSize: 13 }}>💬</Text>
                  </View>
                )}
                {app.status === 'accepted' && <Pill label="ACCEPTED! 🎉" variant="green" />}
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
                <Text style={[trackerStyles.footerTxt, { color: Colors.blue, fontWeight: 'bold' }]}>View Details ›</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const trackerStyles = StyleSheet.create({
  hero: { backgroundColor: Colors.blueDark, padding: Spacing.xl, paddingBottom: Spacing['3xl'] },
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
});

// ─── DOCUMENTS ───────────────────────────────────────────────────────────────
export function DocumentsScreen() {
  const { user } = useAuthStore();
  const { documents, loadDocuments, uploadDocument } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadDocuments(user.id).finally(() => setLoading(false));
  }, [user?.id]);

  const approved = documents.filter(d => d.status === 'approved').length;
  const pending = documents.filter(d => d.status === 'pending').length;
  const DOC_EMOJIS: Record<string, string> = {
    degree_certificate: '🎓', transcript: '📋', passport: '🪪',
    cv: '📝', ielts_certificate: '📄', reference_letter: '✉️', other: '📁',
  };

  const handleUpload = async () => {
    try {
      const result = await scholarshipsService.pickDocument();
      if (result.canceled || !result.assets?.[0] || !user) return;
      const asset = result.assets[0];
      await uploadDocument({ userId: user.id, documentType: 'other', fileUri: asset.uri, fileName: asset.name });
      Alert.alert('Success', 'Document uploaded!');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <SafeAreaView style={CommonStyles.screenBg} edges={['top']}>
      <View style={docStyles.header}>
        <TouchableOpacity style={docStyles.backBtn} onPress={() => router.back()} activeOpacity={0.8}><Text style={{ fontSize: 20, color: Colors.text }}>←</Text></TouchableOpacity>
        <Text style={docStyles.title}>My Documents</Text>
        <TouchableOpacity onPress={handleUpload} activeOpacity={0.8}><Text style={docStyles.uploadBtn}>Upload +</Text></TouchableOpacity>
      </View>

      <View style={docStyles.statsRow}>
        <View style={docStyles.statBox}><Text style={[docStyles.statNum, { color: Colors.green }]}>{approved}</Text><Text style={docStyles.statLbl}>Approved</Text></View>
        <View style={docStyles.statBox}><Text style={[docStyles.statNum, { color: Colors.orange }]}>{pending}</Text><Text style={docStyles.statLbl}>Pending</Text></View>
        <View style={docStyles.statBox}><Text style={[docStyles.statNum, { color: Colors.red }]}>{Math.max(0, 7 - documents.length)}</Text><Text style={docStyles.statLbl}>Missing</Text></View>
      </View>

      {loading ? (
        <View style={[CommonStyles.flex1, CommonStyles.center]}><ActivityIndicator color={Colors.blue} size="large" /></View>
      ) : documents.length === 0 ? (
        <EmptyState icon="📁" title="No documents yet" subtitle="Upload your documents to start applying for scholarships" />
      ) : (
        <FlatList
          data={documents}
          keyExtractor={d => d.id}
          renderItem={({ item: doc }) => (
            <TouchableOpacity style={docStyles.docItem} activeOpacity={0.9}>
              <View style={[docStyles.docIcon, { backgroundColor: doc.status === 'approved' ? Colors.greenLight : doc.status === 'rejected' ? Colors.redLight : Colors.blueLight }]}>
                <Text style={{ fontSize: 18 }}>{DOC_EMOJIS[doc.document_type] || '📄'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={docStyles.docName} numberOfLines={1}>{doc.file_name}</Text>
                <Text style={docStyles.docMeta}>{(doc.file_size / 1024 / 1024).toFixed(1)} MB · {new Date(doc.uploaded_at).toLocaleDateString()}</Text>
              </View>
              <View style={[docStyles.statusPill, { backgroundColor: doc.status === 'approved' ? Colors.greenLight : doc.status === 'rejected' ? Colors.redLight : Colors.goldLight }]}>
                <Text style={[docStyles.statusText, { color: doc.status === 'approved' ? Colors.green : doc.status === 'rejected' ? Colors.red : Colors.goldDark }]}>
                  {doc.status === 'approved' ? 'Approved' : doc.status === 'rejected' ? 'Rejected' : 'Review'}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const docStyles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.xl, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 36, height: 36, backgroundColor: Colors.grayLight, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: Typography['3xl'], fontWeight: Typography.bold, color: Colors.text, flex: 1 },
  uploadBtn: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.blue },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, margin: Spacing.xl, marginBottom: Spacing.sm },
  statBox: { flex: 1, backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  statNum: { fontSize: Typography['3xl'], fontWeight: Typography.bold },
  statLbl: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  docItem: { marginHorizontal: Spacing.xl, marginBottom: Spacing.sm, backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  docIcon: { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  docName: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.text },
  docMeta: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: Typography.sm, fontWeight: Typography.semibold },
});

// ─── BOOKINGS ────────────────────────────────────────────────────────────────
export function BookingsScreen() {
  const { user } = useAuthStore();
  const { bookings, loadBookings, loadTutorBookings, updateBookingStatus, cancelBooking } = useAppStore();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');
  const [loading, setLoading] = useState(true);

  const isTutor = user?.role?.toLowerCase() === 'tutor';

  useEffect(() => {
    if (user) {
      if (isTutor) {
        loadTutorBookings(user.id).finally(() => setLoading(false));
      } else {
        loadBookings(user.id).finally(() => setLoading(false));
      }
    }
  }, [user?.id, isTutor]);

  const filtered = bookings.filter(b => {
    if (activeTab === 'upcoming') return ['pending', 'confirmed'].includes(b.status);
    if (activeTab === 'past') return b.status === 'completed';
    return b.status === 'cancelled';
  });

  return (
    <SafeAreaView style={CommonStyles.screenBg} edges={['top']}>
      <View style={bkgStyles.header}><Text style={bkgStyles.title}>{isTutor ? 'My Sessions' : 'My Bookings'}</Text></View>
      <View style={bkgStyles.tabs}>
        {(['upcoming', 'past', 'cancelled'] as const).map(tab => (
          <TouchableOpacity key={tab} style={[bkgStyles.tab, activeTab === tab && bkgStyles.tabActive]} onPress={() => setActiveTab(tab)} activeOpacity={0.8}>
            <Text style={[bkgStyles.tabText, activeTab === tab && bkgStyles.tabTextActive]}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading ? (
        <View style={[CommonStyles.flex1, CommonStyles.center]}><ActivityIndicator color={Colors.blue} size="large" /></View>
      ) : filtered.length === 0 ? (
        <EmptyState icon="📅" title={`No ${activeTab} ${isTutor ? 'sessions' : 'bookings'}`} subtitle={isTutor ? "You don't have any sessions in this category yet." : "Book a session with a tutor to get started"} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={b => b.id}
          renderItem={({ item: b }) => {
            const displayName = isTutor ? b.student?.full_name : b.tutor?.user?.full_name;
            const initials = displayName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || (isTutor ? 'S' : 'T');
            
            return (
              <View style={bkgStyles.card}>
                <View style={bkgStyles.cardTop}>
                  <Avatar initials={initials} size={44} borderRadius={13} />
                  <View style={{ flex: 1, marginLeft: Spacing.md }}>
                    <Text style={bkgStyles.name}>{displayName || 'User'}</Text>
                    <Text style={bkgStyles.sub}>{b.subject} · {b.session_type === 'online' ? 'Online' : 'In-Person'}</Text>
                  </View>
                  <View style={[bkgStyles.statusPill, { backgroundColor: b.status === 'confirmed' ? Colors.blueLight : b.status === 'pending' ? Colors.goldLight : Colors.grayLight }]}>
                    <Text style={[bkgStyles.statusText, { color: b.status === 'confirmed' ? Colors.blue : b.status === 'pending' ? Colors.goldDark : Colors.textSecondary }]}>{b.status.charAt(0).toUpperCase() + b.status.slice(1)}</Text>
                  </View>
                </View>
                <View style={bkgStyles.details}>
                  <Text style={bkgStyles.detail}>📅 {format(new Date(b.session_date), 'MMM d, yyyy')} · {b.session_time}</Text>
                  <Text style={bkgStyles.detail}>🕐 {b.duration_hours}h</Text>
                  <Text style={bkgStyles.detail}>{b.session_type === 'online' ? '🌐 Zoom' : '🏠 In-Person'}</Text>
                </View>
                
                {activeTab === 'upcoming' && (
                  <View style={bkgStyles.actions}>
                    {!isTutor ? (
                      <>
                        <TouchableOpacity style={bkgStyles.btnJoin} onPress={() => b.zoom_link && Linking.openURL(b.zoom_link)} activeOpacity={0.85}>
                          <Text style={bkgStyles.btnJoinText}>Join Session</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={bkgStyles.btnCancel} onPress={() => Alert.alert('Cancel Booking?', 'Are you sure?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Yes, cancel', style: 'destructive', onPress: () => cancelBooking(b.id) }])} activeOpacity={0.85}>
                          <Text style={bkgStyles.btnCancelText}>Cancel</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>
                        {b.status === 'pending' ? (
                          <TouchableOpacity style={bkgStyles.btnJoin} onPress={() => updateBookingStatus(b.id, 'confirmed' as any)} activeOpacity={0.85}>
                            <Text style={bkgStyles.btnJoinText}>Accept Request</Text>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity style={bkgStyles.btnJoin} onPress={() => updateBookingStatus(b.id, 'completed' as any)} activeOpacity={0.85}>
                            <Text style={bkgStyles.btnJoinText}>Mark Completed</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity style={bkgStyles.btnCancel} onPress={() => updateBookingStatus(b.id, 'cancelled' as any)} activeOpacity={0.85}>
                          <Text style={bkgStyles.btnCancelText}>Decline/Cancel</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                )}
              </View>
            );
          }}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const bkgStyles = StyleSheet.create({
  header: { padding: Spacing.xl, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontSize: Typography['3xl'], fontWeight: Typography.bold, color: Colors.text },
  tabs: { flexDirection: 'row', backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { flex: 1, padding: Spacing.md, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: Colors.transparent },
  tabActive: { borderBottomColor: Colors.blue },
  tabText: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textSecondary },
  tabTextActive: { color: Colors.blue },
  card: { marginHorizontal: Spacing.xl, marginTop: Spacing.md, backgroundColor: Colors.card, borderRadius: Radius['2xl'], padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  name: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.text },
  sub: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: Typography.sm, fontWeight: Typography.semibold },
  details: { flexDirection: 'row', gap: Spacing.md, flexWrap: 'wrap', marginBottom: Spacing.md },
  detail: { fontSize: Typography.sm, color: Colors.textSecondary },
  actions: { flexDirection: 'row', gap: Spacing.sm },
  btnJoin: { flex: 1, backgroundColor: Colors.blue, borderRadius: 10, padding: 10, alignItems: 'center' },
  btnJoinText: { color: Colors.white, fontWeight: Typography.semibold, fontSize: Typography.base },
  btnCancel: { flex: 1, backgroundColor: Colors.redLight, borderRadius: 10, padding: 10, alignItems: 'center' },
  btnCancelText: { color: Colors.red, fontWeight: Typography.semibold, fontSize: Typography.base },
});

// ─── MY PROGRESS ─────────────────────────────────────────────────────────────
export function ProgressScreen() {
  const { user } = useAuthStore();
  const { applications, bookings, documents } = useAppStore();

  const checklist = [
    { label: "Bachelor's degree completed", done: true },
    { label: 'IELTS score obtained', done: documents.some(d => d.document_type === 'ielts_certificate' && d.status === 'approved') },
    { label: 'CV uploaded & approved', done: documents.some(d => d.document_type === 'cv' && d.status === 'approved') },
    { label: 'SOP in progress', done: applications.some(a => ['sop', 'submitted', 'accepted'].includes(a.status)), inProgress: true },
    { label: 'Reference letters uploaded', done: documents.filter(d => d.document_type === 'reference_letter').length >= 2 },
    { label: 'Interview preparation', done: applications.some(a => a.status === 'accepted') },
  ];

  const doneCount = checklist.filter(c => c.done).length;
  const readiness = Math.round((doneCount / checklist.length) * 100);

  const academicJourneys = [
    { title: 'Grade 12 Preparation', sub: 'Math & Physics', progress: 80, color: Colors.green, tag: 'Active' },
    { title: 'IELTS Preparation', sub: 'English', progress: 50, color: Colors.blue, tag: 'Active' },
  ];

  return (
    <SafeAreaView style={CommonStyles.screenBg} edges={['top']}>
      <View style={progStyles.hero}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl }}>
          <View><Text style={progStyles.heroLabel}>Your Journey</Text><Text style={progStyles.heroTitle}>My Progress</Text></View>
          <TouchableOpacity style={progStyles.backBtn} onPress={() => router.back()} activeOpacity={0.8}><Text style={{ color: Colors.white, fontSize: 20 }}>←</Text></TouchableOpacity>
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
        {applications.length === 0 ? (
          <View style={{ paddingHorizontal: Spacing.xl }}>
            <TouchableOpacity style={progStyles.startBtn} onPress={() => router.push('/(tabs)/scholarships')} activeOpacity={0.8}>
              <Text style={progStyles.startBtnText}>+ Start Your First Application</Text>
            </TouchableOpacity>
          </View>
        ) : (
          applications.map(app => (
            <View key={app.id} style={progStyles.journeyCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'center', flex: 1 }}>
                  <Text style={{ fontSize: 20 }}>{app.scholarship?.country_flag || '🌍'}</Text>
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
  checkItem: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center', marginBottom: Spacing.md },
  checkBox: { width: 20, height: 20, borderRadius: 6, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  checkLabel: { fontSize: Typography.base, color: Colors.text, flex: 1 },
});

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
export function NotificationsScreen() {
  const { user } = useAuthStore();
  const { notifications, unreadCount, loadNotifications, markAllNotificationsRead } = useAppStore();

  useEffect(() => {
    if (user) loadNotifications(user.id);
  }, [user?.id]);

  const NOTIF_ICONS: Record<string, string> = {
    session_reminder: '⏰', booking_confirmed: '📅', scholarship_alert: '🔔',
    document_approved: '✅', document_rejected: '❌', sop_reviewed: '🎓',
    application_update: '📋', offer_received: '🎉',
  };

  return (
    <SafeAreaView style={CommonStyles.screenBg} edges={['top']}>
      <View style={notifStyles.header}>
        <TouchableOpacity style={notifStyles.backBtn} onPress={() => router.back()} activeOpacity={0.8}><Text style={{ fontSize: 20, color: Colors.text }}>←</Text></TouchableOpacity>
        <Text style={notifStyles.title}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={() => user && markAllNotificationsRead(user.id)} activeOpacity={0.8}>
            <Text style={notifStyles.markAll}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {notifications.length === 0 ? (
        <EmptyState icon="🔔" title="No notifications yet" subtitle="You'll see session reminders, scholarship alerts, and updates here" />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={n => n.id}
          renderItem={({ item: n }) => (
            <View style={[notifStyles.item, !n.is_read && notifStyles.itemUnread]}>
              <View style={notifStyles.iconWrap}>
                <Text style={{ fontSize: 20 }}>{NOTIF_ICONS[n.type] || '📬'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={notifStyles.itemTitle}>{n.title}</Text>
                <Text style={notifStyles.itemBody}>{n.body}</Text>
                <Text style={notifStyles.itemTime}>{new Date(n.created_at).toLocaleDateString()}</Text>
              </View>
              {!n.is_read && <View style={notifStyles.unreadDot} />}
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const notifStyles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.xl, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 36, height: 36, backgroundColor: Colors.grayLight, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: Typography['3xl'], fontWeight: Typography.bold, color: Colors.text, flex: 1 },
  markAll: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.blue },
  item: { flexDirection: 'row', gap: Spacing.md, padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border, alignItems: 'flex-start' },
  itemUnread: { backgroundColor: Colors.blueLight },
  iconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.grayLight, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  itemTitle: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.text },
  itemBody: { fontSize: Typography.base, color: Colors.textSecondary, marginTop: 2, lineHeight: 20 },
  itemTime: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.blue, marginTop: 6, flexShrink: 0 },
});

// ─── PROFILE ─────────────────────────────────────────────────────────────────
export function ProfileScreen() {
  const { user, signOut, uploadAvatar } = useAuthStore();
  const { applications, documents, unreadCount } = useAppStore();
  const [uploading, setUploading] = useState(false);

  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'EP';

  const handlePickAvatar = async () => {
    try {
      const result = await scholarshipsService.pickDocument();
      if (result.canceled || !result.assets?.[0] || !user) return;
      
      setUploading(true);
      const asset = result.assets[0];
      await uploadAvatar(asset.uri, asset.name || 'avatar.jpg');
      Alert.alert('Success', 'Profile picture updated! ✨');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await signOut(); router.replace('/(auth)/splash'); } },
    ]);
  };

  const MENU_ITEMS = [
    { icon: '📊', label: 'My Progress', badge: null, color: Colors.blueLight, route: '/progress', danger: false },
    { icon: '🎓', label: 'My Applications', badge: `${applications.filter(a => !['accepted','rejected'].includes(a.status)).length} Active`, color: Colors.goldLight, route: '/tracker', danger: false },
    { icon: '📁', label: 'Documents', badge: documents.filter(d => d.status !== 'approved').length > 0 ? 'Action needed' : null, color: Colors.greenLight, route: '/documents', danger: false },
    { icon: '📅', label: 'My Bookings', badge: null, color: Colors.grayLight, route: '/(tabs)/bookings', danger: false },
    { icon: '🔔', label: 'Notifications', badge: unreadCount > 0 ? `${unreadCount} New` : null, color: Colors.blueLight, route: '/notifications', danger: false },
    { icon: '⚙️', label: 'Settings', badge: null, color: Colors.grayLight, route: '/settings', danger: false },
    { icon: '🚪', label: 'Sign Out', badge: null, color: '#fef2f2', route: null, danger: true },
  ];

  return (
    <SafeAreaView style={CommonStyles.screenBg} edges={['top']}>
      <View style={profStyles.hero}>
        <TouchableOpacity onPress={handlePickAvatar} disabled={uploading} activeOpacity={0.8}>
          <Avatar 
            initials={initials} 
            imageUri={user?.avatar_url}
            size={90} 
            borderRadius={30} 
            color={Colors.gold} 
            style={{ marginBottom: Spacing.md, borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)' }} 
          />
          <View style={profStyles.editBadge}>
            {uploading ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text style={{ fontSize: 12 }}>✏️</Text>
            )}
          </View>
        </TouchableOpacity>
        <Text style={profStyles.name}>{user?.full_name || 'Student'}</Text>
        <Text style={profStyles.role}>{user?.role?.charAt(0).toUpperCase()}{user?.role?.slice(1) || 'Student'}</Text>
        <View style={profStyles.badges}>
          {user?.grade_level && <View style={profStyles.badge}><Text style={profStyles.badgeText}>{user.grade_level}</Text></View>}
          {user?.city && <View style={profStyles.badge}><Text style={profStyles.badgeText}>{user.city}</Text></View>}
          <View style={profStyles.badge}><Text style={profStyles.badgeText}>{user?.email || user?.phone || ''}</Text></View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {MENU_ITEMS.map((item, i) => (
          <TouchableOpacity
            key={item.label}
            style={[profStyles.menuItem, i === 0 && profStyles.menuFirst]}
            onPress={() => item.route ? router.push(item.route as any) : item.danger ? handleSignOut() : null}
            activeOpacity={0.9}
          >
            <View style={[profStyles.menuIcon, { backgroundColor: item.color }]}><Text style={{ fontSize: 16 }}>{item.icon}</Text></View>
            <Text style={[profStyles.menuLabel, item.danger && { color: Colors.red }]}>{item.label}</Text>
            {item.badge && (
              <View style={[profStyles.menuBadge, { backgroundColor: item.danger ? Colors.redLight : item.label === 'Documents' ? Colors.redLight : Colors.blueLight }]}>
                <Text style={[profStyles.menuBadgeText, { color: item.label === 'Documents' ? Colors.red : Colors.blue }]}>{item.badge}</Text>
              </View>
            )}
            {!item.danger && <Text style={profStyles.menuArrow}>›</Text>}
          </TouchableOpacity>
        ))}
        <Text style={profStyles.version}>Eagle Pathway v1.0.0 · Made with ❤️ in Addis Ababa</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const profStyles = StyleSheet.create({
  hero: { backgroundColor: Colors.blueDark, padding: Spacing.xl, paddingBottom: Spacing['3xl'], alignItems: 'center' },
  name: { fontSize: Typography['4xl'], fontWeight: Typography.bold, color: Colors.white },
  role: { fontSize: Typography.base, color: 'rgba(255,255,255,0.65)', marginTop: 4 },
  badges: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg, flexWrap: 'wrap', justifyContent: 'center' },
  badge: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  badgeText: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: 'rgba(255,255,255,0.9)' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, paddingHorizontal: Spacing.xl, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.card },
  menuFirst: { borderTopWidth: 1, borderTopColor: Colors.border },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  menuLabel: { fontSize: Typography.lg, fontWeight: Typography.medium, color: Colors.text, flex: 1 },
  menuBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  menuBadgeText: { fontSize: Typography.sm, fontWeight: Typography.bold },
  menuArrow: { fontSize: Typography.xl, color: Colors.textSecondary },
  version: { textAlign: 'center', fontSize: Typography.sm, color: Colors.textSecondary, padding: Spacing.xl },
  editBadge: { position: 'absolute', bottom: 15, right: -5, backgroundColor: Colors.blue, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.blueDark },
});

// ─── SETTINGS ────────────────────────────────────────────────────────────────
export function SettingsScreen() {
  const [sessionReminders, setSessionReminders] = useState(true);
  const [scholarshipAlerts, setScholarshipAlerts] = useState(true);
  const [documentUpdates, setDocumentUpdates] = useState(true);
  const [messages, setMessages] = useState(false);

  const SECTIONS = [
    {
      title: 'Notifications',
      items: [
        { icon: '🔔', label: 'Session Reminders', type: 'toggle', value: sessionReminders, onChange: setSessionReminders },
        { icon: '🎓', label: 'Scholarship Alerts', type: 'toggle', value: scholarshipAlerts, onChange: setScholarshipAlerts },
        { icon: '📄', label: 'Document Updates', type: 'toggle', value: documentUpdates, onChange: setDocumentUpdates },
        { icon: '💬', label: 'Message Notifications', type: 'toggle', value: messages, onChange: setMessages },
      ],
    },
    {
      title: 'App',
      items: [
        { icon: '🌐', label: 'Language', type: 'nav', value: 'English', route: null },
        { icon: '🎨', label: 'Theme', type: 'nav', value: 'Light', route: null },
        { icon: '💳', label: 'Payment Methods', type: 'nav', route: null },
      ],
    },
    {
      title: 'Account',
      items: [
        { icon: '🔒', label: 'Change Password', type: 'nav', route: null },
        { icon: '🛡️', label: 'Privacy & Data', type: 'nav', route: null },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: '❓', label: 'Help Center', type: 'nav', route: null },
        { icon: '⭐', label: 'Rate Eagle Pathway', type: 'nav', route: null },
        { icon: '🗑️', label: 'Delete Account', type: 'danger', route: null },
      ],
    },
  ];

  return (
    <SafeAreaView style={CommonStyles.screenBg} edges={['top']}>
      <View style={settingsStyles.header}>
        <TouchableOpacity style={settingsStyles.backBtn} onPress={() => router.back()} activeOpacity={0.8}><Text style={{ fontSize: 20, color: Colors.text }}>←</Text></TouchableOpacity>
        <Text style={settingsStyles.title}>Settings</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        {SECTIONS.map(section => (
          <View key={section.title}>
            <Text style={settingsStyles.sectionLabel}>{section.title}</Text>
            <View style={settingsStyles.sectionCard}>
              {section.items.map((item, i) => (
                <View key={item.label} style={[settingsStyles.item, i === section.items.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={[settingsStyles.icon, { backgroundColor: Colors.grayLight }]}><Text style={{ fontSize: 16 }}>{item.icon}</Text></View>
                  <Text style={[settingsStyles.label, item.type === 'danger' && { color: Colors.red }]}>{item.label}</Text>
                  {item.type === 'toggle' && (
                    <Switch
                      value={(item as any).value}
                      onValueChange={(item as any).onChange}
                      trackColor={{ false: Colors.border, true: Colors.blue }}
                      thumbColor={Colors.white}
                    />
                  )}
                  {item.type === 'nav' && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      {(item as any).value && <Text style={settingsStyles.navValue}>{(item as any).value}</Text>}
                      <Text style={settingsStyles.arrow}>›</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const settingsStyles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.xl, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 36, height: 36, backgroundColor: Colors.grayLight, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: Typography['3xl'], fontWeight: Typography.bold, color: Colors.text },
  sectionLabel: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textSecondary, letterSpacing: 0.8, textTransform: 'uppercase', paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  sectionCard: { backgroundColor: Colors.card, marginHorizontal: Spacing.xl, borderRadius: Radius['2xl'], borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  item: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, paddingHorizontal: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  icon: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  label: { fontSize: Typography.md, fontWeight: Typography.medium, color: Colors.text, flex: 1 },
  navValue: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.blue },
  arrow: { fontSize: Typography.xl, color: Colors.textSecondary },
});
