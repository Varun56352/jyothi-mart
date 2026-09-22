'use client';
import { useEffect, useState } from 'react';
import ItemCard from '@/components/home/ItemCard';
import { getCatalog } from '@/lib/api';

export default function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Basic fetch mock until real API is ready
    getCatalog().then(res => {
      setItems(res.data?.items || []);
    }).catch(err => {
      console.error(err);
      // Dummy data for visual presentation
      setItems([
        { _id: '1', name: 'Amul Taaza Toned Fresh Milk', retailPrice: 27, unitType: '500 ml', stock: 10 },
        { _id: '2', name: 'Britannia Good Day Cashew Cookies', retailPrice: 40, unitType: '200 g', stock: 5 },
        { _id: '3', name: 'Tata Salt', retailPrice: 28, unitType: '1 kg', stock: 20 },
        { _id: '4', name: 'Aashirvaad Superior MP Atta', retailPrice: 245, unitType: '5 kg', stock: 0 },
      ]);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-gradient-to-r from-green-500 to-[#0C831F] text-white p-6 rounded-b-3xl mb-6 shadow-sm">
        <h1 className="text-2xl font-bold mb-2">Groceries delivered in 10 minutes</h1>
        <p className="text-sm opacity-90">Fresh products directly to your door.</p>
      </div>

      <div className="px-4 mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Shop All Products</h2>
        {loading ? (
          <div className="flex space-x-4 overflow-x-auto no-scrollbar pb-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="min-w-[160px] h-48 bg-gray-200 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="flex space-x-4 overflow-x-auto no-scrollbar pb-4">
            {items.map(item => (
              <ItemCard key={item._id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
