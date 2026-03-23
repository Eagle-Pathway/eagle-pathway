import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '../../utils/theme';
import { Button } from '../../components/common';
import { useAuthStore } from '../../store/authStore';

const OTP_LENGTH = 6;

export default function OTPScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [countdown, setCountdown] = useState(45);
  const refs = useRef<(TextInput | null)[]>([]);
  const { verifyOtp, sendOtp, isLoading } = useAuthStore();

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(c => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleChange = (text: string, index: number) => {
    if (text.length > 1) {
      // Handle paste
      const digits = text.replace(/\D/g, '').split('').slice(0, OTP_LENGTH);
      const newOtp = [...otp];
      digits.forEach((d, i) => { if (index + i < OTP_LENGTH) newOtp[index + i] = d; });
      setOtp(newOtp);
      const next = Math.min(index + digits.length, OTP_LENGTH - 1);
      refs.current[next]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text && index < OTP_LENGTH - 1) refs.current[index + 1]?.focus();
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) return Alert.alert('Error', 'Please enter the complete verification code');

    Keyboard.dismiss();
    try {
      await verifyOtp(phone, code);
      router.replace('/(tabs)/home');
    } catch (e: any) {
      Alert.alert('Invalid Code', e.message || 'The code you entered is incorrect. Please try again.');
      setOtp(Array(OTP_LENGTH).fill(''));
      refs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    try {
      await sendOtp(phone);
      setCountdown(45);
      setOtp(Array(OTP_LENGTH).fill(''));
      Alert.alert('Sent!', 'A new verification code has been sent to your phone.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to resend code');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>📱</Text>
        </View>

        <Text style={styles.title}>Verify Your Number</Text>
        <Text style={styles.subtitle}>
          We sent a {OTP_LENGTH}-digit code to{'\n'}
          <Text style={styles.phone}>{phone}</Text>
        </Text>

        <View style={styles.otpRow}>
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={el => { refs.current[i] = el; }}
              style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
              value={digit}
              onChangeText={text => handleChange(text, i)}
              onKeyPress={({ nativeEvent: { key } }) => handleKeyPress(key, i)}
              keyboardType="number-pad"
              maxLength={6}
              selectTextOnFocus
              textAlign="center"
            />
          ))}
        </View>

        <Button
          title="Verify & Continue"
          onPress={handleVerify}
          loading={isLoading}
          style={{ marginHorizontal: Spacing.xl }}
        />

        <View style={styles.resendRow}>
          <Text style={styles.resendText}>Didn't receive the code?</Text>
          <TouchableOpacity onPress={handleResend} disabled={countdown > 0}>
            <Text style={[styles.resendLink, countdown > 0 && styles.resendDisabled]}>
              {countdown > 0 ? ` Resend in 0:${String(countdown).padStart(2, '0')}` : ' Resend'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.replace('/(auth)/signup')}>
          <Text style={styles.changeNumber}>Change phone number</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  backBtn: { padding: Spacing.xl, paddingBottom: 0 },
  backArrow: { fontSize: 24, color: Colors.text },
  content: { flex: 1, padding: Spacing.xl, alignItems: 'center' },
  iconWrap: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: Colors.blueLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xl, marginTop: Spacing.xl,
  },
  icon: { fontSize: 36 },
  title: { fontSize: Typography['5xl'], fontWeight: Typography.bold, color: Colors.text, marginBottom: Spacing.sm },
  subtitle: { fontSize: Typography.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: Spacing['3xl'] },
  phone: { fontWeight: Typography.bold, color: Colors.text },
  otpRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing['3xl'], width: '100%', justifyContent: 'center' },
  otpBox: {
    width: 50, height: 58,
    borderWidth: 2, borderColor: Colors.border,
    borderRadius: Radius.xl,
    backgroundColor: '#fafafa',
    fontSize: Typography['5xl'],
    fontWeight: Typography.bold,
    color: Colors.blue,
    textAlign: 'center',
  },
  otpBoxFilled: { borderColor: Colors.blue, backgroundColor: Colors.blueLight },
  resendRow: { flexDirection: 'row', marginTop: Spacing.xl },
  resendText: { fontSize: Typography.base, color: Colors.textSecondary },
  resendLink: { fontSize: Typography.base, color: Colors.blue, fontWeight: Typography.semibold },
  resendDisabled: { color: Colors.textSecondary },
  changeNumber: { fontSize: Typography.base, color: Colors.textSecondary, marginTop: Spacing.lg, textDecorationLine: 'underline' },
});
