'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  ExternalLink,
  LogOut,
  ShieldCheck,
  ChevronRight,
  Clock,
  CheckCircle2,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getAdminOrders, getAdminItems, getAdminUsers } from '@/lib/api';
import AdminOrdersManager from '@/components/admin/AdminOrdersManager';
import AdminItemsManager from '@/components/admin/AdminItemsManager';
import AdminUsersManager from '@/components/admin/AdminUsersManager';

export default function AdminPage() {
  const { user, isAdmin, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  // Active Sidebar Section: 'dashboard' | 'orders' | 'items' | 'users'
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Quick stats for dashboard cards
  const [stats, setStats] = useState({
    liveOrders: 0,
    completedOrders: 0,
    totalItems: 0,
    onlineItems: 0,
    totalUsers: 0,
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/login?redirect=/admin');
      } else if (!isAdmin) {
        router.replace('/');
      }
    }
  }, [user, isAdmin, authLoading, router]);

  useEffect(() => {
    if (isAdmin) {
      Promise.all([
        getAdminOrders({ limit: 100 }).catch(() => ({ data: [] })),
        getAdminItems().catch(() => ({ data: [] })),
        getAdminUsers().catch(() => ({ data: [] })),
      ]).then(([ordRes, itmRes, usrRes]) => {
        const orders = ordRes.data?.data || ordRes.data || [];
        const items = itmRes.data?.data || itmRes.data || [];
        const users = usrRes.data?.data || usrRes.data || [];

        const live = orders.filter((o) =>
          ['placed', 'confirmed', 'packing', 'out_for_delivery'].includes(o.status)
        ).length;
        const completed = orders.filter((o) => o.status === 'delivered').length;
        const online = items.filter((i) => i.visible !== false).length;

        setStats({
          liveOrders: live,
          completedOrders: completed,
          totalItems: items.length,
          onlineItems: online,
          totalUsers: users.length,
        });
      });
    }
  }, [isAdmin, activeSection]);

  if (authLoading || (!isAdmin && !authLoading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-[#0C831F] mx-auto mb-3" />
          <p className="text-xs text-gray-500 font-medium">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'Manage Orders', icon: Package, badge: stats.liveOrders > 0 ? stats.liveOrders : null },
    { id: 'items', label: 'Edit Items', icon: ShoppingBag },
    { id: 'users', label: 'Manage Users', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 -ml-1 text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-extrabold text-[#0C831F] text-base">Jyothi Mart Admin</span>
        </div>
        <Link
          href="/"
          className="text-xs font-semibold text-[#0C831F] flex items-center gap-1 bg-green-50 px-2.5 py-1 rounded-lg border border-green-200"
        >
          <span>Live Site</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Admin Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm transition-transform duration-200 md:static md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-green-50 text-[#0C831F] border border-green-200 flex items-center justify-center font-black">
              JM
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-gray-900 leading-tight">Jyothi Mart</h1>
              <span className="text-[10px] font-bold text-[#0C831F] uppercase tracking-wider">
                Admin Control
              </span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1 text-gray-400 hover:text-gray-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
          <div className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider px-3 mb-2">
            Main Menu
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isActive
                    ? 'bg-[#0C831F] text-white shadow-xs'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-white/30 text-white' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-4 mt-4 border-t border-gray-100">
            <div className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider px-3 mb-2">
              External
            </div>

            {/* View Live Site Link (Directly requested by user) */}
            <Link
              href="/"
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-gray-700 hover:bg-green-50 hover:text-[#0C831F] transition group"
            >
              <div className="flex items-center gap-2.5">
                <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-[#0C831F]" />
                <span>View Live Site</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            </Link>
          </div>
        </div>

        {/* Sidebar Footer with Log Out */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-900 truncate">{user?.phone || 'Admin'}</p>
              <span className="text-[10px] text-gray-500">Administrator</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>

          <button
            onClick={() => {
              logout();
              router.replace('/login');
            }}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden h-[calc(100vh-53px)] md:h-screen bg-gray-100">
        {/* Section 1: Dashboard Overview */}
        {activeSection === 'dashboard' && (
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-5xl mx-auto space-y-6">
              {/* Dashboard Greeting Header */}
              <div className="bg-gradient-to-r from-[#0C831F] to-[#10A328] text-white p-6 rounded-3xl shadow-sm">
                <span className="bg-white/20 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider inline-block mb-2">
                  Store Operations
                </span>
                <h2 className="text-2xl font-black tracking-tight">Admin Operations Dashboard</h2>
                <p className="text-xs md:text-sm text-green-100 mt-1">
                  Manage live incoming orders, edit catalog visibility and photos, and oversee users.
                </p>
              </div>

              {/* 3 Main Action Cards: Manage Orders, Edit Items, Manage Users */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Manage Orders Card */}
                <div
                  onClick={() => setActiveSection('orders')}
                  className="bg-white rounded-3xl p-6 border border-gray-200 shadow-2xs hover:shadow-md hover:border-[#0C831F] transition cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mb-4 group-hover:scale-105 transition">
                      <Package className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-extrabold text-gray-900 group-hover:text-[#0C831F] transition">
                      Manage Orders
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Live customer orders, completed deliveries, and cancellations.
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-black text-gray-900">{stats.liveOrders}</span>
                      <span className="text-[11px] text-amber-600 font-bold ml-1.5">Live Pending</span>
                    </div>
                    <span className="text-xs font-bold text-[#0C831F] group-hover:translate-x-1 transition flex items-center gap-1">
                      Open Orders →
                    </span>
                  </div>
                </div>

                {/* 2. Edit Items Card */}
                <div
                  onClick={() => setActiveSection('items')}
                  className="bg-white rounded-3xl p-6 border border-gray-200 shadow-2xs hover:shadow-md hover:border-[#0C831F] transition cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-green-50 text-[#0C831F] border border-green-200 flex items-center justify-center mb-4 group-hover:scale-105 transition">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-extrabold text-gray-900 group-hover:text-[#0C831F] transition">
                      Edit Items
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Toggle online store visibility and upload multiple product photos.
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-black text-gray-900">{stats.onlineItems}</span>
                      <span className="text-[11px] text-[#0C831F] font-bold ml-1.5">/ {stats.totalItems} Online</span>
                    </div>
                    <span className="text-xs font-bold text-[#0C831F] group-hover:translate-x-1 transition flex items-center gap-1">
                      Edit Catalog →
                    </span>
                  </div>
                </div>

                {/* 3. Manage Users Card */}
                <div
                  onClick={() => setActiveSection('users')}
                  className="bg-white rounded-3xl p-6 border border-gray-200 shadow-2xs hover:shadow-md hover:border-[#0C831F] transition cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center mb-4 group-hover:scale-105 transition">
                      <Users className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-extrabold text-gray-900 group-hover:text-[#0C831F] transition">
                      Manage Users
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      View registered phone numbers, address records, and staff roles.
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-black text-gray-900">{stats.totalUsers}</span>
                      <span className="text-[11px] text-purple-600 font-bold ml-1.5">Users</span>
                    </div>
                    <span className="text-xs font-bold text-[#0C831F] group-hover:translate-x-1 transition flex items-center gap-1">
                      Manage Users →
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section 2: Manage Orders (Live, Completed, Canceled) */}
        {activeSection === 'orders' && (
          <div className="flex-1 bg-white overflow-hidden flex flex-col">
            <AdminOrdersManager />
          </div>
        )}

        {/* Section 3: Edit Items (Catalog & Photos) */}
        {activeSection === 'items' && (
          <div className="flex-1 bg-white overflow-hidden flex flex-col">
            <AdminItemsManager />
          </div>
        )}

        {/* Section 4: Manage Users */}
        {activeSection === 'users' && (
          <div className="flex-1 bg-white overflow-hidden flex flex-col">
            <AdminUsersManager />
          </div>
        )}
      </main>
    </div>
  );
}
