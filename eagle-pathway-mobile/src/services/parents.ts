import { supabase } from './supabase';
import { User, Application, Booking } from '../types';

export const parentsService = {
  async linkStudent(parentId: string, studentPhone: string): Promise<void> {
    // Find student by phone
    const { data: student, error: studentError } = await supabase
      .from('users')
      .select('id')
      .eq('phone', studentPhone)
      .single();

    if (studentError || !student) {
      throw new Error('Student not found with this phone number.');
    }

    const { error } = await supabase
      .from('parent_student_links')
      .insert({
        parent_id: parentId,
        student_id: student.id,
        relationship: 'parent',
        is_verified: false,
      });

    if (error) {
      if (error.code === '23505') {
        throw new Error('This student is already linked to your account or pending verification.');
      }
      throw error;
    }
  },

  async inviteParent(studentId: string, parentPhone: string): Promise<void> {
    // Find parent by phone
    const { data: parent, error: parentError } = await supabase
      .from('users')
      .select('id')
      .eq('phone', parentPhone)
      .single();

    if (parentError || !parent) {
      throw new Error('Parent not found. Please ask them to sign up first.');
    }

    const { error } = await supabase
      .from('parent_student_links')
      .insert({
        parent_id: parent.id,
        student_id: studentId,
        relationship: 'parent',
        is_verified: false,
      });

    if (error) {
      if (error.code === '23505') {
        throw new Error('This parent is already linked to your account or pending verification.');
      }
      throw error;
    }
  },

  async getPendingLinks(userId: string, role: 'parent' | 'student'): Promise<any[]> {
    const query = supabase
      .from('parent_student_links')
      .select('*, parent:users!parent_id(*), student:users!student_id(*)')
      .eq('is_verified', false);
    
    if (role === 'parent') {
      query.eq('parent_id', userId);
    } else {
      query.eq('student_id', userId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async verifyLink(linkId: string): Promise<void> {
    const { error } = await supabase
      .from('parent_student_links')
      .update({ 
        is_verified: true,
        verified_at: new Date().toISOString() 
      })
      .eq('id', linkId);
    
    if (error) throw error;
  },

  async removeLink(linkId: string): Promise<void> {
    const { error } = await supabase
      .from('parent_student_links')
      .delete()
      .eq('id', linkId);

    if (error) throw error;
  },

  async getLinkedStudents(userId: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('parent_student_links')
      .select('student:users!inner(*)')
      .eq('parent_id', userId)
      .eq('is_verified', true);

    if (error) throw error;
    return (data || []).map(d => d.student as unknown as User);
  },

  async getLinkedStudentApplications(userId: string): Promise<Record<string, Application[]>> {
    const students = await parentsService.getLinkedStudents(userId);
    if (students.length === 0) return {};

    const studentIds = students.map(s => s.id);
    const { data, error } = await supabase
      .from('applications')
      .select('*, scholarship:scholarships(*), consultant:users!consultant_id(full_name)')
      .in('student_id', studentIds)
      .not('status', 'in', '(accepted,rejected)');

    if (error) throw error;

    const appsByStudent: Record<string, Application[]> = {};
    (data || []).forEach((app: any) => {
      if (!appsByStudent[app.student_id]) appsByStudent[app.student_id] = [];
      appsByStudent[app.student_id].push(app);
    });
    return appsByStudent;
  },

  async getLinkedStudentBookings(parentId: string): Promise<Record<string, Booking[]>> {
    const students = await parentsService.getLinkedStudents(parentId);
    if (students.length === 0) return {};

    const studentIds = students.map(s => s.id);
    const { data, error } = await supabase
      .from('bookings')
      .select('*, tutor:tutors(*, user:users(*))')
      .in('student_id', studentIds)
      .order('session_date', { ascending: false });

    if (error) throw error;

    const bookingsByStudent: Record<string, Booking[]> = {};
    (data || []).forEach((b: any) => {
      if (!bookingsByStudent[b.student_id]) bookingsByStudent[b.student_id] = [];
      bookingsByStudent[b.student_id].push(b);
    });
    return bookingsByStudent;
  }
};
