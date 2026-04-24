import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, CommonStyles } from '../../src/utils/theme';
import ScholarshipsScreen from '../../src/screens/scholarships/ScholarshipsScreen';
import TutorsScreen from '../../src/screens/tutors/TutorsScreen';

type Tab = 'scholarships' | 'tutors';

export default function ExploreScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('scholarships');

  return (
    <View style={CommonStyles.flex1}>
      {/* Segment switcher */}
      <SafeAreaView style={styles.segmentWrap} edges={['top']}>
        <View style={styles.segment}>
          <TouchableOpacity
            style={[styles.segBtn, activeTab === 'scholarships' && styles.segBtnActive]}
            onPress={() => setActiveTab('scholarships')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segText, activeTab === 'scholarships' && styles.segTextActive]}>
              🎓 Scholarships
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segBtn, activeTab === 'tutors' && styles.segBtnActive]}
            onPress={() => setActiveTab('tutors')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segText, activeTab === 'tutors' && styles.segTextActive]}>
              👨‍🏫 Tutors
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Content */}
      <View style={CommonStyles.flex1}>
        {activeTab === 'scholarships' ? <ScholarshipsScreen hideBack /> : <TutorsScreen />}
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
