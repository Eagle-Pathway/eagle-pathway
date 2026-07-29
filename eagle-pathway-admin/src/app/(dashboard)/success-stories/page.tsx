'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import { useToast, useConfirm } from '@/components/ui/Feedback';

interface SuccessStory {
  id: string;
  student_name: string;
  scholarship_name: string;
  country: string | null;
  country_flag: string | null;
  year: number | null;
  quote: string;
  story: string | null;
  is_published: boolean;
}

const EMPTY: Partial<SuccessStory> = {
  student_name: '', scholarship_name: '', country: '', country_flag: '', year: undefined,
  quote: '', story: '', is_published: true,
};

export default function SuccessStoriesPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<SuccessStory> | null>(null);
  const [saving, setSaving] = useState(false);

  async function fetchStories() {
    setLoading(true);
    const { data, error } = await supabase
      .from('success_stories')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setStories(data);
    setLoading(false);
  }

  useEffect(() => { fetchStories(); }, []);

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Delete this success story?',
      message: 'It will no longer appear to students. This cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    const { error } = await supabase.from('success_stories').delete().eq('id', id);
    if (error) {
      toast('error', error.message || 'Failed to delete success story.');
      return;
    }
    toast('success', 'Success story deleted.');
    fetchStories();
  };

  const togglePublished = async (s: SuccessStory) => {
    const { error } = await supabase.from('success_stories').update({ is_published: !s.is_published }).eq('id', s.id);
    if (error) {
      toast('error', error.message || 'Failed to update visibility.');
      return;
    }
    toast('success', `Story is now ${!s.is_published ? 'published' : 'hidden'}.`);
    fetchStories();
  };

  const openNew = () => { setEditing({ ...EMPTY }); setIsFormOpen(true); };
  const openEdit = (s: SuccessStory) => { setEditing(s); setIsFormOpen(true); };

  const save = async () => {
    if (!editing) return;
    if (!editing.student_name?.trim() || !editing.scholarship_name?.trim() || !editing.quote?.trim()) {
      toast('error', 'Student name, scholarship and quote are required.');
      return;
    }
    setSaving(true);
    const payload = {
      student_name: editing.student_name.trim(),
      scholarship_name: editing.scholarship_name.trim(),
      country: editing.country?.trim() || null,
      country_flag: editing.country_flag?.trim() || null,
      year: editing.year ? Number(editing.year) : null,
      quote: editing.quote.trim(),
      story: editing.story?.trim() || null,
      is_published: editing.is_published ?? true,
    };
    const res = editing.id
      ? await supabase.from('success_stories').update(payload).eq('id', editing.id)
      : await supabase.from('success_stories').insert(payload);
    setSaving(false);
    if (res.error) { toast('error', res.error.message); return; }
    toast('success', editing.id ? 'Story updated.' : 'Story added.');
    setIsFormOpen(false);
    setEditing(null);
    fetchStories();
  };

  const field = (k: keyof SuccessStory, v: string | number | boolean) =>
    setEditing(e => ({ ...(e || {}), [k]: v }));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Success Stories</h1>
          <p className="mt-1 text-sm text-gray-500">Curate "how I won" stories students see in the app</p>
        </div>
        <button onClick={openNew} className="flex items-center px-4 py-2 bg-brand-blue text-white rounded-xl shadow-md hover:bg-blue-800 transition-colors text-sm font-medium">
          <Plus className="w-4 h-4 mr-2" /> Add Story
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-16">Loading…</div>
      ) : stories.length === 0 ? (
        <div className="text-center text-gray-500 py-16 border border-dashed rounded-2xl">No stories yet. Add the first one.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {stories.map(s => (
            <div key={s.id} className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <p className="font-semibold text-gray-900">{s.student_name}</p>
                  <p className="text-sm text-gray-500">{s.scholarship_name}{s.year ? ` · ${s.year}` : ''}{s.country ? ` · ${s.country_flag || ''} ${s.country}` : ''}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${s.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {s.is_published ? 'Published' : 'Hidden'}
                </span>
              </div>
              <p className="mt-3 text-sm text-gray-700 italic">“{s.quote}”</p>
              {s.story && <p className="mt-2 text-sm text-gray-500 line-clamp-3">{s.story}</p>}
              <div className="mt-4 flex gap-2 pt-3 border-t border-gray-100">
                <button onClick={() => openEdit(s)} className="flex items-center text-sm text-brand-blue hover:underline"><Edit2 className="w-4 h-4 mr-1" /> Edit</button>
                <button onClick={() => togglePublished(s)} className="flex items-center text-sm text-gray-600 hover:underline">
                  {s.is_published ? <><EyeOff className="w-4 h-4 mr-1" /> Hide</> : <><Eye className="w-4 h-4 mr-1" /> Publish</>}
                </button>
                <button onClick={() => handleDelete(s.id)} className="flex items-center text-sm text-red-600 hover:underline ml-auto"><Trash2 className="w-4 h-4 mr-1" /> Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isFormOpen && editing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{editing.id ? 'Edit Story' : 'Add Story'}</h2>
            <div className="space-y-3">
              <Input label="Student name *" value={editing.student_name || ''} onChange={v => field('student_name', v)} />
              <Input label="Scholarship name *" value={editing.scholarship_name || ''} onChange={v => field('scholarship_name', v)} />
              <div className="grid grid-cols-3 gap-3">
                <Input label="Country" value={editing.country || ''} onChange={v => field('country', v)} />
                <Input label="Flag (emoji)" value={editing.country_flag || ''} onChange={v => field('country_flag', v)} />
                <Input label="Year" type="number" value={editing.year != null ? String(editing.year) : ''} onChange={v => field('year', v)} />
              </div>
              <Textarea label="Quote * (headline)" value={editing.quote || ''} onChange={v => field('quote', v)} />
              <Textarea label="Story (longer)" value={editing.story || ''} onChange={v => field('story', v)} rows={4} />
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={editing.is_published ?? true} onChange={e => field('is_published', e.target.checked)} />
                Published (visible to students)
              </label>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => { setIsFormOpen(false); setEditing(null); }} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-brand-blue text-white font-medium disabled:opacity-60">{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Input({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue focus:outline-none" />
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
