'use client';
import { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Phone,
  Clock,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  MapPin,
  UserCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Truck,
} from 'lucide-react';
import { getAdminOrders, updateAdminOrder, getDeliveryPersonnel } from '@/lib/api';
import { formatPrice, formatDate, getOrderStatusLabel } from '@/lib/utils';

const STATUS_PILLS = {
  placed: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  packing: 'bg-purple-50 text-purple-700 border-purple-200',
  out_for_delivery: 'bg-indigo-50 text-indigo-700 border-indigo-200',
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

export default function AdminOrdersManager() {
  // Tabs: 'live' | 'completed' | 'canceled'
  const [activeTab, setActiveTab] = useState('live');
  const [orders, setOrders] = useState([]);
  const [deliveryPersonnel, setDeliveryPersonnel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const fetchOrders = () => {
    setLoading(true);
    Promise.all([
      getAdminOrders({ limit: 100 }),
      getDeliveryPersonnel().catch(() => ({ data: [] })),
    ])
      .then(([ordersRes, personnelRes]) => {
        const oList = ordersRes.data?.data || ordersRes.data || [];
        setOrders(Array.isArray(oList) ? oList : []);

        const pList = personnelRes.data?.data || personnelRes.data || [];
        setDeliveryPersonnel(Array.isArray(pList) ? pList : []);
      })
      .catch((err) => {
        console.error('Failed to load orders:', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  // Filter orders according to tab
  const filteredOrders = useMemo(() => {
    if (activeTab === 'live') {
      return orders.filter((o) =>
        ['placed', 'confirmed', 'packing', 'out_for_delivery'].includes(o.status)
      );
    }
    if (activeTab === 'completed') {
      return orders.filter((o) => o.status === 'delivered');
    }
    if (activeTab === 'canceled') {
      return orders.filter((o) => o.status === 'cancelled');
    }
    return orders;
  }, [orders, activeTab]);

  const liveCount = orders.filter((o) =>
    ['placed', 'confirmed', 'packing', 'out_for_delivery'].includes(o.status)
  ).length;
  const completedCount = orders.filter((o) => o.status === 'delivered').length;
  const canceledCount = orders.filter((o) => o.status === 'cancelled').length;

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await updateAdminOrder(orderId, { status: newStatus });
      const updated = res.data?.data || res.data;
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o)));
      showToast(`Order status updated to ${newStatus}`);
    } catch (err) {
      console.error('Failed to update status:', err);
      showToast('Error updating order status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAssignDelivery = async (orderId, personnelId) => {
    setUpdatingId(orderId);
    try {
      const res = await updateAdminOrder(orderId, { assignedTo: personnelId || null });
      const assignedUser = deliveryPersonnel.find((p) => p._id === personnelId);
      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId ? { ...o, assignedTo: assignedUser || null } : o
        )
      );
      showToast(personnelId ? 'Delivery partner assigned' : 'Delivery assignment removed');
    } catch (err) {
      console.error('Failed to assign delivery:', err);
      showToast('Error assigning delivery partner');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg transition">
          {toastMessage}
        </div>
      )}

      {/* Header and 3 Tabs */}
      <div className="p-4 border-b border-gray-100 bg-white">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Manage Orders
            </h2>
            <p className="text-xs text-gray-500">
              Track live incoming orders, dispatches, and completions
            </p>
          </div>
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="p-1.5 text-gray-500 hover:text-[#0C831F] hover:bg-green-50 rounded-lg transition"
            title="Refresh orders"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* 3 Main Tabs: Live Orders, Completed, Canceled */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('live')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'live'
                ? 'bg-[#0C831F] text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Live Orders</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                activeTab === 'live' ? 'bg-white/30 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {liveCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'completed'
                ? 'bg-green-700 text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completed</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                activeTab === 'completed' ? 'bg-white/30 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {completedCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('canceled')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'canceled'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Canceled</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                activeTab === 'canceled' ? 'bg-white/30 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {canceledCount}
            </span>
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-gray-200">
            <Package className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="text-sm font-bold text-gray-700">No {activeTab} orders</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {activeTab === 'live'
                ? 'New customer orders will appear here automatically.'
                : `No orders in ${activeTab} state.`}
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isExpanded = expandedId === order._id;
            const pillStyle = STATUS_PILLS[order.status] || 'bg-gray-50 text-gray-700 border-gray-200';
            const itemsCount = (order.items || []).reduce((acc, i) => acc + (i.qty || 1), 0);

            return (
              <div
                key={order._id}
                className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden transition"
              >
                {/* Order Summary Row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : order._id)}
                  className="p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-gray-50/60 transition"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-extrabold text-sm text-gray-900">
                        {order.orderNumber || `#${order._id.slice(-6)}`}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${pillStyle}`}>
                        {getOrderStatusLabel(order.status)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{formatDate(order.createdAt)}</span>
                      <span>•</span>
                      <span>{itemsCount} items</span>
                      <span>•</span>
                      <span className="font-bold text-gray-900">{formatPrice(order.grandTotal)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {order.customerPhone && (
                      <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-lg hidden sm:inline">
                        📞 {order.customerPhone}
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Order Details */}
                {isExpanded && (
                  <div className="p-4 border-t border-gray-100 bg-gray-50/60 space-y-4 text-xs">
                    {/* Customer & Address */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-gray-200">
                      <div>
                        <span className="font-bold text-gray-700 block mb-0.5">Customer Contact:</span>
                        <p className="text-gray-900 font-semibold">{order.customer?.name || 'Customer'}</p>
                        <p className="text-gray-600">📞 {order.customerPhone || order.customer?.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="font-bold text-gray-700 block mb-0.5">Delivery Address:</span>
                        <p className="text-gray-700 leading-relaxed">
                          {order.deliveryAddress?.fullAddress || 'No address provided'}
                        </p>
                      </div>
                    </div>

                    {/* Items List */}
                    <div className="bg-white p-3 rounded-xl border border-gray-200">
                      <span className="font-bold text-gray-700 block mb-2">Order Items:</span>
                      <div className="space-y-1.5 divide-y divide-gray-100">
                        {(order.items || []).map((item, idx) => (
                          <div key={idx} className="pt-1.5 flex items-center justify-between text-xs">
                            <span className="font-medium text-gray-800">
                              {item.name} <span className="text-gray-400">x{item.qty}</span>
                            </span>
                            <span className="font-bold text-gray-900">{formatPrice(item.total || item.price * item.qty)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-2 border-t border-gray-200 flex justify-between font-bold text-sm">
                        <span>Grand Total (COD):</span>
                        <span className="text-[#0C831F]">{formatPrice(order.grandTotal)}</span>
                      </div>
                    </div>

                    {/* Actions: Status Dropdown & Assign Delivery Partner */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1 uppercase tracking-wider">
                          Update Order Status:
                        </label>
                        <select
                          value={order.status}
                          disabled={updatingId === order._id}
                          onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                          className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#0C831F]"
                        >
                          {ALL_STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1 uppercase tracking-wider">
                          Assign Delivery Partner:
                        </label>
                        <select
                          value={order.assignedTo?._id || order.assignedTo || ''}
                          disabled={updatingId === order._id}
                          onChange={(e) => handleAssignDelivery(order._id, e.target.value)}
                          className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#0C831F]"
                        >
                          <option value="">Unassigned</option>
                          {deliveryPersonnel.map((dp) => (
                            <option key={dp._id} value={dp._id}>
                              {dp.name || dp.phone} ({dp.phone})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
