'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { roleOf } from '@/lib/role';
import { Search, Mail, Phone, MapPin, MoreVertical, Download, ChevronLeft, ChevronRight, Filter, MessageSquare } from 'lucide-react';
import { exportToCSV } from '@/utils/export';
import { TableSkeleton } from '@/components/ui/TableSkeleton';
import { useToast, useConfirm } from '@/components/ui/Feedback';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role?: string | null;
  roles?: string[] | null;
  active_role?: string | null;
  city: string;
  created_at: string;
}

export default function UsersPage() {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [savingRole, setSavingRole] = useState<string | null>(null);

  async function fetchUsers() {
    setLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setUsers(data);
    }
    setLoading(false);
  }

  // Change a user's role via the admin_set_user_role RPC, which keeps all three
  // role sources (users.role, users.roles/active_role, user_roles) in sync.
  const changeRole = async (user: User, role: string) => {
    if (role === roleOf(user)) return;
    const ok = await confirm({
      title: 'Change role?',
      message: `Change ${user.full_name || 'this user'}'s role to "${role}". Tutors still require approval before they can teach.`,
      confirmLabel: 'Change role',
    });
    if (!ok) return;
    setSavingRole(user.id);
    const { error } = await supabase.rpc('admin_set_user_role', { p_user_id: user.id, p_role: role });
    setSavingRole(null);
    if (error) { toast('error', error.message || 'Failed to change role.'); return; }
    toast('success', `Role updated to ${role}.`);
    fetchUsers();
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = users.filter(u => {
    const matchesSearch = 
      u.full_name?.toLowerCase().includes(search.toLowerCase()) || 
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.includes(search);
    const matchesRole = roleFilter === 'all' || roleOf(u) === roleFilter;
    const matchesCity = cityFilter === 'all' || u.city === cityFilter;
    return matchesSearch && matchesRole && matchesCity;
  });

  const cities = [...new Set(users.map(u => u.city).filter(Boolean))].sort();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  
  const paginatedUsers = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 on active search
  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter, cityFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="mt-1 text-sm text-gray-500">View and manage all registered users</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-brand-blue focus:border-brand-blue"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-brand-blue focus:border-brand-blue bg-white"
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="tutor">Tutors</option>
              <option value="admin">Admins</option>
            </select>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-brand-blue focus:border-brand-blue bg-white"
            >
              <option value="all">All Cities</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            <button 
              onClick={() => exportToCSV(filtered, 'users_export')}
              className="flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors text-sm font-medium whitespace-nowrap"
            >
              <Download className="w-4 h-4 mr-2 text-gray-500" />
              Export CSV
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role & City</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <TableSkeleton cols={5} rows={5} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">No users found.</td>
                </tr>
              ) : (
                paginatedUsers.map((user) => {
                  const primaryRole = roleOf(user);
                  return (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-brand-gold/20 rounded-full flex items-center justify-center">
                          <span className="text-brand-gold font-bold text-sm">
                            {user.full_name?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.full_name || 'Unknown Name'}</div>
                          <div className="text-xs text-gray-500">ID: {user.id.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <Mail className="w-3.5 h-3.5 mr-1.5 text-gray-400" /> {user.email || 'No email'}
                      </div>
                      <div className="text-sm text-gray-500 mt-1 flex items-center">
                         <Phone className="w-3.5 h-3.5 mr-1.5 text-gray-400" /> {user.phone || 'No phone'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={primaryRole}
                        disabled={savingRole === user.id}
                        onChange={(e) => changeRole(user, e.target.value)}
                        className="text-xs font-semibold rounded-lg border border-gray-200 px-2 py-1 capitalize bg-white disabled:opacity-50 focus:ring-2 focus:ring-brand-blue focus:outline-none"
                        title="Change role"
                      >
                        {['student', 'parent', 'tutor', 'admin'].map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                      <div className="text-sm text-gray-500 mt-1 flex items-center">
                         <MapPin className="w-3.5 h-3.5 mr-1.5 text-gray-400" /> {user.city || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button 
                        onClick={() => router.push(`/chat?userId=${user.id}`)}
                        className="inline-flex items-center p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-brand-blue transition-colors"
                        title="Chat with user"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </button>
                      <button className="text-gray-400 hover:text-gray-600 p-1 inline-flex items-center rounded-full hover:bg-gray-100 transition-colors">
                        <MoreVertical className="h-5 w-5" />
                      </button>
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
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-gray-500">
               Showing <span className="font-medium text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-gray-900">{Math.min(currentPage * itemsPerPage, filtered.length)}</span> of <span className="font-medium text-gray-900">{filtered.length}</span> users
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
