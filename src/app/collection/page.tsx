"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import NoiseBackground from "@/components/background/NoiseBackground";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import FeedModule from "@/components/dashboard/FeedModule";
import { Compass, Image as ImageIcon, Briefcase, PackageOpen, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { getUserProfile, Purchase } from "@/lib/firebase/users";
import { getCollectorActiveCommissions } from "@/lib/firebase/commissions";

export default function CollectorHub() {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("gallery");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState(true);
  const [activeCommissions, setActiveCommissions] = useState<any[]>([]);
  const [loadingCommissions, setLoadingCommissions] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/");
      else if (userRole === "artist") router.push("/dashboard");
      else {
        fetchPurchases(user.uid);
        getCollectorActiveCommissions(user.uid).then(comms => {
          setActiveCommissions(comms);
          setLoadingCommissions(false);
        });
      }
    }
  }, [user, userRole, loading, router]);

  const fetchPurchases = async (uid: string) => {
    const profile = await getUserProfile(uid);
    if (profile && profile.purchases) {
      setPurchases(profile.purchases.reverse());
    }
    setLoadingPurchases(false);
  };

  const handleLogout = async () => {
    const { auth } = await import('@/lib/firebase/config');
    const { signOut } = await import('firebase/auth');
    await signOut(auth);
  };

  if (loading || userRole === "artist") return <div className="min-h-screen bg-[#0A0A0A]"></div>;

  return (
    <div className="flex flex-1 h-[calc(100vh-73px)] bg-[#0A0A0A]">
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
        
        <div className="relative z-10 p-8 max-w-[1600px] mx-auto h-full flex flex-col">
          
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

              {/* Real Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loadingPurchases ? (
                  <div className="col-span-full text-center text-gray-500 py-10">Loading your collection...</div>
                ) : purchases.length === 0 ? (
                  <div className="col-span-full text-center text-gray-500 py-10">You haven't acquired any artworks yet.</div>
                ) : (
                  purchases.map(purchase => (
                    <div key={`${purchase.artworkId}-${purchase.acquiredAt}`} className="glass-dark overflow-hidden flex flex-col group cursor-pointer border border-white/5 hover:border-white/20 transition-colors">
                      <div className="w-full aspect-square bg-cover bg-center relative" style={{ backgroundImage: `url(${purchase.imageUrl})` }}>
                      </div>
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-2 gap-2">
                          <h3 className="text-xl font-medium text-white line-clamp-1">{purchase.title}</h3>
                          <span className="text-[10px] px-2 py-1 bg-green-500/10 text-green-400 rounded border border-green-500/30 shrink-0 uppercase tracking-widest font-bold">CoA Verified</span>
                        </div>
                        <p className="text-sm text-[#EBB34B] mb-4">{purchase.medium}</p>
                        <div className="flex justify-between items-center text-sm border-t border-white/10 pt-4">
                          <span className="text-gray-400">Acquired: {new Date(purchase.acquiredAt).toLocaleDateString()}</span>
                          <button className="text-white hover:text-[#EBB34B] transition-colors font-medium">View Certificate</button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
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
            <div className="flex-1">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-medium text-white">Active Commissions</h2>
              </div>
              <div className="space-y-6">
                {loadingCommissions ? (
                  <div className="text-gray-500 text-center py-10">Loading tracker...</div>
                ) : activeCommissions.length === 0 ? (
                  <div className="glass-dark border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center p-8">
                    <span className="text-4xl mb-4">🎨</span>
                    <h2 className="text-xl font-medium text-white mb-2">No active commissions</h2>
                    <p className="text-gray-400">Head over to the Marketplace to request a new portrait.</p>
                  </div>
                ) : (
                  activeCommissions.map(comm => (
                    <div key={comm.id} className="glass-dark p-6 border border-white/10 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-1">{comm.title}</h3>
                        <p className="text-[#00f3ff] text-sm mb-4">Assigned Artist: {comm.assignedArtistName}</p>
                        <p className="text-gray-400 text-sm max-w-2xl">{comm.description}</p>
                        {comm.milestone && (
                          <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-xl inline-block">
                            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Current Progress Stage</p>
                            <p className="text-[#ffd700] font-bold">{comm.milestone}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className={`px-4 py-2 rounded-full text-sm font-medium capitalize border ${
                          comm.status === "completed" ? "bg-green-500/10 text-green-400 border-green-500/30" :
                          comm.status === "in-progress" ? "bg-purple-500/10 text-purple-400 border-purple-500/30" :
                          "bg-orange-500/10 text-orange-400 border-orange-500/30"
                        }`}>
                          {comm.status.replace(/_/g, " ")}
                        </span>
                        <span className="text-[#ffd700] font-bold">{comm.budget}</span>
                        {comm.milestoneImageUrl && (
                          <div className="mt-2 w-32 h-32 rounded-lg border border-white/10 overflow-hidden relative group cursor-pointer" onClick={() => window.open(comm.milestoneImageUrl, '_blank')}>
                            <div className="absolute inset-0 bg-cover bg-center transition-transform group-hover:scale-110" style={{ backgroundImage: `url(${comm.milestoneImageUrl})` }}></div>
                            <div className="absolute inset-0 bg-black/40 flex items-end justify-center p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-[10px] text-white font-bold uppercase tracking-wider text-center">View Progress Image</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
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
