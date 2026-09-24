'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Sparkles,
  ShoppingBag,
  Percent,
  Tag,
  Truck,
  Clock,
  ShieldCheck,
  TrendingDown,
  Check,
  Palette,
  Image as ImageIcon,
  Sliders,
  Upload,
  ClipboardPaste,
  Loader2,
  Trash2,
} from 'lucide-react';
import { compressImage } from '@/lib/imageUtils';

const THEMES = [
  { id: 'purple', name: 'Zepto Lavender', bg: 'bg-[#F4EEFF] text-[#581C87] border-purple-300' },
  { id: 'green', name: 'Jyothi Emerald', bg: 'bg-[#ECFDF5] text-[#065F46] border-emerald-300' },
  { id: 'orange', name: 'Sunset Gold', bg: 'bg-[#FFF7ED] text-[#9A3412] border-orange-300' },
  { id: 'blue', name: 'Sapphire Blue', bg: 'bg-[#EFF6FF] text-[#1E40AF] border-blue-300' },
  { id: 'dark', name: 'Midnight Dark', bg: 'bg-gray-900 text-white border-gray-700' },
];

const CARD1_ICONS = [
  { id: 'bag', label: 'Store Bag (J Logo)' },
  { id: 'percent', label: 'Discount %' },
  { id: 'tag', label: 'Price Tag' },
  { id: 'truck', label: 'Fast Delivery' },
  { id: 'sparkles', label: 'Sparkles' },
];

const CARD2_ICONS = [
  { id: 'price_down', label: 'Price Down Badge' },
  { id: 'percent', label: 'Offer %' },
  { id: 'shield', label: 'Quality Guarantee' },
  { id: 'clock', label: 'Speed / Timer' },
  { id: 'truck', label: 'Free Delivery' },
];

