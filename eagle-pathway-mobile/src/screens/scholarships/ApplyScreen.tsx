import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { Button } from '@/components/common';
import { scholarshipsService } from '@/services/scholarships';
import { paymentsService } from '@/services/payments';
import { useAuthStore } from '@/store/authStore';
import { useScholarshipStore } from '@/store/scholarshipStore';
import { useDocumentStore } from '@/store/documentStore';
import { PACKAGE_PRICING, formatEtb } from '@/constants/packages';
import type { PackageTier, DocumentType } from '@/types';

export function ApplyScreen() {
  const { scholarshipId, packageTier } = useLocalSearchParams<{ scholarshipId: string; packageTier: PackageTier }>();
  const { user } = useAuthStore();
  const { createApplication, reviewSOP, isReviewingSOP } = useScholarshipStore();
  const { loadDocuments, uploadDocument, documents } = useDocumentStore();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<number>(1);
  const [sopContent, setSopContent] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [receiptAsset, setReceiptAsset] = useState<any>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => { if (user) loadDocuments(user.id); }, [user?.id]);

  const STEPS = ['Info', 'Docs', 'SOP', 'Pay', 'Final'];

  const handlePickAndUpload = async (docLabel: string) => {
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
    if (loading) return; // guard against double-submit -> duplicate applications
    if (!user || !scholarshipId || !packageTier) return;
    if (!selectedPaymentMethod) {
      Alert.alert('Missing Info', 'Please select a payment method before submitting your application.');
      return;
    }
    if (!transactionId || !receiptAsset) {
      Alert.alert('Missing Info', 'Please provide the transaction ID and upload the receipt screenshot for manual verification.');
      return;
    }
    setLoading(true);

    // 1. Create the application.
    let app;
    try {
      app = await createApplication(user.id, scholarshipId, packageTier, sopContent);
    } catch (e: any) {
      setLoading(false);
      Alert.alert('Error', e.message || 'Failed to create your application. Please try again.');
      return;
    }

    // 2. Submit the payment receipt. If THIS fails, the application already
    // exists — tell the user so they retry payment instead of re-submitting
    // (which would create a duplicate application).
    try {
      await paymentsService.submitPaymentReceipt({
        userId: user.id,
        referenceId: app.id,
        paymentType: 'scholarship_package',
        method: selectedPaymentMethod.includes('Telebirr') ? 'telebirr' : 'cbe',
        amount: PACKAGE_PRICING[packageTier].etb,
        transactionId,
        fileUri: receiptAsset.uri,
        fileName: receiptAsset.name,
      });
    } catch (e: any) {
      setLoading(false);
      Alert.alert(
        'Application created — payment not recorded',
        "Your application was created, but we couldn't upload your payment receipt. Open the tracker and retry the payment so a consultant can verify it.",
        [{ text: 'View Tracker', onPress: () => router.push('/tracker') }],
      );
      return;
    }

    setLoading(false);
    Alert.alert('Application Started! 🎉', 'Your consultant has been notified and will reach out shortly.', [
      { text: 'View Tracker', onPress: () => router.push('/tracker') },
    ]);
  };

  const requiredDocs = ['Degree Certificate', 'Official Transcript', 'Passport Copy', 'IELTS Certificate', 'CV / Resume', 'Reference Letter 1', 'Reference Letter 2'];

  const refLetterCount = documents.filter(d => d.document_type === 'reference_letter').length;
  const allDocsUploaded =
    (['degree_certificate', 'transcript', 'passport', 'ielts_certificate', 'cv'] as DocumentType[])
      .every(t => documents.some(d => d.document_type === t)) && refLetterCount >= 2;

  // Continue advances steps, but warns (without hard-blocking) if required docs
  // are missing on the Docs step — previously you could submit with zero docs.
  const handleContinue = () => {
    if (step === 2 && !allDocsUploaded) {
      Alert.alert(
        'Documents incomplete',
        'Some required documents are still missing. You can add them now, or continue and upload them later.',
        [
          { text: 'Add documents', style: 'cancel' },
          { text: 'Continue anyway', onPress: () => setStep(s => s + 1) },
        ],
      );
      return;
    }
    setStep(s => s + 1);
  };

  return (
    <SafeAreaView style={CommonStyles.screenBg} edges={['top', 'bottom']}>
      <View style={applyStyles.header}>
        <TouchableOpacity style={applyStyles.backBtn} onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))} activeOpacity={0.8}><Text style={{ fontSize: 20, color: Colors.text }}>←</Text></TouchableOpacity>
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
              const refLetterCount = documents.filter(d => d.document_type === 'reference_letter').length;
              const uploaded = doc === 'Reference Letter 1'
                ? refLetterCount >= 1
                : doc === 'Reference Letter 2'
                  ? refLetterCount >= 2
                  : documents.some(d => d.document_type === mappedType);

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
              value={sopContent}
              onChangeText={setSopContent}
              textAlignVertical="top"
            />

            <Button 
              title="✨ Get AI Feedback" 
              variant="outline" 
              onPress={async () => {
                if (!sopContent || sopContent.length < 50) {
                  Alert.alert('Too short', 'Please write at least 50 characters to get meaningful feedback.');
                  return;
                }
                const result = await useScholarshipStore.getState().reviewSOP(sopContent);
                Alert.alert(`AI Score: ${result.score}/100`, result.feedback + '\n\n' + result.suggestions.map(s => '• ' + s).join('\n'));
              }}
              loading={useScholarshipStore.getState().isReviewingSOP}
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
                  {packageTier ? `ETB ${formatEtb(PACKAGE_PRICING[packageTier].etb)}` : ''}
                </Text>
              </View>

              <Text style={applyStyles.paymentLabel}>Select Payment Method</Text>
              {[
                { name: 'Telebirr', icon: '📱', disabled: false },
                { name: 'Chapa (Card/Transfer)', icon: '💳', disabled: true },
                { name: 'CBE Birr / Bank Transfer', icon: '🏦', disabled: false },
              ].map(pm => (
                <TouchableOpacity key={pm.name} style={[applyStyles.methodRow, pm.disabled && { opacity: 0.45 }]} activeOpacity={0.8} disabled={pm.disabled} onPress={() => setSelectedPaymentMethod(pm.name)}>
                  <Text style={{ fontSize: 18 }}>{pm.icon}</Text>
                  <Text style={applyStyles.methodName}>{pm.name}{pm.disabled ? '  ·  Coming soon' : ''}</Text>
                  {!pm.disabled && <View style={[applyStyles.radio, selectedPaymentMethod === pm.name && { borderColor: Colors.blue, borderWidth: 5 }]} />}
                </TouchableOpacity>
              ))}

              {(selectedPaymentMethod === 'Telebirr' || selectedPaymentMethod === 'CBE Birr / Bank Transfer') && (
                <View style={{ marginTop: Spacing.lg }}>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: Spacing.xs }}>Transaction ID</Text>
                  <TextInput 
                    value={transactionId}
                    onChangeText={setTransactionId}
                    placeholder="e.g. 7A8B9C0D"
                    style={{ borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md }}
                  />
                  <Button 
                    title={receiptAsset ? 'Receipt Attached ✅' : 'Upload Screenshot (Required)'} 
                    variant="outline"
                    onPress={async () => {
                      const result = await scholarshipsService.pickDocument();
                      if (!result.canceled && result.assets?.[0]) {
                        setReceiptAsset(result.assets[0]);
                      }
                    }} 
                  />
                  <View style={applyStyles.paymentInfo}>
                    <Text style={{ fontSize: 12, color: Colors.textSecondary }}>
                      💡 A consultant will manually verify this receipt within 2 hours. Your package will then be activated!
                    </Text>
                  </View>
                </View>
              )}
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

      <View style={[applyStyles.bottomBar, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
        <Button title={step === 1 ? 'Cancel' : '← Back'} variant="secondary" onPress={() => step > 1 ? setStep(s => s - 1) : (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))} style={{ flex: 0.5 }} fullWidth={false} />
        <Button title={step === 5 ? 'Confirm & Submit' : 'Continue →'} variant="primary" onPress={step < 5 ? handleContinue : handleSubmit} loading={loading} style={{ flex: 1 }} fullWidth={false} />
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
