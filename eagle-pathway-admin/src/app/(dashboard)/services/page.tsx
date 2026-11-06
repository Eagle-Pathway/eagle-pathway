'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { Eye, Check, X, Clock, AlertCircle } from 'lucide-react';
import { TableSkeleton } from '@/components/ui/TableSkeleton';

interface ServiceRequest {
  id: string;
  user_id: string;
  service_type: string;
  from_currency: string;
  to_currency: string;
  amount: number;
  country_from: string;
  country_to: string;
  recipient_name: string;
  recipient_bank: string | null;
  recipient_account: string | null;
  reason: string;
  additional_details: string | null;
  status: string;
  admin_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  users?: { full_name: string; email: string };
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  reviewing: 'bg-blue-50 text-brand-blue border-blue-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  completed: 'bg-purple-50 text-purple-700 border-purple-200',
};

export default function ServiceRequestsPage() {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [filter, setFilter] = useState<string>('all');

  async function fetchRequests() {
    setLoading(true);
    const { data, error } = await supabase
      .from('service_requests')
      .select('*, users:users!user_id(full_name, email)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching service requests:', error);
    } else if (data) {
      setRequests(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleStatusUpdate = async (requestId: string, newStatus: 'approved' | 'rejected') => {
    if (!user) return;

    const { error } = await supabase
      .from('service_requests')
      .update({
        status: newStatus,
        admin_note: adminNote || null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (!error) {
      // Notify the user about the decision
      const req = requests.find(r => r.id === requestId);
      if (req) {
        const SERVICE_LABELS: Record<string, string> = {
          international_payment: 'Application Fee',
          application_fee: 'Application Fee',
          tuition_payment: 'Tuition Fee',
          tuition_fee: 'Tuition Fee',
          bank_transfer: 'Embassy Fee',
          international: "Other Int'l Fees",
          other: "Other Int'l Fees",
          // legacy / other values
          study_abroad_fund: 'Study Abroad Fund',
          remittance: 'Remittance',
          diaspora_fund_transfer: 'Diaspora Fund Transfer',
          currency_exchange: 'Currency Exchange',
        };
        const serviceLabel = SERVICE_LABELS[req.service_type] ?? req.service_type.replace(/_/g, ' ');

        await supabase.from('notifications').insert({
          user_id: req.user_id,
          type: 'application_update',
          title: newStatus === 'approved'
            ? `Service Request Approved ✅`
            : `Service Request Rejected ❌`,
          body: newStatus === 'approved'
            ? `Your ${serviceLabel} request of ${req.amount} ${req.from_currency} has been approved. We will process it shortly.`
            : `Your ${serviceLabel} request was rejected. ${adminNote ? `Reason: ${adminNote}` : 'Please contact support for more details.'}`,
          is_read: false,
        });
      }

      fetchRequests();
      setSelectedRequest(null);
      setAdminNote('');
    }
  };

  const filtered = filter === 'all'
    ? requests
    : requests.filter(r => r.status === filter);

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const reviewingCount = requests.filter(r => r.status === 'reviewing').length;
  const approvedCount = requests.filter(r => r.status === 'approved' || r.status === 'completed').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/80 pb-4">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Concierge Requests</div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Service Requests</h1>
            <p className="mt-1 text-xs text-slate-500">Manage international payment and currency exchange requests</p>
          </div>
          </div>

          {/* Overview-style KPI Metric Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Requests</p>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-brand-blue border border-blue-200/60">All</span>
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 tracking-tight">{requests.length}</span>
                <span className="text-xs text-slate-400 font-medium">intake</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Pending Review</p>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${pendingCount > 0 ? 'bg-amber-50 text-amber-700 border border-amber-200/60' : 'bg-slate-100 text-slate-600'}`}>
                  {pendingCount > 0 ? 'Action Req' : 'Clear'}
                </span>
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 tracking-tight">{pendingCount}</span>
                <span className="text-xs text-slate-400 font-medium">awaiting review</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Reviewing</p>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-brand-blue border border-blue-200/60">In Progress</span>
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 tracking-tight">{reviewingCount}</span>
                <span className="text-xs text-slate-400 font-medium">active check</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Approved / Done</p>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60">Settled</span>
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 tracking-tight">{approvedCount}</span>
                <span className="text-xs text-slate-400 font-medium">processed</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/70 w-max overflow-x-auto">
            {['all', 'pending', 'reviewing', 'approved', 'rejected'].map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === s
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/70 border-b border-slate-200/80">
                  <tr>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">User</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Service</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Route</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="text-right px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <TableSkeleton cols={7} rows={5} />
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-xs text-slate-400">
                        No service requests found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="text-xs font-semibold text-slate-900">{req.users?.full_name || 'Unknown'}</p>
                          <p className="text-[11px] text-slate-500">{req.users?.email}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-xs font-medium text-slate-900 capitalize">{req.service_type.replace(/_/g, ' ')}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-xs font-bold text-slate-900">
                            {req.from_currency} {req.amount.toLocaleString()}
                          </p>
                          <p className="text-[11px] text-slate-500">→ {req.to_currency}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-xs text-slate-600">{req.country_from} → {req.country_to}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusColors[req.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-500">
                          {new Date(req.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => setSelectedRequest(req)}
                            className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors inline-flex items-center justify-center"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detail Modal */}
          {selectedRequest && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200/80 shadow-xl animate-in zoom-in-95 duration-200">
                <div className="p-5 border-b border-slate-200/80 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Service Request Details</h2>
                      <p className="text-xs text-slate-500">Applicant: {selectedRequest.users?.full_name}</p>
                    </div>
                    <button
                      onClick={() => { setSelectedRequest(null); setAdminNote(''); }}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="p-5 space-y-5 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-slate-400 text-[11px] font-medium uppercase tracking-wider">Service Type</p>
                      <p className="font-semibold text-slate-900 capitalize mt-0.5">{selectedRequest.service_type.replace(/_/g, ' ')}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[11px] font-medium uppercase tracking-wider">Status</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border mt-0.5 ${statusColors[selectedRequest.status]}`}>
                        {selectedRequest.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[11px] font-medium uppercase tracking-wider">Amount</p>
                      <p className="font-bold text-slate-900 mt-0.5">
                        {selectedRequest.from_currency} {selectedRequest.amount.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[11px] font-medium uppercase tracking-wider">Converted To</p>
                      <p className="font-semibold text-slate-900 mt-0.5">{selectedRequest.to_currency}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[11px] font-medium uppercase tracking-wider">From Country</p>
                      <p className="font-medium text-slate-800 mt-0.5">{selectedRequest.country_from}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[11px] font-medium uppercase tracking-wider">To Country</p>
                      <p className="font-medium text-slate-800 mt-0.5">{selectedRequest.country_to}</p>
                    </div>
                  </div>

                  <div className="border-t border-slate-200/80 pt-4">
                    <p className="text-slate-500 font-semibold mb-2">Recipient Details</p>
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-1.5">
                      <p><span className="text-slate-400 font-medium">Name:</span> <span className="font-semibold text-slate-900">{selectedRequest.recipient_name}</span></p>
                      {selectedRequest.recipient_bank && <p><span className="text-slate-400 font-medium">Bank:</span> <span className="text-slate-800">{selectedRequest.recipient_bank}</span></p>}
                      {selectedRequest.recipient_account && <p><span className="text-slate-400 font-medium">Account:</span> <span className="font-mono text-slate-800">{selectedRequest.recipient_account}</span></p>}
                    </div>
                  </div>

                  <div>
                    <p className="text-slate-500 font-semibold mb-1">Reason</p>
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
                      <p className="text-slate-700">{selectedRequest.reason}</p>
                    </div>
                  </div>

                  {selectedRequest.additional_details && (
                    <div>
                      <p className="text-slate-500 font-semibold mb-1">Additional Details</p>
                      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
                        <p className="text-slate-700">{selectedRequest.additional_details}</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-slate-500 font-semibold mb-1">Admin Note (Optional)</p>
                    <textarea
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Add a note or instruction for the applicant..."
                      className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-brand-blue/20 outline-none"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="p-4 border-t border-slate-200/80 bg-slate-50/50 flex gap-3">
                  <button
                    onClick={() => handleStatusUpdate(selectedRequest.id, 'rejected')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold hover:bg-rose-100 transition-colors"
                  >
                    <X className="h-4 w-4" />
                    Reject
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedRequest.id, 'approved')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-xs"
                  >
                    <Check className="h-4 w-4" />
                    Approve
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        );
}
