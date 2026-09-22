'use client';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';
import { Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ItemCard({ item, className }) {
  const { items, addItem, removeItem } = useCart();
  const cartItem = items.find(i => i.itemId === item._id);
  const qty = cartItem ? cartItem.qty : 0;
  const isOutOfStock = item.stock <= 0;

  return (
    <div className={cn("bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col h-full relative p-3", className ? className : "w-40 min-w-[160px] max-w-[160px]")}>
      <div className="w-full h-28 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
        {item.images?.[0] ? (
          <img src={item.images[0]} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" />
        ) : (
          <span className="text-gray-400 text-xs text-center px-2">{item.name?.charAt(0)}</span>
        )}
      </div>
      <div className="flex-1 flex flex-col">
        <h3 className="text-xs font-semibold text-gray-800 line-clamp-2 leading-tight min-h-[32px]">{item.name}</h3>
        <span className="text-[10px] text-gray-500 mt-1">{item.unitType || '1 unit'}</span>
        
        <div className="mt-auto pt-3 flex items-center justify-between">
          <span className="font-bold text-sm text-gray-900">{formatPrice(item.retailPrice)}</span>
          
          {qty === 0 ? (
            <button 
              onClick={() => !isOutOfStock && addItem(item)}
              disabled={isOutOfStock}
              className={cn("text-xs font-bold px-4 py-1.5 rounded-lg border", 
                isOutOfStock ? "bg-gray-100 text-gray-400 border-gray-200" : "bg-green-50 text-[#0C831F] border-[#0C831F]")}
            >
              {isOutOfStock ? 'OUT' : 'ADD'}
            </button>
          ) : (
            <div className="flex items-center bg-[#0C831F] rounded-lg text-white text-xs font-bold h-7">
              <button onClick={() => removeItem(item._id)} className="px-2 h-full flex items-center"><Minus className="w-3 h-3" /></button>
              <span className="px-1">{qty}</span>
              <button onClick={() => addItem(item)} className="px-2 h-full flex items-center"><Plus className="w-3 h-3" /></button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
