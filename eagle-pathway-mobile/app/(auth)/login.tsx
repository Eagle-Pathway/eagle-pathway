import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '../../src/utils/theme';
import { Button } from '../../src/components/common';
import { PasswordInput } from '../../src/components/PasswordInput';
import { KeyboardAwareScreen } from '../../src/components/KeyboardAwareScreen';
import { useAuthStore } from '../../src/store/authStore';
import { authService } from '../../src/services/auth';

import { showError } from '../../src/utils/errorHandler';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const passwordRef = useRef<TextInput>(null);
  const { signIn, isLoading, setLoading } = useAuthStore();

  const handleLogin = async () => {
    if (!email.trim()) return Alert.alert('Error', 'Please enter your email');
    if (!EMAIL_RE.test(email.trim())) return Alert.alert('Error', 'Please enter a valid email address');
    if (!password) return Alert.alert('Error', 'Please enter your password');
    try {
      await signIn(email.trim(), password);
      setLoading(false);
      router.replace('/(tabs)/home');
    } catch (e: any) {
      if (e?.code === 'email_not_confirmed' || /not confirmed/i.test(e?.message || '')) {
        authService.resendSignupOtp(email.trim()).catch(() => {});
        return Alert.alert(
          'Verify your email',
          "Your email isn't verified yet. We've sent a fresh 6-digit code — enter it to finish setting up your account.",
          [{ text: 'OK', onPress: () => router.push({ pathname: '/(auth)/signup', params: { verifyEmail: email.trim() } }) }],
        );
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

        <View style={{ marginBottom: Spacing.sm }}>
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

        <TouchableOpacity style={{ alignSelf: 'flex-end', marginBottom: Spacing.xl }} onPress={goToForgotPassword} activeOpacity={0.7}>
          <Text style={{ fontSize: 13, color: Colors.blue, fontWeight: Typography.semibold }}>Forgot password?</Text>
        </TouchableOpacity>

        <Button title="Sign In" onPress={handleLogin} loading={isLoading} />
        
        <TouchableOpacity style={{ marginTop: Spacing.lg, alignItems: 'center' }} onPress={() => router.push('/(auth)/signup')}>
          <Text style={{ fontSize: 13, color: Colors.textSecondary }}>Don't have an account? <Text style={{ color: Colors.blue, fontWeight: Typography.semibold }}>Sign up</Text></Text>
        </TouchableOpacity>
      </KeyboardAwareScreen>
    </SafeAreaView>
  );
}
