'use client';
import { useState, useEffect, Fragment } from 'react';
import { supabase } from '@/lib/supabase';
import { DollarSign, TrendingUp, CreditCard, Wallet, Search, Loader2, X, Banknote } from 'lucide-react';
import { Dialog, Transition } from '@headlessui/react';

interface TutorFinancials {
  id: string;
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
  const [activeTab, setActiveTab] = useState<'balances' | 'transactions' | 'receipts' | 'payouts'>('balances');
  const [payments, setPayments] = useState<any[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<any[]>([]);
  
  // Payout modal state
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState<{id: string; name: string; amount: number} | null>(null);
  const [payoutForm, setPayoutForm] = useState({ bankName: '', accountNumber: '', referenceNumber: '', notes: '' });
  const [isProcessingPayout, setIsProcessingPayout] = useState(false);

  const signReceiptUrl = async (payment: any) => {
    if (!payment.receipt_path) return payment;
    const { data } = await supabase.storage
      .from('receipts')
      .createSignedUrl(payment.receipt_path, 60 * 60);
    return data?.signedUrl ? { ...payment, receipt_url: data.signedUrl } : payment;
  };

  async function fetchData() {
    setLoading(true);
    
    // Fetch tutor balances
    const { data: tutorData } = await supabase
      .from('tutors')
      .select(`id, user_id, hourly_rate, total_sessions, users ( full_name, phone )`)
      .order('total_sessions', { ascending: false });

    // Fetch transactions
    const { data: transData } = await supabase
      .from('bookings')
      .select('*, student:users!bookings_student_id_fkey(full_name), tutor:tutors(id, users(full_name))')
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false })
      .limit(20);

    // Fetch manual local payments (Telebirr/CBE receipts)
    const { data: paymentsData } = await supabase
      .from('payments')
      .select('*, user:users(full_name, phone)')
      .order('created_at', { ascending: false });

    // Fetch payout requests
    const { data: payRequests } = await supabase
      .from('tutor_payouts')
      .select('*, tutor:tutors(id, user_id, users(full_name, phone))')
      .order('created_at', { ascending: false });

    if (tutorData) setTutors(tutorData as any);
    if (transData) setTransactions(transData);
    if (paymentsData) setPayments(await Promise.all(paymentsData.map(signReceiptUrl)));
    if (payRequests) setPayoutRequests(payRequests);
    
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleVerifyReceipt = async (paymentId: string, status: 'approved' | 'rejected') => {
    const { data: authData } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('payments')
      .update({
        status,
        admin_notes: status === 'rejected' ? 'Invalid receipt. Please try again.' : null,
        reviewed_by: authData.user?.id || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', paymentId);
    
    if (!error) {
      setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status } : p));
      
      // Optionally fire notification to student here about payment
      const pData = payments.find(p => p.id === paymentId);
      if (pData) {
        await supabase.from('notifications').insert({
          user_id: pData.user_id,
          type: 'application_update',
          title: status === 'approved' ? 'Payment Approved ✅' : 'Payment Rejected ❌',
          body: status === 'approved' 
            ? `Your ${pData.method} payment of ${pData.amount} ETB was verified.` 
            : `Your recent payment was rejected. Please contact support.`,
        });
      }
    } else {
      alert('Verification failed: ' + error.message);
    }
  };

