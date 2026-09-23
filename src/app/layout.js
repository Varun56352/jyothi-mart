import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { LocationProvider } from '@/context/LocationContext';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import CartBar from '@/components/layout/CartBar';
import LoginModal from '@/components/common/LoginModal';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Jyothi Mart - Quick Commerce',
  description: 'Fresh groceries delivered in minutes',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <LocationProvider>
            <CartProvider>
              <div className="flex flex-col min-h-screen pb-20 lg:pb-0 relative">
                <Header />
                <main className="flex-1 overflow-x-hidden">
                  {children}
                </main>
                <CartBar />
                <BottomNav />
                <LoginModal />
              </div>
            </CartProvider>
          </LocationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
