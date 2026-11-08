'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import {
  FolderOpen,
  Upload,
  FileText,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react';

interface UserDoc {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_url: string;
  document_type: string;
  file_size?: number;
  mime_type?: string;
  status?: string;
  created_at: string;
}

const CATEGORIES = [
  'All Documents',
  'Academic Transcripts',
  'Statement of Purpose (SOP)',
  'Letters of Recommendation',
  'Resume / CV',
  'Passport & Identity',
  'Language & Test Scores',
];

export default function DocumentVaultPage() {
  const { user } = useAuthStore();
  const [documents, setDocuments] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All Documents');

  // Upload State
  const [uploading, setUploading] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('Academic Transcripts');
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<UserDoc | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchDocuments() {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setDocuments((data as any) || []);
      } catch (err) {
        console.warn('Fetch documents error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDocuments();
  }, [user?.id]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const fileExt = file.name.split('.').pop() || 'pdf';
      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `${user.id}/${Date.now()}_${cleanName}`;

      // Upload file to Supabase Storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, { upsert: true });

      if (storageError) throw storageError;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Save document record to database
      const { data: docRecord, error: dbError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_path: filePath,
          file_url: publicUrl,
          file_size: file.size,
          document_type: uploadCategory,
          mime_type: file.type || fileExt,
          status: 'verified',
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setDocuments([docRecord as any, ...documents]);
      setUploadSuccess(`Successfully uploaded "${file.name}" to your Document Vault.`);
      setTimeout(() => setUploadSuccess(null), 4000);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload document. Please check your network and try again.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.file_path) {
        await supabase.storage.from('documents').remove([deleteTarget.file_path]).catch(() => {});
      }
      await supabase.from('documents').delete().eq('id', deleteTarget.id);
      setDocuments(documents.filter((d) => d.id !== deleteTarget.id));
      setDeleteTarget(null);
      setUploadSuccess(`"${deleteTarget.file_name}" removed from vault.`);
      setTimeout(() => setUploadSuccess(null), 3000);
    } catch (err) {
      console.warn('Delete document error:', err);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = documents.filter((d) => {
    if (selectedCategory === 'All Documents') return true;
    return d.document_type === selectedCategory;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-blue mb-1">
            <FolderOpen size={14} />
            <span>Vault Storage</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Document Vault
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Securely store and organize your application transcripts, essays, test results, and recommendations.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-blue-50 text-brand-blue text-[11px] font-semibold border border-blue-200/60 self-start sm:self-auto">
          <FolderOpen size={13} />
          <span>{documents.length} Files Stored</span>
        </div>
      </div>

      {uploadSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center gap-2.5 text-emerald-800 text-xs font-semibold animate-in fade-in duration-150">
          <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
          <span>{uploadSuccess}</span>
        </div>
      )}

      {uploadError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2.5 animate-in fade-in duration-150">
          <AlertCircle size={16} className="text-rose-500 flex-shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Drag & Drop Upload Zone Card */}
      <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 hover:border-brand-blue p-6 md:p-8 text-center transition-all shadow-xs">
        <div className="max-w-md mx-auto space-y-3.5">
          <div className="w-11 h-11 rounded-full bg-blue-50 text-brand-blue flex items-center justify-center mx-auto shadow-xs">
            {uploading ? (
              <Loader2 size={20} className="animate-spin text-brand-gold" />
            ) : (
              <Upload size={20} />
            )}
          </div>

          <div>
            <h3 className="font-semibold text-sm text-slate-900">
              {uploading ? 'Uploading to Secure Cloud...' : 'Upload Academic Document'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Supports PDF, DOCX, PNG, or JPG (up to 15MB per file)
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
            <select
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
            >
              {CATEGORIES.slice(1).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <label className="cursor-pointer px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5">
              <Upload size={13} />
              <span>Choose File</span>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Documents List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-brand-blue/20 border-t-brand-blue rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading your vault documents...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl border border-slate-200/80 p-8 space-y-3 shadow-xs">
          <FileText size={36} className="mx-auto text-slate-300" />
          <h3 className="text-sm font-bold text-slate-800">No Documents in This Category</h3>
          <p className="text-xs text-slate-500">
            Upload your files above to keep them accessible across all your applications.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doc) => {
            const sizeInMB = doc.file_size
              ? (doc.file_size / (1024 * 1024)).toFixed(2) + ' MB'
              : 'Document';

            const ext = doc.file_name.split('.').pop()?.toUpperCase() || 'FILE';

            return (
              <div
                key={doc.id}
                className="bg-white rounded-xl border border-slate-200/80 p-4 md:p-5 shadow-xs hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center font-bold flex-shrink-0">
                      <FileText size={18} />
                    </div>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold uppercase">
                      {ext}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-semibold text-xs text-slate-900 truncate" title={doc.file_name}>
                      {doc.file_name}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                      {doc.document_type || 'General Document'}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">{sizeInMB}</span>
                  <div className="flex items-center gap-1">
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-slate-600 hover:text-brand-blue hover:bg-slate-100 transition-colors"
                      title="Download file"
                    >
                      <Download size={14} />
                    </a>
                    <button
                      onClick={() => setDeleteTarget(doc)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete file"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-sm w-full p-5 shadow-lg space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <h3 className="font-bold text-sm text-slate-900">Remove Document</h3>
              <button
                onClick={() => setDeleteTarget(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-slate-900">{deleteTarget.file_name}</strong> from your document vault?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
              >
                {deleting && <Loader2 size={12} className="animate-spin" />}
                <span>{deleting ? 'Deleting...' : 'Delete Permanently'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
