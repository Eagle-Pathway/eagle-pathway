'use client';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Feedback';
import { 
  Search, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Clock, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  Folder,
  LayoutGrid,
  List,
  User,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { exportToCSV } from '@/utils/export';
import { DocumentPreviewModal, PreviewableDocument } from '@/components/documents/DocumentPreviewModal';

interface UserDocument extends PreviewableDocument {
  id: string;
  user_id: string;
  document_type: string;
  file_name: string;
  file_path?: string | null;
  file_url: string;
  status: 'pending' | 'approved' | 'rejected';
  uploaded_at: string;
  reviewer_notes?: string | null;
  user?: {
    full_name: string;
    email: string;
    phone?: string;
  };
}

interface StudentDossier {
  userId: string;
  fullName: string;
  email: string;
  phone?: string;
  documents: UserDocument[];
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  latestUpload: string;
}

export default function DocumentsPage() {
  const toast = useToast();
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'dossiers' | 'table'>('dossiers');
  
  // In-app Document Viewer Modal state
  const [previewDoc, setPreviewDoc] = useState<UserDocument | null>(null);

  // Selected Student for Dossier Focus View
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const signDocumentUrl = async (document: UserDocument): Promise<UserDocument> => {
    const path = document.file_path || (!document.file_url?.startsWith('http') ? document.file_url : null);
    if (!path) return document;

    const { data } = await supabase.storage
      .from('documents')
      .createSignedUrl(path, 60 * 60 * 24 * 7);

    return data?.signedUrl
      ? { ...document, file_path: path, file_url: data.signedUrl }
      : document;
  };

  async function fetchDocuments() {
    setLoading(true);
    const { data, error } = await supabase
      .from('documents')
      .select('*, user:users(full_name, email, phone)')
      .order('uploaded_at', { ascending: false });

    if (!error && data) {
      setDocuments(await Promise.all((data as UserDocument[]).map(signDocumentUrl)));
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected', notes?: string) => {
    const targetDoc = documents.find(d => d.id === id);
    const { error } = await supabase
      .from('documents')
      .update({ status, reviewer_notes: status === 'rejected' ? notes || null : null })
      .eq('id', id);

    if (!error) {
      setDocuments(prev => prev.map(doc => 
        doc.id === id 
          ? { ...doc, status, reviewer_notes: status === 'rejected' ? notes || undefined : undefined } 
          : doc
      ));
      
      toast('success', status === 'approved' ? 'Document verified and approved!' : 'Document marked as rejected.');

      // Also send notification to the student
      if (targetDoc?.user_id) {
        supabase.from('notifications').insert({
          user_id: targetDoc.user_id,
          type: status === 'approved' ? 'document_approved' : 'document_rejected',
          title: status === 'approved' ? 'Document Verified 🟢' : 'Document Rejected 🔴',
          body: status === 'approved' 
            ? `Your ${targetDoc.document_type?.replace(/_/g, ' ')} has been verified.` 
            : `Your ${targetDoc.document_type?.replace(/_/g, ' ')} was rejected. Reason: ${notes || 'Please upload a clearer copy.'}`,
        }).then(() => {});
      }
    } else {
      toast('error', 'Failed to update document status.');
    }
  };

  const filtered = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = 
        doc.user?.full_name?.toLowerCase().includes(search.toLowerCase()) || 
        doc.user?.email?.toLowerCase().includes(search.toLowerCase()) || 
        doc.file_name?.toLowerCase().includes(search.toLowerCase()) ||
        doc.document_type?.toLowerCase().includes(search.toLowerCase());
      
      const matchesFilter = filterStatus === 'all' || doc.status === filterStatus;
      
      return matchesSearch && matchesFilter;
    });
  }, [documents, search, filterStatus]);

  // Group filtered documents by Student
  const dossiers = useMemo(() => {
    const map = new Map<string, StudentDossier>();

    filtered.forEach(doc => {
      const uId = doc.user_id || 'unknown';
      if (!map.has(uId)) {
        map.set(uId, {
          userId: uId,
          fullName: doc.user?.full_name || 'Anonymous Student',
          email: doc.user?.email || 'No email',
          phone: doc.user?.phone,
          documents: [],
          pendingCount: 0,
          approvedCount: 0,
          rejectedCount: 0,
          latestUpload: doc.uploaded_at,
        });
      }

      const dossier = map.get(uId)!;
      dossier.documents.push(doc);
      if (doc.status === 'pending') dossier.pendingCount++;
      else if (doc.status === 'approved') dossier.approvedCount++;
      else if (doc.status === 'rejected') dossier.rejectedCount++;
      
      if (new Date(doc.uploaded_at) > new Date(dossier.latestUpload)) {
        dossier.latestUpload = doc.uploaded_at;
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      // Prioritize dossiers with pending documents first
      if (b.pendingCount !== a.pendingCount) {
        return b.pendingCount - a.pendingCount;
      }
      return new Date(b.latestUpload).getTime() - new Date(a.latestUpload).getTime();
    });
  }, [filtered]);

  // Pagination for table view
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  
  const paginatedDocs = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatus, viewMode]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': 
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Approved</span>;
      case 'rejected': 
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Rejected</span>;
      default: 
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Pending Review</span>;
    }
  };

  const selectedDossier = dossiers.find(d => d.userId === selectedStudentId);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Document Verification</h1>
          <p className="mt-1 text-sm text-gray-500">Review, verify, and inspect student credential dossiers</p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center p-1 bg-gray-100/80 rounded-xl border border-gray-200">
          <button
            onClick={() => setViewMode('dossiers')}
            className={`flex items-center px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'dossiers'
                ? 'bg-white text-brand-blue shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <LayoutGrid className="w-4 h-4 mr-1.5" />
            Student Dossiers ({dossiers.length})
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'table'
                ? 'bg-white text-brand-blue shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <List className="w-4 h-4 mr-1.5" />
            All Files ({filtered.length})
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by student name, email, file name, or type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-blue focus:border-brand-blue outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-brand-blue focus:border-brand-blue block p-2 transition-colors cursor-pointer outline-none"
          >
            <option value="all">All Document Statuses</option>
            <option value="pending">Pending Review Only</option>
            <option value="approved">Approved / Verified Only</option>
            <option value="rejected">Rejected Only</option>
          </select>
          
          <button 
            onClick={() => exportToCSV(filtered, 'documents_export')}
            className="flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-colors text-sm font-medium whitespace-nowrap"
          >
            <Download className="w-4 h-4 mr-2 text-gray-500" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-sm text-gray-500">
          Loading student documents...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-sm text-gray-500">
          No documents matching your search or filters.
        </div>
      ) : viewMode === 'dossiers' ? (
        /* 1. STUDENT DOSSIERS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {dossiers.map((dossier) => (
            <div
              key={dossier.userId}
              className="bg-white rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between group"
            >
              <div>
                {/* Dossier Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue font-bold text-base flex-shrink-0">
                      {dossier.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-gray-900 truncate">
                        {dossier.fullName}
                      </h3>
                      <p className="text-xs text-gray-500 truncate">{dossier.email}</p>
                      {dossier.phone && (
                        <p className="text-[11px] text-gray-400 truncate">{dossier.phone}</p>
                      )}
                    </div>
                  </div>

                  {/* Pending Badge */}
                  {dossier.pendingCount > 0 ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse flex-shrink-0">
                      {dossier.pendingCount} Pending
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex-shrink-0">
                      All Verified
                    </span>
                  )}
                </div>

                {/* Documents Summary Grid */}
                <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Uploaded Credentials ({dossier.documents.length})</span>
                    <span>Status</span>
                  </div>

                  {dossier.documents.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => setPreviewDoc(doc)}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 border border-gray-100 cursor-pointer transition-colors group/item"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                        <FileText className="w-4 h-4 text-brand-blue flex-shrink-0 group-hover/item:scale-110 transition-transform" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">
                            {doc.file_name}
                          </p>
                          <p className="text-[10px] text-gray-400 uppercase font-medium">
                            {doc.document_type.replace(/_/g, ' ')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 flex-shrink-0">
                        {doc.status === 'approved' ? (
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="Approved" />
                        ) : doc.status === 'rejected' ? (
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" title="Rejected" />
                        ) : (
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" title="Pending Review" />
                        )}
                        <Eye className="w-3.5 h-3.5 text-gray-400 group-hover/item:text-brand-blue" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dossier Action Footer */}
              <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[11px] text-gray-400">
                  Updated {new Date(dossier.latestUpload).toLocaleDateString()}
                </span>
                <button
                  onClick={() => setPreviewDoc(dossier.documents[0])}
                  className="px-3.5 py-1.5 bg-brand-blue/10 hover:bg-brand-blue hover:text-white text-brand-blue rounded-xl text-xs font-bold transition-all shadow-sm flex items-center"
                >
                  <Eye className="w-3.5 h-3.5 mr-1.5" />
                  Quick Review
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* 2. FLAT ALL FILES LIST TABLE VIEW */
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/80">
                <tr>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Student</th>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Document Details</th>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Uploaded At</th>
                  <th scope="col" className="relative px-6 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {paginatedDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-9 w-9 bg-brand-blue/10 rounded-xl flex items-center justify-center text-brand-blue font-bold text-sm">
                          {doc.user?.full_name?.charAt(0) || 'S'}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-bold text-gray-900">{doc.user?.full_name || 'Anonymous Student'}</div>
                          <div className="text-xs text-gray-500">{doc.user?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div 
                        onClick={() => setPreviewDoc(doc)}
                        className="flex items-center cursor-pointer group"
                      >
                        <FileText className="w-4 h-4 text-brand-blue mr-2 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-semibold text-gray-900 group-hover:text-brand-blue transition-colors truncate max-w-[220px]">
                          {doc.file_name}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5 uppercase tracking-wider font-semibold">
                        {doc.document_type.replace(/_/g, ' ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(doc.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                        {new Date(doc.uploaded_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => setPreviewDoc(doc)}
                        className="inline-flex items-center px-3 py-1.5 bg-brand-blue/10 text-brand-blue hover:bg-brand-blue hover:text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1.5" />
                        Inspect & Verify
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Table Pagination */}
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
      )}

      {/* Dedicated In-App Document Previewer Modal */}
      {previewDoc && (
        <DocumentPreviewModal
          document={previewDoc}
          onClose={() => setPreviewDoc(null)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </div>
  );
}
