import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, CommonStyles } from '../../src/utils/theme';
import ScholarshipsScreen from '../../src/screens/scholarships/ScholarshipsScreen';
import TutorsScreen from '../../src/screens/tutors/TutorsScreen';
import { useAuthStore } from '../../src/store/authStore';
import { getUserRole } from '../../src/utils/role';
import { TutorJobFeedScreen } from '../../src/screens/profile/TutorJobFeedScreen';

type StudentTab = 'scholarships' | 'tutors';
type TutorTab = 'jobs' | 'scholarships';

export default function ExploreScreen() {
  const { user } = useAuthStore();
  const isTutor = getUserRole(user).toLowerCase() === 'tutor';
  const [studentTab, setStudentTab] = useState<StudentTab>('scholarships');
  const [tutorTab, setTutorTab] = useState<TutorTab>('jobs');

  if (isTutor) {
    return (
      <View style={CommonStyles.flex1}>
        {/* Tutor Top Segment: Jobs & Scholarships */}
        <SafeAreaView style={styles.segmentWrap} edges={['top']}>
          <View style={styles.segment}>
            <TouchableOpacity
              style={[styles.segBtn, tutorTab === 'jobs' && styles.segBtnActive]}
              onPress={() => setTutorTab('jobs')}
              activeOpacity={0.8}
            >
              <Text style={[styles.segText, tutorTab === 'jobs' && styles.segTextActive]}>
                💼 Tutoring Jobs
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segBtn, tutorTab === 'scholarships' && styles.segBtnActive]}
              onPress={() => setTutorTab('scholarships')}
              activeOpacity={0.8}
            >
              <Text style={[styles.segText, tutorTab === 'scholarships' && styles.segTextActive]}>
                🎓 Scholarships
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        <View style={CommonStyles.flex1}>
          {tutorTab === 'jobs' ? <TutorJobFeedScreen /> : <ScholarshipsScreen hideBack />}
        </View>
      </View>
    );
  }

  return (
    <View style={CommonStyles.flex1}>
      {/* Student/Parent Segment switcher */}
      <SafeAreaView style={styles.segmentWrap} edges={['top']}>
        <View style={styles.segment}>
          <TouchableOpacity
            style={[styles.segBtn, studentTab === 'scholarships' && styles.segBtnActive]}
            onPress={() => setStudentTab('scholarships')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segText, studentTab === 'scholarships' && styles.segTextActive]}>
              🎓 Scholarships
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segBtn, studentTab === 'tutors' && styles.segBtnActive]}
            onPress={() => setStudentTab('tutors')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segText, studentTab === 'tutors' && styles.segTextActive]}>
              👨‍🏫 Tutors
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Content */}
      <View style={CommonStyles.flex1}>
        {studentTab === 'scholarships' ? <ScholarshipsScreen hideBack /> : <TutorsScreen />}
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
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 10,
  },
  segBtnActive: {
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  segText: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: 'rgba(255,255,255,0.75)',
  },
  segTextActive: {
    color: Colors.blueDark,
    fontWeight: Typography.bold,
  },
});
