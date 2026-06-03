import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, CommonStyles } from '@/utils/theme';
import { useAuthStore } from '@/store/authStore';
import { scholarshipsService } from '@/services/scholarships';
import { tutorsService } from '@/services/tutors';
import { syncDeadlineReminders } from '@/services/deadlineReminders';
import { getApplicationDeadlines } from '@/utils/deadlines';

// Specialized Domain Stores
import { useScholarshipStore } from '@/store/scholarshipStore';
import { useBookingStore } from '@/store/bookingStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useTaskStore } from '@/store/taskStore';
import { useFinanceStore } from '@/store/financeStore';
import { useParentStore } from '@/store/parentStore';

// Role-specific home components
import { StudentHome } from './components/StudentHome';
import { TutorHome } from './components/TutorHome';
import { ParentHome } from './components/ParentHome';

export default function HomeScreen() {
  const { user } = useAuthStore();
  
  // Scholarship Store
  const { 
    applications, recommendedScholarships, loadApplications, loadRecommendations 
  } = useScholarshipStore();
  
  // Booking Store
  const { 
    bookings, tutorProfile, loadBookings, loadTutorBookings, updateBookingStatus 
  } = useBookingStore();
  
  // Notification Store
  const { 
    unreadCount, loadNotifications 
  } = useNotificationStore();
  
  // Task Store
  const { 
    tasks, loadTasks, toggleTask 
  } = useTaskStore();
  
  // Finance Store
  const { 
    tutorPayouts, isLoadingPayouts, loadTutorPayouts, submitPayoutRequest 
  } = useFinanceStore();
  
  // Parent Store
  const { 
    linkedStudents, linkedStudentApplications, loadLinkedStudents, loadLinkedStudentApplications 
  } = useParentStore();

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [homeCounts, setHomeCounts] = useState({ openScholarships: 0, availableTutors: 0 });

  const activeRole = (user?.active_role || user?.roles?.[0] || 'student').toLowerCase();
  const isTutor = activeRole === 'tutor';
  const isParent = activeRole === 'parent';

  const load = async () => {
    if (!user) return;
    const dataTasks = [loadNotifications(user.id)];
    
    if (isTutor) {
      dataTasks.push(loadTutorBookings(user.id));
      dataTasks.push(loadTutorPayouts(user.id));
    } else if (isParent) {
      dataTasks.push(loadLinkedStudents(user.id));
      dataTasks.push(loadLinkedStudentApplications(user.id));
    } else {
      dataTasks.push(loadBookings(user.id));
      dataTasks.push(loadApplications(user.id));
      dataTasks.push(loadTasks(user.id));
      dataTasks.push(loadRecommendations(user.id));
      // Live counts for the home quick-cards (cheap count-only queries).
      dataTasks.push(
        (async () => {
          try {
            const [openScholarships, availableTutors] = await Promise.all([
              scholarshipsService.getOpenScholarshipsCount(),
              tutorsService.getVerifiedTutorsCount(),
            ]);
            setHomeCounts({ openScholarships, availableTutors });
          } catch {
            // Non-critical; leave whatever counts we have.
          }
        })(),
      );
    }

    await Promise.all(dataTasks);
  };

  useEffect(() => { 
    const init = async () => {
      setLoading(true);
      await load();
      setLoading(false);
    };
    init();
  }, [user?.id, activeRole]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  // Keep local deadline reminders in sync with the student's active applications.
  useEffect(() => {
    if (isTutor || isParent) return;
    syncDeadlineReminders(getApplicationDeadlines(applications));
  }, [applications, isTutor, isParent]);

  if (!user) {
    return (
      <SafeAreaView style={CommonStyles.screenBg} edges={['top']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Colors.white} />
        </View>
      </SafeAreaView>
    );
  }

  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'EP';
  const firstName = user?.full_name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (isParent) {
    return (
      <ParentHome 
        user={user}
        firstName={firstName}
        greeting={greeting}
        initials={initials}
        unreadCount={unreadCount}
        refreshing={refreshing}
        onRefresh={onRefresh}
        linkedStudents={linkedStudents}
        linkedStudentApplications={linkedStudentApplications}
        loading={loading}
      />
    );
  }

  if (isTutor) {
    return (
      <TutorHome 
        user={user}
        firstName={firstName}
        greeting={greeting}
        initials={initials}
        unreadCount={unreadCount}
        refreshing={refreshing}
        onRefresh={onRefresh}
        bookings={bookings}
        tutorProfile={tutorProfile}
        tutorPayouts={tutorPayouts}
        isLoadingPayouts={isLoadingPayouts}
        updateBookingStatus={updateBookingStatus}
        submitPayoutRequest={submitPayoutRequest}
        loading={loading}
      />
    );
  }

  return (
    <StudentHome 
      user={user}
      firstName={firstName}
      greeting={greeting}
      initials={initials}
      unreadCount={unreadCount}
      refreshing={refreshing}
      onRefresh={onRefresh}
      bookings={bookings}
      applications={applications}
      tasks={tasks}
      recommendedScholarships={recommendedScholarships}
      toggleTask={toggleTask}
      openScholarshipsCount={homeCounts.openScholarships}
      availableTutorsCount={homeCounts.availableTutors}
      loading={loading}
    />
  );
}
