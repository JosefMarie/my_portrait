"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export default function AuthenticityHub() {
  const [generating, setGenerating] = useState(false);
  const [certReady, setCertReady] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setCertReady(false);
    setTimeout(() => {
      setGenerating(false);
      setCertReady(true);
    }, 1500);
  };

  return (
    <div className="glass-dark p-6 rounded-2xl border border-white/10 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Authenticity Hub</h2>
        <span className="text-xs text-purple-400 bg-purple-500/10 px-2 py-1 rounded-full border border-purple-500/20">Trust Center</span>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
        {certReady ? (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="border border-[#ffd700]/30 p-4 rounded-xl bg-[#ffd700]/5 w-full">
            <div className="w-16 h-16 mx-auto bg-white/10 rounded mb-3 flex items-center justify-center">
               {/* Mock QR Code Pattern */}
               <div className="grid grid-cols-3 gap-1 w-10 h-10">
                 {[...Array(9)].map((_, i) => <div key={i} className={`bg-white ${Math.random() > 0.5 ? 'opacity-100' : 'opacity-20'}`}></div>)}
               </div>
            </div>
            <p className="text-[#ffd700] text-sm font-bold mb-1">Certificate Created!</p>
            <p className="text-xs text-gray-400">TX Hash: 0x98f...3a1b</p>
          </motion.div>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-2xl mb-4 border border-white/10">
              📜
            </div>
            <h3 className="text-white font-medium mb-2">Digital Provenance</h3>
            <p className="text-sm text-gray-400 mb-6">
              Generate cryptographic certificates of authenticity (CoA) for your sold artworks to establish immutable provenance.
            </p>
          </>
        )}
      </div>
      
      <button 
        onClick={handleGenerate}
        disabled={generating}
        className="w-full mt-4 py-3 bg-white/5 text-white border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium disabled:opacity-50"
      >
        {generating ? "Generating..." : "Generate Test Certificate"}
      </button>
    </div>
  );
}
