'use client';
import { X, Plus, Minus, Check, Package, Sparkles } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';

export default function VariantSelectModal({ item, isOpen, onClose }) {
  const { addItem, removeItem, getItemQty } = useCart();

  if (!isOpen || !item) return null;

  const variants = Array.isArray(item.variants) && item.variants.length > 0 ? item.variants : [];
  const displayName = item.displayName || item.name;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 bg-white rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
              {item.images?.[0] ? (
                <img
                  src={item.images[0]}
                  alt={displayName}
                  className="w-full h-full object-contain mix-blend-multiply p-1"
                />
              ) : (
                <Package className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold text-gray-900 truncate">{displayName}</h3>
              <p className="text-[11px] text-gray-500 font-medium">Select pack size / quantity</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Variant Options List */}
        <div className="p-4 overflow-y-auto space-y-3 divide-y divide-gray-100">
          {variants.map((v, idx) => {
            const vId = v.variantId || v.label;
            const uniqueCartId = `${item._id}_${vId}`;
            const qty = getItemQty(item._id, vId);

            const vPrice = Number(v.price) || 0;
            const vMrp = Number(v.mrp) || 0;
            const hasDiscount = vMrp > 0 && vPrice > 0 && vMrp > vPrice;
            const discountPercent = hasDiscount ? Math.round(((vMrp - vPrice) / vMrp) * 100) : 0;
            const savings = hasDiscount ? vMrp - vPrice : 0;

            return (
              <div
                key={vId || idx}
                className="pt-3 first:pt-0 flex items-center justify-between gap-3"
              >
                {/* Pack Details */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-gray-900">{v.label}</span>
                    {hasDiscount && (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold px-1.5 py-0.2 rounded">
                        {discountPercent}% OFF
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-black text-gray-900">{formatPrice(vPrice)}</span>
                    {hasDiscount && (
                      <del className="text-xs text-gray-400 font-medium">{formatPrice(vMrp)}</del>
                    )}
                  </div>

                  {savings > 0 && (
                    <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                      Save {formatPrice(savings)} per pack
                    </span>
                  )}
                </div>

                {/* ADD / Counter Button (Exact Blinkit Style) */}
                <div>
                  {qty === 0 ? (
                    <button
                      type="button"
                      onClick={() => addItem(item, v)}
                      className="bg-green-50 hover:bg-green-100 text-[#0C831F] border border-[#0C831F] font-extrabold text-xs px-5 py-2 rounded-xl shadow-2xs transition active:scale-95 cursor-pointer"
                    >
                      ADD
                    </button>
                  ) : (
                    <div className="flex items-center bg-[#0C831F] text-white rounded-xl font-bold text-xs h-8 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => removeItem(uniqueCartId)}
                        className="px-2.5 h-full flex items-center hover:bg-green-800 rounded-l-xl transition cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2 font-extrabold text-sm min-w-[20px] text-center">{qty}</span>
                      <button
                        type="button"
                        onClick={() => addItem(item, v)}
                        className="px-2.5 h-full flex items-center hover:bg-green-800 rounded-r-xl transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-500 font-medium">
            You can select multiple pack sizes
          </span>
          <button
            type="button"
            onClick={onClose}
            className="bg-[#0C831F] text-white text-xs font-bold px-5 py-2 rounded-xl shadow-xs transition hover:bg-green-700 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
