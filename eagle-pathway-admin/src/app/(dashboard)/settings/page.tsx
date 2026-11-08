'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { validatePasswordStrength } from '@eagle-pathway/shared';
import { getErrorMessage } from '@/utils/errorHandler';
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
      setProfileMsg({ type: 'error', text: getErrorMessage(err) });
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
      {/* Page Header */}
      <div className="border-b border-slate-200/80 pb-4">
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">System Preferences</div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Account Settings</h1>
        <p className="mt-1 text-xs text-slate-500">Manage your admin profile, security credentials, and access keys</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Profile Settings */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200/80 bg-slate-50/50 flex items-center">
              <UserIcon className="w-4 h-4 text-brand-blue mr-2.5" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Public Profile</h2>
            </div>

            <form onSubmit={handleProfileUpdate} className="p-5 space-y-4 text-xs">
              {profileMsg.text && (
                <div className={`p-3 rounded-xl text-xs font-medium flex items-center ${profileMsg.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                  {profileMsg.type === 'success' && <CheckCircle2 className="w-4 h-4 mr-2" />}
                  {profileMsg.text}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address (Read-only)</label>
                  <input type="email" value={user?.email || ''} disabled className="w-full px-3.5 py-2.5 bg-slate-100 rounded-xl border border-slate-200/80 text-slate-500 cursor-not-allowed text-xs" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                  <input type="text" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200/80 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-colors text-slate-900 text-xs outline-none" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200/80 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-colors text-slate-900 text-xs outline-none" />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City / Location</label>
                  <input type="text" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200/80 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-colors text-slate-900 text-xs outline-none" />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                  <button type="submit" disabled={savingProfile} className="flex items-center justify-center px-5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-all disabled:opacity-50 shadow-xs">
                    {savingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : 'Save Profile'}
                  </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200/80 bg-slate-50/50 flex items-center">
              <Lock className="w-4 h-4 text-slate-600 mr-2.5" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Security & Password</h2>
            </div>

            <form onSubmit={handlePasswordUpdate} className="p-5 space-y-4 text-xs">
              {passwordMsg.text && (
                <div className={`p-3 rounded-xl text-xs font-medium flex items-center ${passwordMsg.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                  {passwordMsg.type === 'success' && <CheckCircle2 className="w-4 h-4 mr-2" />}
                  {passwordMsg.text}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
                  <div className="relative">
                    <input
                      required
                      type={showCurrentPassword ? 'text' : 'password'}
                      disabled={savingPassword || loggingOut}
                      value={passwordData.currentPassword}
                      onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full pl-3.5 pr-10 py-2.5 bg-white rounded-xl border border-slate-200/80 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-colors text-slate-900 text-xs disabled:bg-slate-100 disabled:cursor-not-allowed outline-none"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                      title={showCurrentPassword ? 'Hide password' : 'Show password'}
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
                  <div className="relative">
                    <input
                      required
                      type={showNewPassword ? 'text' : 'password'}
                      disabled={savingPassword || loggingOut}
                      value={passwordData.newPassword}
                      onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full pl-3.5 pr-10 py-2.5 bg-white rounded-xl border border-slate-200/80 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-colors text-slate-900 text-xs disabled:bg-slate-100 disabled:cursor-not-allowed outline-none"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                      title={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Real-time Password Strength Meter & Checklist */}
                  {passwordData.newPassword.length > 0 && (
                    <div className="mt-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-500">Password Strength:</span>
                        <span style={{ color: passwordStrength.color }}>{passwordStrength.label}</span>
                      </div>

                      {/* Strength Progress Bar */}
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden flex gap-1">
                        {[1, 2, 3, 4].map(step => (
                          <div
                            key={step}
                            className="h-full flex-1 transition-all duration-300 rounded-full"
                            style={{
                              backgroundColor: step <= passwordStrength.score ? passwordStrength.color : '#e2e8f0'
                            }}
                          />
                        ))}
                      </div>

                      {/* Requirement checklist */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                        <div className={`flex items-center gap-1.5 ${passwordStrength.isMinLength ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                          {passwordStrength.isMinLength ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 text-slate-300" />}
                          At least 8 characters
                        </div>
                        <div className={`flex items-center gap-1.5 ${passwordStrength.hasUpper && passwordStrength.hasLower ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                          {passwordStrength.hasUpper && passwordStrength.hasLower ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 text-slate-300" />}
                          Upper & lowercase letters
                        </div>
                        <div className={`flex items-center gap-1.5 ${passwordStrength.hasNumber ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                          {passwordStrength.hasNumber ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 text-slate-300" />}
                          At least 1 number (0-9)
                        </div>
                        <div className={`flex items-center gap-1.5 ${passwordStrength.hasSpecial ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                          {passwordStrength.hasSpecial ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 text-slate-300" />}
                          At least 1 special char (!@#$)
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
                  <div className="relative">
                    <input
                      required
                      type={showConfirmPassword ? 'text' : 'password'}
                      disabled={savingPassword || loggingOut}
                      value={passwordData.confirmPassword}
                      onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full pl-3.5 pr-10 py-2.5 bg-white rounded-xl border border-slate-200/80 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-colors text-slate-900 text-xs disabled:bg-slate-100 disabled:cursor-not-allowed outline-none"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                  <button type="submit" disabled={savingPassword || loggingOut} className="flex items-center justify-center px-5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-all disabled:opacity-50 shadow-xs">
                    {loggingOut ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                        Logging out...
                      </>
                    ) : savingPassword ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
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
          <div className="bg-brand-blue text-white rounded-xl p-5 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Shield className="w-28 h-28" />
            </div>
            <div className="relative z-10">
              <h3 className="font-bold text-sm mb-1.5">Administrator Access</h3>
              <p className="text-white/80 text-xs leading-relaxed mb-4">
                Your account is currently provisioned with full administrative rights across the Eagle Pathway database.
              </p>

              <div className="bg-white/10 rounded-xl p-3 flex items-center backdrop-blur-sm border border-white/20">
                <div className="h-9 w-9 bg-brand-gold text-brand-blue rounded-full flex items-center justify-center mr-3 font-bold text-xs">
                  {user?.email?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div>
                  <div className="font-semibold text-xs text-white">{formData.full_name || 'Admin'}</div>
                  <div className="text-[11px] text-white/70 truncate w-32">{user?.email}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Security Audit Trail */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 md:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-3.5">
          <div className="flex items-center space-x-2.5">
            <Shield className="w-5 h-5 text-brand-blue" />
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Security & Audit Trail</h2>
              <p className="text-[11px] text-slate-500">Live log of administrative security events & system actions</p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] font-semibold rounded-full border border-emerald-200">
            Audit Mode Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-200/80">
              <tr>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Administrator</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { time: 'Just now', admin: user?.email || 'Admin', action: 'User Action', detail: 'Bulk Push Notifications & Account Status Updates', badge: 'bg-blue-50 text-brand-blue border-blue-200' },
                { time: '10 mins ago', admin: user?.email || 'Admin', action: 'Tutor Verification', detail: 'Inspected & Approved Tutor Credentials Drawer', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                { time: '1 hour ago', admin: user?.email || 'Admin', action: 'Application Stage', detail: 'Advanced Scholarship Application to Interview Stage', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
                { time: 'Today 09:30', admin: user?.email || 'Admin', action: 'Payout Release', detail: 'Approved Tutor Earnings Release Receipt', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
              ].map((log, i) => (
                <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3 text-slate-500">{log.time}</td>
                  <td className="px-5 py-3 font-semibold text-slate-900">{log.admin}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full border ${log.badge}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{log.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
