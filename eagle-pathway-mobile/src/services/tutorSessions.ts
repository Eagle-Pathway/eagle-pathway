import { supabase } from './supabase';
import type { TutorAgreement, TutorSessionLog } from '../types';

export const DEFAULT_RESPONSIBILITIES_TEXT = `EAGLE PATHWAY TUTORING RESPONSIBILITY AGREEMENT

1. TUTOR OBLIGATIONS:
- Arrive punctually for all scheduled sessions.
- Maintain professional conduct, clear communication, and dedicated subject mastery.
- Log exact session start and end times accurately through the Eagle Pathway app.
- Provide regular feedback to parents/students regarding academic progress.

2. PARENT & STUDENT OBLIGATIONS:
- Ensure a safe, quiet, and suitable environment for learning.
- Confirm session start and clock-out timestamps promptly in the app.
- Settle hourly billing balances as accrued based on verified session logs.
- Provide at least 4 hours' notice for any session rescheduling.

3. EAGLE PATHWAY GUARANTEE:
- Quality assurance, verified tutor credentials, and payment protection.`;

export interface HoursLedgerMetrics {
  todayHours: number;
  weekHours: number;
  monthHours: number;
  totalPayableAmount: number;
}

export const tutorSessionsService = {
  // ── Agreements ──

  async getAgreementByBooking(bookingId: string): Promise<TutorAgreement | null> {
    const { data, error } = await supabase
      .from('tutor_agreements')
      .select('*')
      .eq('booking_id', bookingId)
      .maybeSingle();
    if (error) throw error;
    return data as TutorAgreement | null;
  },

  async createAgreement(params: {
    bookingId?: string;
    tutorId: string;
    studentId: string;
    responsibilities?: string;
    signedByTutor?: boolean;
    signedByParent?: boolean;
  }): Promise<TutorAgreement> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('tutor_agreements')
      .insert({
        booking_id: params.bookingId || null,
        tutor_id: params.tutorId,
        student_id: params.studentId,
        responsibilities: params.responsibilities || DEFAULT_RESPONSIBILITIES_TEXT,
        tutor_signed: params.signedByTutor || false,
        tutor_signed_at: params.signedByTutor ? now : null,
        parent_signed: params.signedByParent || false,
        parent_signed_at: params.signedByParent ? now : null,
        status: (params.signedByTutor && params.signedByParent) ? 'active' : 'pending',
      })
      .select()
      .single();
    if (error) throw error;
    return data as TutorAgreement;
  },

  async signAgreement(agreementId: string, role: 'tutor' | 'parent'): Promise<TutorAgreement> {
    const now = new Date().toISOString();
    const updates: any = role === 'tutor'
      ? { tutor_signed: true, tutor_signed_at: now }
      : { parent_signed: true, parent_signed_at: now };

    const { data, error } = await supabase
      .from('tutor_agreements')
      .update(updates)
      .eq('id', agreementId)
      .select()
      .single();
    if (error) throw error;

    // Check if both signed to activate
    if (data.tutor_signed && data.parent_signed && data.status === 'pending') {
      const { data: updated, error: updateErr } = await supabase
        .from('tutor_agreements')
        .update({ status: 'active' })
        .eq('id', agreementId)
        .select()
        .single();
      if (!updateErr && updated) return updated as TutorAgreement;
    }

    return data as TutorAgreement;
  },

  // ── Session Clock-In & Clock-Out ──

  async startSession(params: {
    bookingId?: string;
    tutorId: string;
    studentId: string;
    hourlyRate: number;
    notes?: string;
  }): Promise<TutorSessionLog> {
    const { data, error } = await supabase
      .from('tutor_session_logs')
      .insert({
        booking_id: params.bookingId || null,
        tutor_id: params.tutorId,
        student_id: params.studentId,
        start_time: new Date().toISOString(),
        tutor_start_confirmed: true,
        student_start_confirmed: false,
        hourly_rate: params.hourlyRate,
        status: 'active',
        notes: params.notes || null,
      })
      .select()
      .single();
    if (error) throw error;

    // Notify student/parent about session start
    try {
      await supabase.from('notifications').insert({
        user_id: params.studentId,
        type: 'session_started',
        title: 'Tutoring Session Started ⏱️',
        body: 'Your tutor has clocked in to start the session. Tap to confirm.',
        data: { session_id: data.id },
      });
    } catch {}

    return data as TutorSessionLog;
  },

  async confirmStartSession(sessionId: string): Promise<TutorSessionLog> {
    const { data, error } = await supabase
      .from('tutor_session_logs')
      .update({
        student_start_confirmed: true,
        student_start_confirmed_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select()
      .single();
    if (error) throw error;
    return data as TutorSessionLog;
  },

  async endSession(params: {
    sessionId: string;
    notes?: string;
  }): Promise<TutorSessionLog> {
    const { data: existing } = await supabase
      .from('tutor_session_logs')
      .select('*')
      .eq('id', params.sessionId)
      .single();

    if (!existing) throw new Error('Session log not found');

    const endTime = new Date();
    const startTime = new Date(existing.start_time);
    const durationMinutes = Math.max(1, Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)));
    const durationHours = durationMinutes / 60;
    const totalAmount = Math.round(durationHours * Number(existing.hourly_rate));

    const { data, error } = await supabase
      .from('tutor_session_logs')
      .update({
        end_time: endTime.toISOString(),
        tutor_end_confirmed: true,
        tutor_end_confirmed_at: endTime.toISOString(),
        duration_minutes: durationMinutes,
        total_calculated_amount: totalAmount,
        notes: params.notes || existing.notes,
      })
      .eq('id', params.sessionId)
      .select()
      .single();
    if (error) throw error;

    // Notify student/parent to confirm clock-out
    try {
      await supabase.from('notifications').insert({
        user_id: existing.student_id,
        type: 'session_ended',
        title: 'Session Ended ⏱️',
        body: `Session completed (${durationMinutes} mins). Tap to confirm clock-out.`,
        data: { session_id: data.id },
      });
    } catch {}

    return data as TutorSessionLog;
  },

  async confirmEndSession(sessionId: string): Promise<TutorSessionLog> {
    const { data, error } = await supabase
      .from('tutor_session_logs')
      .update({
        student_end_confirmed: true,
        student_end_confirmed_at: new Date().toISOString(),
        status: 'completed',
      })
      .eq('id', sessionId)
      .select()
      .single();
    if (error) throw error;
    return data as TutorSessionLog;
  },

  async getActiveSession(userId: string, isTutor: boolean): Promise<TutorSessionLog | null> {
    let query = supabase.from('tutor_session_logs').select('*').eq('status', 'active');
    if (isTutor) {
      const { data: tutor } = await supabase.from('tutors').select('id').eq('user_id', userId).single();
      if (!tutor) return null;
      query = query.eq('tutor_id', tutor.id);
    } else {
      query = query.eq('student_id', userId);
    }

    const { data } = await query.order('start_time', { ascending: false }).limit(1).maybeSingle();
    return data as TutorSessionLog | null;
  },

  async getSessionLogs(userId: string, isTutor: boolean): Promise<TutorSessionLog[]> {
    let query = supabase.from('tutor_session_logs').select('*');
    if (isTutor) {
      const { data: tutor } = await supabase.from('tutors').select('id').eq('user_id', userId).single();
      if (!tutor) return [];
      query = query.eq('tutor_id', tutor.id);
    } else {
      query = query.eq('student_id', userId);
    }

    const { data, error } = await query.order('start_time', { ascending: false });
    if (error) throw error;
    return data as TutorSessionLog[];
  },

  // ── Hour Ledger & Accumulated Metrics ──

  async getLedgerMetrics(userId: string, isTutor: boolean): Promise<HoursLedgerMetrics> {
    const logs = await this.getSessionLogs(userId, isTutor);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek).getTime();

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    let todayMins = 0;
    let weekMins = 0;
    let monthMins = 0;
    let totalPayable = 0;

    for (const log of logs) {
      const logTime = new Date(log.start_time).getTime();
      const mins = log.duration_minutes || 0;
      const amount = Number(log.total_calculated_amount || 0);

      if (logTime >= startOfToday) todayMins += mins;
      if (logTime >= startOfWeek) weekMins += mins;
      if (logTime >= startOfMonth) {
        monthMins += mins;
        totalPayable += amount;
      }
    }

    return {
      todayHours: Math.round((todayMins / 60) * 10) / 10,
      weekHours: Math.round((weekMins / 60) * 10) / 10,
      monthHours: Math.round((monthMins / 60) * 10) / 10,
      totalPayableAmount: Math.round(totalPayable),
    };
  },
};
