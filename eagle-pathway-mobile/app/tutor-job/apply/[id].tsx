import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, ScrollView, ActivityIndicator, Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '../../../src/utils/theme';
import { supabase } from '../../../src/services/supabase';
import { useAuthStore } from '../../../src/store/authStore';
import { useTutorJobsStore } from '../../../src/store/tutorJobsStore';
import { KeyboardAwareScreen } from '../../../src/components/KeyboardAwareScreen';

const POLICY_DOC_URL =
  'https://docs.google.com/document/d/1manAx_EUc8eIu4ScyddKyo1jdFAIwiQn2tZFunAqRdQ/edit?usp=sharing';

type Step = 1 | 2 | 3;

interface UploadState {
  uri?: string;
  name?: string;
  path?: string;    // Storage path after upload
  uploading: boolean;
}

// ─── Step Indicator ──────────────────────────────────────────────────────────

function StepBar({ step }: { step: Step }) {
  const steps = ['Your Info', 'Documents', 'Policy'];
  return (
    <View style={stepStyles.wrap}>
      {steps.map((label, i) => {
        const stepNum = (i + 1) as Step;
        const isActive = step === stepNum;
        const isDone = step > stepNum;
        return (
          <React.Fragment key={label}>
            <View style={stepStyles.item}>
              <View style={[stepStyles.circle, isActive && stepStyles.circleActive, isDone && stepStyles.circleDone]}>
                <Text style={[stepStyles.circleText, (isActive || isDone) && stepStyles.circleTextActive]}>
                  {isDone ? '✓' : stepNum}
                </Text>
              </View>
              <Text style={[stepStyles.label, isActive && stepStyles.labelActive]}>{label}</Text>
            </View>
            {i < 2 && <View style={[stepStyles.line, isDone && stepStyles.lineDone]} />}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const stepStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  item: { alignItems: 'center', gap: 4 },
  line: { flex: 1, height: 2, backgroundColor: Colors.border, marginBottom: 20 },
  lineDone: { backgroundColor: Colors.blue },
  circle: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.grayLight, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  circleActive: { borderColor: Colors.blue, backgroundColor: Colors.blueLight },
  circleDone: { borderColor: Colors.blue, backgroundColor: Colors.blue },
  circleText: { fontSize: Typography.xs, fontWeight: Typography.bold, color: Colors.textSecondary },
  circleTextActive: { color: Colors.white },
  label: { fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: Typography.medium },
  labelActive: { color: Colors.blue, fontWeight: Typography.bold },
});

// ─── Upload Button ────────────────────────────────────────────────────────────

function UploadButton({
  label,
  state,
  onPick,
}: {
  label: string;
  state: UploadState;
  onPick: () => void;
}) {
  return (
    <TouchableOpacity
      style={[uploadStyles.btn, state.path && uploadStyles.btnDone]}
      onPress={onPick}
      activeOpacity={0.8}
      disabled={state.uploading}
    >
      {state.uploading ? (
        <ActivityIndicator size="small" color={Colors.blue} />
      ) : (
        <Text style={uploadStyles.icon}>{state.path ? '✅' : '📎'}</Text>
      )}
      <View style={{ flex: 1 }}>
        <Text style={[uploadStyles.label, state.path && uploadStyles.labelDone]}>{label}</Text>
        {state.name ? (
          <Text style={uploadStyles.filename} numberOfLines={1}>{state.name}</Text>
        ) : (
          <Text style={uploadStyles.hint}>Tap to upload image or PDF</Text>
        )}
      </View>
      {!state.path && !state.uploading && (
        <Text style={uploadStyles.uploadText}>Upload</Text>
      )}
    </TouchableOpacity>
  );
}

const uploadStyles = StyleSheet.create({
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.white, borderRadius: Radius.xl,
    padding: Spacing.lg, borderWidth: 1.5, borderColor: Colors.border,
    borderStyle: 'dashed', marginBottom: Spacing.md,
  },
  btnDone: { borderColor: Colors.green, borderStyle: 'solid', backgroundColor: Colors.greenLight },
  icon: { fontSize: 22 },
  label: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.text },
  labelDone: { color: Colors.green },
  filename: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },
  hint: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },
  uploadText: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.blue },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function TutorJobApplyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { fetchMyApplications } = useTutorJobsStore();

  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1 fields (pre-filled from profile)
  const [educationStatus, setEducationStatus] = useState('');
  const [livingAddress, setLivingAddress] = useState(user?.city || '');
  const [universityName, setUniversityName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');
  const [telegramUsername, setTelegramUsername] = useState('');
  const [cgpa, setCgpa] = useState('');

  // Step 2 docs
  const emptyUpload: UploadState = { uploading: false };
  const [grade10, setGrade10] = useState<UploadState>(emptyUpload);
  const [grade12, setGrade12] = useState<UploadState>(emptyUpload);
  const [transcript, setTranscript] = useState<UploadState>(emptyUpload);

  // Step 3 policy
  const [policyAgreed, setPolicyAgreed] = useState(false);

  // Load any previously submitted application data
  useEffect(() => {
    if (!user) return;
    loadExistingApplication();
  }, [user]);

  async function loadExistingApplication() {
    if (!user) return;
    // Check tutor_applications for previously uploaded docs
    const { data } = await supabase
      .from('tutor_applications')
      .select('*')
      .eq('tutor_id', user.id)
      .single();

    if (data) {
      if (data.university_name) setUniversityName(data.university_name);
      if (data.living_address) setLivingAddress(data.living_address);
      if (data.phone_number) setPhoneNumber(data.phone_number);
      if (data.telegram_username) setTelegramUsername(data.telegram_username);
      if (data.cgpa) setCgpa(data.cgpa);
      if (data.grade10_result_url) setGrade10({ uploading: false, path: data.grade10_result_url, name: 'Previously uploaded' });
      if (data.grade12_result_url) setGrade12({ uploading: false, path: data.grade12_result_url, name: 'Previously uploaded' });
      if (data.transcript_url) setTranscript({ uploading: false, path: data.transcript_url, name: 'Previously uploaded' });
    }
  }

  // ── File upload helper ──────────────────────────────────────────────────────

  const uploadFile = async (
    setterFn: React.Dispatch<React.SetStateAction<UploadState>>,
    docType: 'grade10' | 'grade12' | 'transcript'
  ) => {
    if (!user) return;

    try {
      // Let user pick: image or document
      let uri: string | undefined;
      let name: string | undefined;
      let mimeType: string | undefined;

      // Show picker
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.85,
      });

      if (pickerResult.canceled) {
        // Fallback: try document picker for PDFs
        const docResult = await DocumentPicker.getDocumentAsync({
          type: ['application/pdf', 'image/*'],
          copyToCacheDirectory: true,
        });
        if (docResult.canceled || !docResult.assets?.[0]) return;
        uri = docResult.assets[0].uri;
        name = docResult.assets[0].name || `${docType}.pdf`;
        mimeType = docResult.assets[0].mimeType || 'application/pdf';
      } else if (pickerResult.assets?.[0]) {
        uri = pickerResult.assets[0].uri;
        const ext = uri.split('.').pop() || 'jpg';
        name = `${docType}_${Date.now()}.${ext}`;
        mimeType = `image/${ext}`;
      } else {
        return;
      }

      setterFn(prev => ({ ...prev, uploading: true, name }));

      // Fetch the file as a blob
      const response = await fetch(uri);
      const blob = await response.blob();

      const storagePath = `${user.id}/${docType}_${Date.now()}_${name}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('tutor-documents')
        .upload(storagePath, blob, { contentType: mimeType, upsert: true });

      if (uploadError) throw uploadError;

      setterFn({ uploading: false, uri, name, path: uploadData.path });
    } catch (err: any) {
      setterFn(prev => ({ ...prev, uploading: false }));
      Alert.alert('Upload Failed', err.message || 'Could not upload file. Try again.');
    }
  };

  // ── Step navigation ────────────────────────────────────────────────────────

  const validateStep1 = () => {
    if (!phoneNumber.trim()) { Alert.alert('Required', 'Phone number is required.'); return false; }
    return true;
  };

  const validateStep2 = () => {
    if (!grade10.path) { Alert.alert('Required', 'Please upload your Grade 10 result.'); return false; }
    if (!grade12.path) { Alert.alert('Required', 'Please upload your Grade 12 result.'); return false; }
    if (!transcript.path) { Alert.alert('Required', 'Please upload your transcript.'); return false; }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep((prev) => (prev < 3 ? (prev + 1) as Step : prev));
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!policyAgreed) {
      Alert.alert('Policy Agreement Required', 'Please read and agree to the Eagle Tutorials policy before submitting.');
      return;
    }
    if (!user || !id) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('tutor_job_applications').insert({
        job_post_id: id,
        applicant_id: user.id,
        status: 'pending',
        education_status: educationStatus,
        living_address: livingAddress,
        university_name: universityName,
        phone_number: phoneNumber,
        telegram_username: telegramUsername.replace(/^@/, ''), // strip @ for storage
        cgpa,
        grade10_result_url: grade10.path,
        grade12_result_url: grade12.path,
        transcript_url: transcript.path,
        policy_agreed: true,
        policy_agreed_at: new Date().toISOString(),
      });

      if (error) {
        if (error.code === '23505') {
          Alert.alert('Already Applied', 'You have already submitted an application for this job.');
        } else {
          throw error;
        }
        setSubmitting(false);
        return;
      }

      await fetchMyApplications();

      Alert.alert(
        'Application Submitted! 🎉',
        "We'll review your details and contact you via in-app chat or Telegram. You can track your application status in My Applications.",
        [
          { text: 'View My Applications', onPress: () => router.replace('/(tabs)/my-applications') },
        ]
      );
    } catch (err: any) {
      Alert.alert('Submission Failed', err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={CommonStyles.screenBg} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => (step > 1 ? setStep((prev) => (prev - 1) as Step) : router.back())}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: 20, color: Colors.text }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Apply for Job</Text>
      </View>

      <StepBar step={step} />

      <KeyboardAwareScreen contentContainerStyle={styles.content}>
        {/* ── STEP 1: Info Review ────────────────────────────────────────────── */}
        {step === 1 && (
          <>
            <Text style={styles.sectionTitle}>📋 Your Information</Text>
            <Text style={styles.sectionSub}>Pre-filled from your profile — review and update as needed.</Text>

            <Text style={styles.fieldLabel}>Education Status</Text>
            <TextInput
              style={[styles.input, { minHeight: 80 }]}
              value={educationStatus}
              onChangeText={setEducationStatus}
              placeholder="Describe your current education status (e.g. 2nd year Computer Science, AAiT)"
              multiline
              textAlignVertical="top"
              placeholderTextColor={Colors.textSecondary}
            />

            <Text style={styles.fieldLabel}>Living Address</Text>
            <TextInput
              style={styles.input}
              value={livingAddress}
              onChangeText={setLivingAddress}
              placeholder="e.g. Bole, Addis Ababa"
              placeholderTextColor={Colors.textSecondary}
            />

            <Text style={styles.fieldLabel}>University / College Name</Text>
            <TextInput
              style={styles.input}
              value={universityName}
              onChangeText={setUniversityName}
              placeholder="e.g. Addis Ababa Institute of Technology"
              placeholderTextColor={Colors.textSecondary}
            />

            <Text style={styles.fieldLabel}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="+251 9xx xxx xxxx"
              keyboardType="phone-pad"
              placeholderTextColor={Colors.textSecondary}
            />

            <Text style={styles.fieldLabel}>Telegram Username</Text>
            <View style={styles.telegramWrap}>
              <View style={styles.atPrefix}><Text style={styles.atText}>@</Text></View>
              <TextInput
                style={[styles.input, styles.telegramInput]}
                value={telegramUsername}
                onChangeText={t => setTelegramUsername(t.replace(/^@/, ''))}
                placeholder="yourusername"
                autoCapitalize="none"
                placeholderTextColor={Colors.textSecondary}
              />
            </View>

            <Text style={styles.fieldLabel}>CGPA</Text>
            <TextInput
              style={styles.input}
              value={cgpa}
              onChangeText={setCgpa}
              placeholder="e.g. 3.75"
              keyboardType="decimal-pad"
              placeholderTextColor={Colors.textSecondary}
            />
          </>
        )}

        {/* ── STEP 2: Document Uploads ───────────────────────────────────────── */}
        {step === 2 && (
          <>
            <Text style={styles.sectionTitle}>📎 Upload Documents</Text>
            <Text style={styles.sectionSub}>Upload clear images or PDFs of your official documents.</Text>

            <UploadButton
              label="Grade 10 National Exam Result *"
              state={grade10}
              onPick={() => uploadFile(setGrade10, 'grade10')}
            />

            <UploadButton
              label="Grade 12 National Exam Result *"
              state={grade12}
              onPick={() => uploadFile(setGrade12, 'grade12')}
            />

            <UploadButton
              label="Grade 9–12 Transcript *"
              state={transcript}
              onPick={() => uploadFile(setTranscript, 'transcript')}
            />

            <View style={styles.tipBox}>
              <Text style={styles.tipTitle}>💡 Upload Tips</Text>
              <Text style={styles.tipText}>• Make sure documents are clear and fully visible</Text>
              <Text style={styles.tipText}>• Photos should be taken in good lighting</Text>
              <Text style={styles.tipText}>• PDFs are preferred for digital documents</Text>
            </View>
          </>
        )}

        {/* ── STEP 3: Policy Agreement ───────────────────────────────────────── */}
        {step === 3 && (
          <>
            <Text style={styles.sectionTitle}>🔏 Policy Agreement</Text>

            <View style={styles.policyBox}>
              <Text style={styles.policyText}>
                Thank you for your interest. There are some things you need to agree before joining us
              </Text>

              <Text style={styles.policyHighlight}>
                🔏 By agreeing to our terms and conditions, you will become an Eagle Tutorials family member.
              </Text>

              <TouchableOpacity
                onPress={() => Linking.openURL(POLICY_DOC_URL)}
                style={styles.policyLink}
              >
                <Text style={styles.policyLinkText}>📄 Read our full policy document →</Text>
              </TouchableOpacity>
            </View>

            {/* Checkbox */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setPolicyAgreed(v => !v)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, policyAgreed && styles.checkboxChecked]}>
                {policyAgreed && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>
                I have read and agree to the Eagle Tutorials policy
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, (!policyAgreed || submitting) && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={!policyAgreed || submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.submitBtnText}>Submit Application</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* Next button (steps 1 & 2) */}
        {step < 3 && (
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.85}>
            <Text style={styles.nextBtnText}>Next →</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 60 }} />
      </KeyboardAwareScreen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.lg, backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 36, height: 36, backgroundColor: Colors.grayLight,
    borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.text },
  content: { padding: Spacing.lg },
  sectionTitle: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: Colors.text, marginBottom: Spacing.xs },
  sectionSub: { fontSize: Typography.sm, color: Colors.textSecondary, marginBottom: Spacing.xl },
  fieldLabel: { fontSize: Typography.xs, fontWeight: Typography.semibold, color: Colors.textSecondary, marginBottom: Spacing.xs, marginTop: Spacing.md },
  input: {
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.md,
    fontSize: Typography.base, color: Colors.text,
  },
  telegramWrap: { flexDirection: 'row', alignItems: 'center' },
  atPrefix: {
    backgroundColor: Colors.grayLight, borderWidth: 1, borderColor: Colors.border,
    borderRightWidth: 0, borderTopLeftRadius: Radius.lg, borderBottomLeftRadius: Radius.lg,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.md,
  },
  atText: { fontSize: Typography.base, color: Colors.textSecondary, fontWeight: Typography.bold },
  telegramInput: { flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 },
  tipBox: {
    backgroundColor: Colors.blueLight, borderRadius: Radius.xl,
    padding: Spacing.lg, marginTop: Spacing.md,
  },
  tipTitle: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.blue, marginBottom: Spacing.sm },
  tipText: { fontSize: Typography.sm, color: Colors.blue, marginBottom: 4 },
  policyBox: {
    backgroundColor: Colors.white, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.lg, marginBottom: Spacing.xl,
  },
  policyText: { fontSize: Typography.sm, color: Colors.text, lineHeight: 20 },
  policyHighlight: {
    fontSize: Typography.sm, color: Colors.blue, fontWeight: Typography.semibold,
    marginTop: Spacing.md, lineHeight: 20,
  },
  policyLink: { marginTop: Spacing.md },
  policyLinkText: { color: Colors.blue, fontWeight: Typography.semibold, fontSize: Typography.base, textDecorationLine: 'underline' },
  checkboxRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md,
    marginBottom: Spacing.xl, backgroundColor: Colors.white,
    borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.lg,
  },
  checkbox: {
    width: 24, height: 24, borderRadius: 6, borderWidth: 2,
    borderColor: Colors.border, alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxChecked: { borderColor: Colors.blue, backgroundColor: Colors.blue },
  checkmark: { color: Colors.white, fontSize: 14, fontWeight: Typography.bold },
  checkboxLabel: { flex: 1, fontSize: Typography.sm, color: Colors.text, lineHeight: 20 },
  nextBtn: {
    backgroundColor: Colors.blue, borderRadius: Radius.xl,
    paddingVertical: Spacing.lg, alignItems: 'center', marginTop: Spacing.xl,
  },
  nextBtnText: { color: Colors.white, fontSize: Typography.lg, fontWeight: Typography.bold },
  submitBtn: {
    backgroundColor: Colors.blue, borderRadius: Radius.xl,
    paddingVertical: Spacing.lg, alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.45 },
  submitBtnText: { color: Colors.white, fontSize: Typography.lg, fontWeight: Typography.bold },
});
