import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Linking, TextInput, RefreshControl, Modal, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { toast } from '@/utils/toast';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { format, addDays } from 'date-fns';
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
  const { 
    bookings, 
    loadBookings, 
    loadTutorBookings, 
    updateBookingStatus, 
    cancelBooking,
    rescheduleBooking 
  } = useBookingStore();
  const { 
    activeSession, 
    metrics, 
    loadActiveSession, 
    loadMetrics, 
    startSession, 
    signAgreement, 
    loadAgreement, 
    agreement 
  } = useTutorSessionStore();
  
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');
  const [loading, setLoading] = useState(true);
  const [contractModalVisible, setContractModalVisible] = useState(false);
  const [selectedBookingForContract, setSelectedBookingForContract] = useState<any>(null);

  // Reschedule state
  const [rescheduleBookingTarget, setRescheduleBookingTarget] = useState<any>(null);
  const [rescheduleDate, setRescheduleDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [rescheduleTime, setRescheduleTime] = useState('10:00 AM');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  // Cancel state
  const [cancelBookingTarget, setCancelBookingTarget] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState('Schedule conflict');
  const [cancelCustomNote, setCancelCustomNote] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  // Rating state
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
      toast.success('Session Started!', 'Timer is running. Student has been notified.');
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
      toast.success('Thank you!', 'Your rating has been submitted.');
    } catch (e: any) {
      showError(e, 'Rating Failed');
    } finally {
      setRatingLoading(false);
    }
  };

  const handleConfirmReschedule = async () => {
    if (!rescheduleBookingTarget || !user) return;
    setRescheduleLoading(true);
    try {
      const targetUserId = isTutor 
        ? rescheduleBookingTarget.student_id 
        : (rescheduleBookingTarget.tutor?.user?.id || rescheduleBookingTarget.tutor_id);

      await rescheduleBooking({
        bookingId: rescheduleBookingTarget.id,
        newDate: rescheduleDate,
        newTime: rescheduleTime,
        reason: rescheduleReason.trim() || undefined,
        targetUserId,
        initiatorName: user.full_name || (isTutor ? 'Your Tutor' : 'Your Student'),
      });

      toast.success('Reschedule Request Sent', `Session updated to ${rescheduleDate} at ${rescheduleTime}.`);
      setRescheduleBookingTarget(null);
      setRescheduleReason('');
    } catch (err) {
      showError(err, 'Reschedule Failed');
    } finally {
      setRescheduleLoading(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelBookingTarget || !user) return;
    setCancelLoading(true);
    try {
      const targetUserId = isTutor 
        ? cancelBookingTarget.student_id 
        : (cancelBookingTarget.tutor?.user?.id || cancelBookingTarget.tutor_id);

      const finalReason = cancelReason === 'Other' && cancelCustomNote.trim() 
        ? cancelCustomNote.trim() 
        : cancelReason;

      await cancelBooking(cancelBookingTarget.id, {
        reason: finalReason,
        targetUserId,
        initiatorName: user.full_name || (isTutor ? 'Your Tutor' : 'Your Student'),
      });

      toast.success('Session Cancelled', 'The session has been cancelled and notification sent.');
      setCancelBookingTarget(null);
      setCancelCustomNote('');
    } catch (err) {
      showError(err, 'Cancellation Failed');
    } finally {
      setCancelLoading(false);
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
                    <Text style={[bkgStyles.statusText, { color: b.status === 'confirmed' ? Colors.blue : b.status === 'pending' ? Colors.goldDark : Colors.textSecondary }]}>
                      {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                    </Text>
                  </View>
                </View>
                <View style={bkgStyles.details}>
                  <View style={bkgStyles.detailRow}>
                    <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
                    <Text style={bkgStyles.detail}>{format(new Date(b.session_date), 'MMM d, yyyy')} · {b.session_time}</Text>
                  </View>
                  <View style={bkgStyles.detailRow}>
                    <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
                    <Text style={bkgStyles.detail}>{b.duration_hours}h</Text>
                  </View>
                  <View style={bkgStyles.detailRow}>
                    <Ionicons name={b.session_type === 'online' ? 'videocam-outline' : 'home-outline'} size={14} color={Colors.textSecondary} />
                    <Text style={bkgStyles.detail}>{b.session_type === 'online' ? 'Online Video' : 'In-Person'}</Text>
                  </View>
                </View>

                {/* Contract Button */}
                <TouchableOpacity
                  style={bkgStyles.btnContract}
                  onPress={() => handleOpenContract(b)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="document-text-outline" size={14} color={Colors.blue} style={{ marginRight: 6 }} />
                  <Text style={bkgStyles.btnContractText}>Responsibility Contract</Text>
                </TouchableOpacity>

                {activeTab === 'upcoming' && (
                  <View style={bkgStyles.actions}>
                    {!isTutor ? (
                      <>
                        <TouchableOpacity 
                          style={bkgStyles.btnJoin} 
                          onPress={() => b.zoom_link && Linking.openURL(b.zoom_link).catch(() => toast.error('Link Error', 'Could not open this link. Please check if you have a supported app installed.'))} 
                          activeOpacity={0.85}
                        >
                          <Ionicons name="videocam" size={15} color={Colors.white} style={{ marginRight: 4 }} />
                          <Text style={bkgStyles.btnJoinText}>Join</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                          style={bkgStyles.btnReschedule} 
                          onPress={() => {
                            setRescheduleBookingTarget(b);
                            setRescheduleDate(format(addDays(new Date(b.session_date), 1), 'yyyy-MM-dd'));
                            setRescheduleTime(b.session_time || '10:00 AM');
                          }} 
                          activeOpacity={0.85}
                        >
                          <Ionicons name="repeat-outline" size={15} color={Colors.blue} style={{ marginRight: 4 }} />
                          <Text style={bkgStyles.btnRescheduleText}>Reschedule</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                          style={bkgStyles.btnCancel} 
                          onPress={() => setCancelBookingTarget(b)} 
                          activeOpacity={0.85}
                        >
                          <Ionicons name="close" size={15} color={Colors.red} style={{ marginRight: 2 }} />
                          <Text style={bkgStyles.btnCancelText}>Cancel</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>
                        {b.status === 'pending' ? (
                          <TouchableOpacity style={bkgStyles.btnJoin} onPress={() => updateBookingStatus(b.id, 'confirmed')} activeOpacity={0.85}>
                            <Ionicons name="checkmark-circle" size={15} color={Colors.white} style={{ marginRight: 4 }} />
                            <Text style={bkgStyles.btnJoinText}>Accept Request</Text>
                          </TouchableOpacity>
                        ) : (
                          <>
                            {!activeSession ? (
                              <TouchableOpacity style={[bkgStyles.btnJoin, { backgroundColor: Colors.green }]} onPress={() => handleStartLiveSession(b)} activeOpacity={0.85}>
                                <Ionicons name="play" size={15} color={Colors.white} style={{ marginRight: 4 }} />
                                <Text style={bkgStyles.btnJoinText}>Start Clock-In</Text>
                              </TouchableOpacity>
                            ) : null}
                            <TouchableOpacity style={bkgStyles.btnJoin} onPress={() => handleMarkCompleted(b.id)} activeOpacity={0.85}>
                              <Ionicons name="star" size={15} color={Colors.white} style={{ marginRight: 4 }} />
                              <Text style={bkgStyles.btnJoinText}>Mark Done</Text>
                            </TouchableOpacity>
                          </>
                        )}
                        <TouchableOpacity 
                          style={bkgStyles.btnReschedule} 
                          onPress={() => {
                            setRescheduleBookingTarget(b);
                            setRescheduleDate(format(addDays(new Date(b.session_date), 1), 'yyyy-MM-dd'));
                            setRescheduleTime(b.session_time || '10:00 AM');
                          }} 
                          activeOpacity={0.85}
                        >
                          <Ionicons name="repeat-outline" size={15} color={Colors.blue} style={{ marginRight: 4 }} />
                          <Text style={bkgStyles.btnRescheduleText}>Reschedule</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={bkgStyles.btnCancel} onPress={() => setCancelBookingTarget(b)} activeOpacity={0.85}>
                          <Ionicons name="close" size={15} color={Colors.red} style={{ marginRight: 2 }} />
                          <Text style={bkgStyles.btnCancelText}>Cancel</Text>
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
                    <Ionicons name="refresh-outline" size={16} color={Colors.white} style={{ marginRight: 6 }} />
                    <Text style={bkgStyles.btnJoinText}>Book Again</Text>
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

      {/* Reschedule Modal */}
      <Modal
        visible={!!rescheduleBookingTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setRescheduleBookingTarget(null)}
      >
        <View style={bkgStyles.modalOverlay}>
          <View style={bkgStyles.modalContent}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="calendar" size={20} color={Colors.blue} />
                <Text style={bkgStyles.modalTitle}>Reschedule Session</Text>
              </View>
              <TouchableOpacity onPress={() => setRescheduleBookingTarget(null)}>
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={bkgStyles.modalSub}>Propose a new date and time for this session.</Text>

            {/* Quick Date Presets */}
            <Text style={bkgStyles.fieldLabel}>New Date</Text>
            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md }}>
              {[
                { label: 'Tomorrow', date: format(addDays(new Date(), 1), 'yyyy-MM-dd') },
                { label: 'In 2 Days', date: format(addDays(new Date(), 2), 'yyyy-MM-dd') },
                { label: 'Next Week', date: format(addDays(new Date(), 7), 'yyyy-MM-dd') },
              ].map(p => (
                <TouchableOpacity
                  key={p.label}
                  style={[bkgStyles.presetChip, rescheduleDate === p.date && bkgStyles.presetChipActive]}
                  onPress={() => setRescheduleDate(p.date)}
                >
                  <Text style={[bkgStyles.presetChipText, rescheduleDate === p.date && bkgStyles.presetChipTextActive]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              value={rescheduleDate}
              onChangeText={setRescheduleDate}
              placeholder="YYYY-MM-DD"
              style={bkgStyles.inputField}
              placeholderTextColor={Colors.textSecondary}
            />

            {/* Time Selector */}
            <Text style={bkgStyles.fieldLabel}>Time Slot</Text>
            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md }}>
              {['10:00 AM', '02:00 PM', '04:00 PM', '06:00 PM'].map(t => (
                <TouchableOpacity
                  key={t}
                  style={[bkgStyles.presetChip, rescheduleTime === t && bkgStyles.presetChipActive]}
                  onPress={() => setRescheduleTime(t)}
                >
                  <Text style={[bkgStyles.presetChipText, rescheduleTime === t && bkgStyles.presetChipTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={bkgStyles.fieldLabel}>Note for {isTutor ? 'Student' : 'Tutor'} (Optional)</Text>
            <TextInput
              value={rescheduleReason}
              onChangeText={setRescheduleReason}
              placeholder="e.g. Schedule conflict with exams..."
              style={[bkgStyles.inputField, { height: 60, textAlignVertical: 'top' }]}
              multiline
              placeholderTextColor={Colors.textSecondary}
            />

            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md }}>
              <TouchableOpacity style={bkgStyles.btnCancel} onPress={() => setRescheduleBookingTarget(null)}>
                <Text style={bkgStyles.btnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[bkgStyles.btnJoin, rescheduleLoading && { opacity: 0.6 }]} 
                onPress={handleConfirmReschedule}
                disabled={rescheduleLoading}
              >
                <Text style={bkgStyles.btnJoinText}>{rescheduleLoading ? 'Updating...' : 'Confirm Reschedule'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Cancellation Modal */}
      <Modal
        visible={!!cancelBookingTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setCancelBookingTarget(null)}
      >
        <View style={bkgStyles.modalOverlay}>
          <View style={bkgStyles.modalContent}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="alert-circle" size={22} color={Colors.red} />
                <Text style={[bkgStyles.modalTitle, { color: Colors.red }]}>Cancel Session</Text>
              </View>
              <TouchableOpacity onPress={() => setCancelBookingTarget(null)}>
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={bkgStyles.modalSub}>
              Please select a reason. A cancellation alert will be sent to your partner.
            </Text>

            <View style={{ gap: Spacing.xs, marginBottom: Spacing.md }}>
              {[
                'Schedule conflict',
                'Health / Medical emergency',
                'No longer needed',
                'Other',
              ].map(reason => (
                <TouchableOpacity
                  key={reason}
                  style={[bkgStyles.reasonItem, cancelReason === reason && bkgStyles.reasonItemActive]}
                  onPress={() => setCancelReason(reason)}
                >
                  <Ionicons 
                    name={cancelReason === reason ? 'radio-button-on' : 'radio-button-off'} 
                    size={18} 
                    color={cancelReason === reason ? Colors.blue : Colors.textSecondary} 
                  />
                  <Text style={[bkgStyles.reasonText, cancelReason === reason && bkgStyles.reasonTextActive]}>
                    {reason}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {cancelReason === 'Other' && (
              <TextInput
                value={cancelCustomNote}
                onChangeText={setCancelCustomNote}
                placeholder="Explain reason..."
                style={[bkgStyles.inputField, { height: 60, textAlignVertical: 'top', marginBottom: Spacing.md }]}
                multiline
                placeholderTextColor={Colors.textSecondary}
              />
            )}

            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <TouchableOpacity style={bkgStyles.btnCancel} onPress={() => setCancelBookingTarget(null)}>
                <Text style={bkgStyles.btnCancelText}>Keep Session</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[bkgStyles.btnJoin, { backgroundColor: Colors.red }, cancelLoading && { opacity: 0.6 }]} 
                onPress={handleConfirmCancel}
                disabled={cancelLoading}
              >
                <Text style={bkgStyles.btnJoinText}>{cancelLoading ? 'Cancelling...' : 'Confirm Cancellation'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rating Modal */}
      {ratingBookingId && (
        <View style={bkgStyles.modalOverlay}>
          <View style={bkgStyles.modalContent}>
            <Text style={bkgStyles.modalTitle}>Rate This Session</Text>
            <Text style={bkgStyles.modalSub}>How was your experience?</Text>
            <View style={bkgStyles.starsRow}>
              {[1,2,3,4,5].map(star => (
                <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.8}>
                  <Ionicons 
                    name={star <= rating ? 'star' : 'star-outline'} 
                    size={36} 
                    color={star <= rating ? Colors.gold : Colors.border} 
                  />
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
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detail: { fontSize: Typography.sm, color: Colors.textSecondary },
  actions: { flexDirection: 'row', gap: Spacing.xs, alignItems: 'center' },
  btnContract: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: Radius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  btnContractText: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    color: Colors.blue,
  },
  btnJoin: { 
    flex: 1.2, 
    flexDirection: 'row',
    backgroundColor: Colors.blue, 
    borderRadius: 10, 
    paddingVertical: 10, 
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnJoinText: { color: Colors.white, fontWeight: Typography.semibold, fontSize: Typography.sm },
  btnReschedule: {
    flex: 1.2,
    flexDirection: 'row',
    backgroundColor: Colors.blueLight,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnRescheduleText: { color: Colors.blue, fontWeight: Typography.semibold, fontSize: Typography.sm },
  btnCancel: { 
    flex: 1, 
    flexDirection: 'row',
    backgroundColor: Colors.redLight, 
    borderRadius: 10, 
    paddingVertical: 10, 
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancelText: { color: Colors.red, fontWeight: Typography.semibold, fontSize: Typography.sm },
  modalOverlay: { 
    position: 'absolute', 
    top: 0, 
    bottom: 0, 
    left: 0, 
    right: 0, 
    backgroundColor: 'rgba(0,0,0,0.55)', 
    alignItems: 'center', 
    justifyContent: 'center', 
    zIndex: 999 
  },
  modalContent: { 
    backgroundColor: Colors.white, 
    borderRadius: Radius.xl, 
    padding: Spacing.xl, 
    width: '90%',
    maxWidth: 420,
  },
  modalTitle: { fontSize: Typography.xl, fontWeight: 'bold' },
  modalSub: { fontSize: Typography.xs, color: Colors.textSecondary, marginBottom: Spacing.md },
  fieldLabel: { fontSize: Typography.xs, fontWeight: Typography.bold, color: Colors.text, marginBottom: 4 },
  presetChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    backgroundColor: Colors.grayLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  presetChipActive: {
    backgroundColor: Colors.blue,
    borderColor: Colors.blue,
  },
  presetChipText: { fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: Typography.medium },
  presetChipTextActive: { color: Colors.white, fontWeight: Typography.bold },
  inputField: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    fontSize: Typography.sm,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reasonItemActive: {
    borderColor: Colors.blue,
    backgroundColor: '#F0F7FF',
  },
  reasonText: { fontSize: Typography.sm, color: Colors.text },
  reasonTextActive: { color: Colors.blue, fontWeight: Typography.semibold },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.md, marginBottom: Spacing.lg },
  ratingInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.lg, textAlignVertical: 'top', fontSize: Typography.sm },
});
