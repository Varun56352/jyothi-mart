'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import AdminItemsManager from '@/components/admin/AdminItemsManager';

export default function AdminItemsPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/login?redirect=/admin/items');
      } else if (!isAdmin) {
        router.replace('/');
      }
    }
  }, [user, isAdmin, authLoading, router]);

  if (authLoading || (!isAdmin && !authLoading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0C831F]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 shadow-xs">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center space-x-3">
            <Link
              href="/admin"
              className="p-1.5 -ml-1.5 rounded-full hover:bg-gray-100 transition text-gray-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">Catalog Management</h1>
              <p className="text-xs text-gray-500">Edit item photos and store visibility</p>
            </div>
          </div>
          <Link
            href="/admin"
            className="text-xs font-semibold text-[#0C831F] hover:underline"
          >
            Admin Dashboard →
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden h-[78vh]">
          <AdminItemsManager />
        </div>
      </main>
    </div>
  );
}
