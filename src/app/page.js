'use client';
import { useEffect, useState } from 'react';
import ProductGrid from '@/components/home/ProductGrid';
import { getCatalog, getCategories } from '@/lib/api';
import { Sparkles, ShoppingBag } from 'lucide-react';

export default function Home() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [catRes, prodRes] = await Promise.all([
          getCategories().catch(() => ({ data: [] })),
          getCatalog(selectedCategory === 'all' ? {} : { category: selectedCategory }),
        ]);

        const rawCats = catRes.data?.data || catRes.data || [];
        setCategories(Array.isArray(rawCats) ? rawCats : []);

        const rawItems = prodRes.data?.data || prodRes.data?.items || prodRes.data || [];
        setItems(Array.isArray(rawItems) ? rawItems : []);
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
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-[#0C831F] via-[#10A328] to-[#0C831F] text-white px-4 py-6 md:px-8 md:py-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-xs text-xs font-semibold px-2.5 py-1 rounded-full mb-2">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>Instant Quick Delivery</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Jyothi Mart Quick Commerce
            </h1>
            <p className="text-sm md:text-base text-green-100 mt-1">
              Fresh groceries & staples delivered straight from our store in minutes.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3 bg-white/10 backdrop-blur-xs border border-white/20 p-4 rounded-2xl">
            <ShoppingBag className="w-8 h-8 text-yellow-300" />
            <div>
              <div className="text-xs text-green-100">Live Inventory</div>
              <div className="text-lg font-bold">{items.length} Products Online</div>
            </div>
          </div>
        </div>
      </div>

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
