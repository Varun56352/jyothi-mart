'use client';
import { useState } from 'react';
import {
  MapPin,
  Search,
  User,
  Menu,
  X,
  ShieldCheck,
  ShoppingBag,
  Grid,
  Package,
  LogOut,
  LogIn,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useLocation } from '@/context/LocationContext';
import LocationPickerModal from '@/components/common/LocationPickerModal';

export default function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, isAdmin, logout } = useAuth();
  const router = useRouter();
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const { address, deliveryTimeEstimate, isServiceable, loadingLocation } = useLocation();

  const handleLogout = () => {
    logout();
    setDrawerOpen(false);
    router.push('/login');
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-xs">
        <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
          {/* Left: Menu Hamburger + Location Pin */}
          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => setDrawerOpen(true)}
              className="p-1.5 -ml-1.5 rounded-xl hover:bg-gray-100 text-gray-700 transition cursor-pointer"
              aria-label="Open menu drawer"
            >
              <Menu className="w-5 h-5 text-gray-800" />
            </button>

            <button
              onClick={() => setLocationPickerOpen(true)}
              className="flex items-center space-x-1.5 cursor-pointer hover:opacity-80 transition"
            >
              <MapPin className={`w-5 h-5 flex-shrink-0 ${isServiceable ? 'text-[#0C831F]' : 'text-red-500'}`} />
              <div className="flex flex-col text-left">
                <span className="text-[11px] font-extrabold text-gray-900 leading-tight">
                  {loadingLocation
                    ? 'Detecting...'
                    : isServiceable
                    ? deliveryTimeEstimate
                      ? `Delivery in ${deliveryTimeEstimate}`
                      : 'Delivery in 10 mins'
                    : 'Not Serviceable'}
                </span>
                <span className="text-[11px] text-gray-500 truncate max-w-[150px] sm:max-w-[220px]">
                  {address || 'Select location...'}
                </span>
              </div>
            </button>
          </div>

          {/* Center: Brand Name */}
          <Link href="/" className="text-xl font-black text-[#0C831F] tracking-tight">
            Jyothi Mart
          </Link>

          {/* Right: Admin Pill (if admin) + Profile Button */}
          <div className="flex items-center space-x-2">
            {isAdmin && (
              <Link
                href="/admin"
                className="hidden sm:inline-flex items-center gap-1 bg-green-50 hover:bg-green-100 border border-green-200 text-[#0C831F] px-2.5 py-1 rounded-full text-xs font-bold transition"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin</span>
              </Link>
            )}

            <button
              onClick={() => setDrawerOpen(true)}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition cursor-pointer"
              aria-label="User account menu"
            >
              <User className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar Bar */}
        <div className="px-4 pb-3 max-w-7xl mx-auto">
          <Link href="/search">
            <div className="w-full flex items-center bg-gray-100 hover:bg-gray-150 rounded-xl px-4 py-2.5 space-x-2.5 border border-gray-200 transition cursor-pointer">
              <Search className="w-4 h-4 text-gray-400" />
              <span className="text-gray-400 text-xs sm:text-sm font-medium">
                Search for groceries, atta, dal, oil...
              </span>
            </div>
          </Link>
        </div>
      </header>

      {/* Slide-out Sidebar Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-80 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-black text-[#0C831F] tracking-tight">
                  Jyothi Mart
                </span>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1 rounded-full hover:bg-white text-gray-400 hover:text-gray-700 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {user ? (
                <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-800">
                        {user.name || 'Registered Customer'}
                      </p>
                      <p className="text-[11px] text-gray-500">+91 {user.phone}</p>
                    </div>
                    {isAdmin ? (
                      <span className="inline-flex items-center gap-1 bg-green-100 text-[#0C831F] text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                        <ShieldCheck className="w-3 h-3" /> Admin
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-600 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                        Customer
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-gray-600">
                  <p className="font-semibold text-gray-800">Welcome to Jyothi Mart</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Sign in to track orders and save addresses
                  </p>
                  <Link
                    href="/login"
                    onClick={() => setDrawerOpen(false)}
                    className="mt-2.5 inline-flex items-center gap-1.5 bg-[#0C831F] text-white text-xs font-bold px-4 py-1.5 rounded-lg shadow-2xs"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Log In / Sign Up</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Admin Access Button (Primary feature user requested) */}
            {isAdmin && (
              <div className="p-4 bg-green-50/70 border-b border-green-100">
                <Link
                  href="/admin"
                  onClick={() => setDrawerOpen(false)}
                  className="w-full bg-[#0C831F] hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-between text-xs shadow-sm transition"
                >
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-yellow-300" />
                    <span>Admin Control Center</span>
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            {/* Navigation Links */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              <Link
                href="/"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 text-gray-700 text-sm font-semibold transition"
              >
                <ShoppingBag className="w-4 h-4 text-gray-500" />
                <span>Shop All Items</span>
              </Link>

              <Link
                href="/category"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 text-gray-700 text-sm font-semibold transition"
              >
                <Grid className="w-4 h-4 text-gray-500" />
                <span>All Categories</span>
              </Link>

              <Link
                href="/search"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 text-gray-700 text-sm font-semibold transition"
              >
                <Search className="w-4 h-4 text-gray-500" />
                <span>Search Products</span>
              </Link>

              <Link
                href="/orders"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 text-gray-700 text-sm font-semibold transition"
              >
                <Package className="w-4 h-4 text-gray-500" />
                <span>My Orders</span>
              </Link>

              <Link
                href="/account"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 text-gray-700 text-sm font-semibold transition"
              >
                <User className="w-4 h-4 text-gray-500" />
                <span>My Account & Addresses</span>
              </Link>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-gray-100">
              {user ? (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setDrawerOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-[#0C831F] bg-green-50 hover:bg-green-100 rounded-xl transition"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
      <LocationPickerModal
        isOpen={locationPickerOpen}
        onClose={() => setLocationPickerOpen(false)}
      />
    </>
  );
}
