import { supabase } from './supabase';
import { User, Application } from '../types';

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
    let query = supabase
      .from('parent_student_links')
      .select('*, parent:users!parent_id(*), student:users!student_id(*)')
      .eq('is_verified', false);
    
    if (role === 'parent') {
      query = query.eq('parent_id', userId);
    } else {
      query = query.eq('student_id', userId);
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
  }
};
