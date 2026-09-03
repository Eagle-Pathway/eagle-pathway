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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '@/utils/theme';

export default function SplashScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Center Brand Hero */}
        <View style={styles.centerSection}>
          <View style={styles.logoBox}>
            <Image 
              source={require('../../../assets/icon.png')} 
              style={styles.logoImg} 
            />
          </View>
          
          <Text style={styles.title}>Eagle Pathway</Text>
          <Text style={styles.subtitle}>Your Gateway to Academic Excellence &amp; Global Success</Text>

          {/* 3 Modern Feature Pills */}
          <View style={styles.pillRow}>
            <View style={styles.featurePill}>
              <Ionicons name="school-outline" size={17} color="#60A5FA" />
              <Text style={styles.featureText}>Tutoring</Text>
            </View>

            <View style={styles.featurePill}>
              <Ionicons name="globe-outline" size={17} color="#FBBF24" />
              <Text style={styles.featureText}>Scholarships</Text>
            </View>

            <View style={styles.featurePill}>
              <Ionicons name="rocket-outline" size={17} color="#34D399" />
              <Text style={styles.featureText}>Mentorship</Text>
            </View>
          </View>
        </View>

        {/* Bottom Actions with Proper Safe Insets */}
        <View style={[styles.bottomSection, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          <TouchableOpacity 
            style={styles.btnPrimary} 
            onPress={() => router.push('/(auth)/signup')} 
            activeOpacity={0.88}
          >
            <Text style={styles.btnPrimaryText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.blueDark} style={{ marginLeft: 6 }} />
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
            style={{ paddingVertical: 4 }}
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
    backgroundColor: '#0D2051', // Official Eagle Pathway Brand Blue Dark
  },
  safe: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.xl,
  },
  logoBox: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(201, 168, 76, 0.35)', // Eagle Gold border accent
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  logoImg: {
    width: 66,
    height: 66,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 32,
    fontWeight: Typography.bold,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: Typography.base,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: Spacing['2xl'],
    lineHeight: 22,
    paddingHorizontal: Spacing.sm,
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
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    gap: 6,
  },
  featureText: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: '#FFFFFF',
  },
  bottomSection: {
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  btnPrimary: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  btnPrimaryText: {
    color: '#0D2051',
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
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  btnSecondaryText: {
    color: '#FFFFFF',
    fontWeight: Typography.semibold,
    fontSize: Typography.base,
  },
  termsText: {
    textAlign: 'center',
    fontSize: Typography.xs,
    color: 'rgba(255, 255, 255, 0.45)',
    marginTop: 2,
  },
});
