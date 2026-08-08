'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { roleOf } from '@/lib/role';
import { Search, Mail, Phone, MapPin, MoreVertical, Download, ChevronLeft, ChevronRight, Filter, MessageSquare, Eye, Shield, Trash2, RotateCcw } from 'lucide-react';
import { exportToCSV } from '@/utils/export';
import { TableSkeleton } from '@/components/ui/TableSkeleton';
import { useToast, useConfirm } from '@/components/ui/Feedback';
import { useRouter } from 'next/navigation';
import { UserDetailModal } from '@/components/users/UserDetailModal';

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
  is_suspended?: boolean;
  is_deleted?: boolean;
  deleted_at?: string | null;
  previous_role?: string;
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
  const [statusFilter, setStatusFilter] = useState('all');
  const [savingRole, setSavingRole] = useState<string | null>(null);
  
  // Interactive menu & detail modal state
  const [activeMenuUserId, setActiveMenuUserId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_all_users' }),
      });
      const json = await res.json();
      if (res.ok && json.users) {
        setUsers(json.users);
      } else {
        const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false });
        if (data) setUsers(data);
      }
    } catch {
      const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false });
      if (data) setUsers(data);
    } finally {
      setLoading(false);
    }
  }

  // Close active dropdown menu when clicking anywhere on page
  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuUserId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const handleToggleSuspension = async (user: User) => {
    const isSuspended = !!user.is_suspended;
    const action = isSuspended ? 'unsuspend' : 'suspend';
    const ok = await confirm({
      title: isSuspended ? 'Reactivate Account?' : 'Suspend Account?',
      message: isSuspended
        ? `Reactivate ${user.full_name || 'this user'}'s account? They will be able to log in to the mobile app.`
        : `Suspend ${user.full_name || 'this user'}'s account? They will be immediately logged out and blocked from accessing the app.`,
      confirmLabel: isSuspended ? 'Reactivate' : 'Suspend Account',
    });
    if (!ok) return;

    try {
      const res = await fetch('/api/admin/users/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, userId: user.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Operation failed');

      toast('success', isSuspended ? 'User account reactivated.' : 'User account suspended.');
      fetchUsers();
    } catch (err: any) {
      toast('error', err.message || 'Failed to update suspension status.');
    }
  };

  const handleSoftDeleteUser = async (user: User) => {
    const ok = await confirm({
      title: 'Archive Account?',
      message: `Move ${user.full_name || 'this user'} to Archived accounts? The user will be blocked from logging in, but historical records will be preserved. You can restore this user anytime.`,
      confirmLabel: 'Archive Account',
    });
    if (!ok) return;

    try {
      const res = await fetch('/api/admin/users/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', userId: user.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to archive user');

      toast('success', 'User account archived.');
      fetchUsers();
    } catch (err: any) {
      toast('error', err.message || 'Failed to archive user.');
    }
  };

  const handleRestoreUser = async (user: User) => {
    const ok = await confirm({
      title: 'Restore Account?',
      message: `Restore ${user.full_name || 'this user'}'s account back to active status?`,
      confirmLabel: 'Restore Account',
    });
    if (!ok) return;

    try {
      const res = await fetch('/api/admin/users/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore', userId: user.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to restore user');

      toast('success', 'User account restored to active status.');
      fetchUsers();
    } catch (err: any) {
      toast('error', err.message || 'Failed to restore user.');
    }
  };

  const handlePurgeUser = async (user: User) => {
    const ok = await confirm({
      title: 'Permanently Purge Account?',
      message: `PERMANENTLY PURGE ${user.full_name || 'this user'}? This action is 100% IRREVERSIBLE and wipes all their data forever.`,
      confirmLabel: 'Permanently Purge',
    });
    if (!ok) return;

    try {
      const res = await fetch('/api/admin/users/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'purge', userId: user.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to purge user');

      toast('success', 'User permanently purged.');
      fetchUsers();
    } catch (err: any) {
      toast('error', err.message || 'Failed to purge user.');
    }
  };

  // Change a user's role via the admin_set_user_role RPC
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
    const matchesStatus = 
      statusFilter === 'all'
        ? !u.is_deleted
        : statusFilter === 'suspended'
        ? u.is_suspended && !u.is_deleted
        : statusFilter === 'active'
        ? !u.is_suspended && !u.is_deleted
        : statusFilter === 'deleted'
        ? u.is_deleted
        : true;

    return matchesSearch && matchesRole && matchesCity && matchesStatus;
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
  }, [search, roleFilter, cityFilter, statusFilter]);

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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium focus:ring-brand-blue focus:border-brand-blue bg-white"
            >
              <option value="all">All Users</option>
              <option value="active">Active Only</option>
              <option value="suspended">Suspended Only</option>
              <option value="deleted">Deleted / Archived</option>
            </select>

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
                  <tr key={user.id} className={`hover:bg-gray-50/50 transition-colors ${
                    user.is_deleted ? 'bg-gray-100/50 opacity-75' : user.is_suspended ? 'bg-red-50/30' : ''
                  }`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-brand-gold/20 rounded-full flex items-center justify-center">
                          <span className="text-brand-gold font-bold text-sm">
                            {user.full_name?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">{user.full_name || 'Unknown Name'}</span>
                            {user.is_deleted ? (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-gray-200 text-gray-700 uppercase tracking-wide border border-gray-300">
                                Archived
                              </span>
                            ) : user.is_suspended ? (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-100 text-red-700 uppercase tracking-wide border border-red-200">
                                Suspended
                              </span>
                            ) : null}
                          </div>
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
                        value={user.is_deleted ? 'archived' : primaryRole}
                        disabled={savingRole === user.id || user.is_deleted}
                        onChange={(e) => changeRole(user, e.target.value)}
                        className="text-xs font-semibold rounded-lg border border-gray-200 px-2 py-1 capitalize bg-white disabled:opacity-50 focus:ring-2 focus:ring-brand-blue focus:outline-none"
                        title="Change role"
                      >
                        {['student', 'parent', 'tutor', 'admin', 'archived'].map((r) => (
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
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => router.push(`/chat?userId=${user.id}`)}
                          className="inline-flex items-center p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-brand-blue transition-colors"
                          title="Chat with user"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </button>
                        
                        <div className="relative">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuUserId(activeMenuUserId === user.id ? null : user.id);
                            }}
                            className="text-gray-400 hover:text-gray-600 p-1.5 inline-flex items-center rounded-full hover:bg-gray-100 transition-colors"
                            title="Actions"
                          >
                            <MoreVertical className="h-5 w-5" />
                          </button>

                          {/* Dropdown Menu */}
                          {activeMenuUserId === user.id && (
                            <div 
                              className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-40 text-left animate-in fade-in zoom-in-95 duration-100"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => {
                                  setSelectedUserId(user.id);
                                  setActiveMenuUserId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center"
                              >
                                <Eye className="w-3.5 h-3.5 mr-2 text-brand-blue" />
                                View Full Profile
                              </button>

                              <button
                                onClick={() => {
                                  router.push(`/chat?userId=${user.id}`);
                                  setActiveMenuUserId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center"
                              >
                                <MessageSquare className="w-3.5 h-3.5 mr-2 text-green-600" />
                                Direct Message
                              </button>

                              {user.is_deleted ? (
                                <>
                                  <div className="my-1 border-t border-gray-100" />
                                  <button
                                    onClick={() => {
                                      handleRestoreUser(user);
                                      setActiveMenuUserId(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-xs font-medium text-green-700 hover:bg-green-50 flex items-center"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5 mr-2 text-green-600" />
                                    Restore Account
                                  </button>
                                  <button
                                    onClick={() => {
                                      handlePurgeUser(user);
                                      setActiveMenuUserId(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 mr-2 text-red-500" />
                                    Permanently Purge
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => {
                                      handleToggleSuspension(user);
                                      setActiveMenuUserId(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-xs font-medium text-amber-700 hover:bg-amber-50 flex items-center"
                                  >
                                    <Shield className="w-3.5 h-3.5 mr-2 text-amber-600" />
                                    {user.is_suspended ? 'Reactivate Account' : 'Suspend Account'}
                                  </button>

                                  <div className="my-1 border-t border-gray-100" />

                                  <button
                                    onClick={() => {
                                      handleSoftDeleteUser(user);
                                      setActiveMenuUserId(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 mr-2 text-red-500" />
                                    Archive Account
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
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

      {/* User Detail & Quick Actions Modal */}
      {selectedUserId && (
        <UserDetailModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onRefresh={fetchUsers}
        />
      )}
    </div>
  );
}
