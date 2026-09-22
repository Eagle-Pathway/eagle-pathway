export interface DeepLinkRoute {
  pathname: string;
  params?: Record<string, string>;
}

export function resolveNotificationRoute(
  data?: Record<string, any> | null,
  fallbackType?: string | null
): DeepLinkRoute | null {
  if (!data && !fallbackType) return null;

  const payload = data || {};
  const notifType = (payload.type || fallbackType || '').toLowerCase();

  // 1. Explicit Direct URL / Path
  const directUrl = payload.url || payload.path || payload.pathname;
  if (typeof directUrl === 'string' && directUrl.trim()) {
    const cleanUrl = directUrl.trim();
    // Parse query params if present (e.g. /scholarship-detail?scholarshipId=123)
    if (cleanUrl.includes('?')) {
      const [pathname, queryString] = cleanUrl.split('?');
      const params: Record<string, string> = {};
      const pairs = queryString.split('&');
      for (const pair of pairs) {
        const [k, v] = pair.split('=');
        if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || '');
      }
      return { pathname, params };
    }
    return { pathname: cleanUrl };
  }

  // 2. Chat Notifications
  const conversationId = payload.conversation_id || payload.chat_id || payload.channel_id;
  if (notifType.includes('chat') || notifType.includes('message') || conversationId) {
    if (conversationId) {
      return { pathname: `/chat/${conversationId}`, params: { id: String(conversationId) } };
    }
    return { pathname: '/(tabs)/chat' };
  }

  // 3. Scholarship Notifications
  const scholarshipId = payload.scholarship_id || payload.scholarshipId;
  if (notifType.includes('scholarship') || scholarshipId) {
    if (scholarshipId) {
      return {
        pathname: '/scholarship-detail',
        params: { scholarshipId: String(scholarshipId) },
      };
    }
    return { pathname: '/(tabs)/scholarships' };
  }

  // 4. Tutor Jobs & Applications
  const jobId = payload.job_id || payload.jobId || payload.application_id;
  if (notifType.includes('tutor_job') || notifType.includes('job_application') || notifType.includes('tutor_job_feed')) {
    if (jobId) {
      return {
        pathname: '/tutor-job-detail',
        params: { jobId: String(jobId) },
      };
    }
    return { pathname: '/tutor-jobs' };
  }

  // 5. Booking & Tutoring Sessions
  const bookingId = payload.booking_id || payload.bookingId || payload.session_id;
  if (
    notifType.includes('booking') ||
    notifType.includes('session') ||
    notifType === 'booking_confirmed' ||
    notifType === 'session_reminder'
  ) {
    if (payload.is_parent) {
      return { pathname: '/children-sessions' };
    }
    return { pathname: '/(tabs)/bookings', params: bookingId ? { bookingId: String(bookingId) } : undefined };
  }

  // 6. Application Tracker, SOP Reviews & Offers
  const applicationId = payload.application_id || payload.applicationId;
  if (
    notifType.includes('application') ||
    notifType.includes('sop') ||
    notifType.includes('offer') ||
    notifType === 'application_update' ||
    notifType === 'sop_reviewed' ||
    notifType === 'offer_received'
  ) {
    if (applicationId) {
      return {
        pathname: '/tracker',
        params: { applicationId: String(applicationId) },
      };
    }
    return { pathname: '/tracker' };
  }

  // 7. Documents & Verification
  if (notifType.includes('document') || notifType === 'document_approved' || notifType === 'document_rejected') {
    return { pathname: '/documents' };
  }

  // 8. Payments & Service Requests
  if (notifType.includes('payment') || notifType.includes('service_request') || notifType.includes('package')) {
    if (payload.package_id) {
      return { pathname: '/packages' };
    }
    return { pathname: '/service-request' };
  }

  // 9. Recommendations & Success Stories
  if (notifType.includes('recommendation')) {
    return { pathname: '/recommendations' };
  }
  if (notifType.includes('success_story') || notifType.includes('story')) {
    return { pathname: '/success-stories' };
  }

  // 10. Default fallback
  return { pathname: '/notifications' };
}
