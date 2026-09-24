'use client';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Sparkles } from 'lucide-react';

export default function ShopByCategory({ categories = [], loading = false }) {
  if (loading) {
    return (
      <div className="my-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-44 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-4 w-16 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2.5 sm:gap-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="flex flex-col items-center space-y-2 animate-pulse">
              <div className="w-full aspect-square bg-gray-200 rounded-2xl" />
              <div className="w-16 h-3 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <section className="my-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3.5 sm:mb-5">
        <div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <span>Shop by Category</span>
          </h2>
          <p className="text-xs text-gray-500 hidden sm:block mt-0.5">
            Explore fresh groceries, daily essentials & household items
          </p>
        </div>
        <Link
          href="/category"
          className="text-xs sm:text-sm font-bold text-[#E53558] hover:text-[#C72041] flex items-center gap-0.5 transition group"
        >
          <span>See All</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Zepto-Style Category Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2.5 sm:gap-3.5 md:gap-4">
        {categories.map((cat) => {
          const catId = cat._id || cat.id || cat.slug;
          const hasImage = Boolean(cat.image);

          return (
            <Link
              key={catId}
              href={`/category/${catId}`}
              className="group flex flex-col items-center text-center cursor-pointer select-none"
            >
              {/* Card Container with Image */}
              <div className="w-full aspect-square bg-[#F4F6FB] group-hover:bg-[#EBF0FA] border border-gray-100 group-hover:border-purple-200 rounded-2xl sm:rounded-3xl p-2 sm:p-3 flex items-center justify-center relative overflow-hidden transition-all duration-300 shadow-2xs group-hover:shadow-md group-hover:-translate-y-1">
                {hasImage ? (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-contain group-hover:scale-108 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-emerald-50 text-[#0C831F] rounded-xl font-black text-xl sm:text-2xl group-hover:scale-108 transition-transform">
                    {cat.name?.charAt(0)?.toUpperCase() || 'C'}
                  </div>
                )}
              </div>

              {/* Category Name */}
              <span className="mt-2 text-[11px] sm:text-xs md:text-sm font-bold text-gray-800 group-hover:text-[#0C831F] line-clamp-2 leading-tight transition-colors">
                {cat.name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
