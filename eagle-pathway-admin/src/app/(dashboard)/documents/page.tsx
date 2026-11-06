'use client';
import { useState, useEffect, useMemo } from 'react';
import { supabase, getAuthHeaders } from '@/lib/supabase';
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
  AlertCircle,
  Cloud,
  Trash2,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { exportToCSV } from '@/utils/export';
import { DocumentPreviewModal, PreviewableDocument } from '@/components/documents/DocumentPreviewModal';
import { getFreshSignedUrl } from '@/lib/storageHelper';

interface UserDocument extends PreviewableDocument {
  id: string;
  user_id: string;
  document_type: string;
  file_name: string;
  file_path?: string | null;
  file_url: string;
  cloud_url?: string | null;
  text_content?: string | null;
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
  const [purging, setPurging] = useState(false);

  // In-app Document Viewer Modal state
  const [previewDoc, setPreviewDoc] = useState<UserDocument | null>(null);

  const signDocumentUrl = async (document: UserDocument): Promise<UserDocument> => {
    if (document.cloud_url || document.file_path === 'cloud_link' || document.text_content) {
      return document;
    }
    const rawPath = document.file_path || document.file_url;
    const signedUrl = await getFreshSignedUrl(rawPath, 'documents');
    return {
      ...document,
      file_url: signedUrl || document.file_url,
    };
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
        }).then(() => { });
      }
    } else {
      toast('error', 'Failed to update document status.');
    }
  };

  const handlePurgeStorage = async () => {
    if (!window.confirm('⚠️ WARNING: This will permanently delete all raw binary files from Supabase Storage to reclaim 100% of storage space. Document metadata, Google Drive links, and text dossiers will remain intact. Proceed?')) {
      return;
    }

    setPurging(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/admin/storage/purge', {
        method: 'POST',
        headers,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast('success', data.message || 'Storage purged successfully! Usage is now 0 MB.');
        fetchDocuments();
      } else {
        toast('error', data.error || 'Failed to purge storage.');
      }
    } catch {
      toast('error', 'Network error while purging storage.');
    } finally {
      setPurging(false);
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
      if (b.pendingCount !== a.pendingCount) {
        return b.pendingCount - a.pendingCount;
      }
      return new Date(b.latestUpload).getTime() - new Date(a.latestUpload).getTime();
    });
  }, [filtered]);

  // Pagination for table view
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const paginatedDocs = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatus, viewMode]);

  // Statistics
  const stats = useMemo(() => {
    const total = documents.length;
    const pending = documents.filter(d => d.status === 'pending').length;
    const approved = documents.filter(d => d.status === 'approved').length;
    const rejected = documents.filter(d => d.status === 'rejected').length;
    return { total, pending, approved, rejected };
  }, [documents]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">Approved</span>;
      case 'rejected':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">Rejected</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">Pending Review</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Verification Pipeline</p>
          <div className="flex items-center space-x-3 mt-0.5">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Document Verification</h1>
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[11px] font-semibold rounded-full flex items-center">
              <Cloud className="w-3.5 h-3.5 mr-1" />
              Zero-Storage Mode
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Review, verify, and inspect student credential dossiers and Google Drive links.</p>
        </div>

        {/* View Toggle & Purge Storage Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePurgeStorage}
            disabled={purging}
            className="flex items-center px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 rounded-xl text-xs font-semibold transition-all shadow-xs disabled:opacity-50"
            title="Clean all binary files from Supabase storage"
          >
            {purging ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 mr-1.5" />}
            Purge Storage Bucket
          </button>

            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/70">
              <button
                onClick={() => setViewMode('dossiers')}
                className={`flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${viewMode === 'dossiers'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                <LayoutGrid className="w-3.5 h-3.5 mr-1.5" />
                Student Dossiers ({dossiers.length})
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'table'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                <List className="w-3.5 h-3.5 mr-1.5" />
                All Files ({filtered.length})
              </button>
            </div>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Documents</p>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">All Files</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">{stats.total}</span>
            <span className="text-xs text-slate-400 font-medium truncate">in vault</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Pending Review</p>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200/60">Action Req</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600 tracking-tight">{stats.pending}</span>
            <span className="text-xs text-slate-400 font-medium truncate">awaiting audit</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Verified &amp; Approved</p>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60">Live</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 tracking-tight">{stats.approved}</span>
            <span className="text-xs text-slate-400 font-medium truncate">credentials ok</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Storage Mode</p>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60">Cloud</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <Cloud className="w-5 h-5 text-emerald-600 inline" />
              <span>Zero-Storage</span>
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search by student name, email, file name, or type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-50/50 border border-slate-200 text-slate-700 text-xs rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue block p-2 transition-all cursor-pointer outline-none font-medium"
          >
            <option value="all">All Document Statuses</option>
            <option value="pending">Pending Review Only</option>
            <option value="approved">Approved / Verified Only</option>
            <option value="rejected">Rejected Only</option>
          </select>

          <button
            onClick={() => exportToCSV(filtered, 'documents_export')}
            className="flex items-center px-3.5 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl shadow-xs hover:bg-slate-50 transition-colors text-xs font-semibold whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center text-xs text-slate-500 shadow-xs">
          Loading student documents...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center text-xs text-slate-500 shadow-xs">
          No documents matching your search or filters.
        </div>
      ) : viewMode === 'dossiers' ? (
        /* 1. STUDENT DOSSIERS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {dossiers.map((dossier) => (
            <div
              key={dossier.userId}
              className="bg-white rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-xs transition-all p-5 flex flex-col justify-between group"
            >
              <div>
                {/* Dossier Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-brand-gold/15 text-brand-gold ring-1 ring-brand-gold/30 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {dossier.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 truncate">
                        {dossier.fullName}
                      </h3>
                      <p className="text-xs text-slate-500 truncate">{dossier.email}</p>
                      {dossier.phone && (
                        <p className="text-[11px] text-slate-400 truncate font-medium">{dossier.phone}</p>
                      )}
                    </div>
                  </div>

                  {/* Pending Badge */}
                  {dossier.pendingCount > 0 ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60 animate-pulse flex-shrink-0">
                      {dossier.pendingCount} Pending
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex-shrink-0">
                      All Verified
                    </span>
                  )}
                </div>

                {/* Documents Summary Grid */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Credentials ({dossier.documents.length})</span>
                    <span>Status</span>
                  </div>

                  {dossier.documents.map((doc) => {
                    const isCloud = Boolean(doc.cloud_url || doc.file_path === 'cloud_link');
                    return (
                      <div
                        key={doc.id}
                        onClick={() => setPreviewDoc(doc)}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50/70 border border-slate-200/70 cursor-pointer transition-colors group/item"
                      >
                        <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                          {isCloud ? (
                            <Cloud className="w-4 h-4 text-blue-500 flex-shrink-0 group-hover/item:scale-110 transition-transform" />
                          ) : (
                            <FileText className="w-4 h-4 text-brand-blue flex-shrink-0 group-hover/item:scale-110 transition-transform" />
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-800 truncate">
                              {doc.file_name || doc.document_type}
                            </p>
                            <p className="text-[10px] text-slate-400 uppercase font-medium">
                              {isCloud ? 'Google Drive Link' : doc.document_type.replace(/_/g, ' ')}
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
                          <Eye className="w-3.5 h-3.5 text-slate-400 group-hover/item:text-brand-blue" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dossier Action Footer */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">
                  Updated {new Date(dossier.latestUpload).toLocaleDateString()}
                </span>
                <button
                  onClick={() => setPreviewDoc(dossier.documents[0])}
                  className="px-3 py-1.5 bg-brand-blue text-white hover:bg-brand-blue/90 rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center"
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
        <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/70 border-b border-slate-200/80">
                <tr>
                  <th scope="col" className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                  <th scope="col" className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Credential Details</th>
                  <th scope="col" className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Submitted</th>
                  <th scope="col" className="relative px-5 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {paginatedDocs.map((doc) => {
                  const isCloud = Boolean(doc.cloud_url || doc.file_path === 'cloud_link');
                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-brand-gold/15 text-brand-gold ring-1 ring-brand-gold/30 flex items-center justify-center font-bold text-xs">
                            {doc.user?.full_name?.charAt(0) || 'S'}
                          </div>
                          <div className="ml-3">
                            <div className="text-xs font-bold text-slate-900">{doc.user?.full_name || 'Anonymous Student'}</div>
                            <div className="text-[11px] text-slate-500">{doc.user?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div
                          onClick={() => setPreviewDoc(doc)}
                          className="flex items-center cursor-pointer group"
                        >
                          {isCloud ? (
                            <Cloud className="w-4 h-4 text-blue-500 mr-2 group-hover:scale-110 transition-transform" />
                          ) : (
                            <FileText className="w-4 h-4 text-brand-blue mr-2 group-hover:scale-110 transition-transform" />
                          )}
                          <span className="text-xs font-semibold text-slate-900 group-hover:text-brand-blue transition-colors truncate max-w-[220px]">
                            {doc.file_name || doc.document_type}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider font-semibold">
                          {isCloud ? 'Google Drive Link' : doc.document_type.replace(/_/g, ' ')}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {getStatusBadge(doc.status)}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-500 font-medium">
                        <div className="flex items-center">
                          <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                          {new Date(doc.uploaded_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-right text-xs font-medium">
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="inline-flex items-center px-3 py-1.5 bg-brand-blue text-white hover:bg-brand-blue/90 rounded-xl text-xs font-semibold transition-all shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1.5" />
                          Inspect &amp; Verify
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* In-app Document Preview Modal */}
      <DocumentPreviewModal
        document={previewDoc}
        onClose={() => setPreviewDoc(null)}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
}
