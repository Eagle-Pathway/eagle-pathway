'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { DollarSign, TrendingUp, Wallet, Loader2, Banknote } from 'lucide-react';
import { verifyPaymentReceipt, completePayoutRequest, getFinanceStats } from '@/app/actions';
import { useAuthStore } from '@/store/useAuthStore';

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
  const [notification, setNotification] = useState<{type: 'error' | 'success' | 'info'; message: string} | null>(null);
  
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<{tutor: TutorFinancials; amount: number} | null>(null);
  const [payoutDetails, setPayoutDetails] = useState({ bankName: '', accountNumber: '', reference: '', notes: '' });
  const [isProcessingPayout, setIsProcessingPayout] = useState(false);
  const [isUpdatingPayoutRequestId, setIsUpdatingPayoutRequestId] = useState<string | null>(null);
  const [isUpdatingPaymentId, setIsUpdatingPaymentId] = useState<string | null>(null);
  const [summary, setSummary] = useState({
    grossVolume: 0,
    platformProfit: 0,
    totalPayouts: 0,
    payoutsDue: 0
  });

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
      if (!session?.access_token) return;

      const { summary: financeSummary, tutorStats } = await getFinanceStats(session.access_token);
      setSummary(financeSummary);
      setTutors(tutorStats as any[]);

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
  }, []);

  const { session } = useAuthStore();

  const handleVerifyReceipt = async (paymentId: string, status: 'approved' | 'rejected') => {
    if (isUpdatingPaymentId) return;
    setIsUpdatingPaymentId(paymentId);
    try {
      if (!session?.access_token) {
        throw new Error('You must be logged in to perform this action.');
      }

      await verifyPaymentReceipt(session.access_token, paymentId, status);
      
      setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status } : p));
      showNotification('success', `Receipt ${status}.`);
    } catch (error: any) {
      showNotification('error', error.message || 'Failed to verify receipt.');
    } finally {
      setIsUpdatingPaymentId(null);
    }
  };

  const handleCompletePayoutRequest = async (requestId: string) => {
    setIsUpdatingPayoutRequestId(requestId);
    try {
      if (!session?.access_token) {
        throw new Error('You must be logged in to perform this action.');
      }

      await completePayoutRequest(session.access_token, requestId);
      showNotification('success', 'Payout request marked as completed.');
      await fetchData();
    } catch (error: any) {
      showNotification('error', error.message || 'Failed to complete payout request.');
    } finally {
      setIsUpdatingPayoutRequestId(null);
    }
  };

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
            <div className="text-3xl font-bold text-gray-900">{summary.grossVolume.toLocaleString()} ETB</div>
            <p className="text-xs text-gray-400 mt-2">All approved payments</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-t-4 border-t-green-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-500">Platform Profit</h3>
            <div className="p-2 bg-green-50 rounded-lg text-green-600"><DollarSign className="w-5 h-5" /></div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">{summary.platformProfit.toLocaleString()} ETB</div>
            <p className="text-xs text-green-600 font-medium mt-2">Revenue from fees</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-500">Owed to Tutors</h3>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600"><Wallet className="w-5 h-5" /></div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">{summary.payoutsDue.toLocaleString()} ETB</div>
            <p className="text-xs text-gray-400 mt-2">Net unpaid earnings</p>
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
                <tr><td colSpan={5} className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>
              ) : filteredTutors.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">No records</td></tr>
              ) : filteredTutors.map((t: any) => {
                const gross = t.gross_value || 0;
                const net = t.net_earnings || 0;
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
              {payoutRequests.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">No payouts</td></tr>
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
              {transactions.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">No transactions</td></tr>
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
          <div className="p-4 border-b font-bold">Manual Payments</div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Student</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Amount</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {payments.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">No payments</td></tr>
              ) : payments.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3">
                    <div>{new Date(p.created_at).toLocaleDateString()}</div>
                    <div className="text-xs text-gray-500">{p.method}</div>
                  </td>
                  <td className="px-4 py-3 font-medium">{p.user?.full_name}</td>
                  <td className="px-4 py-3 font-bold">{p.amount?.toLocaleString()} ETB</td>
                  <td className="px-4 py-3">
                    {p.status === 'pending' ? (
                      <div className="flex gap-1">
                        <button 
                          disabled={isUpdatingPaymentId === p.id}
                          onClick={() => handleVerifyReceipt(p.id, 'rejected')} 
                          className="px-2 py-1 bg-red-50 text-red-600 text-xs rounded disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <button 
                          disabled={isUpdatingPaymentId === p.id}
                          onClick={() => handleVerifyReceipt(p.id, 'approved')} 
                          className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded disabled:opacity-50 flex items-center gap-1"
                        >
                          {isUpdatingPaymentId === p.id && <Loader2 className="w-3 h-3 animate-spin" />}
                          Approve
                        </button>
                      </div>
                    ) : (
                      <span className={`px-2 py-1 text-xs rounded-full ${p.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {p.status}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
