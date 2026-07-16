"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Artwork } from "@/lib/firebase/artworks";

export interface CartItem extends Artwork {
  cartItemId: string; // Unique ID for the cart entry (since same artwork could theoretically be added twice, though we'll prevent it)
  price: number;      // Fixed at $50 for prints based on UI
}

interface CartContextType {
  items: CartItem[];
  addToCart: (artwork: Artwork) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("myPortraitCart");
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart from localStorage", e);
      }
    }
    setIsHydrated(true);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem("myPortraitCart", JSON.stringify(items));
    }
  }, [items, isHydrated]);

  const addToCart = (artwork: Artwork) => {
    // Check if it's already in the cart to prevent duplicates
    if (items.some(item => item.id === artwork.id)) {
      setIsCartOpen(true); // Just open the cart if they already added it
      return;
    }

    const newItem: CartItem = {
      ...artwork,
      cartItemId: Math.random().toString(36).substr(2, 9),
      price: 50 // Standard print price based on the FeedModule
    };
    
    setItems(prev => [...prev, newItem]);
    setIsCartOpen(true);
  };

  const removeFromCart = (cartItemId: string) => {
    setItems(prev => prev.filter(item => item.cartItemId !== cartItemId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalPrice = items.reduce((sum, item) => sum + item.price, 0);

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      clearCart,
      isCartOpen,
      setIsCartOpen,
      totalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
