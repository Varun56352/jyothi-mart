'use client';
import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';
import { Plus, Minus, ChevronDown, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import VariantSelectModal from '@/components/home/VariantSelectModal';

export default function ItemCard({ item, className }) {
  const { items, addItem, removeItem, getItemQty } = useCart();
  const [variantModalOpen, setVariantModalOpen] = useState(false);

  const hasVariants = Array.isArray(item.variants) && item.variants.length > 0;
  const isOutOfStock = item.stock !== null && item.stock !== undefined && item.stock <= 0;

  const displayName = item.displayName || item.name;
  const numMrp = Number(item.mrp) || 0;
  const numPrice = Number(item.retailPrice) || 0;
  const hasDiscount = numMrp > 0 && numPrice > 0 && numMrp > numPrice;
  const discountPercent = hasDiscount ? Math.round(((numMrp - numPrice) / numMrp) * 100) : 0;

  // Options count for Blinkit-style button (single base unit + variant pack sizes)
  const hasSingleVariant = item.variants?.some((v) => Number(v.qty) === 1);
  const optionsCount = hasSingleVariant
    ? (item.variants?.length || 0)
    : (item.variants?.length || 0) + 1;

  // Format unit / pack size display below title (e.g. "85 g", "15 kg/tin", "1 ltr/pkt")
  const unitDisplay = (() => {
    if (item.displayUnit) return item.displayUnit;
    if (item.baseUnit) {
      const suffix =
        item.unitType && item.unitType.toLowerCase() !== item.baseUnit.toLowerCase()
          ? `/${item.unitType}`
          : '';
      return `${item.baseQty || 1} ${item.baseUnit}${suffix}`;
    }
    // Fallback: check if original item name has measurement e.g. "15kg", "85 g", "1ltr", "750gm"
    const nameToScan = item.displayName || item.originalName || item.name || '';
    const match = nameToScan.match(/(\d+(?:\.\d+)?)\s*(ltr|l|kg|gm|g|ml|pcs|pkt|tin|can|bottle|box)/i);
    if (match) {
      let u = match[2].toLowerCase();
      if (u === 'l') u = 'ltr';
      if (u === 'g') u = 'g';
      const suffix = item.unitType && item.unitType.toLowerCase() !== u ? `/${item.unitType}` : '';
      return `${match[1]} ${u}${suffix}`;
    }
    return item.unitType || '1 unit';
  })();

  // If item has variants, total quantity across all variants of this product
  const totalQty = getItemQty(item._id);

  const handleAddClick = () => {
    if (isOutOfStock) return;
    if (hasVariants) {
      setVariantModalOpen(true);
    } else {
      addItem(item);
    }
  };

  return (
    <>
      <div
        className={cn(
          'bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs hover:shadow-md transition flex flex-col h-full relative p-3 group',
          className ? className : 'w-40 min-w-[160px] max-w-[160px]'
        )}
      >
        {/* Discount Badge on Corner */}
        {hasDiscount && (
          <span className="absolute top-2 left-2 z-10 bg-[#0C831F] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-2xs">
            {discountPercent}% OFF
          </span>
        )}

        {/* Product Image */}
        <div
          onClick={hasVariants ? () => setVariantModalOpen(true) : undefined}
          className={cn(
            'w-full h-28 bg-gray-50 rounded-xl flex items-center justify-center mb-2.5 overflow-hidden border border-gray-100',
            hasVariants ? 'cursor-pointer' : ''
          )}
        >
          {item.images?.[0] ? (
            <img
              src={item.images[0]}
              alt={displayName}
              className="w-full h-full object-contain mix-blend-multiply p-1 group-hover:scale-105 transition duration-200"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50">
              <Package className="w-8 h-8 text-gray-300 mb-1" />
              <span className="text-[10px] text-gray-400 font-semibold px-2 text-center line-clamp-1">
                {displayName}
              </span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 flex flex-col">
          <h3
            onClick={hasVariants ? () => setVariantModalOpen(true) : undefined}
            className={cn(
              'text-xs font-bold text-gray-900 line-clamp-2 leading-tight min-h-[32px]',
              hasVariants ? 'cursor-pointer hover:text-[#0C831F]' : ''
            )}
            title={displayName}
          >
            {displayName}
          </h3>

          {/* Unit / Pack Size: Always display size (e.g. 85 g, 15 kg/tin) */}
          <div className="mt-1">
            <span className="text-[11px] text-gray-500 font-medium line-clamp-1">
              {unitDisplay}
            </span>
          </div>

          {/* Pricing & Add Button Row */}
          <div className="mt-auto pt-3 flex items-center justify-between gap-1">
            <div className="flex flex-col">
              <span className="font-black text-sm text-gray-900 leading-tight">
                {formatPrice(numPrice)}
              </span>
              {hasDiscount && (
                <del className="text-[10px] text-gray-400 font-semibold leading-tight">
                  {formatPrice(numMrp)}
                </del>
              )}
            </div>

            {/* If Item Has Variants: Blinkit Style Dual ADD Button */}
            {hasVariants ? (
              <button
                type="button"
                onClick={handleAddClick}
                disabled={isOutOfStock}
                className={cn(
                  'min-w-[68px] sm:min-w-[74px] rounded-xl border transition shadow-2xs active:scale-95 cursor-pointer overflow-hidden flex flex-col items-center justify-center p-0',
                  totalQty > 0
                    ? 'bg-[#0C831F] border-[#0C831F] text-white'
                    : isOutOfStock
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'bg-white border-[#0C831F] text-[#0C831F] hover:bg-green-50/50'
                )}
              >
                <span className="font-black text-xs py-1 px-3">
                  {isOutOfStock ? 'OUT' : totalQty > 0 ? `${totalQty} in cart` : 'ADD'}
                </span>
                <span
                  className={cn(
                    'w-full text-center font-bold text-[9px] py-0.5 px-1 leading-tight tracking-tight border-t',
                    totalQty > 0
                      ? 'bg-green-800 text-white border-green-700'
                      : 'bg-emerald-50 text-[#0C831F] border-emerald-100'
                  )}
                >
                  {optionsCount} options
                </span>
              </button>
            ) : (
              /* Single Variant: Standard Counter */
              totalQty === 0 ? (
                <button
                  type="button"
                  onClick={handleAddClick}
                  disabled={isOutOfStock}
                  className={cn(
                    'text-xs font-extrabold px-4 py-1.5 rounded-xl border transition shadow-2xs active:scale-95 cursor-pointer',
                    isOutOfStock
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                      : 'bg-green-50 text-[#0C831F] border-[#0C831F] hover:bg-green-100'
                  )}
                >
                  {isOutOfStock ? 'OUT' : 'ADD'}
                </button>
              ) : (
                <div className="flex items-center bg-[#0C831F] rounded-xl text-white text-xs font-bold h-7 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => removeItem(item._id)}
                    className="px-2 h-full flex items-center hover:bg-green-800 rounded-l-xl transition cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="px-1.5 font-extrabold text-xs">{totalQty}</span>
                  <button
                    type="button"
                    onClick={() => addItem(item)}
                    className="px-2 h-full flex items-center hover:bg-green-800 rounded-r-xl transition cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Blinkit-Style Pack Selection Modal */}
      {hasVariants && (
        <VariantSelectModal
          item={item}
          isOpen={variantModalOpen}
          onClose={() => setVariantModalOpen(false)}
        />
      )}
    </>
  );
}
