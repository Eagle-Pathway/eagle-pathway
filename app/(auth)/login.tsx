import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '../../src/utils/theme';
import { Button } from '../../src/components/common';
import { useAuthStore } from '../../src/store/authStore';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const { sendOtp, isLoading } = useAuthStore();

  const handleLogin = async () => {
    if (!phone.trim()) return Alert.alert('Error', 'Please enter your phone number');
    try {
      await sendOtp(phone.trim());
      router.push({ pathname: '/(auth)/otp', params: { phone } });
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to send OTP');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <TouchableOpacity style={{ padding: Spacing.xl }} onPress={() => router.back()}>
        <Text style={{ fontSize: 24, color: Colors.text }}>←</Text>
      </TouchableOpacity>
      <View style={{ padding: Spacing.xl }}>
        <Text style={{ fontSize: 28, fontWeight: Typography.bold, color: Colors.text, marginBottom: 8 }}>Welcome back</Text>
        <Text style={{ fontSize: 14, color: Colors.textSecondary, marginBottom: Spacing['2xl'] }}>Enter your phone number to sign in</Text>
        <Text style={{ fontSize: 13, fontWeight: Typography.semibold, color: Colors.text, marginBottom: 6 }}>Phone Number</Text>
        <TextInput
          style={{ borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.md, fontSize: 15, color: Colors.text, backgroundColor: '#fafafa', marginBottom: Spacing.lg }}
          placeholder="+251 9xx xxx xxxx"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholderTextColor={Colors.textSecondary}
        />
        <Button title="Send Verification Code" onPress={handleLogin} loading={isLoading} />
        <TouchableOpacity style={{ marginTop: Spacing.lg, alignItems: 'center' }} onPress={() => router.push('/(auth)/signup')}>
          <Text style={{ fontSize: 13, color: Colors.textSecondary }}>Don't have an account? <Text style={{ color: Colors.blue, fontWeight: Typography.semibold }}>Sign Up</Text></Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
