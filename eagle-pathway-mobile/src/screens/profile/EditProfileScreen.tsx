import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Radius, Spacing, CommonStyles } from '@/utils/theme';
import { Button } from '@/components/common';
import { KeyboardAwareScreen } from '@/components/KeyboardAwareScreen';
import { useAuthStore } from '@/store/authStore';
import { showError } from '@/utils/errorHandler';
import { withTimeout } from '@/utils/asyncUtils';
import { getUserRole } from '@/utils/role';
import { DEPARTMENTS, FIELDS_OF_STUDY, validatePhone } from '@eagle-pathway/shared';

const DEGREE_TYPES = [
  { label: 'BSc (Science/Engineering)', value: 'BSc' },
  { label: 'BA (Arts/Humanities)', value: 'BA' },
  { label: 'BEd (Education)', value: 'BEd' },
  { label: 'LLB (Law)', value: 'LLB' },
  { label: 'MD (Medicine)', value: 'MD' },
  { label: 'MSc (Master of Science)', value: 'MSc' },
  { label: 'MA (Master of Arts)', value: 'MA' },
  { label: 'MBA (Business Admin)', value: 'MBA' },
  { label: 'PhD / Doctorate', value: 'PhD' },
];

const TARGET_COUNTRIES = [
  'USA', 'Canada', 'UK / Europe', 'Asia / China', 'Australia', 'Other'
];

const TUTOR_SUBJECTS = [
  'Math', 'Physics', 'Chemistry', 'Biology', 'English', 'Amharic',
  'History', 'Geography', 'Civics', 'Economics', 'Business', 'ICT/Computer',
  'SAT', 'IELTS', 'TOEFL', 'French', 'Arabic', 'Chinese',
  'Music', 'Art', 'Physical Education', 'Other',
];

