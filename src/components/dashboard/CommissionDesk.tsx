"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const MOCK_COMMISSIONS = [
  { id: "1", title: "Corporate CEO Portrait", buyer: "Elena V.", status: "Inquiry", budget: "$2,000" },
  { id: "2", title: "Family Pet Oil Painting", buyer: "Mark T.", status: "Concept", budget: "$800" },
  { id: "3", title: "Abstract Landscape", buyer: "Sarah H.", status: "In Progress", budget: "$3,500" },
];

export default function CommissionDesk() {
  return (
    <div className="glass-dark p-6 rounded-2xl border border-white/10 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Commission Desk</h2>
        <span className="text-xs text-orange-400 bg-orange-500/10 px-2 py-1 rounded-full border border-orange-500/20">3 Active</span>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2 space-y-3">
        {MOCK_COMMISSIONS.map((comm) => (
          <div key={comm.id} className="bg-white/5 border border-white/10 p-4 rounded-xl hover:bg-white/10 transition-colors cursor-pointer group">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-sm font-bold text-white group-hover:text-[#ffd700] transition-colors">{comm.title}</h3>
              <span className="text-[#ffd700] text-sm font-medium">{comm.budget}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400">Buyer: {comm.buyer}</span>
              <span className={`px-2 py-1 rounded border ${
                comm.status === "Inquiry" ? "bg-blue-500/10 text-blue-400 border-blue-500/30" :
                comm.status === "Concept" ? "bg-purple-500/10 text-purple-400 border-purple-500/30" :
                "bg-orange-500/10 text-orange-400 border-orange-500/30"
              }`}>
                {comm.status}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      <button className="w-full mt-4 py-3 bg-[#ffd700]/10 text-[#ffd700] border border-[#ffd700]/20 rounded-xl hover:bg-[#ffd700]/20 transition-colors text-sm font-medium">
        Review New Inquiries
      </button>
    </div>
  );
}
