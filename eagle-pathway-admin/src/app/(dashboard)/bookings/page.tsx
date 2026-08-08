'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Calendar, User, CreditCard, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { exportToCSV } from '@/utils/export';
import { TableSkeleton } from '@/components/ui/TableSkeleton';

interface Booking {
  id: string;
  student_id: string;
  tutor_id: string;
  status: string;
  scheduled_at: string;
  payment_status: string;
  // Joins
  student?: { full_name: string; email: string };
  tutor?: { full_name: string; email: string };
  users_student_id?: { full_name: string; email: string };
  users_tutor_id?: { full_name: string; email: string };
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  async function fetchBookings() {
    setLoading(true);
    // Explicit joins using foreign key hints if needed, or normal fetch followed by manual user match
    const { data: bData, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && bData) {
      // Manually fetch users to avoid complex join syntax errors across same table
      const userIds = [...new Set(bData.flatMap((b: any) => [b.student_id, b.tutor_id]))];
      const { data: usersData } = await supabase.from('users').select('id, full_name, email').in('id', userIds);
      
      const userMap = new Map(usersData?.map((u: any) => [u.id, u]) || []);
      
      const enrichedBookings = bData.map((b: any) => ({
        ...b,
        student: userMap.get(b.student_id),
        tutor: userMap.get(b.tutor_id),
        // Fallback for UI that expects a single date string
        scheduled_at: `${b.session_date} ${b.session_time}`,
      }));

      setBookings(enrichedBookings as Booking[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchBookings();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filtered = bookings.filter(b => 
    b.student?.full_name?.toLowerCase().includes(search.toLowerCase()) || 
    b.tutor?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    b.status?.toLowerCase().includes(search.toLowerCase())
  );

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  
  const paginatedBookings = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
          <p className="mt-1 text-sm text-gray-500">Manage tutoring sessions and payments</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
           <div className="relative w-full max-w-md">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
               <Search className="h-4 w-4 text-gray-400" />
             </div>
             <input
               type="text"
               placeholder="Search by student, tutor, or status..."
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-brand-blue focus:border-brand-blue"
             />
           </div>
           
           <button 
             onClick={() => exportToCSV(
               filtered.map(b => ({ ID: b.id, Status: b.status, Payment: b.payment_status, Student: b.student?.full_name, Tutor: b.tutor?.full_name, Date: b.scheduled_at })), 
               'bookings_export'
             )}
             className="flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors text-sm font-medium whitespace-nowrap"
           >
             <Download className="w-4 h-4 mr-2 text-gray-500" />
             Export CSV
           </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session Info</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <TableSkeleton cols={5} rows={5} avatarCol={false} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">No bookings found.</td>
                </tr>
              ) : (
                paginatedBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-brand-blue" />
                        {new Date(booking.scheduled_at).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 ml-6">ID: {booking.id.slice(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-2">
                        <div className="text-sm flex items-center">
                           <span className="w-16 text-xs text-gray-500">Student:</span> 
                           <span className="font-medium text-gray-900">{booking.student?.full_name || 'Unknown'}</span>
                        </div>
                        <div className="text-sm flex items-center">
                           <span className="w-16 text-xs text-gray-500">Tutor:</span> 
                           <span className="font-medium text-gray-900">{booking.tutor?.full_name || 'Unknown'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <CreditCard className={`w-4 h-4 mr-1.5 ${booking.payment_status === 'paid' ? 'text-green-500' : 'text-gray-400'}`} />
                        <span className="capitalize font-medium">{booking.payment_status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                      <select
                        value={booking.status}
                        onChange={async (e) => {
                          const newStatus = e.target.value;
                          const { error } = await supabase.from('bookings').update({ status: newStatus }).eq('id', booking.id);
                          if (!error) {
                            fetchBookings();
                            if (booking.student_id) {
                              await supabase.from('notifications').insert({
                                user_id: booking.student_id,
                                title: 'Booking Status Updated',
                                body: `Your tutoring session status is now "${newStatus.toUpperCase()}".`,
                                type: 'application_update',
                                is_read: false,
                              });
                            }
                          }
                        }}
                        className="px-2.5 py-1 font-semibold rounded-lg border border-gray-200 bg-white text-gray-700 focus:ring-brand-blue"
                      >
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="disputed">Disputed</option>
                        <option value="cancelled">Cancelled & Refund</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {!loading && filtered.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-gray-500">
               Showing <span className="font-medium text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-gray-900">{Math.min(currentPage * itemsPerPage, filtered.length)}</span> of <span className="font-medium text-gray-900">{filtered.length}</span> bookings
            </div>
            <div className="flex items-center space-x-2">
               <button 
                 onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                 disabled={currentPage === 1}
                 className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
               >
                 <ChevronLeft className="w-5 h-5" />
               </button>
               <div className="text-sm font-medium text-gray-700 mx-2">
                 Page {currentPage} of {totalPages}
               </div>
               <button 
                 onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                 disabled={currentPage === totalPages}
                 className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
               >
                 <ChevronRight className="w-5 h-5" />
               </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
