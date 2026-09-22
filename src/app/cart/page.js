'use client';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';
import { Plus, Minus, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function CartPage() {
  const { items, addItem, removeItem, cartTotal } = useCart();
  const deliveryFee = 15;
  const grandTotal = cartTotal + deliveryFee;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
        <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <Trash2 className="w-12 h-12 text-gray-300" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 text-sm mb-8">Add items to start your cart</p>
        <Link href="/" className="bg-[#0C831F] text-white font-bold py-3 px-8 rounded-xl w-full max-w-xs text-center">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-32">
      <div className="bg-white p-4 font-bold text-lg border-b">My Cart</div>
      
      <div className="p-4 space-y-4">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {items.map(item => (
            <div key={item.itemId} className="flex p-4 border-b last:border-b-0 items-center">
              <div className="w-16 h-16 bg-gray-100 rounded-lg mr-4 flex-shrink-0">
                 {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-contain" />}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-800 line-clamp-1">{item.name}</h4>
                <div className="text-xs text-gray-500 mt-1">{item.unit}</div>
                <div className="font-bold text-sm mt-2">{formatPrice(item.price)}</div>
              </div>
              <div className="flex flex-col items-end justify-center ml-2">
                <div className="flex items-center bg-[#0C831F] rounded-lg text-white text-sm font-bold h-8">
                  <button onClick={() => removeItem(item.itemId)} className="px-3 h-full flex items-center"><Minus className="w-4 h-4" /></button>
                  <span className="px-2">{item.qty}</span>
                  <button onClick={() => addItem(item)} className="px-3 h-full flex items-center"><Plus className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
          <h3 className="font-bold text-gray-800 mb-2">Bill Details</h3>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Item Total</span>
            <span>{formatPrice(cartTotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Delivery Fee</span>
            <span>{formatPrice(deliveryFee)}</span>
          </div>
          <div className="border-t pt-3 flex justify-between font-bold text-gray-800">
            <span>Grand Total</span>
            <span>{formatPrice(grandTotal)}</span>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t z-50">
        <Link href="/checkout">
          <button className="w-full bg-[#0C831F] text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-between px-6">
            <span className="text-sm">{formatPrice(grandTotal)}</span>
            <span>Proceed to Checkout &rarr;</span>
          </button>
        </Link>
      </div>
    </div>
  );
}
