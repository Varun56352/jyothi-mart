'use client';
import ItemCard from '@/components/home/ItemCard';
import { SkeletonCard } from '@/components/common/Skeleton';
import { PackageOpen } from 'lucide-react';

export default function ProductGrid({ items = [], loading = false }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {Array.from({ length: 8 }).map((_, index) => (
          <SkeletonCard key={index} className="h-64 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
          <PackageOpen className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-600 font-medium">No products found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {items.map((item) => (
        <ItemCard key={item._id || item.id} item={item} className="w-full min-w-0 max-w-none" />
      ))}
    </div>
  );
}
