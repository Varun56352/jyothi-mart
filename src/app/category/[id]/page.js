'use client';
import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ChevronRight, PackageOpen, Layers, Sparkles } from 'lucide-react';
import { getCatalog, getCategories, getSubcategories } from '@/lib/api';
import ItemCard from '@/components/home/ItemCard';
import { SkeletonCard } from '@/components/common/Skeleton';

export default function CategoryPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawId = params?.id ? decodeURIComponent(params.id) : '';

  const [currentCategory, setCurrentCategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState(searchParams.get('sub') || 'all');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);

  // 1. Load Category and Subcategories
  useEffect(() => {
    if (!rawId) return;

    async function loadCategoryInfo() {
      setLoading(true);
      try {
        const catRes = await getCategories();
        const catList = catRes.data?.data || catRes.data || [];

        // Match category by _id, slug, or name
        const matched = catList.find(
          (c) =>
            String(c._id) === rawId ||
            c.slug === rawId ||
            c.name?.toLowerCase() === rawId.toLowerCase()
        );

        if (matched) {
          setCurrentCategory(matched);
          const subs = Array.isArray(matched.subcategories) && matched.subcategories.length > 0
            ? matched.subcategories
            : [];
          
          if (subs.length > 0) {
            setSubcategories(subs);
          } else {
            // Fallback fetch subcategories from API
            const subRes = await getSubcategories(matched._id).catch(() => ({ data: [] }));
            setSubcategories(subRes.data?.data || subRes.data || []);
          }
        } else {
          // If not in list, construct fallback
          setCurrentCategory({
            _id: rawId,
            name: rawId.replace(/[-_]/g, ' '),
          });
        }
      } catch (err) {
        console.error('Failed to load category info:', err);
      } finally {
        setLoading(false);
      }
    }

    loadCategoryInfo();
  }, [rawId]);

  // 2. Fetch Catalog Items for this Category & Subcategory
  useEffect(() => {
    if (!currentCategory?._id) return;

    setItemsLoading(true);
    const queryParams = { category: currentCategory._id };
    if (selectedSubcategoryId && selectedSubcategoryId !== 'all') {
      queryParams.subcategory = selectedSubcategoryId;
    }

    getCatalog(queryParams)
      .then((res) => {
        const data = res.data?.data || res.data?.items || (Array.isArray(res.data) ? res.data : []);
        setItems(data);
      })
      .catch((err) => {
        console.error('Failed to fetch catalog items for category:', err);
        setItems([]);
      })
      .finally(() => {
        setItemsLoading(false);
      });
  }, [currentCategory, selectedSubcategoryId]);

  const activeSubcategory = useMemo(() => {
    if (selectedSubcategoryId === 'all') return null;
    return subcategories.find((s) => String(s._id) === String(selectedSubcategoryId));
  }, [selectedSubcategoryId, subcategories]);

  const categoryTitle = currentCategory?.name || 'Category';
  const currentSubTitle = activeSubcategory ? activeSubcategory.name : `All ${categoryTitle}`;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-24">
      {/* Top Header & Breadcrumbs (Zepto Style) */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {/* Back button & Breadcrumb */}
          <div className="flex items-center space-x-2 text-xs text-gray-500 min-w-0">
            <button
              onClick={() => router.push('/')}
              className="p-1 -ml-1 text-gray-700 hover:bg-gray-100 rounded-full transition cursor-pointer flex-shrink-0"
              aria-label="Back to home"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <Link href="/" className="hover:text-gray-900 transition flex-shrink-0 font-medium">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <Link href="/category" className="hover:text-gray-900 transition flex-shrink-0 font-medium">
              Grocery
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="font-bold text-gray-900 truncate">{categoryTitle}</span>
          </div>

          {/* Quick Count Badge */}
          {!itemsLoading && (
            <div className="text-xs font-semibold text-[#0C831F] hidden sm:block">
              {items.length} {items.length === 1 ? 'item' : 'items'} available
            </div>
          )}
        </div>
      </header>

      {/* Main Two-Column Zepto Layout */}
      <div className="max-w-7xl mx-auto w-full px-2 sm:px-4 lg:px-8 py-3 sm:py-6 flex-1 flex flex-col md:flex-row gap-3 sm:gap-6">
        {/* Left Subcategory Rail / Sidebar (Exact Zepto Screenshot Layout) */}
        <aside className="w-full md:w-64 lg:w-72 flex-shrink-0 bg-white md:rounded-3xl border border-gray-200 shadow-2xs p-2 sm:p-3 overflow-hidden">
          <div className="hidden md:flex items-center gap-2 px-3 py-2 border-b border-gray-100 mb-2">
            <Layers className="w-4 h-4 text-[#0C831F]" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-gray-500">
              Subcategories
            </span>
          </div>

          {/* Scrollable list of subcategories */}
          <div className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-y-auto no-scrollbar md:max-h-[75vh] py-1">
            {/* "All" Option */}
            <button
              onClick={() => setSelectedSubcategoryId('all')}
              className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-2xl text-left transition cursor-pointer flex-shrink-0 md:flex-shrink md:w-full border ${
                selectedSubcategoryId === 'all'
                  ? 'bg-purple-50/80 text-purple-900 border-purple-300 font-extrabold shadow-2xs'
                  : 'bg-white text-gray-700 border-transparent hover:bg-gray-50'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                All
              </div>
              <div className="min-w-0">
                <span className="text-xs sm:text-sm block truncate">All {categoryTitle}</span>
              </div>
            </button>

            {/* Subcategories list */}
            {subcategories.map((sub) => {
              const isActive = String(selectedSubcategoryId) === String(sub._id);
              return (
                <button
                  key={sub._id}
                  onClick={() => setSelectedSubcategoryId(sub._id)}
                  className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-2xl text-left transition cursor-pointer flex-shrink-0 md:flex-shrink md:w-full border ${
                    isActive
                      ? 'bg-purple-50 text-purple-950 border-purple-400 font-extrabold shadow-2xs'
                      : 'bg-white text-gray-700 border-transparent hover:bg-gray-50'
                  }`}
                >
                  {/* Subcategory Thumbnail Image */}
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {sub.image ? (
                      <img
                        src={sub.image}
                        alt={sub.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-xs font-bold text-gray-400">
                        {sub.name?.charAt(0)}
                      </span>
                    )}
                  </div>

                  {/* Subcategory Name */}
                  <div className="min-w-0 flex-1">
                    <span className="text-xs sm:text-sm block truncate leading-tight">
                      {sub.name}
                    </span>
                    {sub.itemCount !== undefined && (
                      <span className="text-[10px] text-gray-400 font-normal">
                        {sub.itemCount} items
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Main Content: Subcategory Title & Product Grid */}
        <main className="flex-1 min-w-0 flex flex-col">
          {/* Subcategory Title Banner */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4 shadow-2xs flex items-center justify-between">
            <div>
              <h1 className="text-base sm:text-xl font-black text-gray-900 tracking-tight">
                {currentSubTitle}
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {items.length} {items.length === 1 ? 'product' : 'products'} available in this section
              </p>
            </div>
            {currentCategory?.image && (
              <div className="w-12 h-12 rounded-xl bg-gray-50 p-1 border border-gray-100 hidden sm:block">
                <img
                  src={currentCategory.image}
                  alt={categoryTitle}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </div>

          {/* Product Grid Area */}
          {itemsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {Array.from({ length: 8 }).map((_, idx) => (
                <SkeletonCard key={idx} className="h-64 rounded-2xl" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-200 p-8 sm:p-12 text-center flex flex-col items-center justify-center my-auto shadow-2xs">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                <PackageOpen className="w-10 h-10" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-gray-900 mb-1">
                No items in this subcategory yet
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 max-w-sm mb-5">
                Products added or categorized under &quot;{currentSubTitle}&quot; will appear right here.
              </p>
              {selectedSubcategoryId !== 'all' && (
                <button
                  onClick={() => setSelectedSubcategoryId('all')}
                  className="bg-[#0C831F] text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-green-700 transition cursor-pointer"
                >
                  View All {categoryTitle} Items
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {items.map((item) => (
                <ItemCard
                  key={item._id || item.id}
                  item={item}
                  className="w-full min-w-0 max-w-none"
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
