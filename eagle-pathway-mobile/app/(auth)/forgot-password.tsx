import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '../../src/utils/theme';
import { Button } from '../../src/components/common';
import { supabase } from '../../src/services/supabase';
import * as Linking from 'expo-linking';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const sendResetLink = async () => {
    const target = email.trim();
    if (!EMAIL_RE.test(target)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const redirectUrl = 'https://eagle-pathway.vercel.app/open-app';
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(target, {
        redirectTo: redirectUrl,
      });
      if (resetError) throw resetError;
      setSent(true);
    } catch (e: any) {
      setError(e?.message || 'Could not send the reset link. Please try again.');
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

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.body}>
          {!sent ? (
            <>
              <View style={styles.iconBadge}><Text style={{ fontSize: 30 }}>🔑</Text></View>
              <Text style={styles.title}>Forgot password?</Text>
              <Text style={styles.subtitle}>
                Enter the email linked to your account and we’ll send you a link to reset your password.
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
                  onSubmitEditing={sendResetLink}
                  returnKeyType="send"
                />
                {!!error && <Text style={styles.errorText}>{error}</Text>}
              </View>

              <Button title="Send reset link" onPress={sendResetLink} loading={loading} style={{ marginTop: Spacing.xl }} />

              <TouchableOpacity style={styles.linkRow} onPress={backToLogin} activeOpacity={0.7}>
                <Text style={styles.linkMuted}>Remembered it? <Text style={styles.link}>Back to sign in</Text></Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={[styles.iconBadge, { backgroundColor: Colors.greenLight }]}><Text style={{ fontSize: 30 }}>✉️</Text></View>
              <Text style={styles.title}>Check your email</Text>
              <Text style={styles.subtitle}>
                We sent a password reset link to{'\n'}
                <Text style={{ fontWeight: Typography.bold, color: Colors.text }}>{email.trim()}</Text>.
                {'\n\n'}Open it to set a new password, then come back and sign in. The link expires after a while, so use it soon.
              </Text>

              <Button title="Back to sign in" onPress={backToLogin} style={{ marginTop: Spacing['2xl'] }} />

              <TouchableOpacity style={styles.linkRow} onPress={sendResetLink} disabled={loading} activeOpacity={0.7}>
                <Text style={styles.linkMuted}>Didn’t get it? <Text style={styles.link}>{loading ? 'Resending…' : 'Resend link'}</Text></Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ alignItems: 'center', marginTop: Spacing.sm }} onPress={() => { setSent(false); setError(''); }} activeOpacity={0.7}>
                <Text style={styles.linkMuted}>Use a different email</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
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
  inputError: { borderColor: Colors.red },
  errorText: { fontSize: 12, color: Colors.red, marginTop: 6 },
  linkRow: { marginTop: Spacing.xl, alignItems: 'center' },
  linkMuted: { fontSize: 13, color: Colors.textSecondary },
  link: { color: Colors.blue, fontWeight: Typography.semibold },
});
