"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { getAllArtworks, deleteArtwork, Artwork } from "@/lib/firebase/artworks";
import { getOpenCommissions, Commission, updateCommissionStatus } from "@/lib/firebase/commissions";
import { getPendingArtists, updateArtistStatus, UserProfile } from "@/lib/firebase/users";
import { useRouter } from "next/navigation";
import NoiseBackground from "@/components/background/NoiseBackground";
import { motion } from "framer-motion";
import { Users, ImageOff, ShieldAlert, LogOut, ChevronLeft, ChevronRight } from "lucide-react";

export default function AdminDashboard() {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();
  
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [pendingArtists, setPendingArtists] = useState<UserProfile[]>([]);
  const [activeTab, setActiveTab] = useState<"applications" | "content" | "disputes">("applications");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/");
      } else if (userRole !== "admin") {
        router.push("/feed"); // Redirect non-admins
      }
    }
  }, [user, userRole, loading, router]);

  useEffect(() => {
    if (userRole === "admin") {
      loadData();
    }
  }, [userRole]);

  const loadData = async () => {
    const arts = await getAllArtworks();
    setArtworks(arts);
    
    const comms = await getOpenCommissions();
    setCommissions(comms);

    const pending = await getPendingArtists();
    setPendingArtists(pending);
  };

  const handleDeleteArtwork = async (id: string) => {
    if (confirm("Are you sure you want to delete this artwork? This action cannot be undone.")) {
      await deleteArtwork(id);
      setArtworks(artworks.filter(a => a.id !== id));
    }
  };

  const handleResolveDispute = async (id: string, resolution: "refunded" | "completed") => {
    if (confirm(`Are you sure you want to resolve this dispute as ${resolution}?`)) {
      await updateCommissionStatus(id, resolution);
      setCommissions(commissions.filter(c => c.id !== id));
    }
  };

  const handleArtistDecision = async (uid: string, decision: "APPROVED" | "REJECTED") => {
    if (confirm(`Are you sure you want to mark this application as ${decision}?`)) {
      await updateArtistStatus(uid, decision);
      setPendingArtists(pendingArtists.filter(a => a.uid !== uid));
    }
  };

  const handleLogout = async () => {
    const { auth } = await import('@/lib/firebase/config');
    const { signOut } = await import('firebase/auth');
    await signOut(auth);
  };

  if (loading || userRole !== "admin") return <div className="min-h-screen bg-[#0A0A0A]"></div>;

  return (
    <div className="flex min-h-screen bg-[#0A0A0A]">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarCollapsed ? 80 : 256 }}
        className="border-r border-red-500/20 bg-[#0A0A0A] hidden md:flex flex-col relative z-20 shrink-0"
      >
        <div className="p-6 flex items-center justify-between">
          {!isSidebarCollapsed && (
            <h2 className="text-2xl font-bold text-white tracking-tighter truncate">ADMIN<span className="text-red-500">PORTAL</span></h2>
          )}
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={`p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white ${!isSidebarCollapsed ? '' : 'mx-auto'}`}
          >
            {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <button 
            onClick={() => setActiveTab("applications")}
            className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${activeTab === 'applications' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'} ${isSidebarCollapsed ? 'justify-center' : ''}`}
            title="Pending Applications"
          >
            <div className="relative">
              <Users size={20} className={isSidebarCollapsed ? '' : 'mr-3 shrink-0'} />
              {pendingArtists.length > 0 && (
                <span className={`absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-4 min-w-4 flex items-center justify-center rounded-full px-1 ${!isSidebarCollapsed ? 'hidden' : ''}`}>
                  {pendingArtists.length}
                </span>
              )}
            </div>
            {!isSidebarCollapsed && (
              <div className="flex justify-between items-center w-full truncate">
                <span className="truncate">Applications</span>
                {pendingArtists.length > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingArtists.length}</span>
                )}
              </div>
            )}
          </button>

          <button 
            onClick={() => setActiveTab("content")}
            className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${activeTab === 'content' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'} ${isSidebarCollapsed ? 'justify-center' : ''}`}
            title="Content Moderation"
          >
            <ImageOff size={20} className={isSidebarCollapsed ? '' : 'mr-3 shrink-0'} />
            {!isSidebarCollapsed && <span className="truncate">Content Moderation</span>}
          </button>

          <button 
            onClick={() => setActiveTab("disputes")}
            className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${activeTab === 'disputes' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'} ${isSidebarCollapsed ? 'justify-center' : ''}`}
            title="Escrow Disputes"
          >
            <ShieldAlert size={20} className={isSidebarCollapsed ? '' : 'mr-3 shrink-0'} />
            {!isSidebarCollapsed && <span className="truncate">Escrow Disputes</span>}
          </button>
        </nav>

        <div className="p-6 border-t border-red-500/20">
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
          
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-4 border-b border-red-500/30">
            <h1 className="text-2xl font-bold text-red-500 tracking-tighter">
              {activeTab === "applications" && "PENDING APPLICATIONS"}
              {activeTab === "content" && "CONTENT MODERATION"}
              {activeTab === "disputes" && "ESCROW DISPUTES"}
            </h1>
            <div className="text-xs text-red-400 uppercase tracking-widest px-3 py-1 border border-red-500/30 rounded-full bg-red-500/10">
              Superuser Access
            </div>
          </header>

          <div className="flex-1">
            
            {activeTab === "applications" && (
              <div>
                {pendingArtists.length === 0 ? (
                  <div className="glass-dark border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center p-12">
                    <span className="text-4xl mb-4 text-gray-500">📝</span>
                    <h2 className="text-xl font-medium text-white mb-2">No pending applications</h2>
                    <p className="text-gray-400 max-w-md">The review queue is currently empty.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {pendingArtists.map(artist => (
                      <div key={artist.uid} className="bg-black/40 backdrop-blur-md border border-white/10 p-6 rounded-2xl">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                              {artist.legalName} 
                              <span className="text-sm font-normal text-gray-400">({artist.email})</span>
                            </h3>
                            <div className="grid grid-cols-2 gap-4 text-sm mt-4 p-4 bg-black/40 rounded-xl border border-white/5">
                                <div>
                                  <span className="text-gray-500 block text-xs uppercase mb-1">Phone</span>
                                  {artist.phone}
                                </div>
                                <div>
                                  <span className="text-gray-500 block text-xs uppercase mb-1">Location</span>
                                  {artist.address} ({artist.country})
                                </div>
                                <div className="col-span-2">
                                  <span className="text-gray-500 block text-xs uppercase mb-1">Links</span>
                                  <div className="flex flex-wrap gap-4">
                                    <a href={artist.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-[#00f3ff] hover:underline px-3 py-1 bg-[#00f3ff]/10 rounded border border-[#00f3ff]/20">
                                      Professional Website
                                    </a>
                                    {artist.processVideoUrl && (
                                      <a href={artist.processVideoUrl} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline flex items-center gap-1 px-3 py-1 bg-purple-500/10 rounded border border-purple-500/20">
                                        ▶ Process Video
                                      </a>
                                    )}
                                    {artist.governmentIdUrl && (
                                      <a href={artist.governmentIdUrl} target="_blank" rel="noopener noreferrer" className="text-red-400 hover:underline flex items-center gap-1 px-3 py-1 bg-red-500/10 rounded border border-red-500/20">
                                        🔒 View Govt ID
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                          </div>
                          <div className="flex gap-3">
                            <button onClick={() => handleArtistDecision(artist.uid, "REJECTED")} className="px-6 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg text-sm hover:bg-red-500/20 transition-colors font-medium">Reject</button>
                            <button onClick={() => handleArtistDecision(artist.uid, "APPROVED")} className="px-6 py-2 bg-green-500/10 text-green-400 border border-green-500/30 rounded-lg text-sm hover:bg-green-500/20 transition-colors font-medium">Approve</button>
                          </div>
                        </div>
                        
                        <div className="my-6">
                          <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Artist Statement</h4>
                          <p className="text-gray-300 text-sm bg-white/5 p-4 rounded-xl italic border border-white/5">"{artist.statement}"</p>
                        </div>

                        <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Portfolio Samples</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {artist.portfolioUrls?.map((url, i) => (
                            <div key={i} className="aspect-square bg-cover bg-center rounded-xl border border-white/10 hover:border-white/30 transition-colors" style={{ backgroundImage: `url(${url})` }}></div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "content" && (
              <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400 text-sm bg-white/5">
                      <th className="p-4 font-medium">Image</th>
                      <th className="p-4 font-medium">Title & Medium</th>
                      <th className="p-4 font-medium">Artist ID</th>
                      <th className="p-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {artworks.map(art => (
                      <tr key={art.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-4">
                          <div className="w-16 h-16 rounded-lg bg-cover bg-center border border-white/10" style={{ backgroundImage: `url(${art.imageUrl})` }}></div>
                        </td>
                        <td className="p-4">
                          <div className="text-white font-medium text-lg">{art.title}</div>
                          <div className="text-sm text-[#ffd700]">{art.medium}</div>
                        </td>
                        <td className="p-4 text-sm text-gray-400 font-mono bg-black/20 rounded px-2">{art.artistId.substring(0, 8)}...</td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => handleDeleteArtwork(art.id!)}
                            className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg text-sm hover:bg-red-500/20 transition-colors"
                          >
                            Delete Content
                          </button>
                        </td>
                      </tr>
                    ))}
                    {artworks.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-gray-500">No artworks found on the platform.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "disputes" && (
              <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400 text-sm bg-white/5">
                      <th className="p-4 font-medium">Commission Request</th>
                      <th className="p-4 font-medium">Budget</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium text-right">Admin Override</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.map(comm => (
                      <tr key={comm.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-4">
                          <div className="text-white font-medium">{comm.title}</div>
                          <div className="text-xs text-gray-500 mt-1">Buyer ID: <span className="font-mono bg-black/20 px-1 rounded">{comm.buyerId.substring(0, 8)}...</span></div>
                        </td>
                        <td className="p-4 text-[#ffd700] font-medium">{comm.budget}</td>
                        <td className="p-4">
                          <span className="px-3 py-1 bg-white/10 rounded-full text-xs text-gray-300 capitalize border border-white/10">{comm.status}</span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <button 
                              onClick={() => handleResolveDispute(comm.id!, "refunded")}
                              className="px-3 py-1.5 bg-orange-500/10 text-orange-400 border border-orange-500/30 rounded-lg text-xs hover:bg-orange-500/20 transition-colors"
                            >
                              Refund Buyer
                            </button>
                            <button 
                              onClick={() => handleResolveDispute(comm.id!, "completed")}
                              className="px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/30 rounded-lg text-xs hover:bg-green-500/20 transition-colors"
                            >
                              Release to Artist
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {commissions.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-gray-500">No active escrow transactions found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
