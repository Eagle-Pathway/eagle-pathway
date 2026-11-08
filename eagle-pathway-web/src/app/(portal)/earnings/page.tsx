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
  TrendingUp,
  History,
  Plus,
  Calendar,
  X,
} from 'lucide-react';
import { formatDate } from '@/lib/date';
import Link from 'next/link';

interface PayoutRecord {
  id: string;
  tutor_id: string;
  amount: number;
  bank_name: string;
  account_number: string;
  reference?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'paid' | 'approved' | 'rejected';
  notes?: string;
  created_at: string;
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
  const [tutorProfileId, setTutorProfileId] = useState<string | null>(null);
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
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
        // Resolve Tutor profile ID (tutors.id) from tutors table
        const { data: tutorProfile } = await supabase
          .from('tutors')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        const resolvedTutorId = tutorProfile?.id || user.id;
        setTutorProfileId(resolvedTutorId);

        // Fetch completed bookings for this tutor
        const { data: bookingsData } = await supabase
          .from('bookings')
          .select('duration_hours, total_amount, amount, status')
          .or(`tutor_id.eq.${resolvedTutorId},tutor_id.eq.${user.id}`);

        if (bookingsData) {
          const completed = bookingsData.filter((b) => b.status === 'completed');
          const hours = completed.reduce((sum, b) => sum + (Number(b.duration_hours) || 1), 0);
          const earned = completed.reduce((sum, b) => sum + (Number(b.total_amount || b.amount) || 0), 0);
          setCompletedHours(hours);
          setTotalEarned(earned);
        }

        // Fetch payout history from tutor_payouts
        const { data: payoutsData, error: payoutsErr } = await supabase
          .from('tutor_payouts')
          .select('*')
          .or(`tutor_id.eq.${resolvedTutorId},tutor_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (!payoutsErr && payoutsData) {
          setPayouts(payoutsData as PayoutRecord[]);
          const pending = payoutsData
            .filter((p) => p.status === 'pending' || p.status === 'processing')
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
        tutor_id: tutorProfileId || user?.id,
        amount: numAmount,
        bank_name: bankName,
        account_number: accountNumber.trim(),
        notes: `Account Holder: ${accountName.trim() || user?.full_name || 'Tutor'}`,
        status: 'pending',
      };

      const { data, error } = await supabase
        .from('tutor_payouts')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setPayouts((prev) => [data as PayoutRecord, ...prev]);
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
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-blue mb-1">
            <Wallet size={14} />
            <span>Educator Treasury</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Tutor Earnings &amp; Payouts
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track your tutoring revenue, completed teaching hours, and withdraw your funds to Ethiopian bank accounts or Telebirr.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-blue text-white text-xs font-semibold hover:bg-brand-blue/90 transition-colors shadow-xs self-start sm:self-auto"
        >
          <ArrowUpRight size={14} />
          <span>Request Payout</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between hover:border-slate-300 hover:shadow-xs transition-all relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
              Total Earned
            </span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              Gross
            </span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              {totalEarned.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 font-medium block mt-0.5">ETB lifetime sessions</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between hover:border-slate-300 hover:shadow-xs transition-all relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
              Available Balance
            </span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-brand-blue border border-blue-200/60">
              Withdrawable
            </span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-brand-blue tracking-tight">
              {availableBalance.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 font-medium block mt-0.5">ETB ready for transfer</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between hover:border-slate-300 hover:shadow-xs transition-all relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
              Pending Payouts
            </span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200/60">
              In Review
            </span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-amber-700 tracking-tight">
              {pendingPayout.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 font-medium block mt-0.5">ETB bank transfer queue</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between hover:border-slate-300 hover:shadow-xs transition-all relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
              Teaching Hours
            </span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
              Logged
            </span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">{completedHours} hrs</span>
            <span className="text-xs text-slate-400 font-medium block mt-0.5">1-on-1 instruction</span>
          </div>
        </div>
      </div>

      {/* Payout History */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <History size={16} className="text-brand-blue" />
            <h3 className="text-sm font-bold text-slate-900">Withdrawal &amp; Payout History</h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {payouts.length} total requests
          </span>
        </div>

        {loading ? (
          <div className="space-y-3 py-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-slate-100 rounded-lg w-full" />
            ))}
          </div>
        ) : payouts.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2.5">
              <CreditCard size={20} />
            </div>
            <p className="text-xs text-slate-500 font-semibold">No payout requests yet.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Once you conduct completed sessions, click &quot;Request Payout&quot; to transfer earnings to CBE or Telebirr.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Bank / Provider</th>
                  <th className="py-3 px-4 font-semibold">Account / Phone</th>
                  <th className="py-3 px-4 font-semibold">Account Name</th>
                  <th className="py-3 px-4 font-semibold">Amount</th>
                  <th className="py-3 px-4 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {payouts.map((p) => {
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 text-slate-600">
                        {p.created_at ? formatDate(p.created_at) : 'Recent'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{p.bank_name}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{p.account_number}</td>
                      <td className="py-3 px-4 text-slate-800">
                        {p.notes ? p.notes.replace('Account Holder: ', '') : user?.full_name || 'Tutor'}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {Number(p.amount).toLocaleString()} ETB
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border uppercase tracking-wider ${
                            p.status === 'completed' || p.status === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                              : p.status === 'approved' || p.status === 'processing'
                              ? 'bg-blue-50 text-brand-blue border-blue-200/60'
                              : p.status === 'failed' || p.status === 'rejected'
                              ? 'bg-rose-50 text-rose-700 border-rose-200/60'
                              : 'bg-amber-50 text-amber-700 border-amber-200/60'
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center">
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
                <CheckCircle2 size={36} className="mx-auto" />
                <h4 className="font-bold text-sm text-slate-900">Payout Submitted!</h4>
                <p className="text-xs text-slate-500">
                  Our finance team has received your withdrawal request.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRequestPayout} className="space-y-3.5">
                {modalError && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle size={14} className="flex-shrink-0" />
                    <span>{modalError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Select Bank / Mobile Provider *
                  </label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  >
                    {SUPPORTED_BANKS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Account Number or Telebirr Phone *
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="e.g. 1000123456789 or 0911234567"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Account Holder Full Name *
                  </label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="e.g. Abebe Kebede"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
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
                      className="w-full pl-3 pr-14 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                      ETB
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="px-4 py-2 rounded-xl bg-brand-blue text-white text-xs font-semibold hover:bg-brand-blue/90 disabled:opacity-50 shadow-xs transition-colors"
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
