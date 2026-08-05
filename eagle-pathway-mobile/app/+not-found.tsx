import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '../src/utils/theme';
import { Button } from '../src/components/common';

export default function NotFoundScreen() {
  return (
    <SafeAreaView style={[CommonStyles.screenBg, styles.container]} edges={['top', 'bottom']}>
      <Stack.Screen options={{ title: 'Page Not Found', headerShown: false }} />
      
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>🧭</Text>
        </View>
        <Text style={styles.title}>Page Not Found</Text>
        <Text style={styles.subtitle}>
          We couldn't find the page you were looking for. It may have been moved, renamed, or is currently unavailable.
        </Text>

        <View style={styles.actions}>
          <Button
            title="Go Back"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))}
            variant="primary"
            size="lg"
            fullWidth
          />
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => router.replace('/(tabs)/home')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryBtnText}>Back to Home Screen</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.white,
    borderRadius: Radius['2xl'],
    padding: Spacing['2xl'],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.blueLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.bold,
    color: Colors.text,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing['2xl'],
  },
  actions: {
    width: '100%',
    gap: Spacing.md,
  },
  secondaryBtn: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.blue,
  },
});
