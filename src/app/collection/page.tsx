"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import NoiseBackground from "@/components/background/NoiseBackground";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import FeedModule from "@/components/dashboard/FeedModule";
import { Compass, Image as ImageIcon, Briefcase, PackageOpen, LogOut, ChevronLeft, ChevronRight } from "lucide-react";

export default function CollectorHub() {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("gallery");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/");
      else if (userRole === "artist") router.push("/dashboard");
    }
  }, [user, userRole, loading, router]);

  const handleLogout = async () => {
    const { auth } = await import('@/lib/firebase/config');
    const { signOut } = await import('firebase/auth');
    await signOut(auth);
  };

  if (loading || userRole === "artist") return <div className="min-h-screen bg-[#0A0A0A]"></div>;

  return (
    <div className="flex min-h-screen bg-[#0A0A0A]">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarCollapsed ? 80 : 256 }}
        className="border-r border-white/10 bg-[#0A0A0A] hidden md:flex flex-col relative z-20 shrink-0"
      >
        <div className="p-6 flex items-center justify-between">
          {!isSidebarCollapsed && (
            <h2 className="text-2xl font-bold text-white tracking-tighter mt-4 truncate">MY<span className="text-[#ffd700]">COLLECTION</span></h2>
          )}
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={`p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white ${!isSidebarCollapsed ? 'mt-4' : 'mx-auto'}`}
          >
            {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <button 
            onClick={() => setActiveTab("feed")}
            className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${activeTab === 'feed' ? 'bg-[#ffd700]/10 text-[#ffd700] font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'} ${isSidebarCollapsed ? 'justify-center' : ''}`}
            title="Discovery Feed"
          >
            <Compass size={20} className={isSidebarCollapsed ? '' : 'mr-3 shrink-0'} />
            {!isSidebarCollapsed && <span className="truncate">Discovery Feed</span>}
          </button>
          <button 
            onClick={() => setActiveTab("gallery")}
            className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${activeTab === 'gallery' ? 'bg-[#ffd700]/10 text-[#ffd700] font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'} ${isSidebarCollapsed ? 'justify-center' : ''}`}
            title="Private Gallery"
          >
            <ImageIcon size={20} className={isSidebarCollapsed ? '' : 'mr-3 shrink-0'} />
            {!isSidebarCollapsed && <span className="truncate">Private Gallery</span>}
          </button>
          <button 
            onClick={() => setActiveTab("commissions")}
            className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${activeTab === 'commissions' ? 'bg-[#ffd700]/10 text-[#ffd700] font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'} ${isSidebarCollapsed ? 'justify-center' : ''}`}
            title="Commission Tracker"
          >
            <Briefcase size={20} className={isSidebarCollapsed ? '' : 'mr-3 shrink-0'} />
            {!isSidebarCollapsed && <span className="truncate">Commission Tracker</span>}
          </button>
          <button 
            onClick={() => setActiveTab("orders")}
            className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${activeTab === 'orders' ? 'bg-[#ffd700]/10 text-[#ffd700] font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'} ${isSidebarCollapsed ? 'justify-center' : ''}`}
            title="Order Management"
          >
            <PackageOpen size={20} className={isSidebarCollapsed ? '' : 'mr-3 shrink-0'} />
            {!isSidebarCollapsed && <span className="truncate">Order Management</span>}
          </button>
        </nav>
        <div className="p-6 border-t border-white/10">
          <button 
            onClick={handleLogout}
            className={`w-full flex items-center px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors font-medium ${isSidebarCollapsed ? 'justify-center' : ''}`}
            title="Logout"
          >
            <LogOut size={20} className={isSidebarCollapsed ? '' : 'mr-3 shrink-0'} />
            {!isSidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-y-auto">
        <NoiseBackground />
        
        <div className="relative z-10 p-8 max-w-[1600px] mx-auto min-h-screen flex flex-col">
          
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-4 border-b border-white/10">
            <h1 className="text-2xl font-bold text-white tracking-tighter">
              {activeTab === "feed" && "DISCOVERY FEED"}
              {activeTab === "gallery" && "PRIVATE GALLERY"}
              {activeTab === "commissions" && "COMMISSION TRACKER"}
              {activeTab === "orders" && "ORDER & ESCROW MANAGEMENT"}
            </h1>
          </header>

          {/* Tab Content Routing */}
          {activeTab === "feed" && (
            <div className="flex-1">
              <FeedModule />
            </div>
          )}

          {activeTab === "gallery" && (
            <div className="flex-1">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-medium text-white">Your Acquired Artworks</h2>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-xs font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400"></span> Blockchain Provenance Active
                  </span>
                </div>
              </div>

              {/* Placeholder Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Mock Item */}
                <div className="glass-dark overflow-hidden flex flex-col group cursor-pointer border border-white/5 hover:border-white/20 transition-colors">
                  <div className="w-full aspect-square bg-gray-900 relative">
                    <div className="absolute inset-0 flex items-center justify-center text-gray-700 text-6xl">🖼️</div>
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-medium text-white">The Enigma</h3>
                      <span className="text-xs px-2 py-1 bg-[#ffd700]/10 text-[#ffd700] rounded border border-[#ffd700]/30">CoA Verified</span>
                    </div>
                    <p className="text-sm text-[#00f3ff] mb-4">by Elena V.</p>
                    <div className="flex justify-between items-center text-sm border-t border-white/10 pt-4">
                      <span className="text-gray-400">Acquired: Jan 2026</span>
                      <button className="text-white hover:text-[#ffd700] transition-colors">View Certificate</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-12 glass-dark p-8 text-center rounded-2xl border border-white/5">
                <p className="text-gray-400 mb-4">Looking to expand your collection?</p>
                <Link href="/feed" className="px-6 py-3 bg-white/5 hover:bg-white/10 transition-colors rounded-xl text-white font-medium inline-block border border-white/10">
                  Discover New Artworks
                </Link>
              </div>
            </div>
          )}

          {activeTab === "commissions" && (
            <div className="glass-dark border border-white/5 flex-1 rounded-2xl flex flex-col items-center justify-center text-center p-8">
              <span className="text-4xl mb-4">🎨</span>
              <h2 className="text-2xl font-bold text-white mb-2">Active Commissions</h2>
              <p className="text-gray-400 max-w-md">
                Track your requested portraits, communicate with the artists, and review milestone sketches here.
              </p>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="glass-dark border border-white/5 flex-1 rounded-2xl flex flex-col items-center justify-center text-center p-8">
              <span className="text-4xl mb-4">🛡️</span>
              <h2 className="text-2xl font-bold text-white mb-2">Escrow & Logistics</h2>
              <p className="text-gray-400 max-w-md">
                Manage your payments, shipping addresses, and escrow releases for physical artwork deliveries.
              </p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
