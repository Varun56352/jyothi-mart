'use client';
import { createContext, useContext, useState } from 'react';
import { MapPin, Search, User } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-2">
          <MapPin className="text-[#0C831F] w-6 h-6" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-800">Delivery in 10 mins</span>
            <span className="text-xs text-gray-500 truncate w-40">Koramangala, Bangalore...</span>
          </div>
        </div>
        <Link href="/" className="text-xl font-bold text-[#0C831F]">
          Jyothi Mart
        </Link>
        <Link href="/account">
          <div className="p-2 bg-gray-100 rounded-full text-gray-700">
            <User className="w-5 h-5" />
          </div>
        </Link>
      </div>
      <div className="px-4 pb-3">
        <Link href="/search">
          <div className="w-full flex items-center bg-gray-100 rounded-xl px-4 py-2.5 space-x-2 border border-gray-200">
            <Search className="w-5 h-5 text-gray-500" />
            <span className="text-gray-500 text-sm">Search for groceries, essentials...</span>
          </div>
        </Link>
      </div>
    </header>
  );
}
