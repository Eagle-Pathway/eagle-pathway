import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../utils/theme';

// Tab bar is 70 + insets.bottom tall (see app/(tabs)/_layout.tsx); float the FAB
// this much above the screen bottom so it clears the tab bar and the Profile tab
// on every device (gesture-nav and 3-button-nav alike).
const TAB_BAR_HEIGHT = 70;
const FAB_GAP = 16;

export default function AiAssistantFAB() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <TouchableOpacity
      style={[styles.fab, { bottom: TAB_BAR_HEIGHT + insets.bottom + FAB_GAP }]}
      onPress={() => router.push('/(tabs)/assistant')}
      activeOpacity={0.8}
    >
      <View style={styles.iconContainer}>
        <Ionicons name="sparkles" size={20} color="#fff" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.blue,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    zIndex: 999,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
