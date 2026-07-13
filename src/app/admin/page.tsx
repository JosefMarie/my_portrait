"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { getAllArtworks, deleteArtwork, Artwork } from "@/lib/firebase/artworks";
import { getOpenCommissions, Commission, updateCommissionStatus } from "@/lib/firebase/commissions";
import { getPendingArtists, updateArtistStatus, UserProfile } from "@/lib/firebase/users";
import { useRouter } from "next/navigation";
import NoiseBackground from "@/components/background/NoiseBackground";
import Link from "next/link";

export default function AdminDashboard() {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();
  
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [pendingArtists, setPendingArtists] = useState<UserProfile[]>([]);
  const [activeTab, setActiveTab] = useState<"content" | "disputes" | "applications">("applications");

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

  if (loading || userRole !== "admin") return <div className="min-h-screen bg-[#0A0A0A]"></div>;

  return (
    <main className="relative min-h-screen bg-[#0A0A0A] overflow-hidden">
      <NoiseBackground />
      
      <div className="relative z-10 p-8 max-w-7xl mx-auto min-h-screen flex flex-col">
        <header className="flex justify-between items-center mb-8 pb-4 border-b border-red-500/30">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
            <span>←</span> Home
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-red-500 tracking-tighter">ADMINISTRATION</h1>
          <div className="text-xs text-red-400 uppercase tracking-widest px-3 py-1 border border-red-500/30 rounded-full bg-red-500/10">
            Superuser Access
          </div>
        </header>

        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
          <button 
            onClick={() => setActiveTab("applications")}
            className={`px-6 py-2 rounded-lg font-medium transition-colors border whitespace-nowrap ${activeTab === "applications" ? "bg-red-500/20 text-red-400 border-red-500/50" : "bg-white/5 text-gray-400 border-white/10 hover:text-white"}`}
          >
            Pending Applications {pendingArtists.length > 0 && <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingArtists.length}</span>}
          </button>
          <button 
            onClick={() => setActiveTab("content")}
            className={`px-6 py-2 rounded-lg font-medium transition-colors border whitespace-nowrap ${activeTab === "content" ? "bg-red-500/20 text-red-400 border-red-500/50" : "bg-white/5 text-gray-400 border-white/10 hover:text-white"}`}
          >
            Content Moderation
          </button>
          <button 
            onClick={() => setActiveTab("disputes")}
            className={`px-6 py-2 rounded-lg font-medium transition-colors border whitespace-nowrap ${activeTab === "disputes" ? "bg-red-500/20 text-red-400 border-red-500/50" : "bg-white/5 text-gray-400 border-white/10 hover:text-white"}`}
          >
            Escrow Disputes
          </button>
        </div>

        <div className="flex-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 overflow-auto">
          
          {activeTab === "applications" && (
            <div>
              <h2 className="text-xl font-bold text-white mb-6">Qualified Artist Review Queue</h2>
              {pendingArtists.length === 0 ? (
                <p className="text-gray-500">No pending applications right now.</p>
              ) : (
                <div className="space-y-6">
                  {pendingArtists.map(artist => (
                    <div key={artist.uid} className="bg-white/5 border border-white/10 p-6 rounded-xl">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-white">{artist.legalName} <span className="text-sm font-normal text-gray-400 ml-2">({artist.email})</span></h3>
                          <a href={artist.websiteUrl} target="_blank" rel="noreferrer" className="text-[#00f3ff] hover:underline text-sm">{artist.websiteUrl}</a>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleArtistDecision(artist.uid, "REJECTED")} className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded text-sm hover:bg-red-500/20">Reject</button>
                          <button onClick={() => handleArtistDecision(artist.uid, "APPROVED")} className="px-4 py-2 bg-green-500/10 text-green-400 border border-green-500/30 rounded text-sm hover:bg-green-500/20">Approve</button>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-1">Artist Statement</h4>
                        <p className="text-gray-300 text-sm">{artist.statement}</p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        {artist.portfolioUrls?.map((url, i) => (
                          <div key={i} className="aspect-square bg-cover bg-center rounded-lg border border-white/10" style={{ backgroundImage: `url(${url})` }}></div>
                        ))}
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-xs text-gray-500">
                        <span>Phone: {artist.phone}</span>
                        <span>Address: {artist.address}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "content" && (
            <div>
              <h2 className="text-xl font-bold text-white mb-6">Flagged Content / Global Portfolio</h2>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 text-sm">
                    <th className="pb-3 font-medium">Image</th>
                    <th className="pb-3 font-medium">Title & Medium</th>
                    <th className="pb-3 font-medium">Artist ID</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {artworks.map(art => (
                    <tr key={art.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-4">
                        <div className="w-12 h-12 rounded bg-cover bg-center" style={{ backgroundImage: `url(${art.imageUrl})` }}></div>
                      </td>
                      <td className="py-4">
                        <div className="text-white font-medium">{art.title}</div>
                        <div className="text-xs text-gray-500">{art.medium}</div>
                      </td>
                      <td className="py-4 text-sm text-gray-400 font-mono">{art.artistId.substring(0, 8)}...</td>
                      <td className="py-4 text-right">
                        <button 
                          onClick={() => handleDeleteArtwork(art.id!)}
                          className="px-4 py-1 bg-red-500/10 text-red-400 border border-red-500/30 rounded text-sm hover:bg-red-500/20"
                        >
                          Delete Content
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "disputes" && (
            <div>
              <h2 className="text-xl font-bold text-white mb-6">Active Escrow Transactions</h2>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 text-sm">
                    <th className="pb-3 font-medium">Commission Request</th>
                    <th className="pb-3 font-medium">Budget</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Admin Override</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map(comm => (
                    <tr key={comm.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-4">
                        <div className="text-white font-medium">{comm.title}</div>
                        <div className="text-xs text-gray-500">Buyer: {comm.buyerId.substring(0, 8)}...</div>
                      </td>
                      <td className="py-4 text-[#ffd700]">{comm.budget}</td>
                      <td className="py-4">
                        <span className="px-2 py-1 bg-white/10 rounded text-xs text-gray-300 capitalize">{comm.status}</span>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button 
                            onClick={() => handleResolveDispute(comm.id!, "refunded")}
                            className="px-3 py-1 bg-orange-500/10 text-orange-400 border border-orange-500/30 rounded text-xs hover:bg-orange-500/20"
                          >
                            Refund Buyer
                          </button>
                          <button 
                            onClick={() => handleResolveDispute(comm.id!, "completed")}
                            className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/30 rounded text-xs hover:bg-green-500/20"
                          >
                            Release to Artist
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
