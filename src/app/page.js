'use client';
import { useEffect, useState } from 'react';
import HeroBannerCarousel, { DEFAULT_HERO_BANNERS } from '@/components/home/HeroBannerCarousel';
import ShopByCategory from '@/components/home/ShopByCategory';
import { getCategories, getStoreInfo } from '@/lib/api';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [heroBanners, setHeroBanners] = useState(DEFAULT_HERO_BANNERS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [catRes, infoRes] = await Promise.all([
          getCategories().catch(() => ({ data: [] })),
          getStoreInfo().catch(() => ({ data: {} })),
        ]);

        const rawCats = catRes.data?.data || catRes.data || [];
        setCategories(Array.isArray(rawCats) ? rawCats : []);

        // Load dynamic hero banners configured in Store Settings
        const storeData = infoRes.data?.data || infoRes.data || {};
        const banners = storeData.heroBanners;
        if (Array.isArray(banners) && banners.length > 0) {
          setHeroBanners(banners);
        }
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Dynamic Cover Carousel (Zepto, Amazon, Prime Video, Netflix style) */}
      <HeroBannerCarousel banners={heroBanners} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-2 sm:mt-4">
        {/* Zepto Style Shop by Category */}
        <ShopByCategory categories={categories} loading={loading} />
      </div>
    </div>
  );
}
