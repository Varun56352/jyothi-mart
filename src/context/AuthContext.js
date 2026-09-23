'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { verifyOtp } from '@/lib/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (token && storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error('Error parsing stored user:', e);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (phone, otp, firebaseToken, firebaseUid) => {
    const res = await verifyOtp(phone, otp, firebaseToken, firebaseUid);
    const payload = res.data?.data || res.data;
    const token = payload?.token;
    const userData = payload?.user;
    if (token) localStorage.setItem('token', token);
    if (userData) localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  const isAdmin = user?.role === 'admin';
  const isDelivery = user?.role === 'delivery';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isDelivery,
        login,
        logout,
        loading,
        isLoginModalOpen,
        openLoginModal,
        closeLoginModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
