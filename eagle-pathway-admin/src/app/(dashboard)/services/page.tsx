'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { Eye, Check, X, Clock, AlertCircle } from 'lucide-react';

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
  pending: 'bg-yellow-100 text-yellow-800',
  reviewing: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  completed: 'bg-purple-100 text-purple-800',
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

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Requests</h1>
          <p className="text-gray-500 mt-1">Manage international payment and currency exchange requests</p>
        </div>
        <div className="flex gap-2">
          {['all', 'pending', 'reviewing', 'approved', 'rejected'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === s
                  ? 'bg-brand-blue text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-brand-blue border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
          <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No service requests found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">User</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Service</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Route</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{req.users?.full_name || 'Unknown'}</p>
                    <p className="text-sm text-gray-500">{req.users?.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900 capitalize">{req.service_type.replace(/_/g, ' ')}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900">
                      {req.from_currency} {req.amount.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">→ {req.to_currency}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600">{req.country_from} → {req.country_to}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[req.status] || 'bg-gray-100'}`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(req.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedRequest(req)}
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Service Request Details</h2>
                <button
                  onClick={() => { setSelectedRequest(null); setAdminNote(''); }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Service Type</p>
                  <p className="font-semibold text-gray-900 capitalize">{selectedRequest.service_type.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[selectedRequest.status]}`}>
                    {selectedRequest.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="font-semibold text-gray-900">
                    {selectedRequest.from_currency} {selectedRequest.amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Converted To</p>
                  <p className="font-semibold text-gray-900">{selectedRequest.to_currency}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">From Country</p>
                  <p className="font-medium text-gray-900">{selectedRequest.country_from}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">To Country</p>
                  <p className="font-medium text-gray-900">{selectedRequest.country_to}</p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <p className="text-sm text-gray-500 mb-2">Recipient Details</p>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <p><span className="text-gray-500">Name:</span> {selectedRequest.recipient_name}</p>
                  {selectedRequest.recipient_bank && <p><span className="text-gray-500">Bank:</span> {selectedRequest.recipient_bank}</p>}
                  {selectedRequest.recipient_account && <p><span className="text-gray-500">Account:</span> {selectedRequest.recipient_account}</p>}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">Reason</p>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-900">{selectedRequest.reason}</p>
                </div>
              </div>

              {selectedRequest.additional_details && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Additional Details</p>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-gray-900">{selectedRequest.additional_details}</p>
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-500 mb-2">Admin Note (Optional)</p>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Add a note for the user..."
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm"
                  rows={3}
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => handleStatusUpdate(selectedRequest.id, 'rejected')}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-colors"
              >
                <X className="h-5 w-5" />
                Reject
              </button>
              <button
                onClick={() => handleStatusUpdate(selectedRequest.id, 'approved')}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
              >
                <Check className="h-5 w-5" />
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
