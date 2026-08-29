import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Colors, Typography, Spacing } from '../../src/utils/theme';
import { useAuthStore } from '../../src/store/authStore';

export default function AuthCallbackScreen() {
  const { user, isAuthenticated, loadProfile } = useAuthStore();

  useEffect(() => {
    // Attempt profile load in case session was established
    loadProfile()
      .then(() => {
        router.replace('/(tabs)/home');
      })
      .catch(() => {
        // If profile couldn't load, timeout will return user to home or login
        setTimeout(() => {
          router.replace('/(tabs)/home');
        }, 1200);
      });
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.blue} />
      <Text style={styles.text}>Signing you in...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  text: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
});
