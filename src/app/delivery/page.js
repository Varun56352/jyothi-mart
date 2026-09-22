'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Truck,
  Navigation,
  CheckCircle,
  Phone,
  MapPin,
  Package,
  RefreshCw,
  Clock,
  ArrowLeft,
  Check,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getDeliveryOrders, updateDeliveryOrderStatus } from '@/lib/api';
import { formatPrice, formatDate, getOrderStatusLabel } from '@/lib/utils';
import { SkeletonText } from '@/components/common/Skeleton';

const STATUS_STYLES = {
  placed: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  packing: 'bg-orange-50 text-orange-700 border-orange-200',
  out_for_delivery: 'bg-purple-50 text-purple-700 border-purple-200',
  delivered: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
};

export default function DeliveryDashboardPage() {
  const { user, isDelivery, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'completed'
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Protect Delivery route (allow delivery or admin)
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/login?redirect=/delivery');
      } else if (!isDelivery && !isAdmin) {
        router.replace('/');
      }
    }
  }, [user, isDelivery, isAdmin, authLoading, router]);

  const fetchOrders = () => {
    setLoading(true);
    // Request all orders so we can partition between Active and Completed
    getDeliveryOrders({ all: 'true' })
      .then((res) => {
        const list = res.data?.data || res.data || [];
        setOrders(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        console.error('Failed to load delivery orders:', err);
        setOrders([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isDelivery || isAdmin) {
      fetchOrders();
    }
  }, [isDelivery, isAdmin]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await updateDeliveryOrderStatus(orderId, newStatus);
      const updated = res.data?.data || res.data;

      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, ...updated, status: newStatus } : o))
      );

      const statusLabels = {
        out_for_delivery: 'Order picked up & out for delivery!',
        delivered: 'Order marked as delivered!',
      };
      showToast(statusLabels[newStatus] || 'Order updated');
    } catch (err) {
      console.error('Failed to update delivery status:', err);
      showToast('Error updating status. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  const formatAddress = (addr) => {
    if (!addr) return 'No address provided';
    if (typeof addr === 'string') return addr;
    const parts = [
      addr.fullAddress || addr.addressLine1 || addr.address,
      addr.landmark ? `Near ${addr.landmark}` : null,
      addr.city,
      addr.pincode,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Address on file';
  };

  const getNavigationUrl = (order) => {
    const addr = order.deliveryAddress;
    if (addr && addr.lat && addr.lng) {
      return `https://www.google.com/maps/dir/?api=1&destination=${addr.lat},${addr.lng}`;
    }
    const formatted = formatAddress(addr);
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(formatted)}`;
  };

  // Partition orders
  const activeOrders = orders.filter(
    (o) => o.status !== 'delivered' && o.status !== 'cancelled'
  );
  const completedOrders = orders.filter((o) => o.status === 'delivered');

  const displayedOrders = activeTab === 'active' ? activeOrders : completedOrders;

  if (authLoading || ((!isDelivery && !isAdmin) && !authLoading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0C831F]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Toast Alert */}
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
              href="/"
              className="p-1.5 -ml-1.5 rounded-full hover:bg-gray-100 transition text-gray-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-base font-bold text-gray-900">Delivery Dashboard</h1>
              <p className="text-xs text-gray-500">
                {activeOrders.length} active • {completedOrders.length} completed
              </p>
            </div>
          </div>
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="p-2 text-gray-600 hover:text-[#0C831F] hover:bg-green-50 rounded-xl transition disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-[57px] z-30">
        <div className="max-w-2xl mx-auto flex">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-3 text-center text-xs font-bold border-b-2 transition ${
              activeTab === 'active'
                ? 'border-[#0C831F] text-[#0C831F]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Active Deliveries ({activeOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 py-3 text-center text-xs font-bold border-b-2 transition ${
              activeTab === 'completed'
                ? 'border-[#0C831F] text-[#0C831F]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Completed ({completedOrders.length})
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="p-4 max-w-2xl mx-auto space-y-3.5">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-gray-200 space-y-3 animate-pulse">
                <div className="flex justify-between">
                  <SkeletonText width="w-28" height="h-5" />
                  <SkeletonText width="w-20" height="h-5" />
                </div>
                <SkeletonText width="w-full" height="h-4" />
                <SkeletonText width="w-3/4" height="h-4" />
              </div>
            ))}
          </div>
        ) : displayedOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-white rounded-2xl border border-gray-200">
            <Truck className="w-12 h-12 text-gray-300 mb-3" />
            <h3 className="text-base font-bold text-gray-800">
              {activeTab === 'active' ? 'No active orders' : 'No completed deliveries yet'}
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-xs">
              {activeTab === 'active'
                ? 'You do not have any pending orders assigned right now.'
                : 'Orders marked as delivered will appear in this history list.'}
            </p>
          </div>
        ) : (
          displayedOrders.map((order) => {
            const orderId = order._id || order.id;
            const statusKey = order.status?.toLowerCase() || 'placed';
            const badgeClass = STATUS_STYLES[statusKey] || 'bg-gray-100 text-gray-700 border-gray-200';
            const displayOrderNumber =
              order.orderNumber ||
              (typeof orderId === 'string' ? `#${orderId.slice(-6).toUpperCase()}` : `#${orderId}`);

            const customerPhone =
              order.customerPhone ||
              (typeof order.customer === 'object' ? order.customer?.phone : '') ||
              '';

            // Items summary
            const itemNames = (order.items || []).map((i) => `${i.qty || 1}x ${i.name}`);
            let itemsSummary = itemNames.slice(0, 2).join(', ');
            if (itemNames.length > 2) {
              itemsSummary += ` +${itemNames.length - 2} more`;
            }

            const formattedAddress = formatAddress(order.deliveryAddress);
            const isUpdating = updatingId === orderId;

            return (
              <div
                key={orderId}
                className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm space-y-3"
              >
                {/* Header: Order # + Status Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-gray-900">{displayOrderNumber}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs font-bold text-gray-800">
                      {formatPrice(order.grandTotal || 0)}
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeClass}`}
                  >
                    {getOrderStatusLabel(order.status)}
                  </span>
                </div>

                {/* Customer Phone */}
                <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-xs">
                  <div className="flex items-center space-x-1 text-gray-600">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span>Customer: {customerPhone || 'Not provided'}</span>
                  </div>
                  {customerPhone && (
                    <a
                      href={`tel:${customerPhone}`}
                      className="text-[#0C831F] font-bold hover:underline flex items-center space-x-1"
                    >
                      <span>Call Customer</span>
                    </a>
                  )}
                </div>

                {/* Address */}
                <div className="flex items-start space-x-2 text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  <MapPin className="w-4 h-4 text-[#0C831F] flex-shrink-0 mt-0.5" />
                  <p className="line-clamp-2 leading-relaxed">{formattedAddress}</p>
                </div>

                {/* Items Summary */}
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <Package className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{itemsSummary || 'No item details'}</span>
                </div>

                {/* Notes (if any) */}
                {order.deliveryNotes && (
                  <p className="text-[11px] text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                    <strong>Note:</strong> {order.deliveryNotes}
                  </p>
                )}

                {/* Action Buttons */}
                <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
                  {/* Navigate Button */}
                  <a
                    href={getNavigationUrl(order)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center space-x-1.5 bg-blue-50 text-blue-700 border border-blue-200 py-2.5 rounded-xl text-xs font-bold hover:bg-blue-100 transition active:scale-95"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Navigate</span>
                  </a>

                  {/* Pick Up Action (if confirmed or packing) */}
                  {(statusKey === 'confirmed' || statusKey === 'packing') && (
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleUpdateStatus(orderId, 'out_for_delivery')}
                      className="flex-1 flex items-center justify-center space-x-1.5 bg-purple-600 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-purple-700 transition disabled:opacity-50 active:scale-95 shadow-sm"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>{isUpdating ? 'Updating...' : 'Pick Up'}</span>
                    </button>
                  )}

                  {/* Mark Delivered Action (if out_for_delivery) */}
                  {statusKey === 'out_for_delivery' && (
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleUpdateStatus(orderId, 'delivered')}
                      className="flex-1 flex items-center justify-center space-x-1.5 bg-[#0C831F] text-white py-2.5 rounded-xl text-xs font-bold hover:bg-green-700 transition disabled:opacity-50 active:scale-95 shadow-sm"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{isUpdating ? 'Updating...' : 'Mark Delivered'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}
