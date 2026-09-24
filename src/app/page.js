'use client';
import { useEffect, useState } from 'react';
import ProductGrid from '@/components/home/ProductGrid';
import HeroBannerCarousel, { DEFAULT_HERO_BANNERS } from '@/components/home/HeroBannerCarousel';
import { getCatalog, getCategories, getStoreInfo } from '@/lib/api';

export default function Home() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [heroBanners, setHeroBanners] = useState(DEFAULT_HERO_BANNERS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [catRes, prodRes, infoRes] = await Promise.all([
          getCategories().catch(() => ({ data: [] })),
          getCatalog(selectedCategory === 'all' ? {} : { category: selectedCategory }),
          getStoreInfo().catch(() => ({ data: {} })),
        ]);

        const rawCats = catRes.data?.data || catRes.data || [];
        setCategories(Array.isArray(rawCats) ? rawCats : []);

        const rawItems = prodRes.data?.data || prodRes.data?.items || prodRes.data || [];
        setItems(Array.isArray(rawItems) ? rawItems : []);

        // Load dynamic hero banners configured in Store Settings
        const storeData = infoRes.data?.data || infoRes.data || {};
        const banners = storeData.heroBanners || prodRes.data?.heroBanners;
        if (Array.isArray(banners) && banners.length > 0) {
          setHeroBanners(banners);
        }
      } catch (err) {
        console.error('Failed to load catalog:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedCategory]);

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Dynamic Cover Carousel (Zepto, Amazon, Prime Video, Netflix style) */}
      <HeroBannerCarousel banners={heroBanners} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-5">
        {/* Category Pills Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">
              Browse Categories
            </h2>
            <span className="text-xs font-medium text-[#0C831F]">
              {items.length} {items.length === 1 ? 'item' : 'items'} available
            </span>
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-xs md:text-sm font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-[#0C831F] text-white shadow-sm'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
              }`}
            >
              All Items
            </button>
            {categories.map((cat) => {
              const isActive = selectedCategory === cat._id || selectedCategory === cat.name;
              return (
                <button
                  key={cat._id}
                  onClick={() => setSelectedCategory(cat._id)}
                  className={`px-4 py-2 rounded-full text-xs md:text-sm font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#0C831F] text-white shadow-sm'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span>{cat.name}</span>
                  {cat.itemCount !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        isActive ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {cat.itemCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Grid */}
        <div className="mb-8">
          <ProductGrid items={items} loading={loading} />
        </div>
      </div>
    </div>
  );
}
