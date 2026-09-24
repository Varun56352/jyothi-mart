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
  MapPin as MapPinIcon, Navigation, Target,
  Layers,
  Edit3,
  Trash2,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { getCurrentPosition, reverseGeocode } from '@/lib/geoUtils';
import { useAuth } from '@/context/AuthContext';
import { getAdminSettings, updateAdminSettings } from '@/lib/api';
import { SkeletonText } from '@/components/common/Skeleton';
import BannerEditModal from '@/components/admin/BannerEditModal';
import { DEFAULT_HERO_BANNERS } from '@/components/home/HeroBannerCarousel';
import dynamic from 'next/dynamic';

const GoogleMapPicker = dynamic(() => import('@/components/common/GoogleMapPicker'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-48 bg-gray-100 rounded-xl animate-pulse flex items-center justify-center text-xs text-gray-400">
      Loading Google Maps...
    </div>
  ),
});

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

  // Hero Cover Banners State
  const [heroBanners, setHeroBanners] = useState(DEFAULT_HERO_BANNERS);
  const [editingBanner, setEditingBanner] = useState(null);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);

  // Delivery Zone State
  const [warehouseLat, setWarehouseLat] = useState(0);
  const [warehouseLng, setWarehouseLng] = useState(0);
  const [storeAddr, setStoreAddr] = useState('');
  const [radiusKm, setRadiusKm] = useState(3);
  const [detectingGPS, setDetectingGPS] = useState(false);

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

          if (Array.isArray(data.heroBanners) && data.heroBanners.length > 0) {
            setHeroBanners(data.heroBanners);
          }

          const timings = data.storeTimings || {};
          if (timings.open) setOpenTime(timings.open);
          if (timings.close) setCloseTime(timings.close);
          if (timings.isOpen !== undefined) {
            setIsOpen(timings.isOpen);
          } else if (data.isOpen !== undefined) {
            setIsOpen(data.isOpen);
          }

          // Load delivery zone
          const dz = data.deliveryZone || {};
          if (dz.center?.lat) setWarehouseLat(dz.center.lat);
          if (dz.center?.lng) setWarehouseLng(dz.center.lng);
          if (dz.radiusKm) setRadiusKm(dz.radiusKm);
          if (data.storeAddress) setStoreAddr(data.storeAddress);
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

  // Hero Banner Handlers
  const handleOpenEditBanner = (b) => {
    setEditingBanner(b);
    setIsBannerModalOpen(true);
  };

  const handleAddNewBanner = () => {
    const newSlide = {
      id: `banner-${Date.now()}`,
      type: 'zepto_style',
      active: true,
      title: 'ALL NEW ZEPTO EXPERIENCE',
      subtitle: '',
      card1Text: '₹0 FEES',
      card1Icon: 'bag',
      card2Text: 'EVERYDAY LOW PRICES*',
      card2Icon: 'price_down',
      features: ['₹0 Handling Fee', '₹0 Delivery Fee*', '₹0 Rain & Surge Fee'],
      termsText: '*T&C Apply. Above specific minimum order value',
      badgeText: 'Zero Extra Charges',
      bgTheme: 'purple',
      imageUrl: '',
      linkUrl: '',
    };
    setEditingBanner(newSlide);
    setIsBannerModalOpen(true);
  };

  const handleSaveBanner = (updated) => {
    setHeroBanners((prev) => {
      const idx = prev.findIndex((b) => b.id === updated.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      }
      return [...prev, updated];
    });
    showToast('Banner slide updated! Click Save All Settings to publish.');
  };

  const handleToggleBannerActive = (id) => {
    setHeroBanners((prev) =>
      prev.map((b) => (b.id === id ? { ...b, active: b.active === false ? true : false } : b))
    );
  };

  const handleDeleteBanner = (id) => {
    if (heroBanners.length <= 1) {
      showToast('You must keep at least 1 banner in the carousel');
      return;
    }
    setHeroBanners((prev) => prev.filter((b) => b.id !== id));
    showToast('Banner slide removed');
  };

  const handleMoveBanner = (index, dir) => {
    const targetIdx = index + dir;
    if (targetIdx < 0 || targetIdx >= heroBanners.length) return;
    setHeroBanners((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
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
      deliveryZone: {
        type: 'radius',
        center: {
          lat: Number(warehouseLat) || 0,
          lng: Number(warehouseLng) || 0,
        },
        radiusKm: Number(radiusKm) || 3,
      },
      storeAddress: storeAddr.trim(),
      heroBanners,
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

  const handleDetectWarehouse = async () => {
    setDetectingGPS(true);
    try {
      const pos = await getCurrentPosition();
      setWarehouseLat(pos.lat);
      setWarehouseLng(pos.lng);
      const geo = await reverseGeocode(pos.lat, pos.lng);
      if (geo.formatted) setStoreAddr(geo.formatted);
      showToast('Warehouse location detected!');
    } catch (err) {
      showToast(err.message || 'Failed to detect location');
    } finally {
      setDetectingGPS(false);
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

            {/* Homepage Hero Cover Banners (Carousel) */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-[#0C831F]" />
                    <span>Homepage Cover Banners (Carousel)</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Customize the slides shown on your homepage cover (Zepto, Amazon & Netflix style).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddNewBanner}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-[#0C831F] border border-green-200 rounded-xl text-xs font-bold transition cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Slide</span>
                </button>
              </div>

              {/* Banner Slides List */}
              <div className="space-y-2.5">
                {heroBanners.map((banner, idx) => {
                  const isActive = banner.active !== false;
                  return (
                    <div
                      key={banner.id || idx}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isActive
                          ? 'bg-gray-50/80 border-gray-200 hover:border-gray-300'
                          : 'bg-gray-100/60 border-gray-200 opacity-60'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start sm:items-center space-x-3 flex-1 min-w-0">
                          {/* Slide Number Badge */}
                          <div className="w-7 h-7 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-xs font-black text-gray-700 shadow-2xs flex-shrink-0">
                            #{idx + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-gray-900 truncate">
                                {banner.title || 'Untitled Banner'}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                                  banner.bgTheme === 'purple'
                                    ? 'bg-purple-100 text-purple-800'
                                    : banner.bgTheme === 'green'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : banner.bgTheme === 'orange'
                                    ? 'bg-orange-100 text-orange-800'
                                    : banner.bgTheme === 'blue'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-800 text-white'
                                }`}
                              >
                                {banner.bgTheme || 'purple'}
                              </span>
                              {!isActive && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">
                                  Hidden
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5 truncate">
                              <span>Card 1: <strong>{banner.card1Text || '₹0 FEES'}</strong></span>
                              <span>•</span>
                              <span>Card 2: <strong>{banner.card2Text || 'EVERYDAY LOW PRICES*'}</strong></span>
                            </div>
                          </div>
                        </div>

                        {/* Slide Action Controls */}
                        <div className="flex items-center space-x-1.5 self-end sm:self-auto flex-shrink-0">
                          {/* Active Toggle */}
                          <button
                            type="button"
                            onClick={() => handleToggleBannerActive(banner.id)}
                            title={isActive ? 'Hide slide from homepage' : 'Show slide on homepage'}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                              isActive
                                ? 'bg-green-50 text-[#0C831F] border-green-200 hover:bg-green-100'
                                : 'bg-gray-200 text-gray-600 border-gray-300 hover:bg-gray-300'
                            }`}
                          >
                            {isActive ? 'Active' : 'Off'}
                          </button>

                          {/* Reorder Up / Down */}
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveBanner(idx, -1)}
                            className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 disabled:opacity-30 cursor-pointer"
                            title="Move up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === heroBanners.length - 1}
                            onClick={() => handleMoveBanner(idx, 1)}
                            className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 disabled:opacity-30 cursor-pointer"
                            title="Move down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Dialog Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditBanner(banner)}
                            className="px-2.5 py-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                            <span>Edit Dialogs</span>
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteBanner(banner.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition cursor-pointer"
                            title="Delete slide"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Warehouse Location & Delivery Zone */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
                <MapPinIcon className="w-4 h-4 text-[#0C831F]" />
                <span>Warehouse Location & Delivery Zone</span>
              </h3>
              <p className="text-xs text-gray-500">
                Set your store/warehouse GPS coordinates and delivery radius.
              </p>

              {/* Detect Location Button */}
              <button
                type="button"
                onClick={handleDetectWarehouse}
                disabled={detectingGPS}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-50 border-2 border-dashed border-[#0C831F] text-[#0C831F] rounded-xl text-xs font-bold hover:bg-green-100 transition disabled:opacity-50 cursor-pointer"
              >
                <Target className={`w-4 h-4 ${detectingGPS ? 'animate-spin' : ''}`} />
                <span>{detectingGPS ? 'Detecting...' : 'Set to Current Shop Location (GPS)'}</span>
              </button>

              {/* Lat/Lng Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={warehouseLat}
                    onChange={(e) => setWarehouseLat(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0C831F]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={warehouseLng}
                    onChange={(e) => setWarehouseLng(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0C831F]"
                  />
                </div>
              </div>

              {/* Store Address */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Store Address</label>
                <input
                  type="text"
                  value={storeAddr}
                  onChange={(e) => setStoreAddr(e.target.value)}
                  placeholder="e.g. Shop #12, Main Road, Koramangala"
                  className="w-full text-sm px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0C831F]"
                />
              </div>

              {/* Radius Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Delivery Radius</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {[1, 2, 3, 5, 10].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRadiusKm(r)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition cursor-pointer ${
                        Number(radiusKm) === r
                          ? 'bg-[#0C831F] text-white border-[#0C831F]'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-[#0C831F]'
                      }`}
                    >
                      {r} km
                    </button>
                  ))}
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="15"
                  step="0.5"
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(parseFloat(e.target.value))}
                  className="w-full accent-[#0C831F]"
                />
                <p className="text-xs text-gray-500 text-center mt-1">
                  Current: <strong>{radiusKm} km</strong>
                </p>
              </div>

              {/* Preview Info & Interactive Map */}
              {Number(warehouseLat) !== 0 && (
                <div className="space-y-2">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-800">
                    <p className="font-bold">✓ Warehouse Location Set</p>
                    <p className="text-[11px] text-green-700 mt-0.5">
                      {Number(warehouseLat).toFixed(6)}, {Number(warehouseLng).toFixed(6)} — Delivering within {radiusKm} km
                    </p>
                  </div>

                  <div className="h-56 rounded-2xl overflow-hidden border border-gray-200 shadow-2xs relative">
                    <GoogleMapPicker
                      initialCoords={{ lat: Number(warehouseLat), lng: Number(warehouseLng) }}
                      storeCenter={{ lat: Number(warehouseLat), lng: Number(warehouseLng) }}
                      radiusKm={Number(radiusKm) || 3}
                      onLocationChange={(lat, lng, geo) => {
                        setWarehouseLat(lat);
                        setWarehouseLng(lng);
                        if (geo?.formatted) setStoreAddr(geo.formatted);
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 text-center">
                    Drag the map to fine-tune your warehouse pin location
                  </p>
                </div>
              )}
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

        {/* Banner Edit Modal */}
        <BannerEditModal
          isOpen={isBannerModalOpen}
          banner={editingBanner}
          onClose={() => {
            setIsBannerModalOpen(false);
            setEditingBanner(null);
          }}
          onSave={handleSaveBanner}
        />
      </main>
    </div>
  );
}
