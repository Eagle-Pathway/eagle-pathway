import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  Linking,
} from 'react-native';
import { toast } from '@/utils/toast';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '@/utils/theme';

const TERMS_URL = 'https://www.eaglespathway.com/terms';
const PRIVACY_URL = 'https://www.eaglespathway.com/privacy';

export default function SplashScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={[
          styles.content,
          {
            paddingTop: Math.max(insets.top + 16, 32),
            paddingBottom: Math.max(insets.bottom + 16, 28),
          }
        ]}>
          {/* Main Hero & Brand Section */}
          <View style={styles.centerSection}>
            <View style={styles.logoBox}>
              <Image 
                source={require('../../../assets/icon.png')} 
                style={styles.logoImg} 
              />
            </View>

            <Text style={styles.brandTitle}>Eagle Pathway</Text>
            <Text style={styles.tagline}>
              Your Gateway to Academic Excellence & Global Success
            </Text>

            {/* Clean, solid feature badges */}
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Ionicons name="school-outline" size={15} color="#93C5FD" />
                <Text style={styles.badgeText}>Scholarships</Text>
              </View>
              <View style={styles.badge}>
                <Ionicons name="person-outline" size={15} color="#FDE047" />
                <Text style={styles.badgeText}>Tutoring</Text>
              </View>
              <View style={styles.badge}>
                <Ionicons name="sparkles-outline" size={15} color="#6EE7B7" />
                <Text style={styles.badgeText}>AI Mentor</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons Section */}
          <View style={styles.actionSection}>
            <TouchableOpacity 
              style={styles.btnPrimary} 
              onPress={() => router.push('/(auth)/signup')} 
              activeOpacity={0.88}
            >
              <Text style={styles.btnPrimaryText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={18} color="#0D2051" style={{ marginLeft: 6 }} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.btnSecondary} 
              onPress={() => router.push('/(auth)/login')} 
              activeOpacity={0.85}
            >
              <Text style={styles.btnSecondaryText}>Sign In</Text>
            </TouchableOpacity>

            {/* Solid Minimal Legal Footer */}
            <View style={styles.legalRow}>
              <TouchableOpacity 
                onPress={() => Linking.openURL(TERMS_URL).catch(() => toast.error('Could not open Terms of Service.'))}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              >
                <Text style={styles.legalLinkText}>Terms</Text>
              </TouchableOpacity>

              <Text style={styles.legalDot}>•</Text>

              <TouchableOpacity 
                onPress={() => Linking.openURL(PRIVACY_URL).catch(() => toast.error('Could not open Privacy Policy.'))}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              >
                <Text style={styles.legalLinkText}>Privacy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D2051', // Solid brand dark navy - zero gradients
  },
  safe: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBox: {
    width: 86,
    height: 86,
    borderRadius: 22,
    backgroundColor: '#132860',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#C9A84C', // Solid gold border
    marginBottom: 20,
  },
  logoImg: {
    width: 58,
    height: 58,
    resizeMode: 'contain',
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: Typography.bold,
    color: '#FFFFFF',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 13.5,
    color: '#CBD5E1',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#172E6D',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#244394',
    gap: 6,
  },
  badgeText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionSection: {
    width: '100%',
    gap: 12,
    marginBottom: 8,
  },
  btnPrimary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    color: '#0D2051',
    fontWeight: Typography.bold,
    fontSize: 15.5,
  },
  btnSecondary: {
    backgroundColor: '#172E6D',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#244394',
  },
  btnSecondaryText: {
    color: '#FFFFFF',
    fontWeight: Typography.semibold,
    fontSize: 14.5,
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 8,
  },
  legalLinkText: {
    fontSize: 11.5,
    color: '#94A3B8',
    fontWeight: '500',
  },
  legalDot: {
    fontSize: 11,
    color: '#64748B',
  },
});
