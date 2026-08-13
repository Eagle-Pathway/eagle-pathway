import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, Linking, TextInput, RefreshControl
} from 'react-native';
import { toast } from '@/utils/toast';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { format } from 'date-fns';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { EmptyState, ErrorState, Avatar } from '@/components/common';
import { ListSkeleton } from '@/components/LoadingSkeleton';
import { useAuthStore } from '@/store/authStore';
import { showError } from '@/utils/errorHandler';
import { useBookingStore } from '@/store/bookingStore';
import { useTutorSessionStore } from '@/store/tutorSessionStore';
import { SessionHoursLedger } from '@/components/tutors/SessionHoursLedger';
import { ActiveSessionTracker } from '@/components/tutors/ActiveSessionTracker';
import { TutorContractModal } from '@/components/tutors/TutorContractModal';
import { supabase } from '@/services/supabase';
import { withTimeout } from '@/utils/asyncUtils';
import { getUserRole } from '@/utils/role';

export function BookingsScreen({ hideHeader = false }: { hideHeader?: boolean }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { bookings, loadBookings, loadTutorBookings, updateBookingStatus, cancelBooking } = useBookingStore();
  const { activeSession, metrics, loadActiveSession, loadMetrics, startSession, signAgreement, loadAgreement, agreement } = useTutorSessionStore();
  
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');
  const [loading, setLoading] = useState(true);
  const [contractModalVisible, setContractModalVisible] = useState(false);
  const [selectedBookingForContract, setSelectedBookingForContract] = useState<any>(null);

  const [ratingBookingId, setRatingBookingId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingLoading, setRatingLoading] = useState(false);
  const [error, setError] = useState(false);

  const isTutor = getUserRole(user).toLowerCase() === 'tutor';

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(false);
    try {
      await withTimeout(Promise.all([
        isTutor ? loadTutorBookings(user.id) : loadBookings(user.id),
        loadActiveSession(user.id, isTutor),
        loadMetrics(user.id, isTutor),
      ]), 3500);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [user?.id, isTutor, loadBookings, loadTutorBookings, loadActiveSession, loadMetrics]);

  useEffect(() => { load(); }, [user?.id, isTutor]);

  const handleStartLiveSession = async (b: any) => {
    if (!user) return;
    try {
      const tutorHourlyRate = b.tutor?.hourly_rate || 250;
      await startSession({
        bookingId: b.id,
        tutorId: b.tutor_id,
        studentId: b.student_id,
        hourlyRate: tutorHourlyRate,
      });
      toast.success('Session Started! ⏱️', 'Timer is running. Student has been notified to confirm start.');
      loadActiveSession(user.id, isTutor);
    } catch (e: any) {
      showError(e, 'Could Not Start Session');
    }
  };

  const handleOpenContract = async (b: any) => {
    setSelectedBookingForContract(b);
    if (b.id) await loadAgreement(b.id);
    setContractModalVisible(true);
  };

  const handleSignContract = async () => {
    if (agreement?.id) {
      await signAgreement(agreement.id, isTutor ? 'tutor' : 'parent');
    }
  };

  const handleMarkCompleted = async (bookingId: string) => {
    await updateBookingStatus(bookingId, 'completed');
    setRatingBookingId(bookingId);
    setRating(0);
    setRatingComment('');
  };

  const handleSubmitRating = async () => {
    if (!ratingBookingId || rating === 0) {
      toast.warning('Please Select a Rating', 'Tap a star to rate this session.');
      return;
    }
    setRatingLoading(true);
    try {
      await supabase.from('booking_ratings').insert({
        booking_id: ratingBookingId,
        rating,
        comment: ratingComment.trim() || null,
      });
      setRatingBookingId(null);
      toast.success('Thank you! ⭐', 'Your rating has been submitted.');
    } catch (e: any) {
      showError(e, 'Rating Failed');
    } finally {
      setRatingLoading(false);
    }
  };

  const filtered = (bookings || []).filter(b => {
    if (activeTab === 'upcoming') return ['pending', 'confirmed'].includes(b.status);
    if (activeTab === 'past') return b.status === 'completed';
    return b.status === 'cancelled';
  });

  return (
    <SafeAreaView style={CommonStyles.screenBg} edges={[]}>
      {!hideHeader && (
        <View style={bkgStyles.header}>
          <Text style={bkgStyles.title}>{isTutor ? 'My Sessions' : 'My Bookings'}</Text>
        </View>
      )}

      {/* Accumulated Hours & Billing Ledger Widget */}
      <SessionHoursLedger metrics={metrics} isTutor={isTutor} />

      {/* Active Session Timer Widget */}
      {activeSession && user && (
        <View style={{ paddingHorizontal: Spacing.xl, marginTop: Spacing.sm }}>
          <ActiveSessionTracker
            session={activeSession}
            userId={user.id}
            isTutor={isTutor}
            onSessionUpdated={() => {
              loadActiveSession(user.id, isTutor);
              loadMetrics(user.id, isTutor);
            }}
          />
        </View>
      )}

      <View style={bkgStyles.tabs}>
        {(['upcoming', 'past', 'cancelled'] as const).map(tab => (
          <TouchableOpacity key={tab} style={[bkgStyles.tab, activeTab === tab && bkgStyles.tabActive]} onPress={() => setActiveTab(tab)} activeOpacity={0.8}>
            <Text style={[bkgStyles.tabText, activeTab === tab && bkgStyles.tabTextActive]}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading ? (
        <View style={{ flex: 1, paddingTop: Spacing.lg, paddingHorizontal: Spacing.xl }}>
          <ListSkeleton count={4} />
        </View>
      ) : error && (bookings || []).length === 0 ? (
        <ErrorState subtitle={`We couldn't load your ${isTutor ? 'sessions' : 'bookings'}. Check your connection and retry.`} onRetry={load} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title={`No ${activeTab} ${isTutor ? 'sessions' : 'bookings'}`}
          subtitle={isTutor ? "You don't have any sessions in this category yet." : "Book a session with a tutor to get started"}
          actionLabel={activeTab === 'upcoming' && !isTutor ? "Find Tutors" : undefined}
          onAction={activeTab === 'upcoming' && !isTutor ? () => router.push('/(tabs)/tutors') : undefined}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={b => b.id}
          renderItem={({ item: b }) => {
            const displayName = isTutor ? b.student?.full_name : b.tutor?.user?.full_name;
            const initials = displayName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || (isTutor ? 'S' : 'T');
            
            return (
              <View style={bkgStyles.card}>
                <View style={bkgStyles.cardTop}>
                  <Avatar initials={initials} size={44} borderRadius={13} />
                  <View style={{ flex: 1, marginLeft: Spacing.md }}>
                    <Text style={bkgStyles.name}>{displayName || 'User'}</Text>
                    <Text style={bkgStyles.sub}>{b.subject} · {b.session_type === 'online' ? 'Online' : 'In-Person'}</Text>
                  </View>
                  <View style={[bkgStyles.statusPill, { backgroundColor: b.status === 'confirmed' ? Colors.blueLight : b.status === 'pending' ? Colors.goldLight : Colors.grayLight }]}>
                    <Text style={[bkgStyles.statusText, { color: b.status === 'confirmed' ? Colors.blue : b.status === 'pending' ? Colors.goldDark : Colors.textSecondary }]}>{b.status.charAt(0).toUpperCase() + b.status.slice(1)}</Text>
                  </View>
                </View>
                <View style={bkgStyles.details}>
                  <Text style={bkgStyles.detail}>📅 {format(new Date(b.session_date), 'MMM d, yyyy')} · {b.session_time}</Text>
                  <Text style={bkgStyles.detail}>🕐 {b.duration_hours}h</Text>
                  <Text style={bkgStyles.detail}>{b.session_type === 'online' ? '🌐 Zoom' : '🏠 In-Person'}</Text>
                </View>

                {/* Contract Button */}
                <TouchableOpacity
                  style={bkgStyles.btnContract}
                  onPress={() => handleOpenContract(b)}
                  activeOpacity={0.8}
                >
                  <Text style={bkgStyles.btnContractText}>📄 Responsibility Contract</Text>
                </TouchableOpacity>

                {activeTab === 'upcoming' && (
                  <View style={bkgStyles.actions}>
                    {!isTutor ? (
                      <>
                        <TouchableOpacity style={bkgStyles.btnJoin} onPress={() => b.zoom_link && Linking.openURL(b.zoom_link).catch(() => toast.error('Link Error', 'Could not open this link. Please check if you have a supported app installed.'))} activeOpacity={0.85}>
                          <Text style={bkgStyles.btnJoinText}>Join Session</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={bkgStyles.btnCancel} onPress={() => Alert.alert('Cancel Booking?', 'Are you sure?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Yes, cancel', style: 'destructive', onPress: () => cancelBooking(b.id) }])} activeOpacity={0.85}>
                          <Text style={bkgStyles.btnCancelText}>Cancel</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>
                        {b.status === 'pending' ? (
                          <TouchableOpacity style={bkgStyles.btnJoin} onPress={() => updateBookingStatus(b.id, 'confirmed')} activeOpacity={0.85}>
                            <Text style={bkgStyles.btnJoinText}>Accept Request</Text>
                          </TouchableOpacity>
                        ) : (
                          <>
                            {!activeSession ? (
                              <TouchableOpacity style={[bkgStyles.btnJoin, { backgroundColor: Colors.green }]} onPress={() => handleStartLiveSession(b)} activeOpacity={0.85}>
                                <Text style={bkgStyles.btnJoinText}>⏱️ Start Clock-In</Text>
                              </TouchableOpacity>
                            ) : null}
                            <TouchableOpacity style={bkgStyles.btnJoin} onPress={() => handleMarkCompleted(b.id)} activeOpacity={0.85}>
                              <Text style={bkgStyles.btnJoinText}>Mark Completed ⭐</Text>
                            </TouchableOpacity>
                          </>
                        )}
                        <TouchableOpacity style={bkgStyles.btnCancel} onPress={() => updateBookingStatus(b.id, 'cancelled')} activeOpacity={0.85}>
                          <Text style={bkgStyles.btnCancelText}>Decline/Cancel</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                )}
                {activeTab === 'past' && b.status === 'completed' && !isTutor && (
                  <TouchableOpacity
                    style={[bkgStyles.btnJoin, { marginTop: Spacing.sm }]}
                    onPress={() => router.push({ pathname: '/booking', params: { tutorId: b.tutor_id } })}
                    activeOpacity={0.85}
                  >
                    <Text style={bkgStyles.btnJoinText}>🔄 Book Again</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
          contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.blue} />}
          initialNumToRender={8} maxToRenderPerBatch={8} windowSize={5} removeClippedSubviews={true}
        />
      )}

      {/* Contract Modal */}
      <TutorContractModal
        visible={contractModalVisible}
        onClose={() => setContractModalVisible(false)}
        onSign={handleSignContract}
        roleName={isTutor ? 'Tutor' : 'Parent / Student'}
        isSigned={isTutor ? !!agreement?.tutor_signed : !!agreement?.parent_signed}
        tutorName={selectedBookingForContract?.tutor?.user?.full_name || 'Tutor'}
        studentName={selectedBookingForContract?.student?.full_name || user?.full_name || 'Student'}
      />
      {/* Rating Modal */}
      {ratingBookingId && (
        <View style={bkgStyles.modalOverlay}>
          <View style={bkgStyles.modalContent}>
            <Text style={bkgStyles.modalTitle}>Rate This Session</Text>
            <Text style={bkgStyles.modalSub}>How was your experience?</Text>
            <View style={bkgStyles.starsRow}>
              {[1,2,3,4,5].map(star => (
                <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.8}>
                  <Text style={{ fontSize: 36 }}>{star <= rating ? '⭐' : '☆'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              value={ratingComment}
              onChangeText={setRatingComment}
              placeholder="Optional comment..."
              multiline
              numberOfLines={3}
              style={bkgStyles.ratingInput}
              placeholderTextColor={Colors.textSecondary}
            />
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <TouchableOpacity style={[bkgStyles.btnCancel, { flex: 1 }]} onPress={() => setRatingBookingId(null)} activeOpacity={0.8}>
                <Text style={bkgStyles.btnCancelText}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[bkgStyles.btnJoin, { flex: 2, opacity: ratingLoading ? 0.6 : 1 }]} onPress={handleSubmitRating} activeOpacity={0.8} disabled={ratingLoading}>
                <Text style={bkgStyles.btnJoinText}>{ratingLoading ? 'Submitting...' : 'Submit Rating'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const bkgStyles = StyleSheet.create({
  header: { padding: Spacing.xl, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontSize: Typography['3xl'], fontWeight: Typography.bold, color: Colors.text },
  tabs: { flexDirection: 'row', backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { flex: 1, padding: Spacing.md, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Colors.blue },
  tabText: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textSecondary },
  tabTextActive: { color: Colors.blue },
  card: { marginHorizontal: Spacing.xl, marginTop: Spacing.md, backgroundColor: Colors.card, borderRadius: Radius['2xl'], padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  name: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.text },
  sub: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: Typography.sm, fontWeight: Typography.semibold },
  details: { flexDirection: 'row', gap: Spacing.md, flexWrap: 'wrap', marginBottom: Spacing.md },
  detail: { fontSize: Typography.sm, color: Colors.textSecondary },
  actions: { flexDirection: 'row', gap: Spacing.sm },
  btnContract: {
    backgroundColor: '#F1F5F9',
    borderRadius: Radius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  btnContractText: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    color: Colors.blue,
  },
  btnJoin: { flex: 1, backgroundColor: Colors.blue, borderRadius: 10, padding: 10, alignItems: 'center' },
  btnJoinText: { color: Colors.white, fontWeight: Typography.semibold, fontSize: Typography.base },
  btnCancel: { flex: 1, backgroundColor: Colors.redLight, borderRadius: 10, padding: 10, alignItems: 'center' },
  btnCancelText: { color: Colors.red, fontWeight: Typography.semibold, fontSize: Typography.base },
  modalOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', zIndex: 999 },
  modalContent: { backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing.xl, width: '88%' },
  modalTitle: { fontSize: Typography['2xl'], fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  modalSub: { fontSize: Typography.sm, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.lg },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.md, marginBottom: Spacing.lg },
  ratingInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.lg, textAlignVertical: 'top', fontSize: Typography.sm },
});
