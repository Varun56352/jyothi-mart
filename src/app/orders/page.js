'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, ChevronRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getMyOrders } from '@/lib/api';
import { formatPrice, formatDate, getOrderStatusLabel } from '@/lib/utils';
import { SkeletonText } from '@/components/common/Skeleton';

const STATUS_STYLES = {
  placed: {
    badge: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    dot: 'bg-yellow-500',
  },
  confirmed: {
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
  },
  packing: {
    badge: 'bg-orange-50 text-orange-700 border-orange-200',
    dot: 'bg-orange-500',
  },
  out_for_delivery: {
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    dot: 'bg-purple-500',
  },
  delivered: {
    badge: 'bg-green-50 text-green-700 border-green-200',
    dot: 'bg-green-500',
  },
  cancelled: {
    badge: 'bg-red-50 text-red-700 border-red-200',
    dot: 'bg-red-500',
  },
};

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?redirect=/orders');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    getMyOrders()
      .then((res) => {
        const data = res.data?.data || res.data || [];
        setOrders(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error('Failed to fetch orders:', err);
        setOrders([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user]);

  if (authLoading || (!user && !loading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0C831F]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Top App Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center space-x-3 shadow-sm">
        <button
          onClick={() => router.back()}
          aria-label="Back"
          className="p-1.5 -ml-1.5 rounded-full hover:bg-gray-100 transition text-gray-700 active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold text-gray-900">My Orders</h1>
      </header>

      {/* Content Area */}
      <main className="p-4 max-w-2xl mx-auto">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-gray-200 space-y-3 animate-pulse">
                <div className="flex justify-between items-center">
                  <SkeletonText width="w-32" height="h-5" />
                  <SkeletonText width="w-20" height="h-5" />
                </div>
                <SkeletonText width="w-24" height="h-3" />
                <div className="pt-2 border-t border-gray-100 flex justify-between">
                  <SkeletonText width="w-20" height="h-4" />
                  <SkeletonText width="w-16" height="h-4" />
                </div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
              <Package className="w-10 h-10" />
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-1">No orders yet</h2>
            <p className="text-sm text-gray-500 max-w-xs mb-6">
              You haven&apos;t placed any orders with us yet. Start adding items to your cart!
            </p>
            <Link
              href="/"
              className="bg-[#0C831F] text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-green-700 transition active:scale-95 inline-block"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const statusKey = order.status?.toLowerCase() || 'placed';
              const statusConfig = STATUS_STYLES[statusKey] || {
                badge: 'bg-gray-100 text-gray-700 border-gray-200',
                dot: 'bg-gray-400',
              };
              const orderId = order._id || order.id;
              const displayOrderNumber =
                order.orderNumber ||
                (typeof orderId === 'string' ? `#${orderId.slice(-6).toUpperCase()}` : `#${orderId}`);
              const itemCount = order.items?.reduce((sum, item) => sum + (item.qty || 1), 0) || order.items?.length || 0;

              return (
                <div
                  key={orderId}
                  onClick={() => router.push(`/orders/${orderId}`)}
                  className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm hover:border-[#0C831F]/40 hover:shadow-md transition cursor-pointer active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-gray-900 text-sm">{displayOrderNumber}</span>
                    <span
                      className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusConfig.badge}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                      <span>{getOrderStatusLabel(order.status)}</span>
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 mb-3">{formatDate(order.createdAt)}</p>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-500">
                        {itemCount} {itemCount === 1 ? 'item' : 'items'}
                      </span>
                      <span className="mx-1.5 text-gray-300">•</span>
                      <span className="text-sm font-bold text-gray-900">
                        {formatPrice(order.grandTotal || order.total || 0)}
                      </span>
                    </div>

                    <div className="flex items-center text-xs font-semibold text-[#0C831F]">
                      <span>View Details</span>
                      <ChevronRight className="w-4 h-4 ml-0.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
