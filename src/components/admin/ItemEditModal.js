'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Upload,
  ClipboardPaste,
  Trash2,
  Star,
  Image as ImageIcon,
  Loader2,
  Plus,
  Package,
  Scale,
  Sparkles,
  Percent,
  Check,
  Layers,
} from 'lucide-react';
import { compressImage } from '@/lib/imageUtils';
import { updateAdminItem, getAdminCategories, getAdminSubcategories } from '@/lib/api';

const COMMON_UNITS = [
  'ltr',
  'ml',
  'kg',
  'gm',
  'pcs',
  'pkt',
  'tin',
  'can',
  'bottle',
  'box',
  'puda',
  'sheet',
  'bora',
];

export default function ItemEditModal({ item, isOpen, onClose, onSaveSuccess }) {
  const [visible, setVisible] = useState(true);
  const [images, setImages] = useState([]);
  const [displayName, setDisplayName] = useState('');
  const [categories, setCategories] = useState([]);
  const [allSubcategories, setAllSubcategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [itemType, setItemType] = useState('packed'); // 'packed' | 'loose'
  const [mrp, setMrp] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [variants, setVariants] = useState([]);
  const [baseQty, setBaseQty] = useState(1);
  const [baseUnit, setBaseUnit] = useState('pkt');
  const [pkgSuffix, setPkgSuffix] = useState('');
  const [displayUnit, setDisplayUnit] = useState('');

  const [compressing, setCompressing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        getAdminCategories().catch(() => ({ data: [] })),
        getAdminSubcategories().catch(() => ({ data: [] })),
      ]).then(([catRes, subRes]) => {
        const cats = catRes.data?.data || catRes.data || [];
        const subs = subRes.data?.data || subRes.data || [];
        setCategories(cats);
        setAllSubcategories(subs);
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (item) {
      const type = item.itemType || (item.packageOnly ? 'packed' : 'loose');
      setVisible(item.visible !== false);
      setImages(Array.isArray(item.images) ? [...item.images] : []);
      setDisplayName(item.displayName || '');
      setCategoryId(item.categoryId ? String(item.categoryId) : '');
      setSubcategoryId(item.subcategoryId ? String(item.subcategoryId) : '');
      setItemType(type);
      setMrp(item.mrp !== null && item.mrp !== undefined ? String(item.mrp) : '');
      setCustomPrice(
        item.customPrice !== null && item.customPrice !== undefined
          ? String(item.customPrice)
          : (item.retailPrice !== null && item.retailPrice !== undefined ? String(item.retailPrice) : '')
      );
      setVariants(Array.isArray(item.variants) ? JSON.parse(JSON.stringify(item.variants)) : []);

      // Smart parsing of base quantity and unit
      let parsedQty = item.baseQty;
      let parsedUnit = item.baseUnit;
      let parsedSuffix = '';

      if (item.displayUnit && item.displayUnit.includes('/')) {
        const parts = item.displayUnit.split('/');
        parsedSuffix = parts[1]?.trim() || '';
      }

      if (!parsedQty || !parsedUnit) {
        // Try to match from name, e.g. "Freedom 1ltr", "Coastal palm oil 750gm", "15kg"
        const nameToScan = (item.displayName || item.originalName || item.name || '').toLowerCase();
        const match = nameToScan.match(/(\d+(?:\.\d+)?)\s*(ltr|l|kg|gm|g|ml|pcs|pkt|tin|can|bottle|box)/i);
        if (match) {
          parsedQty = parsedQty || parseFloat(match[1]);
          let u = match[2].toLowerCase();
          if (u === 'l') u = 'ltr';
          if (u === 'g') u = 'gm';
          parsedUnit = parsedUnit || u;
        }
      }

      parsedQty = parsedQty || 1;
      parsedUnit = parsedUnit || (item.unitType && item.unitType !== 'pcs' ? item.unitType.toLowerCase() : (type === 'loose' ? 'kg' : 'pkt'));
      if (!parsedSuffix && type === 'packed') {
        const pType = (item.unitType || item.packagingType || 'pkt').toLowerCase();
        if (['pkt', 'tin', 'can', 'bottle', 'box', 'bag', 'bora', 'puda'].includes(pType)) {
          parsedSuffix = pType;
        } else {
          parsedSuffix = 'pkt';
        }
      }

      setBaseQty(parsedQty);
      setBaseUnit(parsedUnit);
      setPkgSuffix(parsedSuffix);
      setDisplayUnit(item.displayUnit || '');
      setError('');
    }
  }, [item]);

  // Image Upload Handlers
  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    setError('');
    setCompressing(true);

    try {
      const compressedList = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        const compressed = await compressImage(file, { maxWidth: 1000, maxHeight: 1000, quality: 0.82 });
        compressedList.push(compressed);
      }
      setImages((prev) => [...prev, ...compressedList]);
    } catch (err) {
      console.error('Image compression failed:', err);
      setError(err.message || 'Failed to process selected images');
    } finally {
      setCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Clipboard Paste Handlers (Ctrl+V and Paste Button)
  const handlePaste = useCallback(
    async (e) => {
      // Check if clipboard contains images
      const clipboardData = e.clipboardData || window.clipboardData;
      if (!clipboardData) return;

      const items = clipboardData.items;
      if (!items || items.length === 0) return;

      const imageFiles = [];
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (it.type && it.type.startsWith('image/')) {
          const file = it.getAsFile();
          if (file) imageFiles.push(file);
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault();
        await handleFiles(imageFiles);
      }
    },
    []
  );

  useEffect(() => {
    if (!isOpen) return;
    const onWindowPaste = (e) => {
      handlePaste(e);
    };
    window.addEventListener('paste', onWindowPaste);
    return () => window.removeEventListener('paste', onWindowPaste);
  }, [isOpen, handlePaste]);

  const handlePasteFromClipboardButton = async () => {
    setError('');
    try {
      if (navigator.clipboard?.read) {
        const clipboardItems = await navigator.clipboard.read();
        const imageFiles = [];
        for (const cItem of clipboardItems) {
          for (const type of cItem.types) {
            if (type.startsWith('image/')) {
              const blob = await cItem.getType(type);
              const file = new File(
                [blob],
                `pasted-${Date.now()}.${type.split('/')[1] || 'png'}`,
                { type }
              );
              imageFiles.push(file);
            }
          }
        }
        if (imageFiles.length > 0) {
          await handleFiles(imageFiles);
          return;
        }
      }

      // Check if image URL in clipboard text
      const text = await navigator.clipboard?.readText();
      if (
        text &&
        (text.startsWith('http://') ||
          text.startsWith('https://') ||
          text.startsWith('data:image/'))
      ) {
        setImages((prev) => [...prev, text.trim()]);
      } else {
        setError(
          'No copied photo found in clipboard. Please copy an image first, then paste or press Ctrl+V.'
        );
      }
    } catch (err) {
      console.warn('Clipboard read error:', err);
      setError('To paste, click inside this modal and press Ctrl+V on your keyboard.');
    }
  };

  const handleRemoveImage = (index) => {
    setImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSetPrimary = (index) => {
    if (index === 0) return;
    setImages((prev) => {
      const copy = [...prev];
      const [selected] = copy.splice(index, 1);
      copy.unshift(selected);
      return copy;
    });
  };

  // Variant Handlers (Smart Blinkit-Style Pack Multipliers & Quantities)
  const handleAddVariant = () => {
    const defaultQty = variants.length === 0 ? 2 : (Number(variants[variants.length - 1]?.qty) || 1) + 1;
    const baseP = customPrice ? Number(customPrice) : (item.retailPrice || 0);
    const baseM = mrp ? Number(mrp) : null;

    let newVariant;
    if (itemType === 'packed') {
      newVariant = {
        variantId: `var_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        qty: defaultQty,
        label: `Pack of ${defaultQty}`,
        price: Math.round(baseP * defaultQty * 100) / 100,
        mrp: baseM ? Math.round(baseM * defaultQty * 100) / 100 : null,
        unit: baseUnit || item.unitType || '',
        stock: null,
      };
    } else {
      // Loose item: per-unit price defaults to base selling price
      const perUnit = baseP;
      newVariant = {
        variantId: `var_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        qty: defaultQty,
        label: `${defaultQty} ${baseUnit || 'kg'}`,
        perUnitPrice: perUnit,
        price: Math.round(perUnit * defaultQty * 100) / 100,
        mrp: baseM ? Math.round(baseM * defaultQty * 100) / 100 : null,
        unit: baseUnit || item.unitType || '',
        stock: null,
      };
    }
    setVariants((prev) => [...prev, newVariant]);
  };

  const handleUpdateVariantQty = (index, val) => {
    const q = val === '' ? '' : Number(val);
    const numericQ = Number(val) || 0;
    const baseP = customPrice ? Number(customPrice) : (item.retailPrice || 0);
    const baseM = mrp ? Number(mrp) : null;

    setVariants((prev) => {
      const copy = [...prev];
      const cur = copy[index];
      if (itemType === 'packed') {
        copy[index] = {
          ...cur,
          qty: q,
          label: numericQ > 0 ? `Pack of ${numericQ}` : cur.label,
          price: numericQ > 0 ? Math.round(baseP * numericQ * 100) / 100 : cur.price,
          mrp: baseM && numericQ > 0 ? Math.round(baseM * numericQ * 100) / 100 : null,
        };
      } else {
        const perU = cur.perUnitPrice !== undefined && cur.perUnitPrice !== null && cur.perUnitPrice !== ''
          ? Number(cur.perUnitPrice)
          : baseP;
        copy[index] = {
          ...cur,
          qty: q,
          label: numericQ > 0 ? `${numericQ} ${baseUnit || 'kg'}` : cur.label,
          price: numericQ > 0 ? Math.round(perU * numericQ * 100) / 100 : 0,
          mrp: baseM && numericQ > 0 ? Math.round(baseM * numericQ * 100) / 100 : null,
        };
      }
      return copy;
    });
  };

  const handleUpdateVariantPerUnitPrice = (index, val) => {
    const perU = val === '' ? '' : Number(val);
    const numericPerU = Number(val) || 0;

    setVariants((prev) => {
      const copy = [...prev];
      const cur = copy[index];
      const q = Number(cur.qty) || 0;
      copy[index] = {
        ...cur,
        perUnitPrice: perU,
        price: q > 0 ? Math.round(numericPerU * q * 100) / 100 : 0,
      };
      return copy;
    });
  };

  const handleUpdateVariantPrice = (index, val) => {
    setVariants((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        price: val === '' ? '' : Number(val),
      };
      return copy;
    });
  };

  const handleUpdateVariantLabel = (index, val) => {
    setVariants((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        label: val,
      };
      return copy;
    });
  };

  const handleRemoveVariant = (index) => {
    setVariants((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Calculate Base Discount Percentage
  const numMrp = Number(mrp) || 0;
  const numPrice = Number(customPrice) || 0;
  const calculatedDiscount =
    numMrp > 0 && numPrice > 0 && numMrp > numPrice
      ? Math.round(((numMrp - numPrice) / numMrp) * 100)
      : 0;

  const computedDisplayUnit = displayUnit || (
    itemType === 'packed'
      ? `${baseQty} ${baseUnit}${pkgSuffix ? '/' + pkgSuffix : ''}`.trim()
      : `${baseQty} ${baseUnit}`.trim()
  );

  // Validation & Save Handler
  const handleSave = async () => {
    setError('');

    // Rule: Category & Subcategory are strictly mandatory
    if (!categoryId) {
      setError('Category is mandatory. Please select a category for this item.');
      return;
    }
    if (!subcategoryId) {
      setError('Subcategory is mandatory. Please select a subcategory for this item.');
      return;
    }

    // Rule: For packed items, MRP is mandatory
    if (itemType === 'packed') {
      if (!mrp || Number(mrp) <= 0) {
        setError('MRP is mandatory for packed items. Please enter a valid MRP.');
        return;
      }
    }

    // Validate Variants
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      const q = Number(v.qty);
      if (!q || q <= 0) {
        setError(`Variant #${i + 1} has an invalid quantity (must be greater than 0).`);
        return;
      }
      const p = Number(v.price);
      if (v.price === undefined || v.price === '' || isNaN(p) || p <= 0) {
        setError(`Variant #${i + 1} (${v.label || 'Pack size'}) has an invalid selling price.`);
        return;
      }
      if (itemType === 'packed' && (!v.mrp || Number(v.mrp) <= 0)) {
        setError(`Variant #${i + 1} (${v.label || 'Pack size'}) must have an MRP since this is a packed item.`);
        return;
      }
      if (itemType === 'loose') {
        const perU = Number(v.perUnitPrice);
        if (v.perUnitPrice === '' || v.perUnitPrice === undefined || isNaN(perU) || perU <= 0) {
          setError(`Variant #${i + 1} (${v.label || 'Pack size'}) is missing a rate per ${baseUnit || 'kg'}.`);
          return;
        }
      }
    }

    setSaving(true);
    try {
      const selectedCat = categories.find((c) => String(c._id) === String(categoryId));
      const selectedSub = allSubcategories.find((s) => String(s._id) === String(subcategoryId));

      const computedDisplayUnit = itemType === 'packed'
        ? `${baseQty} ${baseUnit}${pkgSuffix ? '/' + pkgSuffix : ''}`.trim()
        : `${baseQty} ${baseUnit}`.trim();

      const payload = {
        visible,
        images,
        displayName: displayName.trim(),
        categoryId,
        categoryName: selectedCat?.name || item.categoryName || '',
        subcategoryId,
        subcategoryName: selectedSub?.name || item.subcategoryName || '',
        itemType,
        baseQty: Number(baseQty) || 1,
        baseUnit: (baseUnit || '').trim(),
        displayUnit: computedDisplayUnit,
        mrp: mrp ? Number(mrp) : null,
        customPrice: customPrice ? Number(customPrice) : null,
        variants: variants.map((v) => ({
          ...v,
          qty: Number(v.qty) || 1,
          label: (v.label || '').trim() || (itemType === 'packed' ? `Pack of ${v.qty || 1}` : `${v.qty || 1} ${baseUnit || 'kg'}`),
          price: Number(v.price),
          mrp: v.mrp ? Number(v.mrp) : null,
          perUnitPrice: v.perUnitPrice !== undefined && v.perUnitPrice !== null && v.perUnitPrice !== '' ? Number(v.perUnitPrice) : null,
          unit: baseUnit || item.unitType || '',
        })),
      };

      const res = await updateAdminItem(item._id, payload);
      const updatedData = res.data?.data || res.data;

      if (onSaveSuccess) {
        onSaveSuccess({
          ...item,
          ...payload,
          name: payload.displayName || item.originalName || item.name,
          retailPrice: payload.customPrice || item.retailPrice,
        });
      }
      onClose();
    } catch (err) {
      console.error('Failed to save item:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save item settings');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-gray-900 leading-tight">
                Edit Online Product
              </h2>
              <span className="text-[11px] font-bold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                {item.group || 'Item'}
              </span>
            </div>
            <p className="text-xs text-gray-500 truncate max-w-md mt-0.5">
              Original: <span className="font-semibold text-gray-700">{item.originalName || item.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Form */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-2xl font-medium">
              ⚠️ {error}
            </div>
          )}

          {/* 1. Visibility Switch */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-900 block">Online Store Visibility</span>
              <span className="text-[11px] text-gray-500">
                {visible ? 'This product is active and visible for customers online' : 'This product is hidden from the customer storefront'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setVisible(!visible)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                visible ? 'bg-[#0C831F]' : 'bg-gray-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  visible ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 2. Upload Images */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Product Photos ({images.length})
              </label>
              <span className="text-[11px] text-gray-400">First image is the primary cover</span>
            </div>

            {/* Dropzone with Upload and Paste options */}
            <div className="border-2 border-dashed border-gray-300 hover:border-[#0C831F] bg-gray-50/70 hover:bg-green-50/30 rounded-2xl p-4 sm:p-5 text-center transition flex flex-col items-center justify-center group mb-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
              {compressing ? (
                <div className="flex items-center gap-2 text-xs text-[#0C831F] font-bold py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing and optimizing photo...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2.5 w-full">
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 bg-white hover:bg-gray-100 border border-gray-300 text-gray-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#0C831F]" />
                      <span>Upload from Device</span>
                    </button>

                    <button
                      type="button"
                      onClick={handlePasteFromClipboardButton}
                      className="px-3.5 py-2 bg-[#0C831F] hover:bg-green-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                    >
                      <ClipboardPaste className="w-3.5 h-3.5" />
                      <span>Paste Copied Photo</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-gray-500 font-medium">
                    Or simply copy any photo and press{' '}
                    <kbd className="px-1.5 py-0.5 bg-gray-200 border border-gray-300 rounded text-[10px] font-mono text-gray-800">
                      Ctrl + V
                    </kbd>{' '}
                    anywhere to paste directly!
                  </p>
                </div>
              )}
            </div>

            {/* Image Preview Grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative group bg-gray-100 rounded-xl overflow-hidden border border-gray-200 aspect-square flex items-center justify-center"
                  >
                    <img src={img} alt={`Product ${idx}`} className="w-full h-full object-contain p-1.5" />
                    {idx === 0 && (
                      <span className="absolute top-1 left-1 bg-[#0C831F] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-current" /> Cover
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5">
                      {idx !== 0 && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(idx)}
                          className="p-1.5 bg-white text-gray-800 hover:text-[#0C831F] rounded-md shadow-xs transition"
                          title="Set as Cover"
                        >
                          <Star className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="p-1.5 bg-white text-red-600 hover:bg-red-50 rounded-md shadow-xs transition"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Display Name */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
              Display Name (Online Store)
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={item.originalName || item.name}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-[#0C831F] focus:ring-1 focus:ring-[#0C831F]"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Leave blank to automatically use: <strong>"{item.originalName || item.name}"</strong>
            </p>
          </div>

          {/* 4. Category & Subcategory Selection (Mandatory) */}
          <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-[#0C831F] uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>Category & Subcategory (Mandatory)</span>
              </label>
              <span className="text-[10px] bg-[#0C831F] text-white font-bold px-2 py-0.5 rounded-full">
                Required for Storefront
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Category Select */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Main Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value);
                    setSubcategoryId('');
                  }}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#0C831F]"
                >
                  <option value="">-- Select Main Category --</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subcategory Select */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Subcategory <span className="text-red-500">*</span>
                </label>
                <select
                  value={subcategoryId}
                  onChange={(e) => setSubcategoryId(e.target.value)}
                  disabled={!categoryId}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#0C831F] disabled:opacity-50 disabled:bg-gray-100"
                >
                  <option value="">
                    {!categoryId ? '-- Select Category First --' : '-- Select Subcategory --'}
                  </option>
                  {allSubcategories
                    .filter((sub) => String(sub.category?._id || sub.category) === String(categoryId))
                    .map((sub) => (
                      <option key={sub._id} value={sub._id}>
                        {sub.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <p className="text-[11px] text-gray-500">
              Assigning both ensures this item is placed in the right department on the website.
            </p>
          </div>

          {/* 4. Item Type: Packed vs Loose */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">
              Item Packaging Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setItemType('packed')}
                className={`p-3.5 rounded-2xl border-2 text-left transition flex items-center gap-3 cursor-pointer ${
                  itemType === 'packed'
                    ? 'border-[#0C831F] bg-green-50/50 text-[#0C831F]'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${itemType === 'packed' ? 'bg-[#0C831F] text-white' : 'bg-gray-100 text-gray-600'}`}>
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-xs block text-gray-900">Packed Item</span>
                  <span className="text-[10px] text-gray-500">Packets, bottles, boxes (MRP mandatory)</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setItemType('loose')}
                className={`p-3.5 rounded-2xl border-2 text-left transition flex items-center gap-3 cursor-pointer ${
                  itemType === 'loose'
                    ? 'border-[#0C831F] bg-green-50/50 text-[#0C831F]'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${itemType === 'loose' ? 'bg-[#0C831F] text-white' : 'bg-gray-100 text-gray-600'}`}>
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-xs block text-gray-900">Loose Item</span>
                  <span className="text-[10px] text-gray-500">Grains, dal, sugar by kg/g (MRP optional)</span>
                </div>
              </button>
            </div>
          </div>

          {/* 5. Base Quantity & Packaging Measurement */}
          <div className="bg-emerald-50/40 border border-emerald-200/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-[#0C831F] uppercase tracking-wider flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5" />
                <span>Base Quantity & Unit (e.g. 1 ltr/pkt)</span>
              </label>
              <span className="text-[10px] text-gray-500 font-semibold">
                Original Unit: <strong className="text-gray-700">{item.unitType || item.packagingType || 'unit'}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Quantity Number */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Quantity Value <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={baseQty}
                  onChange={(e) => setBaseQty(e.target.value)}
                  placeholder="e.g. 1, 750, 500"
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#0C831F]"
                />
              </div>

              {/* Measurement Unit */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Measurement Unit <span className="text-red-500">*</span>
                </label>
                <select
                  value={COMMON_UNITS.includes(baseUnit) ? baseUnit : 'custom'}
                  onChange={(e) => {
                    if (e.target.value !== 'custom') {
                      setBaseUnit(e.target.value);
                    } else {
                      setBaseUnit('');
                    }
                  }}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#0C831F]"
                >
                  <option value="ltr">ltr (Litre)</option>
                  <option value="ml">ml (Millilitre)</option>
                  <option value="kg">kg (Kilogram)</option>
                  <option value="gm">gm (Gram)</option>
                  <option value="pcs">pcs (Pieces)</option>
                  <option value="pkt">pkt (Packet)</option>
                  <option value="tin">tin (Tin)</option>
                  <option value="can">can (Can)</option>
                  <option value="bottle">bottle (Bottle)</option>
                  <option value="box">box (Box)</option>
                  <option value="puda">puda (Puda)</option>
                  <option value="sheet">sheet (Sheet)</option>
                  <option value="bora">bora (Bora)</option>
                  <option value="custom">Other / Custom...</option>
                </select>
                {(!COMMON_UNITS.includes(baseUnit) || baseUnit === '') && (
                  <input
                    type="text"
                    value={baseUnit}
                    onChange={(e) => setBaseUnit(e.target.value)}
                    placeholder="Type custom unit (e.g. roll)"
                    className="mt-1.5 w-full bg-white border border-gray-300 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#0C831F]"
                  />
                )}
              </div>

              {/* Suffix / Packaging Container (For Packed items) */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  {itemType === 'packed' ? 'Packaging Suffix' : 'Display Suffix'}
                </label>
                <input
                  type="text"
                  value={pkgSuffix}
                  onChange={(e) => setPkgSuffix(e.target.value)}
                  placeholder={itemType === 'packed' ? 'e.g. pkt, bottle, tin' : 'Optional (leave blank)'}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#0C831F]"
                />
              </div>
            </div>

            {/* Live Storefront Unit Preview */}
            <div className="bg-white border border-emerald-200 rounded-xl p-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 font-medium">Storefront Display:</span>
                <span className="font-extrabold text-[#0C831F] bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-300">
                  {computedDisplayUnit || '1 unit'}
                </span>
              </div>
              <span className="text-[10px] text-gray-400">
                Shown below title on website (e.g. 1 ltr/pkt)
              </span>
            </div>
          </div>

          {/* 6 & 7. MRP & Selling Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                MRP (₹) {itemType === 'packed' ? <span className="text-red-500">*Mandatory</span> : <span className="text-gray-400 font-normal">(Optional)</span>}
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={mrp}
                onChange={(e) => setMrp(e.target.value)}
                placeholder={itemType === 'packed' ? 'e.g. 75 (Required)' : 'e.g. 60 (Optional)'}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-[#0C831F]"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                {itemType === 'packed' ? 'Will be displayed as crossed-out on the store' : 'Leave empty if no reference MRP'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                Online Selling Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                placeholder={String(item.retailPrice || '')}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-[#0C831F]"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Actual price the customer will pay at checkout
              </p>
            </div>
          </div>

          {/* Discount Preview Pill */}
          {calculatedDiscount > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-800 font-semibold">
                  Customer will see: <del className="text-gray-400">₹{numMrp}</del>{' '}
                  <strong className="text-gray-900">₹{numPrice}</strong>
                </span>
              </div>
              <span className="bg-[#0C831F] text-white font-extrabold text-[11px] px-2.5 py-0.5 rounded-full">
                {calculatedDiscount}% OFF
              </span>
            </div>
          )}

          {/* 7. Dynamic Quantity Variants (Pack Options) */}
          <div className="border-t border-gray-200 pt-5">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Quantity Options & Pack Sizes (Blinkit Style)
                </h3>
                <p className="text-[11px] text-gray-500">
                  Allow customers to pick between e.g. 1 kg, 2 kg, 5 kg with discounted bulk rates
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddVariant}
                className="inline-flex items-center gap-1 bg-green-50 text-[#0C831F] hover:bg-green-100 border border-green-200 text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Pack Size</span>
              </button>
            </div>

            {variants.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center text-xs text-gray-500">
                Single quantity item ({item.unitType || '1 unit'}). Click <strong>"Add Pack Size"</strong> to offer multiple weights/quantities.
              </div>
            ) : (
              <div className="space-y-3">
                {variants.map((v, idx) => {
                  const vMrp = Number(v.mrp) || 0;
                  const vPrice = Number(v.price) || 0;
                  const vDiscount =
                    vMrp > 0 && vPrice > 0 && vMrp > vPrice
                      ? Math.round(((vMrp - vPrice) / vMrp) * 100)
                      : 0;

                  return (
                    <div
                      key={v.variantId || idx}
                      className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-700">
                          Option #{idx + 1}
                        </span>
                        {vDiscount > 0 && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            {vDiscount}% OFF
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(idx)}
                          className="text-red-500 hover:text-red-700 p-1 rounded transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {itemType === 'packed' ? (
                        /* PACKED ITEM: Multiplier, Selling Price (auto with override), Auto MRP */
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          {/* 1. Pack Multiplier */}
                          <div>
                            <label className="block text-[10px] font-bold text-gray-600 mb-0.5 uppercase">
                              Pack Quantity (Multiplier) *
                            </label>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={v.qty ?? ''}
                              onChange={(e) => handleUpdateVariantQty(idx, e.target.value)}
                              placeholder="e.g. 3"
                              className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 font-bold text-xs focus:outline-none focus:border-[#0C831F]"
                            />
                            <div className="mt-1 space-y-0.5">
                              <span className="text-[10px] text-gray-500 font-medium block">
                                Pack Label:
                              </span>
                              <input
                                type="text"
                                value={v.label}
                                onChange={(e) => handleUpdateVariantLabel(idx, e.target.value)}
                                placeholder={`${v.qty || 1} x ${baseQty} ${baseUnit}`}
                                className="w-full text-[11px] font-semibold text-gray-800 bg-white border border-gray-200 rounded px-1.5 py-0.5 focus:outline-none focus:border-[#0C831F]"
                              />
                            </div>
                          </div>

                          {/* 2. Selling Price */}
                          <div>
                            <label className="block text-[10px] font-bold text-gray-600 mb-0.5 uppercase">
                              Selling Price (₹) *
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={v.price ?? ''}
                              onChange={(e) => handleUpdateVariantPrice(idx, e.target.value)}
                              placeholder="Auto-calculated"
                              className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 font-bold text-xs focus:outline-none focus:border-[#0C831F]"
                            />
                            <span className="text-[10px] text-emerald-700 font-semibold block mt-1">
                              Base: {v.qty || 1} × ₹{customPrice || item.retailPrice || 0} = ₹{Math.round((Number(customPrice) || item.retailPrice || 0) * (Number(v.qty) || 1) * 100) / 100}
                            </span>
                          </div>

                          {/* 3. Auto-calculated MRP */}
                          <div>
                            <label className="block text-[10px] font-bold text-gray-600 mb-0.5 uppercase">
                              Auto MRP (₹) (Read-only)
                            </label>
                            <div className="w-full bg-gray-100 border border-gray-200 rounded-lg px-2.5 py-1.5 font-bold text-xs text-gray-700">
                              {v.mrp ? `₹${v.mrp}` : (mrp ? `₹${Math.round(Number(mrp) * (Number(v.qty) || 1) * 100) / 100}` : 'No MRP')}
                            </div>
                            <span className="text-[10px] text-gray-500 font-medium block mt-1">
                              {mrp ? `${v.qty || 1} × ₹${mrp} (auto from base)` : 'No base MRP defined'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        /* LOOSE ITEM: Quantity, Rate per unit, Auto-multiplied Total */
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          {/* 1. Quantity in baseUnit */}
                          <div>
                            <label className="block text-[10px] font-bold text-gray-600 mb-0.5 uppercase">
                              Quantity ({baseUnit || 'kg'}) *
                            </label>
                            <input
                              type="number"
                              min="0.05"
                              step="any"
                              value={v.qty ?? ''}
                              onChange={(e) => handleUpdateVariantQty(idx, e.target.value)}
                              placeholder="e.g. 5"
                              className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 font-bold text-xs focus:outline-none focus:border-[#0C831F]"
                            />
                            <div className="mt-1 space-y-0.5">
                              <span className="text-[10px] text-gray-500 font-medium block">
                                Pack Label:
                              </span>
                              <input
                                type="text"
                                value={v.label}
                                onChange={(e) => handleUpdateVariantLabel(idx, e.target.value)}
                                placeholder={`${v.qty || 1} ${baseUnit || 'kg'}`}
                                className="w-full text-[11px] font-semibold text-gray-800 bg-white border border-gray-200 rounded px-1.5 py-0.5 focus:outline-none focus:border-[#0C831F]"
                              />
                            </div>
                          </div>

                          {/* 2. Rate per baseUnit */}
                          <div>
                            <label className="block text-[10px] font-bold text-gray-600 mb-0.5 uppercase">
                              Rate per {baseUnit || 'kg'} (₹) *
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={v.perUnitPrice ?? ''}
                              onChange={(e) => handleUpdateVariantPerUnitPrice(idx, e.target.value)}
                              placeholder={String(customPrice || item.retailPrice || '')}
                              className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 font-bold text-xs focus:outline-none focus:border-[#0C831F]"
                            />
                            <span className="text-[10px] text-gray-500 block mt-1">
                              Base: ₹{customPrice || item.retailPrice || 0}/{baseUnit || 'kg'}
                            </span>
                          </div>

                          {/* 3. Auto Multiplied Total & MRP */}
                          <div>
                            <label className="block text-[10px] font-bold text-gray-600 mb-0.5 uppercase">
                              Total Customer Pays
                            </label>
                            <div className="w-full bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5 font-black text-xs text-[#0C831F]">
                              ₹{v.price || 0}
                              {v.mrp ? <del className="text-gray-400 font-normal ml-2">₹{v.mrp}</del> : null}
                            </div>
                            <span className="text-[10px] text-emerald-700 font-semibold block mt-1">
                              {v.qty || 1} × ₹{v.perUnitPrice || customPrice || 0} = ₹{v.price || 0} (MRP: ₹{v.mrp || 0})
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || compressing}
            className="px-6 py-2.5 bg-[#0C831F] hover:bg-green-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save Item Settings</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
