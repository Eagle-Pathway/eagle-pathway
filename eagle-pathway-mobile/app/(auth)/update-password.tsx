import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '../../src/utils/theme';
import { Button } from '../../src/components/common';
import { supabase } from '../../src/services/supabase';

export default function UpdatePasswordScreen() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async () => {
    if (!password || password.length < 6) {
      return Alert.alert('Invalid Password', 'Password must be at least 6 characters long.');
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      Alert.alert('Success', 'Your password has been updated.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/home') }
      ]);
    } catch (e: any) {
      Alert.alert('Update Failed', e.message || 'Could not update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.body}>
          <View style={styles.iconBadge}><Text style={{ fontSize: 30 }}>🔒</Text></View>
          <Text style={styles.title}>Set New Password</Text>
          <Text style={styles.subtitle}>
            Please enter your new password below. You will be logged in automatically after updating.
          </Text>

          <View style={{ marginTop: Spacing['2xl'] }}>
            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              placeholderTextColor={Colors.textSecondary}
              onSubmitEditing={handleUpdatePassword}
            />
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
