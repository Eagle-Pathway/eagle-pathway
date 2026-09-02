import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  Linking 
} from 'react-native';
import { toast } from '@/utils/toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '@/utils/theme';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      {/* Soft Ambient Radial Lights */}
      <View style={styles.ambientTop} />
      <View style={styles.ambientBottom} />

      <SafeAreaView style={styles.safe}>
        {/* Center Hero */}
        <View style={styles.centerSection}>
          <View style={styles.logoBox}>
            <Image 
              source={require('../../../assets/icon.png')} 
              style={styles.logoImg} 
            />
          </View>
          
          <Text style={styles.title}>Eagle Pathway</Text>
          <Text style={styles.subtitle}>From Classroom to Global Success</Text>

          {/* 3 Ultra-Clean Minimal Feature Pills */}
          <View style={styles.pillRow}>
            <View style={styles.featurePill}>
              <Ionicons name="school-outline" size={18} color="#38BDF8" />
              <Text style={styles.featureText}>Tutoring</Text>
            </View>

            <View style={styles.featurePill}>
              <Ionicons name="globe-outline" size={18} color="#FBBF24" />
              <Text style={styles.featureText}>Scholarships</Text>
            </View>

            <View style={styles.featurePill}>
              <Ionicons name="rocket-outline" size={18} color="#34D399" />
              <Text style={styles.featureText}>Mentorship</Text>
            </View>
          </View>
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomSection}>
          <TouchableOpacity 
            style={styles.btnPrimary} 
            onPress={() => router.push('/(auth)/signup')} 
            activeOpacity={0.88}
          >
            <Text style={styles.btnPrimaryText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={18} color="#0A1128" style={{ marginLeft: 6 }} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.btnSecondary} 
            onPress={() => router.push('/(auth)/login')} 
            activeOpacity={0.85}
          >
            <Text style={styles.btnSecondaryText}>I Already Have an Account</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => Linking.openURL('https://www.eaglespathway.com/privacy').catch(() => toast.error('Could not open this link.'))} 
            activeOpacity={0.7}
          >
            <Text style={styles.termsText}>Terms &amp; Privacy Policy</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1128',
  },
  ambientTop: {
    position: 'absolute',
    top: -60,
    alignSelf: 'center',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(30, 77, 155, 0.22)',
  },
  ambientBottom: {
    position: 'absolute',
    bottom: -60,
    right: '20%',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(201, 168, 76, 0.1)',
  },
  safe: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBox: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    marginBottom: Spacing.lg,
  },
  logoImg: {
    width: 66,
    height: 66,
    resizeMode: 'contain',
  },
  title: {
    fontSize: Typography['4xl'],
    fontWeight: Typography.bold,
    color: Colors.white,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: Typography.base,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: Spacing['2xl'],
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    gap: 6,
  },
  featureText: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.white,
  },
  bottomSection: {
    gap: Spacing.sm,
  },
  btnPrimary: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.white,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  btnPrimaryText: {
    color: '#0A1128',
    fontWeight: Typography.bold,
    fontSize: Typography.lg,
  },
  btnSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Radius.xl,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  btnSecondaryText: {
    color: Colors.white,
    fontWeight: Typography.semibold,
    fontSize: Typography.base,
  },
  termsText: {
    textAlign: 'center',
    fontSize: Typography.xs,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 6,
  },
});
