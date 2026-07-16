"use client";

import { Palette, Sparkles, Bell, LogOut, ShoppingBag } from "lucide-react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useState, useRef, useEffect } from "react";
import AuthModal from "../auth/AuthModal";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/contexts/CartContext";

export default function Navbar() {
  const { user, userProfile, userRole, logout } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { items, setIsCartOpen } = useCart();
  const [unbiddedCount, setUnbiddedCount] = useState(0);

  useEffect(() => {
    if (userRole === "artist" && user) {
      import('@/lib/firebase/commissions').then(({ getOpenCommissions }) => {
        getOpenCommissions().then(comms => {
          const unbidded = comms.filter(c => !(c.bidders || []).includes(user.uid));
          setUnbiddedCount(unbidded.length);
        });
      });
    }
  }, [user, userRole]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 md:px-12 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/5">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 cursor-pointer">
        <Palette className="w-6 h-6 text-[#EBB34B]" />
        <span className="text-xl font-bold text-white tracking-tight">My Portrait</span>
      </Link>

      {/* Links */}
      <div className="hidden md:flex items-center gap-8 text-sm font-medium">
        <Link 
          href="/feed" 
          className={`transition-colors ${pathname === '/feed' ? 'text-[#EBB34B]' : 'text-gray-300 hover:text-white'}`}
        >
          Explore
        </Link>
        <Link 
          href="/marketplace" 
          className={`relative transition-colors ${pathname === '/marketplace' ? 'text-[#EBB34B]' : 'text-gray-300 hover:text-white'}`}
        >
          Marketplace
          {userRole === "artist" && unbiddedCount > 0 && (
            <span className="absolute -top-2 -right-4 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
              {unbiddedCount}
            </span>
          )}
        </Link>
        <Link 
          href="/gallery" 
          className={`transition-colors ${pathname === '/gallery' ? 'text-[#EBB34B]' : 'text-gray-300 hover:text-white'}`}
        >
          Virtual Gallery
        </Link>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-6">
        <Link href="/search" className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full border border-[#EBB34B]/30 bg-[#EBB34B]/10 hover:bg-[#EBB34B]/20 transition-colors">
          <Sparkles className="w-4 h-4 text-[#EBB34B]" />
          <span className="text-sm font-medium text-[#EBB34B]">AI Search</span>
        </Link>
        
        <button onClick={() => setIsCartOpen(true)} className="relative text-gray-300 hover:text-white transition-colors">
          <ShoppingBag className="w-5 h-5" />
          {items.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#EBB34B] text-black text-[10px] font-bold flex items-center justify-center rounded-full">
              {items.length}
            </span>
          )}
        </button>
        
        <button className="text-gray-300 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
        </button>
        
        {user ? (
          <div className="relative flex items-center gap-4" ref={dropdownRef}>
            <div 
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <div 
                className="w-8 h-8 rounded-full overflow-hidden bg-gray-700 ring-2 ring-transparent group-hover:ring-[#EBB34B] transition-all flex items-center justify-center text-xs font-bold text-white uppercase bg-cover bg-center"
                style={userProfile?.profilePictureUrl ? { backgroundImage: `url(${userProfile.profilePictureUrl})` } : {}}
              >
                {!userProfile?.profilePictureUrl && (user.email?.charAt(0) || "U")}
              </div>
              <span className="text-sm font-medium text-white hidden sm:block truncate max-w-[120px]">
                {userProfile?.displayName || userProfile?.fullName || userProfile?.legalName || user.email?.split('@')[0]}
              </span>
            </div>
            
            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute top-full right-0 mt-4 w-56 bg-[#121212] border border-white/10 rounded-2xl shadow-2xl py-2 flex flex-col z-50 overflow-hidden backdrop-blur-xl">
                <div className="px-4 py-3 border-b border-white/5 mb-1">
                  <p className="text-xs text-gray-400">Signed in as</p>
                  <p className="text-sm font-bold text-white truncate">{user.email}</p>
                </div>
                
                {userRole === "admin" && (
                  <Link href="/admin" onClick={() => setIsDropdownOpen(false)} className="px-4 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors">Admin Panel</Link>
                )}
                
                {userRole === "artist" && (
                  <>
                    <Link href="/dashboard" onClick={() => setIsDropdownOpen(false)} className="px-4 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors">Artist Dashboard</Link>
                    <Link href="/portfolio" onClick={() => setIsDropdownOpen(false)} className="px-4 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors">My Portfolio</Link>
                  </>
                )}
                
                {userRole === "buyer" && (
                  <Link href="/collection" onClick={() => setIsDropdownOpen(false)} className="px-4 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors">My Collection</Link>
                )}
                
                <div className="border-t border-white/5 my-1"></div>
                
                <button 
                  onClick={() => {
                    logout();
                    setIsDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2 text-sm font-bold text-black bg-[#EBB34B] rounded-full hover:scale-105 transition-transform"
          >
            Sign In / Join
          </button>
        )}
      </div>
      </nav>

      <AuthModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
