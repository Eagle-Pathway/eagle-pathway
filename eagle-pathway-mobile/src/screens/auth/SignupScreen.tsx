import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { toast } from '@/utils/toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '@/utils/theme';
import { Button } from '@/components/common';
import { PasswordStrengthMeter } from '@/components/PasswordStrengthMeter';
import { KeyboardAwareScreen } from '@/components/KeyboardAwareScreen';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth';
import { UserRole } from '@/types';
import { showError, getErrorMessage } from '@/utils/errorHandler';
import { validatePasswordStrength } from '@eagle-pathway/shared';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_COOLDOWN_SECONDS = 60;

const ROLES: { 
  key: UserRole; 
  label: string; 
  tagline: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  badgeColor: string;
  bgColor: string;
}[] = [
  { 
    key: 'student', 
    label: 'Student', 
    tagline: 'Exams & Scholarships',
    icon: 'school-outline',
    badgeColor: '#2563EB',
    bgColor: 'rgba(37, 99, 235, 0.08)'
  },
  { 
    key: 'parent', 
    label: 'Parent', 
    tagline: 'Find 1-on-1 Tutors',
    icon: 'people-outline',
    badgeColor: '#D97706',
    bgColor: 'rgba(217, 119, 6, 0.08)'
  },
  { 
    key: 'tutor', 
    label: 'Tutor', 
    tagline: 'Teach & Earn',
    icon: 'library-outline',
    badgeColor: '#059669',
    bgColor: 'rgba(5, 150, 105, 0.08)'
  },
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

  const verifyEmail = typeof params.verifyEmail === 'string' ? params.verifyEmail : '';
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(verifyEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('student');
  
  const emailRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const [isSignedUp, setIsSignedUp] = useState(!!verifyEmail);
  const [code, setCode] = useState('');
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(verifyEmail ? RESEND_COOLDOWN_SECONDS : 0);
  const { signUp, verifySignup, signInWithGoogle, isLoading, setLoading } = useAuthStore();

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // Clean Ethiopian phone number formatting
  const handlePhoneChange = (val: string) => {
    // Keep numbers and +
    const cleaned = val.replace(/[^0-9+]/g, '');
    setPhone(cleaned);
  };

  const handleContinue = async () => {
    if (!fullName.trim()) return toast.warning('Name Required', 'Please enter your full name');
    if (!email.trim()) return toast.warning('Email Required', 'Please enter your email');
    if (!EMAIL_RE.test(email.trim())) return toast.warning('Invalid Email', 'Please enter a valid email address');
    if (!phone.trim()) return toast.warning('Phone Required', 'Please enter your phone number');
    
    const strength = validatePasswordStrength(password);
    if (!strength.isValid) {
      return toast.warning(
        'Weak Password',
        'Please enter a password with at least 8 characters, 1 uppercase letter, and 1 number.'
      );
    }

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

  // OTP Verification View
  if (isSignedUp) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAwareScreen contentContainerStyle={styles.successContent}>
          <View style={styles.iconBadge}>
            <Ionicons name="mail-open-outline" size={38} color={Colors.blue} />
          </View>
          <Text style={styles.successTitle}>Verify your email</Text>
          <Text style={styles.successSubtitle}>
            We've sent a 6-digit code to{' '}
            <Text style={{ color: Colors.text, fontWeight: Typography.bold }}>{email}</Text>.
            Enter it below to activate your account.
          </Text>

          <View style={styles.otpInputWrapper}>
            <TextInput
              style={styles.codeInput}
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
          </View>

          <Button
            title="Verify & Continue"
            onPress={handleVerify}
            loading={isLoading}
            style={{ width: '100%', marginTop: Spacing.lg }}
          />

          <TouchableOpacity 
            style={{ marginTop: Spacing.xl }} 
            onPress={handleResend} 
            disabled={resending || resendCooldown > 0}
          >
            <Text style={{ color: resendCooldown > 0 ? Colors.textSecondary : Colors.blue, fontWeight: Typography.semibold }}>
              {resending ? 'Resending…' : resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Didn't get it? Resend code"}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={{ marginTop: Spacing.md }} 
            onPress={() => { setIsSignedUp(false); setCode(''); }}
          >
            <Text style={{ color: Colors.textSecondary, textDecorationLine: 'underline', fontSize: Typography.sm }}>
              Change email address
            </Text>
          </TouchableOpacity>
        </KeyboardAwareScreen>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAwareScreen>
        {/* Top Navigation */}
        <View style={styles.topNav}>
          <TouchableOpacity 
            style={styles.backBtn} 
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))} 
            accessibilityRole="button" 
            accessibilityLabel="Go back"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join students, parents, and expert tutors across Ethiopia</Text>
        </View>

        <View style={styles.form}>
          {/* One-Tap Google Sign In */}
          <TouchableOpacity
            style={styles.googleBtn}
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
            activeOpacity={0.82}
          >
            <Ionicons name="logo-google" size={19} color="#4285F4" />
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </TouchableOpacity>

          {/* Clean Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR SIGN UP WITH EMAIL</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Role Selector Cards */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>I am a...</Text>
            <View style={styles.roleRow}>
              {ROLES.map(r => {
                const isSelected = role === r.key;
                return (
                  <TouchableOpacity
                    key={r.key}
                    style={[
                      styles.roleCard,
                      isSelected && { borderColor: r.badgeColor, backgroundColor: r.bgColor },
                    ]}
                    onPress={() => setRole(r.key)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.roleIconCircle, isSelected && { backgroundColor: r.badgeColor }]}>
                      <Ionicons
                        name={r.icon}
                        size={18}
                        color={isSelected ? Colors.white : Colors.textSecondary}
                      />
                    </View>
                    <Text style={[styles.roleTitle, isSelected && { color: r.badgeColor }]}>
                      {r.label}
                    </Text>
                    <Text style={styles.roleTagline} numberOfLines={1}>
                      {r.tagline}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Full Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={19} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Abebe Girma"
                value={fullName}
                onChangeText={setFullName}
                placeholderTextColor="#94A3B8"
                autoCapitalize="words"
                textContentType="name"
                autoComplete="name"
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
                blurOnSubmit={false}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={19} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="yourname@gmail.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#94A3B8"
                ref={emailRef}
                textContentType="emailAddress"
                autoComplete="email"
                returnKeyType="next"
                onSubmitEditing={() => phoneRef.current?.focus()}
                blurOnSubmit={false}
              />
            </View>
          </View>

          {/* Ethiopian Phone Number */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputContainer}>
              <View style={styles.flagBadge}>
                <Text style={styles.flagText}>🇪🇹 +251</Text>
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="9xx xxx xxxx"
                value={phone}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
                placeholderTextColor="#94A3B8"
                ref={phoneRef}
                textContentType="telephoneNumber"
                autoComplete="tel"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                blurOnSubmit={false}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={19} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, { paddingRight: 40 }]}
                placeholder="Minimum 8 characters"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor="#94A3B8"
                ref={passwordRef}
                textContentType="newPassword"
                autoComplete="password-new"
                returnKeyType="done"
                onSubmitEditing={handleContinue}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(v => !v)}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                  size={20} 
                  color={Colors.textSecondary} 
                />
              </TouchableOpacity>
            </View>
            <PasswordStrengthMeter password={password} />
          </View>

          {/* Submit Button */}
          <Button 
            title="Create Account" 
            onPress={handleContinue} 
            loading={isLoading} 
            style={{ marginTop: Spacing.sm }} 
          />

          {/* Sign In Link */}
          <TouchableOpacity 
            style={styles.loginLink} 
            onPress={() => router.push('/(auth)/login')} 
            activeOpacity={0.7}
          >
            <Text style={styles.loginText}>
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
  container: { 
    flex: 1, 
    backgroundColor: '#FFFFFF',
  },
  topNav: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: { 
    paddingHorizontal: Spacing.xl, 
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  title: { 
    fontSize: 28, 
    fontWeight: Typography.bold, 
    color: '#0F172A', 
    letterSpacing: -0.5,
  },
  subtitle: { 
    fontSize: Typography.sm, 
    color: '#64748B', 
    marginTop: 4,
    lineHeight: 20,
  },
  form: { 
    padding: Spacing.xl, 
    gap: Spacing.md,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: Radius.xl,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  googleBtnText: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: '#0F172A',
  },
  dividerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: Spacing.sm,
    marginVertical: 4,
  },
  dividerLine: { 
    flex: 1, 
    height: 1, 
    backgroundColor: '#E2E8F0',
  },
  dividerText: { 
    fontSize: 11, 
    fontWeight: Typography.semibold, 
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  fieldGroup: { 
    gap: 6,
  },
  label: { 
    fontSize: Typography.sm, 
    fontWeight: Typography.semibold, 
    color: '#1E293B',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: Radius.xl,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: Spacing.md,
    minHeight: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: Typography.base,
    color: '#0F172A',
    paddingVertical: 12,
  },
  flagBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 10,
  },
  flagText: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: '#334155',
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    padding: 6,
  },
  roleRow: { 
    flexDirection: 'row', 
    gap: Spacing.sm,
  },
  roleCard: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: Radius.xl,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  roleIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  roleTitle: { 
    fontSize: Typography.sm, 
    fontWeight: Typography.bold, 
    color: '#334155',
  },
  roleTagline: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  loginLink: { 
    alignItems: 'center', 
    width: '100%', 
    marginTop: Spacing.xs, 
    paddingVertical: Spacing.sm,
  },
  loginText: { 
    fontSize: Typography.sm, 
    color: '#64748B', 
    textAlign: 'center',
  },
  loginHighlight: { 
    color: Colors.blue, 
    fontWeight: Typography.bold,
  },
  successContent: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: Spacing.xl,
  },
  iconBadge: {
    width: 84, 
    height: 84, 
    borderRadius: 42,
    backgroundColor: '#EFF6FF',
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  successTitle: { 
    fontSize: Typography['2xl'], 
    fontWeight: Typography.bold, 
    color: '#0F172A',
  },
  successSubtitle: { 
    fontSize: Typography.sm, 
    color: '#64748B', 
    textAlign: 'center', 
    marginTop: 6,
    lineHeight: 20,
    paddingHorizontal: Spacing.md,
  },
  otpInputWrapper: {
    width: '100%',
    marginVertical: Spacing.xl,
  },
  codeInput: { 
    borderWidth: 2,
    borderColor: Colors.blue,
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.xl,
    paddingVertical: 14,
    fontSize: 30, 
    letterSpacing: 10, 
    textAlign: 'center', 
    fontWeight: Typography.bold,
    color: '#0F172A',
  },
});
