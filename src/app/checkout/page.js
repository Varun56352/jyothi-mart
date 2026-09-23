'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, AlertTriangle, CheckCircle2, ShoppingBag, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useLocation } from '@/context/LocationContext';
import { placeOrder } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import LocationPickerModal from '@/components/common/LocationPickerModal';

export default function CheckoutPage() {
  const { user } = useAuth();
  const { cartItems, cartTotal, clearCart } = useCart();
  const { address, coords, isServiceable, distanceKm, deliveryTimeEstimate, storeInfo } = useLocation();
  const router = useRouter();

  const [flatNo, setFlatNo] = useState('');
  const [floor, setFloor] = useState('');
  const [landmark, setLandmark] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <ShoppingBag className="w-12 h-12 text-gray-300 mb-3" />
        <p className="text-sm text-gray-600 mb-3">Please login to proceed to checkout</p>
        <Link href="/login?redirect=/checkout" className="bg-[#0C831F] text-white px-6 py-2 rounded-xl text-sm font-bold">Log In</Link>
      </div>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <ShoppingBag className="w-12 h-12 text-gray-300 mb-3" />
        <p className="text-sm text-gray-600 mb-3">Your cart is empty</p>
        <Link href="/" className="bg-[#0C831F] text-white px-6 py-2 rounded-xl text-sm font-bold">Shop Now</Link>
      </div>
    );
  }

  const deliveryFee = storeInfo?.deliveryFee || 0;
  const grandTotal = (cartTotal || 0) + deliveryFee;

  const handlePlaceOrder = async () => {
    if (!isServiceable) {
      setError('Your location is outside our delivery area. Please change your address.');
      return;
    }
    if (!coords?.lat) {
      setError('Please select a delivery location first.');
      return;
    }

    setPlacing(true);
    setError('');

    const fullAddress = [flatNo, floor ? `Floor: ${floor}` : '', landmark ? `Near ${landmark}` : '', address].filter(Boolean).join(', ');

    try {
      const orderData = {
        items: cartItems.map((item) => ({
          itemId: item._id || item.itemId,
          qty: item.qty || 1,
        })),
        deliveryAddress: {
          label: 'Home',
          fullAddress,
          lat: coords.lat,
          lng: coords.lng,
        },
        paymentMethod: 'cod',
        deliveryNotes: deliveryNotes.trim(),
      };

      const res = await placeOrder(orderData);
      const order = res.data?.data || res.data;
      clearCart();
      router.push(`/orders/${order?._id || order?.id || ''}`);
    } catch (err) {
      console.error('Order placement failed:', err);
      const msg = err.response?.data?.message || 'Failed to place order. Please try again.';
      setError(msg);
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3.5 shadow-sm">
        <div className="flex items-center space-x-3 max-w-2xl mx-auto">
          <Link href="/cart" className="p-1.5 -ml-1.5 rounded-full hover:bg-gray-100 transition text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-base font-bold text-gray-900">Checkout</h1>
            <p className="text-xs text-gray-500">{cartItems.length} items</p>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-2xl mx-auto space-y-4">
        {/* Delivery Address Card */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#0C831F]" />
              Delivery Address
            </h3>
            <button
              onClick={() => setLocationPickerOpen(true)}
              className="text-xs font-bold text-[#0C831F] hover:underline cursor-pointer"
            >
              Change
            </button>
          </div>

          {coords?.lat ? (
            <div className="text-xs text-gray-700 space-y-1">
              <p className="font-semibold">{address}</p>
              {distanceKm && (
                <p className="text-[11px] text-gray-500">{distanceKm} km from store{deliveryTimeEstimate ? ` · Est. ${deliveryTimeEstimate}` : ''}</p>
              )}
            </div>
          ) : (
            <button
              onClick={() => setLocationPickerOpen(true)}
              className="w-full py-3 bg-green-50 border-2 border-dashed border-[#0C831F] text-[#0C831F] rounded-xl text-xs font-bold cursor-pointer"
            >
              + Select Delivery Location
            </button>
          )}

          {!isServiceable && coords?.lat && (
            <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <p className="text-[11px] text-red-700">This location is outside our delivery area ({distanceKm} km away)</p>
            </div>
          )}

          {/* Address Detail Inputs */}
          <div className="space-y-2.5 pt-1">
            <input
              type="text" value={flatNo} onChange={(e) => setFlatNo(e.target.value)}
              placeholder="Flat / House No / Building Name"
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0C831F]"
            />
            <div className="grid grid-cols-2 gap-2.5">
              <input
                type="text" value={floor} onChange={(e) => setFloor(e.target.value)}
                placeholder="Floor (optional)"
                className="text-xs px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0C831F]"
              />
              <input
                type="text" value={landmark} onChange={(e) => setLandmark(e.target.value)}
                placeholder="Nearby Landmark"
                className="text-xs px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0C831F]"
              />
            </div>
            <input
              type="text" value={deliveryNotes} onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="Delivery instructions (optional)"
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0C831F]"
            />
          </div>
        </div>

        {/* Payment */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-2">Payment Method</h3>
          <label className="flex items-center space-x-2 text-xs text-gray-700">
            <input type="radio" checked readOnly className="accent-[#0C831F]" />
            <span className="font-semibold">Cash on Delivery (COD)</span>
          </label>
        </div>

        {/* Bill Summary */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm space-y-2.5">
          <h3 className="text-sm font-bold text-gray-900">Bill Summary</h3>
          <div className="flex justify-between text-xs text-gray-600">
            <span>Item total ({cartItems.length} items)</span>
            <span className="font-semibold">{formatPrice(cartTotal)}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>Delivery fee</span>
            <span className="font-semibold">{deliveryFee > 0 ? formatPrice(deliveryFee) : 'FREE'}</span>
          </div>
          <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-bold text-gray-900">
            <span>Grand Total</span>
            <span>{formatPrice(grandTotal)}</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        {/* Place Order Button */}
        <button
          onClick={handlePlaceOrder}
          disabled={placing || !isServiceable || !coords?.lat}
          className={`w-full py-3.5 rounded-2xl text-sm font-bold transition active:scale-[0.98] shadow-md ${
            !isServiceable || !coords?.lat
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-[#0C831F] text-white hover:bg-green-700 cursor-pointer'
          }`}
        >
          {placing ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Placing Order...
            </span>
          ) : !coords?.lat ? (
            'Select delivery location to continue'
          ) : !isServiceable ? (
            'Location not serviceable'
          ) : (
            `Place Order · ${formatPrice(grandTotal)}`
          )}
        </button>
      </main>

      <LocationPickerModal
        isOpen={locationPickerOpen}
        onClose={() => setLocationPickerOpen(false)}
      />
    </div>
  );
}
