import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, CommonStyles } from '../../src/utils/theme';
import { BookingsScreen } from '../../src/screens/index';
import { TrackerScreen } from '../../src/screens/index';
import TutorEarningsScreen from '../../src/screens/tutors/TutorEarningsScreen';
import ServiceRequestScreen from '../service-request';
import { useAuthStore } from '../../src/store/authStore';

type Segment = 'bookings' | 'tracker' | 'pay';

const SEGMENTS: { key: Segment; label: string; emoji: string }[] = [
  { key: 'bookings', label: 'Sessions', emoji: '📅' },
  { key: 'tracker', label: 'Tracker', emoji: '📊' },
  { key: 'pay', label: 'Pay', emoji: '💳' },
];

export default function ActivityScreen() {
  const { user } = useAuthStore();
  const isTutor = (user?.active_role || user?.roles?.[0] || 'student').toLowerCase() === 'tutor';
  const [active, setActive] = useState<Segment>('bookings');

  // For tutors this tab is labelled "Earnings" — show payouts, not the student
  // Sessions/Tracker/Pay activity segments.
  if (isTutor) {
    return <TutorEarningsScreen />;
  }

  return (
    <View style={CommonStyles.flex1}>
      <SafeAreaView style={styles.segmentWrap} edges={['top']}>
        <Text style={styles.heading}>Activity</Text>
        <View style={styles.segment}>
          {SEGMENTS.map(s => (
            <TouchableOpacity
              key={s.key}
              style={[styles.segBtn, active === s.key && styles.segBtnActive]}
              onPress={() => setActive(s.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.segText, active === s.key && styles.segTextActive]}>
                {s.emoji} {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>

      <View style={CommonStyles.flex1}>
        {active === 'bookings' ? <BookingsScreen hideHeader /> :
         active === 'tracker' ? <TrackerScreen hideHeader /> :
         <ServiceRequestScreen hideHeader onSubmitSuccess={() => setActive('bookings')} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  segmentWrap: {
    backgroundColor: Colors.blueDark,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  heading: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.bold,
    color: Colors.white,
    marginBottom: Spacing.md,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 3,
  },
  segBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  segBtnActive: {
    backgroundColor: Colors.white,
  },
  segText: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: 'rgba(255,255,255,0.7)',
  },
  segTextActive: {
    color: Colors.blueDark,
  },
});
