'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Edit2, Trash2, ExternalLink, Search, Download } from 'lucide-react';
import ScholarshipForm from '@/components/forms/ScholarshipForm';
import { exportToCSV } from '@/utils/export';
import { useConfirm } from '@/components/ui/Feedback';
import { TableSkeleton } from '@/components/ui/TableSkeleton';

interface Scholarship {
  id: string;
  name: string;
  organization: string;
  funding_details: string;
  deadline: string;
  country: string;
  country_flag: string;
  degree_levels: string[];
  is_active: boolean;
}

export default function ScholarshipsPage() {
  const confirm = useConfirm();
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingScholarship, setEditingScholarship] = useState<Scholarship | null>(null);

  async function fetchScholarships() {
    setLoading(true);
    const { data, error } = await supabase
      .from('scholarships')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setScholarships(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchScholarships();
  }, []);

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Delete scholarship?',
      message: 'This permanently removes the scholarship. This cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    await supabase.from('scholarships').delete().eq('id', id);
    fetchScholarships();
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    await supabase
      .from('scholarships')
      .update({ is_active: !currentStatus })
      .eq('id', id);
    fetchScholarships();
  };

  const filtered = scholarships.filter(s => 
    (s.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (s.organization || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Scholarships</h1>
          <p className="mt-1 text-sm text-gray-500">Manage available scholarships</p>
        </div>
        <button 
          onClick={() => {
            setEditingScholarship(null);
            setIsFormOpen(true);
          }}
          className="flex items-center px-4 py-2 bg-brand-blue text-white rounded-xl shadow-md hover:bg-blue-800 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Scholarship
        </button>
      </div>

      {isFormOpen && (
        <ScholarshipForm 
          scholarship={editingScholarship}
          onClose={() => {
            setIsFormOpen(false);
            setEditingScholarship(null);
          }} 
          onSuccess={() => {
            setIsFormOpen(false);
            setEditingScholarship(null);
            fetchScholarships();
          }} 
        />
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gray-50/50">
           <div className="relative w-full max-w-md">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
               <Search className="h-4 w-4 text-gray-400" />
             </div>
             <input
               type="text"
               placeholder="Search scholarships..."
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-brand-blue focus:border-brand-blue"
             />
           </div>
           
           <button 
             onClick={() => exportToCSV(filtered, 'scholarships_export')}
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
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider & Amount</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <TableSkeleton cols={5} rows={5} avatarCol={false} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">No scholarships found.</td>
                </tr>
              ) : (
                filtered.map((scholarship) => (
                  <tr key={scholarship.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="text-xl mr-3">{scholarship.country_flag}</span>
                        <div className="text-sm font-medium text-gray-900">{scholarship.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{scholarship.organization}</div>
                      <div className="text-sm text-gray-500 font-medium text-brand-gold mt-1">{scholarship.funding_details}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 mb-1">
                        {scholarship.degree_levels?.map(level => (
                           <div key={level} className="text-[10px] uppercase font-bold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                             {level}
                           </div>
                        ))}
                      </div>
                      <div className="text-sm text-gray-500">{scholarship.country} • Due: {new Date(scholarship.deadline).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button 
                        onClick={() => toggleStatus(scholarship.id, scholarship.is_active)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize cursor-pointer transition-colors ${
                          scholarship.is_active ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {scholarship.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => {
                            setEditingScholarship(scholarship);
                            setIsFormOpen(true);
                          }}
                          className="text-gray-400 hover:text-brand-blue p-1 rounded-md hover:bg-blue-50 transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(scholarship.id)} className="text-gray-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
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
