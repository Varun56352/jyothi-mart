'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Package,
  MapPin,
  Phone,
  User,
  FileText,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { getOrderById } from '@/lib/api';
import { formatPrice, formatDate, getOrderStatusLabel } from '@/lib/utils';
import { SkeletonText } from '@/components/common/Skeleton';

const STATUS_STYLES = {
  placed: {
    badge: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    dot: 'bg-yellow-500',
    line: 'bg-yellow-200',
  },
  confirmed: {
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
    line: 'bg-blue-200',
  },
  packing: {
    badge: 'bg-orange-50 text-orange-700 border-orange-200',
    dot: 'bg-orange-500',
    line: 'bg-orange-200',
  },
  out_for_delivery: {
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    dot: 'bg-purple-500',
    line: 'bg-purple-200',
  },
  delivered: {
    badge: 'bg-green-50 text-green-700 border-green-200',
    dot: 'bg-green-500',
    line: 'bg-green-200',
  },
  cancelled: {
    badge: 'bg-red-50 text-red-700 border-red-200',
    dot: 'bg-red-500',
    line: 'bg-red-200',
  },
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId) return;

    setLoading(true);
    getOrderById(orderId)
      .then((res) => {
        const data = res.data?.data || res.data;
        if (data) {
          setOrder(data);
        } else {
          setError('Order not found');
        }
      })
      .catch((err) => {
        console.error('Failed to fetch order:', err);
        setError('Unable to load order details');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center space-x-3 shadow-sm">
          <button onClick={() => router.back()} className="p-1.5 -ml-1.5 rounded-full hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <SkeletonText width="w-32" height="h-5" />
        </header>
        <div className="p-4 max-w-2xl mx-auto space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-3">
            <SkeletonText width="w-48" height="h-6" />
            <SkeletonText width="w-32" height="h-4" />
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-3">
            <SkeletonText width="w-40" height="h-5" />
            <div className="space-y-2">
              <SkeletonText width="w-full" height="h-10" />
              <SkeletonText width="w-full" height="h-10" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-3">
          <Package className="w-8 h-8" />
        </div>
        <h1 className="text-lg font-bold text-gray-800 mb-1">Order Not Found</h1>
        <p className="text-sm text-gray-500 mb-6">{error || 'We could not find the specified order.'}</p>
        <button
          onClick={() => router.push('/orders')}
          className="bg-[#0C831F] text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-green-700 transition"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  const currentStatus = order.status?.toLowerCase() || 'placed';
  const statusConfig = STATUS_STYLES[currentStatus] || {
    badge: 'bg-gray-100 text-gray-700 border-gray-200',
    dot: 'bg-gray-400',
    line: 'bg-gray-200',
  };

  const displayOrderNumber =
    order.orderNumber ||
    (typeof order._id === 'string' ? `#${order._id.slice(-6).toUpperCase()}` : `#${order._id}`);

  // Build history timeline entries
  const timeline =
    Array.isArray(order.statusHistory) && order.statusHistory.length > 0
      ? order.statusHistory
      : [
          {
            status: order.status,
            timestamp: order.createdAt,
            note: 'Order successfully placed',
          },
        ];

  // Address string formatter
  const renderAddress = () => {
    if (!order.deliveryAddress) return 'No delivery address provided';
    if (typeof order.deliveryAddress === 'string') return order.deliveryAddress;
    const addr = order.deliveryAddress;
    const parts = [
      addr.fullAddress || addr.addressLine1 || addr.address,
      addr.landmark,
      addr.city,
      addr.pincode,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Address on file';
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center space-x-3 shadow-sm">
        <button
          onClick={() => router.back()}
          aria-label="Back"
          className="p-1.5 -ml-1.5 rounded-full hover:bg-gray-100 transition text-gray-700 active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-gray-900 truncate">Order Details</h1>
          <p className="text-xs text-gray-500">{displayOrderNumber}</p>
        </div>
      </header>

      <main className="p-4 max-w-2xl mx-auto space-y-4">
        {/* Order Status & Overview Card */}
        <section className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Order</span>
              <h2 className="text-lg font-bold text-gray-900">{displayOrderNumber}</h2>
            </div>
            <span
              className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig.badge}`}
            >
              <span className={`w-2 h-2 rounded-full ${statusConfig.dot}`} />
              <span>{getOrderStatusLabel(order.status)}</span>
            </span>
          </div>
          <div className="flex items-center text-xs text-gray-500 space-x-1.5 pt-1 border-t border-gray-100">
            <Clock className="w-4 h-4 text-gray-400" />
            <span>Placed on {formatDate(order.createdAt)}</span>
          </div>
        </section>

        {/* Status Timeline / Stepper */}
        <section className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[#0C831F]" />
            <span>Order Status Timeline</span>
          </h3>

          <div className="relative pl-6 space-y-6">
            {timeline.map((step, idx) => {
              const stepStatusKey = step.status?.toLowerCase() || 'placed';
              const stepStyle = STATUS_STYLES[stepStatusKey] || STATUS_STYLES.placed;
              const isLast = idx === timeline.length - 1;

              return (
                <div key={idx} className="relative">
                  {/* Vertical connecting line */}
                  {!isLast && (
                    <div
                      className={`absolute -left-[18px] top-3 w-0.5 h-full ${stepStyle.line}`}
                      aria-hidden="true"
                    />
                  )}

                  {/* Dot */}
                  <div
                    className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-white ring-2 ring-gray-100 ${stepStyle.dot}`}
                  />

                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-gray-900 capitalize">
                        {getOrderStatusLabel(step.status)}
                      </p>
                      {step.timestamp && (
                        <span className="text-[11px] text-gray-400">{formatDate(step.timestamp)}</span>
                      )}
                    </div>
                    {step.note && <p className="text-xs text-gray-600 mt-0.5">{step.note}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Items List Card */}
        <section className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center space-x-2">
            <Package className="w-4 h-4 text-[#0C831F]" />
            <span>Items in this Order ({order.items?.length || 0})</span>
          </h3>

          <div className="divide-y divide-gray-100">
            {order.items?.map((item, idx) => {
              const itemTotal = item.total ?? (item.price || 0) * (item.qty || 1);
              return (
                <div key={idx} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                  <div className="flex items-center space-x-3 min-w-0 pr-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" />
                      ) : (
                        <Package className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-800 line-clamp-1">{item.name}</p>
                      <p className="text-[11px] text-gray-500">
                        {formatPrice(item.price)} &times; {item.qty} {item.unit ? `(${item.unit})` : ''}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-gray-900 flex-shrink-0">
                    {formatPrice(itemTotal)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Bill Breakdown Card */}
        <section className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm space-y-2.5">
          <h3 className="text-sm font-bold text-gray-900 mb-2">Bill Summary</h3>

          <div className="flex justify-between text-xs text-gray-600">
            <span>Item Subtotal</span>
            <span>{formatPrice(order.subtotal || 0)}</span>
          </div>

          <div className="flex justify-between text-xs text-gray-600">
            <span>Delivery Fee</span>
            <span>{order.deliveryFee === 0 ? 'FREE' : formatPrice(order.deliveryFee || 0)}</span>
          </div>

          <div className="border-t border-gray-100 pt-2.5 flex justify-between text-sm font-bold text-gray-900">
            <span>Grand Total</span>
            <span className="text-[#0C831F]">{formatPrice(order.grandTotal || 0)}</span>
          </div>

          <div className="pt-2 flex items-center justify-between text-[11px] text-gray-500 border-t border-gray-50">
            <span>Payment Method</span>
            <span className="uppercase font-semibold text-gray-700">
              {order.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : order.paymentMethod || 'COD'}
            </span>
          </div>
        </section>

        {/* Delivery Address & Notes Card */}
        <section className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm space-y-3">
          <div className="flex items-start space-x-3">
            <MapPin className="w-5 h-5 text-[#0C831F] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide">Delivery Address</h4>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">{renderAddress()}</p>
            </div>
          </div>

          {order.deliveryNotes && (
            <div className="flex items-start space-x-3 pt-3 border-t border-gray-100">
              <FileText className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide">Delivery Notes</h4>
                <p className="text-xs text-gray-600 mt-1">{order.deliveryNotes}</p>
              </div>
            </div>
          )}
        </section>

        {/* Assigned Delivery Person (if any) */}
        {order.assignedTo && (
          <section className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Delivery Partner</h4>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-[#0C831F]">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">{order.assignedTo.name || 'Assigned Partner'}</p>
                  <p className="text-xs text-gray-500">{order.assignedTo.phone}</p>
                </div>
              </div>
              {order.assignedTo.phone && (
                <a
                  href={`tel:${order.assignedTo.phone}`}
                  className="flex items-center space-x-1.5 bg-green-50 text-[#0C831F] border border-green-200 px-3 py-1.5 rounded-xl text-xs font-bold active:scale-95 transition"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call</span>
                </a>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
