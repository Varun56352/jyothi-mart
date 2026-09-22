'use client';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';
import { Plus, Minus, Trash2, ArrowLeft, ShoppingBag, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function CartPage() {
  const { items, addItem, removeItem, cartTotal, cartSavings } = useCart();
  const deliveryFee = 15;
  const grandTotal = cartTotal + deliveryFee;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
        <div className="w-24 h-24 bg-green-50 text-[#0C831F] rounded-full flex items-center justify-center mb-4 border border-green-200">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-extrabold text-gray-900 mb-1">Your cart is empty</h2>
        <p className="text-gray-500 text-xs max-w-xs mb-6">
          Add fresh groceries & staples to your cart to enjoy 10-minute delivery.
        </p>
        <Link
          href="/"
          className="bg-[#0C831F] hover:bg-green-700 text-white font-bold py-3 px-8 rounded-xl text-sm shadow-sm transition"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-32">
      {/* Header */}
      <div className="bg-white px-4 py-3 font-bold text-base border-b border-gray-200 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-2">
          <Link href="/" className="p-1 -ml-1 text-gray-700 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="font-extrabold text-gray-900">My Cart ({items.length})</span>
        </div>
        <span className="text-xs text-[#0C831F] font-bold">10 min delivery</span>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Savings Alert Banner */}
        {cartSavings > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800 font-bold">
            <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>You are saving {formatPrice(cartSavings)} on this order!</span>
          </div>
        )}

        {/* Item Rows */}
        <div className="bg-white rounded-2xl shadow-2xs border border-gray-200 overflow-hidden divide-y divide-gray-100">
          {items.map((item) => {
            const numMrp = Number(item.mrp) || 0;
            const numPrice = Number(item.price) || 0;
            const hasDiscount = numMrp > 0 && numPrice > 0 && numMrp > numPrice;

            return (
              <div key={item.itemId} className="flex p-4 items-center gap-3">
                <div className="w-14 h-14 bg-gray-50 rounded-xl border border-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-contain p-1" />
                  ) : (
                    <ShoppingBag className="w-6 h-6 text-gray-300" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-gray-900 truncate">{item.name}</h4>
                  <div className="text-[11px] text-gray-500 mt-0.5">{item.unit}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-black text-sm text-gray-900">{formatPrice(numPrice)}</span>
                    {hasDiscount && (
                      <del className="text-xs text-gray-400 font-medium">{formatPrice(numMrp)}</del>
                    )}
                  </div>
                </div>

                <div className="flex items-center bg-[#0C831F] rounded-xl text-white text-xs font-bold h-8 shadow-2xs">
                  <button
                    onClick={() => removeItem(item.itemId)}
                    className="px-2.5 h-full flex items-center hover:bg-green-800 rounded-l-xl transition cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 font-extrabold text-xs">{item.qty}</span>
                  <button
                    onClick={() => addItem({ _id: item.productId || item.itemId, ...item })}
                    className="px-2.5 h-full flex items-center hover:bg-green-800 rounded-r-xl transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bill Details */}
        <div className="bg-white rounded-2xl shadow-2xs border border-gray-200 p-4 space-y-2.5">
          <h3 className="font-extrabold text-gray-900 text-xs uppercase tracking-wider mb-2">
            Bill Details
          </h3>
          <div className="flex justify-between text-xs text-gray-600">
            <span>Item Total</span>
            <span className="font-bold text-gray-900">{formatPrice(cartTotal)}</span>
          </div>
          {cartSavings > 0 && (
            <div className="flex justify-between text-xs text-emerald-700 font-semibold">
              <span>Total Product Savings</span>
              <span>- {formatPrice(cartSavings)}</span>
            </div>
          )}
          <div className="flex justify-between text-xs text-gray-600">
            <span>Delivery Charge</span>
            <span className="font-bold text-gray-900">{formatPrice(deliveryFee)}</span>
          </div>
          <div className="border-t border-gray-100 pt-3 flex justify-between font-black text-base text-gray-900">
            <span>To Pay (COD)</span>
            <span className="text-[#0C831F]">{formatPrice(grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Floating Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t border-gray-200 z-50 shadow-lg">
        <div className="max-w-2xl mx-auto">
          <Link href="/checkout">
            <button className="w-full bg-[#0C831F] hover:bg-green-700 text-white font-extrabold py-3.5 rounded-2xl shadow-md flex items-center justify-between px-6 transition cursor-pointer">
              <div className="flex flex-col text-left">
                <span className="text-xs text-green-100 font-semibold">Total Amount</span>
                <span className="text-base font-black leading-tight">{formatPrice(grandTotal)}</span>
              </div>
              <span className="text-sm font-bold flex items-center gap-1">
                <span>Proceed to Checkout</span>
                <span>&rarr;</span>
              </span>
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
