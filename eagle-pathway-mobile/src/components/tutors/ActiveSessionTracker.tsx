import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '@/utils/theme';
import { useTutorSessionStore } from '@/store/tutorSessionStore';
import { toast } from '@/utils/toast';
import type { TutorSessionLog } from '@/types';

interface ActiveSessionTrackerProps {
  session: TutorSessionLog;
  userId: string;
  isTutor: boolean;
  onSessionUpdated?: () => void;
}

export function ActiveSessionTracker({
  session,
  userId,
  isTutor,
  onSessionUpdated
}: ActiveSessionTrackerProps) {
  const { confirmStartSession, endSession, confirmEndSession } = useTutorSessionStore();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [loading, setLoading] = useState(false);

  // Live timer calculation
  useEffect(() => {
    if (!session?.start_time || session.status !== 'active') return;

    const startTimeMs = new Date(session.start_time).getTime();
    
    const updateTimer = () => {
      const nowMs = new Date().getTime();
      const diffSecs = Math.max(0, Math.floor((nowMs - startTimeMs) / 1000));
      setElapsedSeconds(diffSecs);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [session?.start_time, session?.status]);

  const formatTimer = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleConfirmStart = async () => {
    setLoading(true);
    try {
      await confirmStartSession(session.id);
      toast.success('Start Confirmed! ⏱️', 'You have confirmed the session start time.');
      onSessionUpdated?.();
    } catch (e: any) {
      toast.error('Failed', e?.message || 'Could not confirm start time.');
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    Alert.alert(
      'Clock Out Session?',
      `Are you sure you want to stop the timer at ${formatTimer(elapsedSeconds)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clock Out Now',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await endSession({ sessionId: session.id });
              toast.success('Clock-out Submitted! ⏱️', 'Waiting for student/parent to confirm duration.');
              onSessionUpdated?.();
            } catch (e: any) {
              toast.error('Clock-out Failed', e?.message || 'Could not end session.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleConfirmEnd = async () => {
    setLoading(true);
    try {
      await confirmEndSession(session.id);
      toast.success('Session Completed! 🎉', 'Dual clock-out confirmed. Hours logged to ledger.');
      onSessionUpdated?.();
    } catch (e: any) {
      toast.error('Failed', e?.message || 'Could not confirm clock-out.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.card}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>SESSION IN PROGRESS</Text>
        </View>
        <Text style={styles.rateText}>{session.hourly_rate} ETB/hr</Text>
      </View>

      {/* Timer Display */}
      <View style={styles.timerContainer}>
        <Ionicons name="timer-outline" size={32} color={Colors.blue} />
        <Text style={styles.timerText}>{formatTimer(elapsedSeconds)}</Text>
      </View>

      {/* Dual Confirmation Status Badges */}
      <View style={styles.confirmationRow}>
        <View style={[styles.statusBadge, session.tutor_start_confirmed && styles.statusBadgeActive]}>
          <Ionicons
            name={session.tutor_start_confirmed ? 'checkmark-circle' : 'time-outline'}
            size={14}
            color={session.tutor_start_confirmed ? Colors.green : Colors.textSecondary}
          />
          <Text style={[styles.statusText, session.tutor_start_confirmed && styles.statusTextActive]}>
            Tutor Clock-In
          </Text>
        </View>

        <View style={[styles.statusBadge, session.student_start_confirmed && styles.statusBadgeActive]}>
          <Ionicons
            name={session.student_start_confirmed ? 'checkmark-circle' : 'time-outline'}
            size={14}
            color={session.student_start_confirmed ? Colors.green : Colors.textSecondary}
          />
          <Text style={[styles.statusText, session.student_start_confirmed && styles.statusTextActive]}>
            Student Confirmed
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        {isTutor ? (
          <TouchableOpacity
            style={[styles.btn, styles.btnDanger, loading && { opacity: 0.6 }]}
            onPress={handleClockOut}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Ionicons name="square" size={16} color={Colors.white} />
            <Text style={styles.btnDangerText}>{loading ? 'Clocking Out...' : 'Clock Out (Stop Timer)'}</Text>
          </TouchableOpacity>
        ) : (
          !session.student_start_confirmed ? (
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary, loading && { opacity: 0.6 }]}
              onPress={handleConfirmStart}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-done" size={18} color={Colors.white} />
              <Text style={styles.btnPrimaryText}>{loading ? 'Confirming...' : 'Confirm Session Start'}</Text>
            </TouchableOpacity>
          ) : session.end_time && !session.student_end_confirmed ? (
            <TouchableOpacity
              style={[styles.btn, styles.btnSuccess, loading && { opacity: 0.6 }]}
              onPress={handleConfirmEnd}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color={Colors.white} />
              <Text style={styles.btnPrimaryText}>{loading ? 'Confirming...' : 'Confirm Clock-Out & Log Hours'}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.confirmedBox}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.green} />
              <Text style={styles.confirmedBoxText}>Session Start Confirmed by You</Text>
            </View>
          )
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#EFF6FF',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    marginBottom: Spacing.lg,
    shadowColor: '#1E4D9B',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  liveText: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  rateText: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.blue,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  timerText: {
    fontSize: 32,
    fontWeight: Typography.bold,
    color: Colors.blue,
    letterSpacing: 1,
  },
  confirmationRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statusBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusBadgeActive: {
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  statusText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  statusTextActive: {
    color: Colors.green,
    fontWeight: Typography.bold,
  },
  actionsContainer: {
    marginTop: 4,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: Radius.lg,
  },
  btnPrimary: {
    backgroundColor: Colors.blue,
  },
  btnDanger: {
    backgroundColor: Colors.red,
  },
  btnSuccess: {
    backgroundColor: Colors.green,
  },
  btnPrimaryText: {
    color: Colors.white,
    fontWeight: Typography.bold,
    fontSize: Typography.sm,
  },
  btnDangerText: {
    color: Colors.white,
    fontWeight: Typography.bold,
    fontSize: Typography.sm,
  },
  confirmedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: '#F0FDF4',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  confirmedBoxText: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    color: Colors.green,
  },
});
