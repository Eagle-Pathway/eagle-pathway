'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Plus, Edit2, Trash2, Eye, EyeOff, Image as ImageIcon, Video,
  Send, ExternalLink, Upload, AlertCircle, Play, Mic, CheckCircle2
} from 'lucide-react';
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
  avatar_url?: string | null;
  screenshot_url?: string | null;
  video_url?: string | null;
  telegram_voice_url?: string | null;
  is_published: boolean;
  created_at?: string;
}

const EMPTY: Partial<SuccessStory> = {
  student_name: '',
  scholarship_name: '',
  country: '',
  country_flag: '🌍',
  year: new Date().getFullYear(),
  quote: '',
  story: '',
  screenshot_url: '',
  video_url: '',
  telegram_voice_url: '',
  is_published: true,
};

export default function SuccessStoriesPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<SuccessStory> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function fetchStories() {
    setLoading(true);
    const { data, error } = await supabase
      .from('success_stories')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setStories(data as SuccessStory[]);
    setLoading(false);
  }

  useEffect(() => {
    fetchStories();
  }, []);

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Delete this success story?',
      message: 'It will no longer appear to students in the mobile app. This cannot be undone.',
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
    const { error } = await supabase
      .from('success_stories')
      .update({ is_published: !s.is_published })
      .eq('id', s.id);
    if (error) {
      toast('error', error.message || 'Failed to update visibility.');
      return;
    }
    toast('success', `Story is now ${!s.is_published ? 'published' : 'hidden'}.`);
    fetchStories();
  };

  const openNew = () => {
    setEditing({ ...EMPTY });
    setIsFormOpen(true);
  };

  const openEdit = (s: SuccessStory) => {
    setEditing({ ...s });
    setIsFormOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast('error', 'Only image files (PNG, JPG, WEBP) are allowed for screenshots.');
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop() || 'png';
      const fileName = `dm_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `success-stories-screenshots/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('scholarship-images')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from('scholarship-images')
        .getPublicUrl(filePath);

      field('screenshot_url', publicUrlData.publicUrl);
      toast('success', 'Message screenshot uploaded successfully!');
    } catch (err: any) {
      toast('error', err?.message || 'Failed to upload screenshot image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.student_name?.trim() || !editing.scholarship_name?.trim() || !editing.quote?.trim()) {
      toast('error', 'Student name, scholarship name, and quote are required.');
      return;
    }

    setSaving(true);
    const payload = {
      student_name: editing.student_name.trim(),
      scholarship_name: editing.scholarship_name.trim(),
      country: editing.country?.trim() || null,
      country_flag: editing.country_flag?.trim() || '🌍',
      year: editing.year ? Number(editing.year) : null,
      quote: editing.quote.trim(),
      story: editing.story?.trim() || null,
      screenshot_url: editing.screenshot_url?.trim() || null,
      video_url: editing.video_url?.trim() || null,
      telegram_voice_url: editing.telegram_voice_url?.trim() || null,
      is_published: editing.is_published ?? true,
    };

    const res = editing.id
      ? await supabase.from('success_stories').update(payload).eq('id', editing.id)
      : await supabase.from('success_stories').insert(payload);

    setSaving(false);
    if (res.error) {
      toast('error', res.error.message);
      return;
    }
    toast('success', editing.id ? 'Story updated.' : 'Story added.');
    setIsFormOpen(false);
    setEditing(null);
    fetchStories();
  };

  const field = (k: keyof SuccessStory, v: any) =>
    setEditing(e => ({ ...(e || {}), [k]: v }));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Success Stories</h1>
          <p className="mt-1 text-sm text-gray-500">
            Curate student testimonials, message screenshots, TikTok videos, and Telegram voice notes
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center px-4 py-2.5 bg-brand-blue text-white rounded-xl shadow-md hover:bg-blue-800 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Story
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-16">Loading…</div>
      ) : stories.length === 0 ? (
        <div className="text-center text-gray-500 py-16 border border-dashed rounded-2xl bg-white">
          No success stories yet. Click "Add Story" to create the first one.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {stories.map(s => (
            <div key={s.id} className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-shadow">
              <div>
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <p className="font-bold text-gray-900 text-base">{s.student_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {s.scholarship_name}{s.year ? ` · ${s.year}` : ''}{s.country ? ` · ${s.country_flag || '🌍'} ${s.country}` : ''}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${s.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {s.is_published ? 'Published' : 'Hidden'}
                  </span>
                </div>

                <p className="mt-3 text-sm text-gray-800 italic bg-gray-50 p-3 rounded-xl border border-gray-100">
                  “{s.quote}”
                </p>

                {s.story && (
                  <p className="mt-2 text-xs text-gray-600 line-clamp-2">
                    {s.story}
                  </p>
                )}

                {/* Media Badges & Previews */}
                <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-gray-100">
                  {s.screenshot_url && (
                    <a
                      href={s.screenshot_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-purple-50 text-purple-700 rounded-lg border border-purple-200 font-medium hover:bg-purple-100"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>DM Screenshot</span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  )}

                  {s.video_url && (
                    <a
                      href={s.video_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-rose-50 text-rose-700 rounded-lg border border-rose-200 font-medium hover:bg-rose-100"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>TikTok / Video</span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  )}

                  {s.telegram_voice_url && (
                    <a
                      href={s.telegram_voice_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-sky-50 text-sky-700 rounded-lg border border-sky-200 font-medium hover:bg-sky-100"
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span>Telegram Voice</span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  )}
                </div>
              </div>

              <div className="mt-4 flex gap-3 pt-3 border-t border-gray-100">
                <button
                  onClick={() => openEdit(s)}
                  className="flex items-center text-xs font-semibold text-brand-blue hover:underline"
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                </button>
                <button
                  onClick={() => togglePublished(s)}
                  className="flex items-center text-xs font-semibold text-gray-600 hover:underline"
                >
                  {s.is_published ? (
                    <><EyeOff className="w-3.5 h-3.5 mr-1" /> Hide</>
                  ) : (
                    <><Eye className="w-3.5 h-3.5 mr-1" /> Publish</>
                  )}
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="flex items-center text-xs font-semibold text-red-600 hover:underline ml-auto"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {isFormOpen && editing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto p-6 shadow-2xl border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {editing.id ? 'Edit Success Story' : 'Add Success Story'}
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Add student background, message screenshots, and TikTok/Telegram media links
            </p>

            <div className="space-y-4">
              <Input label="Student Name *" placeholder="e.g. Samuel Bekele" value={editing.student_name || ''} onChange={v => field('student_name', v)} />
              <Input label="Scholarship Name *" placeholder="e.g. DAAD Helmut-Schmidt Programme" value={editing.scholarship_name || ''} onChange={v => field('scholarship_name', v)} />

              <div className="grid grid-cols-3 gap-3">
                <Input label="Study Destination Country" placeholder="e.g. Germany" value={editing.country || ''} onChange={v => field('country', v)} />
                <Input label="Country Flag" placeholder="e.g. 🇩🇪" value={editing.country_flag || ''} onChange={v => field('country_flag', v)} />
                <Input label="Award Year" type="number" placeholder="2027" value={editing.year != null ? String(editing.year) : ''} onChange={v => field('year', v)} />
              </div>

              <Textarea label="Student Quote / Key Takeaway *" placeholder="“Eagle Pathway transformed my SOP and guided me every step of the way...”" value={editing.quote || ''} onChange={v => field('quote', v)} rows={2} />
              <Textarea label="Full Success Story (Optional)" placeholder="Detailed student narrative, journey, and advice for future applicants..." value={editing.story || ''} onChange={v => field('story', v)} rows={3} />

              {/* RICH MEDIA SECTION */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Evidence & Social Proof Links</span>
                  </h3>
                  <span className="text-[10px] text-brand-blue font-semibold bg-blue-50 px-2 py-0.5 rounded-full">
                    Zero Video Storage Used
                  </span>
                </div>

                {/* 1. Message Screenshot (DM) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
                    <span>Screenshot of Message / DM (Image)</span>
                  </label>

                  <div className="flex gap-2 items-center">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="px-3 py-2 text-xs font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-gray-600" />
                      <span>{uploadingImage ? 'Uploading...' : 'Upload Image'}</span>
                    </button>
                    <input
                      type="url"
                      placeholder="Or paste screenshot image URL..."
                      value={editing.screenshot_url || ''}
                      onChange={e => field('screenshot_url', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white focus:ring-1 focus:ring-brand-blue focus:outline-none"
                    />
                  </div>

                  {editing.screenshot_url && (
                    <div className="mt-2 flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200">
                      <img
                        src={editing.screenshot_url}
                        alt="Screenshot Preview"
                        className="w-12 h-12 object-cover rounded border"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-gray-800 truncate">Screenshot Attached</p>
                        <a
                          href={editing.screenshot_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-brand-blue hover:underline flex items-center gap-0.5"
                        >
                          <span>View Full Image</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={() => field('screenshot_url', '')}
                        className="text-xs text-red-500 hover:text-red-700 font-bold px-2"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. TikTok / Video Link */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Video className="w-3.5 h-3.5 text-rose-600" />
                      <span>Video Link (TikTok / YouTube / Reel)</span>
                    </span>
                    {editing.video_url && (
                      <a
                        href={editing.video_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-rose-600 font-semibold hover:underline flex items-center gap-0.5"
                      >
                        <Play className="w-2.5 h-2.5" /> Test Video
                      </a>
                    )}
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.tiktok.com/@eaglespathway/video/... or YouTube link"
                    value={editing.video_url || ''}
                    onChange={e => field('video_url', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white focus:ring-1 focus:ring-brand-blue focus:outline-none"
                  />
                </div>

                {/* 3. Telegram Voice Message / Post Link */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Mic className="w-3.5 h-3.5 text-sky-600" />
                      <span>Voice Message / Telegram Post Link</span>
                    </span>
                    {editing.telegram_voice_url && (
                      <a
                        href={editing.telegram_voice_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-sky-600 font-semibold hover:underline flex items-center gap-0.5"
                      >
                        <Send className="w-2.5 h-2.5" /> Test Link
                      </a>
                    )}
                  </label>
                  <input
                    type="url"
                    placeholder="https://t.me/eaglepathway/123 (Voice note or message link)"
                    value={editing.telegram_voice_url || ''}
                    onChange={e => field('telegram_voice_url', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white focus:ring-1 focus:ring-brand-blue focus:outline-none"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-gray-800 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={editing.is_published ?? true}
                  onChange={e => field('is_published', e.target.checked)}
                  className="rounded text-brand-blue"
                />
                <span>Published (Visible to students in the mobile app)</span>
              </label>
            </div>

            <div className="flex gap-2 mt-6 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => { setIsFormOpen(false); setEditing(null); }}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving || uploadingImage}
                className="flex-1 py-2.5 rounded-xl bg-brand-blue text-white text-xs font-semibold hover:bg-blue-800 disabled:opacity-60 shadow-xs"
              >
                {saving ? 'Saving…' : 'Save Story'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Input({ label, value, onChange, placeholder = '', type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-brand-blue focus:outline-none"
      />
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder = '', rows = 2 }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1">{label}</label>
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-brand-blue focus:outline-none"
      />
    </div>
  );
}
