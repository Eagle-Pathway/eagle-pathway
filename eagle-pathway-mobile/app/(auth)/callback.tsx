import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '../../src/services/supabase';
import { useAuthStore } from '../../src/store/authStore';
import { Colors, Typography, Spacing, Radius } from '../../src/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { getErrorMessage } from '../../src/utils/errorHandler';

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
      router.replace('/(tabs)/home');
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Show a helpful escape hatch if sign-in takes longer than 4 seconds
    const slowTimer = setTimeout(() => {
      if (isMounted) setShowSlowNotice(true);
    }, 4000);

    async function handleAuth() {
      try {
        // 1. Check for explicit cancellation/error from Google OAuth
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

        // 3. Extract authorization code or tokens from params or deep-link URL
        let code = params.code;
        let accessToken: string | null = null;
        let refreshToken: string | null = null;

        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          const parsed = Linking.parse(initialUrl);
          if (parsed.queryParams?.code) {
            code = String(parsed.queryParams.code);
          }
          if (parsed.queryParams?.error_description) {
            if (isMounted) setErrorMessage(getErrorMessage(String(parsed.queryParams.error_description)));
            return;
          }
          if (initialUrl.includes('#')) {
            const hashParams = new URLSearchParams(initialUrl.split('#')[1]);
            accessToken = hashParams.get('access_token');
            refreshToken = hashParams.get('refresh_token');
          }
        }

        // 4. Try exchanging authorization code if present
        if (code) {
          try {
            const { data } = await supabase.auth.exchangeCodeForSession(code);
            if (data?.session) {
              await navigateToHomeSafely(data.session);
              return;
            }
          } catch (codeErr) {
            console.log('[AuthCallback] Code exchange handled concurrently:', codeErr);
          }
        }

        // 5. Try setting session directly if hash tokens are present
        if (accessToken && refreshToken) {
          try {
            const { data } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (data?.session) {
              await navigateToHomeSafely(data.session);
              return;
            }
          } catch (tokenErr) {
            console.log('[AuthCallback] Token set handled concurrently:', tokenErr);
          }
        }

        // 6. Graceful polling for session completion
        for (let attempt = 0; attempt < 5; attempt++) {
          await new Promise((r) => setTimeout(r, 600));
          if (!isMounted) return;

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

    handleAuth();

    return () => {
      isMounted = false;
      clearTimeout(slowTimer);
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
