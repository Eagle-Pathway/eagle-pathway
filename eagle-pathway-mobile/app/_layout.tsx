import { useEffect, useRef } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppState, Text, TextInput } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
import { supabase } from '../src/services/supabase';
import { useAuthStore } from '../src/store/authStore';
import { useRealtimeStore } from '../src/store/realtimeStore';
import { useScholarshipStore } from '../src/store/scholarshipStore';
import { notificationsService } from '../src/services/notifications';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { OfflineBanner } from '../src/components/OfflineBanner';
import { initErrorLogging } from '../src/services/errorLog';
import Toast from 'react-native-toast-message';
import { toastConfig } from '../src/components/ToastConfig';

SplashScreen.preventAutoHideAsync().catch(() => {});

// TODO(pre-production): integrate Sentry (@sentry/react-native) for crash/error
// reporting before the Play Store release. Wrap the app and init here alongside
// initErrorLogging(). Adding the native SDK will require a new APK build.
// Configure structured logging + the Supabase error sink before anything renders.
initErrorLogging();

// Disable global font scaling to prevent UI breakage when users have huge system fonts
if ((Text as any).defaultProps == null) (Text as any).defaultProps = {};
(Text as any).defaultProps.allowFontScaling = false;
if ((TextInput as any).defaultProps == null) (TextInput as any).defaultProps = {};
(TextInput as any).defaultProps.allowFontScaling = false;

export default function RootLayout() {
  const { setSession, loadProfile, setUser, setLoading } = useAuthStore();
  const { subscribeToUpdates, unsubscribeFromUpdates } = useRealtimeStore();
  const { loadSavedScholarships } = useScholarshipStore();
  const splashHidden = useRef(false);

  const safeHideSplash = () => {
    if (!splashHidden.current) {
      splashHidden.current = true;
      setLoading(false);
      SplashScreen.hideAsync().catch(() => {});
    }
  };

  useEffect(() => {
    // 1. Fallback Safety Net: Hide splash screen within 800ms max under all conditions
    const splashTimeout = setTimeout(() => {
      safeHideSplash();
    }, 800);

    // 2. Manage Supabase AppState for background token refreshing
    const appStateListener = AppState.addEventListener('change', (state) => {
      if (state === 'active') supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    });

    // 3. Load local offline caches in background
    loadSavedScholarships().catch(() => {});

    // 4. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session) {
        loadProfile().then(() => subscribeToUpdates(session.user.id)).catch(() => {});
      } else {
        setUser(null);
        unsubscribeFromUpdates();
      }
      if (event === 'PASSWORD_RECOVERY') {
        router.push('/(auth)/update-password');
      }
    });

    // 5. Restore local session instantly from AsyncStorage (< 100ms)
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.error('Session error:', error);
          if (error.message?.includes('Refresh Token')) {
            supabase.auth.signOut().catch(() => {});
          }
          safeHideSplash();
          return;
        }

        setSession(session);
        // HIDE SPLASH SCREEN IMMEDIATELY ONCE LOCAL SESSION IS RESTORED
        safeHideSplash();

        // Perform remote profile sync & realtime subscriptions in background
        if (session) {
          loadProfile()
            .then(() => subscribeToUpdates(session.user.id))
            .catch(e => {
              console.error('Profile load error:', e);
              if (e?.message?.includes('Refresh Token')) {
                supabase.auth.signOut().catch(() => {});
              }
            });
        }
      })
      .catch((err) => {
        console.warn('Session restoration failed:', err);
        safeHideSplash();
      });

    // 6. Silent background OTA update check (non-blocking)
    if (!__DEV__) {
      setTimeout(() => {
        Updates.checkForUpdateAsync()
          .then(({ isAvailable }) => {
            if (isAvailable) {
              Updates.fetchUpdateAsync().then(() => {
                Updates.reloadAsync();
              }).catch(() => {});
            }
          })
          .catch(() => {});
      }, 3000);
    }

    // 7. Notification Listeners
    const notificationListener = notificationsService.addNotificationListener(notification => {
      console.log('Notification received:', notification);
    });

    const responseListener = notificationsService.addResponseListener(response => {
      const data = response.notification.request.content.data;
      if (data?.url && typeof data.url === 'string') {
        router.push(data.url as any);
      }
    });

    return () => {
      clearTimeout(splashTimeout);
      appStateListener.remove();
      subscription.unsubscribe();
      unsubscribeFromUpdates();
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" animated />
        <ErrorBoundary>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
            <Stack.Screen name="tutor-profile" options={{ presentation: 'card' }} />
            <Stack.Screen name="booking" options={{ presentation: 'card' }} />
            <Stack.Screen name="scholarship-detail" options={{ presentation: 'card' }} />
            <Stack.Screen name="packages" options={{ presentation: 'card' }} />
            <Stack.Screen name="apply" options={{ presentation: 'card' }} />
            <Stack.Screen name="tracker" options={{ presentation: 'card' }} />
            <Stack.Screen name="progress" options={{ presentation: 'card' }} />
            <Stack.Screen name="documents" options={{ presentation: 'card' }} />
            <Stack.Screen name="recommendations" options={{ presentation: 'card' }} />
            <Stack.Screen name="success-stories" options={{ presentation: 'card' }} />
            <Stack.Screen name="resources" options={{ presentation: 'card' }} />
            <Stack.Screen name="resources/[id]" options={{ presentation: 'card' }} />
            <Stack.Screen name="notifications" options={{ presentation: 'card' }} />
            <Stack.Screen name="settings" options={{ presentation: 'card' }} />
            <Stack.Screen name="tutor-jobs" options={{ presentation: 'card' }} />
            <Stack.Screen name="tutor-job-detail" options={{ presentation: 'card' }} />
            <Stack.Screen name="apply-job" options={{ presentation: 'card' }} />
            <Stack.Screen name="my-applications" options={{ presentation: 'card' }} />
            <Stack.Screen name="application-detail" options={{ presentation: 'card' }} />
          </Stack>
          <OfflineBanner />
          <Toast config={toastConfig} topOffset={60} visibilityTime={3500} />
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
