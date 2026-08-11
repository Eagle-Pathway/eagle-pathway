import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, TextInput, ScrollView
} from 'react-native';
import { toast } from '@/utils/toast';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { format, addDays, startOfMonth, getDaysInMonth, getDay } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { Button, Avatar } from '@/components/common';
import { KeyboardAwareScreen } from '@/components/KeyboardAwareScreen';
import { tutorsService } from '@/services/tutors';
import { useAuthStore } from '@/store/authStore';
import { useBookingStore } from '@/store/bookingStore';
import { Tutor } from '@/types';
import { showError } from '@/utils/errorHandler';

const MORNING_SLOTS = ['8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM'];
const AFTERNOON_SLOTS = ['12:00 PM', '12:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM'];
const EVENING_SLOTS = ['5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM'];

const DURATIONS = [
  { hours: 1, label: '1 Hour' },
  { hours: 1.5, label: '1.5 Hours', badge: 'Popular' },
  { hours: 2, label: '2 Hours' },
];

const PLATFORM_FEE_RATE = 0.10;

export default function BookingScreen() {
  const { tutorId } = useLocalSearchParams<{ tutorId: string }>();
  const { user } = useAuthStore();
  const { loadBookings } = useBookingStore();
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(addDays(new Date(), 1));
  const [selectedTime, setSelectedTime] = useState<string>('9:00 AM');
  const [timeCategory, setTimeCategory] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const [durationHours, setDurationHours] = useState(1.5);
  const [isRecurring, setIsRecurring] = useState(false);
  const [sessionType, setSessionType] = useState<'online' | 'in_person'>('online');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    let isMounted = true;
    if (tutorId) {
      tutorsService.getTutorById(tutorId).then(data => {
        if (isMounted) setTutor(data);
      }).catch(console.error);
    }
    return () => { isMounted = false; };
  }, [tutorId]);

  const sessionCost = tutor ? Math.round(tutor.hourly_rate * durationHours) : 0;
  const platformFee = Math.round(sessionCost * PLATFORM_FEE_RATE);
  const totalPerSession = sessionCost + platformFee;
  const finalTotal = isRecurring ? totalPerSession * 4 : totalPerSession;

  const handleConfirm = async () => {
    if (loading) return;
    if (!selectedTime) return toast.warning('Select Time', 'Please choose a time slot');
    if (!user || !tutor) return;

    setLoading(true);
    try {
      const bookingsToCreate = isRecurring ? 4 : 1;
      for (let i = 0; i < bookingsToCreate; i++) {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() + (i * 7));
        await tutorsService.createBooking({
          studentId: user.id,
          tutorId: tutor.id,
          subject: tutor.subjects?.[0] || 'General Tutoring',
          sessionDate: format(date, 'yyyy-MM-dd'),
          sessionTime: selectedTime,
          durationHours,
          sessionType,
          notes: notes.trim() || undefined,
          totalAmount: Math.round((tutor.hourly_rate * durationHours) * (1 + PLATFORM_FEE_RATE)),
          platformFee: Math.round(tutor.hourly_rate * durationHours * PLATFORM_FEE_RATE),
          studentName: user.full_name,
        });
      }
      await loadBookings(user.id);
      const msg = isRecurring ? `Weekly sessions for the next ${bookingsToCreate} weeks are booked.` : `Your session with ${tutor.user?.full_name} is confirmed.`;
      toast.success('Booking Confirmed! 🎉', msg);
      router.push('/(tabs)/bookings');
    } catch (e: any) {
      const slotTaken = e?.code === '23505' || /duplicate|already|uq_active_booking_slot|409|conflict/i.test(e?.message || '');
      if (slotTaken) {
        toast.warning('Time Slot Unavailable', 'That time is already booked with this tutor. Please choose a different time slot.');
      } else {
        showError(e, 'Booking Failed');
      }
    } finally {
      setLoading(false);
    }
  };

  // Calendar math
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDayOfWeek = getDay(startOfMonth(currentMonth));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const insets = useSafeAreaInsets();
  const initials = tutor?.user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'T';
  const currentSlots = timeCategory === 'morning' ? MORNING_SLOTS : timeCategory === 'afternoon' ? AFTERNOON_SLOTS : EVENING_SLOTS;

  return (
    <SafeAreaView style={[CommonStyles.flex1, { backgroundColor: '#F8FAFC' }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Schedule Session</Text>
      </View>

      <KeyboardAwareScreen contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Tutor Hero Card */}
        {tutor && (
          <View style={styles.tutorCard}>
            <Avatar initials={initials} size={50} borderRadius={16} color={Colors.blue} />
            <View style={{ flex: 1, marginLeft: Spacing.md }}>
              <Text style={styles.tutorName}>{tutor.user?.full_name}</Text>
              <Text style={styles.tutorSub}>{tutor.subjects?.[0] || 'Expert Tutor'} · {tutor.hourly_rate} ETB/hr</Text>
            </View>
            <View style={styles.badge}>
              <Ionicons name="checkmark-circle" size={14} color={Colors.green} />
              <Text style={styles.badgeText}>Verified</Text>
            </View>
          </View>
        )}

        {/* Calendar Section */}
        <View style={styles.cardSection}>
          <View style={styles.calHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="calendar-outline" size={18} color={Colors.blue} />
              <Text style={styles.calMonth}>{format(currentMonth, 'MMMM yyyy')}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: Spacing.xs }}>
              <TouchableOpacity style={styles.calNavBtn} onPress={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}>
                <Ionicons name="chevron-back" size={16} color={Colors.text} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.calNavBtn} onPress={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}>
                <Ionicons name="chevron-forward" size={16} color={Colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.calGrid}>
            {['S','M','T','W','T','F','S'].map((d, idx) => (
              <Text key={`day-hdr-${idx}`} style={styles.calDayLabel}>{d}</Text>
            ))}
            {Array(firstDayOfWeek).fill(null).map((_, i) => <View key={`empty-${i}`} style={styles.calCell} />)}
            {Array(daysInMonth).fill(null).map((_, i) => {
              const day = i + 1;
              const date = new Date(year, month, day);
              date.setHours(0, 0, 0, 0);
              const isPast = date < today;
              const isSelected = format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
              const isToday = format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
              return (
                <TouchableOpacity
                  key={`day-${day}`}
                  style={[
                    styles.calCell,
                    isSelected && styles.calSelected,
                    isToday && !isSelected && styles.calToday,
                    isPast && styles.calPast
                  ]}
                  onPress={() => { if (!isPast) setSelectedDate(date); }}
                  disabled={isPast}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.calDayNum, isSelected && styles.calSelectedText, isPast && styles.calPastText]}>{day}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Time of Day Slots */}
        <View style={styles.cardSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={18} color={Colors.blue} />
            <Text style={styles.sectionTitle}>Select Time · {format(selectedDate, 'MMM d')}</Text>
          </View>

          {/* Time Category Tabs */}
          <View style={styles.segmentContainer}>
            <TouchableOpacity
              style={[styles.segmentBtn, timeCategory === 'morning' && styles.segmentBtnActive]}
              onPress={() => setTimeCategory('morning')}
            >
              <Ionicons name="sunny-outline" size={14} color={timeCategory === 'morning' ? Colors.blue : Colors.textSecondary} />
              <Text style={[styles.segmentText, timeCategory === 'morning' && styles.segmentTextActive]}>Morning</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentBtn, timeCategory === 'afternoon' && styles.segmentBtnActive]}
              onPress={() => setTimeCategory('afternoon')}
            >
              <Ionicons name="partly-sunny-outline" size={14} color={timeCategory === 'afternoon' ? Colors.blue : Colors.textSecondary} />
              <Text style={[styles.segmentText, timeCategory === 'afternoon' && styles.segmentTextActive]}>Afternoon</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentBtn, timeCategory === 'evening' && styles.segmentBtnActive]}
              onPress={() => setTimeCategory('evening')}
            >
              <Ionicons name="moon-outline" size={14} color={timeCategory === 'evening' ? Colors.blue : Colors.textSecondary} />
              <Text style={[styles.segmentText, timeCategory === 'evening' && styles.segmentTextActive]}>Evening</Text>
            </TouchableOpacity>
          </View>

          {/* Time Chips Grid */}
          <View style={styles.slotsGrid}>
            {currentSlots.map(time => (
              <TouchableOpacity
                key={time}
                style={[styles.slotChip, selectedTime === time && styles.slotChipActive]}
                onPress={() => setSelectedTime(time)}
                activeOpacity={0.85}
              >
                <Text style={[styles.slotText, selectedTime === time && styles.slotTextActive]}>{time}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Duration & Mode Settings */}
        <View style={styles.cardSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="hourglass-outline" size={18} color={Colors.blue} />
            <Text style={styles.sectionTitle}>Duration & Format</Text>
          </View>

          <View style={{ gap: Spacing.sm, marginBottom: Spacing.md }}>
            {DURATIONS.map(d => (
              <TouchableOpacity
                key={d.hours}
                style={[styles.choiceCard, durationHours === d.hours && styles.choiceCardActive]}
                onPress={() => setDurationHours(d.hours)}
                activeOpacity={0.85}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Ionicons
                    name={durationHours === d.hours ? 'radio-button-on' : 'radio-button-off'}
                    size={18}
                    color={durationHours === d.hours ? Colors.blue : Colors.textSecondary}
                  />
                  <Text style={[styles.choiceText, durationHours === d.hours && styles.choiceTextActive]}>{d.label}</Text>
                </View>
                {d.badge && (
                  <View style={styles.popularTag}>
                    <Text style={styles.popularTagText}>{d.badge}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Session Format */}
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            {(['online', 'in_person'] as const).map(type => (
              <TouchableOpacity
                key={type}
                style={[styles.modeCard, sessionType === type && styles.choiceCardActive]}
                onPress={() => setSessionType(type)}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={type === 'online' ? 'videocam-outline' : 'home-outline'}
                  size={18}
                  color={sessionType === type ? Colors.blue : Colors.textSecondary}
                />
                <Text style={[styles.choiceText, sessionType === type && styles.choiceTextActive]}>
                  {type === 'online' ? 'Online (Zoom)' : 'In-Person'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recurring Toggle */}
        <View style={styles.cardSection}>
          <TouchableOpacity
            style={[styles.choiceCard, isRecurring && styles.choiceCardActive]}
            onPress={() => setIsRecurring(!isRecurring)}
            activeOpacity={0.85}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons
                name={isRecurring ? 'checkbox' : 'square-outline'}
                size={20}
                color={isRecurring ? Colors.blue : Colors.textSecondary}
              />
              <Text style={[styles.choiceText, isRecurring && styles.choiceTextActive]}>Repeat Weekly (4 Sessions)</Text>
            </View>
          </TouchableOpacity>
          {isRecurring && (
            <Text style={styles.recurringHint}>
              Auto-books 4 weekly sessions on this day/time for seamless continuous learning.
            </Text>
          )}
        </View>

        {/* Special Instructions / Notes */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionTitle}>Topics or Specific Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="e.g. Please help with Grade 11 Physics Chapter 4..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            placeholderTextColor={Colors.textSecondary}
            textAlignVertical="top"
          />
        </View>

        {/* Price Breakdown Card */}
        {tutor && (
          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Session ({durationHours}h × {tutor.hourly_rate} ETB/hr)</Text>
              <Text style={styles.priceVal}>{sessionCost} ETB</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Service & Platform Fee (10%)</Text>
              <Text style={styles.priceVal}>{platformFee} ETB</Text>
            </View>
            <View style={[styles.priceRow, styles.totalDivider]}>
              <Text style={styles.totalLabel}>Total {isRecurring ? '(x4 Sessions)' : ''}</Text>
              <Text style={styles.totalVal}>{finalTotal} ETB</Text>
            </View>
          </View>
        )}
      </KeyboardAwareScreen>

      {/* Floating Action Button Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
        <Button
          title={`Confirm Booking · ${finalTotal} ETB`}
          onPress={handleConfirm}
          loading={loading}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  tutorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Spacing.md,
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tutorName: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  tutorSub: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  badgeText: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    color: Colors.green,
  },
  cardSection: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  calHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  calMonth: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  calNavBtn: {
    width: 32,
    height: 32,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calDayLabel: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.textSecondary,
    paddingVertical: 4,
  },
  calCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginVertical: 2,
  },
  calSelected: {
    backgroundColor: Colors.blue,
  },
  calToday: {
    borderWidth: 1.5,
    borderColor: Colors.blue,
  },
  calPast: {
    opacity: 0.25,
  },
  calDayNum: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.text,
  },
  calSelectedText: {
    color: Colors.white,
    fontWeight: Typography.bold,
  },
  calPastText: {
    color: Colors.textSecondary,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: Radius.lg,
    padding: 3,
    marginBottom: Spacing.md,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  segmentBtnActive: {
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentText: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
  },
  segmentTextActive: {
    color: Colors.blue,
    fontWeight: Typography.bold,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  slotChip: {
    width: '31%',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FAFAFA',
  },
  slotChipActive: {
    borderColor: Colors.blue,
    backgroundColor: '#EFF6FF',
  },
  slotText: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    color: Colors.text,
  },
  slotTextActive: {
    color: Colors.blue,
    fontWeight: Typography.bold,
  },
  choiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FAFAFA',
  },
  choiceCardActive: {
    borderColor: Colors.blue,
    backgroundColor: '#EFF6FF',
  },
  choiceText: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.text,
  },
  choiceTextActive: {
    color: Colors.blue,
    fontWeight: Typography.bold,
  },
  popularTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  popularTagText: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: '#D97706',
  },
  modeCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FAFAFA',
  },
  recurringHint: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    fontSize: Typography.sm,
    color: Colors.text,
    backgroundColor: '#FAFAFA',
    minHeight: 80,
  },
  priceCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    backgroundColor: '#EFF6FF',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  priceLabel: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  priceVal: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.text,
  },
  totalDivider: {
    borderTopWidth: 1,
    borderTopColor: '#93C5FD',
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.blue,
  },
  totalVal: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.blue,
  },
  bottomBar: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
});

