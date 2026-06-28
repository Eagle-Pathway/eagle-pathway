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
    if (r.file_path) await supabase.storage.from('resources').remove([r.file_path]);
    await supabase.from('resources').delete().eq('id', r.id);
    fetchResources();
  };

  const togglePublished = async (r: Resource) => {
    await supabase.from('resources').update({ is_published: !r.is_published }).eq('id', r.id);
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Resources</h1>
          <p className="mt-1 text-sm text-gray-500">Post guides, templates and downloads for students, tutors and parents</p>
        </div>
        <button onClick={openNew} className="flex items-center px-4 py-2 bg-brand-blue text-white rounded-xl shadow-md hover:bg-blue-800 transition-colors text-sm font-medium">
          <Plus className="w-4 h-4 mr-2" /> Add Resource
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-16">Loading…</div>
      ) : resources.length === 0 ? (
        <div className="text-center text-gray-500 py-16 border border-dashed rounded-2xl">No resources yet. Add the first one.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {resources.map(r => (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col">
              <div className="flex justify-between items-start gap-2">
                <div className="flex items-start gap-3">
                  <span className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg ${r.resource_type === 'file' ? 'bg-blue-50 text-brand-blue' : 'bg-green-50 text-green-600'}`}>
                    {r.resource_type === 'file' ? <FileText className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900">{r.title}</p>
                    <p className="text-sm text-gray-500">{r.category} · {AUDIENCE_LABEL[r.audience]}</p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${r.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {r.is_published ? 'Published' : 'Hidden'}
                </span>
              </div>
              {r.description && <p className="mt-3 text-sm text-gray-600 line-clamp-3">{r.description}</p>}
              <p className="mt-2 text-xs text-gray-400 truncate">{r.resource_type === 'file' ? (r.file_name || r.file_path) : r.external_url}</p>
              <div className="mt-4 flex gap-2 pt-3 border-t border-gray-100">
                <button onClick={() => openEdit(r)} className="flex items-center text-sm text-brand-blue hover:underline"><Edit2 className="w-4 h-4 mr-1" /> Edit</button>
                <button onClick={() => togglePublished(r)} className="flex items-center text-sm text-gray-600 hover:underline">
                  {r.is_published ? <><EyeOff className="w-4 h-4 mr-1" /> Hide</> : <><Eye className="w-4 h-4 mr-1" /> Publish</>}
                </button>
                <button onClick={() => handleDelete(r)} className="flex items-center text-sm text-red-600 hover:underline ml-auto"><Trash2 className="w-4 h-4 mr-1" /> Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isFormOpen && editing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{editing.id ? 'Edit Resource' : 'Add Resource'}</h2>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">File {editing.file_path ? '(replace)' : '*'}</label>
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 w-full px-3 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-brand-blue">
                    <Upload className="w-4 h-4" />
                    {pendingFile ? pendingFile.name : editing.file_name || 'Choose a PDF/DOCX to upload'}
                  </button>
                  <input ref={fileInputRef} type="file" className="hidden"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,image/*"
                    onChange={e => setPendingFile(e.target.files?.[0] ?? null)} />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Input label="Sort order" type="number" value={editing.sort_order != null ? String(editing.sort_order) : '0'} onChange={v => field('sort_order', v)} />
                <label className="flex items-center gap-2 text-sm text-gray-700 mt-6">
                  <input type="checkbox" checked={editing.is_published ?? true} onChange={e => field('is_published', e.target.checked)} />
                  Published
                </label>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
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
