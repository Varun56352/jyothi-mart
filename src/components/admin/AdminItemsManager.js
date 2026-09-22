'use client';
import { useState, useEffect, useMemo } from 'react';
import { Search, Eye, EyeOff, Package, RefreshCw, Camera, Image as ImageIcon } from 'lucide-react';
import { getAdminItems, updateAdminItem } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import ProductImageModal from '@/components/admin/ProductImageModal';

export default function AdminItemsManager({ compact = false, onItemUpdated }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [editingItemForImages, setEditingItemForImages] = useState(null);

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

  const handleToggleVisibility = async (item) => {
    const current = item.visible !== undefined ? item.visible : true;
    const newStatus = !current;
    setUpdatingId(item._id);

    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (i._id === item._id ? { ...i, visible: newStatus } : i))
    );

    try {
      await updateAdminItem(item._id, { visible: newStatus });
      showToast(`${item.name} is now ${newStatus ? 'visible online' : 'hidden from store'}`);
      if (onItemUpdated) onItemUpdated({ ...item, visible: newStatus });
    } catch (err) {
      console.error('Failed to update item visibility:', err);
      setItems((prev) =>
        prev.map((i) => (i._id === item._id ? { ...i, visible: current } : i))
      );
      showToast('Error updating item visibility');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleImageSaved = (updatedItem) => {
    setItems((prev) =>
      prev.map((i) => (i._id === updatedItem._id ? { ...i, images: updatedItem.images } : i))
    );
    showToast(`Photos updated for ${updatedItem.name}`);
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
        (i) => i.name?.toLowerCase().includes(q) || i.group?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [items, searchQuery, selectedGroup]);

  const visibleCount = items.filter((i) => i.visible !== false).length;

  return (
    <div className="flex flex-col h-full">
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
              Item Catalog & Online Visibility
            </h2>
            <p className="text-xs text-gray-500">
              {items.length} items • <span className="text-[#0C831F] font-semibold">{visibleCount} online</span>
            </p>
          </div>
          <button
            onClick={fetchItems}
            disabled={loading}
            className="p-1.5 text-gray-500 hover:text-[#0C831F] hover:bg-green-50 rounded-lg transition"
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
              placeholder="Search items..."
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
          <div className="p-6 text-center text-xs text-gray-400">Loading catalog items...</div>
        ) : filteredItems.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Package className="w-8 h-8 mx-auto mb-1 text-gray-300" />
            <p className="text-xs">No matching items</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const stockCount = getStockCount(item.stock);
            const isVisible = item.visible !== false;
            const isUpdating = updatingId === item._id;
            const hasImages = Array.isArray(item.images) && item.images.length > 0;

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
                className="p-3 hover:bg-gray-50/80 transition flex items-center justify-between gap-3"
              >
                {/* Product Thumbnail & Details */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => setEditingItemForImages(item)}
                    className="relative w-11 h-11 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-200 group cursor-pointer"
                    title="Click to edit product photos"
                  >
                    {hasImages ? (
                      <img
                        src={item.images[0]}
                        alt={item.name}
                        className="w-full h-full object-contain mix-blend-multiply p-0.5"
                      />
                    ) : (
                      <Package className="w-5 h-5 text-gray-400 group-hover:text-[#0C831F] transition" />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                      <Camera className="w-3.5 h-3.5" />
                    </div>
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-gray-900 truncate">{item.name}</h4>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                      <span className="font-bold text-gray-900">{formatPrice(item.retailPrice)}</span>
                      {item.unitType && <span className="text-gray-400">({item.unitType})</span>}
                      <span className={`px-1.5 py-0.2 rounded-md border text-[10px] font-semibold ${stockBadge}`}>
                        {stockText}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions: Image Button + Online Visibility Toggle */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingItemForImages(item)}
                    className={`px-2 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer ${
                      hasImages
                        ? 'border-green-200 bg-green-50 text-[#0C831F] hover:bg-green-100'
                        : 'border-dashed border-gray-300 text-gray-500 hover:border-[#0C831F] hover:text-[#0C831F]'
                    }`}
                    title="Upload or manage photos"
                  >
                    <Camera className="w-3 h-3" />
                    <span>{hasImages ? `${item.images.length}` : '+ Photo'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleToggleVisibility(item)}
                    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isVisible ? 'bg-[#0C831F]' : 'bg-gray-300'
                    } ${isUpdating ? 'opacity-50 cursor-wait' : ''}`}
                    role="switch"
                    aria-checked={isVisible}
                    title={isVisible ? 'Visible online (click to hide)' : 'Hidden (click to show online)'}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isVisible ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Product Image Modal */}
      <ProductImageModal
        item={editingItemForImages}
        isOpen={!!editingItemForImages}
        onClose={() => setEditingItemForImages(null)}
        onSaveSuccess={handleImageSaved}
      />
    </div>
  );
}
