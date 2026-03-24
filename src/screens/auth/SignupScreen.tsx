import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '@/utils/theme';
import { Button } from '@/components/common';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types';

const ROLES: { key: UserRole; label: string; emoji: string }[] = [
  { key: 'student', label: 'Student', emoji: '🎓' },
  { key: 'parent', label: 'Parent', emoji: '👨‍👩‍👧' },
  { key: 'tutor', label: 'Tutor', emoji: '📚' },
];

export default function SignupScreen() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const { initiateSignup, isLoading } = useAuthStore();

  const handleContinue = async () => {
    if (!fullName.trim()) return Alert.alert('Error', 'Please enter your full name');
    if (!email.trim()) return Alert.alert('Error', 'Please enter your email');
    if (!phone.trim()) return Alert.alert('Error', 'Please enter your phone number');

    try {
      await initiateSignup(fullName.trim(), phone.trim(), role, email.trim());
      router.push({ pathname: '/(auth)/otp', params: { phone } });
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to send OTP. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join thousands of Ethiopian students on their journey abroad</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Abebe Girma"
                value={fullName}
                onChangeText={setFullName}
                placeholderTextColor={Colors.textSecondary}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="+251 9xx xxx xxxx"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholderTextColor={Colors.textSecondary}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={Colors.textSecondary}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>I am a...</Text>
              <View style={styles.roleRow}>
                {ROLES.map(r => (
                  <TouchableOpacity
                    key={r.key}
                    style={[styles.roleChip, role === r.key && styles.roleChipActive]}
                    onPress={() => setRole(r.key)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.roleEmoji}>{r.emoji}</Text>
                    <Text style={[styles.roleLabel, role === r.key && styles.roleLabelActive]}>
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Button title="Send Verification Code" onPress={handleContinue} loading={isLoading} style={{ marginTop: Spacing.sm }} />

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.loginLink} onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.loginText}>
                Already have an account? <Text style={styles.loginHighlight}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  backBtn: { padding: Spacing.xl, paddingBottom: 0 },
  backArrow: { fontSize: 24, color: Colors.text },
  header: { padding: Spacing.xl, paddingTop: Spacing.lg },
  title: { fontSize: Typography['6xl'], fontWeight: Typography.bold, color: Colors.text, marginBottom: Spacing.xs },
  subtitle: { fontSize: Typography.md, color: Colors.textSecondary, lineHeight: 22 },
  form: { padding: Spacing.xl, gap: Spacing.lg },
  fieldGroup: { gap: Spacing.xs },
  label: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.text },
  optional: { fontWeight: Typography.regular, color: Colors.textSecondary },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 13,
    fontSize: Typography.lg,
    color: Colors.text,
    backgroundColor: '#fafafa',
  },
  roleRow: { flexDirection: 'row', gap: Spacing.sm },
  roleChip: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fafafa',
  },
  roleChipActive: { borderColor: Colors.blue, backgroundColor: Colors.blueLight },
  roleEmoji: { fontSize: 20 },
  roleLabel: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textSecondary },
  roleLabelActive: { color: Colors.blue },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: Typography.sm, color: Colors.textSecondary },
  loginLink: { alignItems: 'center' },
  loginText: { fontSize: Typography.base, color: Colors.textSecondary },
  loginHighlight: { color: Colors.blue, fontWeight: Typography.semibold },
});
