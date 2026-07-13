"use client";

import { motion } from "framer-motion";

export default function AnalyticsStudio() {
  return (
    <div className="glass-dark p-6 rounded-2xl border border-white/10 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Analytics Studio</h2>
        <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">+12% this week</span>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
          <h3 className="text-xs text-gray-500 uppercase mb-1">Profile Views</h3>
          <p className="text-2xl font-bold text-white">1,204</p>
        </div>
        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
          <h3 className="text-xs text-gray-500 uppercase mb-1">Artwork Saves</h3>
          <p className="text-2xl font-bold text-white">342</p>
        </div>
      </div>

      <div className="flex-1 min-h-[150px] bg-black/40 rounded-xl border border-white/5 relative overflow-hidden flex items-end">
        {/* Mock Chart using CSS */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#00f3ff]/20 to-transparent"></div>
        <div className="w-full flex items-end justify-between px-2 h-2/3 pb-2 gap-1 z-10">
          {[40, 60, 30, 80, 50, 90, 70].map((h, i) => (
            <motion.div 
              key={i} 
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="w-full bg-gradient-to-t from-[#00f3ff] to-blue-500 rounded-t-sm opacity-80 hover:opacity-100 transition-opacity"
            ></motion.div>
          ))}
        </div>
      </div>
      
      <button className="w-full mt-6 py-3 border border-white/10 text-white rounded-xl hover:bg-white/5 transition-colors text-sm font-medium">
        View Deep Analytics
      </button>
    </div>
  );
}
