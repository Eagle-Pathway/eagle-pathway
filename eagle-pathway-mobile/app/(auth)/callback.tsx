import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../src/services/supabase';
import { useAuthStore } from '../../src/store/authStore';
import {
  safeExchangeCodeForSession,
  safeSetSessionFromTokens,
  extractAuthParams,
  setCallbackActive,
} from '../../src/services/googleAuthService';
import { Colors, Typography, Spacing, Radius } from '../../src/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { getErrorMessage } from '../../src/utils/errorHandler';
import { getUserRole } from '../../src/utils/role';
import { isProfileIncomplete } from '../../src/utils/profile';
import { ONBOARDED_KEY } from '../../src/screens/onboarding/OnboardingScreen';

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams<{ code?: string; error?: string; error_description?: string }>();
  const { setSession, loadProfile } = useAuthStore();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSlowNotice, setShowSlowNotice] = useState(false);
  const hasRedirectedRef = useRef(false);

  const navigateToHomeSafely = async (session: any) => {
    if (hasRedirectedRef.current) return;
    hasRedirectedRef.current = true;
    try {
      setSession(session);
      await loadProfile();
    } catch (e) {
      console.log('[AuthCallback] Profile load deferred:', e);
    } finally {
      // First-run onboarding check: smoothly route students with incomplete profile directly to onboarding
      const currentUser = useAuthStore.getState().user;
      const role = getUserRole(currentUser).toLowerCase();
      if (currentUser && role === 'student' && isProfileIncomplete(currentUser)) {
        try {
          const seen = await AsyncStorage.getItem(ONBOARDED_KEY);
          if (!seen) {
            router.replace('/onboarding');
            return;
          }
        } catch {}
      }
      router.replace('/(tabs)/home');
    }
  };

  useEffect(() => {
    let isMounted = true;
    setCallbackActive(true);

    // Show a helpful escape hatch if sign-in takes longer than 8 seconds
    const slowTimer = setTimeout(() => {
      if (isMounted) setShowSlowNotice(true);
    }, 8000);

    async function processIncomingUrl(url: string | null) {
      if (!url || hasRedirectedRef.current) return;
      const parsed = extractAuthParams(url);

      if (parsed.error || parsed.errorDescription) {
        const rawErr = parsed.errorDescription || parsed.error;
        const userFriendly = /access_denied|cancelled|closed/i.test(rawErr || '')
          ? 'Sign-in was cancelled. You can try again whenever you are ready.'
          : getErrorMessage(rawErr);
        if (isMounted) setErrorMessage(userFriendly);
        return;
      }

      if (parsed.code) {
        try {
          const res = await safeExchangeCodeForSession(parsed.code);
          if (res?.session) {
            await navigateToHomeSafely(res.session);
            return;
          }
        } catch (e) {
          console.log('[AuthCallback] Code exchange handled concurrently:', e);
        }
      }

      if (parsed.accessToken && parsed.refreshToken) {
        try {
          const res = await safeSetSessionFromTokens(parsed.accessToken, parsed.refreshToken);
          if (res?.session) {
            await navigateToHomeSafely(res.session);
            return;
          }
        } catch (e) {
          console.log('[AuthCallback] Token set handled concurrently:', e);
        }
      }
    }

    async function handleAuth() {
      try {
        // 1. Check for explicit cancellation/error from Google OAuth query params
        if (params.error || params.error_description) {
          const rawErr = params.error_description || params.error;
          const userFriendly = /access_denied|cancelled|closed/i.test(rawErr || '')
            ? 'Sign-in was cancelled. You can try again whenever you are ready.'
            : getErrorMessage(rawErr);
          if (isMounted) setErrorMessage(userFriendly);
          return;
        }

        // 2. Check if an authenticated session already exists
        const { data: activeSession } = await supabase.auth.getSession();
        if (activeSession?.session) {
          await navigateToHomeSafely(activeSession.session);
          return;
        }

        // 3. Try authorization code from Expo Router local search params via mutex
        if (params.code) {
          try {
            const res = await safeExchangeCodeForSession(params.code);
            if (res?.session) {
              await navigateToHomeSafely(res.session);
              return;
            }
          } catch (codeErr) {
            console.log('[AuthCallback] Initial code exchange via params deferred:', codeErr);
          }
        }

        // 4. Check initial deep-link URL (cold start)
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          await processIncomingUrl(initialUrl);
          if (hasRedirectedRef.current) return;
        }

        // 5. Polling fallback for concurrent code exchange / session arrival (up to 15 seconds)
        for (let attempt = 0; attempt < 25; attempt++) {
          await new Promise((r) => setTimeout(r, 600));
          if (!isMounted || hasRedirectedRef.current) return;

          // Retry exchanging code if code was provided in params and session not yet present
          if (params.code) {
            try {
              const res = await safeExchangeCodeForSession(params.code);
              if (res?.session) {
                await navigateToHomeSafely(res.session);
                return;
              }
            } catch {}
          }

          const { data: pollSession } = await supabase.auth.getSession();
          if (pollSession?.session) {
            await navigateToHomeSafely(pollSession.session);
            return;
          }
        }

        if (isMounted && !hasRedirectedRef.current) {
          setErrorMessage('Could not complete Google Sign-In automatically. Please return and try again.');
        }
      } catch (err: any) {
        console.error('[AuthCallbackScreen] Callback error:', err);
        const { data: fallbackSession } = await supabase.auth.getSession();
        if (fallbackSession?.session) {
          await navigateToHomeSafely(fallbackSession.session);
          return;
        }
        if (isMounted && !hasRedirectedRef.current) {
          setErrorMessage(getErrorMessage(err));
        }
      }
    }

    // Active listener for warm deep links and fragment tokens
    const linkSubscription = Linking.addEventListener('url', (event) => {
      processIncomingUrl(event.url).catch(() => {});
    });

    handleAuth();

    return () => {
      isMounted = false;
      setCallbackActive(false);
      clearTimeout(slowTimer);
      linkSubscription.remove();
    };
  }, [params]);

  if (errorMessage) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.errorIconWrap}>
            <Ionicons name="information-circle-outline" size={54} color={Colors.blue} />
          </View>
          <Text style={styles.title}>Sign-In Update</Text>
          <Text style={styles.message}>{errorMessage}</Text>

          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => router.replace('/(auth)/login')}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.spinnerContainer}>
          <ActivityIndicator size="large" color={Colors.blue} />
        </View>

        <Text style={styles.title}>Signing you in with Google</Text>
        <Text style={styles.subtext}>Please wait a moment while we set up your account and profile.</Text>

        {showSlowNotice && (
          <View style={styles.slowNoticeBox}>
            <Text style={styles.slowNoticeText}>Taking longer than usual?</Text>
            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={async () => {
                const { data } = await supabase.auth.getSession();
                if (data?.session) {
                  navigateToHomeSafely(data.session);
                } else {
                  router.replace('/(auth)/login');
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.btnSecondaryText}>Check Session & Continue</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => router.replace('/(auth)/login')}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelBtnText}>Cancel & Return to Sign In</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.xl,
  },
  spinnerContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  errorIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.bold,
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtext: {
    fontSize: Typography.base,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
    marginBottom: Spacing.xl,
  },
  message: {
    fontSize: Typography.base,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
    marginBottom: Spacing['2xl'],
  },
  btnPrimary: {
    backgroundColor: Colors.blue,
    borderRadius: Radius.xl,
    paddingVertical: 14,
    paddingHorizontal: Spacing['2xl'],
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  btnText: {
    color: Colors.white,
    fontSize: Typography.base,
    fontWeight: Typography.bold,
  },
  slowNoticeBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    marginBottom: Spacing.lg,
    gap: 8,
  },
  slowNoticeText: {
    fontSize: Typography.xs,
    color: '#64748B',
    fontWeight: Typography.medium,
  },
  btnSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: Radius.md,
    paddingVertical: 8,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    width: '100%',
  },
  btnSecondaryText: {
    color: '#0F172A',
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
  },
  cancelBtn: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  cancelBtnText: {
    color: '#64748B',
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    textDecorationLine: 'underline',
  },
});
