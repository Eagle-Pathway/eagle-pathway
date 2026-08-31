'use client';
import { useState, useEffect } from 'react';
import { X, Mail, Phone, MapPin, Calendar, Shield, Award, BookOpen, Send, Lock, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/Feedback';
import { supabase, getAuthHeaders } from '@/lib/supabase';
import { DocumentPreviewModal, PreviewableDocument } from '@/components/documents/DocumentPreviewModal';

interface UserDetailModalProps {
  userId: string;
  onClose: () => void;
  onRefresh: () => void;
}

export function UserDetailModal({ userId, onClose, onRefresh }: UserDetailModalProps) {
  const toast = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<PreviewableDocument | null>(null);
  
  // Notification form state
  const [showNotifyForm, setShowNotifyForm] = useState(false);
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');

  // Reset password form state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resetLink, setResetLink] = useState('');

  async function fetchDetails() {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/admin/users/action', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'get_details', userId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load details');
      setData(json);
    } catch (err: any) {
      toast('error', err.message || 'Could not load user details.');
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateDocStatus = async (id: string, status: 'approved' | 'rejected', notes?: string) => {
    const { error } = await supabase
      .from('documents')
      .update({ status, reviewer_notes: status === 'rejected' ? notes || null : null })
      .eq('id', id);

    if (!error) {
      toast('success', status === 'approved' ? 'Document approved!' : 'Document rejected.');
      fetchDetails();
      onRefresh();
    } else {
      toast('error', 'Failed to update document status.');
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [userId]);

  const toggleSuspension = async () => {
    const isSuspended = data?.user?.is_suspended;
    const action = isSuspended ? 'unsuspend' : 'suspend';
    setActionLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/admin/users/action', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action, userId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Action failed');
      toast('success', isSuspended ? 'User account reactivated.' : 'User account suspended.');
      fetchDetails();
      onRefresh();
    } catch (err: any) {
      toast('error', err.message || 'Operation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) return;
    setActionLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/admin/users/action', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'send_notification',
          userId,
          title: notifTitle,
          message: notifMessage,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to send notification');
      toast('success', 'Notification sent successfully.');
      setShowNotifyForm(false);
      setNotifTitle('');
      setNotifMessage('');
    } catch (err: any) {
      toast('error', err.message || 'Failed to send notification.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setActionLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/admin/users/action', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'reset_password',
          userId,
          newPassword: newPassword.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to reset password');
      
      if (json.action_link) {
        setResetLink(json.action_link);
        toast('success', 'Password reset link generated.');
      } else {
        toast('success', 'Password updated successfully.');
        setShowPasswordForm(false);
        setNewPassword('');
      }
    } catch (err: any) {
      toast('error', err.message || 'Failed to reset password.');
    } finally {
      setActionLoading(false);
    }
  };

  const user = data?.user;
  const stats = data?.stats;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900">User Profile Details</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading ? (
            <div className="py-12 text-center text-sm text-gray-500">Loading user profile...</div>
          ) : !user ? (
            <div className="py-12 text-center text-sm text-red-500">User data could not be loaded.</div>
          ) : (
            <>
              {/* Profile Card */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-center space-x-4">
                  <div className="h-14 w-14 bg-brand-gold/20 rounded-full flex items-center justify-center text-brand-gold font-bold text-xl">
                    {user.full_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-900">{user.full_name || 'Unknown Name'}</h3>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full uppercase ${
                        user.is_suspended
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : 'bg-green-100 text-green-700 border border-green-200'
                      }`}>
                        {user.is_suspended ? 'Suspended' : 'Active'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">User ID: {user.id}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                      <span className="capitalize font-semibold text-brand-blue bg-blue-50 px-2 py-0.5 rounded">
                        {user.role || user.active_role || 'Student'}
                      </span>
                      <span>• Joined {new Date(user.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Action Toggle Button */}
                <button
                  onClick={toggleSuspension}
                  disabled={actionLoading}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg shadow-sm transition-colors ${
                    user.is_suspended
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {user.is_suspended ? 'Reactivate Account' : 'Suspend Account'}
                </button>
              </div>

              {/* Activity Stats */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100">
                  <div className="text-xl font-bold text-brand-blue">{stats?.applications || 0}</div>
                  <div className="text-xs font-medium text-gray-600 mt-0.5">Applications</div>
                </div>
                <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100">
                  <div className="text-xl font-bold text-amber-700">{stats?.bookings || 0}</div>
                  <div className="text-xs font-medium text-gray-600 mt-0.5">Bookings</div>
                </div>
                <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-100">
                  <div className="text-xl font-bold text-purple-700">{stats?.sop_reviews || 0}</div>
                  <div className="text-xs font-medium text-gray-600 mt-0.5">SOP Reviews</div>
                </div>
              </div>

              {/* Contact & Location */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contact & Location</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center p-3 rounded-lg border border-gray-100 bg-white">
                    <Mail className="w-4 h-4 text-gray-400 mr-2.5 flex-shrink-0" />
                    <span className="truncate text-gray-800">{user.email || 'N/A'}</span>
                  </div>
                  <div className="flex items-center p-3 rounded-lg border border-gray-100 bg-white">
                    <Phone className="w-4 h-4 text-gray-400 mr-2.5 flex-shrink-0" />
                    <span className="text-gray-800">{user.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center p-3 rounded-lg border border-gray-100 bg-white">
                    <MapPin className="w-4 h-4 text-gray-400 mr-2.5 flex-shrink-0" />
                    <span className="text-gray-800">{user.city || 'N/A'} {user.living_address ? `(${user.living_address})` : ''}</span>
                  </div>
                  <div className="flex items-center p-3 rounded-lg border border-gray-100 bg-white">
                    <Send className="w-4 h-4 text-gray-400 mr-2.5 flex-shrink-0" />
                    <span className="text-gray-800">Telegram: {user.telegram_username ? `@${user.telegram_username}` : 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Academic Background */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Academic Profile</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded-lg border border-gray-100 bg-white">
                    <span className="text-xs text-gray-400 block">Grade / Degree Level</span>
                    <span className="font-medium text-gray-800">{user.grade_level || user.target_degree_level || 'N/A'}</span>
                  </div>
                  <div className="p-3 rounded-lg border border-gray-100 bg-white">
                    <span className="text-xs text-gray-400 block">GPA / CGPA</span>
                    <span className="font-medium text-gray-800">{user.cgpa || user.gpa || 'N/A'}</span>
                  </div>
                  <div className="p-3 rounded-lg border border-gray-100 bg-white sm:col-span-2">
                    <span className="text-xs text-gray-400 block">University / School Name</span>
                    <span className="font-medium text-gray-800">{user.university_name || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Uploaded Documents & Credentials Vault */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Uploaded Documents & Credentials ({data?.documents?.length || 0})
                  </h4>
                </div>

                {(!data?.documents || data.documents.length === 0) ? (
                  <div className="p-4 rounded-xl border border-dashed border-gray-200 bg-gray-50/50 text-center text-xs text-gray-400">
                    No documents uploaded by this user yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {data.documents.map((doc: any) => (
                      <div
                        key={doc.id}
                        onClick={() => setSelectedDoc(doc)}
                        className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-brand-blue/30 bg-white hover:bg-blue-50/20 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center space-x-3 min-w-0 pr-2">
                          <BookOpen className="w-4 h-4 text-brand-blue flex-shrink-0 group-hover:scale-110 transition-transform" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-900 truncate">
                              {doc.file_name}
                            </p>
                            <p className="text-[10px] text-gray-400 uppercase font-semibold">
                              {(doc.document_type || 'Document').replace(/_/g, ' ')} · Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                            doc.status === 'approved' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : doc.status === 'rejected'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {doc.status}
                          </span>
                          <span className="text-xs font-bold text-brand-blue group-hover:underline">
                            Inspect
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Administrative Actions */}
              <div className="pt-2 border-t border-gray-100 space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Admin Quick Actions</h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => { setShowNotifyForm(!showNotifyForm); setShowPasswordForm(false); }}
                    className="flex items-center px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Send className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
                    Send Notification
                  </button>
                  <button
                    onClick={() => { setShowPasswordForm(!showPasswordForm); setShowNotifyForm(false); }}
                    className="flex items-center px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Lock className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
                    Reset Password
                  </button>
                </div>

                {/* Send Notification Form */}
                {showNotifyForm && (
                  <form onSubmit={handleSendNotification} className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 space-y-3">
                    <h5 className="text-xs font-bold text-brand-blue">Send Push Notification to {user.full_name}</h5>
                    <input
                      type="text"
                      placeholder="Title (e.g. Scholarship Application Update)"
                      value={notifTitle}
                      onChange={(e) => setNotifTitle(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-brand-blue focus:border-brand-blue bg-white"
                      required
                    />
                    <textarea
                      placeholder="Message body..."
                      value={notifMessage}
                      onChange={(e) => setNotifMessage(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-brand-blue focus:border-brand-blue bg-white"
                      required
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowNotifyForm(false)}
                        className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-200 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="px-3 py-1 text-xs font-semibold text-white bg-brand-blue hover:bg-blue-700 rounded-lg shadow-sm"
                      >
                        Send Now
                      </button>
                    </div>
                  </form>
                )}

                {/* Reset Password Form */}
                {showPasswordForm && (
                  <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100 space-y-3">
                    <h5 className="text-xs font-bold text-amber-800">Reset User Password</h5>
                    <p className="text-xs text-gray-600">Leave blank to generate a self-service recovery link, or enter a new password directly.</p>
                    <input
                      type="text"
                      placeholder="New password (optional)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-brand-blue focus:border-brand-blue bg-white"
                    />
                    {resetLink && (
                      <div className="p-2 bg-white rounded border border-amber-200 text-xs break-all">
                        <span className="font-bold text-gray-700">Link: </span>
                        <a href={resetLink} target="_blank" rel="noreferrer" className="text-brand-blue underline">{resetLink}</a>
                      </div>
                    )}
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => { setShowPasswordForm(false); setResetLink(''); }}
                        className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-200 rounded-lg"
                      >
                        Close
                      </button>
                      <button
                        type="button"
                        onClick={handleResetPassword}
                        disabled={actionLoading}
                        className="px-3 py-1 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm"
                      >
                        {newPassword ? 'Set New Password' : 'Generate Reset Link'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {selectedDoc && (
        <DocumentPreviewModal
          document={selectedDoc}
          onClose={() => setSelectedDoc(null)}
          onUpdateStatus={handleUpdateDocStatus}
        />
      )}
    </div>
  );
}
