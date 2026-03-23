import { supabase } from './supabase';
import { User, UserRole } from '../types';

export const authService = {
  async sendOtp(phone: string) {
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) throw error;
  },

  async verifyOtp(phone: string, token: string) {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });
    if (error) throw error;
    return data;
  },

  async signUp(fullName: string, phone: string, role: UserRole, email?: string) {
    const { data, error } = await supabase.auth.signInWithOtp({ phone });
    if (error) throw error;

    // Store pending signup data to complete after OTP verification
    return { phone, fullName, role, email };
  },

  async createProfile(userId: string, fullName: string, phone: string, role: UserRole, email?: string) {
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: userId,
        full_name: fullName,
        phone,
        role,
        email,
      })
      .select()
      .single();
    if (error) throw error;
    return data as User;
  },

  async getProfile(userId: string): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data as User;
  },

  async updateProfile(userId: string, updates: Partial<User>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data as User;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};
