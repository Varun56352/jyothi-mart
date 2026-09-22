'use client';
import Link from 'next/link';
import { ShoppingBag, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 bg-green-50 text-[#0C831F] rounded-full flex items-center justify-center mb-4 border border-green-200">
        <ShoppingBag className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
      <p className="text-sm text-gray-500 max-w-sm mb-6">
        Sorry, the page you're looking for doesn't exist or has moved.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 bg-[#0C831F] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 transition shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>
    </div>
  );
}
