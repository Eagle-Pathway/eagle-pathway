'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Send, Users, Bell, Loader2, CheckCircle2 } from 'lucide-react';

export default function NotificationsPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    audience: 'all', // all, student, tutor
    type: 'announcement'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // 1. Fetch target audience users
      let query = supabase.from('users').select('id');
      if (formData.audience !== 'all') {
        query = query.eq('role', formData.audience);
      }
      
      const { data: targetUsers, error: userError } = await query;
      
      if (userError) throw userError;
      if (!targetUsers || targetUsers.length === 0) {
        throw new Error('No users found for this audience.');
      }

      // 2. Prepare notifications array
      const notifications = targetUsers.map(u => ({
        user_id: u.id,
        title: formData.title,
        message: formData.message,
        type: formData.type,
        is_read: false
      }));

      // 3. Insert in batches if many users (Supabase allows around 1000 items per insert)
      const { error: insertError } = await supabase.from('notifications').insert(notifications);
      
      if (insertError) throw insertError;

      setSuccess(`Successfully broadcasted to ${targetUsers.length} users! 🎉`);
      setFormData({ title: '', message: '', audience: 'all', type: 'announcement' });
      
    } catch (err: any) {
      setError(err.message || 'Failed to send broadcast');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Push Notifications</h1>
          <p className="mt-1 text-sm text-gray-500">Broadcast announcements to students and tutors directly to their mobile app.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mt-8">
        <div className="p-8 border-b border-gray-50">
          <div className="flex items-center mb-6">
             <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center mr-4 text-purple-600">
               <Bell className="h-6 w-6" />
             </div>
             <div>
               <h2 className="text-xl font-bold text-gray-900">Create Broadcast</h2>
               <p className="text-sm text-gray-500">Draft a new in-app notification</p>
             </div>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50/80 border border-red-200 text-red-600 rounded-xl text-sm flex items-center">
               <div className="flex-1">{error}</div>
            </div>
          )}
          
          {success && (
            <div className="mb-6 p-4 bg-green-50/80 border border-green-200 text-green-700 rounded-xl text-sm flex items-center">
               <CheckCircle2 className="w-5 h-5 mr-2" />
               <div className="flex-1 font-medium">{success}</div>
            </div>
          )}

          <form onSubmit={handleBroadcast} className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="md:col-span-2">
                 <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notification Title</label>
                 <input 
                   required type="text" name="title" value={formData.title} onChange={handleChange} 
                   className="w-full px-4 py-3 bg-gray-50/50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 transition-colors font-medium text-gray-900 placeholder-gray-400" 
                   placeholder="e.g. New Engineering Scholarship Available!" 
                 />
               </div>

               <div className="md:col-span-2">
                 <label className="block text-sm font-semibold text-gray-700 mb-1.5">Message Content</label>
                 <textarea 
                   required name="message" value={formData.message} onChange={handleChange} rows={4} 
                   className="w-full px-4 py-3 bg-gray-50/50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 transition-colors resize-none text-gray-900 placeholder-gray-400" 
                   placeholder="Detailed message that appears when they open the notification..."
                 ></textarea>
               </div>

               <div>
                 <label className="block text-sm font-semibold text-gray-700 mb-1.5">Target Audience</label>
                 <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <Users className="h-4 w-4 text-gray-400" />
                   </div>
                   <select 
                     name="audience" value={formData.audience} onChange={handleChange} 
                     className="w-full pl-10 pr-4 py-3 bg-gray-50/50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 appearance-none text-gray-900"
                   >
                     <option value="all">Everyone (Students & Tutors)</option>
                     <option value="student">Students Only</option>
                     <option value="tutor">Tutors Only</option>
                   </select>
                 </div>
               </div>

               <div>
                 <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notification Type</label>
                 <select 
                   name="type" value={formData.type} onChange={handleChange} 
                   className="w-full px-4 py-3 bg-gray-50/50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 appearance-none text-gray-900"
                 >
                   <option value="announcement">Announcement</option>
                   <option value="alert">System Alert</option>
                   <option value="promotion">Promotion / Update</option>
                 </select>
               </div>
             </div>

             <div className="pt-4 flex justify-end">
               <button 
                 type="submit" disabled={loading || !formData.title || !formData.message} 
                 className="flex items-center justify-center px-8 py-3.5 text-sm font-semibold text-white bg-purple-600 rounded-xl hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-600/50 shadow-lg shadow-purple-600/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed transform active:scale-95 m-1"
               >
                 {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                 Broadcast Now
               </button>
             </div>
          </form>

        </div>
      </div>
    </div>
  );
}
