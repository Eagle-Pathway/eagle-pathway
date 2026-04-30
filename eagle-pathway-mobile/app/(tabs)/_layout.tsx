import { Tabs, usePathname } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography } from '../../src/utils/theme';
import AiAssistantFAB from '../../src/components/AiAssistantFAB';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={tabStyles.item}>
      <Text style={tabStyles.emoji}>{emoji}</Text>
      <Text style={[tabStyles.label, focused && tabStyles.labelActive]}>{label}</Text>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  item: { alignItems: 'center', gap: 2, paddingTop: 4 },
  emoji: { fontSize: 22 },
  label: { fontSize: 10, fontWeight: Typography.medium, color: '#9ca3af' },
  labelActive: { color: Colors.blue, fontWeight: Typography.semibold },
});

export default function TabLayout() {
  const pathname = usePathname();
  const isAssistant = pathname === '/assistant' || pathname.includes('/assistant');

  return (
    <>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          height: 70,
          paddingBottom: 6,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔍" label="Explore" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚡" label="Activity" focused={focused} />,
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
