"use client";

import { useState } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import Link from "next/link";
import AuthModal from "../auth/AuthModal";

export default function AuthButtons() {
  const { user, userRole, logout } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="flex flex-wrap justify-center gap-4 pt-6 max-w-3xl mx-auto">
        <Link href="/feed" className="px-6 py-3 bg-white/5 hover:bg-white/10 transition-colors backdrop-blur-lg border border-white/10 rounded-2xl text-white font-medium">
          Feed
        </Link>
        <Link href="/marketplace" className="px-6 py-3 bg-white/5 hover:bg-white/10 transition-colors backdrop-blur-lg border border-white/10 rounded-2xl text-white font-medium">
          Marketplace
        </Link>
        <Link href="/search" className="px-6 py-3 bg-[#00f3ff]/10 hover:bg-[#00f3ff]/20 text-[#00f3ff] transition-colors border border-[#00f3ff]/30 rounded-2xl font-medium shadow-[0_0_20px_rgba(0,243,255,0.05)]">
          AI Search ✨
        </Link>
        <Link href="/gallery" className="px-6 py-3 bg-white/5 hover:bg-white/10 transition-colors backdrop-blur-lg border border-white/10 rounded-2xl text-white font-medium">
          Virtual Gallery 🖼️
        </Link>
        
        {userRole === "artist" && (
          <>
            <Link href="/portfolio" className="px-6 py-3 bg-white/5 hover:bg-white/10 transition-colors backdrop-blur-lg border border-white/10 rounded-2xl text-white font-medium">
              Portfolio
            </Link>
            <Link href="/dashboard" className="px-6 py-3 bg-white/5 hover:bg-white/10 transition-colors backdrop-blur-lg border border-[#ffd700]/30 rounded-2xl text-[#ffd700] font-medium">
              Dashboard
            </Link>
          </>
        )}

        {userRole === "admin" && (
          <Link href="/admin" className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors border border-red-500/30 rounded-2xl font-medium shadow-[0_0_20px_rgba(239,68,68,0.05)]">
            Admin Panel
          </Link>
        )}

        {!user ? (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-[#050510]/80 hover:bg-[#121212] transition-colors border border-white/20 rounded-2xl text-white font-medium ml-4"
          >
            Sign In / Join
          </button>
        ) : (
          <button 
            onClick={logout}
            className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors border border-red-500/20 rounded-2xl font-medium ml-4"
          >
            Logout
          </button>
        )}
      </div>
      <AuthModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
