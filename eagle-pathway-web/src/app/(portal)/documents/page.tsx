'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import {
  FolderOpen,
  Upload,
  FileText,
  File,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Filter,
} from 'lucide-react';

interface UserDoc {
  id: string;
  name: string;
  type?: string;
  category?: string;
  file_url: string;
  file_size?: number;
  created_at: string;
  status?: string;
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

  useEffect(() => {
    async function fetchDocuments() {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('student_id', user.id)
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
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

      // Upload to Supabase Storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, { upsert: true });

      if (storageError) throw storageError;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Save record in documents table
      const { data: docRecord, error: dbError } = await supabase
        .from('documents')
        .insert({
          student_id: user.id,
          name: file.name,
          file_url: publicUrl,
          file_size: file.size,
          category: uploadCategory,
          type: fileExt,
          status: 'verified',
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setDocuments([docRecord as any, ...documents]);
      setUploadSuccess(`Successfully uploaded "${file.name}" to your Document Vault.`);
      setTimeout(() => setUploadSuccess(null), 4000);
    } catch (err: any) {
      setUploadError('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (docId: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) return;

    try {
      await supabase.from('documents').delete().eq('id', docId);
      setDocuments(documents.filter((d) => d.id !== docId));
    } catch (err) {
      console.warn('Delete document error:', err);
    }
  };

  const filtered = documents.filter((d) => {
    if (selectedCategory === 'All Documents') return true;
    return d.category === selectedCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#0B2A5B] tracking-tight">
            Document Vault
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Securely store and organize your application transcripts, essays, test results, and recommendations.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
          <FolderOpen size={16} className="text-[#0B2A5B]" />
          <span>{documents.length} Files Stored</span>
        </div>
      </div>

      {uploadSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-xs font-bold animate-in fade-in duration-150">
          <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
          <span>{uploadSuccess}</span>
        </div>
      )}

      {uploadError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-800 text-xs font-bold animate-in fade-in duration-150">
          <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Drag & Drop Upload Zone Card */}
      <div className="bg-white rounded-3xl border-2 border-dashed border-slate-300 hover:border-[#0B2A5B] p-8 text-center transition-all bg-gradient-to-b from-white to-slate-50/50 shadow-sm">
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#0B2A5B] flex items-center justify-center mx-auto font-bold shadow-sm">
            {uploading ? (
              <Loader2 size={24} className="animate-spin text-[#C9A84C]" />
            ) : (
              <Upload size={24} />
            )}
          </div>

          <div>
            <h3 className="font-extrabold text-base text-slate-900">
              {uploading ? 'Uploading to Secure Cloud...' : 'Upload Academic Document'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Supports PDF, DOCX, PNG, or JPG (up to 15MB per file)
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <select
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value)}
              className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
            >
              {CATEGORIES.slice(1).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <label className="cursor-pointer px-5 py-2.5 rounded-xl bg-[#0B2A5B] hover:bg-[#1E4D9B] text-white text-xs font-bold shadow-md transition-all flex items-center gap-2">
              <Upload size={14} className="text-[#C9A84C]" />
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
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${isSelected
                ? 'bg-[#0B2A5B] text-white shadow-sm'
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
          <div className="w-10 h-10 border-4 border-[#0B2A5B]/20 border-t-[#0B2A5B] rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-semibold">Loading your vault documents...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200/80 p-8 space-y-3">
          <FileText size={38} className="mx-auto text-slate-300" />
          <h3 className="text-base font-bold text-slate-800">No Documents in This Category</h3>
          <p className="text-xs text-slate-500">
            Upload your files above to keep them accessible across all your applications.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((doc) => {
            const sizeInMB = doc.file_size
              ? (doc.file_size / (1024 * 1024)).toFixed(2) + ' MB'
              : 'Document';

            return (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0B2A5B] flex items-center justify-center font-bold flex-shrink-0">
                      <FileText size={20} />
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">
                      {doc.type || 'PDF'}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 truncate" title={doc.name}>
                      {doc.name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      {doc.category || 'General Document'}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">{sizeInMB}</span>
                  <div className="flex items-center gap-1.5">
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg text-slate-600 hover:text-[#0B2A5B] hover:bg-slate-100 transition-colors"
                      title="Download file"
                    >
                      <Download size={15} />
                    </a>
                    <button
                      onClick={() => handleDelete(doc.id, doc.name)}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete file"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
