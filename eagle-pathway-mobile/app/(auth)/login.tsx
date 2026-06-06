import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '../../src/utils/theme';
import { Button } from '../../src/components/common';
import { useAuthStore } from '../../src/store/authStore';
import { supabase } from '../../src/services/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sendingReset, setSendingReset] = useState(false);
  const { signIn, isLoading } = useAuthStore();

  const handleLogin = async () => {
    if (!email.trim()) return Alert.alert('Error', 'Please enter your email');
    if (!password) return Alert.alert('Error', 'Please enter your password');
    try {
      await signIn(email.trim(), password);
      router.replace('/(tabs)/home');
    } catch (e: any) {
      Alert.alert('Login Failed', e.message || 'Please check your credentials.');
    }
  };

  // Sends a password-reset email to the address typed above. The link lets the
  // user set a new password, then they come back and sign in normally.
  const handleForgotPassword = async () => {
    const target = email.trim();
    if (!target) {
      return Alert.alert('Enter your email', 'Type your email address above first, then tap “Forgot password?” and we’ll send you a reset link.');
    }
    setSendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(target);
      if (error) throw error;
      Alert.alert('Check your email', `We sent a password reset link to ${target}. Open it to set a new password, then come back and sign in.`);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not send the reset link. Please try again.');
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <TouchableOpacity style={{ padding: Spacing.xl }} onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))}>
        <Text style={{ fontSize: 24, color: Colors.text }}>←</Text>
      </TouchableOpacity>
      <View style={{ padding: Spacing.xl }}>
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
          />
        </View>

        <View style={{ marginBottom: Spacing.sm }}>
          <Text style={{ fontSize: 13, fontWeight: Typography.semibold, color: Colors.text, marginBottom: 6 }}>Password</Text>
          <TextInput
            style={{ borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.md, fontSize: 15, color: Colors.text, backgroundColor: '#fafafa' }}
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor={Colors.textSecondary}
          />
        </View>

        <TouchableOpacity style={{ alignSelf: 'flex-end', marginBottom: Spacing.xl }} onPress={handleForgotPassword} disabled={sendingReset}>
          <Text style={{ fontSize: 13, color: Colors.blue, fontWeight: Typography.semibold }}>
            {sendingReset ? 'Sending…' : 'Forgot password?'}
          </Text>
        </TouchableOpacity>

        <Button title="Sign In" onPress={handleLogin} loading={isLoading} />
        
        <TouchableOpacity style={{ marginTop: Spacing.lg, alignItems: 'center' }} onPress={() => router.push('/(auth)/signup')}>
          <Text style={{ fontSize: 13, color: Colors.textSecondary }}>Don't have an account? <Text style={{ color: Colors.blue, fontWeight: Typography.semibold }}>Sign Up</Text></Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
