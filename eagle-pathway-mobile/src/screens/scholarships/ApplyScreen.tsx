import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Modal, ActivityIndicator, Linking, Alert
} from 'react-native';
import { toast } from '@/utils/toast';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { Button } from '@/components/common';
import { KeyboardAwareScreen } from '@/components/KeyboardAwareScreen';
import { paymentsService } from '@/services/payments';
import { useAuthStore } from '@/store/authStore';
import { useScholarshipStore } from '@/store/scholarshipStore';
import { useDocumentStore } from '@/store/documentStore';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { PACKAGE_PRICING, formatEtb } from '@/constants/packages';
import { PAYMENT_ACCOUNTS } from '@/constants/paymentAccounts';
import type { PackageTier, DocumentType } from '@/types';
import { showError, getErrorMessage } from '@/utils/errorHandler';
import { draftStore } from '@/services/draftStore';

export function ApplyScreen() {
  const { scholarshipId, packageTier } = useLocalSearchParams<{ scholarshipId: string; packageTier: PackageTier }>();
  const { user } = useAuthStore();
  const { scholarships, createApplication, reviewSOP, isReviewingSOP, generateMagicSOP, isGeneratingMagicSOP } = useScholarshipStore();
  const { loadDocuments, uploadDocument, documents } = useDocumentStore();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<number>(1);
  const [sopContent, setSopContent] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [verificationProgressStep, setVerificationProgressStep] = useState('Connecting to Bank Gateway...');
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationOutcome, setVerificationOutcome] = useState<any>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  // Zero-Storage Cloud Link & Text Credential Modal State
  const [docModalVisible, setDocModalVisible] = useState(false);
  const [activeDocType, setActiveDocType] = useState<DocumentType>('degree_certificate');
  const [activeDocLabel, setActiveDocLabel] = useState('Degree Certificate');
  const [cloudUrlInput, setCloudUrlInput] = useState('');
  const [textContentInput, setTextContentInput] = useState('');
  const [docInputTab, setDocInputTab] = useState<'link' | 'text'>('link');
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
      showError(e, 'Failed to Generate Starter');
    }
  };

  useEffect(() => { if (user) loadDocuments(user.id); }, [user?.id]);

  useEffect(() => {
    if (scholarshipId) {
      draftStore.getApplicationDraft(scholarshipId).then(draft => {
        if (draft) {
          if (draft.sopContent) setSopContent(draft.sopContent);
          if (draft.transactionId) setTransactionId(draft.transactionId);
          if (draft.selectedPaymentMethod) setSelectedPaymentMethod(draft.selectedPaymentMethod);
        }
      });
    }
  }, [scholarshipId]);

  useEffect(() => {
    if (scholarshipId && (sopContent || transactionId || selectedPaymentMethod)) {
      const timer = setTimeout(() => {
        draftStore.saveApplicationDraft(scholarshipId, {
          sopContent,
          transactionId,
          selectedPaymentMethod,
          packageTier,
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [scholarshipId, sopContent, transactionId, selectedPaymentMethod, packageTier]);

  const STEPS = ['Info', 'Docs', 'SOP', 'Pay', 'Final'];

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
    setTextContentInput(existing?.text_content || '');
    setDocInputTab(existing?.text_content && !existing?.cloud_url ? 'text' : 'link');
    setDocModalVisible(true);
  };

  const handleSaveDocModal = async () => {
    if (!user) return;
    const cleanUrl = cloudUrlInput.trim();
    const cleanText = textContentInput.trim();

    if (docInputTab === 'link' && !cleanUrl) {
      return toast.warning('Link Required', 'Please enter a valid Google Drive, OneDrive, or cloud link.');
    }
    if (docInputTab === 'text' && !cleanText) {
      return toast.warning('Text Required', 'Please enter your credential details or scores.');
    }

    setSubmittingDoc(true);
    try {
      await uploadDocument({
        userId: user.id,
        documentType: activeDocType,
        cloudUrl: docInputTab === 'link' ? cleanUrl : undefined,
        textContent: docInputTab === 'text' ? cleanText : undefined,
        fileName: activeDocLabel,
      });
      setDocModalVisible(false);
      toast.success('Saved to Application', `${activeDocLabel} updated!`);
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
      toast.warning('Documents Incomplete', 'Some required credentials are missing. You can add them now, or continue and complete them later.');
      setStep(s => s + 1);
      return;
    }

    if (step === 4) {
      if (!selectedPaymentMethod) {
        toast.warning('Payment Method Required', 'Please select a payment method before continuing.');
        return;
      }
      if (!transactionId || !transactionId.trim()) {
        toast.warning('Transaction Reference Required', 'Please enter your bank Transaction ID or Telebirr reference code.');
        return;
      }

      if (!user || !packageTier) return;
      setIsVerifyingPayment(true);
      setVerificationError(null);
      setVerificationProgressStep('Connecting to Bank Gateway...');

      const method = selectedPaymentMethod.includes('Telebirr') ? 'telebirr' : 'cbe';
      const expectedAmount = PACKAGE_PRICING[packageTier].etb;
      const cleanTxnId = transactionId.trim();

      await new Promise(r => setTimeout(r, 500));
      setVerificationProgressStep(`🏦 Querying ${method === 'telebirr' ? 'Telebirr' : 'CBE'} Bank Records for ${cleanTxnId}...`);

      try {
        const res = await paymentsService.submitPaymentReceipt({
          userId: user.id,
          paymentType: 'scholarship_package',
          method,
          amount: expectedAmount,
          transactionId: cleanTxnId,
        });

        setIsVerifyingPayment(false);

        if (res.verification.status === 'rejected') {
          setVerificationError(res.verification.reason);
          toast.error('Verification Failed ❌', res.verification.reason);
          return;
        }

        // Clear local draft upon submission
        if (scholarshipId) {
          draftStore.clearApplicationDraft(scholarshipId);
        }

        setVerificationOutcome({
          ...res.verification,
          effectiveTxnId: cleanTxnId,
          method,
          expectedAmount,
        });
        setShowVerificationModal(true);
      } catch (e: any) {
        setIsVerifyingPayment(false);
        const msg = getErrorMessage(e);
        setVerificationError(msg);
        showError(e, 'Verification Error');
      }
      return;
    }

    setStep(s => s + 1);
  };

  return (
    <SafeAreaView style={CommonStyles.screenBg}>
      <View style={applyStyles.header}>
        <TouchableOpacity style={applyStyles.backBtn} onPress={() => step > 1 ? setStep(s => s - 1) : (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={applyStyles.title}>Your Application</Text>
      </View>

      <Text style={applyStyles.subtitle}>
        Package: {packageTier ? packageTier.toUpperCase() : 'STANDARD'} • ETB {packageTier ? formatEtb(PACKAGE_PRICING[packageTier].etb) : '0'}
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
            
            <View style={[CommonStyles.card, { marginTop: Spacing.lg }]}>
              <View style={applyStyles.infoRow}>
                <Text style={applyStyles.infoLabel}>Full Name</Text>
                <Text style={applyStyles.infoValue}>{user?.full_name || 'Not provided'}</Text>
              </View>
              <View style={applyStyles.infoRow}>
                <Text style={applyStyles.infoLabel}>Email</Text>
                <Text style={applyStyles.infoValue}>{user?.email || 'Not provided'}</Text>
              </View>
              <View style={applyStyles.infoRow}>
                <Text style={applyStyles.infoLabel}>Phone Number</Text>
                <Text style={applyStyles.infoValue}>{user?.phone || 'Not provided'}</Text>
              </View>
              <View style={applyStyles.infoRow}>
                <Text style={applyStyles.infoLabel}>Nationality</Text>
                <Text style={applyStyles.infoValue}>{(user as any)?.nationality || 'Ethiopian'}</Text>
              </View>
              <View style={[applyStyles.infoRow, { borderBottomWidth: 0 }]}>
                <Text style={applyStyles.infoLabel}>Target Countries</Text>
                <Text style={applyStyles.infoValue}>{user?.target_countries?.join(', ') || 'Global'}</Text>
              </View>
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={{ padding: Spacing.xl }}>
            <View style={applyStyles.successBanner}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.green} />
              <Text style={applyStyles.successText}>Personal info collected — step 1 complete!</Text>
            </View>

            {/* Zero-Storage Cloud Notice */}
            <View style={{ backgroundColor: '#eff6ff', borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: '#bfdbfe', flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: Spacing.lg }}>
              <Ionicons name="cloud-done-outline" size={22} color={Colors.blue} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: Typography.sm, fontWeight: 'bold', color: Colors.blue }}>100% Zero-Storage Cloud Vault</Text>
                <Text style={{ fontSize: 11, color: Colors.textSecondary, marginTop: 2 }}>
                  Paste shareable Google Drive / OneDrive links or enter text credentials. Fast, private, and 0 device storage needed.
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
              const refLetterCount = documents.filter(d => d.document_type === 'reference_letter').length;
              const uploaded = doc === 'Reference Letter 1'
                ? refLetterCount >= 1
                : doc === 'Reference Letter 2'
                  ? refLetterCount >= 2
                  : documents.some(d => d.document_type === mappedType);

              const docRecord = documents.find(d => d.document_type === mappedType);
              const isCloud = docRecord?.cloud_url || docRecord?.file_path === 'cloud_link';
              const isText = Boolean(docRecord?.text_content);

              return (
                <TouchableOpacity 
                  key={doc} 
                  style={[applyStyles.docRow, !uploaded && applyStyles.docRowMissing]} 
                  onPress={() => handleOpenDocModal(doc)} 
                  activeOpacity={0.8}
                >
                  <View style={[applyStyles.docIcon, { backgroundColor: uploaded ? Colors.blueLight : Colors.orangeLight }]}>
                    <Ionicons 
                      name={isCloud ? "link-outline" : isText ? "document-text-outline" : uploaded ? "checkmark-circle-outline" : "add-circle-outline"} 
                      size={20} 
                      color={uploaded ? Colors.blue : Colors.orange} 
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[applyStyles.docName, !uploaded && { color: Colors.orange }]}>{doc}</Text>
                    <Text style={[applyStyles.docMeta, !uploaded && { color: Colors.orange }]}>
                      {uploaded 
                        ? (isCloud ? 'Google Drive Link Added ✓' : isText ? 'Text Credentials Saved ✓' : 'Linked ✓') 
                        : 'Tap to add Google Drive Link / Text — Required'}
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
            <Text style={CommonStyles.sectionTitle}>Payment & Activation</Text>
            <Text style={applyStyles.intro}>Select your payment method and enter your bank transaction reference ID.</Text>

            <View style={applyStyles.paymentCard}>
              <Text style={applyStyles.paymentLabel}>Choose Payment Method</Text>
              
              {['Telebirr SuperApp', 'Commercial Bank of Ethiopia (CBE)'].map(method => (
                <TouchableOpacity
                  key={method}
                  style={applyStyles.methodRow}
                  onPress={() => setSelectedPaymentMethod(method)}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={method.includes('Telebirr') ? 'phone-portrait-outline' : 'business-outline'} 
                    size={22} 
                    color={selectedPaymentMethod === method ? Colors.blue : Colors.textSecondary} 
                  />
                  <Text style={[applyStyles.methodName, selectedPaymentMethod === method && { color: Colors.blue, fontWeight: 'bold' }]}>
                    {method}
                  </Text>
                  <View style={[applyStyles.radio, selectedPaymentMethod === method && { borderColor: Colors.blue, borderWidth: 6 }]} />
                </TouchableOpacity>
              ))}

              {selectedPaymentMethod && (
                <View style={{ marginTop: Spacing.lg, padding: Spacing.lg, backgroundColor: Colors.blueLight, borderRadius: Radius.lg, borderWidth: 1, borderColor: '#bfdbfe' }}>
                  <Text style={{ fontSize: Typography.sm, fontWeight: 'bold', color: Colors.blue, marginBottom: Spacing.sm }}>
                    Official Eagle Pathway Payment Account
                  </Text>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs }}>
                    <Text style={{ fontSize: 13, color: Colors.textSecondary }}>Account Holder</Text>
                    <Text style={{ fontSize: 13, fontWeight: 'bold', color: Colors.text }}>
                      {selectedPaymentMethod.includes('Telebirr') ? PAYMENT_ACCOUNTS.telebirr.name : PAYMENT_ACCOUNTS.cbe.name}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs }}>
                    <Text style={{ fontSize: 13, color: Colors.textSecondary }}>
                      {selectedPaymentMethod.includes('Telebirr') ? 'Telebirr Phone' : 'CBE Account No.'}
                    </Text>
                    <Text style={{ fontSize: 15, fontWeight: 'bold', color: Colors.blue }}>
                      {selectedPaymentMethod.includes('Telebirr') ? PAYMENT_ACCOUNTS.telebirr.accountNumber : PAYMENT_ACCOUNTS.cbe.accountNumber}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm }}>
                    <Text style={{ fontSize: 13, color: Colors.textSecondary }}>Exact Amount Due</Text>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: Colors.blue }}>
                      ETB {packageTier ? formatEtb(PACKAGE_PRICING[packageTier].etb) : '0'}
                    </Text>
                  </View>

                  <Text style={{ fontSize: 11, color: Colors.textSecondary, fontStyle: 'italic', marginTop: 4 }}>
                    💡 {selectedPaymentMethod.includes('Telebirr') ? PAYMENT_ACCOUNTS.telebirr.instruction : PAYMENT_ACCOUNTS.cbe.instruction}
                  </Text>
                </View>
              )}

              {selectedPaymentMethod && (
                <View style={{ marginTop: Spacing.lg }}>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: Spacing.xs }}>
                    Transaction Reference ID * (Required)
                  </Text>
                  <View style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'center', marginBottom: Spacing.md }}>
                    <TextInput 
                      value={transactionId}
                      onChangeText={setTransactionId}
                      placeholder={selectedPaymentMethod.includes('Telebirr') ? 'e.g. DHE0RRRPZO' : 'e.g. FT26222VM9M4'}
                      style={{ flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, backgroundColor: Colors.white }}
                    />
                    <TouchableOpacity 
                      onPress={async () => {
                        const clipText = await Clipboard.getStringAsync();
                        if (clipText && clipText.trim().length > 0) {
                          setTransactionId(clipText.trim());
                          toast.success('Ref ID Pasted! 📋', `Pasted "${clipText.trim()}" from clipboard.`);
                        } else {
                          toast.warning('Clipboard Empty', 'No text found in clipboard to paste.');
                        }
                      }}
                      style={{ backgroundColor: Colors.blueLight, borderWidth: 1, borderColor: '#bfdbfe', borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 4 }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="clipboard-outline" size={16} color={Colors.blue} />
                      <Text style={{ fontSize: 13, fontWeight: 'bold', color: Colors.blue }}>Paste</Text>
                    </TouchableOpacity>
                  </View>

                  {verificationError && (
                    <View style={{ marginTop: Spacing.xs, marginBottom: Spacing.md, padding: Spacing.md, backgroundColor: '#fef2f2', borderRadius: Radius.md, borderWidth: 1, borderColor: '#fca5a5', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name="alert-circle-outline" size={20} color={Colors.red} />
                      <Text style={{ fontSize: 12, color: Colors.red, flex: 1, fontWeight: '500' }}>
                        {verificationError}
                      </Text>
                    </View>
                  )}

                  <View style={applyStyles.paymentInfo}>
                    <Ionicons name="shield-checkmark-outline" size={16} color={Colors.blue} style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 12, color: Colors.textSecondary, flex: 1 }}>
                      Bank Source of Truth Verification: Your transaction code will be validated directly against official {selectedPaymentMethod} records.
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
              <Text>• Payment Status: {verificationOutcome?.status === 'verified' ? 'Verified ✅' : 'Submitted (Pending Review) ⏳'}</Text>
            </View>
          </View>
        )}
      </KeyboardAwareScreen>

      {/* Zero-Storage Cloud Link & Text Credential Modal */}
      <Modal visible={docModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: Colors.white, borderTopLeftRadius: Radius['2xl'], borderTopRightRadius: Radius['2xl'], padding: Spacing.xl, paddingBottom: Math.max(insets.bottom + 16, Spacing.xl), maxHeight: '85%' }}>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
              <View>
                <Text style={{ fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.text }}>{activeDocLabel}</Text>
                <Text style={{ fontSize: 12, color: Colors.blue, fontWeight: '600' }}>Zero-Storage Cloud Mode ☁️</Text>
              </View>
              <TouchableOpacity onPress={() => setDocModalVisible(false)} style={{ padding: 4 }}>
                <Ionicons name="close-circle" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Tab Selector */}
            <View style={{ flexDirection: 'row', backgroundColor: Colors.grayLight, borderRadius: Radius.md, padding: 4, marginBottom: Spacing.lg }}>
              <TouchableOpacity 
                onPress={() => setDocInputTab('link')} 
                style={{ flex: 1, paddingVertical: 8, borderRadius: Radius.sm, backgroundColor: docInputTab === 'link' ? Colors.white : 'transparent', alignItems: 'center' }}
              >
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: docInputTab === 'link' ? Colors.blue : Colors.textSecondary }}>
                  🔗 Cloud Link
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setDocInputTab('text')} 
                style={{ flex: 1, paddingVertical: 8, borderRadius: Radius.sm, backgroundColor: docInputTab === 'text' ? Colors.white : 'transparent', alignItems: 'center' }}
              >
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: docInputTab === 'text' ? Colors.blue : Colors.textSecondary }}>
                  📝 Text / Scores
                </Text>
              </TouchableOpacity>
            </View>

            {docInputTab === 'link' ? (
              <View>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: Colors.text, marginBottom: 4 }}>
                  Google Drive / OneDrive / Dropbox Link
                </Text>
                <Text style={{ fontSize: 11, color: Colors.textSecondary, marginBottom: Spacing.sm }}>
                  Make sure link access is set to "Anyone with the link can view".
                </Text>
                
                <View style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'center', marginBottom: Spacing.lg }}>
                  <TextInput
                    value={cloudUrlInput}
                    onChangeText={setCloudUrlInput}
                    placeholder="https://drive.google.com/file/d/..."
                    autoCapitalize="none"
                    keyboardType="url"
                    style={{ flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, backgroundColor: '#f8fafc', fontSize: 13 }}
                  />
                  <TouchableOpacity 
                    onPress={async () => {
                      const clip = await Clipboard.getStringAsync();
                      if (clip && clip.startsWith('http')) {
                        setCloudUrlInput(clip.trim());
                        toast.success('Link Pasted! 📋', 'Google Drive URL pasted from clipboard.');
                      } else {
                        toast.warning('No Link in Clipboard', 'Please copy a valid URL first.');
                      }
                    }}
                    style={{ backgroundColor: Colors.blueLight, borderWidth: 1, borderColor: '#bfdbfe', borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 14 }}
                  >
                    <Ionicons name="clipboard-outline" size={18} color={Colors.blue} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: Colors.text, marginBottom: 4 }}>
                  Credential Text, Scores, or Statements
                </Text>
                <Text style={{ fontSize: 11, color: Colors.textSecondary, marginBottom: Spacing.sm }}>
                  Enter GPA, IELTS band scores, or credential statements directly.
                </Text>
                <TextInput
                  value={textContentInput}
                  onChangeText={setTextContentInput}
                  placeholder="e.g. Cumulative GPA: 3.85 / 4.00, IELTS Overall: 7.5..."
                  multiline
                  style={{ borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, backgroundColor: '#f8fafc', fontSize: 13, minHeight: 110, textAlignVertical: 'top', marginBottom: Spacing.lg }}
                />
              </View>
            )}

            <Button
              title={submittingDoc ? 'Saving...' : 'Save Credential'}
              variant="primary"
              onPress={handleSaveDocModal}
              loading={submittingDoc}
            />
          </View>
        </View>
      </Modal>

      {/* 1. Live Step-by-Step Verification Loader Overlay */}
      <Modal visible={isVerifyingPayment} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: Spacing.xl }}>
          <View style={{ backgroundColor: Colors.white, borderRadius: Radius['2xl'], padding: Spacing.xl, width: '100%', alignItems: 'center', elevation: 10 }}>
            <ActivityIndicator size="large" color={Colors.blue} style={{ marginBottom: Spacing.lg }} />
            <Text style={{ fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.text, textAlign: 'center', marginBottom: Spacing.sm }}>
              Verifying Payment
            </Text>
            <Text style={{ fontSize: Typography.base, color: Colors.blue, fontWeight: '600', textAlign: 'center', marginBottom: Spacing.lg }}>
              {verificationProgressStep}
            </Text>
            <View style={{ width: '100%', backgroundColor: Colors.grayLight, height: 4, borderRadius: 2, overflow: 'hidden' }}>
              <View style={{ width: '75%', backgroundColor: Colors.blue, height: '100%' }} />
            </View>
            <Text style={{ fontSize: Typography.xs, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.md }}>
              Validating against official bank source of truth...
            </Text>
          </View>
        </View>
      </Modal>

      {/* 2. Verification Results Outcome Modal */}
      <Modal visible={showVerificationModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ 
            backgroundColor: Colors.white, 
            borderTopLeftRadius: Radius['2xl'], 
            borderTopRightRadius: Radius['2xl'], 
            padding: Spacing.xl, 
            paddingBottom: Math.max(insets.bottom + 28, Spacing.xl),
            maxHeight: '90%' 
          }}>
            
            <View style={{ alignItems: 'center', marginBottom: Spacing.lg }}>
              <View style={{ 
                width: 64, 
                height: 64, 
                borderRadius: 32, 
                backgroundColor: verificationOutcome?.status === 'verified' ? '#dcfce7' : verificationOutcome?.status === 'rejected' ? '#fee2e2' : '#fef3c7', 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginBottom: Spacing.md 
              }}>
                <Ionicons 
                  name={verificationOutcome?.status === 'verified' ? 'checkmark-circle-outline' : verificationOutcome?.status === 'rejected' ? 'close-circle-outline' : 'time-outline'} 
                  size={40} 
                  color={verificationOutcome?.status === 'verified' ? '#166534' : verificationOutcome?.status === 'rejected' ? '#991b1b' : '#92400e'} 
                />
              </View>
              <Text style={{ fontSize: Typography['2xl'], fontWeight: Typography.bold, color: Colors.text, textAlign: 'center' }}>
                {verificationOutcome?.status === 'verified' ? 'Payment Verified 100% ✅' : verificationOutcome?.status === 'rejected' ? 'Verification Rejected ❌' : 'Payment Submitted ⏳'}
              </Text>
              <Text style={{ fontSize: Typography.sm, color: Colors.textSecondary, textAlign: 'center', marginTop: 4 }}>
                {verificationOutcome?.status === 'verified' 
                  ? 'Bank record confirmed. Ready for instant consultation.' 
                  : verificationOutcome?.status === 'rejected'
                  ? 'Transaction details do not match official account requirements.'
                  : 'Transaction recorded. Queued for 1-tap admin check.'}
              </Text>
            </View>

            {/* Verification Breakdown Card */}
            <View style={{ 
              backgroundColor: verificationOutcome?.status === 'verified' ? Colors.blueLight : verificationOutcome?.status === 'rejected' ? '#fef2f2' : '#fffbeb', 
              borderRadius: Radius.xl, 
              padding: Spacing.lg, 
              marginBottom: Spacing.xl, 
              borderWidth: 1, 
              borderColor: verificationOutcome?.status === 'verified' ? '#bfdbfe' : verificationOutcome?.status === 'rejected' ? '#fca5a5' : '#fde68a' 
            }}>
              <Text style={{ 
                fontSize: Typography.sm, 
                fontWeight: Typography.bold, 
                color: verificationOutcome?.status === 'verified' ? Colors.blue : verificationOutcome?.status === 'rejected' ? '#991b1b' : '#92400e', 
                marginBottom: Spacing.md 
              }}>
                {verificationOutcome?.status === 'verified' ? 'BANK VERIFICATION BREAKDOWN' : verificationOutcome?.status === 'rejected' ? 'REJECTION AUDIT REASON' : 'TRANSACTION SUBMISSION BREAKDOWN & STATUS'}
              </Text>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm }}>
                <Text style={{ fontSize: 13, color: Colors.textSecondary }}>Bank Provider</Text>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: Colors.text }}>
                  {verificationOutcome?.method === 'telebirr' ? 'Telebirr' : 'Commercial Bank of Ethiopia'}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm }}>
                <Text style={{ fontSize: 13, color: Colors.textSecondary }}>Transaction Reference</Text>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: Colors.blue }}>
                  {verificationOutcome?.effectiveTxnId}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm }}>
                <Text style={{ fontSize: 13, color: Colors.textSecondary }}>Beneficiary Account</Text>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: verificationOutcome?.status === 'verified' ? Colors.green : verificationOutcome?.status === 'rejected' ? '#991b1b' : Colors.text }}>
                  {verificationOutcome?.method === 'telebirr' ? PAYMENT_ACCOUNTS.telebirr.name : PAYMENT_ACCOUNTS.cbe.name} 
                  {verificationOutcome?.status === 'verified' ? ' (Confirmed ✅)' : verificationOutcome?.status === 'rejected' ? ' (Mismatch ❌)' : ' (Pending Admin Check ⏳)'}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm }}>
                <Text style={{ fontSize: 13, color: Colors.textSecondary }}>
                  {verificationOutcome?.status === 'verified' ? 'Verified Amount' : 'Package Fee Due'}
                </Text>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: verificationOutcome?.status === 'verified' ? Colors.blue : verificationOutcome?.status === 'rejected' ? '#991b1b' : '#b45309' }}>
                  ETB {verificationOutcome?.expectedAmount ? formatEtb(verificationOutcome.expectedAmount) : '0'} 
                  {verificationOutcome?.status === 'verified' ? ' (Confirmed ✅)' : verificationOutcome?.status === 'rejected' ? ' (Mismatch ❌)' : ' (Pending Admin Check ⏳)'}
                </Text>
              </View>

              <View style={{ 
                borderTopWidth: 1, 
                borderTopColor: verificationOutcome?.status === 'verified' ? '#bfdbfe' : verificationOutcome?.status === 'rejected' ? '#fca5a5' : '#fde68a', 
                paddingTop: Spacing.sm, 
                marginTop: Spacing.xs 
              }}>
                <Text style={{ fontSize: 12, color: verificationOutcome?.status === 'rejected' ? '#991b1b' : Colors.textSecondary, fontStyle: 'italic', fontWeight: verificationOutcome?.status === 'rejected' ? '600' : 'normal' }}>
                  {verificationOutcome?.reason || (verificationOutcome?.status === 'verified' 
                    ? 'Transaction confirmed 100% with official bank records.' 
                    : 'Transaction code recorded. Queued for fast admin verification.')}
                </Text>
              </View>
            </View>

            {verificationOutcome?.status === 'rejected' ? (
              <Button 
                title="Fix Reference ID 🔄" 
                variant="primary" 
                style={{ backgroundColor: '#991b1b' }}
                onPress={() => setShowVerificationModal(false)} 
              />
            ) : (
              <Button 
                title="Continue to Final Step →" 
                variant="primary" 
                onPress={() => {
                  setShowVerificationModal(false);
                  setStep(5);
                }} 
              />
            )}

          </View>
        </View>
      </Modal>

      <View style={[applyStyles.bottomBar, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
        <Button title={step === 1 ? 'Cancel' : '← Back'} variant="secondary" onPress={() => step > 1 ? setStep(s => s - 1) : (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))} style={{ flex: 0.5 }} fullWidth={false} />
        <Button 
          title={step === 4 ? (isVerifyingPayment ? 'Verifying with Bank...' : 'Verify Payment & Continue →') : step === 5 ? 'Confirm & Submit' : 'Continue →'} 
          variant="primary" 
          onPress={step < 5 ? handleContinue : handleSubmit} 
          loading={loading || isVerifyingPayment} 
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
  stepLabel: { fontSize: 9, fontWeight: Typography.semibold, color: Colors.textSecondary, textAlign: 'center', width: 50 },
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
