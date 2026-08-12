import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput,
} from 'react-native';
import { toast } from '@/utils/toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Radius, Spacing, CommonStyles } from '@/utils/theme';
import { Button, Dropdown, DropdownOption } from '@/components/common';
import { KeyboardAwareScreen } from '@/components/KeyboardAwareScreen';
import { useAuthStore } from '@/store/authStore';
import { showError } from '@/utils/errorHandler';
import { withTimeout } from '@/utils/asyncUtils';
import { getUserRole } from '@/utils/role';
import { DEPARTMENTS, FIELDS_OF_STUDY, COUNTRIES, validatePhone } from '@eagle-pathway/shared';

const CURRENT_LEVEL_OPTIONS: DropdownOption[] = [
  { label: 'High School Student', value: 'High School Student' },
  { label: 'Undergraduate Student', value: 'Undergraduate Student' },
  { label: 'Bachelor\'s Degree Holder', value: 'Bachelor\'s Degree Holder' },
  { label: 'Master\'s Student', value: 'Master\'s Student' },
  { label: 'Master\'s Degree Holder', value: 'Master\'s Degree Holder' },
  { label: 'PhD Student', value: 'PhD Student' },
  { label: 'PhD Degree Holder', value: 'PhD Degree Holder' },
];

const TARGET_DEGREE_OPTIONS: DropdownOption[] = [
  { label: 'High School Diploma', value: 'High School Diploma' },
  { label: 'BSc (Science / Engineering)', value: 'BSc' },
  { label: 'BA (Arts / Humanities)', value: 'BA' },
  { label: 'BEd (Education)', value: 'BEd' },
  { label: 'LLB (Law)', value: 'LLB' },
  { label: 'MD / MBBS (Medicine)', value: 'MD' },
  { label: 'MSc (Master of Science)', value: 'MSc' },
  { label: 'MA (Master of Arts)', value: 'MA' },
  { label: 'MBA (Business Administration)', value: 'MBA' },
  { label: 'MPH (Master of Public Health)', value: 'MPH' },
  { label: 'LLM (Master of Laws)', value: 'LLM' },
  { label: 'PhD / Doctorate', value: 'PhD' },
  { label: 'Postdoctoral Research', value: 'Postdoctoral Research' },
];

