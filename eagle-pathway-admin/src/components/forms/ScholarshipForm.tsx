'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Loader2, Image as ImageIcon } from 'lucide-react';

interface ScholarshipFormProps {
  scholarship?: any; // For editing
  onClose: () => void;
  onSuccess: () => void;
}

export default function ScholarshipForm({ scholarship, onClose, onSuccess }: ScholarshipFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: scholarship?.name || '',
    organization: scholarship?.organization || '',
    funding_details: scholarship?.funding_details || '',
    funding_type: scholarship?.funding_type || 'fully_funded',
    deadline: scholarship?.deadline || '',
    country: scholarship?.country || '',
    country_flag: scholarship?.country_flag || '🌍',
    degree_levels: scholarship?.degree_levels || ['undergraduate'],
    description: scholarship?.description || '',
    requirements: (scholarship?.requirements || []).join('\n'),
    website_url: scholarship?.website_url || ''
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

      const reqArray = formData.requirements.split('\n').map((s: string) => s.trim()).filter(Boolean);
      const dataToSave = {
        name: formData.name,
        organization: formData.organization,
        funding_details: formData.funding_details,
        funding_type: formData.funding_type,
        deadline: formData.deadline,
        country: formData.country,
        country_flag: formData.country_flag,
        degree_levels: formData.degree_levels,
        description: formData.description,
        requirements: reqArray,
        website_url: formData.website_url,
        is_active: true
      };

      const { error: saveError } = scholarship?.id 
        ? await supabase.from('scholarships').update(dataToSave).eq('id', scholarship.id)
        : await supabase.from('scholarships').insert([dataToSave]);

      if (saveError) {
        if (saveError.code === '42501') {
          throw new Error('Permission denied: You do not have permission to manage scholarships. Please ensure the admin RLS policies are applied.');
        }
        throw saveError;
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save scholarship');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-gray-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-xl h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
           <h2 className="text-xl font-bold text-gray-900">{scholarship ? 'Edit Scholarship' : 'Add Scholarship'}</h2>
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
                 <label className="block text-sm font-medium text-gray-700 mb-1">Scholarship Name</label>
                 <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" />
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
                 <input required type="text" name="organization" value={formData.organization} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" />
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Funding Details (e.g. £15,000)</label>
                 <input required type="text" name="funding_details" value={formData.funding_details} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" />
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Funding Type</label>
                 <select name="funding_type" value={formData.funding_type} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white">
                   <option value="fully_funded">Fully Funded</option>
                   <option value="partial">Partial</option>
                   <option value="stipend_only">Stipend Only</option>
                 </select>
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                 <div className="flex gap-2">
                    <input type="text" name="country_flag" value={formData.country_flag} onChange={handleChange} className="w-16 px-2 py-2.5 rounded-xl border border-gray-200 text-center" placeholder="🌍" />
                    <input required type="text" name="country" value={formData.country} onChange={handleChange} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200" placeholder="e.g. United Kingdom" />
                 </div>
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                 <input required type="date" name="deadline" value={formData.deadline} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200" />
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Degree Levels (Ctrl+Click to multi-select)</label>
                 <select 
                    multiple 
                    name="degree_levels" 
                    value={formData.degree_levels} 
                    onChange={(e) => {
                      const options = e.target.options;
                      const value = [];
                      for (let i = 0, l = options.length; i < l; i++) {
                        if (options[i].selected) {
                          value.push(options[i].value);
                        }
                      }
                      setFormData(prev => ({ ...prev, degree_levels: value }));
                    }} 
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white min-h-[100px]"
                 >
                   <option value="undergraduate">Undergraduate</option>
                   <option value="masters">Masters</option>
                   <option value="phd">PhD</option>
                   <option value="all">All Levels</option>
                 </select>
               </div>

               <div className="sm:col-span-2">
                 <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                 <input type="url" name="website_url" value={formData.website_url} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200" />
               </div>

               <div className="sm:col-span-2">
                 <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                 <textarea required name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 resize-none"></textarea>
               </div>

               <div className="sm:col-span-2">
                 <label className="block text-sm font-medium text-gray-700 mb-1">Requirements (one per line)</label>
                 <textarea required name="requirements" value={formData.requirements} onChange={handleChange} rows={4} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 resize-none"></textarea>
               </div>
             </div>
          </form>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
           <button onClick={onClose} type="button" className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
             Cancel
           </button>
           <button form="scholarship-form" type="submit" disabled={loading} className="flex items-center justify-center px-6 py-2.5 text-sm font-medium text-white bg-brand-blue rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-70 min-w-[140px]">
             {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : scholarship ? 'Update Scholarship' : 'Save Scholarship'}
           </button>
        </div>
      </div>
    </div>
  );
}
