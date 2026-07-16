"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { getArtworksByArtist, deleteArtwork, addArtwork, Artwork } from "@/lib/firebase/artworks";
import { storage } from "@/lib/firebase/config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { motion, AnimatePresence } from "framer-motion";

export default function PortfolioCurator() {
  const { user } = useAuth();
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Upload Form State
  const [title, setTitle] = useState("");
  const [selectedMediums, setSelectedMediums] = useState<string[]>([]);
  const [customMedium, setCustomMedium] = useState("");
  const [story, setStory] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saleType, setSaleType] = useState<"fixed" | "auction" | "not_for_sale">("not_for_sale");
  const [price, setPrice] = useState("");
  const [auctionEndDate, setAuctionEndDate] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) loadArtworks();
  }, [user]);

  const loadArtworks = async () => {
    if (!user) return;
    const items = await getArtworksByArtist(user.uid);
    setArtworks(items);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setError("Image must be under 10MB.");
        return;
      }
      setImageFile(file);
      setError("");
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!imageFile) {
      setError("Please select an image to upload.");
      return;
    }

    setUploading(true);
    setError("");

    const finalMedium = [...selectedMediums, customMedium].filter(Boolean).join(", ");
    if (!finalMedium) {
      setError("Please select or enter at least one medium.");
      setUploading(false);
      return;
    }

    try {
      // 1. Upload to Firebase Storage
      const storageRef = ref(storage, `artists/${user.uid}/artworks/${Date.now()}_${imageFile.name}`);
      await uploadBytes(storageRef, imageFile);
      const imageUrl = await getDownloadURL(storageRef);

      // 1.5 Auto-Generate AI Tags
      let aiTags: string[] = [];
      try {
        const res = await fetch("/api/vision", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.tags) aiTags = data.tags;
        }
      } catch (e) {
        console.error("Failed to generate AI tags", e);
      }

      // 2. Save to Firestore
      const newArtwork: Artwork = {
        artistId: user.uid,
        title,
        medium: finalMedium,
        story,
        imageUrl,
        aiTags,
        saleType,
      };

      if (saleType !== "not_for_sale" && price) {
        newArtwork.price = Number(price);
      }
      if (saleType === "auction" && auctionEndDate) {
        newArtwork.auctionEndDate = new Date(auctionEndDate).getTime();
      }
      
      await addArtwork(newArtwork);
      
      // Reset & Close
      setTitle("");
      setSelectedMediums([]);
      setCustomMedium("");
      setStory("");
      setSaleType("not_for_sale");
      setPrice("");
      setAuctionEndDate("");
      setImageFile(null);
      setIsModalOpen(false);
      loadArtworks();
    } catch (err: any) {
      setError(err.message || "Failed to upload artwork.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this artwork?")) {
      await deleteArtwork(id);
      loadArtworks();
    }
  };

  return (
    <div className="glass-dark p-6 rounded-2xl border border-white/10 h-full flex flex-col relative z-20">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Portfolio Curator</h2>
        <span className="text-xs text-gray-400">{artworks.length} Pieces</span>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 sm:grid-cols-3 gap-4 pb-4">
        {/* Upload Button Box */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="aspect-square rounded-xl border-2 border-dashed border-white/20 hover:border-[#00f3ff]/50 hover:bg-[#00f3ff]/5 flex flex-col items-center justify-center text-gray-400 hover:text-[#00f3ff] transition-colors"
        >
          <span className="text-3xl mb-2">+</span>
          <span className="text-xs font-medium uppercase tracking-wider">Upload</span>
        </button>

        {artworks.map(art => (
          <div key={art.id} className="aspect-square rounded-xl bg-cover bg-center border border-white/10 relative group overflow-hidden" style={{ backgroundImage: `url(${art.imageUrl})` }}>
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center">
              <span className="text-white text-xs font-bold truncate w-full">{art.title}</span>
              <button 
                onClick={() => handleDelete(art.id!)}
                className="mt-2 text-xs text-red-400 hover:text-red-300 border border-red-500/50 rounded px-2 py-1"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => setIsModalOpen(true)} className="w-full mt-4 py-3 bg-[#00f3ff]/10 text-[#00f3ff] border border-[#00f3ff]/20 rounded-xl hover:bg-[#00f3ff]/20 transition-colors text-sm font-medium">
        Add New Artwork
      </button>

      {/* Upload Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0A0A0A] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl relative max-h-[90vh] flex flex-col"
            >
              {/* Fixed Header */}
              <div className="p-8 pb-6 flex justify-between items-center shrink-0 border-b border-white/5">
                <h2 className="text-2xl font-bold text-white">Upload Artwork</h2>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-red-500/20 hover:border-red-500/50 border border-transparent transition-all"
                >
                  ✕
                </button>
              </div>
              
              {/* Scrollable Content */}
              <div className="p-8 pt-6 overflow-y-auto flex-1 custom-scrollbar">
                {error && <div className="mb-6 p-3 bg-red-500/20 border border-red-500/30 text-red-300 text-sm rounded-lg">{error}</div>}

                <form onSubmit={handleUpload} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Image File *</label>
                  <input type="file" required accept="image/*" onChange={handleFileChange} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#00f3ff]/10 file:text-[#00f3ff] hover:file:bg-[#00f3ff]/20" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Title *</label>
                  <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00f3ff]/50" placeholder="e.g. Midnight Reflection" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Medium *</label>
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
                  <label className="block text-sm font-medium text-gray-300 mb-1">The Story (Required) *</label>
                  <textarea required rows={3} value={story} onChange={e => setStory(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00f3ff]/50 resize-none" placeholder="What inspired this piece? Buyers want to know your creative process." />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Sale Options</label>
                  <div className="flex gap-2 mb-3">
                    {["not_for_sale", "fixed", "auction"].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setSaleType(type as any)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          saleType === type 
                            ? 'bg-[#00f3ff]/20 text-[#00f3ff] border-[#00f3ff]/50' 
                            : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/30'
                        }`}
                      >
                        {type === "not_for_sale" ? "Not for Sale" : type === "fixed" ? "Fixed Price" : "Auction"}
                      </button>
                    ))}
                  </div>
                </div>

                {saleType !== "not_for_sale" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      {saleType === "auction" ? "Starting Bid ($) *" : "Price ($) *"}
                    </label>
                    <input required type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00f3ff]/50" placeholder="e.g. 500" />
                  </div>
                )}

                {saleType === "auction" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Auction End Date *</label>
                    <input required type="datetime-local" value={auctionEndDate} onChange={e => setAuctionEndDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00f3ff]/50 text-sm" />
                  </div>
                )}
                <button type="submit" disabled={uploading} className="w-full py-4 bg-[#00f3ff] text-black hover:bg-[#00d0dd] transition-colors rounded-xl font-bold mt-2 disabled:opacity-50 shadow-[0_0_20px_rgba(0,243,255,0.2)]">
                  {uploading ? "Uploading securely to Vault..." : "Publish to Gallery"}
                </button>
              </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
