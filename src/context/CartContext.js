'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('cart');
    if (saved) setItems(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addItem = (item) => {
    setItems(prev => {
      const existing = prev.find(i => i.itemId === item._id || i.itemId === item.itemId);
      if (existing) {
        if (existing.qty >= (existing.maxStock || 99)) return prev;
        return prev.map(i => i.itemId === existing.itemId ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, {
        itemId: item._id || item.itemId,
        name: item.name,
        price: item.retailPrice || item.price,
        qty: 1,
        image: item.images?.[0] || item.image || null,
        unit: item.unitType,
        maxStock: item.stock
      }];
    });
  };

  const removeItem = (itemId) => {
    setItems(prev => {
      const existing = prev.find(i => i.itemId === itemId);
      if (existing?.qty > 1) {
        return prev.map(i => i.itemId === itemId ? { ...i, qty: i.qty - 1 } : i);
      }
      return prev.filter(i => i.itemId !== itemId);
    });
  };

  const updateQty = (itemId, qty) => {
    if (qty <= 0) {
      setItems(prev => prev.filter(i => i.itemId !== itemId));
    } else {
      setItems(prev => prev.map(i => i.itemId === itemId ? { ...i, qty } : i));
    }
  };

  const clearCart = () => setItems([]);

  const cartCount = items.reduce((acc, item) => acc + item.qty, 0);
  const cartTotal = items.reduce((acc, item) => acc + (item.price * item.qty), 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, cartCount, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
