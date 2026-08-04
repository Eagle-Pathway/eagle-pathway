'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle, XCircle, Search, Shield, ShieldAlert, FileText, Download, Eye, UserCheck, UserX } from 'lucide-react';
import { exportToCSV } from '@/utils/export';
import { TableSkeleton } from '@/components/ui/TableSkeleton';
import { useToast, useConfirm } from '@/components/ui/Feedback';

interface TutorWithUser {
  user_id: string;
  is_verified: boolean;
  subjects: string[];
  education: string;
  location: string;
  hourly_rate: number;
  users: { full_name: string; phone: string; email: string; };
}

interface TutorApplication {
  id: string;
  tutor_id: string;
  status: string;
  rejection_reason?: string;
  rejection_reason_category?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  grade10_result_url?: string;
  grade12_result_url?: string;
  transcript_url?: string;
  university_name?: string;
  living_address?: string;
  phone_number?: string;
  telegram_username?: string;
  cgpa?: string;
  tutor: { full_name: string; phone: string; email: string; };
}

const REJECTION_CATEGORIES = [
  'Documents unclear or unreadable',
  'Incomplete information submitted',
  'CGPA does not meet requirements',
  'University/college not recognized',
  'Phone number invalid',
  'Duplicate application',
  'Other (write reason)',
];

const SIGNED_URL_TTL = 60 * 60;