const TEACHING_EXPERIENCE_OPTIONS = [
  'Beginner (Under 1 yr)',
  '1 – 2 Years',
  '3 – 5 Years',
  '5+ Years',
  'International School Experience'
];

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={editProfStyles.section}>
    <Text style={editProfStyles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

export function EditProfileScreen() {
  const { user, updateProfile } = useAuthStore();
  const role = getUserRole(user);
  const isTutor = role === 'tutor';
  const isParent = role === 'parent';
  const isStudent = !isTutor && !isParent;

  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    city: user?.city || '',
    interested_subjects: user?.interested_subjects || [],
    academic_summary: user?.academic_summary || '',
    has_ielts: user?.has_ielts || false,
    is_english_medium: user?.is_english_medium || false,
    target_degree_level: user?.target_degree_level || 'BSc',
    target_countries: user?.target_countries || ['USA'],
    has_extracurriculars: user?.has_extracurriculars || false,
    target_departments: user?.target_departments || [],
    grade_level: user?.grade_level || 'Grade 12',
    gpa: user?.gpa ? user.gpa.toString() : '',
    gpa_max: user?.gpa_max ? user.gpa_max.toString() : '4.0',
    living_address: user?.living_address || '',
    university_name: user?.university_name || '',
    telegram_username: user?.telegram_username || '',
    cgpa: user?.cgpa || '',
    teaching_experience: user?.teaching_experience || '1 – 2 Years',
    children_count: user?.children_count || 1,
    children_grades: user?.children_grades || ['KG / Elementary (Grades 1-8)'],
    preferred_tutor_gender: user?.preferred_tutor_gender || 'No Preference',
    preferred_session_format: user?.preferred_session_format || 'In-Person (Home Tutoring)',
    is_current_student: false,
  });
  const [loading, setLoading] = useState(false);

  const toggleSubject = (s: string) => {
    setFormData(prev => ({
      ...prev,
      interested_subjects: prev.interested_subjects.includes(s)
        ? prev.interested_subjects.filter(x => x !== s)
        : [...prev.interested_subjects, s],
    }));
  };

  const toggleCountry = (c: string) => {
    setFormData(prev => ({
      ...prev,
      target_countries: prev.target_countries.includes(c)
        ? prev.target_countries.filter(x => x !== c)
        : [...prev.target_countries, c],
    }));
  };

  const toggleDepartment = (d: string) => {
    setFormData(prev => ({
      ...prev,
      target_departments: prev.target_departments.includes(d)
        ? prev.target_departments.filter(x => x !== d)
        : [...prev.target_departments, d],
    }));
  };

  const toggleChildrenGrade = (g: string) => {
    setFormData(prev => ({
      ...prev,
      children_grades: prev.children_grades.includes(g)
        ? prev.children_grades.filter(x => x !== g)
        : [...prev.children_grades, g],
    }));
  };

  const handleSave = async () => {
    const name = formData.full_name?.toString().trim();
    const phone = formData.phone?.toString().trim();
    if (!name) { Alert.alert('Required', 'Please enter your full name.'); return; }
    if (!phone) { Alert.alert('Required', 'Please enter your phone number.'); return; }
    if (!validatePhone(phone)) { Alert.alert('Invalid phone', 'Enter a valid Ethiopian phone number (e.g. 0911234567).'); return; }

    if (isTutor && !formData.university_name?.trim()) {
      Alert.alert('Required', 'Please enter your university / college name.');
      return;
    }

    setLoading(true);
    try {
      const updates: any = {
        full_name: name,
        phone,
        city: formData.city,
      };

      if (isTutor) {
        updates.living_address = formData.living_address;
        updates.university_name = formData.university_name;
        updates.telegram_username = formData.telegram_username;
        updates.cgpa = formData.cgpa;
        updates.teaching_experience = formData.teaching_experience;
        updates.interested_subjects = formData.interested_subjects;
        updates.academic_summary = formData.academic_summary;
      } else if (isParent) {
        updates.living_address = formData.living_address;
        updates.children_count = formData.children_count;
        updates.children_grades = formData.children_grades;
        updates.preferred_tutor_gender = formData.preferred_tutor_gender;
        updates.preferred_session_format = formData.preferred_session_format;
        updates.academic_summary = formData.academic_summary;
      } else {
        // Student role
        updates.interested_subjects = formData.interested_subjects;
        updates.academic_summary = formData.academic_summary;
        updates.has_ielts = formData.has_ielts;
        updates.is_english_medium = formData.is_english_medium;
        updates.target_degree_level = formData.target_degree_level;
        updates.target_countries = formData.target_countries;
        updates.has_extracurriculars = formData.has_extracurriculars;
        updates.target_departments = formData.target_departments;
        updates.grade_level = formData.grade_level;
        updates.gpa = formData.gpa ? parseFloat(formData.gpa.toString()) : undefined;
        updates.gpa_max = formData.gpa_max ? parseFloat(formData.gpa_max.toString()) : undefined;
      }

      await withTimeout(updateProfile(updates));
      setLoading(false);
      Alert.alert('Success', 'Profile saved successfully!');
      router.back();
    } catch (e: any) {
      showError(e, 'Failed to Save Profile');
    } finally {
      setLoading(false);
    }
  };

  // 🎓 Student Fields
  const renderStudentFields = () => (
    <>
      <Section title="🎓 Academic Status">
        <Text style={editProfStyles.fieldLabel}>Current Level</Text>
        <View style={editProfStyles.chipsRow}>
          {['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'Undergraduate', 'Postgraduate'].map(lvl => (
            <TouchableOpacity
              key={lvl}
              style={[editProfStyles.chip, formData.grade_level === lvl && editProfStyles.chipActive]}
              onPress={() => setFormData(f => ({ ...f, grade_level: lvl }))}
            >
              <Text style={[editProfStyles.chipText, formData.grade_level === lvl && editProfStyles.chipTextActive]}>{lvl}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[editProfStyles.fieldLabel, { marginTop: Spacing.md }]}>Target Degree Program</Text>
        <View style={editProfStyles.chipsRow}>
          {DEGREE_TYPES.map(deg => (
            <TouchableOpacity
              key={deg.value}
              style={[editProfStyles.chip, formData.target_degree_level === deg.value && editProfStyles.chipActive]}
              onPress={() => setFormData(f => ({ ...f, target_degree_level: deg.value }))}
            >
              <Text style={[editProfStyles.chipText, formData.target_degree_level === deg.value && editProfStyles.chipTextActive]}>{deg.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[editProfStyles.fieldLabel, { marginTop: Spacing.md }]}>Cumulative GPA / Academic Score</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 10, color: Colors.textSecondary, marginBottom: 4, fontWeight: '600' }}>YOUR GPA</Text>
            <TextInput
              style={editProfStyles.input}
              keyboardType='numeric'
              value={formData.gpa}
              onChangeText={t => setFormData(f => ({ ...f, gpa: t }))}
              placeholder="e.g. 3.8"
            />
          </View>
          <Text style={{ fontSize: 18, color: Colors.textSecondary, marginTop: 15 }}>/</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 10, color: Colors.textSecondary, marginBottom: 4, fontWeight: '600' }}>OUT OF</Text>
            <TextInput
              style={editProfStyles.input}
              keyboardType='numeric'
              value={formData.gpa_max}
              onChangeText={t => setFormData(f => ({ ...f, gpa_max: t }))}
              placeholder="e.g. 4.0"
            />
          </View>
        </View>
      </Section>

      <Section title="🌍 Study Abroad & Language Goals">
        <Text style={editProfStyles.fieldLabel}>Target Countries (Tap all that apply)</Text>
        <View style={editProfStyles.chipsRow}>
          {TARGET_COUNTRIES.map(c => (
            <TouchableOpacity
              key={c}
              style={[editProfStyles.chip, formData.target_countries.includes(c) && editProfStyles.chipActive]}
              onPress={() => toggleCountry(c)}
            >
              <Text style={[editProfStyles.chipText, formData.target_countries.includes(c) && editProfStyles.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[editProfStyles.fieldLabel, { marginTop: Spacing.md }]}>Language & Standardized Tests</Text>
        <View style={editProfStyles.switchCard}>
          <View style={editProfStyles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={editProfStyles.switchTitle}>IELTS / TOEFL Score</Text>
              <Text style={editProfStyles.switchSub}>Do you have test scores ready?</Text>
            </View>
            <Text style={{ fontSize: 24 }} onPress={() => setFormData(f => ({ ...f, has_ielts: !f.has_ielts }))}>
              {formData.has_ielts ? '✅' : '⬜'}
            </Text>
          </View>
        </View>
        <View style={editProfStyles.switchCard}>
          <View style={editProfStyles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={editProfStyles.switchTitle}>English Medium Instruction</Text>
              <Text style={editProfStyles.switchSub}>Studied at an English medium school?</Text>
            </View>
            <Text style={{ fontSize: 24 }} onPress={() => setFormData(f => ({ ...f, is_english_medium: !f.is_english_medium }))}>
              {formData.is_english_medium ? '✅' : '⬜'}
            </Text>
          </View>
        </View>
      </Section>

      <Section title="💼 Target Fields of Study">
        <Text style={editProfStyles.fieldLabel}>Target Fields (Tap to select)</Text>
        <View style={editProfStyles.chipsRow}>
          {FIELDS_OF_STUDY.map(s => (
            <TouchableOpacity
              key={s}
              style={[editProfStyles.chip, formData.interested_subjects.includes(s) && editProfStyles.chipActive]}
              onPress={() => toggleSubject(s)}
            >
              <Text style={[editProfStyles.chipText, formData.interested_subjects.includes(s) && editProfStyles.chipTextActive]}>{s.charAt(0).toUpperCase() + s.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[editProfStyles.fieldLabel, { marginTop: Spacing.md }]}>Target Departments</Text>
        <View style={editProfStyles.chipsRow}>
          {DEPARTMENTS.map(d => (
            <TouchableOpacity
              key={d}
              style={[editProfStyles.chip, formData.target_departments.includes(d) && editProfStyles.chipActive]}
              onPress={() => toggleDepartment(d)}
            >
              <Text style={[editProfStyles.chipText, formData.target_departments.includes(d) && editProfStyles.chipTextActive]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Section>

      <Section title="✨ About You">
        <Text style={editProfStyles.fieldLabel}>Academic Summary / Bio</Text>
        <TextInput
          style={[editProfStyles.input, { minHeight: 100 }]}
          multiline
          placeholder='Tell us about your academic goals, achievements, and why you want to study abroad...'
          value={formData.academic_summary}
          onChangeText={t => setFormData(f => ({ ...f, academic_summary: t }))}
          placeholderTextColor={Colors.textSecondary}
        />
      </Section>
    </>
  );

  // 👨‍🏫 Tutor Fields
  const renderTutorFields = () => (
    <>
      <Section title="📍 Location & Contact">
        <Text style={editProfStyles.fieldLabel}>Living Address / Sub-city *</Text>
        <TextInput
          style={editProfStyles.input}
          value={formData.living_address}
          onChangeText={t => setFormData(f => ({ ...f, living_address: t }))}
          placeholder="e.g. Bole, Addis Ababa (near Medhanialem)"
          placeholderTextColor={Colors.textSecondary}
        />
        <Text style={[editProfStyles.fieldLabel, { marginTop: Spacing.sm }]}>Telegram Username</Text>
        <TextInput
          style={editProfStyles.input}
          value={formData.telegram_username}
          onChangeText={t => setFormData(f => ({ ...f, telegram_username: t }))}
          placeholder="e.g. @yourusername"
          autoCapitalize="none"
          placeholderTextColor={Colors.textSecondary}
        />
      </Section>

      <Section title="🎓 Qualifications & Education">
        <Text style={editProfStyles.fieldLabel}>University / College Name *</Text>
        <TextInput
          style={editProfStyles.input}
          value={formData.university_name}
          onChangeText={t => setFormData(f => ({ ...f, university_name: t }))}
          placeholder="e.g. Addis Ababa University (AAiT)"
          placeholderTextColor={Colors.textSecondary}
        />

        <Text style={[editProfStyles.fieldLabel, { marginTop: Spacing.sm }]}>Degree Type / Program</Text>
        <View style={editProfStyles.chipsRow}>
          {DEGREE_TYPES.map(deg => (
            <TouchableOpacity
              key={deg.value}
              style={[editProfStyles.chip, formData.target_degree_level === deg.value && editProfStyles.chipActive]}
              onPress={() => setFormData(f => ({ ...f, target_degree_level: deg.value }))}
            >
              <Text style={[editProfStyles.chipText, formData.target_degree_level === deg.value && editProfStyles.chipTextActive]}>{deg.value}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[editProfStyles.fieldLabel, { marginTop: Spacing.sm }]}>Current CGPA</Text>
        <TextInput
          style={editProfStyles.input}
          keyboardType="numeric"
          value={formData.cgpa}
          onChangeText={t => setFormData(f => ({ ...f, cgpa: t }))}
          placeholder="e.g. 3.75"
          placeholderTextColor={Colors.textSecondary}
        />
        <Text style={{ fontSize: 11, color: Colors.textSecondary, marginTop: 4 }}>Out of 4.0</Text>
      </Section>

      <Section title="📚 Teaching Experience & Subjects">
        <Text style={editProfStyles.fieldLabel}>Teaching Experience</Text>
        <View style={editProfStyles.chipsRow}>
          {TEACHING_EXPERIENCE_OPTIONS.map(exp => (
            <TouchableOpacity
              key={exp}
              style={[editProfStyles.chip, formData.teaching_experience === exp && editProfStyles.chipActive]}
              onPress={() => setFormData(f => ({ ...f, teaching_experience: exp }))}
            >
              <Text style={[editProfStyles.chipText, formData.teaching_experience === exp && editProfStyles.chipTextActive]}>{exp}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[editProfStyles.fieldLabel, { marginTop: Spacing.md }]}>Subjects You Teach (Tap all that apply)</Text>
        <View style={editProfStyles.chipsRow}>
          {TUTOR_SUBJECTS.map(s => (
            <TouchableOpacity
              key={s}
              style={[editProfStyles.chip, formData.interested_subjects.includes(s) && editProfStyles.chipActive]}
              onPress={() => toggleSubject(s)}
            >
              <Text style={[editProfStyles.chipText, formData.interested_subjects.includes(s) && editProfStyles.chipTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Section>

      <Section title="✍️ About Yourself">
        <Text style={editProfStyles.fieldLabel}>Tutor Bio & Approach</Text>
        <TextInput
          style={[editProfStyles.input, { minHeight: 100 }]}
          multiline
          placeholder="Describe your teaching methodology, achievements, and passion for helping students..."
          value={formData.academic_summary}
          onChangeText={t => setFormData(f => ({ ...f, academic_summary: t }))}
          placeholderTextColor={Colors.textSecondary}
        />
      </Section>
    </>
  );

  // 👨‍👩‍👧 Parent Fields
  const renderParentFields = () => (
    <>
      <Section title="📍 Location & Residence">
        <Text style={editProfStyles.fieldLabel}>Residence Sub-city / Neighborhood *</Text>
        <TextInput
          style={editProfStyles.input}
          value={formData.living_address}
          onChangeText={t => setFormData(f => ({ ...f, living_address: t }))}
          placeholder="e.g. Bole, Old Airport, Sarbet, CMC"
          placeholderTextColor={Colors.textSecondary}
        />
      </Section>

      <Section title="👨‍👩‍👧 Family & Children Details">
        <Text style={editProfStyles.fieldLabel}>Children's Grade Levels</Text>
        <View style={editProfStyles.chipsRow}>
          {['KG / Primary (Grades 1-8)', 'High School (Grades 9-12)', 'College / SAT Prep'].map(g => (
            <TouchableOpacity
              key={g}
              style={[editProfStyles.chip, formData.children_grades.includes(g) && editProfStyles.chipActive]}
              onPress={() => toggleChildrenGrade(g)}
            >
              <Text style={[editProfStyles.chipText, formData.children_grades.includes(g) && editProfStyles.chipTextActive]}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[editProfStyles.fieldLabel, { marginTop: Spacing.md }]}>Preferred Tutor Gender</Text>
        <View style={editProfStyles.chipsRow}>
          {['Female Tutor Preferred', 'Male Tutor Preferred', 'No Preference'].map(pref => (
            <TouchableOpacity
              key={pref}
              style={[editProfStyles.chip, formData.preferred_tutor_gender === pref && editProfStyles.chipActive]}
              onPress={() => setFormData(f => ({ ...f, preferred_tutor_gender: pref }))}
            >
              <Text style={[editProfStyles.chipText, formData.preferred_tutor_gender === pref && editProfStyles.chipTextActive]}>{pref}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[editProfStyles.fieldLabel, { marginTop: Spacing.md }]}>Preferred Session Format</Text>
        <View style={editProfStyles.chipsRow}>
          {['In-Person (Home Tutoring)', 'Online Tutoring', 'Flexible / Either'].map(fmt => (
            <TouchableOpacity
              key={fmt}
              style={[editProfStyles.chip, formData.preferred_session_format === fmt && editProfStyles.chipActive]}
              onPress={() => setFormData(f => ({ ...f, preferred_session_format: fmt }))}
            >
              <Text style={[editProfStyles.chipText, formData.preferred_session_format === fmt && editProfStyles.chipTextActive]}>{fmt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Section>

      <Section title="✍️ Specific Tutor Requirements">
        <Text style={editProfStyles.fieldLabel}>Additional Notes for Eagle Tutorials</Text>
        <TextInput
          style={[editProfStyles.input, { minHeight: 100 }]}
          multiline
          placeholder="e.g. Looking for a patient math tutor for my Grade 8 daughter in Bole. Available Mondays and Wednesdays..."
          value={formData.academic_summary}
          onChangeText={t => setFormData(f => ({ ...f, academic_summary: t }))}
          placeholderTextColor={Colors.textSecondary}
        />
      </Section>
    </>
  );

  return (
    <SafeAreaView style={CommonStyles.screenBg} edges={['top', 'bottom']}>
      <View style={editProfStyles.header}>
        <TouchableOpacity
          style={editProfStyles.backBtn}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={{ fontSize: 20, color: Colors.text }}>←</Text>
        </TouchableOpacity>
        <Text style={editProfStyles.title}>Edit Profile ({role.charAt(0).toUpperCase() + role.slice(1)})</Text>
      </View>
      <KeyboardAwareScreen contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}>
        <Section title="👤 Personal Information">
          <Text style={editProfStyles.fieldLabel}>Full Name *</Text>
          <TextInput
            style={editProfStyles.input}
            value={formData.full_name}
            onChangeText={t => setFormData(f => ({ ...f, full_name: t }))}
            placeholder="Your full name"
            placeholderTextColor={Colors.textSecondary}
          />
          <Text style={[editProfStyles.fieldLabel, { marginTop: Spacing.sm }]}>Phone Number *</Text>
          <TextInput
            style={editProfStyles.input}
            value={formData.phone}
            onChangeText={t => setFormData(f => ({ ...f, phone: t }))}
            placeholder="+251 9xx xxx xxxx"
            keyboardType="phone-pad"
            placeholderTextColor={Colors.textSecondary}
          />
          <Text style={[editProfStyles.fieldLabel, { marginTop: Spacing.sm }]}>City</Text>
          <TextInput
            style={editProfStyles.input}
            value={formData.city}
            onChangeText={t => setFormData(f => ({ ...f, city: t }))}
            placeholder="e.g. Addis Ababa"
            placeholderTextColor={Colors.textSecondary}
          />
        </Section>

        {isTutor ? renderTutorFields() : isParent ? renderParentFields() : renderStudentFields()}

        <Button
          title={loading ? 'Saving...' : 'Save Profile'}
          variant='primary'
          onPress={handleSave}
          loading={loading}
          style={{ marginTop: Spacing.lg }}
        />
      </KeyboardAwareScreen>
    </SafeAreaView>
  );
}

const editProfStyles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.xl, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 36, height: 36, backgroundColor: Colors.grayLight, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.text },
  section: { backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  sectionTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.text, marginBottom: Spacing.md },
  fieldLabel: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textSecondary, marginBottom: Spacing.xs },
  input: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.md, fontSize: Typography.base, color: Colors.text },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.lg, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.blue, borderColor: Colors.blue },
  chipText: { fontSize: Typography.xs, fontWeight: Typography.medium, color: Colors.textSecondary },
  chipTextActive: { color: Colors.white, fontWeight: Typography.semibold },
  switchCard: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchTitle: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.text },
  switchSub: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
});

