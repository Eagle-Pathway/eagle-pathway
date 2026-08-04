import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Tabs, usePathname, router } from 'expo-router';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography } from '../../src/utils/theme';
import AiAssistantFAB from '../../src/components/AiAssistantFAB';
import { useAuthStore } from '../../src/store/authStore';
import { isProfileIncomplete } from '../../src/utils/profile';
import { getUserRole } from '../../src/utils/role';
import { supabase } from '../../src/services/supabase';
import { ONBOARDED_KEY } from '../../src/screens/onboarding/OnboardingScreen';

function TabIcon({ icon, label, focused, dot }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; focused: boolean; dot?: boolean }) {
  // Scale the label down on narrow screens (e.g. 360px wide) so longer labels
  // ("Dashboard", "Earnings", "Activity") stay on one line without truncating.
  const { width } = useWindowDimensions();
  const labelFontSize = width < 380 ? 9 : 10;
  return (
    <View style={tabStyles.item}>
      <View>
        <Ionicons
          name={focused ? icon.replace(/-outline$/, '') as React.ComponentProps<typeof Ionicons>['name'] : icon}
          size={24}
          color={focused ? Colors.blue : '#9ca3af'}
        />
        {dot && <View style={tabStyles.notifDot} />}
      </View>
      <Text
        style={[tabStyles.label, { fontSize: labelFontSize }, focused && tabStyles.labelActive]}
        numberOfLines={1}
        allowFontScaling={false}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
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
  label: { fontSize: 10, fontWeight: Typography.medium, color: '#9ca3af', textAlign: 'center' },
  labelActive: { color: Colors.blue, fontWeight: Typography.semibold },
  notifDot: { position: 'absolute', top: -2, right: -6, width: 8, height: 8, borderRadius: 4, backgroundColor: '#f59e0b', borderWidth: 1.5, borderColor: Colors.white },
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

  const [openJobsCount, setOpenJobsCount] = useState(0);
  useEffect(() => {
    if (getUserRole(user).toLowerCase() !== 'tutor') return;
    let cancelled = false;
    supabase.from('tutor_job_posts').select('id', { count: 'exact', head: true }).eq('status', 'open').then(({ count }) => {
      if (!cancelled) setOpenJobsCount(count ?? 0);
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
              icon={activeRole === 'tutor' ? 'grid-outline' : activeRole === 'parent' ? 'people-outline' : 'home-outline'}
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
              icon={activeRole === 'tutor' ? 'briefcase-outline' : 'search-outline'}
              label={activeRole === 'tutor' ? 'Jobs' : 'Explore'}
              focused={focused}
              dot={activeRole === 'tutor' && openJobsCount > 0}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              icon={activeRole === 'tutor' ? 'wallet-outline' : 'flash-outline'}
              label={activeRole === 'tutor' ? 'Earnings' : 'Activity'}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="chatbubbles-outline" label="Chat" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="person-outline" label="Profile" focused={focused} />,
        }}
      />
      {/* Hidden from tab bar — accessible via deep links / programmatic nav */}
      <Tabs.Screen name="scholarships" options={{ href: null }} />
      <Tabs.Screen name="tutors" options={{ href: null }} />
      <Tabs.Screen name="tutor-jobs" options={{ href: null }} />
      <Tabs.Screen name="my-applications" options={{ href: null }} />
      <Tabs.Screen name="service" options={{ href: null }} />
      <Tabs.Screen name="bookings" options={{ href: null }} />
      <Tabs.Screen name="assistant" options={{ href: null }} />
    </Tabs>
      {!isAssistant && <AiAssistantFAB />}
    </>
  );
}
