import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { supabase } from '../src/services/supabase';
import { useAuthStore } from '../src/store/authStore';
import { useRealtimeStore } from '../src/store/realtimeStore';
import { useScholarshipStore } from '../src/store/scholarshipStore';
import { notificationsService } from '../src/services/notifications';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { OfflineBanner } from '../src/components/OfflineBanner';
import { initErrorLogging } from '../src/services/errorLog';

SplashScreen.preventAutoHideAsync();

// Configure structured logging + the Supabase error sink before anything renders.
initErrorLogging();

export default function RootLayout() {
  const { setSession, loadProfile, setUser, setLoading } = useAuthStore();
  const { subscribeToUpdates, unsubscribeFromUpdates } = useRealtimeStore();
  const { loadSavedScholarships } = useScholarshipStore();

  useEffect(() => {
    // Load local offline caches
    loadSavedScholarships();
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session) {
        await loadProfile();
        subscribeToUpdates(session.user.id);
      } else {
        setUser(null);
        unsubscribeFromUpdates();
      }
      if (event === 'PASSWORD_RECOVERY') {
        router.push('/(auth)/update-password');
      }
      SplashScreen.hideAsync();
    });

    // Check existing session on mount
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Session error:', error);
        if (error.message.includes('Refresh Token')) {
          supabase.auth.signOut();
        }
        // Session check is over — release the router gate so it can route.
        setLoading(false);
        SplashScreen.hideAsync();
        return;
      }

      setSession(session);
      if (session) {
        loadProfile()
          .then(() => {
            subscribeToUpdates(session.user.id);
            notificationsService.requestPermission().then(granted => {
              if (granted) notificationsService.registerPushToken(session.user.id);
            });
          })
          .catch(e => {
            console.error('Profile load error:', e);
            if (e.message?.includes('Refresh Token')) {
              supabase.auth.signOut();
            }
          })
          .finally(() => {
            // loadProfile already clears isLoading, but ensure it's cleared even
            // if it short-circuits (e.g. the dev bypass returns early).
            setLoading(false);
            SplashScreen.hideAsync();
          });
      } else {
        setLoading(false);
        SplashScreen.hideAsync();
      }
    });

    // Listeners
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
      subscription.unsubscribe();
      unsubscribeFromUpdates();
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
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
            <Stack.Screen name="notifications" options={{ presentation: 'card' }} />
            <Stack.Screen name="settings" options={{ presentation: 'card' }} />
          </Stack>
          <OfflineBanner />
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
