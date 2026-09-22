'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Store,
  Clock,
  Phone,
  Shield,
  Plus,
  X,
  Save,
  Check,
  AlertCircle,
  IndianRupee,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getAdminSettings, updateAdminSettings } from '@/lib/api';
import { SkeletonText } from '@/components/common/Skeleton';

export default function AdminSettingsPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Form State
  const [storeName, setStoreName] = useState('Jyothi Mart');
  const [adminPhones, setAdminPhones] = useState([]);
  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [deliveryPhones, setDeliveryPhones] = useState([]);
  const [newDeliveryPhone, setNewDeliveryPhone] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(15);
  const [minOrderAmount, setMinOrderAmount] = useState(0);
  const [openTime, setOpenTime] = useState('07:00');
  const [closeTime, setCloseTime] = useState('22:00');
  const [isOpen, setIsOpen] = useState(true);

  // Admin Route Protection
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/login?redirect=/admin/settings');
      } else if (!isAdmin) {
        router.replace('/');
      }
    }
  }, [user, isAdmin, authLoading, router]);

  useEffect(() => {
    if (isAdmin) {
      getAdminSettings()
        .then((res) => {
          const data = res.data?.data || res.data || {};
          if (data.storeName) setStoreName(data.storeName);
          if (Array.isArray(data.adminPhones)) setAdminPhones(data.adminPhones);
          if (Array.isArray(data.deliveryPhones)) setDeliveryPhones(data.deliveryPhones);
          if (data.deliveryFee !== undefined) setDeliveryFee(data.deliveryFee);
          if (data.minOrderAmount !== undefined) setMinOrderAmount(data.minOrderAmount);

          const timings = data.storeTimings || {};
          if (timings.open) setOpenTime(timings.open);
          if (timings.close) setCloseTime(timings.close);
          if (timings.isOpen !== undefined) {
            setIsOpen(timings.isOpen);
          } else if (data.isOpen !== undefined) {
            setIsOpen(data.isOpen);
          }
        })
        .catch((err) => {
          console.error('Failed to load settings:', err);
        })
        .finally(() => setLoading(false));
    }
  }, [isAdmin]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleAddAdminPhone = (e) => {
    e?.preventDefault();
    const clean = newAdminPhone.trim();
    if (!clean) return;
    if (!adminPhones.includes(clean)) {
      setAdminPhones([...adminPhones, clean]);
    }
    setNewAdminPhone('');
  };

  const handleRemoveAdminPhone = (phone) => {
    setAdminPhones(adminPhones.filter((p) => p !== phone));
  };

  const handleAddDeliveryPhone = (e) => {
    e?.preventDefault();
    const clean = newDeliveryPhone.trim();
    if (!clean) return;
    if (!deliveryPhones.includes(clean)) {
      setDeliveryPhones([...deliveryPhones, clean]);
    }
    setNewDeliveryPhone('');
  };

  const handleRemoveDeliveryPhone = (phone) => {
    setDeliveryPhones(deliveryPhones.filter((p) => p !== phone));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      storeName: storeName.trim(),
      adminPhones,
      deliveryPhones,
      deliveryFee: Number(deliveryFee) || 0,
      minOrderAmount: Number(minOrderAmount) || 0,
      isOpen,
      storeTimings: {
        open: openTime,
        close: closeTime,
        isOpen,
      },
    };

    try {
      await updateAdminSettings(payload);
      showToast('Store settings saved successfully!');
    } catch (err) {
      console.error('Failed to update settings:', err);
      showToast('Error saving settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || (!isAdmin && !authLoading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0C831F]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg transition flex items-center space-x-2">
          <Check className="w-4 h-4 text-green-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3.5 shadow-sm">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center space-x-3">
            <Link
              href="/admin"
              className="p-1.5 -ml-1.5 rounded-full hover:bg-gray-100 transition text-gray-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-base font-bold text-gray-900">Store Settings</h1>
              <p className="text-xs text-gray-500">Configure store info, delivery rules & team</p>
            </div>
          </div>
        </div>
      </header>

      {/* Form Area */}
      <main className="p-4 max-w-2xl mx-auto">
        {loading ? (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-3">
              <SkeletonText width="w-36" height="h-5" />
              <SkeletonText width="w-full" height="h-10" />
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-3">
              <SkeletonText width="w-36" height="h-5" />
              <SkeletonText width="w-full" height="h-10" />
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            {/* Store Status Toggle */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Store Status</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {isOpen ? 'Store is open and accepting new orders' : 'Store is currently closed to new orders'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isOpen ? 'bg-[#0C831F]' : 'bg-gray-300'
                }`}
                role="switch"
                aria-checked={isOpen}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isOpen ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* General Info Card */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
                <Store className="w-4 h-4 text-[#0C831F]" />
                <span>Store Information</span>
              </h3>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Store Name
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  required
                  placeholder="e.g. Jyothi Mart"
                  className="w-full text-sm px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0C831F]"
                />
              </div>

              {/* Store Timings */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-gray-500" />
                    <span>Open Time</span>
                  </label>
                  <input
                    type="time"
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                    required
                    className="w-full text-sm px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0C831F]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-gray-500" />
                    <span>Close Time</span>
                  </label>
                  <input
                    type="time"
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    required
                    className="w-full text-sm px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0C831F]"
                  />
                </div>
              </div>
            </div>

            {/* Pricing & Fees Card */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
                <IndianRupee className="w-4 h-4 text-[#0C831F]" />
                <span>Order & Delivery Rules</span>
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Delivery Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0C831F]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Min Order Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0C831F]"
                  />
                </div>
              </div>
            </div>

            {/* Admin Phone Numbers Tag List */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
                <Shield className="w-4 h-4 text-[#0C831F]" />
                <span>Admin Phone Numbers</span>
              </h3>
              <p className="text-xs text-gray-500">
                Users logging in with these numbers will automatically get Admin privileges.
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                {adminPhones.map((phone) => (
                  <span
                    key={phone}
                    className="inline-flex items-center space-x-1.5 px-3 py-1 bg-green-50 text-[#0C831F] border border-green-200 rounded-full text-xs font-semibold"
                  >
                    <span>{phone}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAdminPhone(phone)}
                      className="hover:text-red-500 transition"
                      aria-label={`Remove admin ${phone}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex space-x-2 pt-1">
                <input
                  type="tel"
                  placeholder="Enter 10-digit phone number..."
                  value={newAdminPhone}
                  onChange={(e) => setNewAdminPhone(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddAdminPhone();
                    }
                  }}
                  className="flex-1 text-xs px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0C831F]"
                />
                <button
                  type="button"
                  onClick={handleAddAdminPhone}
                  className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* Delivery Phone Numbers Tag List */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
                <Phone className="w-4 h-4 text-[#0C831F]" />
                <span>Delivery Partner Phone Numbers</span>
              </h3>
              <p className="text-xs text-gray-500">
                Users logging in with these numbers will automatically get Delivery privileges.
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                {deliveryPhones.map((phone) => (
                  <span
                    key={phone}
                    className="inline-flex items-center space-x-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-semibold"
                  >
                    <span>{phone}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDeliveryPhone(phone)}
                      className="hover:text-red-500 transition"
                      aria-label={`Remove delivery phone ${phone}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex space-x-2 pt-1">
                <input
                  type="tel"
                  placeholder="Enter 10-digit phone number..."
                  value={newDeliveryPhone}
                  onChange={(e) => setNewDeliveryPhone(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddDeliveryPhone();
                    }
                  }}
                  className="flex-1 text-xs px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0C831F]"
                />
                <button
                  type="button"
                  onClick={handleAddDeliveryPhone}
                  className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* Submit / Save Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center space-x-2 bg-[#0C831F] text-white py-3.5 rounded-2xl font-bold text-sm hover:bg-green-700 transition disabled:opacity-50 active:scale-[0.99] shadow-md"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving Settings...' : 'Save All Settings'}</span>
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