const handlePayoutClick = (tutorId: string, tutorName: string, amount: number) => {
    if (amount <= 0) {
      alert('Cannot payout - no balance available for this tutor.');
      return;
    }
    setSelectedTutor({ id: tutorId, name: tutorName, amount });
    setPayoutForm({ bankName: '', accountNumber: '', referenceNumber: '', notes: '' });
    setIsPayoutModalOpen(true);
  };

  const processPayout = async () => {
    if (!selectedTutor) return;
    if (!payoutForm.bankName || !payoutForm.accountNumber || !payoutForm.referenceNumber) {
      alert('Please fill in all required fields.');
      return;
    }

    setIsProcessingPayout(true);
    
    const { error } = await supabase.from('tutor_payouts').insert({
      tutor_id: selectedTutor.id,
      amount: selectedTutor.amount,
      bank_name: payoutForm.bankName,
      account_number: payoutForm.accountNumber,
      reference_number: payoutForm.referenceNumber,
      account_name: selectedTutor.name,
      admin_notes: payoutForm.notes,
      status: 'completed',
      processed_at: new Date().toISOString()
    });

    setIsProcessingPayout(false);
    
    if (!error) {
      setIsPayoutModalOpen(false);
      setSelectedTutor(null);
      alert(`Payout of ${selectedTutor.amount.toLocaleString()} ETB to ${selectedTutor.name} recorded successfully!`);
      fetchData();
    } else {
      alert('Failed to process payout: ' + error.message);
    }
  };

  const closePayoutModal = () => {
    setIsPayoutModalOpen(false);
    setSelectedTutor(null);
  };

  const handleUpdatePayoutStatus = async (payoutId: string, status: 'processing' | 'completed' | 'rejected') => {
    const notes = status === 'rejected' ? window.prompt('Reason for rejection:') : null;
    if (status === 'rejected' && notes === null) return;

    const { error } = await supabase
      .from('tutor_payouts')
      .update({
        status,
        admin_notes: notes,
        processed_at: status === 'completed' ? new Date().toISOString() : null,
      })
      .eq('id', payoutId);

    if (!error) {
      setPayoutRequests(prev => prev.map(p => p.id === payoutId ? { ...p, status, processed_at: status === 'completed' ? new Date().toISOString() : p.processed_at } : p));
      
      const pData = payoutRequests.find(p => p.id === payoutId);
      if (pData) {
        await supabase.from('notifications').insert({
          user_id: pData.tutor.user_id,
          type: 'application_update',
          title: `Payout ${status.charAt(0).toUpperCase() + status.slice(1)} 💰`,
          body: status === 'completed' 
            ? `Your payout of ${pData.amount} ETB has been successfully transferred.` 
            : status === 'processing' 
              ? `We are processing your payout request of ${pData.amount} ETB.`
              : `Your payout request was rejected: ${notes}`,
        });
      }
    } else {
      alert('Update failed: ' + error.message);
    }
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
        <button 
          onClick={() => setActiveTab('receipts')}
          className={`pb-4 text-sm font-bold transition-all relative ${activeTab === 'receipts' ? 'text-brand-blue' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Receipt Verification
          {activeTab === 'receipts' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand-blue rounded-full" />}
        </button>
        <button 
          onClick={() => setActiveTab('payouts')}
          className={`pb-4 text-sm font-bold transition-all relative ${activeTab === 'payouts' ? 'text-brand-blue' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Payout Requests
          {activeTab === 'payouts' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand-blue rounded-full" />}
          {payoutRequests.filter(p => p.status === 'pending').length > 0 && (
            <span className="absolute -top-1 -right-4 bg-brand-blue text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
              {payoutRequests.filter(p => p.status === 'pending').length}
            </span>
          )}
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
                          <button 
                            onClick={() => handlePayoutClick(t.id, t.users?.full_name || 'Tutor', net)}
                            className="px-3 py-1.5 bg-green-50 text-green-700 text-xs font-bold rounded-lg border border-green-200 hover:bg-green-100 transition-colors"
                          >
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
      ) : activeTab === 'payouts' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-2 duration-300">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
             <h2 className="font-bold text-gray-900 ml-2">Tutor Withdrawal Requests</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tutor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payoutRequests.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">No payout requests found.</td></tr>
                ) : (
                  payoutRequests.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">{p.tutor?.users?.full_name}</div>
                        <div className="text-xs text-gray-500">{p.tutor?.users?.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-brand-gold">{p.amount.toLocaleString()} ETB</div>
                        <div className="text-xs text-gray-500 mt-0.5">{new Date(p.created_at).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-medium">{p.bank_name}</div>
                        <div className="text-xs text-gray-500">Acc: {p.account_number}</div>
                        <div className="text-xs text-gray-400 capitalize">{p.account_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-[10px] font-bold rounded-full uppercase ${
                          p.status === 'completed' ? 'bg-green-100 text-green-700' :
                          p.status === 'processing' ? 'bg-blue-100 text-brand-blue' :
                          p.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {p.status !== 'completed' && p.status !== 'rejected' && (
                          <div className="flex justify-end gap-2">
                             {p.status === 'pending' && (
                               <button 
                                 onClick={() => handleUpdatePayoutStatus(p.id, 'processing')}
                                 className="px-3 py-1 bg-blue-50 text-brand-blue text-[10px] font-bold rounded border border-blue-100 hover:bg-blue-100"
                               >
                                 Process
                               </button>
                             )}
                             <button 
                               onClick={() => handleUpdatePayoutStatus(p.id, 'completed')}
                               className="px-3 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded border border-green-100 hover:bg-green-100"
                             >
                               Complete
                             </button>
                             <button 
                               onClick={() => handleUpdatePayoutStatus(p.id, 'rejected')}
                               className="px-3 py-1 bg-red-50 text-red-700 text-[10px] font-bold rounded border border-red-100 hover:bg-red-100"
                             >
                               Reject
                             </button>
                          </div>
                        )}
                        {(p.status === 'completed' || p.status === 'rejected') && (
                          <div className="text-[10px] text-gray-400 font-medium">
                             {p.status === 'completed' ? 'Fulfilled ' : 'Rejected '} 
                             {p.processed_at && new Date(p.processed_at).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'transactions' ? (
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
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-2 duration-300">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
             <h2 className="font-bold text-gray-900 ml-2">Approve Manual Payments</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student & Trans ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt File</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status & Verify</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">No manual payment receipts found.</td></tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{new Date(p.created_at).toLocaleDateString()}</div>
                        <div className="text-xs font-bold text-gray-400 uppercase mt-0.5">{p.method}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">{p.user?.full_name}</div>
                        <div className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded mt-1 inline-block font-mono">Txn: {p.transaction_id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-brand-blue">{p.amount?.toLocaleString()} ETB</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {p.receipt_url ? (
                          <a href={p.receipt_url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline flex items-center font-medium">
                            <Search className="w-3 h-3 mr-1" /> View Image
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">No file</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {p.status === 'pending' ? (
                          <div className="flex gap-2">
                            <button onClick={() => handleVerifyReceipt(p.id, 'rejected')} className="px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold transition-colors">Reject</button>
                            <button onClick={() => handleVerifyReceipt(p.id, 'approved')} className="px-3 py-1 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-bold shadow transition-colors">Approve Data</button>
                          </div>
                        ) : (
                          <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${p.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {p.status}
                          </span>
                        )}
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

      {/* Payout Modal */}
      <Transition appear show={isPayoutModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closePayoutModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="div" className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Banknote className="w-5 h-5 text-green-600" />
                      Process Payout
                    </h3>
                    <button onClick={closePayoutModal} className="p-1 hover:bg-gray-100 rounded-lg">
                      <X className="w-5 h-5 text-gray-400" />
                    </button>
                  </Dialog.Title>

                  {selectedTutor && (
                    <div className="space-y-4">
                      <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                        <div className="text-sm text-gray-600">Payout Amount</div>
                        <div className="text-2xl font-bold text-green-700">{selectedTutor.amount.toLocaleString()} ETB</div>
                        <div className="text-sm text-gray-500 mt-1">To: {selectedTutor.name}</div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bank / Channel *</label>
                        <select
                          value={payoutForm.bankName}
                          onChange={(e) => setPayoutForm({ ...payoutForm, bankName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="">Select payment method</option>
                          <option value="CBE">CBE Birr</option>
                          <option value="Telebirr">Telebirr</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="Cash">Cash</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Account Number / Phone *</label>
                        <input
                          type="text"
                          value={payoutForm.accountNumber}
                          onChange={(e) => setPayoutForm({ ...payoutForm, accountNumber: e.target.value })}
                          placeholder="Phone number or account"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number *</label>
                        <input
                          type="text"
                          value={payoutForm.referenceNumber}
                          onChange={(e) => setPayoutForm({ ...payoutForm, referenceNumber: e.target.value })}
                          placeholder="Transaction reference"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                        <textarea
                          value={payoutForm.notes}
                          onChange={(e) => setPayoutForm({ ...payoutForm, notes: e.target.value })}
                          placeholder="Any additional notes..."
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                        />
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={closePayoutModal}
                          className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={processPayout}
                          disabled={isProcessingPayout || !payoutForm.bankName || !payoutForm.accountNumber || !payoutForm.referenceNumber}
                          className="flex-1 px-4 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isProcessingPayout ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>Confirm Payout</>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
