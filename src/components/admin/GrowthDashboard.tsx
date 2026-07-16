"use client";

import { useEffect, useState } from "react";
import { getSystemMetrics } from "@/lib/firebase/logs";
import { Users, Image as ImageIcon, ShieldCheck, TrendingUp, Activity } from "lucide-react";

export default function GrowthDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    const m = await getSystemMetrics();
    setMetrics(m);
    setLoading(false);
  };

  if (loading) {
    return <div className="p-12 text-center text-gray-500">Loading system metrics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Users */}
        <div className="glass-dark border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 text-white/5 transform group-hover:scale-110 transition-transform">
            <Users size={120} />
          </div>
          <div className="relative z-10">
            <p className="text-sm text-gray-400 font-medium uppercase tracking-wider mb-1">Total Users</p>
            <h3 className="text-4xl font-bold text-white mb-2">{metrics.totalUsers}</h3>
            <p className="text-xs text-green-400 flex items-center gap-1"><TrendingUp size={12}/> Growing community</p>
          </div>
        </div>

        {/* Total Artworks */}
        <div className="glass-dark border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 text-white/5 transform group-hover:scale-110 transition-transform">
            <ImageIcon size={120} />
          </div>
          <div className="relative z-10">
            <p className="text-sm text-gray-400 font-medium uppercase tracking-wider mb-1">Total Artworks</p>
            <h3 className="text-4xl font-bold text-white mb-2">{metrics.totalArtworks}</h3>
            <p className="text-xs text-[#00f3ff] flex items-center gap-1"><Activity size={12}/> Platform inventory</p>
          </div>
        </div>

        {/* Active Commissions */}
        <div className="glass-dark border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 text-white/5 transform group-hover:scale-110 transition-transform">
            <ShieldCheck size={120} />
          </div>
          <div className="relative z-10">
            <p className="text-sm text-gray-400 font-medium uppercase tracking-wider mb-1">Active Commissions</p>
            <h3 className="text-4xl font-bold text-white mb-2">{metrics.activeCommissions}</h3>
            <p className="text-xs text-[#ffd700] flex items-center gap-1">In progress escrow</p>
          </div>
        </div>

        {/* Platform Volume */}
        <div className="glass-dark border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 text-white/5 transform group-hover:scale-110 transition-transform">
            <span className="text-9xl">$</span>
          </div>
          <div className="relative z-10">
            <p className="text-sm text-gray-400 font-medium uppercase tracking-wider mb-1">Total Volume</p>
            <h3 className="text-4xl font-bold text-white mb-2">${metrics.estimatedVolume.toLocaleString()}</h3>
            <p className="text-xs text-purple-400 flex items-center gap-1">Completed budgets</p>
          </div>
        </div>

      </div>
      
      <div className="glass-dark border border-white/10 rounded-2xl p-8">
        <h3 className="text-lg font-bold text-white mb-4">Platform Overview</h3>
        <p className="text-gray-400">
          The metrics above represent the real-time state of the My Portrait platform. 
          Use these numbers to track engagement, system growth, and overall escrow throughput.
        </p>
        <div className="mt-8 grid grid-cols-2 gap-4 max-w-md">
          <div className="bg-white/5 p-4 rounded-xl border border-white/5">
            <div className="text-sm text-gray-500 mb-1">Total Commission Requests</div>
            <div className="text-2xl font-bold text-white">{metrics.totalCommissions}</div>
          </div>
          <div className="bg-white/5 p-4 rounded-xl border border-white/5">
            <div className="text-sm text-gray-500 mb-1">Completed Commissions</div>
            <div className="text-2xl font-bold text-white">{metrics.completedCommissions}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
