import { describe, it, expect } from 'vitest';
import { resolveNotificationRoute } from './deepLink';

describe('resolveNotificationRoute', () => {
  it('returns null if no data or type is provided', () => {
    expect(resolveNotificationRoute(null, null)).toBeNull();
    expect(resolveNotificationRoute(undefined, undefined)).toBeNull();
  });

  describe('Direct URLs', () => {
    it('resolves direct url path', () => {
      const route = resolveNotificationRoute({ url: '/(tabs)/chat' });
      expect(route).toEqual({ pathname: '/(tabs)/chat' });
    });

    it('resolves direct url with query params', () => {
      const route = resolveNotificationRoute({ url: '/scholarship-detail?scholarshipId=sch-123' });
      expect(route).toEqual({
        pathname: '/scholarship-detail',
        params: { scholarshipId: 'sch-123' },
      });
    });

    it('resolves path or pathname properties', () => {
      const route = resolveNotificationRoute({ path: '/documents' });
      expect(route).toEqual({ pathname: '/documents' });
    });
  });

  describe('Chat Notifications', () => {
    it('routes to specific chat conversation when conversation_id is present', () => {
      const route = resolveNotificationRoute({ conversation_id: 'conv-456' }, 'chat_message');
      expect(route).toEqual({
        pathname: '/chat/conv-456',
        params: { id: 'conv-456' },
      });
    });

    it('routes to chat tab when no conversation_id is provided', () => {
      const route = resolveNotificationRoute({}, 'chat_message');
      expect(route).toEqual({ pathname: '/(tabs)/chat' });
    });
  });

  describe('Scholarship Notifications', () => {
    it('routes to scholarship detail when scholarship_id is present', () => {
      const route = resolveNotificationRoute({ scholarship_id: 'scholar-789' }, 'scholarship_alert');
      expect(route).toEqual({
        pathname: '/scholarship-detail',
        params: { scholarshipId: 'scholar-789' },
      });
    });

    it('routes to scholarships tab when no ID is provided', () => {
      const route = resolveNotificationRoute({}, 'scholarship_alert');
      expect(route).toEqual({ pathname: '/(tabs)/scholarships' });
    });
  });

  describe('Tutor Job Notifications', () => {
    it('routes to tutor job detail when job_id is present', () => {
      const route = resolveNotificationRoute({ job_id: 'job-999' }, 'tutor_job');
      expect(route).toEqual({
        pathname: '/tutor-job-detail',
        params: { jobId: 'job-999' },
      });
    });

    it('routes to tutor job feed when no job_id is provided', () => {
      const route = resolveNotificationRoute({}, 'tutor_job');
      expect(route).toEqual({ pathname: '/tutor-jobs' });
    });
  });

  describe('Booking & Session Notifications', () => {
    it('routes to bookings tab for student/tutor', () => {
      const route = resolveNotificationRoute({ booking_id: 'b-100' }, 'booking_confirmed');
      expect(route).toEqual({
        pathname: '/(tabs)/bookings',
        params: { bookingId: 'b-100' },
      });
    });

    it('routes to children sessions when is_parent is true', () => {
      const route = resolveNotificationRoute({ is_parent: true }, 'session_reminder');
      expect(route).toEqual({ pathname: '/children-sessions' });
    });
  });

  describe('Application Tracker & SOP Reviews', () => {
    it('routes to tracker with applicationId', () => {
      const route = resolveNotificationRoute({ application_id: 'app-555' }, 'sop_reviewed');
      expect(route).toEqual({
        pathname: '/tracker',
        params: { applicationId: 'app-555' },
      });
    });

    it('routes to tracker root when no application_id is provided', () => {
      const route = resolveNotificationRoute({}, 'application_update');
      expect(route).toEqual({ pathname: '/tracker' });
    });
  });

  describe('Documents & Payment Notifications', () => {
    it('routes document approval to /documents', () => {
      const route = resolveNotificationRoute({}, 'document_approved');
      expect(route).toEqual({ pathname: '/documents' });
    });

    it('routes service request / payments to /service-request', () => {
      const route = resolveNotificationRoute({}, 'payment_verified');
      expect(route).toEqual({ pathname: '/service-request' });
    });
  });
});
