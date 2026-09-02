'use client';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Feedback';
import { 
  Search, 
  Calendar, 
  User, 
  CreditCard, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  Video,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  BookOpen,
  DollarSign,
  GraduationCap,
  X
} from 'lucide-react';
import { exportToCSV } from '@/utils/export';
import { TableSkeleton } from '@/components/ui/TableSkeleton';

interface Booking {
  id: string;
  student_id: string;
  tutor_id: string;
  session_time?: string;
  session_date?: string;
  subject?: string;
  amount?: number;
  total_amount?: number;
  platform_fee?: number;
  duration_hours?: number;
  session_type?: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';
  created_at: string;
  // Enriched
  student?: {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
  };
  tutor?: {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
  };
}

function formatSessionDateTime(sessionDate?: string, sessionTime?: string, createdAt?: string) {
  // If we have session_date (e.g. "2026-09-02")
  if (sessionDate) {
    let dateStr = sessionDate;
    try {
      if (sessionDate.includes('T')) {
        const d = new Date(sessionDate);
        if (!isNaN(d.getTime())) {
          dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        }
      } else {
        const parts = sessionDate.split('-');
        if (parts.length === 3) {
          const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
          if (!isNaN(d.getTime())) {
            dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
          }
        }
      }
    } catch {
      dateStr = sessionDate;
    }

    let timeStr = sessionTime || '';
    if (sessionTime && sessionTime.includes('T')) {
      const d = new Date(sessionTime);
      if (!isNaN(d.getTime())) {
        timeStr = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
      }
    }

    return { dateStr, timeStr };
  }

  // If we only have session_time
  if (sessionTime) {
    if (sessionTime.includes('T')) {
      const d = new Date(sessionTime);
      if (!isNaN(d.getTime())) {
        return {
          dateStr: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
          timeStr: d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
        };
      }
    }
    return { dateStr: 'Date TBD', timeStr: sessionTime };
  }

  // Fallback to createdAt
  if (createdAt) {
    const d = new Date(createdAt);
    if (!isNaN(d.getTime())) {
      return {
        dateStr: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
        timeStr: d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
      };
    }
  }

  return { dateStr: 'Date TBD', timeStr: '' };
}

