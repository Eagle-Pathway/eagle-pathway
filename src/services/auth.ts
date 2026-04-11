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

  async signUp(email: string, password: string, fullName: string, phone: string, role: string) {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          phone: phone.trim(),
          role,
        }
      }
    });

    if (error) throw error;
    
    // If auto-confirm is enabled and we have a session, create profile immediately
    if (data.user && data.session) {
      try {
        await this.createProfile(data.user.id, fullName, phone, role as any, email);
      } catch (e) {
        console.log('Profile creation failed or already exists:', e);
      }
    }
    
    return data;
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
    email: string
  ) {
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