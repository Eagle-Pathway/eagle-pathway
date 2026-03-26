import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { supabase } from '../src/services/supabase';
import { useAuthStore } from '../src/store/authStore';

import { useAppStore } from '../src/store/appStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { setSession, loadProfile, setUser } = useAuthStore();
  const { subscribeToUpdates, unsubscribeFromUpdates } = useAppStore();

  useEffect(() => {
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
      SplashScreen.hideAsync();
    });

    // Check existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        loadProfile().finally(() => {
          subscribeToUpdates(session.user.id);
          SplashScreen.hideAsync();
        });
      } else {
        SplashScreen.hideAsync();
      }
    });

    return () => {
      subscription.unsubscribe();
      unsubscribeFromUpdates();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="tutor-profile" options={{ presentation: 'card' }} />
          <Stack.Screen name="booking" options={{ presentation: 'card' }} />
          <Stack.Screen name="scholarship-detail" options={{ presentation: 'card' }} />
          <Stack.Screen name="packages" options={{ presentation: 'card' }} />
          <Stack.Screen name="apply" options={{ presentation: 'card' }} />
          <Stack.Screen name="tracker" options={{ presentation: 'card' }} />
          <Stack.Screen name="progress" options={{ presentation: 'card' }} />
          <Stack.Screen name="documents" options={{ presentation: 'card' }} />
          <Stack.Screen name="notifications" options={{ presentation: 'card' }} />
          <Stack.Screen name="settings" options={{ presentation: 'card' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
