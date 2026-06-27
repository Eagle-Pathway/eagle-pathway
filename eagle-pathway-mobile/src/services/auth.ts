import { supabase } from './supabase';
import { User, UserRole } from '../types';
import * as Linking from 'expo-linking';

export interface SignupAttribution {
  referral_code?: string;
  signup_source?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  first_landing_url?: string;
}

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

  async signUp(
    email: string,
    password: string,
    fullName: string,
    phone: string,
    role: string,
    attribution: SignupAttribution = {},
  ) {
    // No emailRedirectTo — verification uses a 6-digit code ({{ .Token }}), not a deep link.
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          phone: phone.trim(),
          role,
          ...attribution,
        }
      }
    });

    if (error) throw error;

    // If auto-confirm is enabled and we have a session, create profile immediately
    if (data.user && data.session) {
      try {
        await this.createProfile(data.user.id, fullName, phone, role as any, email, attribution);
      } catch (e) {
        console.log('Profile creation failed or already exists:', e);
      }
    }

    return data;
  },

  // Verify the 6-digit code emailed at sign-up. On success the user is confirmed
  // and a session is returned, so they're logged in immediately.
  async verifySignupOtp(email: string, token: string) {
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: token.trim(),
      type: 'signup',
    });
    if (error) throw error;
    return data;
  },

  async resendSignupOtp(email: string) {
    const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim() });
    if (error) throw error;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
    return data;
  },

  async createProfile(
    userId: string,
    fullName: string,
    phone: string,
    role: UserRole,
    email: string,
    attribution: SignupAttribution = {},
  ) {
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: userId,
        full_name: fullName,
        phone,
        role,                  // canonical single role
        roles: [role],         // legacy mirror — dropped in phase 2
        active_role: role,     // legacy mirror — dropped in phase 2
        email,
        referral_code: attribution.referral_code || null,
        signup_source: attribution.signup_source || null,
        utm_source: attribution.utm_source || null,
        utm_medium: attribution.utm_medium || null,
        utm_campaign: attribution.utm_campaign || null,
        utm_content: attribution.utm_content || null,
        first_landing_url: attribution.first_landing_url || null,
      })
      .select()
      .single();
    if (error) throw error;
    
    // Add role to user_roles table (source of truth)
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: role,
      });
    if (roleError) throw roleError;

    // Note: Tutor/parent profiles are now lazy-created
    // via database trigger when user switches to that role
    
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

  async uploadAvatar(userId: string, fileUri: string, fileName: string): Promise<string> {
    const response = await fetch(fileUri);
    const blob = await response.blob();
    const filePath = `${userId}/avatar_${Date.now()}_${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, blob, {
        contentType: 'image/jpeg',
        upsert: true,
      });
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    await this.updateProfile(userId, { avatar_url: publicUrl });
    return publicUrl;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Permanently delete the caller's account. The RPC runs as definer and deletes
  // the auth.users row, which cascades to public.users and all the user's data.
  async deleteAccount() {
    const { error } = await supabase.rpc('delete_own_account');
    if (error) throw error;
    // Best-effort local sign-out; the server session is already invalid.
    await supabase.auth.signOut().catch(() => {});
  },

  async getSession() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};