export default function BannerEditModal({ banner, isOpen, onClose, onSave }) {
  const [form, setForm] = useState({
    id: banner.id || `banner-${Date.now()}`,
    type: banner.type || 'zepto_style',
    active: banner.active !== false,
    title: banner.title || 'ALL NEW JYOTHI MART EXPERIENCE',
    subtitle: banner.subtitle || '',
    card1Text: banner.card1Text || '₹0 FEES',
    card1Icon: banner.card1Icon || 'bag',
    card2Text: banner.card2Text || 'EVERYDAY LOW PRICES*',
    card2Icon: banner.card2Icon || 'price_down',
    features: Array.isArray(banner.features) && banner.features.length >= 3
      ? [...banner.features]
      : [
          banner.features?.[0] || '₹0 Handling Fee',
          banner.features?.[1] || '₹0 Delivery Fee*',
          banner.features?.[2] || '₹0 Rain & Surge Fee',
        ],
    termsText: banner.termsText || '*T&C Apply. Above specific minimum order value',
    badgeText: banner.badgeText || 'Zero Extra Charges',
    bgTheme: banner.bgTheme || 'purple',
    imageUrl: banner.imageUrl || '',
    linkUrl: banner.linkUrl || '',
  });

  const [compressing, setCompressing] = useState(false);
  const [imageError, setImageError] = useState('');
  const fileInputRef = useRef(null);

  const handleBannerFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompressing(true);
    setImageError('');
    try {
      const dataUrl = await compressImage(file, { maxWidth: 1400, maxHeight: 800, quality: 0.85 });
      updateField('imageUrl', dataUrl);
    } catch (err) {
      setImageError(err.message || 'Failed to compress banner image');
    } finally {
      setCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePaste = useCallback(
    async (e) => {
      const clipboardData = e.clipboardData || window.clipboardData;
      if (!clipboardData) return;

      const items = clipboardData.items;
      if (!items || items.length === 0) return;

      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (it.type && it.type.startsWith('image/')) {
          const file = it.getAsFile();
          if (file) {
            e.preventDefault();
            setCompressing(true);
            setImageError('');
            try {
              const dataUrl = await compressImage(file, { maxWidth: 1400, maxHeight: 800, quality: 0.85 });
              updateField('imageUrl', dataUrl);
            } catch (err) {
              setImageError(err.message || 'Failed to compress pasted banner');
            } finally {
              setCompressing(false);
            }
            return;
          }
        }
      }
    },
    []
  );

  useEffect(() => {
    if (!isOpen) return;
    const onWindowPaste = (e) => handlePaste(e);
    window.addEventListener('paste', onWindowPaste);
    return () => window.removeEventListener('paste', onWindowPaste);
  }, [isOpen, handlePaste]);

  const handlePasteFromClipboard = async () => {
    setImageError('');
    try {
      if (navigator.clipboard?.read) {
        const clipboardItems = await navigator.clipboard.read();
        for (const cItem of clipboardItems) {
          for (const type of cItem.types) {
            if (type.startsWith('image/')) {
              const blob = await cItem.getType(type);
              const file = new File([blob], `banner-${Date.now()}.${type.split('/')[1] || 'png'}`, { type });
              setCompressing(true);
              const dataUrl = await compressImage(file, { maxWidth: 1400, maxHeight: 800, quality: 0.85 });
              updateField('imageUrl', dataUrl);
              setCompressing(false);
              return;
            }
          }
        }
      }

      const text = await navigator.clipboard?.readText();
      if (text && (text.startsWith('http://') || text.startsWith('https://') || text.startsWith('data:image/'))) {
        updateField('imageUrl', text.trim());
      } else {
        setImageError('No copied image found in clipboard. Please copy a photo first, then click Paste or press Ctrl+V.');
      }
    } catch (err) {
      console.warn('Clipboard read error:', err);
      setImageError('Please press Ctrl+V on your keyboard to paste.');
    } finally {
      setCompressing(false);
    }
  };

  const updateField = (field, val) => {
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  const updateFeature = (idx, val) => {
    setForm((prev) => {
      const copy = [...prev.features];
      copy[idx] = val;
      return { ...prev, features: copy };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  if (!isOpen || !banner) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl my-8 overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-[#0C831F]" />
            <h2 className="text-base font-bold text-gray-900">
              Edit Homepage Cover Banner
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Live Mini Preview Box */}
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Real-Time Live Preview</span>
            </div>
            <div
              className={`p-4 rounded-2xl border shadow-xs text-center transition-colors ${
                form.bgTheme === 'green'
                  ? 'bg-gradient-to-b from-[#F0FDF4] to-[#DCFCE7] border-emerald-300 text-emerald-950'
                  : form.bgTheme === 'orange'
                  ? 'bg-gradient-to-b from-[#FFF7ED] to-[#FFEDD5] border-orange-300 text-orange-950'
                  : form.bgTheme === 'blue'
                  ? 'bg-gradient-to-b from-[#EFF6FF] to-[#DBEAFE] border-blue-300 text-blue-950'
                  : form.bgTheme === 'dark'
                  ? 'bg-gray-900 border-gray-700 text-white'
                  : 'bg-gradient-to-b from-[#F7F3FF] to-[#ECE3FF] border-purple-200 text-[#581C87]'
              }`}
            >
              {form.badgeText && (
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80 border border-current shadow-2xs mb-1">
                  {form.badgeText}
                </span>
              )}
              <h3 className="text-sm sm:text-base font-black tracking-wide uppercase">
                {form.title || 'ALL NEW ZEPTO EXPERIENCE'}
              </h3>
              {form.subtitle && (
                <p className="text-[11px] opacity-80 mt-0.5">{form.subtitle}</p>
              )}

              {/* 2 Preview Cards */}
              <div className="grid grid-cols-2 gap-2.5 my-2.5 max-w-md mx-auto">
                <div className="bg-white rounded-xl p-2.5 shadow-2xs border border-gray-100 text-left flex items-center gap-2">
                  <div className="w-7 h-7 bg-purple-600 rounded-lg flex items-center justify-center text-white text-xs font-black">
                    J
                  </div>
                  <span className="text-xs sm:text-sm font-black text-gray-900">
                    {form.card1Text || '₹0 FEES'}
                  </span>
                </div>
                <div className="bg-white rounded-xl p-2.5 shadow-2xs border border-gray-100 text-left flex items-center gap-2">
                  <div className="w-7 h-7 bg-purple-600 rounded-lg flex items-center justify-center text-white text-xs font-black">
                    ↓
                  </div>
                  <span className="text-[11px] sm:text-xs font-black text-gray-900 uppercase leading-tight">
                    {form.card2Text || 'EVERYDAY LOW PRICES*'}
                  </span>
                </div>
              </div>

              {/* 3 Preview Perks */}
              <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] font-bold">
                {form.features.map((feat, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <span className="w-3.5 h-3.5 rounded-full bg-[#0C831F] text-white flex items-center justify-center">
                      <Check className="w-2 h-2 stroke-[3]" />
                    </span>
                    <span>{feat}</span>
                  </span>
                ))}
              </div>

              {form.termsText && (
                <p className="text-[9px] text-gray-500 mt-1.5">{form.termsText}</p>
              )}
            </div>
          </div>

          <form id="banner-edit-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Color Theme Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-gray-500" />
                <span>Background Color Theme</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {THEMES.map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => updateField('bgTheme', th.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition text-left cursor-pointer flex items-center justify-between ${
                      form.bgTheme === th.id
                        ? 'border-[#0C831F] bg-green-50 text-[#0C831F] ring-2 ring-green-500/20'
                        : `${th.bg} hover:border-gray-400`
                    }`}
                  >
                    <span>{th.name}</span>
                    {form.bgTheme === th.id && <Check className="w-3.5 h-3.5 text-[#0C831F]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Banner Main Title */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Banner Header Title
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
                required
                placeholder="e.g. ALL NEW JYOTHI MART EXPERIENCE"
                className="w-full text-sm px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0C831F]"
              />
            </div>

            {/* Top Badge & Subtitle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Top Badge Pill (Optional)
                </label>
                <input
                  type="text"
                  value={form.badgeText}
                  onChange={(e) => updateField('badgeText', e.target.value)}
                  placeholder="e.g. Zero Extra Charges"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0C831F]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Subtitle (Optional)
                </label>
                <input
                  type="text"
                  value={form.subtitle}
                  onChange={(e) => updateField('subtitle', e.target.value)}
                  placeholder="e.g. Delivered straight in 10 minutes"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0C831F]"
                />
              </div>
            </div>

            {/* Card 1 & Card 2 Configuration */}
            <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Highlight Cards Configuration
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Card 1 */}
                <div className="bg-white p-3 rounded-xl border border-gray-200 space-y-2">
                  <label className="block text-xs font-bold text-gray-700">
                    Card 1 Text (Left)
                  </label>
                  <input
                    type="text"
                    value={form.card1Text}
                    onChange={(e) => updateField('card1Text', e.target.value)}
                    required
                    placeholder="e.g. ₹0 FEES"
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:border-[#0C831F]"
                  />
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      Card 1 Icon
                    </label>
                    <select
                      value={form.card1Icon}
                      onChange={(e) => updateField('card1Icon', e.target.value)}
                      className="w-full text-xs px-2 py-1.5 rounded-lg border border-gray-300 bg-white"
                    >
                      {CARD1_ICONS.map((ic) => (
                        <option key={ic.id} value={ic.id}>
                          {ic.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Card 2 */}
                <div className="bg-white p-3 rounded-xl border border-gray-200 space-y-2">
                  <label className="block text-xs font-bold text-gray-700">
                    Card 2 Text (Right)
                  </label>
                  <input
                    type="text"
                    value={form.card2Text}
                    onChange={(e) => updateField('card2Text', e.target.value)}
                    required
                    placeholder="e.g. EVERYDAY LOW PRICES*"
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:border-[#0C831F]"
                  />
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      Card 2 Icon
                    </label>
                    <select
                      value={form.card2Icon}
                      onChange={(e) => updateField('card2Icon', e.target.value)}
                      className="w-full text-xs px-2 py-1.5 rounded-lg border border-gray-300 bg-white"
                    >
                      {CARD2_ICONS.map((ic) => (
                        <option key={ic.id} value={ic.id}>
                          {ic.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* 3 Checkmark Feature Perks */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700">
                3 Checkmark Feature Perks (Bottom Row)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] text-gray-500 block mb-0.5">Perk 1</span>
                  <input
                    type="text"
                    value={form.features[0] || ''}
                    onChange={(e) => updateFeature(0, e.target.value)}
                    placeholder="₹0 Handling Fee"
                    className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0C831F]"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block mb-0.5">Perk 2</span>
                  <input
                    type="text"
                    value={form.features[1] || ''}
                    onChange={(e) => updateFeature(1, e.target.value)}
                    placeholder="₹0 Delivery Fee*"
                    className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0C831F]"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block mb-0.5">Perk 3</span>
                  <input
                    type="text"
                    value={form.features[2] || ''}
                    onChange={(e) => updateFeature(2, e.target.value)}
                    placeholder="₹0 Rain & Surge Fee"
                    className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0C831F]"
                  />
                </div>
              </div>
            </div>

            {/* Terms / Disclaimer */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Footer T&C Disclaimer
              </label>
              <input
                type="text"
                value={form.termsText}
                onChange={(e) => updateField('termsText', e.target.value)}
                placeholder="e.g. *T&C Apply. Above specific minimum order value"
                className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0C831F]"
              />
            </div>

            {/* Optional Image Banner Mode */}
            <div className="pt-2 border-t border-gray-100">
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#0C831F]" />
                <span>Custom Image Banner (Optional)</span>
              </label>

              {imageError && (
                <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                  ⚠️ {imageError}
                </div>
              )}

              {form.imageUrl ? (
                <div className="relative mb-2 rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 p-2">
                  <img
                    src={form.imageUrl}
                    alt="Banner preview"
                    className="w-full max-h-36 object-cover rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => updateField('imageUrl', '')}
                    className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-xl shadow-md transition cursor-pointer"
                    title="Remove custom banner"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : null}

              <div className="space-y-1.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBannerFile}
                  className="hidden"
                />
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={compressing}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {compressing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Optimizing...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Banner</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handlePasteFromClipboard}
                    disabled={compressing}
                    className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#0C831F] border border-emerald-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Paste copied photo or press Ctrl+V"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5" />
                    <span>Paste (Ctrl+V)</span>
                  </button>
                </div>

                <input
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) => updateField('imageUrl', e.target.value)}
                  placeholder="Or enter banner image URL (https://...)"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0C831F]"
                />
              </div>

              <p className="text-[10px] text-gray-400 mt-1">
                If provided, will display as an Amazon / Prime Video full-bleed promotional banner.
              </p>
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-end space-x-2 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-100 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="banner-edit-form"
            className="px-5 py-2 rounded-xl bg-[#0C831F] text-white text-xs font-bold hover:bg-green-700 transition shadow-sm cursor-pointer flex items-center space-x-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
}
