'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Smartphone,
  Monitor,
  RefreshCw,
  LogOut,
  ShoppingBag,
  Package,
  Settings as SettingsIcon,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import AdminItemsManager from '@/components/admin/AdminItemsManager';

export default function AdminPage() {
  const { user, isAdmin, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  const [previewDevice, setPreviewDevice] = useState('mobile'); // 'mobile' | 'responsive'
  const [previewKey, setPreviewKey] = useState(0);
  const [mobileTab, setMobileTab] = useState('items'); // 'items' | 'preview' | 'links'
  const iframeRef = useRef(null);

  // Authentication protection
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/login?redirect=/admin');
      } else if (!isAdmin) {
        router.replace('/');
      }
    }
  }, [user, isAdmin, authLoading, router]);

  const refreshPreview = () => {
    setPreviewKey((k) => k + 1);
  };

  const handleItemUpdated = () => {
    // Refresh the customer view when an item visibility or photo changes
    refreshPreview();
  };

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

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top Admin Navigation Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-2.5 shadow-xs sticky top-0 z-30">
        <div className="max-w-full mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-green-50 text-[#0C831F] border border-green-200 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-extrabold text-gray-900 leading-tight">
                  Jyothi Mart Admin
                </h1>
                <span className="bg-green-100 text-[#0C831F] text-[10px] font-bold px-2 py-0.5 rounded-full">
                  LIVE CONTROL
                </span>
              </div>
              <p className="text-[11px] text-gray-500">
                Split Screen: Customer Store Preview & Catalog Management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/admin/orders"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition"
            >
              <Package className="w-3.5 h-3.5 text-gray-500" />
              <span>Orders</span>
            </Link>

            <Link
              href="/admin/settings"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition"
            >
              <SettingsIcon className="w-3.5 h-3.5 text-gray-500" />
              <span>Settings</span>
            </Link>

            <button
              onClick={refreshPreview}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs font-semibold transition cursor-pointer"
              title="Reload customer view"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Refresh Store</span>
            </button>

            <button
              onClick={() => {
                logout();
                router.replace('/login');
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition cursor-pointer"
              title="Log out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile Tab Bar */}
        <div className="flex lg:hidden items-center border-t border-gray-100 mt-2 pt-2 gap-1">
          <button
            onClick={() => setMobileTab('items')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
              mobileTab === 'items' ? 'bg-[#0C831F] text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Edit Items Catalog
          </button>
          <button
            onClick={() => setMobileTab('preview')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
              mobileTab === 'preview' ? 'bg-[#0C831F] text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Customer Store Preview
          </button>
          <button
            onClick={() => setMobileTab('links')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
              mobileTab === 'links' ? 'bg-[#0C831F] text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Orders & Settings
          </button>
        </div>
      </header>

      {/* Main Split Screen Area (Desktop) */}
      <div className="flex-1 hidden lg:flex overflow-hidden h-[calc(100vh-61px)]">
        {/* Left Side: Customer Store Live Preview */}
        <div className="w-1/2 xl:w-[52%] border-r border-gray-200 bg-gray-900 flex flex-col">
          {/* Preview Sub-bar */}
          <div className="px-4 py-2 bg-gray-800 text-white flex items-center justify-between text-xs border-b border-gray-700">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-gray-200">Live Customer View</span>
              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                className="text-gray-400 hover:text-white flex items-center gap-1 text-[11px] ml-1"
                title="Open in new tab"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-gray-700 rounded-lg p-0.5 text-xs">
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`px-2 py-1 rounded-md flex items-center gap-1 transition ${
                    previewDevice === 'mobile' ? 'bg-[#0C831F] text-white font-bold' : 'text-gray-300 hover:text-white'
                  }`}
                  title="Simulate Mobile Device"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile</span>
                </button>
                <button
                  onClick={() => setPreviewDevice('responsive')}
                  className={`px-2 py-1 rounded-md flex items-center gap-1 transition ${
                    previewDevice === 'responsive' ? 'bg-[#0C831F] text-white font-bold' : 'text-gray-300 hover:text-white'
                  }`}
                  title="Full Width Responsive"
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Full View</span>
                </button>
              </div>
            </div>
          </div>

          {/* Customer Preview Container */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-3 bg-gray-950/70">
            <div
              className={`transition-all duration-300 shadow-2xl overflow-hidden bg-white ${
                previewDevice === 'mobile'
                  ? 'w-[390px] h-[780px] max-h-[92%] rounded-[36px] border-[10px] border-gray-800 relative ring-1 ring-white/10'
                  : 'w-full h-full rounded-xl border border-gray-700'
              }`}
            >
              {previewDevice === 'mobile' && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-4 bg-gray-800 rounded-b-xl z-50 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-black/60 mr-2" />
                  <div className="w-10 h-1 bg-black/60 rounded-full" />
                </div>
              )}
              <iframe
                ref={iframeRef}
                key={previewKey}
                src="/"
                title="Customer Store Live View"
                className="w-full h-full border-0 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Right Side: Sidebar with Edit Items */}
        <div className="w-1/2 xl:w-[48%] flex flex-col bg-white">
          <AdminItemsManager onItemUpdated={handleItemUpdated} />
        </div>
      </div>

      {/* Mobile Layout (Tabs) */}
      <div className="flex-1 lg:hidden flex flex-col">
        {mobileTab === 'items' && (
          <div className="flex-1 bg-white min-h-[calc(100vh-110px)]">
            <AdminItemsManager onItemUpdated={handleItemUpdated} />
          </div>
        )}

        {mobileTab === 'preview' && (
          <div className="flex-1 bg-gray-900 p-2 min-h-[calc(100vh-110px)] flex flex-col">
            <div className="flex items-center justify-between text-white text-xs mb-2 px-1">
              <span className="font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Customer Store Preview
              </span>
              <button
                onClick={refreshPreview}
                className="text-[#0C831F] bg-white px-2 py-0.5 rounded-md font-semibold text-[11px]"
              >
                Refresh
              </button>
            </div>
            <div className="flex-1 rounded-2xl overflow-hidden border border-gray-700 bg-white shadow-lg min-h-[600px]">
              <iframe
                key={previewKey}
                src="/"
                title="Customer View"
                className="w-full h-full min-h-[600px] border-0"
              />
            </div>
          </div>
        )}

        {mobileTab === 'links' && (
          <div className="p-4 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <h3 className="font-bold text-gray-900 mb-3 text-sm">Quick Management</h3>
              <div className="space-y-2">
                <Link
                  href="/admin/orders"
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-green-50 text-gray-800 hover:text-[#0C831F] font-semibold text-xs border border-gray-200 transition"
                >
                  <span className="flex items-center gap-2">
                    <Package className="w-4 h-4" /> Manage Customer Orders
                  </span>
                  <span>→</span>
                </Link>

                <Link
                  href="/admin/settings"
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-green-50 text-gray-800 hover:text-[#0C831F] font-semibold text-xs border border-gray-200 transition"
                >
                  <span className="flex items-center gap-2">
                    <SettingsIcon className="w-4 h-4" /> Store Settings & Delivery
                  </span>
                  <span>→</span>
                </Link>

                <Link
                  href="/admin/items"
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-green-50 text-gray-800 hover:text-[#0C831F] font-semibold text-xs border border-gray-200 transition"
                >
                  <span className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4" /> Fullscreen Catalog Manager
                  </span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
