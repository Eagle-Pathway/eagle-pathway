import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { Button } from '@/components/common';
import { KeyboardAwareScreen } from '@/components/KeyboardAwareScreen';
import { toast } from '@/utils/toast';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/services/supabase';
import { tutorsService } from '@/services/tutors';
import { Tutor } from '@/types';

const DEFAULT_SUBJECTS = [
  'Math', 'Physics', 'Chemistry', 'Biology', 'English', 'Amharic',
  'History', 'Geography', 'Civics', 'Economics', 'Business', 'ICT/Computer',
  'SAT', 'IELTS', 'TOEFL', 'French', 'Arabic', 'Chinese',
  'Music', 'Art', 'General Tutoring'
];

const DAYS_LIST = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function RequestTutorScreen() {
  const { tutorId } = useLocalSearchParams<{ tutorId?: string }>();
  const { user } = useAuthStore();
  const [targetTutor, setTargetTutor] = useState<Tutor | null>(null);

  const [place, setPlace] = useState('');
  const [grade, setGrade] = useState('');
  const [mode, setMode] = useState<'In-person' | 'Online' | 'Hybrid'>('Hybrid');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [customSubject, setCustomSubject] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', 'Wed', 'Fri']);
  const [sessionHours, setSessionHours] = useState('2');
  const [startTime, setStartTime] = useState('4 LT');
  const [hourlyRate, setHourlyRate] = useState('500');
  const [phone, setPhone] = useState(user?.phone || '');
  const [requesterName, setRequesterName] = useState(user?.full_name || '');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tutorId) {
      tutorsService.getTutorById(tutorId).then(t => {
        if (t) {
          setTargetTutor(t);
          if (t.hourly_rate) setHourlyRate(t.hourly_rate.toString());
          if (t.subjects && t.subjects.length > 0) {
            setSelectedSubjects(t.subjects);
          }
        }
      }).catch(console.error);
    }
  }, [tutorId]);

  const toggleSubject = (sName: string) => {
    setSelectedSubjects(prev => 
      prev.includes(sName) ? prev.filter(x => x !== sName) : [...prev, sName]
    );
  };

  const handleAddCustomSubject = () => {
    const trimmed = customSubject.trim();
    if (!trimmed) return;
    if (!selectedSubjects.includes(trimmed)) {
      setSelectedSubjects(prev => [...prev, trimmed]);
    }
    setCustomSubject('');
  };

  const toggleDay = (d: string) => {
    setSelectedDays(prev => 
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    );
  };

  const handleSubmit = async () => {
    if (!place.trim()) return toast.warning('Location Required', 'Please enter your area or location (e.g. Kality, Bole, etc.)');
    if (!grade.trim()) return toast.warning('Grade Required', 'Please enter the student grade level (e.g. Grade 11)');
    if (selectedSubjects.length === 0) return toast.warning('Subject Required', 'Please select at least one subject');
    if (!phone.trim()) return toast.warning('Phone Required', 'Please enter your phone number so our team can confirm your request.');

    setLoading(true);
    try {
      const daysCount = selectedDays.length > 0 ? selectedDays.length : 3;
      const combinedNotes = selectedDays.length > 0
        ? (notes ? `${notes} | Preferred Days: ${selectedDays.join(', ')}` : `Preferred Days: ${selectedDays.join(', ')}`)
        : notes.trim() || null;

      const { error } = await supabase.from('tutor_job_posts').insert({
        posted_by: user?.id,
        requester_name: requesterName.trim() || user?.full_name || 'Parent',
        requester_phone: phone.trim(),
        place: place.trim(),
        grade: grade.trim(),
        mode,
        subjects: selectedSubjects,
        session_hours: parseFloat(sessionHours) || 2,
        days_per_week: daysCount,
        start_time: startTime.trim() || '4 LT',
        hourly_rate: parseFloat(hourlyRate) || 500,
        tutor_id: targetTutor?.id || null,
        notes: combinedNotes,
        status: 'submitted',
      });

      if (error) throw error;

      toast.success(
        'Request Submitted! 🎉',
        'Our Eagle Tutorials team will call you shortly to verify your request and connect you with the best tutor!'
      );
      router.back();
    } catch (err: any) {
      toast.error('Submission Failed', err.message || 'Could not submit your request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={CommonStyles.screenBg} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {targetTutor ? `Request ${targetTutor.user?.full_name || 'Tutor'}` : 'Request a Tutor'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAwareScreen>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {targetTutor ? (
            <View style={styles.directCard}>
              <Ionicons name="person-circle" size={36} color={Colors.blue} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.directTitle}>Direct Request to {targetTutor.user?.full_name}</Text>
                <Text style={styles.directSub}>{targetTutor.user?.email} · {targetTutor.hourly_rate} ETB/hr</Text>
              </View>
            </View>
          ) : (
            <View style={styles.bannerCard}>
              <Ionicons name="sparkles" size={24} color={Colors.gold} />
              <Text style={styles.bannerText}>
                Tell us your schedule and subjects. Our team will verify your request and match you with the top verified tutor!
              </Text>
            </View>
          )}

          {/* Contact Details */}
          <Text style={styles.sectionHeader}>1. Contact Information</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Your Phone Number (For Verification Call) *</Text>
            <TextInput
              style={styles.input}
              placeholder="0911223344"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholderTextColor={Colors.textSecondary}
            />

            <Text style={[styles.label, { marginTop: 12 }]}>Your Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Parent / Student Name"
              value={requesterName}
              onChangeText={setRequesterName}
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          {/* Location & Grade */}
          <Text style={styles.sectionHeader}>2. Place & Grade Level</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Place / Neighborhood *</Text>
            <TextInput
              style={styles.input}
              placeholder="E.g., Kality Maremiya/Gebriel, Bole, CMC"
              value={place}
              onChangeText={setPlace}
              placeholderTextColor={Colors.textSecondary}
            />

            <Text style={[styles.label, { marginTop: 12 }]}>Student Grade Level *</Text>
            <TextInput
              style={styles.input}
              placeholder="E.g., Grade 11 Level, Grade 9, University"
              value={grade}
              onChangeText={setGrade}
              placeholderTextColor={Colors.textSecondary}
            />

            <Text style={[styles.label, { marginTop: 12 }]}>Delivery Mode</Text>
            <View style={styles.modeRow}>
              {(['Hybrid', 'In-person', 'Online'] as const).map(m => (
                <TouchableOpacity
                  key={m}
                  style={[styles.modeBtn, mode === m && styles.modeBtnActive]}
                  onPress={() => setMode(m)}
                >
                  <Text style={[styles.modeBtnText, mode === m && styles.modeBtnTextActive]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Schedule & Rate */}
          <Text style={styles.sectionHeader}>3. Schedule & Days of Week</Text>
          <View style={styles.card}>
            <Text style={styles.label}>
              Select Days of Week {selectedDays.length > 0 && `(${selectedDays.length} days/week)`}
            </Text>
            <View style={styles.daysRow}>
              {DAYS_LIST.map(d => {
                const isSelected = selectedDays.includes(d);
                return (
                  <TouchableOpacity
                    key={d}
                    style={[styles.dayBtn, isSelected && styles.dayBtnActive]}
                    onPress={() => toggleDay(d)}
                  >
                    <Text style={[styles.dayBtnText, isSelected && styles.dayBtnTextActive]}>{d}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={[styles.row, { marginTop: 14 }]}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.label}>Hours / Day</Text>
                <TextInput
                  style={styles.input}
                  value={sessionHours}
                  onChangeText={setSessionHours}
                  keyboardType="numeric"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.label}>Start Time</Text>
                <TextInput
                  style={styles.input}
                  placeholder="4 LT or 10:00 AM"
                  value={startTime}
                  onChangeText={setStartTime}
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
            </View>

            <View style={{ marginTop: 12 }}>
              <Text style={styles.label}>Hourly Budget / Rate (ETB) *</Text>
              <TextInput
                style={styles.input}
                value={hourlyRate}
                onChangeText={setHourlyRate}
                keyboardType="numeric"
                placeholderTextColor={Colors.textSecondary}
              />
            </View>
          </View>

          {/* Subjects */}
          <Text style={styles.sectionHeader}>4. Subjects Needed *</Text>
          <View style={styles.card}>
            {/* Custom Subject Write-in */}
            <View style={styles.customSubRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginRight: 8 }]}
                placeholder="Write custom subject (e.g. Calculus 2)..."
                value={customSubject}
                onChangeText={setCustomSubject}
                onSubmitEditing={handleAddCustomSubject}
                placeholderTextColor={Colors.textSecondary}
              />
              <TouchableOpacity style={styles.addBtn} onPress={handleAddCustomSubject}>
                <Ionicons name="add" size={18} color={Colors.white} />
                <Text style={styles.addBtnText}>Add</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.pillContainer, { marginTop: 10 }]}>
              {/* Selected / Custom Subjects */}
              {selectedSubjects.map(sName => (
                <TouchableOpacity
                  key={sName}
                  style={[styles.pill, styles.pillActive]}
                  onPress={() => toggleSubject(sName)}
                >
                  <Text style={[styles.pillText, styles.pillTextActive]}>{sName} ✕</Text>
                </TouchableOpacity>
              ))}

              {/* Unselected Default Subjects */}
              {DEFAULT_SUBJECTS.filter(s => !selectedSubjects.includes(s)).map(sName => (
                <TouchableOpacity
                  key={sName}
                  style={styles.pill}
                  onPress={() => toggleSubject(sName)}
                >
                  <Text style={styles.pillText}>+ {sName}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Additional Notes */}
          <Text style={styles.sectionHeader}>5. Additional Notes</Text>
          <View style={styles.card}>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Any specific focus topics, student preferences, or details..."
              value={notes}
              onChangeText={setNotes}
              multiline
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          {/* Submit Button */}
          <Button
            title={loading ? 'Submitting Request...' : 'Submit Tutor Request'}
            onPress={handleSubmit}
            disabled={loading}
            style={{ marginTop: Spacing.xl, marginBottom: Spacing['3xl'] }}
          />
        </ScrollView>
      </KeyboardAwareScreen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  content: {
    padding: Spacing.lg,
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.blueLight,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.blue,
  },
  bannerText: {
    fontSize: Typography.sm,
    color: Colors.text,
    flex: 1,
    marginLeft: Spacing.sm,
    fontWeight: Typography.semibold,
  },
  directCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.goldLight,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  directTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.goldDark,
  },
  directSub: {
    fontSize: Typography.sm,
    color: Colors.goldDark,
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.base,
    color: Colors.text,
    backgroundColor: Colors.grayLight,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.grayLight,
  },
  modeBtnActive: {
    backgroundColor: Colors.blue,
    borderColor: Colors.blue,
  },
  modeBtnText: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.textSecondary,
  },
  modeBtnTextActive: {
    color: Colors.white,
  },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: 4,
  },
  dayBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.grayLight,
  },
  dayBtnActive: {
    backgroundColor: Colors.green,
    borderColor: Colors.green,
  },
  dayBtnText: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.textSecondary,
  },
  dayBtnTextActive: {
    color: Colors.white,
  },
  customSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.blue,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  addBtnText: {
    color: Colors.white,
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    marginLeft: 2,
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.grayLight,
  },
  pillActive: {
    backgroundColor: Colors.blue,
    borderColor: Colors.blue,
  },
  pillText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.semibold,
  },
  pillTextActive: {
    color: Colors.white,
  },
});
