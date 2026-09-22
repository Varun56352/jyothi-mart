'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Grid, Package, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

export default function BottomNav() {
  const pathname = usePathname();
  const { isAdmin, isDelivery } = useAuth();

  if (isAdmin || isDelivery || pathname.startsWith('/admin') || pathname.startsWith('/delivery')) {
    return null;
  }

  const navItems = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: Grid, label: 'Categories', href: '/category' },
    { icon: Package, label: 'Orders', href: '/orders' },
    { icon: User, label: 'Account', href: '/account' },
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 z-40 lg:hidden">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.label} href={item.href} className="flex flex-col items-center justify-center w-full">
              <item.icon className={cn("w-6 h-6 mb-1", active ? "text-[#0C831F]" : "text-gray-500")} />
              <span className={cn("text-[10px] font-medium", active ? "text-[#0C831F]" : "text-gray-500")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
