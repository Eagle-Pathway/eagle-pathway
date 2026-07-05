import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '@/utils/theme';

const { height } = Dimensions.get('window');

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        {/* Logo area */}
        <View style={styles.logoSection}>
          <View style={styles.iconWrap}>
            <Text style={styles.iconText}>🦅</Text>
          </View>
          <Text style={styles.appName}>Eagle Pathway</Text>
          <Text style={styles.tagline}>From Classroom to International Scholarship</Text>
          {/* Honest feature highlights — no fabricated metrics (Play "Misleading
              Claims" safe). */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>🎓</Text>
              <Text style={styles.statLbl}>Scholarships</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>✍️</Text>
              <Text style={styles.statLbl}>SOP Review</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>📚</Text>
              <Text style={styles.statLbl}>Tutors</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.btnPrimary} onPress={() => router.push('/(auth)/signup')} activeOpacity={0.9}>
            <Text style={styles.btnPrimaryText}>Get Started</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnSecondary} onPress={() => router.push('/(auth)/login')} activeOpacity={0.9}>
            <Text style={styles.btnSecondaryText}>I Already Have an Account</Text>
          </TouchableOpacity>
          <Text style={styles.footer}>By continuing you agree to our Terms &amp; Privacy Policy</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.blueDark,
  },
  safe: { flex: 1 },
  logoSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  iconText: { fontSize: 44 },
  appName: {
    fontSize: 34,
    fontWeight: Typography.bold,
    color: Colors.white,
    letterSpacing: -0.5,
    marginBottom: Spacing.sm,
  },
  tagline: {
    fontSize: Typography.md,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    letterSpacing: 0.2,
    marginBottom: Spacing['3xl'],
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: Radius.xl,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: Colors.white },
  statLbl: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: Spacing.sm },
  actions: { padding: Spacing['2xl'], gap: Spacing.md },
  btnPrimary: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    paddingVertical: 15,
    alignItems: 'center',
  },
  btnPrimaryText: { color: Colors.blue, fontWeight: Typography.bold, fontSize: Typography.xl },
  btnSecondary: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: Radius.xl,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  btnSecondaryText: { color: Colors.white, fontWeight: Typography.semibold, fontSize: Typography.xl },
  footer: {
    textAlign: 'center',
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.4)',
    marginTop: Spacing.sm,
  },
});
