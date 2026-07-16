"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { createCommission, getOpenCommissions, Commission } from "@/lib/firebase/commissions";
import NoiseBackground from "@/components/background/NoiseBackground";
import Link from "next/link";
import AuthModal from "@/components/auth/AuthModal";
import { useRouter } from "next/navigation";
import { storage } from "@/lib/firebase/config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function Marketplace() {
  const { user, userRole, loading } = useAuth();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      // Optional: keep it unauthenticated or redirect. The marketplace is public though!
    }
  }, [user, loading, router]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [selectedMediums, setSelectedMediums] = useState<string[]>([]);
  const [customMedium, setCustomMedium] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const loadCommissions = async () => {
    const data = await getOpenCommissions();
    setCommissions(data);
  };

  useEffect(() => {
    loadCommissions();
  }, []);

  const handlePostRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("Please log in to post a request.");
    const finalMedium = [...selectedMediums, customMedium].filter(Boolean).join(", ");
    if (!finalMedium) return alert("Please select or enter at least one medium.");

    setUploading(true);
    let referenceImageUrl = "";
    if (imageFile) {
      if (imageFile.size > 10 * 1024 * 1024) {
        alert("Image must be under 10MB.");
        setUploading(false);
        return;
      }
      try {
        const storageRef = ref(storage, `commissions/references/${user.uid}_${Date.now()}_${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        referenceImageUrl = await getDownloadURL(storageRef);
      } catch (err) {
        alert("Failed to upload reference image.");
        setUploading(false);
        return;
      }
    }

    await createCommission({
      buyerId: user.uid,
      title,
      description,
      budget,
      medium: finalMedium,
      referenceImageUrl: referenceImageUrl || undefined
    });
    
    setTitle("");
    setDescription("");
    setBudget("");
    setSelectedMediums([]);
    setCustomMedium("");
    setImageFile(null);
    setUploading(false);
    loadCommissions();
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0A0A0A]">
      <NoiseBackground />
      
      <div className="relative z-10 p-8 max-w-7xl mx-auto min-h-screen flex flex-col">
        <header className="flex justify-between items-center mb-8 pb-4 border-b border-white/10">
          <h1 className="text-3xl font-bold text-white tracking-tighter">THE MARKETPLACE</h1>
        </header>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Post a Request (Buyers Only) */}
          {userRole !== "artist" && (
            <div className="glass w-full md:w-1/3 p-8 h-fit sticky top-8">
              <h2 className="text-2xl font-bold text-white mb-6">Request a Portrait</h2>
              <form onSubmit={handlePostRequest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                  <input 
                    required
                    type="text" 
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00f3ff]/50 transition-colors"
                    placeholder="e.g. Family Portrait"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Medium</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {["Oil Painting", "Watercolor", "Acrylic", "Charcoal / Pencil", "Digital Art"].map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setSelectedMediums(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          selectedMediums.includes(m) 
                            ? 'bg-[#00f3ff]/20 text-[#00f3ff] border-[#00f3ff]/50' 
                            : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/30'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                  <input 
                    type="text" 
                    value={customMedium}
                    onChange={e => setCustomMedium(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00f3ff]/50 transition-colors"
                    placeholder="Other (e.g. Mixed Media)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Budget</label>
                  <input 
                    required
                    type="text" 
                    value={budget}
                    onChange={e => setBudget(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00f3ff]/50 transition-colors"
                    placeholder="e.g. $500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                  <textarea 
                    required
                    rows={4}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00f3ff]/50 transition-colors resize-none"
                    placeholder="Describe your vision..."
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Reference Photo / Sketch (Optional)</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={e => setImageFile(e.target.files ? e.target.files[0] : null)} 
                    className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#00f3ff]/10 file:text-[#00f3ff] hover:file:bg-[#00f3ff]/20" 
                  />
                </div>
                <button 
                  type="submit"
                  disabled={uploading}
                  className="w-full py-4 bg-[#050510]/80 hover:bg-[#121212] transition-colors border border-[#00f3ff]/20 rounded-xl text-white font-medium shadow-[0_0_20px_rgba(0,243,255,0.05)] mt-4 disabled:opacity-50"
                >
                  {uploading ? "Uploading & Posting..." : "Post Commission"}
                </button>
              </form>
            </div>
          )}

          {/* Open Commissions Board */}
          <div className={`w-full ${userRole !== "artist" ? "md:w-2/3" : ""}`}>
            <h2 className="text-2xl font-bold text-white mb-6">Open Requests</h2>
            
            {commissions.length === 0 ? (
              <div className="glass-dark p-12 text-center text-gray-400">
                No open commissions at the moment.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {commissions.map(comm => (
                  <div key={comm.id} className="glass-dark p-6 flex flex-col justify-between group hover:border-[#00f3ff]/30 transition-colors">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-medium text-white">{comm.title}</h3>
                        <span className="text-[#ffd700] font-bold">{comm.budget}</span>
                      </div>
                      <p className="text-sm text-[#00f3ff] mb-4">{comm.medium}</p>
                      <p className="text-gray-300 mb-6">{comm.description}</p>
                    </div>
                    
                    <div className="flex justify-between items-center border-t border-white/5 pt-4">
                      <span className="text-xs text-gray-500">
                        Posted {new Date(comm.createdAt).toLocaleDateString()}
                      </span>
                      {userRole === "artist" && (
                        <Link 
                          href={`/marketplace/${comm.id}`}
                          className="px-6 py-2 bg-white/5 hover:bg-white/10 transition-colors rounded-lg text-white text-sm border border-white/10"
                        >
                          View Details & Bid
                        </Link>
                      )}
                      {user?.uid === comm.buyerId && (
                        <Link 
                          href={`/marketplace/${comm.id}`}
                          className="px-6 py-2 bg-[#00f3ff]/10 hover:bg-[#00f3ff]/20 text-[#00f3ff] transition-colors rounded-lg text-sm border border-[#00f3ff]/30"
                        >
                          Manage Bids
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </main>
  );
}
