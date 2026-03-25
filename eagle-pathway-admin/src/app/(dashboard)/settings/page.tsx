'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { Settings2, Shield, User as UserIcon, Lock, Loader2, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    city: ''
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user?.id) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    setLoading(true);
    const { data } = await supabase.from('users').select('*').eq('id', user?.id).single();
    if (data) {
      setFormData({
        full_name: data.full_name || '',
        phone: data.phone || '',
        city: data.city || ''
      });
    }
    setLoading(false);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg({ type: '', text: '' });

    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          city: formData.city,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (error) throw error;
      
      // Also update Auth user metadata to match
      await supabase.auth.updateUser({
        data: { full_name: formData.full_name, phone: formData.phone }
      });

      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPassword(true);
    setPasswordMsg({ type: '', text: '' });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match' });
      setSavingPassword(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      setPasswordMsg({ type: 'success', text: 'Password successfully changed!' });
      setPasswordData({ newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Failed to update password' });
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-brand-blue" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your admin profile and security credentials</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
        
        {/* Profile Settings */}
        <div className="md:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/30 flex items-center">
               <UserIcon className="w-5 h-5 text-brand-blue mr-3" />
               <h2 className="text-lg font-bold text-gray-900">Public Profile</h2>
            </div>
            
            <form onSubmit={handleProfileUpdate} className="p-8 space-y-6">
              {profileMsg.text && (
                <div className={`p-4 rounded-xl text-sm flex items-center ${profileMsg.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                  {profileMsg.type === 'success' && <CheckCircle2 className="w-5 h-5 mr-2" />}
                  {profileMsg.text}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address (Read-only)</label>
                  <input type="email" value={user?.email || ''} disabled className="w-full px-4 py-3 bg-gray-100 rounded-xl border border-gray-200 text-gray-500 cursor-not-allowed" />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                  <input type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-colors text-gray-900" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
                  <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-colors text-gray-900" />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">City / Location</label>
                  <input type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-colors text-gray-900" />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button type="submit" disabled={savingProfile} className="flex items-center justify-center px-6 py-3 text-sm font-bold text-white bg-brand-blue rounded-xl hover:bg-blue-800 transition-all disabled:opacity-70">
                  {savingProfile ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/30 flex items-center">
               <Lock className="w-5 h-5 text-gray-600 mr-3" />
               <h2 className="text-lg font-bold text-gray-900">Security</h2>
            </div>
            
            <form onSubmit={handlePasswordUpdate} className="p-8 space-y-6">
              {passwordMsg.text && (
                <div className={`p-4 rounded-xl text-sm flex items-center ${passwordMsg.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                  {passwordMsg.type === 'success' && <CheckCircle2 className="w-5 h-5 mr-2" />}
                  {passwordMsg.text}
                </div>
              )}

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">New Password</label>
                  <input required minLength={6} type="password" value={passwordData.newPassword} onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-colors text-gray-900" placeholder="••••••••" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm New Password</label>
                  <input required minLength={6} type="password" value={passwordData.confirmPassword} onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})} className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-colors text-gray-900" placeholder="••••••••" />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button type="submit" disabled={savingPassword} className="flex items-center justify-center px-6 py-3 text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all disabled:opacity-70">
                  {savingPassword ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Info Column */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-brand-blue text-white rounded-3xl p-6 shadow-lg shadow-brand-blue/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Shield className="w-32 h-32" />
            </div>
            <div className="relative z-10">
              <h3 className="font-bold text-lg mb-2">Administrator Access</h3>
              <p className="text-white/80 text-sm leading-relaxed mb-6">
                Your account is currently provisioned with full administrative rights. You have the ability to read and write records globally across the database.
              </p>
              
              <div className="bg-white/10 rounded-xl p-4 flex items-center backdrop-blur-sm border border-white/20">
                <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center mr-3 text-brand-blue font-bold">
                   {user?.email?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div>
                   <div className="font-bold">{formData.full_name || 'Admin'}</div>
                   <div className="text-xs text-white/70 truncate w-32">{user?.email}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
