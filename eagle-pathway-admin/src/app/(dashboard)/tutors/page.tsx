'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle, XCircle, Search, Shield, ShieldAlert, FileText, Download } from 'lucide-react';
import { exportToCSV } from '@/utils/export';
import { toggleTutorVerification } from '@/app/actions';
import { useAuthStore } from '@/store/useAuthStore';

interface TutorWithUser {
  user_id: string;
  is_verified: boolean;
  subjects: string[];
  education: string;
  location: string;
  hourly_rate: number;
  users: {
    full_name: string;
    phone: string;
    email: string;
  };
}

export default function TutorsPage() {
  const [tutors, setTutors] = useState<TutorWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  async function fetchTutors() {
    setLoading(true);
    // Join with users table
    const { data, error } = await supabase
      .from('tutors')
      .select(`
        user_id,
        is_verified,
        subjects,
        education,
        location,
        hourly_rate,
        users ( full_name, phone, email )
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      // @ts-ignore - Supabase types are generated dynamically
      setTutors(data as TutorWithUser[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchTutors();
  }, []);

  const { session } = useAuthStore();

  const toggleVerification = async (id: string, currentStatus: boolean) => {
    const willBeVerified = !currentStatus;
    setActionLoading(id);
    setActionError('');

    try {
      if (!session?.access_token) {
        throw new Error('You must be logged in to perform this action.');
      }

      await toggleTutorVerification(session.access_token, id, willBeVerified);
      await fetchTutors();
    } catch (error: any) {
      setActionError(error.message || 'Failed to update tutor.');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = tutors.filter(t => 
    t.users?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    t.users?.phone?.includes(search)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tutor Approvals</h1>
          <p className="mt-1 text-sm text-gray-500">Verify and manage tutor applications</p>
        </div>
      </div>

      {actionError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
          ⚠️ {actionError}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
           <div className="relative w-full max-w-md">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
               <Search className="h-4 w-4 text-gray-400" />
             </div>
             <input
               type="text"
               placeholder="Search by name or phone..."
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-brand-blue focus:border-brand-blue"
             />
           </div>
           
           <button 
             onClick={() => exportToCSV(
               filtered.map(t => ({ ID: t.user_id, Name: t.users?.full_name, Phone: t.users?.phone, Email: t.users?.email, Verified: t.is_verified, Rate: t.hourly_rate, Location: t.location })), 
               'tutors_export'
             )}
             className="flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors text-sm font-medium whitespace-nowrap"
           >
             <Download className="w-4 h-4 mr-2 text-gray-500" />
             Export CSV
           </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tutor Info</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expertise & Rate</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verification</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-500">Loading tutors...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-500">No tutors found.</td>
                </tr>
              ) : (
                filtered.map((tutor) => (
                  <tr key={tutor.user_id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-brand-blue font-bold text-sm">
                            {tutor.users?.full_name?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{tutor.users?.full_name || 'Unknown Name'}</div>
                          <div className="text-sm text-gray-500">{tutor.users?.phone || 'No phone'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">{tutor.subjects?.join(', ') || 'None listed'}</div>
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
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => toggleVerification(tutor.user_id, tutor.is_verified)}
                        disabled={actionLoading === tutor.user_id}
                        className={`inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors border disabled:opacity-50 disabled:cursor-not-allowed ${
                          tutor.is_verified 
                            ? 'text-red-700 bg-red-50 border-red-200 hover:bg-red-100' 
                            : 'text-green-700 bg-green-50 border-green-200 hover:bg-green-100'
                        }`}
                       >
                         {actionLoading === tutor.user_id ? 'Saving…' : tutor.is_verified ? 'Revoke' : 'Approve'}
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