function normalizeCurrentLevel(level?: string): string {
  if (!level) return 'Undergraduate Student';
  if (['High School', 'highschool', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'].includes(level)) {
    return 'High School Student';
  }
  if (level === 'Undergraduate') return 'Undergraduate Student';
  if (level === 'Postgraduate') return 'Master\'s Student';
  if (CURRENT_LEVEL_OPTIONS.some(o => o.value === level)) return level;
  return 'Undergraduate Student';
}

function normalizeTargetDegree(degree?: string): string {
  if (!degree) return 'BSc';
  if (TARGET_DEGREE_OPTIONS.some(o => o.value === degree)) return degree;
  if (degree === 'PhD') return 'PhD';
  return 'BSc';
}

const COUNTRY_DROPDOWN_OPTIONS: DropdownOption[] = [
  { label: 'Any Location / Open to All', value: 'Any Location', icon: '🌍' },
  ...COUNTRIES.map(c => ({ label: c.name, value: c.name, icon: c.flag })),
];

const FIELDS_OF_STUDY_OPTIONS: DropdownOption[] = FIELDS_OF_STUDY.map(s => ({
  label: s.charAt(0).toUpperCase() + s.slice(1),
  value: s,
}));

const DEPARTMENT_DROPDOWN_OPTIONS: DropdownOption[] = DEPARTMENTS.map(d => ({
  label: d,
  value: d,
}));

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

const TUTOR_SUBJECT_OPTIONS: DropdownOption[] = TUTOR_SUBJECTS.map(s => ({
  label: s,
  value: s,
}));

const TEACHING_EXPERIENCE_DROPDOWN: DropdownOption[] = TEACHING_EXPERIENCE_OPTIONS.map(exp => ({
  label: exp,
  value: exp,
}));

const CHILDREN_GRADE_OPTIONS: DropdownOption[] = [
  { label: 'KG / Primary (Grades 1-8)', value: 'KG / Primary (Grades 1-8)' },
  { label: 'High School (Grades 9-12)', value: 'High School (Grades 9-12)' },
  { label: 'College / SAT Prep', value: 'College / SAT Prep' },
];

const PREFERRED_GENDER_OPTIONS: DropdownOption[] = [
  { label: 'No Preference', value: 'No Preference' },
  { label: 'Female Tutor Preferred', value: 'Female Tutor Preferred' },
  { label: 'Male Tutor Preferred', value: 'Male Tutor Preferred' },
];

const SESSION_FORMAT_OPTIONS: DropdownOption[] = [
  { label: 'In-Person (Home Tutoring)', value: 'In-Person (Home Tutoring)' },
  { label: 'Online Tutoring', value: 'Online Tutoring' },
  { label: 'Flexible / Either', value: 'Flexible / Either' },
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
    target_degree_level: normalizeTargetDegree(user?.target_degree_level),
    target_countries: user?.target_countries || ['USA'],
    has_extracurriculars: user?.has_extracurriculars || false,
    target_departments: user?.target_departments || [],
    grade_level: normalizeCurrentLevel(user?.grade_level),
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
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const toggleSubject = (s: string) => {
    setFormData(prev => ({
      ...prev,
      interested_subjects: prev.interested_subjects.includes(s)
        ? prev.interested_subjects.filter(i => i !== s)
        : [...prev.interested_subjects, s],
    }));
  };

  const toggleCountry = (c: string) => {
    setFormData(prev => {
      if (c === 'Any Location') {
        const hasAny = prev.target_countries.includes('Any Location');
        return { ...prev, target_countries: hasAny ? [] : ['Any Location'] };
      }
      const filtered = prev.target_countries.filter(i => i !== 'Any Location');
      return {
        ...prev,
        target_countries: filtered.includes(c)
          ? filtered.filter(i => i !== c)
          : [...filtered, c],
      };
    });
  };

  const toggleDepartment = (d: string) => {
    setFormData(prev => ({
      ...prev,
      target_departments: prev.target_departments.includes(d)
        ? prev.target_departments.filter(i => i !== d)
        : [...prev.target_departments, d],
    }));
  };

  const toggleGrade = (g: string) => {
    setFormData(prev => ({
      ...prev,
      children_grades: prev.children_grades.includes(g)
        ? prev.children_grades.filter(i => i !== g)
        : [...prev.children_grades, g],
    }));
  };

  const handleSave = async () => {
    const newErrors: { [key: string]: string } = {};
    const name = formData.full_name?.toString().trim();
    const phone = formData.phone?.toString().trim();

    if (!name) newErrors.full_name = 'Full name is required';
    if (!phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(phone)) {
      newErrors.phone = 'Enter a valid Ethiopian phone number (e.g. 0911234567)';
    }

    if (isTutor) {
      if (!formData.living_address?.toString().trim()) {
        newErrors.living_address = 'Residence address / sub-city is required';
      }
      if (!formData.university_name?.toString().trim()) {
        newErrors.university_name = 'University / college name is required';
      }
      if (!formData.cgpa?.toString().trim()) {
        newErrors.cgpa = 'Current CGPA is required';
      }
      if (!formData.telegram_username?.toString().trim()) {
        newErrors.telegram_username = 'Telegram username is required';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

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
        updates.interested_subjects = formData.interested_subjects;
        updates.academic_summary = formData.academic_summary;
      } else if (isParent) {
        updates.living_address = formData.living_address;
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
        const parsedGpa = formData.gpa ? parseFloat(formData.gpa.toString()) : NaN;
        const parsedGpaMax = formData.gpa_max ? parseFloat(formData.gpa_max.toString()) : NaN;
        if (!Number.isNaN(parsedGpa)) updates.gpa = parsedGpa;
        if (!Number.isNaN(parsedGpaMax)) updates.gpa_max = parsedGpaMax;
      }

      await withTimeout(updateProfile(updates));
      setLoading(false);
      toast.success('Profile Saved', 'Profile saved successfully!');
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
      <Section title="Academic Status">
        <Dropdown
          label="Current Academic Level *"
          options={CURRENT_LEVEL_OPTIONS}
          selectedValue={formData.grade_level}
          onValueChange={val => setFormData(f => ({ ...f, grade_level: val }))}
          placeholder="Select your current academic level..."
          searchable
          style={{ marginBottom: Spacing.md }}
        />

        <Dropdown
          label="Target Degree Program *"
          options={TARGET_DEGREE_OPTIONS}
          selectedValue={formData.target_degree_level}
          onValueChange={val => setFormData(f => ({ ...f, target_degree_level: val }))}
          placeholder="Select target degree program..."
          searchable
          style={{ marginBottom: Spacing.md }}
        />

        <Text style={[editProfStyles.fieldLabel, { marginTop: Spacing.xs }]}>Cumulative GPA / Academic Score</Text>
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

      <Section title="Study Abroad & Language Goals">
        <Dropdown
          label="Target Countries *"
          options={COUNTRY_DROPDOWN_OPTIONS}
          isMultiSelect
          selectedValues={formData.target_countries}
          onMultiValueChange={(vals: string[]) => setFormData(f => ({ ...f, target_countries: vals }))}
          placeholder="Select target countries..."
          searchable
          style={{ marginBottom: Spacing.md }}
        />

        <Text style={[editProfStyles.fieldLabel, { marginTop: Spacing.xs }]}>Language & Standardized Tests</Text>
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

      <Section title=" Target Fields of Study">
        <Dropdown
          label="Target Fields of Study *"
          options={FIELDS_OF_STUDY_OPTIONS}
          isMultiSelect
          selectedValues={formData.interested_subjects}
          onMultiValueChange={(vals: string[]) => setFormData(f => ({ ...f, interested_subjects: vals }))}
          placeholder="Select target fields of study..."
          searchable
          style={{ marginBottom: Spacing.md }}
        />

        <Dropdown
          label="Target Departments *"
          options={DEPARTMENT_DROPDOWN_OPTIONS}
          isMultiSelect
          selectedValues={formData.target_departments}
          onMultiValueChange={(vals: string[]) => setFormData(f => ({ ...f, target_departments: vals }))}
          placeholder="Select target departments..."
          searchable
          style={{ marginBottom: Spacing.md }}
        />
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
          style={[editProfStyles.input, errors.living_address && editProfStyles.inputError]}
          value={formData.living_address}
          onChangeText={t => { setErrors(e => ({ ...e, living_address: '' })); setFormData(f => ({ ...f, living_address: t })); }}
          placeholder="e.g. Bole, Addis Ababa (near Medhanialem)"
          placeholderTextColor={Colors.textSecondary}
        />
        {errors.living_address && <Text style={editProfStyles.fieldError}>{errors.living_address}</Text>}

        <Text style={[editProfStyles.fieldLabel, { marginTop: Spacing.sm }]}>Telegram Username *</Text>
        <TextInput
          style={[editProfStyles.input, errors.telegram_username && editProfStyles.inputError]}
          value={formData.telegram_username}
          onChangeText={t => { setErrors(e => ({ ...e, telegram_username: '' })); setFormData(f => ({ ...f, telegram_username: t })); }}
          placeholder="e.g. @yourusername"
          autoCapitalize="none"
          placeholderTextColor={Colors.textSecondary}
        />
        {errors.telegram_username && <Text style={editProfStyles.fieldError}>{errors.telegram_username}</Text>}
      </Section>

      <Section title="🎓 Qualifications & Education">
        <Text style={editProfStyles.fieldLabel}>University / College Name *</Text>
        <TextInput
          style={[editProfStyles.input, errors.university_name && editProfStyles.inputError]}
          value={formData.university_name}
          onChangeText={t => { setErrors(e => ({ ...e, university_name: '' })); setFormData(f => ({ ...f, university_name: t })); }}
          placeholder="e.g. Addis Ababa University (AAiT)"
          placeholderTextColor={Colors.textSecondary}
        />
        {errors.university_name && <Text style={editProfStyles.fieldError}>{errors.university_name}</Text>}

        <Dropdown
          label="Degree Type / Program"
          options={TARGET_DEGREE_OPTIONS}
          selectedValue={formData.target_degree_level}
          onValueChange={val => setFormData(f => ({ ...f, target_degree_level: val }))}
          placeholder="Select degree type..."
          searchable
          style={{ marginTop: Spacing.sm }}
        />

        <Text style={[editProfStyles.fieldLabel, { marginTop: Spacing.sm }]}>Current CGPA *</Text>
        <TextInput
          style={[editProfStyles.input, errors.cgpa && editProfStyles.inputError]}
          keyboardType="numeric"
          value={formData.cgpa}
          onChangeText={t => { setErrors(e => ({ ...e, cgpa: '' })); setFormData(f => ({ ...f, cgpa: t })); }}
          placeholder="e.g. 3.75"
          placeholderTextColor={Colors.textSecondary}
        />
        {errors.cgpa && <Text style={editProfStyles.fieldError}>{errors.cgpa}</Text>}
        <Text style={{ fontSize: 11, color: Colors.textSecondary, marginTop: 4 }}>Out of 4.0</Text>
      </Section>

      <Section title="📚 Teaching Experience & Subjects">
        <Dropdown
          label="Teaching Experience"
          options={TEACHING_EXPERIENCE_DROPDOWN}
          selectedValue={formData.teaching_experience}
          onValueChange={val => setFormData(f => ({ ...f, teaching_experience: val }))}
          placeholder="Select teaching experience level..."
          style={{ marginBottom: Spacing.md }}
        />

        <Dropdown
          label="Subjects You Teach"
          options={TUTOR_SUBJECT_OPTIONS}
          isMultiSelect
          selectedValues={formData.interested_subjects}
          onMultiValueChange={(vals: string[]) => setFormData(f => ({ ...f, interested_subjects: vals }))}
          placeholder="Select subjects you teach..."
          searchable
          style={{ marginBottom: Spacing.md }}
        />
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
        <Dropdown
          label="Children's Grade Levels"
          options={CHILDREN_GRADE_OPTIONS}
          isMultiSelect
          selectedValues={formData.children_grades}
          onMultiValueChange={(vals: string[]) => setFormData(f => ({ ...f, children_grades: vals }))}
          placeholder="Select grade levels..."
          style={{ marginBottom: Spacing.md }}
        />

        <Dropdown
          label="Preferred Tutor Gender"
          options={PREFERRED_GENDER_OPTIONS}
          selectedValue={formData.preferred_tutor_gender}
          onValueChange={val => setFormData(f => ({ ...f, preferred_tutor_gender: val }))}
          placeholder="Select gender preference..."
          style={{ marginBottom: Spacing.md }}
        />

        <Dropdown
          label="Preferred Session Format"
          options={SESSION_FORMAT_OPTIONS}
          selectedValue={formData.preferred_session_format}
          onValueChange={val => setFormData(f => ({ ...f, preferred_session_format: val }))}
          placeholder="Select session format..."
          style={{ marginBottom: Spacing.md }}
        />
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
            style={[editProfStyles.input, errors.full_name && editProfStyles.inputError]}
            value={formData.full_name}
            onChangeText={t => { setErrors(e => ({ ...e, full_name: '' })); setFormData(f => ({ ...f, full_name: t })); }}
            placeholder="Your full name"
            placeholderTextColor={Colors.textSecondary}
          />
          {errors.full_name && <Text style={editProfStyles.fieldError}>{errors.full_name}</Text>}

          <Text style={[editProfStyles.fieldLabel, { marginTop: Spacing.sm }]}>Phone Number *</Text>
          <TextInput
            style={[editProfStyles.input, errors.phone && editProfStyles.inputError]}
            value={formData.phone}
            onChangeText={t => { setErrors(e => ({ ...e, phone: '' })); setFormData(f => ({ ...f, phone: t })); }}
            placeholder="+251 9xx xxx xxxx"
            keyboardType="phone-pad"
            placeholderTextColor={Colors.textSecondary}
          />
          {errors.phone && <Text style={editProfStyles.fieldError}>{errors.phone}</Text>}

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
  input: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.md, fontSize: Typography.base, color: Colors.text, textAlignVertical: 'top' },
  inputError: { borderColor: Colors.red },
  fieldError: { fontSize: Typography.xs, color: Colors.red, marginTop: 4, fontWeight: Typography.semibold },
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

