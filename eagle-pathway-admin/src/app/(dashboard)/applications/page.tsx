'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
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
  created_at: string;
  updated_at: string;
  // Joins
  student?: { full_name: string; email: string };
  scholarship?: { name: string; organization: string };
  consultant?: { full_name: string };
}

interface Consultant {
  id: string;
  full_name: string;
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // Fetch applications with joins
    const { data: appData, error: appError } = await supabase
      .from('applications')
      .select('*, student:users!applications_student_id_fkey(full_name, email), scholarship:scholarships(name, organization), consultant:users!applications_consultant_id_fkey(full_name)')
      .order('updated_at', { ascending: false });

    // Fetch potential consultants (users with role tutor or admin)
    const { data: consData } = await supabase
      .from('users')
      .select('id, full_name')
      .in('role', ['tutor', 'admin']);

    if (!appError && appData) setApplications(appData as Application[]);
    if (consData) setConsultants(consData as Consultant[]);
    
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
    const { error } = await supabase
      .from('applications')
      .update({ status })
      .eq('id', appId);

    if (!error) {
      setApplications(prev => prev.map(app => app.id === appId ? { ...app, status } : app));
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
            
            <div className="flex-1 space-y-3 min-h-[500px] bg-gray-50/50 rounded-2xl p-2 border border-dashed border-gray-200">
              {filtered.filter(a => a.status === stage.id).map(app => (
                <div key={app.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      app.package_tier === 'premium' ? 'bg-brand-gold/10 text-brand-gold' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {app.package_tier}
                    </span>
                    <button className="text-gray-300 group-hover:text-gray-500"><MoreVertical className="w-4 h-4" /></button>
                  </div>
                  
                  <h4 className="font-bold text-gray-900 text-sm mb-1">{app.student?.full_name}</h4>
                  <p className="text-xs text-brand-blue font-medium mb-3 truncate" title={app.scholarship?.name}>
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
              
              {!loading && filtered.filter(a => a.status === stage.id).length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 opacity-30">
                  <Clock className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-xs font-medium">Empty</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
