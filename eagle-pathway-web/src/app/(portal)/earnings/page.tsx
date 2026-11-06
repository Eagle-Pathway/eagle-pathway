'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Wallet,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building,
  CreditCard,
  DollarSign,
  TrendingUp,
  History,
  Plus,
  Calendar,
  X,
} from 'lucide-react';
import { formatDate } from '@/lib/date';
import Link from 'next/link';

interface PayoutRequest {
  id: string;
  tutor_id: string;
  amount: number;
  bank_name: string;
  account_number: string;
  account_name: string;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  created_at: string;
  admin_notes?: string;
}

const SUPPORTED_BANKS = [
  'Commercial Bank of Ethiopia (CBE)',
  'Telebirr (Ethio Telecom)',
  'Awash International Bank',
  'Dashen Bank',
  'Bank of Abyssinia',
  'Cooperative Bank of Oromia',
  'Hibret Bank',
  'Zemen Bank',
];

export default function TutorEarningsPage() {
  const { user } = useAuthStore();
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedHours, setCompletedHours] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [pendingPayout, setPendingPayout] = useState(0);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [bankName, setBankName] = useState(SUPPORTED_BANKS[0]);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState(user?.full_name || '');
  const [amount, setAmount] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState(false);

  useEffect(() => {
    async function fetchEarningsData() {
      if (!user?.id) return;
      try {
        // Fetch tutor bookings for total earnings and completed hours
        const { data: bookingsData } = await supabase
          .from('bookings')
          .select('duration_hours, total_amount, status')
          .eq('tutor_id', user.id);

        if (bookingsData) {
          const completed = bookingsData.filter((b) => b.status === 'completed');
          const hours = completed.reduce((sum, b) => sum + (Number(b.duration_hours) || 1), 0);
          const earned = completed.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);
          setCompletedHours(hours);
          setTotalEarned(earned);
        }

        // Fetch payout requests
        const { data: payoutsData, error: payoutsErr } = await supabase
          .from('payout_requests')
          .select('*')
          .eq('tutor_id', user.id)
          .order('created_at', { ascending: false });

        if (!payoutsErr && payoutsData) {
          setPayouts(payoutsData);
          const pending = payoutsData
            .filter((p) => p.status === 'pending')
            .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
          setPendingPayout(pending);
        }
      } catch (err) {
        console.warn('Failed to load earnings:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchEarningsData();
  }, [user?.id]);

  const availableBalance = Math.max(0, totalEarned - pendingPayout);

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    const numAmount = Number(amount);

    if (!numAmount || numAmount < 100) {
      setModalError('Minimum payout request amount is 100 ETB.');
      return;
    }
    if (numAmount > availableBalance && totalEarned > 0) {
      setModalError(`Requested amount exceeds your available balance of ${availableBalance.toLocaleString()} ETB.`);
      return;
    }
    if (!accountNumber.trim()) {
      setModalError('Please enter your account number or Telebirr phone number.');
      return;
    }

    setModalLoading(true);
    try {
      const payload = {
        tutor_id: user?.id,
        amount: numAmount,
        bank_name: bankName,
        account_number: accountNumber.trim(),
        account_name: accountName.trim() || user?.full_name || 'Tutor',
        status: 'pending',
      };

      const { data, error } = await supabase
        .from('payout_requests')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setPayouts((prev) => [data, ...prev]);
        setPendingPayout((prev) => prev + numAmount);
      }

      setModalSuccess(true);
      setTimeout(() => {
        setShowModal(false);
        setModalSuccess(false);
        setAmount('');
      }, 2000);
    } catch (err: any) {
      console.error('Submit payout error:', err);
      setModalError('Failed to submit payout request. Please try again.');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="text-[#0B2A5B]" size={26} />
            <span>Tutor Earnings &amp; Payouts</span>
          </h1>
          <p className="text-xs text-slate-500">
            Track your tutoring revenue, completed teaching hours, and withdraw your funds to Ethiopian bank accounts or Telebirr.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0B2A5B] to-[#1E4D9B] text-white text-xs font-bold hover:brightness-110 transition-all shadow-sm"
        >
          <ArrowUpRight size={15} />
          <span>Request Payout</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Earned
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {totalEarned.toLocaleString()} <span className="text-xs font-semibold text-slate-400">ETB</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Lifetime completed sessions</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Available Balance
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#0B2A5B]/10 text-[#0B2A5B] flex items-center justify-center">
              <Wallet size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0B2A5B]">
            {availableBalance.toLocaleString()} <span className="text-xs font-semibold text-slate-400">ETB</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">Ready for withdrawal</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pending Payouts
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700">
            {pendingPayout.toLocaleString()} <span className="text-xs font-semibold text-slate-400">ETB</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Processing to bank / Telebirr</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Teaching Hours
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {completedHours} <span className="text-xs font-semibold text-slate-400">Hours</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">1-on-1 student instruction</div>
        </div>
      </div>

      {/* Payout History */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <History size={18} className="text-[#0B2A5B]" />
            <span>Withdrawal &amp; Payout History</span>
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            {payouts.length} total requests
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading payout records...</div>
        ) : payouts.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <CreditCard size={22} />
            </div>
            <p className="text-xs text-slate-500 font-medium">No payout requests yet.</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Once you conduct completed sessions, click &quot;Request Payout&quot; to transfer earnings to CBE or Telebirr.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Bank / Provider</th>
                  <th className="py-3 px-4 font-semibold">Account / Phone</th>
                  <th className="py-3 px-4 font-semibold">Account Name</th>
                  <th className="py-3 px-4 font-semibold">Amount</th>
                  <th className="py-3 px-4 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payouts.map((p) => {
                  const statusColors = {
                    pending: 'bg-amber-50 text-amber-700 border-amber-200',
                    approved: 'bg-blue-50 text-blue-700 border-blue-200',
                    paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    rejected: 'bg-red-50 text-red-700 border-red-200',
                  };

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-4 text-slate-600">
                        {p.created_at ? formatDate(p.created_at) : 'Recent'}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-900">{p.bank_name}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{p.account_number}</td>
                      <td className="py-3.5 px-4 text-slate-800">{p.account_name}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {Number(p.amount).toLocaleString()} ETB
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                            statusColors[p.status] || 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payout Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-[#0B2A5B]/10 text-[#0B2A5B] flex items-center justify-center">
                <Building size={16} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Request Payout</h3>
                <p className="text-[11px] text-slate-500">
                  Direct transfer via CBE or Telebirr (processed within 24 hours).
                </p>
              </div>
            </div>

            {modalSuccess ? (
              <div className="py-8 text-center text-emerald-600 space-y-2">
                <CheckCircle2 size={40} className="mx-auto" />
                <h4 className="font-bold text-sm text-slate-900">Payout Submitted!</h4>
                <p className="text-xs text-slate-500">
                  Our finance team has received your withdrawal request.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRequestPayout} className="space-y-4">
                {modalError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle size={14} className="flex-shrink-0" />
                    <span>{modalError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Bank / Mobile Provider *
                  </label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  >
                    {SUPPORTED_BANKS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Account Number or Telebirr Phone *
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="e.g. 1000123456789 or 0911234567"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B2A5B]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Account Holder Full Name *
                  </label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="e.g. Abebe Kebede"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B2A5B]/20"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Withdrawal Amount (ETB) *
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Avail: {availableBalance.toLocaleString()} ETB
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="100"
                      step="50"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="e.g. 1500"
                      required
                      className="w-full pl-3 pr-14 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B2A5B]/20"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      ETB
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="px-5 py-2.5 rounded-xl bg-[#0B2A5B] text-white text-xs font-bold hover:bg-[#1E4D9B] disabled:opacity-50"
                  >
                    {modalLoading ? 'Submitting...' : 'Confirm Withdrawal'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

