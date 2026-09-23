'use client';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

export default function CartBar() {
  const pathname = usePathname();
  const { cartCount, cartTotal } = useCart();

  if (pathname.startsWith('/admin') || pathname.startsWith('/delivery')) {
    return null;
  }

  return (
    <AnimatePresence>
      {cartCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-[72px] lg:bottom-6 left-0 right-0 z-40 mx-4"
        >
          <Link href="/cart">
            <div className="bg-[#0C831F] rounded-lg shadow-lg flex items-center justify-between px-4 py-3 cursor-pointer text-white">
              <div className="flex flex-col">
                <span className="text-sm font-semibold">{cartCount} {cartCount > 1 ? 'items' : 'item'}</span>
                <span className="text-xs opacity-90">{formatPrice(cartTotal)}</span>
              </div>
              <div className="flex items-center space-x-1 font-semibold text-sm">
                <span>View Cart</span>
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
