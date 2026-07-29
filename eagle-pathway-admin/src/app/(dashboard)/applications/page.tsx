'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { roleOf } from '@/lib/role';
import { 
  Search, 
  Briefcase, 
  UserPlus, 
  ChevronRight, 
  Filter, 
  MoreVertical,
  Calendar,
  GraduationCap,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface Application {
  id: string;
  student_id: string;
  scholarship_id: string;
  consultant_id: string | null;
  status: string;
  package_tier: string;
  notes: string | null;
  sop_content: string | null;
  consultant_feedback: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  student?: { full_name: string; email: string };
  scholarship?: { name: string; organization: string };
  consultant?: { full_name: string };
  documents?: any[];
}

interface Consultant {
  id: string;
  full_name: string;
  role?: string | null;
  roles?: string[] | null;
  active_role?: string | null;
}

const STAGES = [
  { id: 'personal_info', label: 'Initial' },
  { id: 'documents', label: 'Docs' },
  { id: 'sop', label: 'SOP' },
  { id: 'submitted', label: 'Submitted' },
  { id: 'interview', label: 'Interview' },
  { id: 'accepted', label: 'Accepted' }
];

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedScholarship, setSelectedScholarship] = useState('all');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [notesInput, setNotesInput] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [notification, setNotification] = useState<{type: 'error' | 'success' | 'info'; message: string} | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    console.log('Fetching applications...');
    // Fetch applications with joins
    const { data: appData, error: appError } = await supabase
      .from('applications')
      .select('*, student:users!applications_student_id_fkey(id, full_name, email), scholarship:scholarships(name, organization), consultant:users!applications_consultant_id_fkey(full_name), documents(*)')
      .order('updated_at', { ascending: false });

    if (appError) {
      console.error('Error fetching applications:', appError);
    } else {
      console.log(`Fetched ${appData?.length || 0} applications`);
    }

    // Fetch potential consultants (users with role tutor or admin)
    const { data: consData, error: consError } = await supabase
      .from('users')
      .select('id, full_name, role, roles, active_role');

    if (consError) {
      console.error('Error fetching consultants:', consError);
    }

    if (!appError && appData) setApplications(appData as Application[]);
    if (consData) {
      setConsultants((consData as Consultant[]).filter(c =>
        roleOf(c) === 'tutor' || roleOf(c) === 'admin'
      ));
    }
    
    setLoading(false);
  };

  const handleAssignConsultant = async (appId: string, consultantId: string) => {
    const { error } = await supabase
      .from('applications')
      .update({ consultant_id: consultantId })
      .eq('id', appId);

    if (!error) {
      setApplications(prev => prev.map(app => 
        app.id === appId 
          ? { ...app, consultant_id: consultantId, consultant: consultants.find(c => c.id === consultantId) } 
          : app
      ));
    }
  };

  const handleUpdateStatus = async (appId: string, status: string) => {
    setSavingStatus(true);
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', appId);

      if (!error) {
        setApplications(prev => prev.map(app => app.id === appId ? { ...app, status, updated_at: new Date().toISOString() } : app));
        if (selectedApp?.id === appId) setSelectedApp(prev => prev ? { ...prev, status, updated_at: new Date().toISOString() } : null);
        setNotification({ type: 'success', message: 'Status updated successfully!' });
        setTimeout(() => setNotification(null), 3000);
      } else {
        setNotification({ type: 'error', message: 'Failed to update status: ' + error.message });
        setTimeout(() => setNotification(null), 5000);
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: 'An unexpected error occurred: ' + err.message });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setSavingStatus(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedApp) return;
    setSavingNotes(true);
    const { error } = await supabase
      .from('applications')
      .update({ notes: notesInput })
      .eq('id', selectedApp.id);
      
    if (!error) {
      setApplications(prev => prev.map(app => app.id === selectedApp.id ? { ...app, notes: notesInput } : app));
      setSelectedApp({ ...selectedApp, notes: notesInput });
      setNotification({ type: 'success', message: 'Notes saved!' });
      setTimeout(() => setNotification(null), 3000);
    } else {
      setNotification({ type: 'error', message: 'Failed to save notes: ' + error.message });
      setTimeout(() => setNotification(null), 5000);
    }
    setSavingNotes(false);
  };

  const handleSaveFeedback = async (appId: string, feedback: string) => {
    if (!feedback.trim()) {
      setNotification({ type: 'error', message: 'Please enter some feedback before sending.' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    setSavingFeedback(true);
    try {
      const { error } = await supabase
        .from('applications')
        .update({ consultant_feedback: feedback, updated_at: new Date().toISOString() })
        .eq('id', appId);
        
      if (!error) {
        setApplications(prev => prev.map(app => app.id === appId ? { ...app, consultant_feedback: feedback, updated_at: new Date().toISOString() } : app));
        if (selectedApp?.id === appId) setSelectedApp(prev => prev ? { ...prev, consultant_feedback: feedback, updated_at: new Date().toISOString() } : null);
        
        const appData = applications.find(a => a.id === appId);
        if (appData?.student_id) {
          const { error: notifError } = await supabase.from('notifications').insert({
            user_id: appData.student_id,
            type: 'sop_reviewed',
            title: 'SOP Feedback Available',
            body: `Consultant left some feedback on your ${appData.scholarship?.name} application.`,
          });
          if (notifError) console.error('Failed to send notification:', notifError);
        }
        setNotification({ type: 'success', message: 'Feedback sent to student!' });
        setTimeout(() => setNotification(null), 3000);
      } else {
        setNotification({ type: 'error', message: 'Failed to save feedback: ' + error.message });
        setTimeout(() => setNotification(null), 5000);
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: 'An unexpected error occurred.' });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setSavingFeedback(false);
    }
  };

  const filtered = applications.filter(app => {
    const matchesSearch = 
      app.student?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      app.scholarship?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesScholarship = selectedScholarship === 'all' || app.scholarship_id === selectedScholarship;
    return matchesSearch && matchesScholarship;
  });

  const getStageColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      case 'submitted': return 'bg-blue-100 text-blue-700';
      case 'interview': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {notification && (
        <div className={`p-4 rounded-xl border ${
          notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' :
          notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' :
          'bg-blue-50 border-blue-200 text-blue-700'
        }`}>
          {notification.message}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Application Tracking</h1>
          <p className="mt-1 text-sm text-gray-500">Manage student scholarship journeys through the pipeline</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search students or scholarships..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-brand-blue focus:border-brand-blue"
          />
        </div>
        <div className="flex gap-2">
          <select 
             className="bg-white border border-gray-200 text-gray-700 text-sm rounded-xl px-4 py-2 focus:ring-brand-blue shadow-sm cursor-pointer"
             value={selectedScholarship}
             onChange={(e) => setSelectedScholarship(e.target.value)}
          >
            <option value="all">All Scholarships</option>
            {[...new Set(applications.map(a => a.scholarship?.name))].map(name => (
              <option key={name} value={applications.find(a => a.scholarship?.name === name)?.scholarship_id}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4 pt-2">
        {STAGES.map(stage => (
          <div key={stage.id} className="flex flex-col gap-4 min-w-[200px]">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${stage.id === 'accepted' ? 'bg-green-500' : 'bg-brand-blue'}`} />
                {stage.label}
              </h3>
              <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {filtered.filter(a => a.status === stage.id).length}
              </span>
            </div>
            
            <div 
              className="flex-1 space-y-3 min-h-[500px] bg-gray-50/50 rounded-2xl p-2 border border-dashed border-gray-200 transition-colors"
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add('bg-blue-50', 'border-blue-200');
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove('bg-blue-50', 'border-blue-200');
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('bg-blue-50', 'border-blue-200');
                const appId = e.dataTransfer.getData('applicationId');
                if (appId && applications.find(a => a.id === appId)?.status !== stage.id) {
                  handleUpdateStatus(appId, stage.id);
                }
              }}
            >
              {loading ? (
                <div className="space-y-3 w-full">
                  {[1, 2].map(i => (
                    <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm h-32 flex flex-col justify-between animate-pulse">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <div className="h-6 w-6 bg-gray-100 rounded-full"></div>
                        <div className="h-4 bg-gray-100 rounded w-12"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {filtered.filter(a => a.status === stage.id).map(app => (
                    <div key={app.id} 
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('applicationId', app.id);
                      }}
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('select')) return;
                        setSelectedApp(app);
                        setNotesInput(app.notes || '');
                      }}
                      className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group cursor-grab active:cursor-grabbing w-full"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          app.package_tier === 'premium' ? 'bg-brand-gold/10 text-brand-gold' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {app.package_tier}
                        </span>
                      </div>
                      
                      <h4 className="font-bold text-gray-900 text-sm mb-1">{app.student?.full_name}</h4>
                      <p className="text-xs text-brand-blue font-medium mb-3 truncate max-w-full" title={app.scholarship?.name}>
                        {app.scholarship?.name}
                      </p>
                      
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                        <div className="flex -space-x-2">
                          <div className="h-6 w-6 rounded-full bg-brand-gold flex items-center justify-center text-[10px] font-bold text-white border-2 border-white ring-1 ring-gray-100">
                            {app.student?.full_name?.charAt(0)}
                          </div>
                          {app.consultant ? (
                            <div className="h-6 w-6 rounded-full bg-brand-blue flex items-center justify-center text-[10px] font-bold text-white border-2 border-white ring-1 ring-gray-100" title={`Assigned to ${app.consultant.full_name}`}>
                              {app.consultant.full_name.charAt(0)}
                            </div>
                          ) : (
                            <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center border-2 border-white ring-1 ring-gray-100">
                              <UserPlus className="w-3 h-3 text-gray-400" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          <select 
                            className="text-[10px] font-bold bg-transparent text-gray-400 hover:text-brand-blue cursor-pointer border-none p-0 focus:ring-0"
                            onChange={(e) => handleAssignConsultant(app.id, e.target.value)}
                            value={app.consultant_id || ''}
                          >
                            <option value="">Assign</option>
                            {consultants.map(c => (
                              <option key={c.id} value={c.id}>{c.full_name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                         <button 
                           onClick={() => handleUpdateStatus(app.id, STAGES[Math.min(STAGES.length-1, STAGES.findIndex(s => s.id === stage.id) + 1)].id)}
                           className="w-full py-1.5 bg-gray-50 hover:bg-brand-blue/5 text-gray-400 hover:text-brand-blue rounded-lg text-[10px] font-bold transition-colors flex items-center justify-center gap-1"
                         >
                            Next Stage <ChevronRight className="w-3 h-3" />
                         </button>
                      </div>
                    </div>
                  ))}
                  
                  {filtered.filter(a => a.status === stage.id).length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 opacity-30 w-full">
                      <Clock className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-xs font-medium">Empty</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      {/* Application Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden ring-1 ring-black/5">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-brand-blue rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-blue/20">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedApp.student?.full_name}</h3>
                  <p className="text-sm text-gray-500 uppercase tracking-wide font-medium">
                    {selectedApp.scholarship?.name} · {selectedApp.package_tier} Package
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedApp(null)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-all"
              >
                <AlertCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30 flex flex-col lg:flex-row gap-6">
              
              <div className="flex-1 space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Filter className="w-4 h-4 text-brand-blue" />
                    Statement of Purpose (SOP)
                  </h4>
                  {selectedApp.sop_content ? (
                    <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-700 leading-relaxed max-h-64 overflow-y-auto whitespace-pre-wrap border border-gray-100">
                      {selectedApp.sop_content}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No SOP submitted yet.</p>
                  )}
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h4 className="font-bold text-gray-900 mb-4">Uploaded Documents</h4>
                  {selectedApp.documents && selectedApp.documents.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedApp.documents.map(doc => (
                        <a key={doc.id} href={doc.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${doc.status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-brand-blue/10 text-brand-blue'}`}>
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{doc.file_name}</p>
                            <p className="text-xs text-gray-500 uppercase">{doc.document_type.replace('_', ' ')}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No documents linked to this application.</p>
                  )}
                </div>
              </div>

              <div className="lg:w-96 flex flex-col gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h4 className="font-bold text-gray-900 mb-4">Internal Admin Notes</h4>
                  <p className="text-xs text-gray-500 mb-2">Internal notes for the admin team only.</p>
                  <textarea 
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    className="w-full text-sm p-3 rounded-xl border border-gray-200 focus:ring-brand-blue focus:border-brand-blue min-h-[100px] mb-3"
                    placeholder="Internal reference notes..."
                  />
                  <button 
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="w-full py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-200 disabled:opacity-50 mb-6"
                  >
                    {savingNotes ? 'Saving...' : 'Save Internal Notes'}
                  </button>

                  <h4 className="font-bold text-gray-900 mb-4 pt-4 border-t border-gray-100">Student Feedback</h4>
                  <p className="text-xs text-brand-blue mb-2 font-medium">Visible to the student in their app tracker.</p>
                  <textarea 
                    value={selectedApp.consultant_feedback || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedApp({ ...selectedApp, consultant_feedback: val });
                    }}
                    className="w-full text-sm p-3 rounded-xl border border-gray-200 focus:ring-brand-blue focus:border-brand-blue min-h-[150px] mb-3"
                    placeholder="Constructive feedback for the student..."
                  />
                  <button 
                    onClick={() => handleSaveFeedback(selectedApp.id, selectedApp.consultant_feedback || '')}
                    disabled={savingFeedback}
                    className="w-full py-2 bg-brand-blue text-white rounded-xl text-sm font-bold shadow-sm hover:bg-blue-800 disabled:opacity-50 transition-all active:scale-[0.98]"
                  >
                    {savingFeedback ? 'Sending...' : 'Send to Student'}
                  </button>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h4 className="font-bold text-gray-900 mb-4">Quick Actions</h4>
                  <div className="space-y-2">
                    {STAGES.map(s => (
                       <button 
                          key={s.id}
                          onClick={() => handleUpdateStatus(selectedApp.id, s.id)}
                          disabled={savingStatus}
                          className={`w-full py-2.5 rounded-xl text-sm font-bold text-left px-4 border transition-all ${
                            selectedApp.status === s.id 
                              ? 'bg-brand-blue text-white border-brand-blue shadow-md' 
                              : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200'
                          } disabled:opacity-50`}
                       >
                          {savingStatus && selectedApp.status !== s.id ? 'Updating...' : `Move to ${s.label}`}
                       </button>
                    ))}
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
