import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { validatePasswordStrength, PasswordStrengthResult } from '@eagle-pathway/shared';
import { Colors, Spacing, Typography, Radius } from '@/utils/theme';

interface PasswordStrengthMeterProps {
  password: string;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  const strength: PasswordStrengthResult = validatePasswordStrength(password || '');

  const checklistItems = [
    { label: '8+ characters', pass: strength.isMinLength },
    { label: 'Upper & lowercase (A-z)', pass: strength.hasUpper && strength.hasLower },
    { label: 'At least 1 number (0-9)', pass: strength.hasNumber },
    { label: 'At least 1 special char (!@#$)', pass: strength.hasSpecial },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Password Security Requirements:</Text>
        <Text style={[styles.strengthLabel, { color: password ? strength.color : Colors.textSecondary }]}>
          {password ? strength.label : 'Required'}
        </Text>
      </View>

      {/* 4-segment progress bar */}
      <View style={styles.barContainer}>
        {[1, 2, 3, 4].map((step) => (
          <View
            key={step}
            style={[
              styles.barSegment,
              { backgroundColor: password && step <= strength.score ? strength.color : Colors.border },
            ]}
          />
        ))}
      </View>

      {/* Checklist items */}
      <View style={styles.checklistGrid}>
        {checklistItems.map((item, index) => (
          <View key={index} style={styles.checklistItem}>
            <Ionicons
              name={item.pass ? 'checkmark-circle' : 'ellipse-outline'}
              size={15}
              color={item.pass ? '#16a34a' : '#9ca3af'}
            />
            <Text style={[styles.checklistText, item.pass && styles.checklistTextPass]}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    backgroundColor: '#f8fafc',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: Typography.bold,
  },
  barContainer: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
    gap: 4,
  },
  barSegment: {
    flex: 1,
    borderRadius: 3,
  },
  checklistGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 2,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginTop: 4,
    gap: 4,
  },
  checklistText: {
    fontSize: 11,
    color: '#64748b',
  },
  checklistTextPass: {
    color: '#15803d',
    fontWeight: Typography.semibold,
  },
});
