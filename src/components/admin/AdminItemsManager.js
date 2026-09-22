'use client';
import { useState, useEffect, useMemo } from 'react';
import { Search, Package, RefreshCw, Pencil, CheckCircle2, EyeOff, Sparkles, Layers } from 'lucide-react';
import { getAdminItems } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import ItemEditModal from '@/components/admin/ItemEditModal';

export default function AdminItemsManager({ compact = false, onItemUpdated }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [toastMessage, setToastMessage] = useState('');
  const [editingItem, setEditingItem] = useState(null);

  const fetchItems = () => {
    setLoading(true);
    getAdminItems()
      .then((res) => {
        const data = res.data?.data || res.data || [];
        setItems(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error('Failed to load admin items:', err);
        setItems([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const getStockCount = (stock) => {
    if (typeof stock === 'number') return stock;
    if (!stock) return 0;
    if (typeof stock === 'object') {
      const full = typeof stock.quantity === 'number' ? stock.quantity : 0;
      const loose = typeof stock.looseQuantity === 'number' ? stock.looseQuantity : 0;
      const pack = typeof stock.qtyPerBagBox === 'number' ? stock.qtyPerBagBox : 1;
      return full * pack + loose;
    }
    return 0;
  };

  const groups = useMemo(() => {
    const set = new Set();
    items.forEach((item) => {
      if (item.group) set.add(item.group);
    });
    return Array.from(set).sort();
  }, [items]);

  const handleItemSaved = (updatedItem) => {
    setItems((prev) =>
      prev.map((i) => (i._id === updatedItem._id ? { ...i, ...updatedItem } : i))
    );
    showToast(`Updated "${updatedItem.displayName || updatedItem.name}" successfully`);
    if (onItemUpdated) onItemUpdated(updatedItem);
  };

  const filteredItems = useMemo(() => {
    let result = items;
    if (selectedGroup !== 'all') {
      result = result.filter((i) => i.group === selectedGroup);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.name?.toLowerCase().includes(q) ||
          i.displayName?.toLowerCase().includes(q) ||
          i.originalName?.toLowerCase().includes(q) ||
          i.group?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [items, searchQuery, selectedGroup]);

  const visibleCount = items.filter((i) => i.visible !== false).length;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg transition">
          {toastMessage}
        </div>
      )}

      {/* Header Bar */}
      <div className="p-4 border-b border-gray-100 bg-white">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Edit Catalog & Pricing
            </h2>
            <p className="text-xs text-gray-500">
              {items.length} items • <span className="text-[#0C831F] font-semibold">{visibleCount} online</span>
            </p>
          </div>
          <button
            onClick={fetchItems}
            disabled={loading}
            className="p-1.5 text-gray-500 hover:text-[#0C831F] hover:bg-green-50 rounded-lg transition cursor-pointer"
            title="Refresh catalog"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search items by name or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-[#0C831F]"
            />
          </div>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="bg-gray-50 border border-gray-200 text-xs text-gray-700 py-1.5 px-2.5 rounded-lg focus:outline-none focus:border-[#0C831F]"
          >
            <option value="all">All Groups</option>
            {groups.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Item List */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-100 bg-white">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400">Loading catalog items...</div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Package className="w-8 h-8 mx-auto mb-1 text-gray-300" />
            <p className="text-xs">No matching items</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const stockCount = getStockCount(item.stock);
            const isVisible = item.visible !== false;
            const hasImages = Array.isArray(item.images) && item.images.length > 0;
            const numMrp = Number(item.mrp) || 0;
            const numPrice = Number(item.retailPrice) || 0;
            const hasDiscount = numMrp > 0 && numPrice > 0 && numMrp > numPrice;
            const discountPercent = hasDiscount ? Math.round(((numMrp - numPrice) / numMrp) * 100) : 0;
            const variantsCount = Array.isArray(item.variants) ? item.variants.length : 0;

            let stockBadge = 'text-green-700 bg-green-50 border-green-200';
            let stockText = `${stockCount} in stock`;
            if (stockCount <= 0) {
              stockBadge = 'text-red-700 bg-red-50 border-red-200';
              stockText = 'Out of stock';
            } else if (stockCount <= 10) {
              stockBadge = 'text-amber-700 bg-amber-50 border-amber-200';
              stockText = `${stockCount} left`;
            }

            return (
              <div
                key={item._id}
                className="p-3.5 hover:bg-gray-50/80 transition flex items-center justify-between gap-3"
              >
                {/* Product Thumbnail & Details */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="relative w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-200">
                    {hasImages ? (
                      <img
                        src={item.images[0]}
                        alt={item.name}
                        className="w-full h-full object-contain mix-blend-multiply p-0.5"
                      />
                    ) : (
                      <Package className="w-5 h-5 text-gray-400" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-xs font-bold text-gray-900 truncate">
                        {item.displayName || item.name}
                      </h4>
                      {item.displayName && item.displayName !== item.originalName && (
                        <span className="text-[10px] text-gray-400">
                          ({item.originalName || item.name})
                        </span>
                      )}
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md border ${
                          isVisible
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-gray-100 text-gray-500 border-gray-200'
                        }`}
                      >
                        {isVisible ? 'Online' : 'Hidden'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-[11px] flex-wrap">
                      <span className="font-extrabold text-gray-900">
                        {formatPrice(numPrice)}
                      </span>
                      {hasDiscount && (
                        <>
                          <del className="text-gray-400">{formatPrice(numMrp)}</del>
                          <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded">
                            {discountPercent}% OFF
                          </span>
                        </>
                      )}
                      {item.unitType && <span className="text-gray-400">({item.unitType})</span>}
                      <span className={`px-1.5 py-0.2 rounded-md border text-[10px] font-semibold ${stockBadge}`}>
                        {stockText}
                      </span>
                      {variantsCount > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                          <Layers className="w-2.5 h-2.5" />
                          <span>{variantsCount} pack options</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side: Single clean EDIT button (as requested) */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingItem(item)}
                    className="inline-flex items-center gap-1.5 bg-[#0C831F] hover:bg-green-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Comprehensive Edit Item Modal */}
      <ItemEditModal
        item={editingItem}
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        onSaveSuccess={handleItemSaved}
      />
    </div>
  );
}
