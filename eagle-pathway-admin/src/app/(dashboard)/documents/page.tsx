'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { updateDocumentStatus } from '@/app/actions/documents';
import { 
  Search, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Clock, 
  Filter,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { exportToCSV } from '@/utils/export';

interface UserDocument {
  id: string;
  user_id: string;
  document_type: string;
  file_name: string;
  file_path?: string | null;
  file_url: string;
  status: 'pending' | 'approved' | 'rejected';
  uploaded_at: string;
  // Join
  user?: {
    full_name: string;
    email: string;
  };
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedDoc, setSelectedDoc] = useState<UserDocument | null>(null);
  const [reviewerNotes, setReviewerNotes] = useState('');

  const signDocumentUrl = async (document: UserDocument): Promise<UserDocument> => {
    const path = document.file_path || (!document.file_url?.startsWith('http') ? document.file_url : null);
    if (!path) return document;

    const { data } = await supabase.storage
      .from('documents')
      .createSignedUrl(path, 60 * 60);

    return data?.signedUrl
      ? { ...document, file_path: path, file_url: data.signedUrl }
      : document;
  };

  async function fetchDocuments() {
    setLoading(true);
    const { data, error } = await supabase
      .from('documents')
      .select('*, user:users(full_name, email)')
      .order('uploaded_at', { ascending: false });

    if (!error && data) {
      setDocuments(await Promise.all((data as UserDocument[]).map(signDocumentUrl)));
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const doc = documents.find(d => d.id === id);
      
      await updateDocumentStatus(
        id, 
        status, 
        status === 'rejected' ? reviewerNotes : null, 
        doc?.user_id,
        doc?.document_type,
        token
      );

      setDocuments(prev => prev.map(d => d.id === id ? { ...d, status, reviewer_notes: status === 'rejected' ? reviewerNotes : undefined } : d));
      
      if (selectedDoc?.id === id) {
        setSelectedDoc(null);
        setReviewerNotes('');
      }
    } catch (err: any) {
      alert('Failed to update document status: ' + err.message);
    }
  };

  const filtered = documents.filter(doc => {
    const matchesSearch = 
      doc.user?.full_name?.toLowerCase().includes(search.toLowerCase()) || 
      doc.file_name?.toLowerCase().includes(search.toLowerCase()) ||
      doc.document_type?.toLowerCase().includes(search.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || doc.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  
  const paginatedDocs = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatus]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-amber-100 text-amber-700';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Document Verification</h1>
          <p className="mt-1 text-sm text-gray-500">Review and verify student-uploaded documents</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
           <div className="relative w-full max-w-md">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
               <Search className="h-4 w-4 text-gray-400" />
             </div>
             <input
               type="text"
               placeholder="Search by student, file, or type..."
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-brand-blue focus:border-brand-blue"
             />
           </div>

           <div className="flex items-center gap-3 w-full lg:w-auto">
             <select 
               value={filterStatus}
               onChange={(e) => setFilterStatus(e.target.value)}
               className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-brand-blue focus:border-brand-blue block p-2 transition-colors cursor-pointer"
             >
               <option value="all">All Status</option>
               <option value="pending">Pending</option>
               <option value="approved">Approved</option>
               <option value="rejected">Rejected</option>
             </select>
             
             <button 
               onClick={() => exportToCSV(filtered, 'documents_export')}
               className="flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors text-sm font-medium whitespace-nowrap"
             >
               <Download className="w-4 h-4 mr-2 text-gray-500" />
               Export
             </button>
           </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document Details</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded At</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">Loading documents...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">No documents matching your criteria.</td></tr>
              ) : (
                paginatedDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-9 w-9 bg-brand-blue/10 rounded-full flex items-center justify-center text-brand-blue font-bold text-sm">
                          {doc.user?.full_name?.charAt(0) || 'S'}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{doc.user?.full_name || 'Anonymous Student'}</div>
                          <div className="text-xs text-gray-500">{doc.user?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{doc.file_name}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">{doc.document_type.replace('_', ' ')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getStatusStyle(doc.status)}`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                        {new Date(doc.uploaded_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setSelectedDoc(doc)}
                          className="p-1.5 text-gray-400 hover:text-brand-blue hover:bg-brand-blue/5 rounded-lg transition-all"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleUpdateStatus(doc.id, 'approved')}
                          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                          title="Approve"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleUpdateStatus(doc.id, 'rejected')}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Reject"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {!loading && filtered.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <div className="text-sm text-gray-400">
               Showing <span className="font-medium text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-gray-900">{Math.min(currentPage * itemsPerPage, filtered.length)}</span> of <span className="font-medium text-gray-900">{filtered.length}</span>
            </div>
            <div className="flex items-center gap-2">
               <button 
                 onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                 disabled={currentPage === 1}
                 className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:bg-white hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
               >
                 <ChevronLeft className="w-5 h-5" />
               </button>
               <span className="text-sm font-medium text-gray-700 bg-white border border-gray-200 px-3 py-1 rounded-lg shadow-sm">
                 {currentPage} / {totalPages}
               </span>
               <button 
                 onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                 disabled={currentPage === totalPages}
                 className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:bg-white hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
               >
                 <ChevronRight className="w-5 h-5" />
               </button>
            </div>
          </div>
        )}
      </div>

      {/* Verification Modal / Detail View */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden ring-1 ring-black/5">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-brand-blue rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-blue/20">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedDoc.file_name}</h3>
                  <p className="text-sm text-gray-500 uppercase tracking-wide font-medium">{selectedDoc.document_type.replace('_', ' ')} · {selectedDoc.user?.full_name}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setSelectedDoc(null);
                  setReviewerNotes('');
                }}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-all"
              >
                <XCircle className="w-7 h-7" />
              </button>
            </div>
            
            <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-white">
              <div className="flex-1 p-6 bg-gray-50 overflow-y-auto border-r border-gray-100">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 h-full flex items-center justify-center min-h-[300px]">
                   {/* In a real scenario, this would be an iframe or image viewer for selectedDoc.file_url */}
                   <div className="text-center">
                     <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                     <p className="text-gray-500 font-medium mb-4">Document Preview Unavailable</p>
                     <a 
                       href={selectedDoc.file_url} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="inline-flex items-center px-4 py-2 bg-brand-blue text-white rounded-xl shadow-md hover:bg-blue-800 transition-all font-medium"
                     >
                       <ExternalLink className="w-4 h-4 mr-2" />
                       Open Document
                     </a>
                   </div>
                </div>
              </div>
              
              <div className="w-full md:w-80 p-6 flex flex-col bg-white">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-brand-blue" />
                  Verification Appraisal
                </h4>
                
                <div className="space-y-4 flex-1">
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Student Notes</label>
                    <p className="text-sm text-gray-700 italic">"No notes provided by student."</p>
                  </div>
                  
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                    <label className="text-xs font-bold text-amber-600 uppercase tracking-wider block mb-2">Assessor Checklist</label>
                    <div className="space-y-2">
                      {['Legibility Check', 'Official Seal/Stamp', 'Validity Period', 'Matches Profile Name'].map(item => (
                        <div key={item} className="flex items-center gap-2">
                          <input type="checkbox" className="rounded text-brand-blue" />
                          <span className="text-sm text-gray-700">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-2">Admin Notes (Required for Rejection)</label>
                    <textarea 
                      value={reviewerNotes}
                      onChange={(e) => setReviewerNotes(e.target.value)}
                      placeholder="E.g., The scan is too blurry to read the university seal..."
                      className="w-full text-sm border-gray-200 rounded-xl p-3 focus:ring-brand-blue focus:border-brand-blue min-h-[100px] resize-none"
                    />
                  </div>
                </div>
                
                <div className="mt-8 flex gap-3">
                  <button 
                    onClick={() => handleUpdateStatus(selectedDoc.id, 'rejected')}
                    className="flex-1 py-3 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-all"
                  >
                    Reject
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus(selectedDoc.id, 'approved')}
                    className="flex-1 py-3 bg-brand-blue text-white rounded-2xl font-bold hover:bg-blue-800 transition-all shadow-lg shadow-brand-blue/20"
                  >
                    Approve
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
