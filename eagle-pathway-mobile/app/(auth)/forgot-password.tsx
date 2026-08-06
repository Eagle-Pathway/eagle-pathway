import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../src/utils/theme';
import { Button } from '../../src/components/common';
import { KeyboardAwareScreen } from '../../src/components/KeyboardAwareScreen';
import { supabase } from '../../src/services/supabase';
import { getErrorMessage } from '../../src/utils/errorHandler';
import { withTimeout } from '../../src/utils/asyncUtils';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_COOLDOWN_SECONDS = 60;

export default function ForgotPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? '');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Tick down the resend cooldown so users can't hammer the (rate-limited) email sender.
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const sendResetCode = async () => {
    const target = email.trim();
    if (!EMAIL_RE.test(target)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (resendCooldown > 0 || loading) return;
    setError('');
    setLoading(true);
    try {
      const { error: resetError } = await withTimeout(supabase.auth.resetPasswordForEmail(target));
      if (resetError) throw resetError;
      setSent(true);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (e: any) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    const target = email.trim();
    const token = code.trim();
    if (token.length < 6) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { error: verifyError } = await withTimeout(supabase.auth.verifyOtp({
        email: target,
        token,
        type: 'recovery',
      }));
      if (verifyError) throw verifyError;
      setLoading(false);
      router.replace('/(auth)/update-password');
    } catch (e: any) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const backToLogin = () => router.replace('/(auth)/login');

  return (
    <SafeAreaView style={styles.screen}>
      <TouchableOpacity style={styles.back} onPress={() => (router.canGoBack() ? router.back() : backToLogin())} activeOpacity={0.7}>
        <Text style={{ fontSize: 24, color: Colors.text }}>←</Text>
      </TouchableOpacity>

      <KeyboardAwareScreen contentContainerStyle={styles.body}>
          {!sent ? (
            <>
              <View style={styles.iconBadge}><Ionicons name="key-outline" size={30} color={Colors.blue} /></View>
              <Text style={styles.title}>Forgot password?</Text>
              <Text style={styles.subtitle}>
                Enter the email linked to your account and we’ll send you a 6-digit code to reset your password.
              </Text>

              <View style={{ marginTop: Spacing['2xl'] }}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={[styles.input, !!error && styles.inputError]}
                  placeholder="your@email.com"
                  value={email}
                  onChangeText={(t) => { setEmail(t); if (error) setError(''); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus={!email}
                  placeholderTextColor={Colors.textSecondary}
                  onSubmitEditing={sendResetCode}
                  returnKeyType="send"
                  textContentType="emailAddress"
                  autoComplete="email"
                />
                {!!error && <Text style={styles.errorText}>{error}</Text>}
              </View>

              <Button title="Send reset code" onPress={sendResetCode} loading={loading} style={{ marginTop: Spacing.xl }} />

              <TouchableOpacity style={styles.linkRow} onPress={backToLogin} activeOpacity={0.7}>
                <Text style={styles.linkMuted}>Remembered it? <Text style={styles.link}>Back to sign{"\u00A0"}in</Text></Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={[styles.iconBadge, { backgroundColor: Colors.greenLight }]}><Ionicons name="mail-outline" size={30} color={Colors.green} /></View>
              <Text style={styles.title}>Enter your code</Text>
              <Text style={styles.subtitle}>
                We sent a 6-digit code to{'\n'}
                <Text style={{ fontWeight: Typography.bold, color: Colors.text }}>{email.trim()}</Text>.
                {'\n\n'}Enter it below to continue. The code expires after a while, so use it soon.
              </Text>

              <View style={{ marginTop: Spacing['2xl'] }}>
                <Text style={styles.label}>Verification Code</Text>
                <TextInput
                  style={[styles.input, styles.codeInput, !!error && styles.inputError]}
                  placeholder="123456"
                  value={code}
                  onChangeText={(t) => { setCode(t.replace(/[^0-9]/g, '')); if (error) setError(''); }}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                  textContentType="oneTimeCode"
                  placeholderTextColor={Colors.textSecondary}
                  onSubmitEditing={verifyCode}
                  returnKeyType="done"
                />
                {!!error && <Text style={styles.errorText}>{error}</Text>}
              </View>

              <Button title="Verify code" onPress={verifyCode} loading={loading} style={{ marginTop: Spacing.xl }} />

              <TouchableOpacity style={styles.linkRow} onPress={sendResetCode} disabled={loading || resendCooldown > 0} activeOpacity={0.7}>
                <Text style={styles.linkMuted}>
                  Didn’t get it?{' '}
                  <Text style={resendCooldown > 0 ? styles.linkMuted : styles.link}>
                    {loading ? 'Resending…' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                  </Text>
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ alignItems: 'center', marginTop: Spacing.sm }} onPress={() => { setSent(false); setCode(''); setError(''); }} activeOpacity={0.7}>
                <Text style={styles.linkMuted}>Use a different email</Text>
              </TouchableOpacity>
            </>
          )}
      </KeyboardAwareScreen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.white },
  back: { padding: Spacing.xl },
  body: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
  iconBadge: { width: 64, height: 64, borderRadius: 20, backgroundColor: Colors.blueLight, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl },
  title: { fontSize: 28, fontWeight: Typography.bold, color: Colors.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, lineHeight: 21 },
  label: { fontSize: 13, fontWeight: Typography.semibold, color: Colors.text, marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.md, fontSize: 15, color: Colors.text, backgroundColor: '#fafafa' },
  codeInput: { fontSize: 24, letterSpacing: 8, textAlign: 'center', fontWeight: Typography.bold },
  inputError: { borderColor: Colors.red },
  errorText: { fontSize: 12, color: Colors.red, marginTop: 6 },
  linkRow: { marginTop: Spacing.xl, alignItems: 'center' },
  linkMuted: { fontSize: 13, color: Colors.textSecondary },
  link: { color: Colors.blue, fontWeight: Typography.semibold },
});
