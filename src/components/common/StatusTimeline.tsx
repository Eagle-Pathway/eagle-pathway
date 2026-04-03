import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../utils/theme';
import { ApplicationStatus } from '../../types';

interface TimelineStep {
  status: ApplicationStatus;
  label: string;
  description: string;
  icon: string;
}

const TIMELINE_STEPS: TimelineStep[] = [
  { status: 'personal_info', label: 'Profile Verified', description: 'Your basic information is confirmed.', icon: '👤' },
  { status: 'documents', label: 'Document Upload', description: 'Mandatory documents submitted.', icon: '📎' },
  { status: 'sop', label: 'SOP Review', description: 'Statement of Purpose reviewed by AI and consultants.', icon: '📝' },
  { status: 'submitted', label: 'Application Submitted', description: 'Sent to the university/organization.', icon: '🚀' },
  { status: 'interview', label: 'Interview Phase', description: 'You have been shortlisted for an interview.', icon: '🤝' },
  { status: 'accepted', label: 'Offer Received', description: 'Congratulations! You received an offer.', icon: '🎉' },
];

interface StatusTimelineProps {
  currentStatus: ApplicationStatus;
  updatedAt: string;
}

export function StatusTimeline({ currentStatus, updatedAt }: StatusTimelineProps) {
  const currentIndex = TIMELINE_STEPS.findIndex(s => s.status === currentStatus);
  const isRejected = currentStatus === 'rejected';

  return (
    <View style={styles.container}>
      {TIMELINE_STEPS.map((step, index) => {
        const isDone = index < currentIndex || currentStatus === 'accepted';
        const isActive = index === currentIndex && !isRejected;
        const isFuture = index > currentIndex && !isRejected;

        return (
          <View key={step.status} style={styles.row}>
            <View style={styles.leftCol}>
              <View style={[
                styles.dot,
                isDone && styles.dotDone,
                isActive && styles.dotActive,
                isFuture && styles.dotFuture
              ]}>
                {isDone ? <Text style={styles.dotText}>✓</Text> : <Text style={styles.dotIcon}>{step.icon}</Text>}
              </View>
              {index < TIMELINE_STEPS.length - 1 && (
                <View style={[styles.line, isDone && styles.lineDone]} />
              )}
            </View>
            <View style={styles.rightCol}>
              <Text style={[styles.label, isActive && styles.labelActive]}>{step.label}</Text>
              <Text style={styles.description}>{step.description}</Text>
              {isActive && (
                <Text style={styles.timeLabel}>Last update: {new Date(updatedAt).toLocaleDateString()}</Text>
              )}
            </View>
          </View>
        );
      })}

      {isRejected && (
        <View style={[styles.row, { marginTop: Spacing.md }]}>
          <View style={styles.leftCol}>
            <View style={[styles.dot, { backgroundColor: Colors.red }]}>
              <Text style={styles.dotText}>×</Text>
            </View>
          </View>
          <View style={styles.rightCol}>
            <Text style={[styles.label, { color: Colors.red }]}>Application Rejected</Text>
            <Text style={styles.description}>Don't give up! Our consultants can help you find alternatives.</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.lg },
  row: { flexDirection: 'row', gap: Spacing.lg },
  leftCol: { alignItems: 'center', width: 40 },
  dot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.border
  },
  dotDone: { backgroundColor: Colors.green, borderColor: Colors.green },
  dotActive: { backgroundColor: Colors.blue, borderColor: Colors.blue, transform: [{ scale: 1.1 }] },
  dotFuture: { backgroundColor: Colors.grayLight, borderColor: Colors.border },
  dotText: { color: Colors.white, fontSize: 16, fontWeight: 'bold' },
  dotIcon: { fontSize: 16 },
  line: { width: 2, flex: 1, backgroundColor: Colors.border, marginVertical: 4 },
  lineDone: { backgroundColor: Colors.green },
  rightCol: { flex: 1, paddingBottom: Spacing.xl },
  label: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.textSecondary },
  labelActive: { color: Colors.blue, fontSize: Typography.lg },
  description: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  timeLabel: { fontSize: 10, color: Colors.blue, fontWeight: 'bold', marginTop: 4, textTransform: 'uppercase' },
});
