import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Alert, ActivityIndicator, Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { Button, ProgressBar, Card } from '@/components/common';
import { KeyboardAwareScreen } from '@/components/KeyboardAwareScreen';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store/authStore';
import { showError } from '@/utils/errorHandler';
import { useTutorJobStore } from '@/store/tutorJobStore';
import { tutorJobsService } from '@/services/tutorJobs';

const POLICY_URL = 'https://docs.google.com/document/d/1manAx_EUc8eIu4ScyddKyo1jdFAIwiQn2tZFunAqRdQ/edit?usp=sharing';

export function JobApplicationScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const { user, updateProfile } = useAuthStore();
  const { applyForJob, loadTutorApplication, tutorApplication } = useTutorJobStore();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [policyAgreed, setPolicyAgreed] = useState(false);

  const [form, setForm] = useState({
    educationStatus: '',
    livingAddress: '',
    universityName: '',
    phoneNumber: '',
    telegramUsername: '',
    cgpa: '',
  });

  const [grade10, setGrade10] = useState<{ uri: string; name: string } | null>(null);
  const [grade12, setGrade12] = useState<{ uri: string; name: string } | null>(null);
  const [transcript, setTranscript] = useState<{ uri: string; name: string } | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [showProfileGate, setShowProfileGate] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (user) {
      setForm({
        educationStatus: user.academic_summary || '',
        livingAddress: (user as any).living_address || '',
        universityName: (user as any).university_name || '',
        phoneNumber: (user as any).phone_number || user.phone || '',
        telegramUsername: (user as any).telegram_username || '',
        cgpa: (user as any).cgpa || '',
      });
      setShowProfileGate(!tutorJobsService.isJobProfileComplete(user as any));
      if (user) loadTutorApplication(user.id);
    }
  }, [user?.id]);

  useEffect(() => {
    if (tutorApplication) {
      setForm(prev => ({
        ...prev,
        educationStatus: prev.educationStatus || tutorApplication.education_status || '',
        livingAddress: prev.livingAddress || tutorApplication.living_address || '',
        universityName: prev.universityName || tutorApplication.university_name || '',
        phoneNumber: prev.phoneNumber || tutorApplication.phone_number || '',
        telegramUsername: prev.telegramUsername || tutorApplication.telegram_username || '',
        cgpa: prev.cgpa || tutorApplication.cgpa || '',
      }));
    }
  }, [tutorApplication]);

  const handlePickFile = async (type: 'grade10' | 'grade12' | 'transcript') => {
    try {
      const result = await tutorJobsService.pickDocument();
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      if (type === 'grade10') setGrade10({ uri: asset.uri, name: asset.name });
      else if (type === 'grade12') setGrade12({ uri: asset.uri, name: asset.name });
      else setTranscript({ uri: asset.uri, name: asset.name });
    } catch (e: any) {
      showError(e, 'Failed to Pick File');
    }
  };

  const saveProfileFields = async () => {
    if (!user) return;
    try {
      await updateProfile({
        academic_summary: form.educationStatus,
      } as any);
      await supabaseUpdateFields({
        living_address: form.livingAddress,
        university_name: form.universityName,
        phone_number: form.phoneNumber,
        telegram_username: form.telegramUsername.replace('@', ''),
        cgpa: form.cgpa,
      });
    } catch (e) {
      console.error('Failed to save profile fields:', e);
    }
  };

  const supabaseUpdateFields = async (fields: Record<string, string>) => {
    const { error } = await supabase
      .from('users')
      .update(fields)
      .eq('id', user?.id);
    if (error) console.error('Failed to update user fields:', error);
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!policyAgreed) {
      Alert.alert('Policy Required', 'Please read and agree to the Eagle Tutorials policy.');
      return;
    }
    setSaving(true);
    try {
      await saveProfileFields();

      if (jobId) {
        // Applying for a specific job
        const existingApp = useTutorJobStore.getState().tutorApplication;
        await applyForJob({
          jobPostId: jobId,
          applicantId: user.id,
          educationStatus: form.educationStatus,
          livingAddress: form.livingAddress,
          universityName: form.universityName,
          phoneNumber: form.phoneNumber,
          telegramUsername: form.telegramUsername,
          cgpa: form.cgpa,
          grade10Uri: grade10?.uri,
          grade10Name: grade10?.name,
          grade12Uri: grade12?.uri,
          grade12Name: grade12?.name,
          transcriptUri: transcript?.uri,
          transcriptName: transcript?.name,
          existingGrade10Url: existingApp?.grade10_result_url,
          existingGrade12Url: existingApp?.grade12_result_url,
          existingTranscriptUrl: existingApp?.transcript_url,
        });
        Alert.alert(
          'Application Submitted!',
          "We'll review your details and contact you via in-app chat or Telegram. Track your application status below.",
          [
            { text: 'View My Applications', onPress: () => router.replace('/my-applications' as any) },
            { text: 'OK', onPress: () => router.back() },
          ]
        );
      } else {
        // Submitting tutor profile application (no specific job)
        await useTutorJobStore.getState().createTutorApplication({
          tutorId: user.id,
          educationStatus: form.educationStatus,
          livingAddress: form.livingAddress,
          universityName: form.universityName,
          phoneNumber: form.phoneNumber,
          telegramUsername: form.telegramUsername,
          cgpa: form.cgpa,
          ...(grade10 && { grade10Uri: grade10.uri, grade10Name: grade10.name }),
          ...(grade12 && { grade12Uri: grade12.uri, grade12Name: grade12.name }),
          ...(transcript && { transcriptUri: transcript.uri, transcriptName: transcript.name }),
        });
        Alert.alert(
          'Profile Submitted!',
          'Your tutor profile has been submitted for review. We will notify you once your application is approved.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (e: any) {
      showError(e, 'Failed to Submit Application');
    } finally {
      setSaving(false);
    }
  };

  const renderProfileGate = () => (
    <View style={profStyles.gateContainer}>
      <Text style={profStyles.gateIcon}>✏️</Text>
      <Text style={profStyles.gateTitle}>Complete Your Profile First</Text>
      <Text style={profStyles.gateText}>
        Complete your profile first to apply for tutor jobs. We'll pre-fill your application with your existing info so you don't repeat yourself.
      </Text>
      <Button title="Complete Profile" onPress={() => router.push('/profile/edit')} variant="primary" />
      <TouchableOpacity onPress={() => router.back()} style={{ marginTop: Spacing.md }}>
        <Text style={{ color: Colors.textSecondary, fontSize: Typography.base }}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );

  if (showProfileGate) return <SafeAreaView style={CommonStyles.screenBg} edges={['top', 'bottom']}>{renderProfileGate()}</SafeAreaView>;

  return (
    <SafeAreaView style={CommonStyles.screenBg} edges={['top', 'bottom']}>
      <View style={profStyles.header}>
        <TouchableOpacity onPress={() => router.back()} style={profStyles.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={profStyles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={profStyles.headerTitle}>{jobId ? 'Apply for Job' : 'Tutor Application'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={profStyles.stepIndicator}>
        {['Info', 'Docs', 'Agree'].map((label, i) => (
          <View key={label} style={profStyles.stepItem}>
            <View style={[profStyles.stepCircle, step === i + 1 && profStyles.stepCircleActive, step > i + 1 && profStyles.stepCircleDone]}>
              <Text style={[profStyles.stepNumber, (step === i + 1 || step > i + 1) && profStyles.stepNumberActive]}>
                {step > i + 1 ? '✓' : i + 1}
              </Text>
            </View>
            <Text style={[profStyles.stepLabel, step === i + 1 && profStyles.stepLabelActive]}>{label}</Text>
          </View>
        ))}
      </View>

      <ProgressBar progress={(step / 3) * 100} color={Colors.blue} height={3} />

      <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 120 }}>
        {step === 1 && (
          <View>
            <Text style={profStyles.sectionTitle}>Step 1: {jobId ? 'Review Your Information' : 'Your Information'}</Text>
            <Text style={profStyles.sectionSub}>These are pre-filled from your profile. Edit if needed.</Text>

            <InputField label="Education Status" value={form.educationStatus} onChange={v => setForm({ ...form, educationStatus: v })} multiline placeholder="e.g. 3rd year Computer Science student" />
            <InputField label="Living Address" value={form.livingAddress} onChange={v => setForm({ ...form, livingAddress: v })} placeholder="e.g. Bole, Addis Ababa" />
            <InputField label="University/College Name" value={form.universityName} onChange={v => setForm({ ...form, universityName: v })} placeholder="e.g. Addis Ababa University" />
            <InputField label="Phone Number" value={form.phoneNumber} onChange={v => setForm({ ...form, phoneNumber: v })} keyboardType="phone-pad" placeholder="e.g. +251911223344" />
            <InputField label="Telegram Username" value={form.telegramUsername} onChange={v => setForm({ ...form, telegramUsername: v })} placeholder="your_username (without @)" prefix="@" />
            <InputField label="CGPA" value={form.cgpa} onChange={v => setForm({ ...form, cgpa: v })} placeholder="e.g. 3.5" />
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={profStyles.sectionTitle}>Step 2: Upload Documents</Text>
            <Text style={profStyles.sectionSub}>Upload your academic documents (PDF or image).</Text>

            <DocUploader
              label="Grade 10 National Exam Result"
              file={grade10}
              existingUrl={tutorApplication?.grade10_result_url}
              onPick={() => handlePickFile('grade10')}
              uploading={uploading === 'grade10'}
            />
            <DocUploader
              label="Grade 12 National Exam Result"
              file={grade12}
              existingUrl={tutorApplication?.grade12_result_url}
              onPick={() => handlePickFile('grade12')}
              uploading={uploading === 'grade12'}
            />
            <DocUploader
              label="Grade 9-12 Transcript"
              file={transcript}
              existingUrl={tutorApplication?.transcript_url}
              onPick={() => handlePickFile('transcript')}
              uploading={uploading === 'transcript'}
            />
          </View>
        )}

        {step === 3 && (
          <View>
            <Text style={profStyles.sectionTitle}>Step 3: Policy Agreement</Text>
            <View style={profStyles.policyCard}>
              <Text style={profStyles.policyText}>
                Thank you for your interest. There are some things you need to fulfill before joining us:
              </Text>
              <Text style={profStyles.policyBullet}>
                • Your education status (scanned grade 10 and 12 national test results, scanned transcript of grade 9–12, and your current CGPA)
              </Text>
              <Text style={profStyles.policyBullet}>• Your living address</Text>
              <Text style={profStyles.policyBullet}>• The name of college/university you are attending</Text>
              <Text style={profStyles.policyBullet}>• Your phone number</Text>
              <Text style={profStyles.policyBullet}>• Your Telegram username</Text>
              <Text style={profStyles.policyDivider}>
                🔏 By providing the above information, you will become an Eagle Tutorials family member.
              </Text>
            </View>

            <TouchableOpacity onPress={() => Linking.openURL(POLICY_URL).catch(() => Alert.alert('Error', 'Could not open this link. Please check if you have a supported app installed.'))} style={profStyles.policyLink}>
              <Text style={profStyles.policyLinkText}>📄 Read our full policy document →</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[profStyles.checkboxRow, policyAgreed && profStyles.checkboxRowActive]}
              onPress={() => setPolicyAgreed(!policyAgreed)}
            >
              <View style={[profStyles.checkbox, policyAgreed && profStyles.checkboxChecked]}>
                {policyAgreed && <Text style={profStyles.checkmark}>✓</Text>}
              </View>
              <Text style={profStyles.checkboxLabel}>
                I have read and agree to the Eagle Tutorials policy
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <View style={[profStyles.bottomBar, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
        {step > 1 && (
          <Button title="Back" onPress={() => setStep(step - 1)} variant="outline" style={{ marginRight: Spacing.sm, flex: 1 }} />
        )}
        {step < 3 ? (
          <Button title="Continue" onPress={() => setStep(step + 1)} variant="primary" style={{ flex: 1 }} />
        ) : (
          <Button
            title={saving ? 'Submitting...' : jobId ? 'Submit Application' : 'Submit Profile for Review'}
            onPress={handleSubmit}
            variant="primary"
            disabled={!policyAgreed || saving}
            style={{ flex: 1 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function InputField({ label, value, onChange, placeholder, multiline, keyboardType, prefix }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean; keyboardType?: any; prefix?: string;
}) {
  return (
    <View style={profStyles.fieldContainer}>
      <Text style={profStyles.fieldLabel}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {prefix && <Text style={profStyles.fieldPrefix}>{prefix}</Text>}
        <TextInput
          style={[profStyles.fieldInput, multiline && { minHeight: 80, textAlignVertical: 'top' }, prefix && { flex: 1 }]}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={Colors.textSecondary}
          multiline={multiline}
          keyboardType={keyboardType}
        />
      </View>
    </View>
  );
}

function DocUploader({ label, file, existingUrl, onPick, uploading }: {
  label: string; file: { uri: string; name: string } | null; existingUrl?: string | null; onPick: () => void; uploading: boolean;
}) {
  const fileName = file?.name || (existingUrl ? 'Previously uploaded' : null);
  return (
    <View style={profStyles.docContainer}>
      <Text style={profStyles.fieldLabel}>{label}</Text>
      <TouchableOpacity style={profStyles.docPicker} onPress={onPick} disabled={!!uploading}>
        {uploading ? (
          <ActivityIndicator size="small" color={Colors.blue} />
        ) : (
          <>
            <Text style={profStyles.docPickerIcon}>📎</Text>
            <Text style={profStyles.docPickerText}>{file ? 'Change file' : existingUrl ? 'Re-upload' : 'Upload file'}</Text>
          </>
        )}
      </TouchableOpacity>
      {fileName && (
        <View style={profStyles.fileInfo}>
          <Text style={profStyles.fileName}>📄 {fileName}</Text>
        </View>
      )}
    </View>
  );
}

const profStyles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: Typography['2xl'], color: Colors.blue },
  headerTitle: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: Colors.text },
  stepIndicator: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: Spacing.lg, gap: Spacing['2xl'] },
  stepItem: { alignItems: 'center', gap: 4 },
  stepCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.grayLight, alignItems: 'center', justifyContent: 'center' },
  stepCircleActive: { backgroundColor: Colors.blue },
  stepCircleDone: { backgroundColor: Colors.green },
  stepNumber: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.textSecondary },
  stepNumberActive: { color: Colors.white },
  stepLabel: { fontSize: Typography.xs, color: Colors.textSecondary },
  stepLabelActive: { color: Colors.blue, fontWeight: Typography.semibold },
  sectionTitle: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: Colors.text, marginBottom: 4 },
  sectionSub: { fontSize: Typography.base, color: Colors.textSecondary, marginBottom: Spacing.lg },
  fieldContainer: { marginBottom: Spacing.lg },
  fieldLabel: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.text, marginBottom: 6 },
  fieldPrefix: { fontSize: Typography.base, color: Colors.textSecondary, marginRight: 4 },
  fieldInput: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.md, fontSize: Typography.base, color: Colors.text },
  docContainer: { marginBottom: Spacing.lg },
  docPicker: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.blueLight, borderWidth: 1, borderColor: Colors.blue, borderStyle: 'dashed', borderRadius: Radius.lg, padding: Spacing.lg, justifyContent: 'center' },
  docPickerIcon: { fontSize: 18 },
  docPickerText: { fontSize: Typography.base, color: Colors.blue, fontWeight: Typography.medium },
  fileInfo: { marginTop: Spacing.sm, paddingHorizontal: Spacing.sm },
  fileName: { fontSize: Typography.sm, color: Colors.textSecondary },
  policyCard: { backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.lg },
  policyText: { fontSize: Typography.base, color: Colors.text, lineHeight: 20, marginBottom: Spacing.md },
  policyBullet: { fontSize: Typography.base, color: Colors.textSecondary, lineHeight: 20, marginBottom: 6, paddingLeft: Spacing.sm },
  policyDivider: { fontSize: Typography.md, color: Colors.text, fontWeight: Typography.semibold, textAlign: 'center', marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border },
  policyLink: { marginBottom: Spacing.lg },
  policyLinkText: { fontSize: Typography.md, color: Colors.blue, fontWeight: Typography.medium, textDecorationLine: 'underline' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.lg },
  checkboxRowActive: { borderColor: Colors.blue, backgroundColor: Colors.blueLight },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: Colors.blue, borderColor: Colors.blue },
  checkmark: { color: Colors.white, fontSize: 12, fontWeight: Typography.bold },
  checkboxLabel: { fontSize: Typography.base, color: Colors.text, flex: 1 },
  bottomBar: { flexDirection: 'row', padding: Spacing.lg, paddingBottom: 30, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border },
  gateContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing['3xl'] },
  gateIcon: { fontSize: 48, marginBottom: Spacing.lg },
  gateTitle: { fontSize: Typography['3xl'], fontWeight: Typography.bold, color: Colors.text, marginBottom: Spacing.md, textAlign: 'center' },
  gateText: { fontSize: Typography.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: Spacing['2xl'] },
});
