import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Alert, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { Button } from '@/components/common';
import { useAuthStore } from '@/store/authStore';
import { DEPARTMENTS, FIELDS_OF_STUDY } from '@eagle-pathway/shared';

export function EditProfileScreen() {
  const { user, updateProfile } = useAuthStore();
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    interested_subjects: user?.interested_subjects || [],
    academic_summary: user?.academic_summary || '',
    has_ielts: user?.has_ielts || false,
    is_english_medium: user?.is_english_medium || false,
    target_degree_level: user?.target_degree_level || 'BSc',
    has_extracurriculars: user?.has_extracurriculars || false,
    target_departments: user?.target_departments || [],
    grade_level: user?.grade_level || '',
    gpa: user?.gpa || '',
    gpa_max: user?.gpa_max || '4.0',
    city: user?.city || '',
    phone: user?.phone || '',
  });
  const [loading, setLoading] = useState(false);

  // Using centralized metadata from @eagle-pathway/shared

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfile({
        full_name: formData.full_name,
        phone: formData.phone,
        city: formData.city,
        interested_subjects: formData.interested_subjects,
        academic_summary: formData.academic_summary,
        has_ielts: formData.has_ielts,
        is_english_medium: formData.is_english_medium,
        target_degree_level: formData.target_degree_level,
        has_extracurriculars: formData.has_extracurriculars,
        target_departments: formData.target_departments,
        grade_level: formData.grade_level,
        gpa: formData.gpa ? parseFloat(formData.gpa.toString()) : undefined,
        gpa_max: formData.gpa_max ? parseFloat(formData.gpa_max.toString()) : undefined,
      });
      Alert.alert('Success', 'Profile updated successfully!');
      (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'));
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleSubject = (s: string) => {
    setFormData(prev => ({
      ...prev,
      interested_subjects: prev.interested_subjects.includes(s)
        ? prev.interested_subjects.filter(x => x !== s)
        : [...prev.interested_subjects, s]
    }));
  };

  const toggleDepartment = (d: string) => {
    setFormData(prev => ({
      ...prev,
      target_departments: prev.target_departments.includes(d)
        ? prev.target_departments.filter(x => x !== d)
        : [...prev.target_departments, d]
    }));
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={editProfStyles.section}>
      <Text style={editProfStyles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={CommonStyles.screenBg} edges={['top']}>
      <View style={editProfStyles.header}>
        <TouchableOpacity style={editProfStyles.backBtn} onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))} activeOpacity={0.8}>
          <Text style={{ fontSize: 20, color: Colors.text }}>←</Text>
        </TouchableOpacity>
        <Text style={editProfStyles.title}>Edit Profile</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}>
        <Section title="👤 Personal Information">
          <Text style={editProfStyles.fieldLabel}>Full Name</Text>
          <TextInput 
            style={editProfStyles.input} 
            value={formData.full_name} 
            onChangeText={t => setFormData(f => ({ ...f, full_name: t }))} 
            placeholder="Your full name"
          />
          <Text style={editProfStyles.fieldLabel}>Phone Number</Text>
          <TextInput 
            style={editProfStyles.input} 
            value={formData.phone} 
            onChangeText={t => setFormData(f => ({ ...f, phone: t }))} 
            placeholder="+251 9xx xxx xxxx"
            keyboardType="phone-pad"
          />
          <Text style={editProfStyles.fieldLabel}>City</Text>
          <TextInput 
            style={editProfStyles.input} 
            value={formData.city} 
            onChangeText={t => setFormData(f => ({ ...f, city: t }))} 
            placeholder="e.g. Addis Ababa"
          />
        </Section>

        <Section title="🎓 Academic Background">
          <Text style={editProfStyles.fieldLabel}>Current Grade Level</Text>
          <View style={editProfStyles.chipsRow}>
            {['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'University'].map(lvl => (
              <TouchableOpacity 
                key={lvl} 
                style={[editProfStyles.chip, formData.grade_level === lvl && editProfStyles.chipActive]}
                onPress={() => setFormData(f => ({ ...f, grade_level: lvl }))}
              >
                <Text style={[editProfStyles.chipText, formData.grade_level === lvl && editProfStyles.chipTextActive]}>{lvl}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={editProfStyles.fieldLabel}>Target Degree Level</Text>
          <View style={editProfStyles.chipsRow}>
            {['BSc', 'MSc', 'PhD'].map(lvl => (
              <TouchableOpacity 
                key={lvl} 
                style={[editProfStyles.chip, formData.target_degree_level === lvl && editProfStyles.chipActive]}
                onPress={() => setFormData(f => ({ ...f, target_degree_level: lvl }))}
              >
                <Text style={[editProfStyles.chipText, formData.target_degree_level === lvl && editProfStyles.chipTextActive]}>{lvl}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={editProfStyles.fieldLabel}>Cumulative GPA</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, color: Colors.textSecondary, marginBottom: 4, fontWeight: '600' }}>ACTUAL GPA</Text>
              <TextInput 
                style={editProfStyles.input} 
                keyboardType='numeric'
                value={formData.gpa.toString()} 
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
                value={formData.gpa_max.toString()} 
                onChangeText={t => setFormData(f => ({ ...f, gpa_max: t }))} 
                placeholder="e.g. 4.0"
              />
            </View>
          </View>
        </Section>

        <Section title="🌐 Language & Tests">
          <View style={editProfStyles.switchCard}>
            <View style={editProfStyles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={editProfStyles.switchTitle}>IELTS/TOEFL Score</Text>
                <Text style={editProfStyles.switchSub}>Do you have test scores?</Text>
              </View>
              <Switch 
                value={formData.has_ielts} 
                onValueChange={v => setFormData(f => ({ ...f, has_ielts: v }))} 
                trackColor={{ true: Colors.blue }}
              />
            </View>
          </View>
          <View style={editProfStyles.switchCard}>
            <View style={editProfStyles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={editProfStyles.switchTitle}>English Medium</Text>
                <Text style={editProfStyles.switchSub}>Studied in English before?</Text>
              </View>
              <Switch 
                value={formData.is_english_medium} 
                onValueChange={v => setFormData(f => ({ ...f, is_english_medium: v }))} 
                trackColor={{ true: Colors.blue }}
              />
            </View>
          </View>
        </Section>

        <Section title="💼 Interests & Goals">
          <Text style={editProfStyles.fieldLabel}>Interested Fields (Tap to select)</Text>
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

          <Text style={editProfStyles.fieldLabel}>Target Departments (Tap to select)</Text>
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
            style={[editProfStyles.input, { minHeight: 120 }]} 
            multiline
            placeholder='Tell us about your academic achievements, goals, and why you want to study abroad...'
            value={formData.academic_summary} 
            onChangeText={t => setFormData(f => ({ ...f, academic_summary: t }))} 
          />
        </Section>

        <Section title="🏆 Activities">
          <View style={editProfStyles.switchCard}>
            <View style={editProfStyles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={editProfStyles.switchTitle}>Extracurricular Activities</Text>
                <Text style={editProfStyles.switchSub}>Sports, clubs, volunteering, etc.</Text>
              </View>
              <Switch 
                value={formData.has_extracurriculars} 
                onValueChange={v => setFormData(f => ({ ...f, has_extracurriculars: v }))} 
                trackColor={{ true: Colors.blue }}
              />
            </View>
          </View>
        </Section>

        <Button title='Save Profile' variant='primary' onPress={handleSave} loading={loading} style={{ marginTop: Spacing.lg }} />
      </ScrollView>
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
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: Radius.lg, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.blue, borderColor: Colors.blue },
  chipText: { fontSize: Typography.sm, fontWeight: Typography.medium, color: Colors.textSecondary },
  chipTextActive: { color: Colors.white, fontWeight: Typography.semibold },
  switchCard: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchTitle: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.text },
  switchSub: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
});
