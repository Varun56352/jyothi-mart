'use client';
import { useState, useEffect } from 'react';
import { Users, Phone, Shield, Truck, User, RefreshCw, CheckCircle2 } from 'lucide-react';
import { getAdminUsers, updateAdminUser } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function AdminUsersManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [search, setSearch] = useState('');

  const fetchUsers = () => {
    setLoading(true);
    getAdminUsers()
      .then((res) => {
        const list = res.data?.data || res.data || [];
        setUsers(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        console.error('Failed to load users:', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateAdminUser(userId, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
      );
      showToast(`User role updated to ${newRole}`);
    } catch (err) {
      console.error('Failed to update user role:', err);
      showToast('Error updating role');
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.phone?.toLowerCase().includes(search.toLowerCase()) ||
      u.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg transition">
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-white">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Manage Users & Staff
            </h2>
            <p className="text-xs text-gray-500">
              {users.length} registered customers, admins & delivery personnel
            </p>
          </div>
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="p-1.5 text-gray-500 hover:text-[#0C831F] hover:bg-green-50 rounded-lg transition"
            title="Refresh users"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by phone or name..."
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-[#0C831F]"
        />
      </div>

      {/* Users List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400">Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-gray-200 text-gray-400">
            <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="text-xs">No users found</p>
          </div>
        ) : (
          filteredUsers.map((u) => {
            const roleBadge =
              u.role === 'admin'
                ? 'bg-purple-50 text-purple-700 border-purple-200'
                : u.role === 'delivery'
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-gray-100 text-gray-700 border-gray-200';

            return (
              <div
                key={u._id}
                className="bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm">
                    {u.role === 'admin' ? (
                      <Shield className="w-5 h-5 text-purple-600" />
                    ) : u.role === 'delivery' ? (
                      <Truck className="w-5 h-5 text-blue-600" />
                    ) : (
                      <User className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-gray-900">{u.name || 'Customer'}</span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.2 rounded-full border uppercase ${roleBadge}`}>
                        {u.role || 'customer'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                      <span>📞 +91 {u.phone}</span>
                      <span>•</span>
                      <span>{u.addresses?.length || 0} saved address(es)</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                  <label className="text-[11px] font-bold text-gray-500">Role:</label>
                  <select
                    value={u.role || 'customer'}
                    onChange={(e) => handleRoleChange(u._id, e.target.value)}
                    className="bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none focus:border-[#0C831F]"
                  >
                    <option value="customer">Customer</option>
                    <option value="delivery">Delivery Partner</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
