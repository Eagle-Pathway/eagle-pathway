'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { DollarSign, TrendingUp, Wallet, Loader2, Banknote, Eye, CheckCircle, XCircle, ExternalLink, ShieldCheck, Filter } from 'lucide-react';
import { TableSkeleton } from '@/components/ui/TableSkeleton';

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
  const [receiptFilter, setReceiptFilter] = useState<'all' | 'manual_review' | 'verified' | 'rejected'>('all');
  const [providerFilter, setProviderFilter] = useState<'all' | 'telebirr' | 'cbe'>('all');
  const [selectedReceiptModal, setSelectedReceiptModal] = useState<any | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<any[]>([]);
  const [notification, setNotification] = useState<{type: 'error' | 'success' | 'info'; message: string} | null>(null);
  
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<{tutor: TutorFinancials; amount: number} | null>(null);
  const [payoutDetails, setPayoutDetails] = useState({ bankName: '', accountNumber: '', reference: '', notes: '' });
  const [isProcessingPayout, setIsProcessingPayout] = useState(false);
  const [isUpdatingPayoutRequestId, setIsUpdatingPayoutRequestId] = useState<string | null>(null);

  const showNotification = (type: 'error' | 'success' | 'info', message: string, timeoutMs = 3500) => {
    setNotification({ type, message });
    window.setTimeout(() => setNotification(null), timeoutMs);
  };

  const signReceiptUrl = async (payment: any) => {
    if (!payment.receipt_path) return payment;
    const { data } = await supabase.storage
      .from('receipts')
      .createSignedUrl(payment.receipt_path, 60 * 60);
    return data?.signedUrl ? { ...payment, receipt_url: data.signedUrl } : payment;
  };

  async function fetchData() {
    setLoading(true);
    try {
      const { data: tutorData } = await supabase
        .from('tutors')
        .select(`id, user_id, hourly_rate, total_sessions, users ( full_name, phone )`)
        .order('total_sessions', { ascending: false });

      const { data: transData } = await supabase
        .from('bookings')
        .select('*, student:users!bookings_student_id_fkey(full_name), tutor:tutors(id, users(full_name))')
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false })
        .limit(20);

      const { data: paymentsData } = await supabase
        .from('payments')
        .select('*, user:users(full_name, phone)')
        .order('created_at', { ascending: false });

      const { data: payRequests } = await supabase
        .from('tutor_payouts')
        .select('*, tutor:tutors(id, user_id, users(full_name, phone))')
        .order('created_at', { ascending: false });

      if (tutorData) setTutors(tutorData as any[]);
      if (transData) setTransactions(transData);
      if (paymentsData) setPayments(await Promise.all(paymentsData.map(signReceiptUrl)));
      if (payRequests) setPayoutRequests(payRequests);
    } catch (error: any) {
      showNotification('error', error?.message || 'Failed to load finance data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();

    const paymentsChannel = supabase
      .channel('admin-payments-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data: newPayment } = await supabase
              .from('payments')
              .select('*, user:users(full_name, phone)')
              .eq('id', payload.new.id)
              .single();
            if (newPayment) {
              const signed = await signReceiptUrl(newPayment);
              setPayments(prev => [signed, ...prev.filter(p => p.id !== signed.id)]);
              showNotification('info', `New payment receipt received from ${signed.user?.full_name || 'student'}! 💵`);
            }
          } else if (payload.eventType === 'UPDATE') {
            const { data: updatedPayment } = await supabase
              .from('payments')
              .select('*, user:users(full_name, phone)')
              .eq('id', payload.new.id)
              .single();
            if (updatedPayment) {
              const signed = await signReceiptUrl(updatedPayment);
              setPayments(prev => prev.map(p => p.id === signed.id ? signed : p));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(paymentsChannel);
    };
  }, []);

  const handleVerifyReceipt = async (paymentId: string, status: 'approved' | 'rejected') => {
    const { data: authData } = await supabase.auth.getUser();
    const verificationStatus = status === 'approved' ? 'verified' : 'rejected';

    const { error } = await supabase
      .from('payments')
      .update({
        status: status === 'approved' ? 'completed' : 'failed',
        verification_status: verificationStatus,
        verified_at: new Date().toISOString(),
        admin_notes: status === 'rejected' ? 'Invalid or unverified receipt. Please check details and try again.' : 'Manually verified and approved by admin.',
        reviewed_by: authData.user?.id || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', paymentId);
    
    if (!error) {
      setPayments(prev => prev.map(p => p.id === paymentId ? { 
        ...p, 
        status: status === 'approved' ? 'completed' : 'failed',
        verification_status: verificationStatus 
      } : p));
      
      if (selectedReceiptModal?.id === paymentId) {
        setSelectedReceiptModal(null);
      }

      // Notify the student
      const payment = payments.find(p => p.id === paymentId);
      if (payment?.user_id) {
        await supabase.from('notifications').insert({
          user_id: payment.user_id,
          type: 'application_update',
          title: status === 'approved' ? 'Payment Verified 100% ✅' : 'Payment Verification Issue ⚠️',
          body: status === 'approved'
            ? 'Your bank payment receipt has been verified by the admin team. Your package is now 100% active!'
            : "Your payment receipt could not be verified with the bank. Please check your transaction details and re-submit.",
        });
      }
      showNotification('success', `Payment receipt marked as ${verificationStatus}.`);
      fetchData();
      return;
    }

    showNotification('error', error.message || 'Failed to verify receipt.');
  };

  const handleCompletePayoutRequest = async (requestId: string) => {
    setIsUpdatingPayoutRequestId(requestId);
    const { error } = await supabase
      .from('tutor_payouts')
      .update({ status: 'completed', processed_at: new Date().toISOString() })
      .eq('id', requestId);

    setIsUpdatingPayoutRequestId(null);

    if (error) {
      showNotification('error', error.message || 'Failed to complete payout request.');
      return;
    }

    // Notify the tutor their payout was processed (best-effort).
    const payout = payoutRequests.find(r => r.id === requestId);
    const tutorUserId = payout?.tutor?.user_id;
    if (tutorUserId) {
      const { error: notifError } = await supabase.from('notifications').insert({
        user_id: tutorUserId,
        type: 'application_update',
        title: 'Payout completed 💸',
        body: 'Your payout request has been processed and marked as completed.',
      });
      if (notifError) console.error('Failed to send notification:', notifError);
    }

    showNotification('success', 'Payout request marked as completed.');
    await fetchData();
  };

  const totalPlatformVolume = tutors.reduce((acc, t) => acc + ((t.hourly_rate || 0) * (t.total_sessions || 0)), 0);
  const totalPlatformProfit = transactions.reduce((acc, b) => acc + (b.platform_fee || 0), 0);
  const totalPayoutsDue = totalPlatformVolume * 0.85;

  const filteredTutors = tutors.filter(t => 
    t.users?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Finance & Payouts</h1>
          <p className="mt-1 text-sm text-gray-500">Track platform revenue and tutor commissions.</p>
        </div>
      </div>

      {notification && (
        <div className={`p-4 rounded-xl border ${
          notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' :
          notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' :
          'bg-blue-50 border-blue-200 text-blue-700'
        }`}>
          {notification.message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-500">Gross Volume</h3>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><TrendingUp className="w-5 h-5" /></div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">{totalPlatformVolume.toLocaleString()} ETB</div>
            <p className="text-xs text-gray-400 mt-2">All session value</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-t-4 border-t-green-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-500">Platform Profit</h3>
            <div className="p-2 bg-green-50 rounded-lg text-green-600"><DollarSign className="w-5 h-5" /></div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">{totalPlatformProfit.toLocaleString()} ETB</div>
            <p className="text-xs text-green-600 font-medium mt-2">Revenue from fees</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-500">Owed to Tutors</h3>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600"><Wallet className="w-5 h-5" /></div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">{totalPayoutsDue.toLocaleString()} ETB</div>
            <p className="text-xs text-gray-400 mt-2">Net (85%)</p>
          </div>
        </div>
      </div>

      <div className="flex gap-6 border-b border-gray-100 pb-px">
        <button onClick={() => setActiveTab('balances')} className={`pb-4 text-sm font-bold ${activeTab === 'balances' ? 'text-blue-600' : 'text-gray-400'}`}>
          Tutor Balances
        </button>
        <button onClick={() => setActiveTab('transactions')} className={`pb-4 text-sm font-bold ${activeTab === 'transactions' ? 'text-blue-600' : 'text-gray-400'}`}>
          Transactions
        </button>
        <button onClick={() => setActiveTab('receipts')} className={`pb-4 text-sm font-bold ${activeTab === 'receipts' ? 'text-blue-600' : 'text-gray-400'}`}>
          Receipts
        </button>
        <button onClick={() => setActiveTab('payouts')} className={`pb-4 text-sm font-bold ${activeTab === 'payouts' ? 'text-blue-600' : 'text-gray-400'}`}>
          Payouts
          {payoutRequests.filter(p => p.status === 'pending').length > 0 && (
            <span className="ml-1 bg-red-500 text-white text-xs px-1.5 rounded-full">
              {payoutRequests.filter(p => p.status === 'pending').length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'balances' && (
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b flex justify-between">
            <h2 className="font-bold">Net Earnings</h2>
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-1 border rounded-lg text-sm"
            />
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Tutor</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Sessions</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Value</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Net (85%)</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <TableSkeleton cols={5} rows={5} avatarCol={false} />
              ) : filteredTutors.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">No records found.</td></tr>
              ) : filteredTutors.map((t) => {
                const gross = (t.hourly_rate || 0) * (t.total_sessions || 0);
                const net = gross * 0.85;
                return (
                  <tr key={t.user_id}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{t.users?.full_name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{t.users?.phone}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div>{t.total_sessions || 0}</div>
                      <div className="text-xs text-gray-500">{t.hourly_rate || 0} ETB/hr</div>
                    </td>
                    <td className="px-4 py-3 font-medium">{gross.toLocaleString()}</td>
                    <td className="px-4 py-3 font-bold text-amber-600">{net.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => {
                          if (net <= 0) {
                            showNotification('error', 'No balance available');
                            return;
                          }
                          setSelectedPayout({ tutor: t, amount: net });
                          setPayoutDetails({ bankName: '', accountNumber: '', reference: '', notes: '' });
                          setShowPayoutModal(true);
                        }}
                        className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-lg border border-green-200"
                      >
                        Pay
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'payouts' && (
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b font-bold">Tutor Payout Requests</div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Tutor</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Amount</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Bank</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <TableSkeleton cols={5} rows={5} avatarCol={false} />
              ) : payoutRequests.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">No payouts found.</td></tr>
              ) : payoutRequests.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{p.tutor?.users?.full_name}</div>
                    <div className="text-xs text-gray-500">{p.tutor?.users?.phone}</div>
                  </td>
                  <td className="px-4 py-3 font-bold text-amber-600">{p.amount.toLocaleString()} ETB</td>
                  <td className="px-4 py-3">
                    <div>{p.bank_name}</div>
                    <div className="text-xs text-gray-500">{p.account_number}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                      p.status === 'completed' ? 'bg-green-100 text-green-700' :
                      p.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                      p.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {p.status !== 'completed' && p.status !== 'rejected' && (
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => handleCompletePayoutRequest(p.id)}
                          disabled={isUpdatingPayoutRequestId === p.id}
                          className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded disabled:opacity-60"
                        >
                          {isUpdatingPayoutRequestId === p.id ? 'Completing...' : 'Complete'}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b font-bold">Recent Bookings</div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Student</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Tutor</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Amount</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <TableSkeleton cols={5} rows={5} avatarCol={false} />
              ) : transactions.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">No transactions found.</td></tr>
              ) : transactions.map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-3">{new Date(b.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{b.student?.full_name}</td>
                  <td className="px-4 py-3">{b.tutor?.users?.full_name}</td>
                  <td className="px-4 py-3 font-medium">{b.total_amount?.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">{b.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'receipts' && (
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          {/* Receipts Filter Bar */}
          <div className="p-4 border-b flex flex-wrap justify-between items-center gap-4 bg-gray-50/50">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Payment Receipts & Verification Queue</h2>
              <p className="text-xs text-gray-500">Inspect bank screenshots, review transaction telemetry, and approve/reject payments.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              {/* Provider Filter */}
              <div className="flex items-center bg-gray-100 p-1 rounded-lg mr-2 border border-gray-200">
                <button
                  onClick={() => setProviderFilter('all')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${providerFilter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  All Banks
                </button>
                <button
                  onClick={() => setProviderFilter('telebirr')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${providerFilter === 'telebirr' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Telebirr
                </button>
                <button
                  onClick={() => setProviderFilter('cbe')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${providerFilter === 'cbe' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  CBE / Bank
                </button>
              </div>

              {/* Status Filter */}
              <button
                onClick={() => setReceiptFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${receiptFilter === 'all' ? 'bg-gray-900 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}
              >
                All ({payments.length})
              </button>
              <button
                onClick={() => setReceiptFilter('manual_review')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${receiptFilter === 'manual_review' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'}`}
              >
                Pending Review ⏳ ({payments.filter(p => p.verification_status === 'manual_review' || p.status === 'pending').length})
              </button>
              <button
                onClick={() => setReceiptFilter('verified')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${receiptFilter === 'verified' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'}`}
              >
                Verified 100% ✅ ({payments.filter(p => p.verification_status === 'verified' || p.status === 'completed' || p.status === 'approved').length})
              </button>
              <button
                onClick={() => setReceiptFilter('rejected')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${receiptFilter === 'rejected' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'}`}
              >
                Rejected ❌ ({payments.filter(p => p.verification_status === 'rejected' || p.status === 'failed').length})
              </button>
            </div>
          </div>

          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date & Provider</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Transaction Ref ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Verification Status</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Screenshot</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <TableSkeleton cols={7} rows={5} avatarCol={false} />
              ) : payments.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">No payment receipts found.</td></tr>
              ) : payments
                .filter(p => {
                  const matchesStatus = 
                    receiptFilter === 'all' ? true :
                    receiptFilter === 'manual_review' ? (p.verification_status === 'manual_review' || p.status === 'pending') :
                    receiptFilter === 'verified' ? (p.verification_status === 'verified' || p.status === 'completed' || p.status === 'approved') :
                    (p.verification_status === 'rejected' || p.status === 'failed');

                  const matchesProvider = 
                    providerFilter === 'all' ? true :
                    providerFilter === 'telebirr' ? (p.method?.toLowerCase().includes('telebirr')) :
                    (p.method?.toLowerCase().includes('cbe') || p.method?.toLowerCase().includes('bank'));

                  return matchesStatus && matchesProvider;
                })
                .map((p) => {
                  const isVerified = p.verification_status === 'verified' || p.status === 'completed' || p.status === 'approved';
                  const isRejected = p.verification_status === 'rejected' || p.status === 'failed';
                  const isPending = !isVerified && !isRejected;

                  return (
                    <tr key={p.id} className="hover:bg-gray-50/80 transition">
                      <td className="px-4 py-3">
                        <div className="text-sm font-semibold text-gray-900">{new Date(p.created_at).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-500 uppercase font-medium mt-0.5">{p.method}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-sm font-semibold text-gray-900">{p.user?.full_name || 'Student'}</div>
                        <div className="text-xs text-gray-500">{p.user?.phone || 'N/A'}</div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-mono text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded border border-gray-200 font-bold">
                          {p.transaction_id || 'N/A'}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-sm font-bold text-gray-900">
                        {p.amount?.toLocaleString()} ETB
                      </td>

                      <td className="px-4 py-3">
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800 border border-green-200">
                            <ShieldCheck className="w-3.5 h-3.5" /> Verified 100%
                          </span>
                        ) : isRejected ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-red-100 text-red-800 border border-red-200">
                            <XCircle className="w-3.5 h-3.5" /> Rejected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Pending Review
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center">
                        {p.receipt_url ? (
                          <button
                            onClick={() => setSelectedReceiptModal(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold rounded-lg transition"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Receipt
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 font-italic">No Image</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-1.5 justify-end">
                          <button
                            onClick={() => handleVerifyReceipt(p.id, 'approved')}
                            disabled={isVerified}
                            className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg disabled:opacity-40 transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleVerifyReceipt(p.id, 'rejected')}
                            disabled={isRejected}
                            className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-lg disabled:opacity-40 transition"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}

      {/* Lightbox Receipt Image Modal */}
      {selectedReceiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedReceiptModal(null)} />
          <div className="relative z-10 w-full max-w-2xl bg-white rounded-2xl p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  Receipt Verification Preview
                </h3>
                <p className="text-xs text-gray-500">Student: {selectedReceiptModal.user?.full_name} ({selectedReceiptModal.user?.phone})</p>
              </div>
              <button 
                onClick={() => setSelectedReceiptModal(null)}
                className="text-gray-400 hover:text-gray-600 font-bold text-xl px-2"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4">
              <div className="bg-gray-900 rounded-xl p-2 flex justify-center items-center max-h-[450px]">
                {selectedReceiptModal.receipt_url ? (
                  <img
                    src={selectedReceiptModal.receipt_url}
                    alt="Receipt Screenshot"
                    className="max-h-[420px] object-contain rounded-lg shadow-md"
                  />
                ) : (
                  <div className="text-gray-400 py-12 text-sm">No receipt image attached.</div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs space-y-2">
                <div className="font-bold text-blue-900 text-sm mb-1">Receipt Telemetry Data</div>
                <div className="grid grid-cols-2 gap-2 text-gray-700">
                  <div><span className="font-semibold">Provider:</span> {selectedReceiptModal.method}</div>
                  <div><span className="font-semibold">Transaction Ref:</span> <span className="font-mono bg-white px-1 py-0.5 rounded border">{selectedReceiptModal.transaction_id}</span></div>
                  <div><span className="font-semibold">Amount:</span> {selectedReceiptModal.amount?.toLocaleString()} ETB</div>
                  <div><span className="font-semibold">Verification Status:</span> {selectedReceiptModal.verification_status || selectedReceiptModal.status}</div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-4 pt-3 border-t">
              <button
                onClick={() => setSelectedReceiptModal(null)}
                className="px-4 py-2 border rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => handleVerifyReceipt(selectedReceiptModal.id, 'rejected')}
                className="flex-1 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-sm font-bold rounded-xl"
              >
                Reject Receipt ❌
              </button>
              <button
                onClick={() => handleVerifyReceipt(selectedReceiptModal.id, 'approved')}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl shadow-sm"
              >
                Approve & Verify ✅
              </button>
            </div>
          </div>
        </div>
      )}

      {showPayoutModal && selectedPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowPayoutModal(false)} />
          <div className="relative z-10 w-full max-w-md bg-white rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Banknote className="w-5 h-5 text-green-600" />
              Process Payout
            </h3>
            
            <div className="bg-green-50 rounded-xl p-4 mb-4">
              <div className="text-sm text-gray-600">Amount</div>
              <div className="text-2xl font-bold text-green-700">{selectedPayout.amount.toLocaleString()} ETB</div>
              <div className="text-sm text-gray-500">To: {selectedPayout.tutor.users?.full_name}</div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Bank / Channel *</label>
                <select
                  value={payoutDetails.bankName}
                  onChange={(e) => setPayoutDetails({ ...payoutDetails, bankName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select</option>
                  <option value="CBE">CBE Birr</option>
                  <option value="Telebirr">Telebirr</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Account / Phone *</label>
                <input
                  type="text"
                  value={payoutDetails.accountNumber}
                  onChange={(e) => setPayoutDetails({ ...payoutDetails, accountNumber: e.target.value })}
                  placeholder="Account or phone"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Reference *</label>
                <input
                  type="text"
                  value={payoutDetails.reference}
                  onChange={(e) => setPayoutDetails({ ...payoutDetails, reference: e.target.value })}
                  placeholder="Transaction reference"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={payoutDetails.notes}
                  onChange={(e) => setPayoutDetails({ ...payoutDetails, notes: e.target.value })}
                  placeholder="Optional notes"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowPayoutModal(false)}
                className="flex-1 px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!payoutDetails.bankName || !payoutDetails.accountNumber || !payoutDetails.reference) {
                    showNotification('error', 'Please fill all required fields.');
                    return;
                  }
                  setIsProcessingPayout(true);
                  const { error } = await supabase.from('tutor_payouts').insert({
                    tutor_id: selectedPayout.tutor.id,
                    amount: selectedPayout.amount,
                    bank_name: payoutDetails.bankName,
                    account_number: payoutDetails.accountNumber,
                    reference_number: payoutDetails.reference,
                    account_name: selectedPayout.tutor.users?.full_name,
                    admin_notes: payoutDetails.notes,
                    status: 'completed',
                    processed_at: new Date().toISOString()
                  });
                  setIsProcessingPayout(false);
                  if (!error) {
                    setShowPayoutModal(false);
                    showNotification('success', `Payout of ${selectedPayout.amount.toLocaleString()} ETB recorded!`);
                    fetchData();
                  } else {
                    showNotification('error', 'Failed: ' + error.message, 5000);
                  }
                }}
                disabled={isProcessingPayout}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50"
              >
                {isProcessingPayout ? 'Processing...' : 'Confirm Payout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
