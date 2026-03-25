'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { DollarSign, TrendingUp, CreditCard, Wallet, FileText, Search, Loader2 } from 'lucide-react';

interface TutorFinancials {
  user_id: string;
  hourly_rate: number;
  total_sessions: number;
  users: {
    full_name: string;
    phone: string;
  };
}

export default function FinancePage() {
  const [tutors, setTutors] = useState<TutorFinancials[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchFinancials();
  }, []);

  const fetchFinancials = async () => {
    setLoading(true);
    const { data: tutorData, error: tutorError } = await supabase
      .from('tutors')
      .select(`
        user_id,
        hourly_rate,
        total_sessions,
        users ( full_name, phone )
      `)
      .order('total_sessions', { ascending: false });

    if (!tutorError && tutorData) {
      // @ts-ignore
      setTutors(tutorData as TutorFinancials[]);
    }
    setLoading(false);
  };

  const totalPlatformVolume = tutors.reduce((acc, t) => acc + (t.hourly_rate * (t.total_sessions || 0)), 0);
  const estimatedPlatformFee = totalPlatformVolume * 0.15; // Assume platform takes 15% cut
  const totalPayoutsDue = totalPlatformVolume - estimatedPlatformFee;

  const filtered = tutors.filter(t => 
    t.users?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Finance & Payouts</h1>
          <p className="mt-1 text-sm text-gray-500">Track platform revenue and tutor commissions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Total Volume</h3>
            <div className="p-2 bg-blue-50 rounded-lg text-brand-blue"><TrendingUp className="w-5 h-5" /></div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">{totalPlatformVolume.toLocaleString()} ETB</div>
            <p className="text-xs text-gray-400 mt-2">All time session revenue processed</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow border-t-4 border-t-green-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Platform Revenue (15%)</h3>
            <div className="p-2 bg-green-50 rounded-lg text-green-600"><DollarSign className="w-5 h-5" /></div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">{estimatedPlatformFee.toLocaleString()} ETB</div>
            <p className="text-xs text-green-600 font-medium mt-2 flex items-center"><TrendingUp className="w-3 h-3 mr-1" /> +12% from last month</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Tutor Payouts</h3>
            <div className="p-2 bg-amber-50 rounded-lg text-brand-gold"><Wallet className="w-5 h-5" /></div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">{totalPayoutsDue.toLocaleString()} ETB</div>
            <p className="text-xs text-gray-400 mt-2">Owed to verified tutors</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-8">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
           <h2 className="font-bold text-gray-900 ml-2">Tutor Balances</h2>
           <div className="relative w-full max-w-xs">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
               <Search className="h-4 w-4 text-gray-400" />
             </div>
             <input
               type="text"
               placeholder="Search tutors..."
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-brand-blue focus:border-brand-blue"
             />
           </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tutor</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sessions & Rate</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Payout (85%)</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500"><Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-blue" /></td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">No tutors found.</td>
                </tr>
              ) : (
                filtered.map((t) => {
                  const gross = (t.hourly_rate || 0) * (t.total_sessions || 0);
                  const net = gross * 0.85;

                  return (
                    <tr key={t.user_id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">{t.users?.full_name || 'Unknown'}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{t.users?.phone || 'No phone'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{t.total_sessions || 0} sessions</div>
                        <div className="text-xs font-medium text-gray-500 mt-0.5">{t.hourly_rate || 0} ETB / hr</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {gross.toLocaleString()} ETB
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-brand-gold">
                        {net.toLocaleString()} ETB
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="inline-flex items-center px-3 py-1.5 bg-green-50 text-green-700 text-xs font-semibold rounded-lg hover:bg-green-100 transition-colors border border-green-200">
                           <CreditCard className="w-3.5 h-3.5 mr-1" /> Pay
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
