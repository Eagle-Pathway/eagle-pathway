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
  const [notification, setNotification] = useState<{ type: 'error' | 'success' | 'info'; message: string } | null>(null);

  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<{ tutor: TutorFinancials; amount: number } | null>(null);
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
        <div className="space-y-6 pb-12 animate-in fade-in duration-200">
          <div className="flex justify-between items-start sm:items-center gap-4 border-b border-slate-200/80 pb-4">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Revenue &amp; Settlements</p>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Financial Operations &amp; Settlements</h1>
              <p className="mt-1 text-xs text-slate-500">Track platform tutoring revenue, commissions, and instructor payout balances.</p>
            </div>
          </div>

          {notification && (
                < div className={`p-3.5 rounded-xl border text-xs font-semibold shadow-xs ${notification.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-700' :
                  notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                    'bg-blue-50 border-blue-200 text-brand-blue'
                  }`}>
              {notification.message}
            </div>
          )}

                {/* KPI Metric Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs hover:border-slate-300 transition-all">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Gross Tutoring Volume</p>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-brand-blue border border-blue-200/60">Total</span>
                    </div>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-slate-900 tracking-tight">{totalPlatformVolume.toLocaleString()} ETB</span>
                        <span className="text-xs text-slate-400 font-medium truncate">all session value</span>
                      </div>
                    </div>

                        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs hover:border-slate-300 transition-all">
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Platform Retained Profit</p>
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60">Fees</span>
                          </div>
                            <div className="mt-1 flex items-baseline gap-2">
                              <span className="text-2xl font-bold text-emerald-600 tracking-tight">{totalPlatformProfit.toLocaleString()} ETB</span>
                              <span className="text-xs text-slate-400 font-medium truncate">commission revenue</span>
                            </div>
                          </div>

                              <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs hover:border-slate-300 transition-all">
                                <div className="flex items-center justify-between">
                                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Owed to Tutors</p>
                                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200/60">Payable</span>
                                </div>
                                  <div className="mt-1 flex items-baseline gap-2">
                                    <span className="text-2xl font-bold text-slate-900 tracking-tight">{totalPayoutsDue.toLocaleString()} ETB</span>
                                    <span className="text-xs text-slate-400 font-medium truncate">net instructor balance</span>
                                  </div>
                                </div>
                              </div>

                                  {/* Overview-style Segmented Tab Switcher */}
                                  <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/70 w-max overflow-x-auto">
                                    <button
                                      onClick={() => setActiveTab('balances')}
                                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'balances'
                                          ? 'bg-slate-900 text-white shadow-xs'
                                          : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                      Tutor Balances
                                    </button>
                                      <button
                                        onClick={() => setActiveTab('transactions')}
                                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'transactions'
                                            ? 'bg-slate-900 text-white shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900'
                                          }`}
                                      >
                                        Transactions
                                      </button>
                                        <button
                                          onClick={() => setActiveTab('receipts')}
                                          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'receipts'
                                              ? 'bg-slate-900 text-white shadow-xs'
                                              : 'text-slate-600 hover:text-slate-900'
                                            }`}
                                        >
                                          Receipts
                                        </button>
                                          <button
                                            onClick={() => setActiveTab('payouts')}
                                            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${activeTab === 'payouts'
                                                ? 'bg-slate-900 text-white shadow-xs'
                                                : 'text-slate-600 hover:text-slate-900'
                                              }`}
                                          >
                                            <span>Payouts</span>
                                            {payoutRequests.filter(p => p.status === 'pending').length > 0 && (
                                                <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                                                  {payoutRequests.filter(p => p.status === 'pending').length}
                                                </span>
          )}
                                              </button>
      </div>

                                          {activeTab === 'balances' && (
                                                <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 overflow-hidden">
                                                  <div className="p-4 border-b border-slate-200/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                                    <div>
                                                      <h2 className="text-sm font-bold text-slate-900 tracking-tight">Net Instructor Balances</h2>
                                                      <p className="text-[11px] text-slate-500">Breakdown of gross tutoring completed and net payable balances (85%).</p>
                                                    </div>
                                                    <input
                                                      type="text"
                                                      placeholder="Search tutor name..."
                                                      value={search}
                                                      onChange={(e) => setSearch(e.target.value)}
                                                      className="px-3 py-1.5 bg-slate-50/80 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                                                    />
                                                  </div>
                                                  <table className="w-full">
                                                      <thead className="bg-slate-50/70 border-b border-slate-200/80">
                                                        <tr>
                                                          <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Tutor</th>
                                                          <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Sessions</th>
                                                          <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Gross Value</th>
                                                          <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Net (85%)</th>
                                                          <th className="px-4 py-3"></th>
                                                        </tr>
                                                      </thead>
                                                        <tbody className="divide-y divide-slate-100">
                                                          {loading ? (
                                                            <TableSkeleton cols={5} rows={5} avatarCol={false} />
                                                          ) : filteredTutors.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-xs text-slate-500">No records found.</td></tr>
                                                          ) : filteredTutors.map((t) => {
                                                            const gross = (t.hourly_rate || 0) * (t.total_sessions || 0);
                                                            const net = gross * 0.85;
                                                            return (
                                                                <tr key={t.user_id} className="hover:bg-slate-50/50 transition-colors">
                                                                  <td className="px-4 py-3">
                                                                    <div className="text-xs font-bold text-slate-900">{t.users?.full_name || 'Unknown'}</div>
                                                                    <div className="text-[11px] text-slate-500">{t.users?.phone}</div>
                                                                  </td>
                                                                  <td className="px-4 py-3">
                                                                    <div className="text-xs font-semibold text-slate-900">{t.total_sessions || 0}</div>
                                                                    <div className="text-[11px] text-slate-500">{t.hourly_rate || 0} ETB/hr</div>
                                                                  </td>
                                                                  <td className="px-4 py-3 text-xs font-semibold text-slate-900">{gross.toLocaleString()} ETB</td>
                                                                  <td className="px-4 py-3 text-xs font-bold text-amber-700">{net.toLocaleString()} ETB</td>
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
                                                                      className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200/60 hover:bg-emerald-100 transition-colors"
                                                                    >
                                                                      Process Payout
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
                                                          <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 overflow-hidden">
                                                            <div className="p-4 border-b border-slate-200/80">
                                                              <h2 className="text-sm font-bold text-slate-900 tracking-tight">Tutor Payout Requests</h2>
                                                              <p className="text-[11px] text-slate-500">Instructor withdrawal requests and settlement history.</p>
                                                            </div>
                                                            <table className="w-full">
                                                                <thead className="bg-slate-50/70 border-b border-slate-200/80">
                                                                  <tr>
                                                                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Tutor</th>
                                                                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                                                                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Bank Details</th>
                                                                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                                                    <th className="px-4 py-3"></th>
                                                                  </tr>
                                                                </thead>
                                                                  <tbody className="divide-y divide-slate-100">
                                                                    {loading ? (
                                                                      <TableSkeleton cols={5} rows={5} avatarCol={false} />
                                                                    ) : payoutRequests.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-xs text-slate-500">No payouts found.</td></tr>
                                                                    ) : payoutRequests.map((p) => (
                                                                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                                                          <td className="px-4 py-3">
                                                                            <div className="text-xs font-bold text-slate-900">{p.tutor?.users?.full_name}</div>
                                                                            <div className="text-[11px] text-slate-500">{p.tutor?.users?.phone}</div>
                                                                          </td>
                                                                          <td className="px-4 py-3 text-xs font-bold text-slate-900">{p.amount.toLocaleString()} ETB</td>
                                                                          <td className="px-4 py-3">
                                                                            <div className="text-xs font-semibold text-slate-800">{p.bank_name}</div>
                                                                            <div className="text-[11px] text-slate-500 font-mono">{p.account_number}</div>
                                                                          </td>
                                                                          <td className="px-4 py-3">
                                                                                  < span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full border ${p.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' :
                                                                                    p.status === 'processing' ? 'bg-blue-50 text-brand-blue border-blue-200/60' :
                                                                                      p.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-200/60' :
                                                                                        'bg-amber-50 text-amber-700 border-amber-200/60'
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
                                                                                  className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-xs font-semibold rounded-lg hover:bg-emerald-100 disabled:opacity-60 transition-colors"
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
                                                                    <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 overflow-hidden">
                                                                      <div className="p-4 border-b border-slate-200/80">
                                                                        <h2 className="text-sm font-bold text-slate-900 tracking-tight">Recent Session Transactions</h2>
                                                                        <p className="text-[11px] text-slate-500">Live ledger of student bookings and payments.</p>
                                                                      </div>
                                                                      <table className="w-full">
                                                                          <thead className="bg-slate-50/70 border-b border-slate-200/80">
                                                                            <tr>
                                                                              <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                                                              <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                                                                              <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Tutor</th>
                                                                              <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                                                                              <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                                                            </tr>
                                                                          </thead>
                                                                            <tbody className="divide-y divide-slate-100">
                                                                              {loading ? (
                                                                                <TableSkeleton cols={5} rows={5} avatarCol={false} />
                                                                              ) : transactions.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-xs text-slate-500">No transactions found.</td></tr>
                                                                              ) : transactions.map((b) => (
                                                                                  <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                                                                                    <td className="px-4 py-3 text-xs text-slate-600">{new Date(b.created_at).toLocaleDateString()}</td>
                                                                                    <td className="px-4 py-3 text-xs font-semibold text-slate-900">{b.student?.full_name}</td>
                                                                                    <td className="px-4 py-3 text-xs text-slate-600">{b.tutor?.users?.full_name}</td>
                                                                                    <td className="px-4 py-3 text-xs font-bold text-slate-900">{b.total_amount?.toLocaleString()} ETB</td>
                                                                                    <td className="px-4 py-3">
                                                                                      <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-blue-50 text-brand-blue border border-blue-200/60">{b.status}</span>
                                                                                    </td>
                                                                                  </tr>
              ))}
                                                                                </tbody>
          </table>
                                                                          </div>
      )}

                                                                          {activeTab === 'receipts' && (
                                                                              <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 overflow-hidden">
                                                                                {/* Receipts Filter Bar */}
                                                                                  <div className="p-4 border-b border-slate-200/80 flex flex-wrap justify-between items-center gap-4 bg-slate-50/40">
                                                                                    <div>
                                                                                      <h2 className="text-sm font-bold text-slate-900 tracking-tight">Payment Receipts & Verification Queue</h2>
                                                                                      <p className="text-[11px] text-slate-500">Inspect bank screenshots, review transaction telemetry, and approve/reject payments.</p>
                                                                                    </div>

                                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                                      {/* Provider Filter */}
                                                                                        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/70 mr-1">
                                                                                          <button
                                                                                            onClick={() => setProviderFilter('all')}
                                                                                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${providerFilter === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                                                                                          >
                                                                                            All Banks
                                                                                          </button>
                                                                                          <button
                                                                                            onClick={() => setProviderFilter('telebirr')}
                                                                                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${providerFilter === 'telebirr' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                                                                                          >
                                                                                            Telebirr
                                                                                          </button>
                                                                                          <button
                                                                                            onClick={() => setProviderFilter('cbe')}
                                                                                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${providerFilter === 'cbe' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                                                                                          >
                                                                                            CBE / Bank
                                                                                          </button>
                                                                                        </div>

                                                                                        {/* Status Filter */}
                                                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                                                          <button
                                                                                            onClick={() => setReceiptFilter('all')}
                                                                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${receiptFilter === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                                                                          >
                                                                                            All ({payments.length})
                                                                                          </button>
                                                                                          <button
                                                                                            onClick={() => setReceiptFilter('manual_review')}
                                                                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${receiptFilter === 'manual_review' ? 'bg-amber-600 text-white shadow-xs' : 'bg-amber-50 text-amber-700 border border-amber-200/60 hover:bg-amber-100'}`}
                                                                                          >
                                                                                            Pending ⏳ ({payments.filter(p => p.verification_status === 'manual_review' || p.status === 'pending').length})
                                                                                          </button>
                                                                                          <button
                                                                                            onClick={() => setReceiptFilter('verified')}
                                                                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${receiptFilter === 'verified' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 hover:bg-emerald-100'}`}
                                                                                          >
                                                                                            Verified ✅ ({payments.filter(p => p.verification_status === 'verified' || p.status === 'completed' || p.status === 'approved').length})
                                                                                          </button>
                                                                                          <button
                                                                                            onClick={() => setReceiptFilter('rejected')}
                                                                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${receiptFilter === 'rejected' ? 'bg-rose-600 text-white shadow-xs' : 'bg-rose-50 text-rose-700 border border-rose-200/60 hover:bg-rose-100'}`}
                                                                                          >
                                                                                            Rejected ❌ ({payments.filter(p => p.verification_status === 'rejected' || p.status === 'failed').length})
                                                                                          </button>
                                                                                        </div>
                                                                                      </div>
                                                                                    </div>

                                                                                    <table className="w-full">
                                                                                        <thead className="bg-slate-50/70 border-b border-slate-200/80">
                                                                                          <tr>
                                                                                            <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Date & Provider</th>
                                                                                            <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                                                                                            <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Transaction Ref ID</th>
                                                                                            <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                                                                                            <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Verification Status</th>
                                                                                            <th className="px-4 py-3 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Screenshot</th>
                                                                                            <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                                                                                          </tr>
                                                                                        </thead>
                                                                                          <tbody className="divide-y divide-slate-100">
                                                                                            {loading ? (
                                                                                              <TableSkeleton cols={7} rows={5} avatarCol={false} />
                                                                                            ) : payments.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-xs text-slate-500">No payment receipts found.</td></tr>
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
                                                                                                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                                                                                      <td className="px-4 py-3">
                                                                                                        <div className="text-xs font-bold text-slate-900">{new Date(p.created_at).toLocaleDateString()}</div>
                                                                                                        <div className="text-[10px] text-slate-500 uppercase font-semibold mt-0.5">{p.method}</div>
                                                                                                      </td>

                                                                                                      <td className="px-4 py-3">
                                                                                                        <div className="text-xs font-bold text-slate-900">{p.user?.full_name || 'Student'}</div>
                                                                                                        <div className="text-[11px] text-slate-500">{p.user?.phone || 'N/A'}</div>
                                                                                                      </td>

                                                                                                      <td className="px-4 py-3">
                                                                                                          <span className="font-mono text-[11px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200/80 font-bold">
                                                                                                            {p.transaction_id || 'N/A'}
                                                                                                          </span>
                                                                                                      </td>

                                                                                                        <td className="px-4 py-3 text-xs font-bold text-slate-900">
                                                                                                          {p.amount?.toLocaleString()} ETB
                                                                                                        </td>

                                                                                                        <td className="px-4 py-3">
                                                                                                          {isVerified ? (
                                                                                                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                                                                                                <ShieldCheck className="w-3.5 h-3.5" /> Verified 100%
                                                                                                              </span>
                                                                                                              ) : isRejected ? (
                                                                                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200/60">
                                                                                                                  <XCircle className="w-3.5 h-3.5" /> Rejected
                                                                                                                </span>
                                                                                                                ) : (
                                                                                                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200/60">
                                                                                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Pending Review
                                                                                                                  </span>
                        )}
                                                                                                                </td>

                                                                                                                <td className="px-4 py-3 text-center">
                                                                                                                  {p.receipt_url ? (
                                                                                                                    <button
                                                                                                                      onClick={() => setSelectedReceiptModal(p)}
                                                                                                                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-brand-blue hover:bg-blue-100 border border-blue-200/60 text-xs font-semibold rounded-lg transition-colors"
                                                                                                                    >
                                                                                                                      <Eye className="w-3.5 h-3.5" /> View Receipt
                                                                                                                    </button>
                                                                                                                  ) : (
                          <span className="text-xs text-slate-400 italic">No Image</span>
                                                                                                                  )}
                                                                                                                </td>

                                                                                                                <td className="px-4 py-3 text-right">
                                                                                                                  <div className="flex gap-1.5 justify-end">
                                                                                                                    <button
                                                                                                                      onClick={() => handleVerifyReceipt(p.id, 'approved')}
                                                                                                                      disabled={isVerified}
                                                                                                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg disabled:opacity-40 transition-colors shadow-xs"
                                                                                                                    >
                                                                                                                      Approve
                                                                                                                    </button>
                                                                                                                    <button
                                                                                                                      onClick={() => handleVerifyReceipt(p.id, 'rejected')}
                                                                                                                      disabled={isRejected}
                                                                                                                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/60 text-xs font-semibold rounded-lg disabled:opacity-40 transition-colors"
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
                                                                                                              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setSelectedReceiptModal(null)} />
                                                                                                              <div className="relative z-10 w-full max-w-2xl bg-white rounded-xl p-6 shadow-xl border border-slate-200/80 overflow-hidden max-h-[90vh] flex flex-col">
                                                                                                                <div className="flex justify-between items-center mb-4 border-b border-slate-200/80 pb-3">
                                                                                                                  <div>
                                                                                                                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                                                                                                        <ShieldCheck className="w-5 h-5 text-brand-blue" />
                                                                                                                        Receipt Verification Preview
                                                                                                                      </h3>
                                                                                                                      <p className="text-xs text-slate-500">Student: {selectedReceiptModal.user?.full_name} ({selectedReceiptModal.user?.phone})</p>
                                                                                                                  </div>
                                                                                                                  <button
                                                                                                                    onClick={() => setSelectedReceiptModal(null)}
                                                                                                                    className="text-slate-400 hover:text-slate-600 font-bold text-xl px-2 rounded-lg"
                                                                                                                  >
                                                                                                                    ×
                                                                                                                  </button>
                                                                                                                </div>

                                                                                                                <div className="flex-1 overflow-y-auto space-y-4">
                                                                                                                    <div className="bg-slate-900 rounded-xl p-2 flex justify-center items-center max-h-[450px]">
                                                                                                                      {selectedReceiptModal.receipt_url ? (
                                                                                                                        <img
                                                                                                                          src={selectedReceiptModal.receipt_url}
                                                                                                                          alt="Receipt Screenshot"
                                                                                                                          className="max-h-[420px] object-contain rounded-lg shadow-xs"
                                                                                                                        />
                                                                                                                      ) : (
                  <div className="text-slate-400 py-12 text-xs">No receipt image attached.</div>
                                                                                                                      )}
                                                                                                                    </div>

                                                                                                                        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-xs space-y-2">
                                                                                                                          <div className="font-bold text-slate-900 text-xs mb-1 uppercase tracking-wider">Receipt Telemetry Data</div>
                                                                                                                          <div className="grid grid-cols-2 gap-2 text-slate-700">
                                                                                                                            <div><span className="font-semibold text-slate-500">Provider:</span> {selectedReceiptModal.method}</div>
                                                                                                                            <div><span className="font-semibold text-slate-500">Transaction Ref:</span> <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-900 font-bold">{selectedReceiptModal.transaction_id}</span></div>
                                                                                                                            <div><span className="font-semibold text-slate-500">Amount:</span> <span className="font-bold text-slate-900">{selectedReceiptModal.amount?.toLocaleString()} ETB</span></div>
                                                                                                                            <div><span className="font-semibold text-slate-500">Verification Status:</span> {selectedReceiptModal.verification_status || selectedReceiptModal.status}</div>
                                                                                                                          </div>
                                                                                                                        </div>
                                                                                                                      </div>

                                                                                                                        <div className="flex gap-3 mt-4 pt-3 border-t border-slate-200/80">
                                                                                                                          <button
                                                                                                                            onClick={() => setSelectedReceiptModal(null)}
                                                                                                                            className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                                                                                                                          >
                                                                                                                            Close
                                                                                                                          </button>
                                                                                                                          <button
                                                                                                                            onClick={() => handleVerifyReceipt(selectedReceiptModal.id, 'rejected')}
                                                                                                                            className="flex-1 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/60 text-xs font-semibold rounded-lg transition-colors"
                                                                                                                          >
                                                                                                                            Reject Receipt ❌
                                                                                                                          </button>
                                                                                                                          <button
                                                                                                                            onClick={() => handleVerifyReceipt(selectedReceiptModal.id, 'approved')}
                                                                                                                            className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                                                                                                                          >
                                                                                                                            Approve & Verify ✅
                                                                                                                          </button>
                                                                                                                        </div>
                                                                                                                      </div>
                                                                                                                    </div>
      )}

                                                                                                                    {showPayoutModal && selectedPayout && (
                                                                                                                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                                                                                                                              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setShowPayoutModal(false)} />
                                                                                                                              <div className="relative z-10 w-full max-w-md bg-white rounded-xl p-6 shadow-xl border border-slate-200/80">
                                                                                                                                <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                                                                                                                                  <Banknote className="w-5 h-5 text-emerald-600" />
                                                                                                                                  Process Payout
                                                                                                                                </h3>

                                                                                                                                  <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-xl p-4 mb-4">
                                                                                                                                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount Due</div>
                                                                                                                                    <div className="text-2xl font-bold text-emerald-700">{selectedPayout.amount.toLocaleString()} ETB</div>
                                                                                                                                    <div className="text-xs text-slate-600 mt-0.5">Payable to: {selectedPayout.tutor.users?.full_name}</div>
                                                                                                                                  </div>

                                                                                                                                  <div className="space-y-3">
                                                                                                                                    <div>
                                                                                                                                      <label className="block text-xs font-semibold text-slate-700 mb-1">Bank / Channel *</label>
                                                                                                                                      <select
                                                                                                                                        value={payoutDetails.bankName}
                                                                                                                                        onChange={(e) => setPayoutDetails({ ...payoutDetails, bankName: e.target.value })}
                                                                                                                                        className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                                                                                                                                      >
                                                                                                                                        <option value="">Select Channel</option>
                                                                                                                                        <option value="CBE">CBE Birr</option>
                                                                                                                                        <option value="Telebirr">Telebirr</option>
                                                                                                                                        <option value="Bank Transfer">Bank Transfer</option>
                                                                                                                                        <option value="Cash">Cash</option>
                                                                                                                                      </select>
                                                                                                                                    </div>

                                                                                                                                    <div>
                                                                                                                                      <label className="block text-xs font-semibold text-slate-700 mb-1">Account / Phone *</label>
                                                                                                                                      <input
                                                                                                                                        type="text"
                                                                                                                                        value={payoutDetails.accountNumber}
                                                                                                                                        onChange={(e) => setPayoutDetails({ ...payoutDetails, accountNumber: e.target.value })}
                                                                                                                                        placeholder="Account or phone"
                                                                                                                                        className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                                                                                                                                      />
                                                                                                                                    </div>

                                                                                                                                    <div>
                                                                                                                                      <label className="block text-xs font-semibold text-slate-700 mb-1">Transaction Reference *</label>
                                                                                                                                      <input
                                                                                                                                        type="text"
                                                                                                                                        value={payoutDetails.reference}
                                                                                                                                        onChange={(e) => setPayoutDetails({ ...payoutDetails, reference: e.target.value })}
                                                                                                                                        placeholder="Transaction reference ID"
                                                                                                                                        className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                                                                                                                                      />
                                                                                                                                    </div>

                                                                                                                                    <div>
                                                                                                                                      <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Notes</label>
                                                                                                                                      <textarea
                                                                                                                                        value={payoutDetails.notes}
                                                                                                                                        onChange={(e) => setPayoutDetails({ ...payoutDetails, notes: e.target.value })}
                                                                                                                                        placeholder="Optional internal notes"
                                                                                                                                        rows={2}
                                                                                                                                        className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                                                                                                                                      />
                                                                                                                                    </div>
                                                                                                                                  </div>

                                                                                                                                    <div className="flex gap-3 mt-5">
                                                                                                                                      <button
                                                                                                                                        onClick={() => setShowPayoutModal(false)}
                                                                                                                                        className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
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
                                                                                                                                        className="flex-1 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors shadow-xs"
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
