"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/contexts/AuthContext";
import { getArtistActiveCommissions, getCollectorActiveCommissions, updateCommissionMilestone } from "@/lib/firebase/commissions";
import CommissionChat from "@/components/messaging/CommissionChat";
import { storage } from "@/lib/firebase/config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function CommissionDesk() {
  const { user, userRole } = useAuth();
  const [commissions, setCommissions] = useState<any[]>([]);
  const [selectedCommission, setSelectedCommission] = useState<any | null>(null);
  const [milestone, setMilestone] = useState("Concept Sketch");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const loadCommissions = () => {
    if (user) {
      if (userRole === "buyer") {
        getCollectorActiveCommissions(user.uid).then(setCommissions);
      } else {
        getArtistActiveCommissions(user.uid).then(setCommissions);
      }
    }
  };

  useEffect(() => {
    loadCommissions();
  }, [user]);

  const handleUpdateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCommission || !user) return;
    setUploading(true);
    setError("");

    try {
      let imageUrl = selectedCommission.milestoneImageUrl;
      if (imageFile) {
        if (imageFile.size > 10 * 1024 * 1024) {
          throw new Error("Image must be under 10MB.");
        }
        const storageRef = ref(storage, `commissions/${selectedCommission.id}/${Date.now()}_${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      await updateCommissionMilestone(selectedCommission.id, milestone, imageUrl);
      
      setSelectedCommission(null);
      setImageFile(null);
      loadCommissions();
    } catch (err: any) {
      setError(err.message || "Failed to update milestone.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="glass-dark p-6 rounded-2xl border border-white/10 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Commission Desk</h2>
        <span className="text-xs text-orange-400 bg-orange-500/10 px-2 py-1 rounded-full border border-orange-500/20">{commissions.length} Active</span>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2 space-y-3">
        {commissions.length === 0 ? (
          <div className="text-gray-500 text-sm text-center py-4">No active commissions yet.</div>
        ) : (
          commissions.map((comm) => (
            <div 
              key={comm.id} 
              onClick={() => {
                setSelectedCommission(comm);
                setMilestone(comm.milestone || "Concept Sketch");
                setImageFile(null);
                setError("");
              }}
              className="bg-white/5 border border-white/10 p-4 rounded-xl hover:bg-white/10 transition-colors cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-sm font-bold text-white group-hover:text-[#ffd700] transition-colors">{comm.title}</h3>
                <span className="text-[#ffd700] text-sm font-medium">${comm.agreedBudget || comm.budget}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">
                  {userRole === 'buyer' ? `Artist: ${comm.assignedArtistName || 'Pending'}` : `Buyer: ${comm.buyerName}`}
                </span>
                <span className={`px-2 py-1 rounded border capitalize ${
                  comm.status === "completed" ? "bg-green-500/10 text-green-400 border-green-500/30" :
                  comm.status === "in-progress" ? "bg-purple-500/10 text-purple-400 border-purple-500/30" :
                  "bg-orange-500/10 text-orange-400 border-orange-500/30"
                }`}>
                  {comm.status}
                </span>
              </div>
              {comm.milestone && (
                <div className="mt-2 text-[10px] text-gray-500 uppercase tracking-widest">
                  Current Milestone: <span className="text-[#00f3ff] font-bold">{comm.milestone}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      {userRole === "artist" && (
        <button className="w-full mt-4 py-3 bg-[#ffd700]/10 text-[#ffd700] border border-[#ffd700]/20 rounded-xl hover:bg-[#ffd700]/20 transition-colors text-sm font-medium">
          Review New Inquiries
        </button>
      )}

      {/* Update Milestone Modal */}
      <AnimatePresence>
        {selectedCommission && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0A0A0A] border border-white/10 p-8 rounded-2xl w-full max-w-5xl shadow-2xl relative"
            >
              <button onClick={() => setSelectedCommission(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white z-50">✕</button>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[600px]">
                
                {/* Details and Update Column */}
                <div className="flex flex-col h-full overflow-y-auto pr-2">
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedCommission.title}</h2>
                  <p className="text-sm text-gray-400 mb-6">
                    {userRole === "buyer" ? `Artist: ${selectedCommission.assignedArtistName}` : `Collector: ${selectedCommission.buyerName}`}
                  </p>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
                    <h3 className="text-white font-medium mb-2">Current Status: <span className="text-[#00f3ff] uppercase tracking-widest text-xs">{selectedCommission.milestone || 'Concept Sketch'}</span></h3>
                    {selectedCommission.milestoneImageUrl && (
                      <div className="mt-4 rounded-xl overflow-hidden border border-white/10">
                        <img src={selectedCommission.milestoneImageUrl} alt="Milestone progress" className="w-full h-auto object-cover" />
                      </div>
                    )}
                  </div>
                  
                  {userRole === "artist" && selectedCommission.status !== "completed" && (
                    <form onSubmit={handleUpdateMilestone} className="space-y-4 bg-black/40 p-4 rounded-xl border border-white/5">
                      <h3 className="text-sm font-medium text-white mb-2">Update Progress</h3>
                      {error && <div className="mb-2 p-3 bg-red-500/20 border border-red-500/30 text-red-300 text-sm rounded-lg">{error}</div>}
                      
                      <div>
                        <select 
                          value={milestone} 
                          onChange={e => setMilestone(e.target.value)} 
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00f3ff]/50 text-sm"
                        >
                          <option value="Concept Sketch" className="bg-[#121212] text-white">Concept Sketch</option>
                          <option value="Underpainting/Base" className="bg-[#121212] text-white">Underpainting / Base</option>
                          <option value="Refinement" className="bg-[#121212] text-white">Refinement</option>
                          <option value="Final Polish" className="bg-[#121212] text-white">Final Polish</option>
                          <option value="Completed" className="bg-[#121212] text-white">Completed</option>
                        </select>
                      </div>
                      <div>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={e => setImageFile(e.target.files ? e.target.files[0] : null)} 
                          className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#00f3ff]/10 file:text-[#00f3ff] hover:file:bg-[#00f3ff]/20" 
                        />
                      </div>
                      
                      <button 
                        type="submit" 
                        disabled={uploading} 
                        className="w-full py-3 bg-[#00f3ff] text-black hover:bg-[#00d0dd] transition-colors rounded-xl font-bold mt-2 disabled:opacity-50 text-sm"
                      >
                        {uploading ? "Updating..." : "Save Milestone & Notify"}
                      </button>
                    </form>
                  )}
                </div>

                {/* Chat Column */}
                <div className="h-full">
                  <CommissionChat commissionId={selectedCommission.id} />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
