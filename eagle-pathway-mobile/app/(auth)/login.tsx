import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet 
} from 'react-native';
import { toast } from '@/utils/toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography, Spacing, Radius } from '../../src/utils/theme';
import { Button } from '../../src/components/common';
import { KeyboardAwareScreen } from '../../src/components/KeyboardAwareScreen';
import { useAuthStore } from '../../src/store/authStore';
import { authService } from '../../src/services/auth';
import { showError } from '../../src/utils/errorHandler';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SAVED_LOGIN_INFO_KEY = '@eagle_pathway_saved_login_info';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const passwordRef = useRef<TextInput>(null);
  const { signIn, signInWithGoogle, isLoading, setLoading } = useAuthStore();

  useEffect(() => {
    AsyncStorage.getItem(SAVED_LOGIN_INFO_KEY).then(data => {
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (parsed.email) setEmail(parsed.email);
          if (parsed.password) setPassword(parsed.password);
          if (typeof parsed.rememberMe === 'boolean') setRememberMe(parsed.rememberMe);
        } catch {
          // Ignore parse errors
        }
      }
    });
  }, []);

  const handleLogin = async () => {
    if (!email.trim()) return toast.warning('Email Required', 'Please enter your email address');
    if (!EMAIL_RE.test(email.trim())) return toast.warning('Invalid Email', 'Please enter a valid email address');
    if (!password) return toast.warning('Password Required', 'Please enter your password');
    
    try {
      await signIn(email.trim(), password);

      if (rememberMe) {
        await AsyncStorage.setItem(SAVED_LOGIN_INFO_KEY, JSON.stringify({ email: email.trim(), password, rememberMe: true }));
      } else {
        await AsyncStorage.removeItem(SAVED_LOGIN_INFO_KEY);
      }

      setLoading(false);
      router.replace('/(tabs)/home');
    } catch (e: any) {
      if (e?.code === 'email_not_confirmed' || /not confirmed/i.test(e?.message || '')) {
        authService.resendSignupOtp(email.trim()).catch(() => {});
        toast.warning('Verify your email', "Your email isn't verified yet. We've sent a fresh 6-digit code.");
        router.push({ pathname: '/(auth)/signup', params: { verifyEmail: email.trim() } });
        return;
      }
      showError(e, 'Login Failed');
    } finally {
      setLoading(false);
    }
  };

  const goToForgotPassword = () =>
    router.push({ pathname: '/(auth)/forgot-password', params: email.trim() ? { email: email.trim() } : {} });

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
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to access your scholarships, tutors, and learning dashboard</Text>
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
                  showError(e, 'Google Sign-In Failed');
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
            <Text style={styles.dividerText}>OR SIGN IN WITH EMAIL</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Email Address */}
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
                textContentType="emailAddress"
                autoComplete="email"
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
                ref={passwordRef}
                style={[styles.textInput, { paddingRight: 40 }]}
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor="#94A3B8"
                textContentType="password"
                autoComplete="password"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
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
          </View>

          {/* Remember Me & Forgot Password Row */}
          <View style={styles.optionsRow}>
            <TouchableOpacity 
              style={styles.rememberMeBtn} 
              onPress={() => setRememberMe(!rememberMe)}
              activeOpacity={0.8}
            >
              <Ionicons 
                name={rememberMe ? "checkbox" : "square-outline"} 
                size={19} 
                color={rememberMe ? Colors.blue : '#94A3B8'} 
              />
              <Text style={styles.rememberMeText}>Save login info</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={goToForgotPassword} activeOpacity={0.7}>
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          {/* Sign In Button */}
          <Button 
            title="Sign In" 
            onPress={handleLogin} 
            loading={isLoading} 
            style={{ marginTop: Spacing.xs }} 
          />

          {/* Sign Up Link */}
          <TouchableOpacity 
            style={styles.signupLink} 
            onPress={() => router.push('/(auth)/signup')}
            activeOpacity={0.7}
          >
            <Text style={styles.signupText}>
              {"Don't have an account? "}
              <Text style={styles.signupHighlight}>Sign Up</Text>
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
  eyeBtn: {
    position: 'absolute',
    right: 12,
    padding: 6,
  },
  optionsRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  rememberMeBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6,
  },
  rememberMeText: { 
    fontSize: Typography.sm, 
    color: '#334155', 
    fontWeight: Typography.medium,
  },
  forgotPasswordText: { 
    fontSize: Typography.sm, 
    color: Colors.blue, 
    fontWeight: Typography.semibold,
  },
  signupLink: { 
    alignItems: 'center', 
    width: '100%', 
    marginTop: Spacing.xs, 
    paddingVertical: Spacing.sm,
  },
  signupText: { 
    fontSize: Typography.sm, 
    color: '#64748B', 
    textAlign: 'center',
  },
  signupHighlight: { 
    color: Colors.blue, 
    fontWeight: Typography.bold,
  },
});
