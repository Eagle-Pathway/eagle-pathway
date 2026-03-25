'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Loader2 } from 'lucide-react';

interface ScholarshipFormProps {
  onClose: () => void;
  onSuccess: () => void;
  // Can extend to accept `initialData` for Edit mode later
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
    requirements: '', // We'll split this by comma into an array
    application_url: '',
    target_audience: 'Ethiopian Students'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Pre-process arrays
    const reqArray = formData.requirements.split(',').map(s => s.trim()).filter(Boolean);
    const audArray = formData.target_audience.split(',').map(s => s.trim()).filter(Boolean);

    try {
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

          <form id="scholarship-form" onSubmit={handleSubmit} className="space-y-5">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
               <div className="sm:col-span-2">
                 <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                 <input required type="text" name="title" value={formData.title} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" placeholder="e.g. Chevening Scholarship" />
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                 <input required type="text" name="provider" value={formData.provider} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" placeholder="e.g. UK Government" />
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                 <input required type="text" name="amount" value={formData.amount} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" placeholder="e.g. Fully Funded" />
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                 <input required type="text" name="country" value={formData.country} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" placeholder="e.g. United Kingdom" />
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                 <input required type="date" name="deadline" value={formData.deadline} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" />
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Degree Level</label>
                 <select required name="degree_level" value={formData.degree_level} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue bg-white">
                   <option>High School</option>
                   <option>Undergraduate</option>
                   <option>Masters</option>
                   <option>PhD</option>
                   <option>Post-Doctoral</option>
                   <option>Short Course</option>
                 </select>
               </div>

               <div className="sm:col-span-2">
                 <label className="block text-sm font-medium text-gray-700 mb-1">Application URL</label>
                 <input type="url" name="application_url" value={formData.application_url} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" placeholder="https://..." />
               </div>

               <div className="sm:col-span-2">
                 <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                 <textarea required name="description" value={formData.description} onChange={handleChange} rows={4} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue resize-none" placeholder="Details about this scholarship..."></textarea>
               </div>

               <div className="sm:col-span-2">
                 <label className="block text-sm font-medium text-gray-700 mb-1">Requirements (comma separated)</label>
                 <textarea required name="requirements" value={formData.requirements} onChange={handleChange} rows={2} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue resize-none" placeholder="e.g. High GPA, Leadership experience, English proficiency"></textarea>
               </div>
             </div>
          </form>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
           <button onClick={onClose} type="button" className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-colors">
             Cancel
           </button>
           <button form="scholarship-form" type="submit" disabled={loading} className="flex items-center justify-center px-6 py-2.5 text-sm font-medium text-white bg-brand-blue rounded-xl hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed min-w-[120px]">
             {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Scholarship'}
           </button>
        </div>
      </div>
    </div>
  );
}
