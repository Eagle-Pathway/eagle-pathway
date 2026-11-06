'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Edit2, Trash2, Eye, EyeOff, FileText, Link2, Upload } from 'lucide-react';
import { useToast, useConfirm } from '@/components/ui/Feedback';

type Audience = 'all' | 'student' | 'tutor' | 'parent';
type ResourceType = 'file' | 'link';

interface Resource {
  id: string;
  title: string;
  description: string | null;
  category: string;
  audience: Audience;
  resource_type: ResourceType;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  external_url: string | null;
  is_published: boolean;
  sort_order: number;
  download_count: number;
}

const EMPTY: Partial<Resource> = {
  title: '', description: '', category: 'General', audience: 'all',
  resource_type: 'link', external_url: '', is_published: true, sort_order: 0,
};

const AUDIENCES: Audience[] = ['all', 'student', 'tutor', 'parent'];
const AUDIENCE_LABEL: Record<Audience, string> = {
  all: 'Everyone', student: 'Students', tutor: 'Tutors', parent: 'Parents',
};

export default function ResourcesPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Resource> | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function fetchResources() {
    setLoading(true);
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .order('category', { ascending: true })
      .order('sort_order', { ascending: true });
    if (!error && data) setResources(data as Resource[]);
    setLoading(false);
  }

  useEffect(() => { fetchResources(); }, []);

  const handleDelete = async (r: Resource) => {
    const ok = await confirm({
      title: 'Delete this resource?',
      message: 'It will no longer appear in the app. This cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    // Best-effort: remove the stored file too, then the row.
    if (r.file_path) {
      const { error: storageError } = await supabase.storage.from('resources').remove([r.file_path]);
      if (storageError) {
        toast('error', `Failed to remove file: ${storageError.message}`);
        return;
      }
    }
    const { error } = await supabase.from('resources').delete().eq('id', r.id);
    if (error) {
      toast('error', error.message || 'Failed to delete resource.');
      return;
    }
    toast('success', 'Resource deleted.');
    fetchResources();
  };

  const togglePublished = async (r: Resource) => {
    const { error } = await supabase.from('resources').update({ is_published: !r.is_published }).eq('id', r.id);
    if (error) {
      toast('error', error.message || 'Failed to update visibility.');
      return;
    }
    toast('success', `Resource is now ${!r.is_published ? 'published' : 'hidden'}.`);
    fetchResources();
  };

  const openNew = () => { setEditing({ ...EMPTY }); setPendingFile(null); setIsFormOpen(true); };
  const openEdit = (r: Resource) => { setEditing(r); setPendingFile(null); setIsFormOpen(true); };

  const field = (k: keyof Resource, v: string | number | boolean) =>
    setEditing(e => ({ ...(e || {}), [k]: v }));

  const save = async () => {
    if (!editing) return;
    if (!editing.title?.trim()) { toast('error', 'Title is required.'); return; }

    const type = (editing.resource_type as ResourceType) || 'link';
    if (type === 'link' && !editing.external_url?.trim()) {
      toast('error', 'A link resource needs a URL.');
      return;
    }
    if (type === 'file' && !pendingFile && !editing.file_path) {
      toast('error', 'A file resource needs an uploaded file.');
      return;
    }

    setSaving(true);
    try {
      // Carry over existing file metadata, overriding it if a new file was picked.
      let filePath = editing.file_path ?? null;
      let fileName = editing.file_name ?? null;
      let fileSize = editing.file_size ?? null;
      let mimeType = editing.mime_type ?? null;

      if (type === 'file' && pendingFile) {
        const safeName = pendingFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `${(editing.category || 'general').toLowerCase().replace(/[^a-z0-9]/g, '-')}/${Date.now()}_${safeName}`;
        const { error: upErr } = await supabase.storage
          .from('resources')
          .upload(path, pendingFile, { contentType: pendingFile.type || 'application/octet-stream', upsert: false });
        if (upErr) { toast('error', `Upload failed: ${upErr.message}`); setSaving(false); return; }
        filePath = path;
        fileName = pendingFile.name;
        fileSize = pendingFile.size;
        mimeType = pendingFile.type || null;
      }

      const payload = {
        title: editing.title.trim(),
        description: editing.description?.trim() || null,
        category: editing.category?.trim() || 'General',
        audience: (editing.audience as Audience) || 'all',
        resource_type: type,
        // Keep the columns consistent with the chosen type so the DB CHECK passes.
        file_path: type === 'file' ? filePath : null,
        file_name: type === 'file' ? fileName : null,
        file_size: type === 'file' ? fileSize : null,
        mime_type: type === 'file' ? mimeType : null,
        external_url: type === 'link' ? editing.external_url!.trim() : null,
        is_published: editing.is_published ?? true,
        sort_order: editing.sort_order ? Number(editing.sort_order) : 0,
      };

      const res = editing.id
        ? await supabase.from('resources').update(payload).eq('id', editing.id)
        : await supabase.from('resources').insert(payload);

      if (res.error) { toast('error', res.error.message); setSaving(false); return; }
      toast('success', editing.id ? 'Resource updated.' : 'Resource added.');
      setIsFormOpen(false);
      setEditing(null);
      setPendingFile(null);
      fetchResources();
    } finally {
      setSaving(false);
    }
  };

  const currentType = (editing?.resource_type as ResourceType) || 'link';

  const totalPublished = resources.filter(r => r.is_published).length;
  const totalDownloads = resources.reduce((acc, r) => acc + (r.download_count || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Academic Vault &amp; Downloads</p>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Academic Resources &amp; Guides</h1>
          <p className="text-xs text-slate-500 mt-1">Post guides, templates, and downloadable materials for students, tutors, and parents.</p>
        </div>
          <button onClick={openNew} className="flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg shadow-xs hover:bg-slate-800 transition-all text-xs font-semibold">
            <Plus className="w-4 h-4 mr-1.5" /> Add Resource
          </button>
      </div>

      {/* Overview-style KPI Metric Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Materials</p>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-brand-blue border border-blue-200/60">Vault</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">{resources.length}</span>
            <span className="text-xs text-slate-400 font-medium">files &amp; guides</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Published Live</p>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60">Public</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">{totalPublished}</span>
            <span className="text-xs text-slate-400 font-medium">accessible</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Downloads</p>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200/60">Engagement</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">{totalDownloads}</span>
            <span className="text-xs text-slate-400 font-medium">student downloads</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-slate-400 py-16 text-xs">Loading resources…</div>
      ) : resources.length === 0 ? (
        <div className="text-center text-slate-500 py-16 border border-dashed border-slate-200 rounded-xl bg-white text-xs">No resources yet. Add the first one.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {resources.map(r => (
            <div key={r.id} className="bg-white rounded-xl border border-slate-200/80 p-5 flex flex-col shadow-xs hover:border-slate-300 transition-all">
              <div className="flex justify-between items-start gap-2">
                <div className="flex items-start gap-3">
                  <span className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl ${r.resource_type === 'file' ? 'bg-blue-50 text-brand-blue' : 'bg-emerald-50 text-emerald-600'}`}>
                    {r.resource_type === 'file' ? <FileText className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                  </span>
                  <div>
                    <p className="font-semibold text-xs text-slate-900">{r.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{r.category} · {AUDIENCE_LABEL[r.audience]}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-slate-400 font-medium" title="Opens / downloads">↓ {r.download_count ?? 0}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${r.is_published ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                    {r.is_published ? 'Published' : 'Hidden'}
                  </span>
                </div>
              </div>
              {r.description && <p className="mt-3 text-xs text-slate-600 line-clamp-3 leading-relaxed">{r.description}</p>}
              <p className="mt-2 text-[11px] text-slate-400 truncate">{r.resource_type === 'file' ? (r.file_name || r.file_path) : r.external_url}</p>
              <div className="mt-4 flex gap-3 pt-3 border-t border-slate-100 text-xs">
                <button onClick={() => openEdit(r)} className="flex items-center font-semibold text-brand-blue hover:underline"><Edit2 className="w-3.5 h-3.5 mr-1" /> Edit</button>
                <button onClick={() => togglePublished(r)} className="flex items-center font-medium text-slate-600 hover:underline">
                  {r.is_published ? <><EyeOff className="w-3.5 h-3.5 mr-1" /> Hide</> : <><Eye className="w-3.5 h-3.5 mr-1" /> Publish</>}
                </button>
                <button onClick={() => handleDelete(r)} className="flex items-center font-medium text-rose-600 hover:underline ml-auto"><Trash2 className="w-3.5 h-3.5 mr-1" /> Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isFormOpen && editing && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Resource Editor</p>
              <h2 className="text-base font-bold text-slate-900">{editing.id ? 'Edit Resource' : 'Add Resource'}</h2>
            </div>
            <div className="space-y-3">
              <Input label="Title *" value={editing.title || ''} onChange={v => field('title', v)} />
              <Textarea label="Description" value={editing.description || ''} onChange={v => field('description', v)} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Category" value={editing.category || ''} onChange={v => field('category', v)} />
                <Select label="Audience" value={editing.audience || 'all'} onChange={v => field('audience', v)}
                  options={AUDIENCES.map(a => ({ value: a, label: AUDIENCE_LABEL[a] }))} />
              </div>
              <Select label="Type" value={currentType} onChange={v => field('resource_type', v)}
                options={[{ value: 'link', label: 'External link' }, { value: 'file', label: 'Uploaded file' }]} />

              {currentType === 'link' ? (
                <Input label="URL *" value={editing.external_url || ''} onChange={v => field('external_url', v)} placeholder="https://…" />
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">File {editing.file_path ? '(replace)' : '*'}</label>
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 w-full px-3 py-2 border border-dashed border-slate-300 rounded-xl text-xs text-slate-600 hover:border-brand-blue bg-slate-50/50">
                    <Upload className="w-4 h-4 text-slate-400" />
                    {pendingFile ? pendingFile.name : editing.file_name || 'Choose a PDF/DOCX to upload'}
                  </button>
                  <input ref={fileInputRef} type="file" className="hidden"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,image/*"
                    onChange={e => setPendingFile(e.target.files?.[0] ?? null)} />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Input label="Sort order" type="number" value={editing.sort_order != null ? String(editing.sort_order) : '0'} onChange={v => field('sort_order', v)} />
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 mt-6">
                  <input type="checkbox" checked={editing.is_published ?? true} onChange={e => field('is_published', e.target.checked)} className="rounded border-slate-300 text-brand-blue" />
                  Published
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button onClick={() => { setIsFormOpen(false); setEditing(null); setPendingFile(null); }} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-brand-blue text-white font-medium disabled:opacity-60">{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Input({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue focus:outline-none" />
    </div>
  );
}

function Textarea({ label, value, onChange, rows = 2 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue focus:outline-none" />
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-blue focus:outline-none">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
