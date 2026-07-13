"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { getArtworksByArtist, Artwork } from "@/lib/firebase/artworks";
import { useRouter } from "next/navigation";
import NoiseBackground from "@/components/background/NoiseBackground";
import Link from "next/link";
import { motion } from "framer-motion";

interface DashboardMetrics {
  totalLikes: number;
  totalViews: number; // Mocked based on likes
  totalArtworks: number;
  trendingScore: number;
}

export default function ArtistDashboard() {
  const { user, userRole, verificationStatus, loading } = useAuth();
  const router = useRouter();
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({ totalLikes: 0, totalViews: 0, totalArtworks: 0, trendingScore: 0 });

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/");
      } else if (userRole !== "artist") {
        router.push("/marketplace");
      } else if (verificationStatus === "INCOMPLETE") {
        router.push("/onboarding/artist");
      }
    }
  }, [user, userRole, verificationStatus, loading, router]);

  useEffect(() => {
    if (user && userRole === "artist") {
      loadMetrics();
    }
  }, [user, userRole]);

  const loadMetrics = async () => {
    if (!user) return;
    const items = await getArtworksByArtist(user.uid);
    setArtworks(items);

    let likes = 0;
    items.forEach(art => {
      likes += art.likes?.length || 0;
    });

    const views = likes * 12 + Math.floor(Math.random() * 50); // Mock views
    const score = Math.floor((likes * 5) + (views * 0.1));

    setMetrics({
      totalLikes: likes,
      totalViews: views,
      totalArtworks: items.length,
      trendingScore: score
    });
  };

  if (loading || userRole !== "artist") return <div className="min-h-screen bg-[#0A0A0A]"></div>;

  if (verificationStatus === "PENDING") {
    return (
      <main className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center relative overflow-hidden p-6">
        <NoiseBackground />
        <div className="relative z-10 glass-dark p-8 max-w-md text-center rounded-2xl">
          <h1 className="text-2xl font-bold text-white mb-4">Application Pending</h1>
          <p className="text-gray-400">
            Your artist application is currently under review by our admin team. Check back later or keep an eye on your email.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0A0A0A]">
      <NoiseBackground />
      
      <div className="relative z-10 p-8 max-w-7xl mx-auto min-h-screen flex flex-col">
        <header className="flex justify-between items-center mb-12 pb-4 border-b border-white/10">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
            <span>←</span> Home
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tighter">ARTIST DASHBOARD</h1>
          <div className="w-16"></div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass p-6 text-center">
            <h3 className="text-sm text-gray-400 mb-2 uppercase tracking-widest">Trending Score</h3>
            <div className="text-5xl font-bold text-[#00f3ff] drop-shadow-[0_0_15px_rgba(0,243,255,0.3)]">{metrics.trendingScore}</div>
          </motion.div>
          
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="glass p-6 text-center">
            <h3 className="text-sm text-gray-400 mb-2 uppercase tracking-widest">Total Views</h3>
            <div className="text-4xl font-bold text-white">{metrics.totalViews.toLocaleString()}</div>
          </motion.div>
          
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="glass p-6 text-center">
            <h3 className="text-sm text-gray-400 mb-2 uppercase tracking-widest">Total Likes</h3>
            <div className="text-4xl font-bold text-white">{metrics.totalLikes.toLocaleString()}</div>
          </motion.div>
          
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="glass p-6 text-center">
            <h3 className="text-sm text-gray-400 mb-2 uppercase tracking-widest">Portfolio Size</h3>
            <div className="text-4xl font-bold text-white">{metrics.totalArtworks}</div>
          </motion.div>
        </div>

        <div className="glass-dark p-8 flex-1">
          <h2 className="text-xl font-bold text-white mb-6">Recent Portfolio Performance</h2>
          {artworks.length === 0 ? (
            <p className="text-gray-500">No artworks uploaded yet. Head to your portfolio to start sharing.</p>
          ) : (
            <div className="space-y-4">
              {artworks.map(art => (
                <div key={art.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-cover bg-center rounded-lg" style={{ backgroundImage: `url(${art.imageUrl})` }}></div>
                    <div>
                      <h4 className="text-white font-medium">{art.title}</h4>
                      <p className="text-xs text-[#ffd700]">{art.medium}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-300">{(art.likes?.length || 0)} Likes</div>
                    <div className="text-xs text-gray-500">{(art.likes?.length || 0) * 12 + 5} Views</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
