import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../src/utils/theme';
import { Button, LoadingScreen } from '../../src/components/common';
import { PasswordInput } from '../../src/components/PasswordInput';
import { PasswordStrengthMeter } from '../../src/components/PasswordStrengthMeter';
import { supabase } from '../../src/services/supabase';
import { showError } from '../../src/utils/errorHandler';
import { withTimeout } from '../../src/utils/asyncUtils';
import { validatePasswordStrength } from '@eagle-pathway/shared';

export default function UpdatePasswordScreen() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // This screen relies on the recovery session established by verifying the
  // reset code. Without an active session updateUser would fail, so guard the
  // entry point: if there's no session, send the user back to request a code
  // instead of leaving them on a screen that can't work.
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (!session) {
        Alert.alert(
          'Session expired',
          'Your password reset link is no longer active. Please request a new code.',
          [{ text: 'OK', onPress: () => router.replace('/(auth)/forgot-password') }],
        );
        return;
      }
      setCheckingSession(false);
    });
    return () => { cancelled = true; };
  }, []);

  const handleUpdatePassword = async () => {
    const strength = validatePasswordStrength(password);
    if (!strength.isValid) {
      return Alert.alert(
        'Weak Password',
        'Password does not meet security requirements:\n• ' + strength.errors.join('\n• ')
      );
    }

    setLoading(true);
    try {
      const { error } = await withTimeout(supabase.auth.updateUser({ password }));
      if (error) throw error;
      setLoading(false);
      Alert.alert('Success', 'Your password has been updated.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/home') }
      ]);
    } catch (e: any) {
      showError(e, 'Update Failed');
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) return <LoadingScreen />;

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.body}>
          <View style={styles.iconBadge}><Ionicons name="lock-closed-outline" size={30} color={Colors.blue} /></View>
          <Text style={styles.title}>Set New Password</Text>
          <Text style={styles.subtitle}>
            Please enter your new password below. You will be logged in automatically after updating.
          </Text>

          <View style={{ marginTop: Spacing['2xl'] }}>
            <Text style={styles.label}>New Password</Text>
            <PasswordInput
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={handleUpdatePassword}
              textContentType="newPassword"
              autoComplete="password-new"
            />
            <PasswordStrengthMeter password={password} />
          </View>

          <Button title="Update Password" onPress={handleUpdatePassword} loading={loading} style={{ marginTop: Spacing.xl }} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.white },
  body: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing['3xl'] },
  iconBadge: { width: 64, height: 64, borderRadius: 20, backgroundColor: Colors.blueLight, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl },
  title: { fontSize: 28, fontWeight: Typography.bold, color: Colors.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, lineHeight: 21 },
  label: { fontSize: 13, fontWeight: Typography.semibold, color: Colors.text, marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.md, fontSize: 15, color: Colors.text, backgroundColor: '#fafafa' },
});
