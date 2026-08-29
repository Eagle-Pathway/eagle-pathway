import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '../../src/services/supabase';
import { useAuthStore } from '../../src/store/authStore';
import { Colors, Typography, Spacing, Radius } from '../../src/utils/theme';
import { Ionicons } from '@expo/vector-icons';

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams<{ code?: string; error?: string; error_description?: string }>();
  const { setSession, loadProfile } = useAuthStore();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function handleAuth() {
      try {
        // 1. Check for error in query params
        if (params.error || params.error_description) {
          const desc = params.error_description || params.error || 'Authentication was declined or failed.';
          if (isMounted) setErrorMessage(desc);
          return;
        }

        // 2. Extract code from local params or initial deep link URL
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
            if (isMounted) setErrorMessage(String(parsed.queryParams.error_description));
            return;
          }
          if (initialUrl.includes('#')) {
            const hashParams = new URLSearchParams(initialUrl.split('#')[1]);
            accessToken = hashParams.get('access_token');
            refreshToken = hashParams.get('refresh_token');
          }
        }

        // 3. Exchange code for session if PKCE code is present
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          if (data.session) {
            setSession(data.session);
            await loadProfile();
            router.replace('/(tabs)/home');
            return;
          }
        }

        // 4. Set session directly if access tokens were in URL hash
        if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
          if (data.session) {
            setSession(data.session);
            await loadProfile();
            router.replace('/(tabs)/home');
            return;
          }
        }

        // 5. Check if Supabase client already received session from browser handler
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session) {
          setSession(sessionData.session);
          await loadProfile();
          router.replace('/(tabs)/home');
          return;
        }

        // 6. Grace period before showing error
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const { data: retrySession } = await supabase.auth.getSession();
        if (retrySession?.session) {
          setSession(retrySession.session);
          await loadProfile();
          router.replace('/(tabs)/home');
          return;
        }

        if (isMounted) {
          setErrorMessage('Could not complete Google Sign-In. Please try signing in again.');
        }
      } catch (err: any) {
        console.error('[AuthCallbackScreen] Error during callback handling:', err);
        if (isMounted) {
          setErrorMessage(err.message || 'An unexpected error occurred during Google sign-in.');
        }
      }
    }

    handleAuth();

    return () => {
      isMounted = false;
    };
  }, [params]);

  if (errorMessage) {
    return (
      <View style={styles.container}>
        <View style={styles.errorIconWrap}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.red || '#EF4444'} />
        </View>
        <Text style={styles.title}>Sign-In Incomplete</Text>
        <Text style={styles.message}>{errorMessage}</Text>
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={() => router.replace('/(auth)/login')}
          activeOpacity={0.8}
        >
          <Text style={styles.btnText}>Back to Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.blue} />
      <Text style={styles.text}>Signing you in with Google...</Text>
      <Text style={styles.subtext}>Please wait a moment while we set up your profile.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['2xl'],
    gap: Spacing.md,
  },
  errorIconWrap: {
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.bold,
    color: Colors.text,
    textAlign: 'center',
  },
  message: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  text: {
    fontSize: Typography.lg,
    fontWeight: Typography.semibold,
    color: Colors.text,
    marginTop: Spacing.md,
  },
  subtext: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  btnPrimary: {
    backgroundColor: Colors.blue,
    borderRadius: Radius.xl,
    paddingVertical: 14,
    paddingHorizontal: Spacing['2xl'],
    alignItems: 'center',
    width: '100%',
  },
  btnText: {
    color: Colors.white,
    fontSize: Typography.base,
    fontWeight: Typography.bold,
  },
});
