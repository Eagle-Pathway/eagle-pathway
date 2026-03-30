'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Loader2, Image as ImageIcon } from 'lucide-react';

interface ScholarshipFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ScholarshipForm({ onClose, onSuccess }: ScholarshipFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    provider: '',
    amount: '',
    deadline: '',
    country: '',
    degree_level: 'Undergraduate',
    description: '',
    requirements: '',
    application_url: '',
    target_audience: 'Ethiopian Students'
  });

  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return null;
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `scholarship-thumbnails/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('scholarship-images')
      .upload(filePath, imageFile);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('scholarship-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let publicImageUrl = '';
      if (imageFile) {
        publicImageUrl = await uploadImage() || '';
      }

      const reqArray = formData.requirements.split(',').map(s => s.trim()).filter(Boolean);
      const audArray = formData.target_audience.split(',').map(s => s.trim()).filter(Boolean);

      const { error: insertError } = await supabase.from('scholarships').insert([{
        title: formData.title,
        provider: formData.provider,
        amount: formData.amount,
        deadline: formData.deadline,
        country: formData.country,
        degree_level: formData.degree_level,
        description: formData.description,
        requirements: reqArray,
        application_url: formData.application_url,
        target_audience: audArray,
        image_url: publicImageUrl,
        is_active: true
      }]);

      if (insertError) throw insertError;
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create scholarship');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-gray-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-xl h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
           <h2 className="text-xl font-bold text-gray-900">Add Scholarship</h2>
           <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5" />
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm">
               {error}
            </div>
          )}

          <form id="scholarship-form" onSubmit={handleSubmit} className="space-y-6">
             <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Scholarship Thumbnail</label>
                <div className="flex items-center gap-4 p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-brand-blue/30 transition-colors">
                  <div className="h-20 w-20 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100 overflow-hidden">
                    {imageFile ? (
                      <img src={URL.createObjectURL(imageFile)} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] text-gray-500 mb-2">Upload a high-quality JPG/PNG image.</p>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageChange}
                      className="text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-brand-blue/10 file:text-brand-blue hover:file:bg-brand-blue/20 cursor-pointer" 
                    />
                  </div>
                </div>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
               <div className="sm:col-span-2">
                 <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                 <input required type="text" name="title" value={formData.title} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" />
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                 <input required type="text" name="provider" value={formData.provider} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" />
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                 <input required type="text" name="amount" value={formData.amount} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" />
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                 <input required type="text" name="country" value={formData.country} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" />
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                 <input required type="date" name="deadline" value={formData.deadline} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200" />
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Degree Level</label>
                 <select required name="degree_level" value={formData.degree_level} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white">
                   <option>High School</option>
                   <option>Undergraduate</option>
                   <option>Masters</option>
                   <option>PhD</option>
                 </select>
               </div>

               <div className="sm:col-span-2">
                 <label className="block text-sm font-medium text-gray-700 mb-1">Application URL</label>
                 <input type="url" name="application_url" value={formData.application_url} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200" />
               </div>

               <div className="sm:col-span-2">
                 <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                 <textarea required name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 resize-none"></textarea>
               </div>

               <div className="sm:col-span-2">
                 <label className="block text-sm font-medium text-gray-700 mb-1">Requirements (comma separated)</label>
                 <textarea required name="requirements" value={formData.requirements} onChange={handleChange} rows={2} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 resize-none"></textarea>
               </div>
             </div>
          </form>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
           <button onClick={onClose} type="button" className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
             Cancel
           </button>
           <button form="scholarship-form" type="submit" disabled={loading} className="flex items-center justify-center px-6 py-2.5 text-sm font-medium text-white bg-brand-blue rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-70 min-w-[140px]">
             {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Scholarship'}
           </button>
        </div>
      </div>
    </div>
  );
}
