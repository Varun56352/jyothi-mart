'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Eye, EyeOff, Package, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getAdminItems, updateAdminItem } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { SkeletonText } from '@/components/common/Skeleton';

export default function AdminItemsPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Protect Admin route
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/login?redirect=/admin/items');
      } else if (!isAdmin) {
        router.replace('/');
      }
    }
  }, [user, isAdmin, authLoading, router]);

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
    if (isAdmin) {
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
    }
  }, [isAdmin]);

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

  const handleToggleVisibility = async (item) => {
    const current = item.visible !== undefined ? item.visible : true;
    const newStatus = !current;

    setUpdatingId(item._id);

    // Optimistic UI update
    setItems((prev) =>
      prev.map((i) => (i._id === item._id ? { ...i, visible: newStatus } : i))
    );

    try {
      await updateAdminItem(item._id, { visible: newStatus });
      showToast(`${item.name} is now ${newStatus ? 'visible online' : 'hidden from store'}`);
    } catch (err) {
      console.error('Failed to update item visibility:', err);
      // Rollback on failure
      setItems((prev) =>
        prev.map((i) => (i._id === item._id ? { ...i, visible: current } : i))
      );
      showToast('Error updating item visibility');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.name?.toLowerCase().includes(q) ||
        item.group?.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  if (authLoading || (!isAdmin && !authLoading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0C831F]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg transition">
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3.5 shadow-sm">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center space-x-3">
            <Link
              href="/admin"
              className="p-1.5 -ml-1.5 rounded-full hover:bg-gray-100 transition text-gray-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-base font-bold text-gray-900">Manage Catalog Items</h1>
              <p className="text-xs text-gray-500">
                {items.length} total • {items.filter((i) => i.visible !== false).length} visible online
              </p>
            </div>
          </div>
          <button
            onClick={fetchItems}
            disabled={loading}
            className="p-2 text-gray-600 hover:text-[#0C831F] hover:bg-green-50 rounded-xl transition disabled:opacity-50"
            title="Refresh items"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Search Bar */}
      <div className="p-4 max-w-5xl mx-auto">
        <div className="relative mb-4">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search items by name or group..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0C831F] shadow-sm"
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                  <div className="space-y-1.5">
                    <SkeletonText width="w-40" height="h-4" />
                    <SkeletonText width="w-24" height="h-3" />
                  </div>
                </div>
                <SkeletonText width="w-16" height="h-6" />
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-2xl border border-gray-200">
            <Package className="w-12 h-12 text-gray-300 mb-3" />
            <h3 className="text-base font-bold text-gray-800">No items found</h3>
            <p className="text-xs text-gray-500 mt-1">
              {searchQuery ? 'Try matching a different keyword' : 'No items are mapped for online sale'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
            {filteredItems.map((item) => {
              const stockCount = getStockCount(item.stock);
              const isVisible = item.visible !== false;
              const isUpdating = updatingId === item._id;

              // Colored: green if >10, yellow if 1-10, red if 0
              let stockBadgeClass = 'bg-green-100 text-green-700 border-green-200';
              let stockLabel = `${stockCount} in stock`;
              if (stockCount <= 0) {
                stockBadgeClass = 'bg-red-100 text-red-700 border-red-200';
                stockLabel = 'Out of stock';
              } else if (stockCount <= 10) {
                stockBadgeClass = 'bg-yellow-100 text-yellow-700 border-yellow-200';
                stockLabel = `${stockCount} left`;
              }

              return (
                <div
                  key={item._id}
                  className="p-3 sm:p-4 flex items-center justify-between hover:bg-gray-50 transition"
                >
                  <div className="flex items-center space-x-3 min-w-0 pr-3">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {item.images?.[0] ? (
                        <img
                          src={item.images[0]}
                          alt={item.name}
                          className="w-full h-full object-contain mix-blend-multiply"
                        />
                      ) : (
                        <Package className="w-6 h-6 text-gray-400" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 truncate">{item.name}</h4>
                      <div className="flex items-center flex-wrap gap-1.5 mt-1">
                        <span className="text-xs font-bold text-gray-900">
                          {formatPrice(item.retailPrice)}
                        </span>
                        {item.unitType && (
                          <span className="text-[11px] text-gray-500">({item.unitType})</span>
                        )}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${stockBadgeClass}`}
                        >
                          {stockLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Online Visibility Toggle */}
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <span className="text-xs text-gray-500 hidden sm:inline">
                      {isVisible ? 'Visible' : 'Hidden'}
                    </span>
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleToggleVisibility(item)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isVisible ? 'bg-[#0C831F]' : 'bg-gray-300'
                      } ${isUpdating ? 'opacity-50 cursor-wait' : ''}`}
                      role="switch"
                      aria-checked={isVisible}
                      aria-label="Toggle visibility"
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isVisible ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <div className="text-gray-400 w-4">
                      {isVisible ? (
                        <Eye className="w-4 h-4 text-[#0C831F]" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
