import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '@/utils/theme';
import type { HoursLedgerMetrics } from '@/services/tutorSessions';

interface SessionHoursLedgerProps {
  metrics: HoursLedgerMetrics;
  isTutor?: boolean;
}

export function SessionHoursLedger({ metrics, isTutor = false }: SessionHoursLedgerProps) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="time-outline" size={18} color={Colors.blue} />
          <Text style={styles.title}>Tracked Session Hours</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Live Ledger</Text>
        </View>
      </View>

      {/* Metrics Row */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricVal}>{metrics.todayHours} <Text style={styles.unitText}>hrs</Text></Text>
          <Text style={styles.metricLabel}>Today</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.metricItem}>
          <Text style={styles.metricVal}>{metrics.weekHours} <Text style={styles.unitText}>hrs</Text></Text>
          <Text style={styles.metricLabel}>This Week</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.metricItem}>
          <Text style={styles.metricVal}>{metrics.monthHours} <Text style={styles.unitText}>hrs</Text></Text>
          <Text style={styles.metricLabel}>This Month</Text>
        </View>
      </View>

      {/* Total Amount Footer */}
      <View style={styles.footerRow}>
        <Text style={styles.footerLabel}>
          {isTutor ? 'Accrued Monthly Earnings' : 'Monthly Tutoring Balance'}
        </Text>
        <Text style={styles.footerVal}>{metrics.totalPayableAmount.toLocaleString()} ETB</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  badge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: Colors.blue,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.md,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricVal: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  unitText: {
    fontSize: Typography.xs,
    fontWeight: Typography.regular,
    color: Colors.textSecondary,
  },
  metricLabel: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  footerLabel: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  footerVal: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.blue,
  },
});
