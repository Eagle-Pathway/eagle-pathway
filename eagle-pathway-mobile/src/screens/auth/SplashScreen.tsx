import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Image, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '@/utils/theme';

const { height } = Dimensions.get('window');

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        {/* Logo area */}
        <View style={styles.logoSection}>
          <View style={styles.iconWrap}>
            <Image source={require('../../../assets/icon.png')} style={{ width: 64, height: 64, resizeMode: 'contain' }} />
          </View>
          <Text style={styles.appName}>Eagle Pathway</Text>
          <Text style={styles.tagline}>From Classroom to International Scholarship</Text>
          {/* Honest feature highlights — no fabricated metrics (Play "Misleading
              Claims" safe). */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="school-outline" size={24} color={Colors.white} style={{ marginBottom: 4 }} />
              <Text style={styles.statLbl} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>Scholarships</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="create-outline" size={24} color={Colors.white} style={{ marginBottom: 4 }} />
              <Text style={styles.statLbl} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>SOP Review</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="library-outline" size={24} color={Colors.white} style={{ marginBottom: 4 }} />
              <Text style={styles.statLbl} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>Tutors</Text>
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
          <TouchableOpacity onPress={() => Linking.openURL('https://www.eaglespathway.com/privacy').catch(() => Alert.alert('Error', 'Could not open this link. Please check if you have a supported app installed.'))} activeOpacity={0.7}>
            <Text style={styles.footer}>By continuing you agree to our Terms &amp; Privacy Policy</Text>
          </TouchableOpacity>
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
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statItem: { flex: 1, alignItems: 'center', paddingHorizontal: 2 },
  statNum: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: Colors.white },
  statLbl: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.85)', marginTop: 2, textAlign: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 2 },
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
