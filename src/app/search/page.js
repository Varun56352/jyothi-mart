'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, X } from 'lucide-react';
import ProductGrid from '@/components/home/ProductGrid';
import { getCatalog } from '@/lib/api';

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setItems([]);
      setSearched(false);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setSearched(true);
      try {
        const res = await getCatalog({ search: query.trim() });
        const list = res.data?.data || res.data?.items || (Array.isArray(res.data) ? res.data : []);
        setItems(list);
      } catch (err) {
        console.error('Search error:', err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Search Header Bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition text-gray-700 cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search atta, rice, oil, biscuits, spices..."
              className="w-full bg-gray-100 pl-10 pr-9 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0C831F] focus:bg-white transition border border-transparent focus:border-[#0C831F]"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-5">
        {!searched ? (
          <div className="text-center py-16 text-gray-500">
            <Search className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <h3 className="font-semibold text-gray-700 mb-1">Search Jyothi Mart</h3>
            <p className="text-xs text-gray-400">Find any item from 120+ groceries and staples</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Search Results for "{query}"
              </span>
              <span className="text-xs text-[#0C831F] font-bold">
                {items.length} {items.length === 1 ? 'result' : 'results'}
              </span>
            </div>
            <ProductGrid items={items} loading={loading} />
          </div>
        )}
      </div>
    </div>
  );
}
