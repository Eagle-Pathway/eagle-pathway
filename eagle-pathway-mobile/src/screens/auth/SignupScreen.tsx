import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '@/utils/theme';
import { Button } from '@/components/common';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth';
import { UserRole } from '@/types';

const ROLES: { key: UserRole; label: string; emoji: string }[] = [
  { key: 'student', label: 'Student', emoji: '🎓' },
  { key: 'parent', label: 'Parent', emoji: '👨‍👩‍👧' },
  { key: 'tutor', label: 'Tutor', emoji: '📚' },
];

export default function SignupScreen() {
  const params = useLocalSearchParams<{
    ref?: string;
    referral_code?: string;
    source?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
  }>();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [isSignedUp, setIsSignedUp] = useState(false);
  const [code, setCode] = useState('');
  const [resending, setResending] = useState(false);
  const { signUp, verifySignup, isLoading } = useAuthStore();

  const handleContinue = async () => {
    if (!fullName.trim()) return Alert.alert('Error', 'Please enter your full name');
    if (!email.trim()) return Alert.alert('Error', 'Please enter your email');
    if (!phone.trim()) return Alert.alert('Error', 'Please enter your phone number');
    if (password.length < 8) return Alert.alert('Error', 'Password must be at least 8 characters');
    if (password !== confirmPassword) return Alert.alert('Error', 'Passwords do not match');

    try {
      const referralCode = params.referral_code || params.ref;
      await signUp(email.trim(), password, fullName.trim(), phone.trim(), role, {
        referral_code: typeof referralCode === 'string' ? referralCode : undefined,
        signup_source: typeof params.source === 'string' ? params.source : typeof params.utm_source === 'string' ? params.utm_source : undefined,
        utm_source: typeof params.utm_source === 'string' ? params.utm_source : undefined,
        utm_medium: typeof params.utm_medium === 'string' ? params.utm_medium : undefined,
        utm_campaign: typeof params.utm_campaign === 'string' ? params.utm_campaign : undefined,
        utm_content: typeof params.utm_content === 'string' ? params.utm_content : undefined,
        first_landing_url: Object.keys(params).length ? JSON.stringify(params) : undefined,
      });
      setIsSignedUp(true);
    } catch (e: any) {
      Alert.alert('Signup Failed', e.message || 'Please try again.');
    }
  };

  const handleVerify = async () => {
    if (code.trim().length < 6) return Alert.alert('Error', 'Enter the 6-digit code from your email');
    try {
      await verifySignup(email.trim(), code.trim());
      router.replace('/(tabs)/home');
    } catch (e: any) {
      Alert.alert('Verification Failed', e.message || 'That code is invalid or expired.');
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await authService.resendSignupOtp(email.trim());
      Alert.alert('Code sent', `We sent a new code to ${email.trim()}.`);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not resend the code.');
    } finally {
      setResending(false);
    }
  };

  if (isSignedUp) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContent}>
          <View style={styles.successIconWrap}>
            <Text style={styles.successIcon}>✉️</Text>
          </View>
          <Text style={styles.successTitle}>Verify your email</Text>
          <Text style={styles.successSubtitle}>
            We've sent a 6-digit code to <Text style={{ color: Colors.text, fontWeight: Typography.bold }}>{email}</Text>.
            Enter it below to activate your account.
          </Text>

          <TextInput
            style={[styles.input, styles.codeInput, { width: '100%', marginTop: Spacing.xl }]}
            placeholder="123456"
            value={code}
            onChangeText={(t) => setCode(t.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
            textContentType="oneTimeCode"
            placeholderTextColor={Colors.textSecondary}
            onSubmitEditing={handleVerify}
            returnKeyType="done"
          />

          <Button
            title="Verify & Continue"
            onPress={handleVerify}
            loading={isLoading}
            style={{ width: '100%', marginTop: Spacing.lg }}
          />

          <TouchableOpacity style={{ marginTop: Spacing.xl }} onPress={handleResend} disabled={resending}>
            <Text style={{ color: Colors.blue, fontWeight: Typography.semibold }}>{resending ? 'Resending…' : "Didn't get it? Resend code"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ marginTop: Spacing.lg }} onPress={() => { setIsSignedUp(false); setCode(''); }}>
            <Text style={{ color: Colors.textSecondary, textDecorationLine: 'underline' }}>Wait, I entered the wrong email</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.backBtn} onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))}>
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
              <Text style={styles.label}>Email Address</Text>
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
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor={Colors.textSecondary}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
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

            <Button title="Create Account" onPress={handleContinue} loading={isLoading} style={{ marginTop: Spacing.sm }} />

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
  successContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing['3xl'] },
  successIconWrap: { 
    width: 100, height: 100, borderRadius: 50, 
    backgroundColor: Colors.blueLight, 
    alignItems: 'center', justifyContent: 'center', 
    marginBottom: Spacing.xl 
  },
  successIcon: { fontSize: 40 },
  successTitle: { fontSize: Typography['4xl'], fontWeight: Typography.bold, color: Colors.text, marginBottom: Spacing.md },
  successSubtitle: { fontSize: Typography.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
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
  codeInput: { fontSize: 26, letterSpacing: 8, textAlign: 'center', fontWeight: Typography.bold },
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
