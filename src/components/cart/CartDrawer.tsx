"use client";

import { useCart } from "@/lib/contexts/CartContext";
import { X, ShoppingBag, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useState } from "react";
import AuthModal from "../auth/AuthModal";
import { purchaseArtworks, Purchase } from "@/lib/firebase/users";
import { useRouter } from "next/navigation";

export default function CartDrawer() {
  const { items, isCartOpen, setIsCartOpen, removeFromCart, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const handleCheckout = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const purchases: Purchase[] = items.map(item => ({
        artworkId: item.id || item.cartItemId,
        title: item.title,
        medium: item.medium,
        imageUrl: item.imageUrl,
        price: item.price,
        acquiredAt: Date.now()
      }));

      await purchaseArtworks(user.uid, purchases);
      clearCart();
      setIsCartOpen(false);
      router.push("/collection");
    } catch (e) {
      console.error(e);
      alert("Checkout failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isCartOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-[#0A0A0A] border-l border-white/10 z-[101] shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-6 h-6 text-[#EBB34B]" />
                  <h2 className="text-xl font-bold text-white tracking-tight">Your Basket</h2>
                  <span className="bg-[#EBB34B]/20 text-[#EBB34B] px-2 py-0.5 rounded-full text-xs font-bold">
                    {items.length}
                  </span>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                    <ShoppingBag className="w-16 h-16 text-gray-500 mb-4" />
                    <p className="text-lg font-medium text-white">Your basket is empty</p>
                    <p className="text-sm text-gray-400 mt-2">Discover beautiful portraiture in the feed.</p>
                  </div>
                ) : (
                  items.map((item) => (
                    <div key={item.cartItemId} className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/5 relative group">
                      <div 
                        className="w-20 h-24 rounded-lg bg-cover bg-center shrink-0"
                        style={{ backgroundImage: `url(${item.imageUrl})` }}
                      />
                      <div className="flex-1 flex flex-col justify-center">
                        <h3 className="font-bold text-white text-sm line-clamp-1">{item.title}</h3>
                        <p className="text-[#EBB34B] text-xs font-medium mb-2">{item.medium}</p>
                        <div className="text-sm font-bold text-white">${item.price.toFixed(2)}</div>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.cartItemId)}
                        className="absolute top-4 right-4 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Footer / Checkout */}
              {items.length > 0 && (
                <div className="p-6 border-t border-white/10 bg-[#050510]">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-gray-400 font-medium">Subtotal</span>
                    <span className="text-2xl font-bold text-white">${totalPrice.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={handleCheckout}
                    disabled={isProcessing}
                    className="w-full py-4 bg-[#EBB34B] hover:scale-[1.02] transition-transform rounded-xl text-black font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {!user ? "Sign In to Checkout" : isProcessing ? "Processing Securely..." : "Proceed to Secure Checkout"}
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} redirectOnLogin={false} />
    </>
  );
}
