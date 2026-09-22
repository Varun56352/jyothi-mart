'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Package,
  Phone,
  User,
  Clock,
  RefreshCw,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getAdminOrders, updateAdminOrder, getDeliveryPersonnel } from '@/lib/api';
import { formatPrice, formatDate, getOrderStatusLabel } from '@/lib/utils';
import { SkeletonText } from '@/components/common/Skeleton';

const STATUS_TABS = [
  { id: 'all', label: 'All' },
  { id: 'placed', label: 'Placed' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'packing', label: 'Packing' },
  { id: 'out_for_delivery', label: 'Out for Delivery' },
  { id: 'delivered', label: 'Delivered' },
];

const STATUS_STYLES = {
  placed: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  packing: 'bg-orange-50 text-orange-700 border-orange-200',
  out_for_delivery: 'bg-purple-50 text-purple-700 border-purple-200',
  delivered: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
};

const ALL_STATUSES = [
  { value: 'placed', label: 'Placed' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'packing', label: 'Packing' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function AdminOrdersPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('all');
  const [orders, setOrders] = useState([]);
  const [deliveryPersonnel, setDeliveryPersonnel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  // Edit draft states for expanded order: { [orderId]: { status, assignedTo } }
  const [editState, setEditState] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Protect Admin route
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/login?redirect=/admin/orders');
      } else if (!isAdmin) {
        router.replace('/');
      }
    }
  }, [user, isAdmin, authLoading, router]);

  // Load delivery personnel once
  useEffect(() => {
    if (isAdmin) {
      getDeliveryPersonnel()
        .then((res) => {
          const list = res.data?.data || res.data || [];
          setDeliveryPersonnel(Array.isArray(list) ? list : []);
        })
        .catch((err) => console.error('Failed to load delivery personnel:', err));
    }
  }, [isAdmin]);

  // Load orders when activeTab changes
  const fetchOrders = () => {
    setLoading(true);
    const params = activeTab === 'all' ? {} : { status: activeTab };
    getAdminOrders(params)
      .then((res) => {
        const list = res.data?.data || res.data || [];
        setOrders(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        console.error('Failed to load admin orders:', err);
        setOrders([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isAdmin) {
      fetchOrders();
    }
  }, [isAdmin, activeTab]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const toggleExpand = (order) => {
    const isCurrentlyExpanded = expandedId === order._id;
    if (isCurrentlyExpanded) {
      setExpandedId(null);
    } else {
      setExpandedId(order._id);
      // Initialize editing draft for this order
      setEditState((prev) => ({
        ...prev,
        [order._id]: {
          status: order.status,
          assignedTo: order.assignedTo?._id || order.assignedTo || '',
        },
      }));
    }
  };

  const handleSaveOrder = async (orderId) => {
    const draft = editState[orderId];
    if (!draft) return;

    setSavingId(orderId);
    try {
      const res = await updateAdminOrder(orderId, {
        status: draft.status,
        assignedTo: draft.assignedTo || null,
      });

      const updated = res.data?.data || res.data;
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, ...updated } : o))
      );
      showToast('Order updated successfully');
    } catch (err) {
      console.error('Failed to update order:', err);
      showToast('Failed to save order update');
    } finally {
      setSavingId(null);
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
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Toast Alert */}
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
              <h1 className="text-base font-bold text-gray-900">Manage Orders</h1>
              <p className="text-xs text-gray-500">
                {orders.length} {activeTab === 'all' ? 'total' : activeTab} orders
              </p>
            </div>
          </div>
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="p-2 text-gray-600 hover:text-[#0C831F] hover:bg-green-50 rounded-xl transition disabled:opacity-50"
            title="Refresh orders"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Status Filter Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-[57px] z-30">
        <div className="max-w-5xl mx-auto flex space-x-1 overflow-x-auto no-scrollbar px-4 py-2">
          {STATUS_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold transition flex-shrink-0 ${
                  isActive
                    ? 'bg-[#0C831F] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders List */}
      <main className="p-4 max-w-5xl mx-auto space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-gray-200 space-y-3 animate-pulse">
                <div className="flex justify-between">
                  <SkeletonText width="w-28" height="h-5" />
                  <SkeletonText width="w-20" height="h-5" />
                </div>
                <SkeletonText width="w-48" height="h-4" />
                <SkeletonText width="w-32" height="h-3" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-2xl border border-gray-200">
            <Package className="w-12 h-12 text-gray-300 mb-3" />
            <h3 className="text-base font-bold text-gray-800">No orders found</h3>
            <p className="text-xs text-gray-500 mt-1">
              No orders match the selected &quot;{activeTab}&quot; filter.
            </p>
          </div>
        ) : (
          orders.map((order) => {
            const isExpanded = expandedId === order._id;
            const statusKey = order.status?.toLowerCase() || 'placed';
            const badgeClass = STATUS_STYLES[statusKey] || 'bg-gray-100 text-gray-700 border-gray-200';

            const displayOrderNumber =
              order.orderNumber ||
              (typeof order._id === 'string' ? `#${order._id.slice(-6).toUpperCase()}` : `#${order._id}`);

            // Items summary (first 2 item names)
            const itemNames = (order.items || []).map((i) => i.name).filter(Boolean);
            let itemsSummary = itemNames.slice(0, 2).join(', ');
            if (itemNames.length > 2) {
              itemsSummary += ` +${itemNames.length - 2} more`;
            }

            const currentDraft = editState[order._id] || {
              status: order.status,
              assignedTo: order.assignedTo?._id || order.assignedTo || '',
            };

            const customerPhone =
              order.customerPhone ||
              (typeof order.customer === 'object' ? order.customer?.phone : '') ||
              'Customer phone not set';

            return (
              <div
                key={order._id}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition"
              >
                {/* Collapsed Card Header */}
                <div
                  onClick={() => toggleExpand(order)}
                  className="p-4 cursor-pointer hover:bg-gray-50/75 transition select-none"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-gray-900">{displayOrderNumber}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs font-medium text-gray-600 flex items-center">
                        <Phone className="w-3 h-3 mr-1 text-gray-400" />
                        {customerPhone}
                      </span>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeClass}`}
                    >
                      {getOrderStatusLabel(order.status)}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 line-clamp-1 mb-2 font-medium">
                    {itemsSummary || 'No items'}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span>{formatDate(order.createdAt)}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-gray-900">
                        {formatPrice(order.grandTotal || 0)}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-gray-50/50 space-y-4">
                    {/* Full items list */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                        Order Items ({order.items?.length || 0})
                      </h4>
                      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="p-3 flex items-center justify-between text-xs">
                            <div className="min-w-0 pr-2">
                              <p className="font-semibold text-gray-800 line-clamp-1">{item.name}</p>
                              <p className="text-gray-500 text-[11px]">
                                {formatPrice(item.price)} &times; {item.qty} {item.unit || ''}
                              </p>
                            </div>
                            <span className="font-bold text-gray-900 flex-shrink-0">
                              {formatPrice(item.total ?? (item.price * item.qty))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delivery Address & Notes */}
                    {order.deliveryAddress && (
                      <div className="bg-white p-3 rounded-xl border border-gray-200 text-xs">
                        <span className="font-bold text-gray-700 uppercase tracking-wide text-[10px] block mb-1">
                          Delivery Address
                        </span>
                        <p className="text-gray-600">
                          {typeof order.deliveryAddress === 'string'
                            ? order.deliveryAddress
                            : [
                                order.deliveryAddress.fullAddress || order.deliveryAddress.addressLine1,
                                order.deliveryAddress.landmark,
                                order.deliveryAddress.city,
                                order.deliveryAddress.pincode,
                              ]
                                .filter(Boolean)
                                .join(', ')}
                        </p>
                      </div>
                    )}

                    {/* Controls: Assign Delivery Partner & Update Status */}
                    <div className="bg-white p-3.5 rounded-xl border border-gray-200 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Assign Delivery Partner */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Assign Delivery Person
                          </label>
                          <select
                            value={currentDraft.assignedTo}
                            onChange={(e) =>
                              setEditState((prev) => ({
                                ...prev,
                                [order._id]: {
                                  ...currentDraft,
                                  assignedTo: e.target.value,
                                },
                              }))
                            }
                            className="w-full text-xs p-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:border-[#0C831F]"
                          >
                            <option value="">Unassigned</option>
                            {deliveryPersonnel.map((person) => (
                              <option key={person._id} value={person._id}>
                                {person.name || 'Delivery Partner'} ({person.phone})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Status update dropdown */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Order Status
                          </label>
                          <select
                            value={currentDraft.status}
                            onChange={(e) =>
                              setEditState((prev) => ({
                                ...prev,
                                [order._id]: {
                                  ...currentDraft,
                                  status: e.target.value,
                                },
                              }))
                            }
                            className="w-full text-xs p-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:border-[#0C831F]"
                          >
                            {ALL_STATUSES.map((s) => (
                              <option key={s.value} value={s.value}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          disabled={savingId === order._id}
                          onClick={() => handleSaveOrder(order._id)}
                          className="flex items-center space-x-1.5 px-4 py-2 bg-[#0C831F] text-white text-xs font-bold rounded-xl hover:bg-green-700 transition disabled:opacity-50 active:scale-95 shadow-sm"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{savingId === order._id ? 'Saving...' : 'Save Changes'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}
