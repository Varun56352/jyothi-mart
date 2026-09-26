'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch (e) {
      console.error('Error loading cart:', e);
    } finally {
      setHasMounted(true);
    }
  }, []);

  useEffect(() => {
    if (!hasMounted) return;
    try {
      localStorage.setItem('cart', JSON.stringify(items));
    } catch (e) {
      console.error('Error saving cart:', e);
    }
  }, [items, hasMounted]);

  const addItem = (item, variant = null) => {
    setItems((prev) => {
      const uniqueId = variant
        ? `${item._id}_${variant.variantId || variant.label}`
        : (item._id || item.itemId);

      const existing = prev.find((i) => i.itemId === uniqueId);
      if (existing) {
        if (existing.qty >= (existing.maxStock || 99)) return prev;
        return prev.map((i) =>
          i.itemId === uniqueId ? { ...i, qty: i.qty + 1 } : i
        );
      }

      const itemPrice = variant ? Number(variant.price) : Number(item.retailPrice || item.price);
      const itemMrp = variant ? (variant.mrp ? Number(variant.mrp) : null) : (item.mrp ? Number(item.mrp) : null);
      const itemTitle = variant
        ? `${item.displayName || item.name} (${variant.label})`
        : (item.displayName || item.name);

      return [
        ...prev,
        {
          itemId: uniqueId,
          productId: item._id,
          variantId: variant ? (variant.variantId || variant.label) : null,
          name: itemTitle,
          baseName: item.displayName || item.name,
          variantLabel: variant ? variant.label : null,
          price: itemPrice,
          mrp: itemMrp,
          qty: 1,
          image: item.images?.[0] || item.image || null,
          unit: variant ? variant.label : (item.displayUnit || item.unitType || '1 unit'),
          maxStock: item.stock,
        },
      ];
    });
  };

  const removeItem = (uniqueId) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.itemId === uniqueId);
      if (existing?.qty > 1) {
        return prev.map((i) =>
          i.itemId === uniqueId ? { ...i, qty: i.qty - 1 } : i
        );
      }
      return prev.filter((i) => i.itemId !== uniqueId);
    });
  };

  const updateQty = (uniqueId, qty) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => i.itemId !== uniqueId));
    } else {
      setItems((prev) =>
        prev.map((i) => (i.itemId === uniqueId ? { ...i, qty } : i))
      );
    }
  };

  const clearCart = () => setItems([]);

  const getItemQty = (productId, variantId = null) => {
    if (variantId) {
      const uniqueId = `${productId}_${variantId}`;
      const found = items.find((i) => i.itemId === uniqueId);
      return found ? found.qty : 0;
    }
    // Total quantity of all variants of this product, or base product
    return items
      .filter((i) => i.productId === productId || i.itemId === productId)
      .reduce((acc, i) => acc + i.qty, 0);
  };

  const cartCount = items.reduce((acc, item) => acc + item.qty, 0);
  const cartTotal = items.reduce((acc, item) => acc + item.price * item.qty, 0);
  const cartSavings = items.reduce((acc, item) => {
    if (item.mrp && item.mrp > item.price) {
      return acc + (item.mrp - item.price) * item.qty;
    }
    return acc;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQty,
        clearCart,
        getItemQty,
        cartCount,
        cartTotal,
        cartSavings,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
