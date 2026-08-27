import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { toast } from '@/utils/toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '@/utils/theme';
import { Button } from '@/components/common';
import { PasswordInput } from '@/components/PasswordInput';
import { PasswordStrengthMeter } from '@/components/PasswordStrengthMeter';
import { KeyboardAwareScreen } from '@/components/KeyboardAwareScreen';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth';
import { UserRole } from '@/types';
import { showError, getErrorMessage } from '@/utils/errorHandler';
import { validatePasswordStrength } from '@eagle-pathway/shared';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_COOLDOWN_SECONDS = 60;

const ROLES: { key: UserRole; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { key: 'student', label: 'Student', icon: 'school-outline' },
  { key: 'parent', label: 'Parent', icon: 'people-outline' },
  { key: 'tutor', label: 'Tutor', icon: 'library-outline' },
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
    verifyEmail?: string;
  }>();
  // Entering from login with an unverified account: jump straight to the
  // verification screen with the email prefilled and the resend cooldown
  // already running (login just sent a fresh code).
  const verifyEmail = typeof params.verifyEmail === 'string' ? params.verifyEmail : '';
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(verifyEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  
  const emailRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const [isSignedUp, setIsSignedUp] = useState(!!verifyEmail);
  const [code, setCode] = useState('');
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(verifyEmail ? RESEND_COOLDOWN_SECONDS : 0);
  const { signUp, verifySignup, signInWithGoogle, isLoading, setLoading } = useAuthStore();

  // Tick down the resend cooldown so users can't hammer the (rate-limited) email sender.
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleContinue = async () => {
    if (!fullName.trim()) return toast.warning('Name Required', 'Please enter your full name');
    if (!email.trim()) return toast.warning('Email Required', 'Please enter your email');
    if (!EMAIL_RE.test(email.trim())) return toast.warning('Invalid Email', 'Please enter a valid email address');
    if (!phone.trim()) return toast.warning('Phone Required', 'Please enter your phone number');
    
    const strength = validatePasswordStrength(password);
    if (!strength.isValid) {
      return toast.warning(
        'Weak Password',
        'Your password does not meet security requirements.'
      );
    }
    
    if (password !== confirmPassword) return toast.warning('Password Mismatch', 'Passwords do not match');

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
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (e: any) {
      if (e?.code === 'email_exists') {
        return Alert.alert(
          'Email already registered',
          'An account with this email already exists. Sign in instead?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign In', onPress: () => router.replace('/(auth)/login') },
          ],
        );
      }
      if (e?.code === 'phone_exists') {
        return toast.warning('Phone number in use', getErrorMessage(e));
      }
      showError(e, 'Signup Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (code.trim().length < 6) return toast.warning('Invalid Code', 'Enter the 6-digit code from your email');
    try {
      await verifySignup(email.trim(), code.trim());
      setLoading(false);
      if (role === 'student') {
        router.replace('/onboarding');
      } else {
        router.replace('/(tabs)/home');
      }
    } catch (e: any) {
      showError(e, 'Verification Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    try {
      await authService.resendSignupOtp(email.trim());
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      toast.info('Code sent', `We sent a new code to ${email.trim()}.`);
    } catch (e: any) {
      showError(e, 'Could not resend code');
    } finally {
      setResending(false);
    }
  };

  if (isSignedUp) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAwareScreen contentContainerStyle={styles.successContent}>
          <View style={styles.iconBadge}>
            <Ionicons name="mail-outline" size={40} color={Colors.blue} />
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

          <TouchableOpacity style={{ marginTop: Spacing.xl }} onPress={handleResend} disabled={resending || resendCooldown > 0}>
            <Text style={{ color: resendCooldown > 0 ? Colors.textSecondary : Colors.blue, fontWeight: Typography.semibold }}>
              {resending ? 'Resending…' : resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Didn't get it? Resend code"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ marginTop: Spacing.lg }} onPress={() => { setIsSignedUp(false); setCode(''); }}>
            <Text style={{ color: Colors.textSecondary, textDecorationLine: 'underline' }}>Wait, I entered the wrong email</Text>
          </TouchableOpacity>
        </KeyboardAwareScreen>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAwareScreen>
        <TouchableOpacity style={styles.backBtn} onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))} accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join Ethiopian students on their journey to studying abroad</Text>
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
                textContentType="name"
                autoComplete="name"
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
                blurOnSubmit={false}
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
                ref={emailRef}
                textContentType="emailAddress"
                autoComplete="email"
                returnKeyType="next"
                onSubmitEditing={() => phoneRef.current?.focus()}
                blurOnSubmit={false}
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
                ref={phoneRef}
                textContentType="telephoneNumber"
                autoComplete="tel"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                blurOnSubmit={false}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <PasswordInput
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                ref={passwordRef}
                textContentType="newPassword"
                autoComplete="password-new"
                returnKeyType="next"
                onSubmitEditing={() => confirmPasswordRef.current?.focus()}
              />
              <PasswordStrengthMeter password={password} />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <PasswordInput
                placeholder="••••••••"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                ref={confirmPasswordRef}
                textContentType="newPassword"
                autoComplete="password-new"
                returnKeyType="done"
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
                    <Ionicons
                      name={r.icon}
                      size={20}
                      color={role === r.key ? Colors.blue : Colors.textSecondary}
                    />
                    <Text style={[styles.roleLabel, role === r.key && styles.roleLabelActive]}>
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Button title="Create Account" onPress={handleContinue} loading={isLoading} style={{ marginTop: Spacing.sm }} />

            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.md }}>
              <View style={{ flex: 1, height: 1, backgroundColor: Colors.border }} />
              <Text style={{ marginHorizontal: Spacing.md, fontSize: 12, color: Colors.textSecondary, fontWeight: Typography.medium }}>OR</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: Colors.border }} />
            </View>

            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                borderWidth: 1.5,
                borderColor: Colors.border,
                borderRadius: Radius.lg,
                paddingVertical: 14,
                backgroundColor: Colors.white,
              }}
              onPress={async () => {
                try {
                  await signInWithGoogle();
                  router.replace('/(tabs)/home');
                } catch (e: any) {
                  if (e?.message !== 'Google sign-in was cancelled or closed.') {
                    showError(e, 'Google Sign-Up Failed');
                  }
                } finally {
                  setLoading(false);
                }
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-google" size={20} color="#4285F4" />
              <Text style={{ fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.text }}>
                Continue with Google
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginLink} onPress={() => router.push('/(auth)/login')} activeOpacity={0.7}>
              <Text 
                numberOfLines={1} 
                adjustsFontSizeToFit 
                minimumFontScale={0.8}
                style={styles.loginText}
              >
                {"Already have an account? "}
                <Text style={styles.loginHighlight}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
      </KeyboardAwareScreen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  iconBadge: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.blueLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
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
    padding: Spacing.md,
    fontSize: Typography.base,
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
  roleLabel: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textSecondary },
  roleLabelActive: { color: Colors.blue },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: Typography.sm, color: Colors.textSecondary },
  loginLink: { alignItems: 'center', width: '100%', marginTop: Spacing.sm, paddingVertical: Spacing.xs },
  loginText: { fontSize: Typography.base, color: Colors.textSecondary, textAlign: 'center' },
  loginHighlight: { color: Colors.blue, fontWeight: Typography.bold },
  successContent: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl },
  successTitle: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.text, marginTop: Spacing.xl },
  successSubtitle: { fontSize: Typography.base, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm },
});