async function createSignedUrl(path: string | undefined | null): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from('tutor-documents')
    .createSignedUrl(path, SIGNED_URL_TTL);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export default function TutorsPage() {
  const showToast = useToast();
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState<'profiles' | 'applications'>('profiles');
  const [tutors, setTutors] = useState<TutorWithUser[]>([]);
  const [tutorApps, setTutorApps] = useState<TutorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<TutorApplication | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectApp, setRejectApp] = useState<TutorApplication | null>(null);
  const [rejectCategory, setRejectCategory] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [signedDocs, setSignedDocs] = useState<Record<string, string | null>>({});

  async function fetchTutors() {
    const [{ data: tutorUsers }, { data: tutorProfiles, error }] = await Promise.all([
      supabase.from('users').select('id, full_name, phone, email, role, roles, active_role'),
      supabase.from('tutors').select('user_id, is_verified, subjects, education, location, hourly_rate, users ( full_name, phone, email )').order('created_at', { ascending: false }),
    ]);

    if (!error && tutorProfiles) {
      const existingUserIds = new Set(tutorProfiles.map((t: any) => t.user_id));
      const tutorUsersList = (tutorUsers || []).filter(u => 
        u.role === 'tutor' || u.active_role === 'tutor' || (Array.isArray(u.roles) && u.roles.includes('tutor'))
      );
      const missingUsers = tutorUsersList.filter(u => !existingUserIds.has(u.id));

      const merged: TutorWithUser[] = [
        ...(tutorProfiles as unknown as TutorWithUser[]),
        ...missingUsers.map(u => ({
          user_id: u.id,
          is_verified: false,
          subjects: [],
          education: '',
          location: '',
          hourly_rate: 0,
          users: { full_name: u.full_name, phone: u.phone, email: u.email }
        }))
      ];

      setTutors(merged);
    }
  }

  async function fetchTutorApplications() {
    const { data, error } = await supabase
      .from('tutor_applications')
      .select('*, tutor:users!tutor_id(full_name, phone, email)')
      .order('created_at', { ascending: false });
    if (!error && data) setTutorApps(data as unknown as TutorApplication[]);
  }

  useEffect(() => {
    async function load() {
      setLoading(true);
      await Promise.all([fetchTutors(), fetchTutorApplications()]);
      setLoading(false);
    }
    load();
  }, []);

  const toggleVerification = async (id: string, currentStatus: boolean) => {
    const willBeVerified = !currentStatus;
    setActionLoading(id);
    try {
      const { error: updateError } = await supabase
        .from('tutors')
        .upsert(
          { 
            user_id: id, 
            is_verified: willBeVerified, 
            hourly_rate: 400 
          }, 
          { onConflict: 'user_id' }
        );

      if (updateError) throw updateError;

      await supabase
        .from('tutor_applications')
        .update({ status: willBeVerified ? 'approved' : 'rejected' })
        .eq('tutor_id', id);

      const notif = willBeVerified
        ? { user_id: id, title: "You've been approved! 🎉", body: 'Your tutor profile is now live on Eagle Pathway.', type: 'application_update', is_read: false }
        : { user_id: id, title: 'Account Status Update', body: 'Your tutor verification has been revoked.', type: 'application_update', is_read: false };

      await supabase.from('notifications').insert(notif);

      showToast('success', willBeVerified ? 'Tutor approved successfully! 🎉' : 'Tutor verification revoked.');
      await Promise.all([fetchTutors(), fetchTutorApplications()]);
    } catch (err: any) {
      showToast('error', `Failed to update: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  async function handleApprove(app: TutorApplication) {
    if (!await confirm({ title: 'Approve Tutor', message: `Approve ${app.tutor?.full_name} as a verified tutor?` })) return;
    setActionLoading(app.id);

    const { error } = await supabase
      .from('tutor_applications')
      .update({ status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: (await supabase.auth.getUser()).data.user?.id })
      .eq('id', app.id);

    if (error) { showToast('error', 'Failed to approve application'); setActionLoading(null); return; }

    await supabase
      .from('tutors')
      .upsert(
        { 
          user_id: app.tutor_id, 
          is_verified: true, 
          hourly_rate: 400 
        }, 
        { onConflict: 'user_id' }
      );

    const userUpdates: Record<string, any> = {};
    if (app.living_address) userUpdates.living_address = app.living_address;
    if (app.university_name) userUpdates.university_name = app.university_name;
    if (app.phone_number) userUpdates.phone = app.phone_number;
    if (app.telegram_username) userUpdates.telegram_username = app.telegram_username.replace('@', '');
    if (app.cgpa) userUpdates.cgpa = app.cgpa;

    if (Object.keys(userUpdates).length > 0) {
      await supabase
        .from('users')
        .update(userUpdates)
        .eq('id', app.tutor_id);
    }

    await supabase.from('notifications').insert({
      user_id: app.tutor_id,
      title: 'Tutor Profile Approved 🎉',
      body: 'Your tutor profile has been approved! You can now apply for tutor jobs.',
      type: 'tutor_application_update',
      is_read: false,
    });

    showToast('success', `${app.tutor?.full_name} approved!`);
    setSelectedApp(null);
    await Promise.all([fetchTutorApplications(), fetchTutors()]);
    setActionLoading(null);
  }

  function openRejectModal(app: TutorApplication) {
    setRejectApp(app);
    setRejectCategory('');
    setRejectReason('');
    setShowRejectModal(true);
  }

  async function handleReject() {
    if (!rejectApp || !rejectCategory) { showToast('error', 'Select a rejection reason'); return; }
    const reason = rejectCategory === 'Other (write reason)' ? rejectReason : rejectCategory;
    setActionLoading(rejectApp.id);
    const { error } = await supabase
      .from('tutor_applications')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        rejection_reason_category: rejectCategory,
        reviewed_at: new Date().toISOString(),
        reviewed_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .eq('id', rejectApp.id);
    if (error) { showToast('error', 'Failed to reject'); setActionLoading(null); return; }
    await supabase.from('notifications').insert({
      user_id: rejectApp.tutor_id,
      title: 'Tutor Application Update',
      body: `Your tutor application was not approved. Reason: ${reason}`,
      type: 'tutor_application_update',
      is_read: false,
    });
    showToast('success', 'Application rejected');
    setShowRejectModal(false);
    setSelectedApp(null);
    await fetchTutorApplications();
    setActionLoading(null);
  }

  async function handleReReview(app: TutorApplication) {
    if (!await confirm({ title: 'Re-review Tutor', message: `Reset ${app.tutor?.full_name}'s application to pending for re-review?` })) return;
    setActionLoading(app.id);
    const { error } = await supabase
      .from('tutor_applications')
      .update({ status: 'pending', rejection_reason: null, rejection_reason_category: null, reviewed_by: null, reviewed_at: null })
      .eq('id', app.id);
    if (error) { showToast('error', 'Failed to reset'); } else { showToast('success', 'Ready for re-review'); }
    await fetchTutorApplications();
    setActionLoading(null);
  }

  async function loadSignedDoc(path: string | undefined | null, key: string) {
    const url = await createSignedUrl(path);
    setSignedDocs(prev => ({ ...prev, [key]: url }));
    if (url) window.open(url, '_blank');
  }

  const filteredTutors = tutors.filter(t =>
    t.users?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    t.users?.phone?.includes(search)
  );
  const filteredApps = tutorApps.filter(a =>
    a.tutor?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    a.tutor?.phone?.includes(search)
  );

  const statusBadge = (status: string) => {
    const map: Record<string, { cls: string; label: string }> = {
      pending: { cls: 'bg-amber-50 text-amber-700', label: 'Pending' },
      approved: { cls: 'bg-green-50 text-green-700', label: 'Approved' },
      rejected: { cls: 'bg-red-50 text-red-700', label: 'Rejected' },
    };
    const s = map[status] || { cls: 'bg-gray-50 text-gray-600', label: status };
    return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tutor Approvals</h1>
          <p className="mt-1 text-sm text-gray-500">Verify tutor profiles and manage tutor applications</p>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-max">
        <button
          onClick={() => setActiveTab('profiles')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'profiles' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Tutor Profiles
        </button>
        <button
          onClick={() => setActiveTab('applications')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'applications' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Tutor Applications
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-4">
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input type="text" placeholder="Search by name or phone..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-brand-blue focus:border-brand-blue" />
          </div>
          {activeTab === 'profiles' && (
            <button onClick={() => exportToCSV(filteredTutors.map(t => ({ ID: t.user_id, Name: t.users?.full_name, Phone: t.users?.phone, Email: t.users?.email, Verified: t.is_verified, Rate: t.hourly_rate, Location: t.location })), 'tutors_export')}
              className="flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 text-sm font-medium">
              <Download className="w-4 h-4 mr-2 text-gray-500" /> Export CSV
            </button>
          )}
        </div>

        {activeTab === 'profiles' ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tutor Info</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expertise & Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verification</th>
                  <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? <TableSkeleton cols={4} rows={5} avatarCol={true} /> : filteredTutors.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-500">No tutors found.</td></tr>
                ) : filteredTutors.map((tutor) => (
                  <tr key={tutor.user_id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-brand-blue font-bold text-sm">{tutor.users?.full_name?.charAt(0) || '?'}</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{tutor.users?.full_name || 'Unknown'}</div>
                          <div className="text-sm text-gray-500">{tutor.users?.phone || 'No phone'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">{tutor.subjects?.join(', ') || 'None'}</div>
                      <div className="text-sm font-medium text-brand-gold mt-1">{tutor.hourly_rate} ETB / hr</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {tutor.is_verified ? (
                        <div className="flex items-center text-green-700 bg-green-50 px-2.5 py-1 rounded-full text-xs font-medium w-max">
                          <Shield className="w-3 h-3 mr-1" /> Verified
                        </div>
                      ) : (
                        <div className="flex items-center text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full text-xs font-medium w-max">
                          <ShieldAlert className="w-3 h-3 mr-1" /> Pending
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-1 flex items-center">
                        <FileText className="w-3 h-3 mr-1" /> {tutor.education || 'No background'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button onClick={() => toggleVerification(tutor.user_id, tutor.is_verified)}
                        disabled={actionLoading === tutor.user_id}
                        className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium border disabled:opacity-50 ${
                          tutor.is_verified ? 'text-red-700 bg-red-50 border-red-200 hover:bg-red-100' : 'text-green-700 bg-green-50 border-green-200 hover:bg-green-100'
                        }`}>
                        {actionLoading === tutor.user_id ? 'Saving...' : tutor.is_verified ? 'Revoke' : 'Approve'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tutor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">University</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? <TableSkeleton cols={6} rows={5} avatarCol={true} /> : filteredApps.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">No tutor applications found.</td></tr>
                ) : filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => setSelectedApp(app)}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-brand-blue font-bold text-sm">{app.tutor?.full_name?.charAt(0) || '?'}</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{app.tutor?.full_name || 'Unknown'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{app.university_name || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div>{app.phone_number || '-'}</div>
                      {app.telegram_username && <div className="text-xs text-gray-400">@{app.telegram_username}</div>}
                    </td>
                    <td className="px-6 py-4">{statusBadge(app.status)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{new Date(app.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button onClick={(e) => { e.stopPropagation(); setSelectedApp(app); }}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-brand-blue bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100">
                        <Eye className="w-3 h-3 mr-1" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Application Detail Panel */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">{selectedApp.tutor?.full_name}</h2>
              <button onClick={() => setSelectedApp(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">University</p>
                  <p className="text-sm font-medium">{selectedApp.university_name || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">CGPA</p>
                  <p className="text-sm font-medium">{selectedApp.cgpa || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Phone</p>
                  <p className="text-sm font-medium">{selectedApp.phone_number || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Telegram</p>
                  <p className="text-sm font-medium">{selectedApp.telegram_username ? '@' + selectedApp.telegram_username : '-'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Address</p>
                  <p className="text-sm font-medium">{selectedApp.living_address || '-'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Status</p>
                  <div className="mt-1">{statusBadge(selectedApp.status)}</div>
                  {selectedApp.rejection_reason && (
                    <div className="mt-2 p-3 bg-red-50 rounded-lg">
                      <p className="text-xs text-red-600 font-semibold">Rejection reason:</p>
                      <p className="text-sm text-red-700 mt-1">{selectedApp.rejection_reason}</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-3">Documents</p>
                <div className="space-y-2">
                  {[
                    { label: 'Grade 10 Result', key: 'grade10', path: selectedApp.grade10_result_url },
                    { label: 'Grade 12 Result', key: 'grade12', path: selectedApp.grade12_result_url },
                    { label: 'Transcript', key: 'transcript', path: selectedApp.transcript_url },
                  ].map(doc => (
                    <div key={doc.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">{doc.label}</span>
                      <button
                        onClick={() => loadSignedDoc(doc.path, `${selectedApp.id}_${doc.key}`)}
                        disabled={!doc.path}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium ${
                          doc.path ? 'text-brand-blue bg-blue-50 hover:bg-blue-100 border border-blue-200' : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                        }`}
                      >
                        <FileText className="w-3 h-3" />
                        {doc.path ? 'View Document' : 'Not uploaded'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {selectedApp.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleApprove(selectedApp)}
                    disabled={actionLoading === selectedApp.id}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 text-sm font-medium disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {actionLoading === selectedApp.id ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => openRejectModal(selectedApp)}
                    disabled={actionLoading === selectedApp.id}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 text-sm font-medium disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              )}
              {selectedApp.status === 'approved' && (
                <div className="pt-4 border-t border-gray-100">
                  <button
                    onClick={() => toggleVerification(selectedApp.tutor_id, true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-red-700 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 text-sm font-medium"
                  >
                    <UserX className="w-4 h-4" />
                    Revoke Approval
                  </button>
                </div>
              )}
              {selectedApp.status === 'rejected' && (
                <div className="pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleReReview(selectedApp)}
                    disabled={actionLoading === selectedApp.id}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-amber-700 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 text-sm font-medium disabled:opacity-50"
                  >
                    <UserCheck className="w-4 h-4" />
                    {actionLoading === selectedApp.id ? 'Processing...' : 'Re-review Application'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && rejectApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md m-4">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Reject {rejectApp.tutor?.full_name}</h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-500">Select a reason for rejection:</p>
              {REJECTION_CATEGORIES.map(cat => (
                <label key={cat} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  rejectCategory === cat ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:bg-gray-50'
                }`}>
                  <input type="radio" name="rejectCategory" value={cat} checked={rejectCategory === cat}
                    onChange={e => setRejectCategory(e.target.value)} className="accent-red-600" />
                  <span className="text-sm">{cat}</span>
                </label>
              ))}
              {rejectCategory === 'Other (write reason)' && (
                <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                  placeholder="Describe the reason..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-red-500 focus:border-red-500 mt-2" rows={3} />
              )}
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100">Cancel</button>
              <button onClick={handleReject}
                disabled={!rejectCategory || actionLoading === rejectApp.id}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">
                {actionLoading === rejectApp.id ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
