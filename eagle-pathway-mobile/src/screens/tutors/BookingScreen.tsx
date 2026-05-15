import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { format, addDays, startOfMonth, getDaysInMonth, getDay } from 'date-fns';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { Button, Avatar } from '@/components/common';
import { tutorsService } from '@/services/tutors';
import { useAuthStore } from '@/store/authStore';
import { useBookingStore } from '@/store/bookingStore';
import { Tutor } from '@/types';

const TIME_SLOTS = ['9:00 AM','10:00 AM','11:00 AM','12:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM','7:00 PM'];
const PLATFORM_FEE_RATE = 0.10;

export default function BookingScreen() {
  const { tutorId } = useLocalSearchParams<{ tutorId: string }>();
  const { user } = useAuthStore();
  const { loadBookings } = useBookingStore();
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(addDays(new Date(), 1));
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [sessionType, setSessionType] = useState<'online' | 'in_person'>('online');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (tutorId) tutorsService.getTutorById(tutorId).then(setTutor).catch(console.error);
  }, [tutorId]);

  const platformFee = tutor ? Math.round(tutor.hourly_rate * PLATFORM_FEE_RATE) : 0;
  const total = tutor ? tutor.hourly_rate + platformFee : 0;

  const handleConfirm = async () => {
    if (!selectedTime) return Alert.alert('Select Time', 'Please choose a time slot');
    if (!user || !tutor) return;

    setLoading(true);
    try {
      await tutorsService.createBooking({
        studentId: user.id,
        tutorId: tutor.id,
        subject: tutor.subjects?.[0] || 'General Tutoring',
        sessionDate: format(selectedDate, 'yyyy-MM-dd'),
        sessionTime: selectedTime,
        durationHours: 1,
        sessionType,
        notes: notes.trim() || undefined,
        totalAmount: total,
        platformFee,
      });
      await loadBookings(user.id);
      Alert.alert('Booking Confirmed! 🎉', `Your session with ${tutor.user?.full_name} is confirmed.`, [
        { text: 'View Bookings', onPress: () => router.push('/(tabs)/bookings') },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  // Calendar helpers
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDayOfWeek = getDay(startOfMonth(currentMonth));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const initials = tutor?.user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'T';

  return (
    <SafeAreaView style={[CommonStyles.flex1, { backgroundColor: Colors.bg }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book a Session</Text>
      </View>

      {tutor && (
        <View style={styles.tutorRow}>
          <Avatar initials={initials} size={44} borderRadius={13} color={Colors.gold} />
          <View style={{ flex: 1, marginLeft: Spacing.md }}>
            <Text style={styles.tutorName}>{tutor.user?.full_name}</Text>
            <Text style={styles.tutorSub}>{tutor.subjects?.[0] || 'General'} · ETB {tutor.hourly_rate}/hr</Text>
          </View>
          <View style={styles.availablePill}><Text style={styles.availableText}>Available</Text></View>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Calendar */}
        <View style={styles.section}>
          <View style={styles.calHeader}>
            <Text style={styles.calMonth}>{format(currentMonth, 'MMMM yyyy')}</Text>
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <TouchableOpacity style={styles.calNav} onPress={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))} activeOpacity={0.8}>
                <Text style={styles.calNavText}>‹</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.calNav} onPress={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))} activeOpacity={0.8}>
                <Text style={styles.calNavText}>›</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.calGrid}>
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
              <Text key={d} style={styles.calDayLabel}>{d}</Text>
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
                  key={day}
                  style={[styles.calCell, isSelected && styles.calSelected, isToday && !isSelected && styles.calToday, isPast && styles.calPast]}
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

        {/* Time Slots */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Available Slots · {format(selectedDate, 'MMM d')}</Text>
          <View style={styles.timeGrid}>
            {TIME_SLOTS.map(time => (
              <TouchableOpacity
                key={time}
                style={[styles.timeChip, selectedTime === time && styles.timeChipSelected]}
                onPress={() => setSelectedTime(time)}
                activeOpacity={0.8}
              >
                <Text style={[styles.timeChipText, selectedTime === time && styles.timeChipTextSelected]}>{time}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Session Type */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Session Type</Text>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            {(['online', 'in_person'] as const).map(type => (
              <TouchableOpacity
                key={type}
                style={[styles.typeChip, sessionType === type && styles.timeChipSelected, { flex: 1 }]}
                onPress={() => setSessionType(type)}
                activeOpacity={0.8}
              >
                <Text style={[styles.timeChipText, sessionType === type && styles.timeChipTextSelected]}>
                  {type === 'online' ? '🌐 Online (Zoom)' : '🏠 In-Person'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Session Notes (optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Topics to focus on, specific questions..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            placeholderTextColor={Colors.textSecondary}
            textAlignVertical="top"
          />
        </View>

        {/* Price summary */}
        {tutor && (
          <View style={styles.priceSummary}>
            <View style={styles.priceRow}><Text style={styles.priceLabel}>Session (1 hour)</Text><Text style={styles.priceVal}>ETB {tutor.hourly_rate}</Text></View>
            <View style={styles.priceRow}><Text style={styles.priceLabel}>Platform fee</Text><Text style={styles.priceVal}>ETB {platformFee}</Text></View>
            <View style={[styles.priceRow, styles.totalRow]}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalVal}>ETB {total}</Text></View>
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <Button
          title={`Confirm Booking · ETB ${total}`}
          onPress={handleConfirm}
          loading={loading}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.xl, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 36, height: 36, backgroundColor: Colors.grayLight, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 20, color: Colors.text },
  headerTitle: { fontSize: Typography['3xl'], fontWeight: Typography.bold, color: Colors.text },
  tutorRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.xl, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tutorName: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.text },
  tutorSub: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  availablePill: { backgroundColor: Colors.greenLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  availableText: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.green },
  section: { padding: Spacing.xl },
  sectionLabel: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.text, marginBottom: Spacing.md },
  calHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  calMonth: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.text },
  calNav: { width: 28, height: 28, backgroundColor: Colors.grayLight, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  calNavText: { fontSize: 18, color: Colors.text },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calDayLabel: { width: '14.28%', textAlign: 'center', fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textSecondary, paddingVertical: 4 },
  calCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 10, marginVertical: 2 },
  calSelected: { backgroundColor: Colors.blue },
  calToday: { borderWidth: 1.5, borderColor: Colors.blue },
  calPast: { opacity: 0.3 },
  calDayNum: { fontSize: Typography.md, fontWeight: Typography.medium, color: Colors.text },
  calSelectedText: { color: Colors.white, fontWeight: Typography.bold },
  calPastText: { color: Colors.textSecondary },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  timeChip: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#fafafa' },
  timeChipSelected: { borderColor: Colors.blue, backgroundColor: Colors.blueLight },
  timeChipText: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.text },
  timeChipTextSelected: { color: Colors.blue },
  typeChip: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10, paddingVertical: 12, alignItems: 'center', backgroundColor: '#fafafa' },
  notesInput: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.md, fontSize: Typography.md, color: Colors.text, backgroundColor: '#fafafa', height: 80 },
  priceSummary: { marginHorizontal: Spacing.xl, backgroundColor: Colors.blueLight, borderRadius: Radius.xl, padding: Spacing.lg },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  priceLabel: { fontSize: Typography.base, color: Colors.textSecondary },
  priceVal: { fontSize: Typography.base, color: Colors.textSecondary },
  totalRow: { borderTopWidth: 1, borderTopColor: '#c7d7f7', paddingTop: Spacing.sm, marginBottom: 0 },
  totalLabel: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.blue },
  totalVal: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.blue },
  bottomBar: { padding: Spacing.lg, backgroundColor: Colors.card, borderTopWidth: 1, borderTopColor: Colors.border },
});
