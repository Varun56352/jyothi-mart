'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, PackageOpen } from 'lucide-react';
import { getCatalog } from '@/lib/api';
import ItemCard from '@/components/home/ItemCard';
import { SkeletonCard } from '@/components/common/Skeleton';

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params?.id;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState('');

  useEffect(() => {
    if (!categoryId) return;

    getCatalog({ category: categoryId })
      .then((res) => {
        const fetchedItems = res.data?.data || res.data?.items || (Array.isArray(res.data) ? res.data : []);
        setItems(fetchedItems);

        // Derive category title from first matching item or decoded param
        if (fetchedItems.length > 0 && fetchedItems[0].group) {
          setCategoryName(fetchedItems[0].group);
        } else {
          setCategoryName(decodeURIComponent(categoryId).replace(/[-_]/g, ' '));
        }
      })
      .catch((err) => {
        console.error('Error loading category catalog:', err);
        // Fallback placeholder data for offline preview
        setCategoryName(decodeURIComponent(categoryId).replace(/[-_]/g, ' '));
        setItems([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [categoryId]);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center space-x-3 shadow-sm">
        <button
          onClick={() => router.back()}
          aria-label="Go Back"
          className="p-1.5 -ml-1.5 rounded-full hover:bg-gray-100 transition text-gray-700 active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-gray-900 capitalize truncate">
            {categoryName || 'Category'}
          </h1>
          {!loading && (
            <p className="text-xs text-gray-500">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </p>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="p-4 max-w-7xl mx-auto">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, idx) => (
              <SkeletonCard key={idx} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
              <PackageOpen className="w-10 h-10" />
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-1">No items in this category</h2>
            <p className="text-sm text-gray-500 max-w-xs mb-6">
              We couldn&apos;t find any products in this section right now.
            </p>
            <button
              onClick={() => router.push('/')}
              className="bg-[#0C831F] text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-green-700 transition active:scale-95"
            >
              Browse All Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {items.map((item) => (
              <ItemCard key={item._id || item.id} item={item} className="w-full min-w-0 max-w-none" />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
