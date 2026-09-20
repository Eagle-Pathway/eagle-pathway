import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { scholarshipsService } from '@/services/scholarships';
import { getBroadFields } from '@eagle-pathway/shared';
import { showError } from '@/utils/errorHandler';

const STEPS = [
  { id: 1, title: 'Essentials', icon: 'school-outline' },
  { id: 2, title: 'Eligibility', icon: 'people-outline' },
  { id: 3, title: 'Benefits', icon: 'gift-outline' },
  { id: 4, title: 'Notes & Submit', icon: 'checkmark-circle-outline' },
];

export function SubmitScholarshipScreen() {
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1
    name: '',
    organization: '',
    country: 'Global',
    host_country: '',
    country_flag: '🌍',
    website_url: '',
    application_url: '',

    // Step 2
    degree_level: 'masters',
    broad_field: 'Engineering & Technology',
    specific_field: '',
    nationality_restriction_type: 'all',
    min_gpa: '3.0',

    // Step 3
    funding_type: 'fully_funded',
    funding_details: 'Fully Funded (Tuition + Stipend)',
    tuition_coverage: 'full',
    stipend_provided: true,
    stipend_monthly_amount: '1000',
    stipend_currency: 'USD',
    accommodation_coverage: 'full',
    travel_allowance: true,
    deadline: '',

    // Step 4
    description: '',
    requirements_text: '',
    submission_notes: '',
    requires_cv: true,
    requires_motivation_letter: true,
    requires_degree_certificate: true,
    requires_transcript: true,
    requires_passport: false,
  });

  const updateField = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.name.trim()) {
        Alert.alert('Required Field', 'Please enter the scholarship or program name.');
        return;
      }
      if (!formData.organization.trim()) {
        Alert.alert('Required Field', 'Please enter the offering organization or university.');
        return;
      }
      if (!formData.website_url.trim()) {
        Alert.alert('Required Field', 'Please enter the official program website link.');
        return;
      }
    }

    if (currentStep === 3) {
      if (!formData.deadline.trim()) {
        Alert.alert('Deadline Required', 'Please enter the approximate or official application deadline date (e.g. 2027-03-31 or March 2027).');
        return;
      }
    }

    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const requirements = formData.requirements_text
        .split('\n')
        .map(r => r.trim())
        .filter(r => r.length > 0);

      const res = await scholarshipsService.submitScholarship({
        name: formData.name.trim(),
        organization: formData.organization.trim(),
        country: formData.host_country.trim() || formData.country || 'Global',
        host_country: formData.host_country.trim() || formData.country || 'Global',
        country_flag: formData.country_flag || '🌍',
        funding_details: formData.funding_details || 'Fully Funded',
        funding_type: formData.funding_type,
        deadline: formData.deadline.trim() || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
        degree_levels: [formData.degree_level],
        broad_field: formData.broad_field,
        specific_field: formData.specific_field || formData.broad_field,
        fields_of_study: [formData.broad_field],
        min_gpa: parseFloat(formData.min_gpa) || 3.0,
        website_url: formData.website_url.trim(),
        application_url: formData.application_url.trim() || undefined,
        description: formData.description.trim() || `Community submitted scholarship for ${formData.name}.`,
        requirements: requirements.length > 0 ? requirements : ['See official website for application instructions.'],
        submission_notes: formData.submission_notes.trim(),
        tuition_coverage: formData.tuition_coverage,
        stipend_provided: formData.stipend_provided,
        stipend_monthly_amount: formData.stipend_provided ? parseFloat(formData.stipend_monthly_amount) || undefined : undefined,
        stipend_currency: formData.stipend_currency,
        accommodation_coverage: formData.accommodation_coverage,
        travel_allowance: formData.travel_allowance,
        nationality_restriction_type: formData.nationality_restriction_type,
        requires_cv: formData.requires_cv,
        requires_motivation_letter: formData.requires_motivation_letter,
        requires_degree_certificate: formData.requires_degree_certificate,
        requires_transcript: formData.requires_transcript,
        requires_passport: formData.requires_passport,
      });

      if (res.success) {
        setSubmittedSuccess(true);
      } else {
        showError(res.error || 'Failed to submit scholarship.', 'Submission Incomplete');
      }
    } catch (e: any) {
      showError(e, 'Submission Incomplete');
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedSuccess) {
    return (
      <SafeAreaView style={[CommonStyles.screenBg, { justifyContent: 'center', alignItems: 'center', padding: Spacing.xl }]}>
        <View style={styles.successCard}>
          <View style={styles.successIconWrap}>
            <Ionicons name="checkmark-circle" size={64} color={Colors.green} />
          </View>
          <Text style={styles.successTitle}>Scholarship Submitted! 🎓</Text>
          <Text style={styles.successBody}>
            Thank you for contributing to the Eagle Pathway community!
          </Text>
          <View style={styles.reviewBadgeNotice}>
            <Ionicons name="shield-checkmark" size={18} color={Colors.blueDark} />
            <Text style={styles.reviewBadgeNoticeText}>
              Status: Under Admin Review
            </Text>
          </View>
          <Text style={styles.successSubtext}>
            Our verification team will audit the official requirements, verify application links, and publish it for students worldwide once approved.
          </Text>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)/home');
              }
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Back to Scholarships</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={CommonStyles.screenBg} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              if (currentStep > 1) {
                setCurrentStep(prev => prev - 1);
              } else if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)/home');
              }
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={20} color={Colors.white} />
          </TouchableOpacity>

          <View style={{ flex: 1, marginHorizontal: Spacing.sm }}>
            <Text style={styles.headerTitle}>Suggest a Scholarship</Text>
            <Text style={styles.headerSub}>Help students discover new opportunities</Text>
          </View>

          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>{currentStep}/4</Text>
          </View>
        </View>

        {/* Progress Bar & Steps indicator */}
        <View style={styles.progressContainer}>
          {STEPS.map((s) => {
            const isCompleted = currentStep > s.id;
            const isCurrent = currentStep === s.id;
            return (
              <View key={s.id} style={styles.stepItem}>
                <View
                  style={[
                    styles.stepCircle,
                    isCompleted && styles.stepCircleCompleted,
                    isCurrent && styles.stepCircleCurrent,
                  ]}
                >
                  <Ionicons
                    name={isCompleted ? 'checkmark' : (s.icon as any)}
                    size={14}
                    color={isCurrent || isCompleted ? Colors.white : Colors.textSecondary}
                  />
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    (isCurrent || isCompleted) && styles.stepLabelActive,
                  ]}
                  numberOfLines={1}
                >
                  {s.title}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Form Body */}
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* STEP 1: ESSENTIALS */}
          {currentStep === 1 && (
            <View style={styles.stepCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="school" size={20} color={Colors.blueDark} />
                <Text style={styles.sectionTitle}>1. Program Essentials</Text>
              </View>
              <Text style={styles.sectionSubtitle}>
                Tell us about the scholarship name, offering institution, and official website.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Scholarship / Program Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. DAAD Helmut-Schmidt Programme"
                  placeholderTextColor={Colors.textSecondary}
                  value={formData.name}
                  onChangeText={(val) => updateField('name', val)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Organization / University / Sponsor *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. German Academic Exchange Service (DAAD)"
                  placeholderTextColor={Colors.textSecondary}
                  value={formData.organization}
                  onChangeText={(val) => updateField('organization', val)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Host Country / Study Destination</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Germany, United Kingdom, USA, Japan..."
                  placeholderTextColor={Colors.textSecondary}
                  value={formData.host_country}
                  onChangeText={(val) => updateField('host_country', val)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Official Website URL *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://www.daad.de/en/..."
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="url"
                  autoCapitalize="none"
                  value={formData.website_url}
                  onChangeText={(val) => updateField('website_url', val)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Direct Application Portal URL (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://portal.daad.de/apply..."
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="url"
                  autoCapitalize="none"
                  value={formData.application_url}
                  onChangeText={(val) => updateField('application_url', val)}
                />
              </View>
            </View>
          )}

          {/* STEP 2: ELIGIBILITY & ACADEMICS */}
          {currentStep === 2 && (
            <View style={styles.stepCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="people" size={20} color={Colors.blueDark} />
                <Text style={styles.sectionTitle}>2. Academic & Eligibility</Text>
              </View>
              <Text style={styles.sectionSubtitle}>
                Specify target degree levels, academic fields, and nationality criteria.
              </Text>

              {/* Degree Level Selector */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Degree Level</Text>
                <View style={styles.segmentedRow}>
                  {[
                    { id: 'undergraduate', label: "Bachelor's" },
                    { id: 'masters', label: "Master's" },
                    { id: 'phd', label: 'PhD' },
                    { id: 'all', label: 'All Degrees' },
                  ].map((d) => (
                    <TouchableOpacity
                      key={d.id}
                      style={[
                        styles.segmentBtn,
                        formData.degree_level === d.id && styles.segmentBtnActive,
                      ]}
                      onPress={() => updateField('degree_level', d.id)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.segmentBtnText,
                          formData.degree_level === d.id && styles.segmentBtnTextActive,
                        ]}
                      >
                        {d.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Broad Field Selector */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Primary Field of Study</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {getBroadFields().slice(0, 7).map((bf) => (
                      <TouchableOpacity
                        key={bf}
                        style={[
                          styles.chip,
                          formData.broad_field === bf && styles.chipActive,
                        ]}
                        onPress={() => updateField('broad_field', bf)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            formData.broad_field === bf && styles.chipTextActive,
                          ]}
                        >
                          {bf}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Specific Major / Specialization (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Public Policy, AI, Global Health, Economics..."
                  placeholderTextColor={Colors.textSecondary}
                  value={formData.specific_field}
                  onChangeText={(val) => updateField('specific_field', val)}
                />
              </View>

              {/* Nationality Rules */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Eligible Nationalities</Text>
                <View style={{ gap: 6, marginTop: 4 }}>
                  {[
                    { id: 'all', label: '🌍 Open to All International Nationalities' },
                    { id: 'developing_countries', label: '🌱 Developing Countries Only (DAC / Global South)' },
                    { id: 'specific_countries', label: '🎯 Specific Selected Countries' },
                  ].map((n) => (
                    <TouchableOpacity
                      key={n.id}
                      style={[
                        styles.optionCard,
                        formData.nationality_restriction_type === n.id && styles.optionCardActive,
                      ]}
                      onPress={() => updateField('nationality_restriction_type', n.id)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.optionCardText,
                          formData.nationality_restriction_type === n.id && styles.optionCardTextActive,
                        ]}
                      >
                        {n.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Minimum GPA (out of 4.0, if specified)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 3.0 or leave blank"
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="numeric"
                  value={formData.min_gpa}
                  onChangeText={(val) => updateField('min_gpa', val)}
                />
              </View>
            </View>
          )}

          {/* STEP 3: BENEFITS & TIMELINE */}
          {currentStep === 3 && (
            <View style={styles.stepCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="gift" size={20} color={Colors.blueDark} />
                <Text style={styles.sectionTitle}>3. Benefits & Timeline</Text>
              </View>
              <Text style={styles.sectionSubtitle}>
                What expenses are covered and when is the application due?
              </Text>

              {/* Funding Type */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Funding Level</Text>
                <View style={styles.segmentedRow}>
                  {[
                    { id: 'fully_funded', label: '🌟 Fully Funded' },
                    { id: 'partial', label: 'Partial Tuition' },
                    { id: 'tuition_only', label: 'Tuition Only' },
                  ].map((f) => (
                    <TouchableOpacity
                      key={f.id}
                      style={[
                        styles.segmentBtn,
                        formData.funding_type === f.id && styles.segmentBtnActive,
                      ]}
                      onPress={() => updateField('funding_type', f.id)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.segmentBtnText,
                          formData.funding_type === f.id && styles.segmentBtnTextActive,
                        ]}
                      >
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Covered Items Checkboxes */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Covered Benefits Checklist</Text>
                <View style={{ gap: 8, marginTop: 4 }}>
                  {[
                    { key: 'stipend_provided', label: 'Monthly Living Allowance / Stipend', icon: 'cash-outline' },
                    { key: 'travel_allowance', label: 'Roundtrip Airfare / Travel Grant', icon: 'airplane-outline' },
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.key}
                      style={[
                        styles.checkboxRow,
                        (formData as any)[item.key] && styles.checkboxRowActive,
                      ]}
                      onPress={() => updateField(item.key, !(formData as any)[item.key])}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={(formData as any)[item.key] ? 'checkbox' : 'square-outline'}
                        size={20}
                        color={(formData as any)[item.key] ? Colors.blueDark : Colors.textSecondary}
                      />
                      <Text style={styles.checkboxLabel}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {formData.stipend_provided && (
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={[styles.inputGroup, { flex: 2 }]}>
                    <Text style={styles.label}>Monthly Stipend Approx</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 1200"
                      placeholderTextColor={Colors.textSecondary}
                      keyboardType="numeric"
                      value={formData.stipend_monthly_amount}
                      onChangeText={(val) => updateField('stipend_monthly_amount', val)}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Currency</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="USD/EUR"
                      placeholderTextColor={Colors.textSecondary}
                      value={formData.stipend_currency}
                      onChangeText={(val) => updateField('stipend_currency', val)}
                    />
                  </View>
                </View>
              )}

              {/* Deadline */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Application Deadline *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD (e.g. 2027-04-15)"
                  placeholderTextColor={Colors.textSecondary}
                  value={formData.deadline}
                  onChangeText={(val) => updateField('deadline', val)}
                />
              </View>
            </View>
          )}

          {/* STEP 4: NOTES & SUBMIT */}
          {currentStep === 4 && (
            <View style={styles.stepCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="document-text" size={20} color={Colors.blueDark} />
                <Text style={styles.sectionTitle}>4. Notes & Documents</Text>
              </View>
              <Text style={styles.sectionSubtitle}>
                Add any extra instructions, required documents, or tips for our verification team.
              </Text>

              {/* Documents */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Known Required Documents</Text>
                <View style={styles.docGrid}>
                  {[
                    { key: 'requires_cv', label: 'CV / Resume' },
                    { key: 'requires_motivation_letter', label: 'Motivation Letter / SOP' },
                    { key: 'requires_degree_certificate', label: 'Degree Certificate' },
                    { key: 'requires_transcript', label: 'Academic Transcript' },
                    { key: 'requires_passport', label: 'Passport Copy' },
                  ].map((doc) => (
                    <TouchableOpacity
                      key={doc.key}
                      style={[
                        styles.docChip,
                        (formData as any)[doc.key] && styles.docChipActive,
                      ]}
                      onPress={() => updateField(doc.key, !(formData as any)[doc.key])}
                    >
                      <Ionicons
                        name={(formData as any)[doc.key] ? 'checkmark-circle' : 'ellipse-outline'}
                        size={14}
                        color={(formData as any)[doc.key] ? Colors.white : Colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.docChipText,
                          (formData as any)[doc.key] && styles.docChipTextActive,
                        ]}
                      >
                        {doc.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Requirements List (One per line)</Text>
                <TextInput
                  style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                  placeholder="• Bachelor's degree with good grades&#10;• IELTS 6.5 or English-medium degree letter&#10;• 2 Recommendation letters"
                  placeholderTextColor={Colors.textSecondary}
                  multiline
                  numberOfLines={3}
                  value={formData.requirements_text}
                  onChangeText={(val) => updateField('requirements_text', val)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Notes for Verification Team (Optional)</Text>
                <TextInput
                  style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
                  placeholder="e.g. Found on German embassy website. Applications usually open in October."
                  placeholderTextColor={Colors.textSecondary}
                  multiline
                  numberOfLines={2}
                  value={formData.submission_notes}
                  onChangeText={(val) => updateField('submission_notes', val)}
                />
              </View>

              {/* Verification & moderation disclaimer */}
              <View style={styles.trustBanner}>
                <Ionicons name="shield-checkmark" size={20} color={Colors.blueDark} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.trustBannerTitle}>Moderation & Review Guarantee</Text>
                  <Text style={styles.trustBannerBody}>
                    Your submission will be queued for our admin team to review, audit the links, and publish once verified.
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Navigation Buttons */}
          <View style={styles.bottomActions}>
            {currentStep < 4 ? (
              <TouchableOpacity style={styles.primaryBtn} onPress={handleNext} activeOpacity={0.85}>
                <Text style={styles.primaryBtnText}>Continue ➔</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.primaryBtn, submitting && { opacity: 0.7 }]}
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.primaryBtnText}>Submit for Verification 🚀</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.blueDark,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: Typography.bold,
    color: Colors.white,
  },
  headerSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 1,
  },
  stepBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: Typography.bold,
    color: Colors.white,
  },
  progressContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  stepCircleCompleted: {
    backgroundColor: Colors.green,
  },
  stepCircleCurrent: {
    backgroundColor: Colors.blueDark,
  },
  stepLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  stepLabelActive: {
    color: Colors.blueDark,
    fontWeight: Typography.bold,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing['2xl'],
  },
  stepCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 16,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: Typography.semibold,
    color: Colors.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.bg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
  },
  segmentedRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: Radius.md,
    padding: 3,
    gap: 3,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: Radius.sm,
  },
  segmentBtnActive: {
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentBtnText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  segmentBtnTextActive: {
    color: Colors.blueDark,
    fontWeight: Typography.bold,
  },
  chip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.blueDark,
    borderColor: Colors.blueDark,
  },
  chipText: {
    fontSize: 12,
    color: Colors.text,
  },
  chipTextActive: {
    color: Colors.white,
    fontWeight: Typography.bold,
  },
  optionCard: {
    padding: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#F8FAFC',
  },
  optionCardActive: {
    borderColor: Colors.blueDark,
    backgroundColor: '#EFF6FF',
  },
  optionCardText: {
    fontSize: 12,
    color: Colors.text,
  },
  optionCardTextActive: {
    color: Colors.blueDark,
    fontWeight: Typography.semibold,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#F8FAFC',
  },
  checkboxRowActive: {
    borderColor: Colors.blueDark,
    backgroundColor: '#EFF6FF',
  },
  checkboxLabel: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: Typography.medium,
  },
  docGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  docChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  docChipActive: {
    backgroundColor: Colors.blueDark,
    borderColor: Colors.blueDark,
  },
  docChipText: {
    fontSize: 11,
    color: Colors.text,
  },
  docChipTextActive: {
    color: Colors.white,
    fontWeight: Typography.bold,
  },
  trustBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#EFF6FF',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginTop: Spacing.sm,
  },
  trustBannerTitle: {
    fontSize: 13,
    fontWeight: Typography.bold,
    color: Colors.blueDark,
  },
  trustBannerBody: {
    fontSize: 11,
    color: '#1E40AF',
    marginTop: 2,
    lineHeight: 15,
  },
  bottomActions: {
    marginTop: Spacing.sm,
  },
  primaryBtn: {
    backgroundColor: Colors.blueDark,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.blueDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: Typography.bold,
    color: Colors.white,
  },
  successCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    width: '100%',
    maxWidth: 400,
  },
  successIconWrap: {
    marginBottom: Spacing.md,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: Typography.bold,
    color: Colors.blueDark,
    textAlign: 'center',
  },
  successBody: {
    fontSize: 14,
    color: Colors.text,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  reviewBadgeNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginVertical: Spacing.md,
  },
  reviewBadgeNoticeText: {
    fontSize: 12,
    fontWeight: Typography.bold,
    color: '#92400E',
  },
  successSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.xl,
  },
});
