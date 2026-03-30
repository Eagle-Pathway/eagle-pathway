'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { DollarSign, TrendingUp, CreditCard, Wallet, Search, Loader2 } from 'lucide-react';

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
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'balances' | 'transactions'>('balances');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch tutor balances
    const { data: tutorData } = await supabase
      .from('tutors')
      .select(`user_id, hourly_rate, total_sessions, users ( full_name, phone )`)
      .order('total_sessions', { ascending: false });

    // Fetch transactions
    const { data: transData } = await supabase
      .from('bookings')
      .select('*, student:users!bookings_student_id_fkey(full_name), tutor:tutors(id, users(full_name))')
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false })
      .limit(20);

    if (tutorData) setTutors(tutorData as any);
    if (transData) setTransactions(transData);
    
    setLoading(false);
  };

  const totalPlatformVolume = tutors.reduce((acc, t) => acc + ((t.hourly_rate || 0) * (t.total_sessions || 0)), 0);
  const totalPlatformProfit = transactions.reduce((acc, b) => acc + (b.platform_fee || 0), 0);
  const totalPayoutsDue = totalPlatformVolume * 0.85;

  const filteredTutors = tutors.filter(t => 
    t.users?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Finance & Payouts</h1>
          <p className="mt-1 text-sm text-gray-500">Track platform revenue and tutor commissions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Gross Volume</h3>
            <div className="p-2 bg-blue-50 rounded-lg text-brand-blue"><TrendingUp className="w-5 h-5" /></div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">{totalPlatformVolume.toLocaleString()} ETB</div>
            <p className="text-xs text-gray-400 mt-2">Total value of all time sessions</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow border-t-4 border-t-green-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Platform Profit</h3>
            <div className="p-2 bg-green-50 rounded-lg text-green-600"><DollarSign className="w-5 h-5" /></div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">{totalPlatformProfit.toLocaleString()} ETB</div>
            <p className="text-xs text-green-600 font-medium mt-2 flex items-center">Real-time revenue from fees</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Owed to Tutors</h3>
            <div className="p-2 bg-amber-50 rounded-lg text-brand-gold"><Wallet className="w-5 h-5" /></div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">{totalPayoutsDue.toLocaleString()} ETB</div>
            <p className="text-xs text-gray-400 mt-2">Net tutor earnings (85%)</p>
          </div>
        </div>
      </div>

      <div className="flex gap-6 border-b border-gray-100 pb-px">
        <button 
          onClick={() => setActiveTab('balances')}
          className={`pb-4 text-sm font-bold transition-all relative ${activeTab === 'balances' ? 'text-brand-blue' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Tutor Balances
          {activeTab === 'balances' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand-blue rounded-full" />}
        </button>
        <button 
          onClick={() => setActiveTab('transactions')}
          className={`pb-4 text-sm font-bold transition-all relative ${activeTab === 'transactions' ? 'text-brand-blue' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Recent Transactions
          {activeTab === 'transactions' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand-blue rounded-full" />}
        </button>
      </div>

      {activeTab === 'balances' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
             <h2 className="font-bold text-gray-900 ml-2">Net Earnings</h2>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tutor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sessions & Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Payout (85%)</th>
                  <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500"><Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-blue" /></td></tr>
                ) : filteredTutors.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">No records found.</td></tr>
                ) : (
                  filteredTutors.map((t) => {
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{gross.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-brand-gold">{net.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="px-3 py-1.5 bg-green-50 text-green-700 text-xs font-bold rounded-lg border border-green-200 hover:bg-green-100 transition-colors">
                            Pay
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
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-2 duration-300">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
             <h2 className="font-bold text-gray-900 ml-2">Recent Booking Payments</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee (15%)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">No transactions recorded.</td></tr>
                ) : (
                  transactions.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{new Date(b.created_at).toLocaleDateString()}</div>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">#{b.id.slice(0,8)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-medium">S: {b.student?.full_name}</div>
                        <div className="text-xs text-gray-500">T: {b.tutor?.users?.full_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{b.total_amount?.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">{b.platform_fee?.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-brand-blue">
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
