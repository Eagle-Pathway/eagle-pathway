import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, Modal,
} from 'react-native';
import { toast } from '@/utils/toast';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { Button } from '@/components/common';
import { KeyboardAwareScreen } from '@/components/KeyboardAwareScreen';
import { useAuthStore } from '@/store/authStore';
import { useScholarshipStore } from '@/store/scholarshipStore';
import { useDocumentStore } from '@/store/documentStore';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import type { PackageTier, DocumentType } from '@/types';
import { showError } from '@/utils/errorHandler';
import { draftStore } from '@/services/draftStore';
import { validateCloudDocumentUrl } from '@eagle-pathway/shared';

const TIER_NAMES: Record<PackageTier, string> = {
  basic: 'Basic Assistance',
  standard: 'Standard Full-Cycle',
  premium: 'Premium Elite',
};

export function ApplyScreen() {
  const { scholarshipId, packageTier } = useLocalSearchParams<{ scholarshipId: string; packageTier: PackageTier }>();
  const { user } = useAuthStore();
  const { scholarships, createApplication, reviewSOP, isReviewingSOP, generateMagicSOP, isGeneratingMagicSOP } = useScholarshipStore();
  const { loadDocuments, uploadDocument, documents } = useDocumentStore();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<number>(1);
  const [sopContent, setSopContent] = useState('');

  // Google Drive Link Modal State
  const [docModalVisible, setDocModalVisible] = useState(false);
  const [activeDocType, setActiveDocType] = useState<DocumentType>('degree_certificate');
  const [activeDocLabel, setActiveDocLabel] = useState('Degree Certificate');
  const [cloudUrlInput, setCloudUrlInput] = useState('');
  const [submittingDoc, setSubmittingDoc] = useState(false);

  const insets = useSafeAreaInsets();

  const handleGenerateStarter = async () => {
    if (!user) return;

    toast.info(
      'Inspirational Starter Outline 💡',
      'Direct copying of AI-generated content for official submissions is not allowed. Use this profile-customized outline as motivation & structure to write in your own authentic voice.'
    );

    try {
      const schObj = (scholarships || []).find(s => s.id === scholarshipId) || {
        id: scholarshipId || 'general',
        name: 'Scholarship Application',
        organization: 'Target Institution',
        country: (user.target_countries && user.target_countries[0]) || 'Target Country',
        description: 'Academic program for high-achieving candidates.',
      };

      const draft = await generateMagicSOP(user, schObj as any);
      if (draft) {
        if (sopContent && sopContent.trim().length > 0) {
          setSopContent(prev => prev + '\n\n' + draft);
        } else {
          setSopContent(draft);
        }
        toast.success('Starter Inserted! ✍️', 'Profile-customized SOP outline added to your draft.');
      }
    } catch (e: any) {
      showError(e, 'Could Not Generate SOP');
    }
  };

  useEffect(() => {
    if (user) loadDocuments(user.id);
  }, [user?.id]);

  useEffect(() => {
    if (scholarshipId) {
      draftStore.getApplicationDraft(scholarshipId).then(draft => {
        if (draft && draft.sopContent) {
          setSopContent(draft.sopContent);
        }
      });
    }
  }, [scholarshipId]);

  useEffect(() => {
    if (scholarshipId && sopContent) {
      const timer = setTimeout(() => {
        draftStore.saveApplicationDraft(scholarshipId, {
          sopContent,
          packageTier,
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [scholarshipId, sopContent, packageTier]);

  const STEPS = ['Info', 'Docs', 'SOP', 'Review'];

  const handleOpenDocModal = (docLabel: string) => {
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
    const existing = documents.find(d => d.document_type === docType);

    setActiveDocType(docType);
    setActiveDocLabel(docLabel);
    setCloudUrlInput(existing?.cloud_url || existing?.file_url || '');
    setDocModalVisible(true);
  };

  const handleSaveDocModal = async () => {
    if (!user) return;
    const cleanUrl = cloudUrlInput.trim();

    if (!cleanUrl) {
      return toast.warning('Link Required', 'Please paste a valid Google Drive, OneDrive, or Dropbox shareable link.');
    }

    const validation = validateCloudDocumentUrl(cleanUrl);
    if (!validation.isValid) {
      return toast.warning('Invalid Document Link', validation.error || 'Please provide a secure https:// link from Google Drive, OneDrive, Dropbox, or iCloud.');
    }

    setSubmittingDoc(true);
    try {
      await uploadDocument({
        userId: user.id,
        documentType: activeDocType,
        cloudUrl: validation.sanitizedUrl || cleanUrl,
        fileName: activeDocLabel,
      });
      setDocModalVisible(false);
      toast.success('Link Saved! 📁', `${activeDocLabel} cloud document attached.`);
      loadDocuments(user.id);
    } catch (e: any) {
      showError(e, 'Failed to Save');
    } finally {
      setSubmittingDoc(false);
    }
  };

  const handleSubmit = async () => {
    if (loading) return;
    if (!user || !scholarshipId || !packageTier) return;
    setLoading(true);
    try {
      await createApplication(
        user.id,
        scholarshipId,
        packageTier,
        sopContent
      );

      // Clear local draft upon submission
      draftStore.clearApplicationDraft(scholarshipId);

      toast.success('Application Submitted! 🎉', 'Your application is on its way to the review team.');
      router.replace(`/(scholarships)/${scholarshipId}?applied=true`);
    } catch (e: any) {
      showError(e, 'Application Submission Failed');
    } finally {
      setLoading(false);
    }
  };

  const requiredDocs = ['Degree Certificate', 'Official Transcript', 'Passport Copy', 'IELTS Certificate', 'CV / Resume', 'Reference Letter 1', 'Reference Letter 2'];

  const refLetterCount = documents.filter(d => d.document_type === 'reference_letter').length;
  const allDocsUploaded =
    (['degree_certificate', 'transcript', 'passport', 'ielts_certificate', 'cv'] as DocumentType[])
      .every(t => documents.some(d => d.document_type === t)) && refLetterCount >= 2;

  const handleContinue = async () => {
    if (step === 2 && !allDocsUploaded) {
      toast.warning('Documents Incomplete', 'Some credentials are missing. You can add them now, or continue and complete them later.');
    }
    setStep(s => s + 1);
  };

  const targetSch = (scholarships || []).find(s => s.id === scholarshipId);
  const packageLabel = packageTier ? (TIER_NAMES[packageTier] || packageTier) : 'Standard Full-Cycle';

  return (
    <SafeAreaView style={CommonStyles.screenBg}>
      <View style={applyStyles.header}>
        <TouchableOpacity style={applyStyles.backBtn} onPress={() => step > 1 ? setStep(s => s - 1) : (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={applyStyles.title}>Your Application</Text>
      </View>

      <Text style={applyStyles.subtitle}>
        Selected Package: <Text style={{ color: Colors.goldDark, fontWeight: 'bold' }}>{packageLabel}</Text>
      </Text>

      {/* Steps Progress Header */}
      <View style={applyStyles.stepsRow}>
        {STEPS.map((s, idx) => (
          <React.Fragment key={s}>
            <View style={applyStyles.stepItem}>
              <View style={[applyStyles.stepCircle, step > idx + 1 ? applyStyles.stepDone : step === idx + 1 ? applyStyles.stepActive : applyStyles.stepInactive]}>
                {step > idx + 1 ? <Ionicons name="checkmark" size={14} color={Colors.white} /> : <Text style={[applyStyles.stepNum, step === idx + 1 && { color: Colors.blueDark }]}>{idx + 1}</Text>}
              </View>
              <Text style={[applyStyles.stepLabel, step === idx + 1 && { color: Colors.gold, fontWeight: 'bold' }]}>{s}</Text>
            </View>
            {idx < STEPS.length - 1 && <View style={[applyStyles.stepLine, step > idx + 1 && { backgroundColor: Colors.blue }]} />}
          </React.Fragment>
        ))}
      </View>

      <KeyboardAwareScreen style={{ flex: 1 }}>
        {step === 1 && (
          <View style={{ padding: Spacing.xl }}>
            <Text style={CommonStyles.sectionTitle}>Personal Information</Text>
            <Text style={applyStyles.intro}>Please confirm your profile details below. These will be submitted with your application.</Text>
            
            <View style={[CommonStyles.card, { marginTop: Spacing.lg, paddingVertical: Spacing.sm }]}>
              <View style={applyStyles.infoRow}>
                <Text style={applyStyles.infoLabel}>Full Name</Text>
                <Text style={applyStyles.infoValue} numberOfLines={1} ellipsizeMode="tail">{user?.full_name || 'Not provided'}</Text>
              </View>
              <View style={applyStyles.infoRow}>
                <Text style={applyStyles.infoLabel}>Email</Text>
                <Text style={applyStyles.infoValue} numberOfLines={1} ellipsizeMode="middle">{user?.email || 'Not provided'}</Text>
              </View>
              <View style={applyStyles.infoRow}>
                <Text style={applyStyles.infoLabel}>Phone</Text>
                <Text style={applyStyles.infoValue}>{user?.phone || 'Not provided'}</Text>
              </View>
              <View style={applyStyles.infoRow}>
                <Text style={applyStyles.infoLabel}>Nationality</Text>
                <Text style={applyStyles.infoValue}>{(user as any)?.nationality || 'Ethiopian'}</Text>
              </View>
              <View style={[applyStyles.infoRow, { borderBottomWidth: 0 }]}>
                <Text style={applyStyles.infoLabel}>Target Countries</Text>
                <Text style={applyStyles.infoValue} numberOfLines={2}>{user?.target_countries?.join(', ') || 'Global'}</Text>
              </View>
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={{ padding: Spacing.xl }}>
            <View style={applyStyles.successBanner}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.green} />
              <Text style={applyStyles.successText}>Personal info confirmed — step 1 complete!</Text>
            </View>

            {/* Google Drive Submission Notice */}
            <View style={{ backgroundColor: '#eff6ff', borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: '#bfdbfe', flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: Spacing.lg }}>
              <Ionicons name="logo-google" size={24} color={Colors.blue} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: Typography.sm, fontWeight: 'bold', color: Colors.blue }}>Google Drive Document Submission</Text>
                <Text style={{ fontSize: 11, color: Colors.textSecondary, marginTop: 2 }}>
                  Upload your documents to Google Drive, set access to "Anyone with the link can view", and paste the shareable links below.
                </Text>
              </View>
            </View>

            <Text style={CommonStyles.sectionTitle}>Required Credentials & Links</Text>
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
              const refCount = documents.filter(d => d.document_type === 'reference_letter').length;
              const uploaded = doc === 'Reference Letter 1'
                ? refCount >= 1
                : doc === 'Reference Letter 2'
                  ? refCount >= 2
                  : documents.some(d => d.document_type === mappedType);

              return (
                <TouchableOpacity 
                  key={doc} 
                  style={[applyStyles.docRow, !uploaded && applyStyles.docRowMissing]} 
                  onPress={() => handleOpenDocModal(doc)} 
                  activeOpacity={0.8}
                >
                  <View style={[applyStyles.docIcon, { backgroundColor: uploaded ? Colors.blueLight : Colors.orangeLight }]}>
                    <Ionicons 
                      name={uploaded ? "checkmark-circle-outline" : "logo-google"} 
                      size={20} 
                      color={uploaded ? Colors.blue : Colors.orange} 
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[applyStyles.docName, !uploaded && { color: Colors.orange }]}>{doc}</Text>
                    <Text style={[applyStyles.docMeta, !uploaded && { color: Colors.orange }]}>
                      {uploaded 
                        ? 'Google Drive Link Added ✓' 
                        : 'Tap to add Google Drive Link — Required'}
                    </Text>
                  </View>
                  {uploaded
                    ? <View style={applyStyles.checkCircle}><Ionicons name="checkmark" size={12} color={Colors.green} /></View>
                    : <View style={applyStyles.crossCircle}><Ionicons name="add" size={14} color={Colors.orange} /></View>}
                </TouchableOpacity>
              );
            })}
          </View>
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

            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md }}>
              <Button 
                title="AI Starter" 
                variant="outline" 
                fullWidth={false}
                onPress={handleGenerateStarter}
                loading={isGeneratingMagicSOP}
                style={{ flex: 1 }}
              />
              <Button 
                title="Get AI Feedback" 
                variant="outline" 
                fullWidth={false}
                onPress={async () => {
                  if (!sopContent || sopContent.length < 50) {
                    toast.warning('Draft too short', 'Write at least 50 characters to review.');
                    return;
                  }
                  try {
                    const review = await reviewSOP(sopContent, scholarshipId);
                    if (review) {
                      toast.info(`Score: ${review.score}/100`, review.feedback);
                    }
                  } catch (e: any) {
                    showError(e, 'SOP Review Failed');
                  }
                }}
                loading={isReviewingSOP}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        )}

        {step === 4 && (
          <View style={{ padding: Spacing.xl }}>
            <View style={{ alignItems: 'center', marginBottom: Spacing.lg }}>
              <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm }}>
                <Ionicons name="shield-checkmark" size={32} color={Colors.blue} />
              </View>
              <Text style={applyStyles.title}>Review & Submit</Text>
              <Text style={[applyStyles.intro, { textAlign: 'center', marginTop: 4 }]}>
                Please review your application summary below. Our advisory team will review your profile & credentials immediately upon submission.
              </Text>
            </View>

            {/* Application Summary Card */}
            <View style={[CommonStyles.card, { padding: Spacing.lg, marginBottom: Spacing.lg }]}>
              <Text style={{ fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.text, marginBottom: Spacing.md }}>
                Application Summary
              </Text>

              <View style={applyStyles.summaryRow}>
                <Text style={applyStyles.summaryLabel}>Scholarship</Text>
                <Text style={applyStyles.summaryValue}>{targetSch?.name || scholarshipId || 'Direct Program Application'}</Text>
              </View>

              <View style={applyStyles.summaryRow}>
                <Text style={applyStyles.summaryLabel}>Support Tier</Text>
                <Text style={[applyStyles.summaryValue, { color: Colors.goldDark, fontWeight: 'bold' }]}>
                  {packageLabel}
                </Text>
              </View>

              <View style={applyStyles.summaryRow}>
                <Text style={applyStyles.summaryLabel}>Applicant</Text>
                <Text style={applyStyles.summaryValue}>{user?.full_name || user?.email || 'Student'}</Text>
              </View>

              <View style={applyStyles.summaryRow}>
                <Text style={applyStyles.summaryLabel}>Documents Attached</Text>
                <Text style={applyStyles.summaryValue}>{documents.length} / {requiredDocs.length} credential links</Text>
              </View>

              <View style={[applyStyles.summaryRow, { borderBottomWidth: 0 }]}>
                <Text style={applyStyles.summaryLabel}>SOP Draft</Text>
                <Text style={applyStyles.summaryValue}>
                  {sopContent?.trim() ? `${sopContent.trim().split(/\s+/).length} words` : 'Draft will be finalized with consultant'}
                </Text>
              </View>
            </View>

            {/* Reassurance Banner */}
            <View style={{ backgroundColor: '#f0fdf4', borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: '#bbf7d0', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="checkmark-circle" size={22} color={Colors.green} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: Typography.sm, fontWeight: 'bold', color: '#166534' }}>Direct Consultant Assignment</Text>
                <Text style={{ fontSize: 11, color: '#166534', marginTop: 2 }}>
                  Once submitted, an expert consultant will review your documentation and connect with you to begin the application cycle.
                </Text>
              </View>
            </View>
          </View>
        )}
      </KeyboardAwareScreen>

      {/* Google Drive Link Modal */}
      <Modal visible={docModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: Colors.white, borderTopLeftRadius: Radius['2xl'], borderTopRightRadius: Radius['2xl'], padding: Spacing.xl, paddingBottom: Math.max(insets.bottom + 16, Spacing.xl), maxHeight: '85%' }}>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="logo-google" size={20} color={Colors.blue} />
                </View>
                <View>
                  <Text style={{ fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.text }}>{activeDocLabel}</Text>
                  <Text style={{ fontSize: 11, color: Colors.blue, fontWeight: '600' }}>Google Drive Link Submission</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setDocModalVisible(false)} style={{ padding: 4 }}>
                <Ionicons name="close-circle" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Step-by-Step Instructions */}
            <View style={{ backgroundColor: '#f0f9ff', borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: '#bae6fd', marginBottom: Spacing.lg }}>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#0369a1', marginBottom: 6 }}>How to provide your link:</Text>
              <Text style={{ fontSize: 11, color: '#0c4a6e', marginBottom: 4 }}>1. Upload your <Text style={{ fontWeight: 'bold' }}>{activeDocLabel}</Text> (PDF / image) to Google Drive.</Text>
              <Text style={{ fontSize: 11, color: '#0c4a6e', marginBottom: 4 }}>2. In Google Drive, tap <Text style={{ fontWeight: 'bold' }}>Share</Text> → change access to <Text style={{ fontWeight: 'bold' }}>"Anyone with the link can view"</Text>.</Text>
              <Text style={{ fontSize: 11, color: '#0c4a6e' }}>3. Copy the link and paste it in the field below.</Text>
            </View>

            <Text style={{ fontSize: 12, fontWeight: 'bold', color: Colors.text, marginBottom: 6 }}>
              Shareable Google Drive Link:
            </Text>

            <View style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'center', marginBottom: Spacing.xl }}>
              <TextInput
                value={cloudUrlInput}
                onChangeText={setCloudUrlInput}
                placeholder="https://drive.google.com/file/d/..."
                placeholderTextColor={Colors.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                style={{ flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, backgroundColor: '#f8fafc', fontSize: 13, color: Colors.text }}
              />
              <TouchableOpacity 
                onPress={async () => {
                  const clip = await Clipboard.getStringAsync();
                  if (clip && clip.startsWith('http')) {
                    setCloudUrlInput(clip.trim());
                    toast.success('Link Pasted! 📋', 'Google Drive URL pasted from clipboard.');
                  } else {
                    toast.warning('No Link in Clipboard', 'Please copy a valid Google Drive URL first.');
                  }
                }}
                style={{ backgroundColor: Colors.blueLight, borderWidth: 1, borderColor: '#bfdbfe', borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 14 }}
              >
                <Ionicons name="clipboard-outline" size={18} color={Colors.blue} />
              </TouchableOpacity>
            </View>

            <Button
              title={submittingDoc ? 'Saving Link...' : 'Save Google Drive Link'}
              variant="primary"
              onPress={handleSaveDocModal}
              loading={submittingDoc}
            />
          </View>
        </View>
      </Modal>

      <View style={[applyStyles.bottomBar, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
        <Button title={step === 1 ? 'Cancel' : '← Back'} variant="secondary" onPress={() => step > 1 ? setStep(s => s - 1) : (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))} style={{ flex: 0.5 }} fullWidth={false} />
        <Button 
          title={step === 4 ? 'Submit Application 🚀' : 'Continue →'} 
          variant="primary" 
          onPress={step < 4 ? handleContinue : handleSubmit} 
          loading={loading} 
          style={{ flex: 1 }} 
          fullWidth={false} 
        />
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
  stepLabel: { fontSize: 10, fontWeight: Typography.semibold, color: Colors.textSecondary, textAlign: 'center', width: 55 },
  stepLine: { flex: 1, height: 2, backgroundColor: Colors.border, marginBottom: 14 },
  successBanner: { marginBottom: Spacing.sm, backgroundColor: '#f0fdf4', borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: '#bbf7d0', flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  successText: { fontSize: Typography.base, color: '#166534', flex: 1 },
  docRow: { marginBottom: Spacing.sm, backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  docRowMissing: { borderColor: '#fca5a5', backgroundColor: '#fff5f5' },
  docIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  docName: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.text },
  docMeta: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  checkCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.greenLight, alignItems: 'center', justifyContent: 'center' },
  crossCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.orangeLight, alignItems: 'center', justifyContent: 'center' },
  bottomBar: { padding: Spacing.lg, backgroundColor: Colors.card, borderTopWidth: 1, borderTopColor: Colors.border, flexDirection: 'row', gap: Spacing.sm },
  intro: { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 20 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: Spacing.md },
  infoLabel: { color: Colors.textSecondary, fontSize: Typography.sm, fontWeight: Typography.medium, flexShrink: 0, minWidth: 95 },
  infoValue: { color: Colors.text, fontWeight: 'bold', fontSize: Typography.sm, flex: 1, textAlign: 'right' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: Spacing.md },
  summaryLabel: { color: Colors.textSecondary, fontSize: Typography.sm, fontWeight: Typography.medium, flexShrink: 0 },
  summaryValue: { color: Colors.text, fontWeight: '600', fontSize: Typography.sm, flex: 1, textAlign: 'right' },
  sopInput: { minHeight: 250, backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, marginTop: Spacing.lg, fontSize: Typography.base, color: Colors.text, textAlignVertical: 'top' },
});
