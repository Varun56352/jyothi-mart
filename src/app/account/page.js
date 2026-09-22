'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  Phone,
  MapPin,
  Package,
  LogOut,
  Edit2,
  Check,
  Plus,
  Trash2,
  ChevronRight,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AccountPage() {
  const { user, logout, loading: authLoading, isAdmin, isDelivery } = useAuth();
  const router = useRouter();

  const [isEditingName, setIsEditingName] = useState(false);
  const [userName, setUserName] = useState('');
  const [addresses, setAddresses] = useState([]);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: 'Home', address: '', landmark: '' });
  const [notification, setNotification] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?redirect=/account');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      setUserName(user.name || '');
      // Load saved addresses from user object or localStorage fallback
      const storageKey = `saved_addresses_${user.phone || 'guest'}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          setAddresses(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      } else if (Array.isArray(user.addresses) && user.addresses.length > 0) {
        setAddresses(user.addresses);
      } else {
        // Sample starter address if none
        const initial = [
          {
            id: '1',
            label: 'Home',
            address: '14, 2nd Cross, 5th Block, Koramangala',
            landmark: 'Near Jyothi Mart',
          },
        ];
        setAddresses(initial);
        localStorage.setItem(storageKey, JSON.stringify(initial));
      }
    }
  }, [user]);

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleSaveName = () => {
    if (!userName.trim()) return;
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.name = userName.trim();
        localStorage.setItem('user', JSON.stringify(parsed));
      }
      setIsEditingName(false);
      showToast('Profile updated successfully');
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddAddress = (e) => {
    e.preventDefault();
    if (!newAddress.address.trim()) return;

    const item = {
      id: String(Date.now()),
      label: newAddress.label,
      address: newAddress.address.trim(),
      landmark: newAddress.landmark.trim(),
    };

    const updated = [...addresses, item];
    setAddresses(updated);
    if (user?.phone) {
      localStorage.setItem(`saved_addresses_${user.phone}`, JSON.stringify(updated));
    }
    setNewAddress({ label: 'Home', address: '', landmark: '' });
    setShowAddAddress(false);
    showToast('New address saved');
  };

  const handleDeleteAddress = (id) => {
    const updated = addresses.filter((a) => a.id !== id);
    setAddresses(updated);
    if (user?.phone) {
      localStorage.setItem(`saved_addresses_${user.phone}`, JSON.stringify(updated));
    }
    showToast('Address removed');
  };

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0C831F]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-30 shadow-sm">
        <h1 className="text-lg font-bold text-gray-900">My Account</h1>
      </header>

      {/* Toast Alert */}
      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg transition animate-fade-in">
          {notification}
        </div>
      )}

      <main className="p-4 max-w-xl mx-auto space-y-4">
        {/* User Info Card */}
        <section className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-green-50 text-[#0C831F] rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0 border border-green-100">
              {userName ? userName.charAt(0).toUpperCase() : <User className="w-7 h-7" />}
            </div>

            <div className="flex-1 min-w-0">
              {isEditingName ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Enter full name"
                    className="border border-[#0C831F] rounded-lg px-2.5 py-1 text-sm text-gray-800 w-full focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    className="p-1.5 bg-[#0C831F] text-white rounded-lg hover:bg-green-700 transition"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-bold text-gray-900 truncate">
                    {userName || 'Add your name'}
                  </h2>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="text-gray-400 hover:text-gray-600 transition p-1"
                    aria-label="Edit name"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex items-center text-xs text-gray-500 mt-1">
                <Phone className="w-3.5 h-3.5 mr-1 text-gray-400" />
                <span>{user?.phone || 'No phone'}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Links Card */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
          <Link
            href="/orders"
            className="flex items-center justify-between p-4 hover:bg-gray-50 transition active:bg-gray-100"
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-green-50 text-[#0C831F] flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">My Orders</p>
                <p className="text-xs text-gray-500">Track orders & view history</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center justify-between p-4 hover:bg-gray-50 transition active:bg-gray-100"
            >
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Admin Dashboard</p>
                  <p className="text-xs text-gray-500">Manage catalog, orders & settings</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>
          )}

          {isDelivery && (
            <Link
              href="/delivery"
              className="flex items-center justify-between p-4 hover:bg-gray-50 transition active:bg-gray-100"
            >
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Delivery Dashboard</p>
                  <p className="text-xs text-gray-500">View and update assigned deliveries</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>
          )}
        </section>

        {/* Saved Addresses Section */}
        <section className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-[#0C831F]" />
              <h3 className="text-sm font-bold text-gray-900">Saved Addresses</h3>
            </div>
            {!showAddAddress && (
              <button
                onClick={() => setShowAddAddress(true)}
                className="text-xs font-bold text-[#0C831F] flex items-center space-x-1 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New</span>
              </button>
            )}
          </div>

          {showAddAddress && (
            <form onSubmit={handleAddAddress} className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-2.5">
              <div className="flex space-x-2">
                {['Home', 'Work', 'Other'].map((lbl) => (
                  <button
                    key={lbl}
                    type="button"
                    onClick={() => setNewAddress({ ...newAddress, label: lbl })}
                    className={`px-3 py-1 text-xs rounded-full border font-semibold ${
                      newAddress.label === lbl
                        ? 'bg-[#0C831F] text-white border-[#0C831F]'
                        : 'bg-white text-gray-600 border-gray-300'
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Full address (House no, Street, Area)..."
                value={newAddress.address}
                onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                required
                className="w-full text-xs p-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:border-[#0C831F]"
              />
              <input
                type="text"
                placeholder="Landmark (optional)..."
                value={newAddress.landmark}
                onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:border-[#0C831F]"
              />
              <div className="flex justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddAddress(false)}
                  className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-[#0C831F] text-white rounded-lg hover:bg-green-700"
                >
                  Save Address
                </button>
              </div>
            </form>
          )}

          {addresses.length === 0 ? (
            <p className="text-xs text-gray-500 py-3 text-center">No addresses saved yet.</p>
          ) : (
            <div className="space-y-2.5">
              {addresses.map((addr) => (
                <div
                  key={addr.id || addr._id}
                  className="flex items-start justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition"
                >
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-200 text-gray-700 mb-1">
                      {addr.label || 'Home'}
                    </span>
                    <p className="text-xs font-medium text-gray-800 leading-tight">
                      {addr.address || addr.addressLine1 || addr.fullAddress}
                    </p>
                    {addr.landmark && (
                      <p className="text-[11px] text-gray-500 mt-0.5">Near: {addr.landmark}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteAddress(addr.id || addr._id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition ml-2"
                    aria-label="Delete address"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Logout Button */}
        <section className="pt-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 bg-red-50 text-red-600 border border-red-200 py-3 rounded-2xl font-bold text-sm hover:bg-red-100 transition active:scale-[0.99]"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </section>
      </main>
    </div>
  );
}
