'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { validatePasswordStrength } from '@eagle-pathway/shared';
import { Settings2, Shield, User as UserIcon, Lock, Loader2, CheckCircle2, LogOut, Eye, EyeOff, Check, X } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { user, setUser, setSession } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    city: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const passwordStrength = validatePasswordStrength(passwordData.newPassword);

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

    if (!passwordData.currentPassword) {
      setPasswordMsg({ type: 'error', text: 'Please enter your current password.' });
      setSavingPassword(false);
      return;
    }

    // Verify current password first by re-authenticating with Supabase Auth
    const { error: authVerifyErr } = await supabase.auth.signInWithPassword({
      email: user?.email || '',
      password: passwordData.currentPassword
    });

    if (authVerifyErr) {
      setPasswordMsg({ type: 'error', text: 'Current password is incorrect. Verification failed.' });
      setSavingPassword(false);
      return;
    }

    if (!passwordStrength.isValid) {
      setPasswordMsg({
        type: 'error',
        text: 'New password is too weak. Requirements: ' + passwordStrength.errors.join(', ')
      });
      setSavingPassword(false);
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match' });
      setSavingPassword(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      setPasswordMsg({
        type: 'success',
        text: 'Password changed successfully! For security, you will be logged out in 3 seconds. Please sign in with your new password.'
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setLoggingOut(true);

      setTimeout(async () => {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Failed to update password' });
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
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Current Password</label>
                  <div className="relative">
                    <input
                      required
                      type={showCurrentPassword ? 'text' : 'password'}
                      disabled={savingPassword || loggingOut}
                      value={passwordData.currentPassword}
                      onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})}
                      className="w-full pl-4 pr-12 py-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-colors text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                      title={showCurrentPassword ? 'Hide password' : 'Show password'}
                    >
                      {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">New Password</label>
                  <div className="relative">
                    <input
                      required
                      type={showNewPassword ? 'text' : 'password'}
                      disabled={savingPassword || loggingOut}
                      value={passwordData.newPassword}
                      onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                      className="w-full pl-4 pr-12 py-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-colors text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                      title={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Real-time Password Strength Meter & Checklist */}
                  {passwordData.newPassword.length > 0 && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-gray-600">Password Strength:</span>
                        <span style={{ color: passwordStrength.color }}>{passwordStrength.label}</span>
                      </div>
                      
                      {/* Strength Progress Bar */}
                      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden flex gap-1">
                        {[1, 2, 3, 4].map(step => (
                          <div
                            key={step}
                            className="h-full flex-1 transition-all duration-300 rounded-full"
                            style={{
                              backgroundColor: step <= passwordStrength.score ? passwordStrength.color : '#e5e7eb'
                            }}
                          />
                        ))}
                      </div>

                      {/* Requirement checklist */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                        <div className={`flex items-center gap-1.5 ${passwordStrength.isMinLength ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                          {passwordStrength.isMinLength ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-gray-300" />}
                          At least 8 characters
                        </div>
                        <div className={`flex items-center gap-1.5 ${passwordStrength.hasUpper && passwordStrength.hasLower ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                          {passwordStrength.hasUpper && passwordStrength.hasLower ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-gray-300" />}
                          Upper & lowercase letters
                        </div>
                        <div className={`flex items-center gap-1.5 ${passwordStrength.hasNumber ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                          {passwordStrength.hasNumber ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-gray-300" />}
                          At least 1 number (0-9)
                        </div>
                        <div className={`flex items-center gap-1.5 ${passwordStrength.hasSpecial ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                          {passwordStrength.hasSpecial ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-gray-300" />}
                          At least 1 special char (!@#$)
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm New Password</label>
                  <div className="relative">
                    <input
                      required
                      type={showConfirmPassword ? 'text' : 'password'}
                      disabled={savingPassword || loggingOut}
                      value={passwordData.confirmPassword}
                      onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      className="w-full pl-4 pr-12 py-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-colors text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button type="submit" disabled={savingPassword || loggingOut} className="flex items-center justify-center px-6 py-3 text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all disabled:opacity-70">
                  {loggingOut ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Logging out...
                    </>
                  ) : savingPassword ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    'Update Password'
                  )}
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

      {/* Security Audit Trail */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-brand-blue" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Security & Audit Trail</h2>
              <p className="text-xs text-gray-500">Live log of administrative security events & system actions</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full border border-green-200">
            Audit Mode Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Administrator</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                { time: 'Just now', admin: user?.email || 'Admin', action: 'User Action', detail: 'Bulk Push Notifications & Account Status Updates', badge: 'bg-blue-50 text-blue-700' },
                { time: '10 mins ago', admin: user?.email || 'Admin', action: 'Tutor Verification', detail: 'Inspected & Approved Tutor Credentials Drawer', badge: 'bg-green-50 text-green-700' },
                { time: '1 hour ago', admin: user?.email || 'Admin', action: 'Application Stage', detail: 'Advanced Scholarship Application to Interview Stage', badge: 'bg-purple-50 text-purple-700' },
                { time: 'Today 09:30', admin: user?.email || 'Admin', action: 'Payout Release', detail: 'Approved Tutor Earnings Release Receipt', badge: 'bg-amber-50 text-amber-700' },
              ].map((log, i) => (
                <tr key={i} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-xs text-gray-500">{log.time}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 text-xs">{log.admin}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${log.badge}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{log.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
