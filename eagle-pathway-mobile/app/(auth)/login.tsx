import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { toast } from '@/utils/toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography, Spacing, Radius } from '../../src/utils/theme';
import { Button } from '../../src/components/common';
import { PasswordInput } from '../../src/components/PasswordInput';
import { KeyboardAwareScreen } from '../../src/components/KeyboardAwareScreen';
import { useAuthStore } from '../../src/store/authStore';
import { authService } from '../../src/services/auth';
import { showError } from '../../src/utils/errorHandler';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SAVED_LOGIN_INFO_KEY = '@eagle_pathway_saved_login_info';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const passwordRef = useRef<TextInput>(null);
  const { signIn, isLoading, setLoading } = useAuthStore();

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
    if (!email.trim()) return toast.warning('Email Required', 'Please enter your email');
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

  // Hand off to the dedicated reset screen, carrying any email already typed.
  const goToForgotPassword = () =>
    router.push({ pathname: '/(auth)/forgot-password', params: email.trim() ? { email: email.trim() } : {} });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <TouchableOpacity style={{ padding: Spacing.xl }} onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))}>
        <Text style={{ fontSize: 24, color: Colors.text }}>←</Text>
      </TouchableOpacity>
      <KeyboardAwareScreen contentContainerStyle={{ padding: Spacing.xl }}>
        <Text style={{ fontSize: 28, fontWeight: Typography.bold, color: Colors.text, marginBottom: 8 }}>Welcome back</Text>
        <Text style={{ fontSize: 14, color: Colors.textSecondary, marginBottom: Spacing['2xl'] }}>Sign in to your Eagle Pathway account</Text>
        
        <View style={{ marginBottom: Spacing.lg }}>
          <Text style={{ fontSize: 13, fontWeight: Typography.semibold, color: Colors.text, marginBottom: 6 }}>Email Address</Text>
          <TextInput
            style={{ borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.md, fontSize: 15, color: Colors.text, backgroundColor: '#fafafa' }}
            placeholder="your@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={Colors.textSecondary}
            textContentType="emailAddress"
            autoComplete="email"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            blurOnSubmit={false}
          />
        </View>

        <View style={{ marginBottom: Spacing.md }}>
          <Text style={{ fontSize: 13, fontWeight: Typography.semibold, color: Colors.text, marginBottom: 6 }}>Password</Text>
          <PasswordInput
            ref={passwordRef}
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            textContentType="password"
            autoComplete="password"
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xl }}>
          <TouchableOpacity 
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} 
            onPress={() => setRememberMe(!rememberMe)}
            activeOpacity={0.8}
          >
            <Ionicons 
              name={rememberMe ? "checkbox" : "square-outline"} 
              size={20} 
              color={rememberMe ? Colors.blue : Colors.textSecondary} 
            />
            <Text style={{ fontSize: 13, color: Colors.text, fontWeight: Typography.medium }}>Save login info</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={goToForgotPassword} activeOpacity={0.7}>
            <Text style={{ fontSize: 13, color: Colors.blue, fontWeight: Typography.semibold }}>Forgot password?</Text>
          </TouchableOpacity>
        </View>

        <Button title="Sign In" onPress={handleLogin} loading={isLoading} />
        
        <TouchableOpacity 
          style={{ marginTop: Spacing.xl, paddingVertical: Spacing.sm, width: '100%', alignItems: 'center' }} 
          onPress={() => router.push('/(auth)/signup')}
          activeOpacity={0.7}
        >
          <Text 
            numberOfLines={1} 
            adjustsFontSizeToFit 
            minimumFontScale={0.8}
            style={{ fontSize: Typography.base, color: Colors.textSecondary, textAlign: 'center' }}
          >
            {"Don't have an account? "}
            <Text style={{ color: Colors.blue, fontWeight: Typography.bold }}>
              Sign Up
            </Text>
          </Text>
        </TouchableOpacity>
      </KeyboardAwareScreen>
    </SafeAreaView>
  );
}
