'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Settings,
  User,
  Lock,
  Bell,
  Shield,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Save,
  KeyRound,
} from 'lucide-react';

export default function SettingsPage() {
  const { user, signOut, updateProfile } = useAuthStore();

  // Profile Form
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Password Form
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Notification Toggles
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [deadlineReminders, setDeadlineReminders] = useState(true);
  const [sessionReminders, setSessionReminders] = useState(true);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      await updateProfile({
        full_name: fullName.trim(),
        phone: phone.trim(),
      });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 2500);
    } catch (err) {
      console.error(err);
      alert('Failed to update profile details.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setPasswordSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 2500);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-4">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Preferences</p>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
          Account Settings &amp; Security
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your personal credentials, contact numbers, notification preferences, and password.
        </p>
      </div>

      {/* Profile Form */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <User size={16} className="text-brand-blue" />
            <span>Profile Information</span>
          </h2>
          {profileSuccess && (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 size={14} /> Saved!
            </span>
          )}
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue font-medium transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Registered Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 0911234567"
                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-3.5 py-2.5 bg-slate-100/70 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Email cannot be changed directly for security reasons.
            </span>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={profileSaving}
              className="px-5 py-2.5 rounded-xl bg-brand-blue text-white text-xs font-semibold hover:bg-brand-blue/90 transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save size={14} />
              <span>{profileSaving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Password Change */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <KeyRound size={16} className="text-brand-blue" />
            <span>Update Password</span>
          </h2>
          {passwordSuccess && (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 size={14} /> Password Updated!
            </span>
          )}
        </div>

        {passwordError && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle size={14} className="flex-shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-4 text-xs max-w-lg">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              required
              className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              required
              className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={passwordLoading}
              className="px-5 py-2.5 rounded-xl bg-brand-blue text-white text-xs font-semibold hover:bg-brand-blue/90 transition-all shadow-xs disabled:opacity-50"
            >
              {passwordLoading ? 'Updating Password...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 md:p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Bell size={16} className="text-brand-blue" />
          <span>Notification Preferences</span>
        </h2>

        <div className="space-y-3 text-xs">
          {[
            {
              title: 'Application Deadline Reminders',
              desc: 'Get notified 7 days and 48 hours before tracked scholarship deadlines.',
              checked: deadlineReminders,
              toggle: () => setDeadlineReminders(!deadlineReminders),
            },
            {
              title: 'Tutoring Session Alerts',
              desc: 'Reminders 1 hour prior to your Google Meet or in-person sessions.',
              checked: sessionReminders,
              toggle: () => setSessionReminders(!sessionReminders),
            },
            {
              title: 'New Scholarship Broadcasts',
              desc: 'Weekly digests of newly verified global funding opportunities matching your grade/major.',
              checked: emailAlerts,
              toggle: () => setEmailAlerts(!emailAlerts),
            },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/60 border border-slate-100 hover:border-slate-200 transition-colors"
            >
              <div>
                <div className="font-semibold text-slate-900">{item.title}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
              </div>
              <input
                type="checkbox"
                checked={item.checked}
                onChange={item.toggle}
                className="w-4 h-4 rounded text-brand-blue focus:ring-brand-blue accent-brand-blue cursor-pointer"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Sign Out Action */}
      <div className="pt-2 flex justify-between items-center text-xs">
        <span className="text-slate-400">Eagle Pathway v1.0 • Web Portal</span>
        <button
          onClick={() => signOut()}
          className="px-4 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-semibold transition-colors flex items-center gap-1.5"
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}