export default function BookingsPage() {
  const toast = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function fetchBookings() {
    setLoading(true);
    try {
      const { data: bData, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (bData && bData.length > 0) {
        const studentIds = Array.from(new Set(bData.map((b: any) => b.student_id).filter(Boolean)));
        const tutorRowIds = Array.from(new Set(bData.map((b: any) => b.tutor_id).filter(Boolean)));

        const [{ data: usersData }, { data: tutorsData }] = await Promise.all([
          supabase.from('users').select('id, full_name, email, phone').in('id', Array.from(new Set([...studentIds, ...tutorRowIds]))),
          supabase.from('tutors').select('id, user_id, user:users(id, full_name, email, phone)').in('id', tutorRowIds),
        ]);

        const userMap = new Map(usersData?.map((u: any) => [u.id, u]) || []);
        const tutorMap = new Map(tutorsData?.map((t: any) => [t.id, t]) || []);

        const enriched = bData.map((b: any) => {
          const student = userMap.get(b.student_id);
          
          const tutorRow: any = tutorMap.get(b.tutor_id);
          const tutorUser = tutorRow?.user 
            ? (Array.isArray(tutorRow.user) ? tutorRow.user[0] : tutorRow.user)
            : userMap.get(b.tutor_id);

          return {
            ...b,
            student: student || { id: b.student_id, full_name: 'Unknown Student', email: '' },
            tutor: tutorUser || { id: b.tutor_id, full_name: 'Unassigned Tutor', email: '' },
          };
        });

        setBookings(enriched as Booking[]);
      } else {
        setBookings([]);
      }
    } catch (err: any) {
      console.error('Failed to load bookings:', err);
      toast('error', 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleStatusChange = async (booking: Booking, newStatus: Booking['status']) => {
    setUpdatingId(booking.id);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', booking.id);

      if (error) throw error;

      setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status: newStatus } : b));
      if (selectedBooking?.id === booking.id) {
        setSelectedBooking(prev => prev ? { ...prev, status: newStatus } : null);
      }

      toast('success', `Booking marked as ${newStatus.toUpperCase()}`);

      // Send push notification to student
      if (booking.student_id) {
        supabase.from('notifications').insert({
          user_id: booking.student_id,
          title: `Session ${newStatus === 'confirmed' ? 'Confirmed 🟢' : newStatus === 'cancelled' ? 'Cancelled 🔴' : 'Status Updated'}`,
          body: `Your tutoring session with ${booking.tutor?.full_name || 'your tutor'} is now ${newStatus.toUpperCase()}.`,
          type: 'booking_update',
          is_read: false,
        }).then(() => {});
      }
    } catch (err: any) {
      toast('error', err.message || 'Failed to update booking status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': 
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Confirmed</span>;
      case 'pending': 
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200">Pending</span>;
      case 'completed': 
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200">Completed</span>;
      case 'cancelled': 
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-200">Cancelled</span>;
      case 'rejected': 
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-700 border border-gray-200">Rejected</span>;
      default: 
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-600 capitalize">{status}</span>;
    }
  };

  const filtered = useMemo(() => {
    return bookings.filter(b => {
      const matchesSearch = 
        b.student?.full_name?.toLowerCase().includes(search.toLowerCase()) || 
        b.student?.email?.toLowerCase().includes(search.toLowerCase()) || 
        b.tutor?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        b.tutor?.email?.toLowerCase().includes(search.toLowerCase()) ||
        b.subject?.toLowerCase().includes(search.toLowerCase()) ||
        b.id.toLowerCase().includes(search.toLowerCase());
      
      const matchesFilter = filterStatus === 'all' || b.status?.toLowerCase() === filterStatus.toLowerCase();
      
      return matchesSearch && matchesFilter;
    });
  }, [bookings, search, filterStatus]);

  // Statistics
  const stats = useMemo(() => {
    const total = bookings.length;
    const confirmed = bookings.filter(b => b.status === 'confirmed').length;
    const pending = bookings.filter(b => b.status === 'pending').length;
    const completed = bookings.filter(b => b.status === 'completed').length;
    const totalVolume = bookings
      .filter(b => b.status === 'confirmed' || b.status === 'completed')
      .reduce((sum, b) => sum + (Number(b.total_amount ?? b.amount) || 0), 0);
    return { total, confirmed, pending, completed, totalVolume };
  }, [bookings]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  
  const paginatedBookings = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatus]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tutoring Bookings</h1>
          <p className="mt-1 text-sm text-gray-500">Manage student tutoring sessions, tutors, and payments</p>
        </div>

        <button 
          onClick={() => exportToCSV(
            filtered.map(b => {
              const { dateStr, timeStr } = formatSessionDateTime(b.session_date, b.session_time, b.created_at);
              return {
                ID: b.id,
                Date: dateStr,
                Time: timeStr,
                Subject: b.subject || 'General Tutoring',
                Student: b.student?.full_name,
                StudentEmail: b.student?.email,
                Tutor: b.tutor?.full_name,
                TutorEmail: b.tutor?.email,
                Amount: Number(b.total_amount ?? b.amount ?? 0),
                DurationHours: b.duration_hours,
                Status: b.status,
              };
            }), 
            'bookings_export'
          )}
          className="flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-colors text-sm font-semibold whitespace-nowrap"
        >
          <Download className="w-4 h-4 mr-2 text-gray-500" />
          Export CSV
        </button>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider">
            <span>Total Bookings</span>
            <Calendar className="w-4 h-4 text-brand-blue" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.total}</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider">
            <span>Pending Review</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-2">{stats.pending}</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider">
            <span>Confirmed / Active</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2">{stats.confirmed}</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider">
            <span>Gross Volume</span>
            <DollarSign className="w-4 h-4 text-brand-gold" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalVolume.toLocaleString()} ETB</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by student, tutor, subject, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-blue focus:border-brand-blue outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-brand-blue focus:border-brand-blue block p-2 transition-colors cursor-pointer outline-none w-full sm:w-auto"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending Only</option>
            <option value="confirmed">Confirmed Only</option>
            <option value="completed">Completed Only</option>
            <option value="cancelled">Cancelled Only</option>
            <option value="rejected">Rejected Only</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/80">
              <tr>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Session Details</th>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Student</th>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Assigned Tutor</th>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Fee / Price</th>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <TableSkeleton cols={6} rows={5} avatarCol={false} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400">
                    No bookings found matching your search.
                  </td>
                </tr>
              ) : (
                paginatedBookings.map((booking) => {
                  const { dateStr, timeStr } = formatSessionDateTime(booking.session_date, booking.session_time, booking.created_at);
                  const price = Number(booking.total_amount ?? booking.amount ?? 0);

                  return (
                    <tr key={booking.id} className="hover:bg-gray-50/60 transition-colors">
                      {/* Session Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-brand-blue/10 flex items-center justify-center text-brand-blue flex-shrink-0 mt-0.5">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900">
                              {dateStr} {timeStr && <span className="text-xs font-semibold text-gray-500">· {timeStr}</span>}
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-brand-blue uppercase">
                                {booking.subject || 'General Tutoring'}
                              </span>
                              {booking.duration_hours && (
                                <span className="flex items-center text-[11px] text-gray-500">
                                  <Clock className="w-3 h-3 mr-1 text-gray-400" />
                                  {booking.duration_hours} hr{booking.duration_hours > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Student */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                            {booking.student?.full_name?.charAt(0).toUpperCase() || 'S'}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900">{booking.student?.full_name || 'Anonymous Student'}</div>
                            <div className="text-xs text-gray-500">{booking.student?.email || booking.student?.phone || 'No contact'}</div>
                          </div>
                        </div>
                      </td>

                      {/* Tutor */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-full bg-brand-blue/10 text-brand-blue font-bold text-xs flex items-center justify-center flex-shrink-0">
                            {booking.tutor?.full_name?.charAt(0).toUpperCase() || 'T'}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900">
                              {booking.tutor?.full_name && booking.tutor.full_name !== 'Unknown' 
                                ? booking.tutor.full_name 
                                : 'Unassigned Tutor'}
                            </div>
                            <div className="text-xs text-gray-500">{booking.tutor?.email || booking.tutor?.phone || 'Verified Tutor'}</div>
                          </div>
                        </div>
                      </td>

                      {/* Price / Fee */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">
                          {price > 0 ? `${price.toLocaleString()} ETB` : '400 ETB'}
                        </div>
                        {booking.session_type && (
                          <div className="text-[11px] text-gray-400 capitalize flex items-center mt-0.5">
                            {booking.session_type === 'online' ? (
                              <Video className="w-3 h-3 mr-1 text-blue-500" />
                            ) : (
                              <MapPin className="w-3 h-3 mr-1 text-amber-500" />
                            )}
                            {booking.session_type}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(booking.status)}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => setSelectedBooking(booking)}
                            className="px-2.5 py-1 text-xs font-bold text-brand-blue bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            Inspect
                          </button>
                          
                          <select
                            value={booking.status || 'pending'}
                            disabled={updatingId === booking.id}
                            onChange={(e) => handleStatusChange(booking, e.target.value as any)}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg border border-gray-200 bg-white text-gray-700 hover:border-brand-blue focus:ring-2 focus:ring-brand-blue outline-none cursor-pointer"
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {!loading && filtered.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/60 flex items-center justify-between">
            <div className="text-sm text-gray-400">
               Showing <span className="font-semibold text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-semibold text-gray-900">{Math.min(currentPage * itemsPerPage, filtered.length)}</span> of <span className="font-semibold text-gray-900">{filtered.length}</span>
            </div>
            <div className="flex items-center space-x-2">
               <button 
                 onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                 disabled={currentPage === 1}
                 className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:bg-white hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
               >
                 <ChevronLeft className="w-5 h-5" />
               </button>
               <span className="text-sm font-medium text-gray-700 bg-white border border-gray-200 px-3 py-1 rounded-lg shadow-sm">
                 {currentPage} / {totalPages}
               </span>
               <button 
                 onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                 disabled={currentPage === totalPages}
                 className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:bg-white hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
               >
                 <ChevronRight className="w-5 h-5" />
               </button>
            </div>
          </div>
        )}
      </div>

      {/* Booking Inspection Detail Modal */}
      {selectedBooking && (() => {
        const { dateStr, timeStr } = formatSessionDateTime(selectedBooking.session_date, selectedBooking.session_time, selectedBooking.created_at);
        const price = Number(selectedBooking.total_amount ?? selectedBooking.amount ?? 0);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Session Details</h3>
                    <p className="text-xs text-gray-400">ID: {selectedBooking.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-blue-50/50 border border-blue-100">
                  <div>
                    <span className="text-[11px] font-bold text-brand-blue uppercase tracking-wider block">Subject</span>
                    <span className="text-sm font-bold text-gray-900">{selectedBooking.subject || 'General Tutoring'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-bold text-brand-blue uppercase tracking-wider block">Session Price</span>
                    <span className="text-sm font-bold text-emerald-600">{price > 0 ? `${price.toLocaleString()} ETB` : '400 ETB'}</span>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="p-4 rounded-2xl border border-gray-100 space-y-1 bg-gray-50/40">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Scheduled Date & Time</span>
                  <p className="text-sm font-bold text-gray-900">{dateStr} {timeStr && `· ${timeStr}`}</p>
                </div>

                {/* Student Card */}
                <div className="p-4 rounded-2xl border border-gray-100 space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Student</span>
                  <p className="text-sm font-bold text-gray-900">{selectedBooking.student?.full_name}</p>
                  <p className="text-xs text-gray-500">{selectedBooking.student?.email} {selectedBooking.student?.phone && `· ${selectedBooking.student.phone}`}</p>
                </div>

                {/* Tutor Card */}
                <div className="p-4 rounded-2xl border border-gray-100 space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Assigned Tutor</span>
                  <p className="text-sm font-bold text-gray-900">{selectedBooking.tutor?.full_name || 'Unassigned'}</p>
                  <p className="text-xs text-gray-500">{selectedBooking.tutor?.email} {selectedBooking.tutor?.phone && `· ${selectedBooking.tutor.phone}`}</p>
                </div>

                {/* Session Meta */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="text-gray-400 block font-medium">Session Type</span>
                    <span className="font-bold text-gray-800 capitalize">{selectedBooking.session_type || 'Online'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="text-gray-400 block font-medium">Duration</span>
                    <span className="font-bold text-gray-800">{selectedBooking.duration_hours || 1.5} Hour(s)</span>
                  </div>
                </div>

                {/* Notes */}
                {selectedBooking.notes && (
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs">
                    <span className="text-gray-400 block font-medium mb-1">Student Notes</span>
                    <p className="text-gray-700 italic">&ldquo;{selectedBooking.notes}&rdquo;</p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400">Current Status:</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleStatusChange(selectedBooking, 'cancelled')}
                    className="px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors"
                  >
                    Cancel & Refund
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedBooking, 'confirmed')}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors"
                  >
                    Confirm Session
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
