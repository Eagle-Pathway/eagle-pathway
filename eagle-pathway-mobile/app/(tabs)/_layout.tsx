import { useEffect } from 'react';
import { Tabs, usePathname, router } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography } from '../../src/utils/theme';
import AiAssistantFAB from '../../src/components/AiAssistantFAB';
import { useAuthStore } from '../../src/store/authStore';
import { isProfileIncomplete } from '../../src/utils/profile';
import { getUserRole } from '../../src/utils/role';
import { ONBOARDED_KEY } from '../../src/screens/onboarding/OnboardingScreen';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={tabStyles.item}>
      <Text style={tabStyles.emoji}>{emoji}</Text>
      <Text
        style={[tabStyles.label, focused && tabStyles.labelActive]}
        numberOfLines={1}
        allowFontScaling={false}
      >
        {label}
      </Text>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  // numberOfLines={1} on the label (plus letting the slot size the item) keeps
  // every label ("Explore", "Activity", "Dashboard", "Earnings"…) on one line
  // and evenly spaced across all screen sizes without risking clipping on small
  // devices.
  item: { alignItems: 'center', gap: 2, paddingTop: 4 },
  emoji: { fontSize: 22 },
  label: { fontSize: 10, fontWeight: Typography.medium, color: '#9ca3af', textAlign: 'center' },
  labelActive: { color: Colors.blue, fontWeight: Typography.semibold },
});

export default function TabLayout() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const isAssistant = pathname === '/assistant' || pathname.includes('/assistant');

  const activeRole = getUserRole(user);

  // Auth guard: if the session is lost at runtime (e.g. a refresh-token
  // failure signs the user out from the root layout), kick back to the auth
  // stack instead of stranding the user on an empty/broken tab view. Wait for
  // the session check to settle so we don't bounce during cold-start restore.
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/(auth)/splash');
    }
  }, [isLoading, isAuthenticated]);

  // First-run gate: send students with an incomplete profile to onboarding once.
  useEffect(() => {
    const role = getUserRole(user).toLowerCase();
    if (!user || role !== 'student' || !isProfileIncomplete(user)) return;
    let cancelled = false;
    AsyncStorage.getItem(ONBOARDED_KEY).then(seen => {
      if (!cancelled && !seen) router.replace('/onboarding');
    });
    return () => { cancelled = true; };
  }, [user?.id]);

  return (
    <>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          // Pad for the system navigation bar (insets.bottom is 0 on devices
          // with no inset, so this is a no-op there and taller on 3-button nav).
          height: 70 + insets.bottom,
          paddingBottom: 6 + insets.bottom,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon 
              emoji={activeRole === 'tutor' ? '📊' : activeRole === 'parent' ? '👨‍👩‍👧' : '🏠'} 
              label={activeRole === 'tutor' ? 'Dashboard' : activeRole === 'parent' ? 'Family' : 'Home'} 
              focused={focused} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon 
              emoji={activeRole === 'tutor' ? '📅' : '🔍'} 
              label={activeRole === 'tutor' ? 'Schedule' : 'Explore'} 
              focused={focused} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon 
              emoji={activeRole === 'tutor' ? '💰' : '⚡'} 
              label={activeRole === 'tutor' ? 'Earnings' : 'Activity'} 
              focused={focused} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="💬" label="Chat" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="Profile" focused={focused} />,
        }}
      />
      {/* Hidden from tab bar — accessible via deep links / programmatic nav */}
      <Tabs.Screen name="scholarships" options={{ href: null }} />
      <Tabs.Screen name="tutors" options={{ href: null }} />
      <Tabs.Screen name="service" options={{ href: null }} />
      <Tabs.Screen name="bookings" options={{ href: null }} />
      <Tabs.Screen name="assistant" options={{ href: null }} />
    </Tabs>
      {!isAssistant && <AiAssistantFAB />}
    </>
  );
}
