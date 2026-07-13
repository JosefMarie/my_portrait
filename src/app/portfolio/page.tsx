"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { addArtwork, getArtworksByArtist, deleteArtwork, Artwork } from "@/lib/firebase/artworks";
import NoiseBackground from "@/components/background/NoiseBackground";
import { useRouter } from "next/navigation";

export default function Portfolio() {
  const { user, userRole, verificationStatus, loading, logout } = useAuth();
  const router = useRouter();
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [title, setTitle] = useState("");
  const [medium, setMedium] = useState("");
  const [story, setStory] = useState("");
  
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/");
      } else if (userRole === "buyer") {
        router.push("/marketplace");
      } else if (userRole === "artist" && verificationStatus === "INCOMPLETE") {
        router.push("/onboarding/artist");
      } else if (userRole === "artist" && verificationStatus === "PENDING") {
        router.push("/dashboard"); // Dashboard has a pending view, or redirect elsewhere
      }
    }
  }, [user, userRole, verificationStatus, loading, router]);

  useEffect(() => {
    if (user) {
      loadArtworks();
    }
  }, [user]);

  const loadArtworks = async () => {
    if (!user) return;
    const items = await getArtworksByArtist(user.uid);
    setArtworks(items);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    // Using a placeholder image for now since we haven't set up Firebase Storage
    const newArtwork: Artwork = {
      artistId: user.uid,
      title,
      medium,
      story,
      imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400&h=500", // using unsplash portrait placeholder
    };
    
    await addArtwork(newArtwork);
    setTitle("");
    setMedium("");
    setStory("");
    loadArtworks();
  };

  const handleDelete = async (id: string) => {
    await deleteArtwork(id);
    loadArtworks();
  };

  if (loading || !user) return <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-white">Loading...</div>;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0A0A0A]">
      <NoiseBackground />
      
      <div className="relative z-10 p-8 max-w-7xl mx-auto min-h-screen flex flex-col">
        
        {/* Navigation Header */}
        <header className="flex justify-between items-center mb-8 pb-4 border-b border-white/10">
          <button 
            onClick={() => router.push("/")}
            className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <span>←</span> Back to Home
          </button>
          
          <button 
            onClick={logout}
            className="text-red-400 hover:text-red-300 transition-colors px-4 py-2 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10"
          >
            Sign Out
          </button>
        </header>

        <div className="flex flex-col md:flex-row gap-8">
        
        {/* Upload Section */}
        <div className="glass w-full md:w-1/3 p-8 h-fit sticky top-8">
          <h2 className="text-3xl font-bold text-white mb-6">Upload Artwork</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
              <input 
                required
                type="text" 
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00f3ff]/50 transition-colors"
                placeholder="e.g. Midnight Reflection"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Medium</label>
              <input 
                required
                type="text" 
                value={medium}
                onChange={e => setMedium(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00f3ff]/50 transition-colors"
                placeholder="e.g. Oil on Canvas"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">The Story</label>
              <textarea 
                required
                rows={4}
                value={story}
                onChange={e => setStory(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00f3ff]/50 transition-colors resize-none"
                placeholder="What inspired this piece?"
              ></textarea>
            </div>
            <button 
              type="submit"
              className="w-full py-4 bg-[#050510]/80 hover:bg-[#121212] transition-colors border border-[#00f3ff]/20 rounded-xl text-white font-medium shadow-[0_0_20px_rgba(0,243,255,0.05)] mt-4"
            >
              Add to Gallery
            </button>
          </form>
        </div>

        {/* Gallery Section */}
        <div className="w-full md:w-2/3">
          <h2 className="text-3xl font-bold text-white mb-6">Your Gallery</h2>
          
          {artworks.length === 0 ? (
            <div className="glass-dark p-12 text-center text-gray-400">
              Your gallery is empty. Upload your first portrait.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {artworks.map(art => (
                <div key={art.id} className="glass-dark aspect-[3/4] p-6 flex flex-col justify-end relative overflow-hidden group">
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                    style={{ backgroundImage: `url(${art.imageUrl})` }}
                  ></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10"></div>
                  
                  <div className="relative z-20 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]">
                    <h3 className="text-xl font-medium text-white mb-1">{art.title}</h3>
                    <p className="text-sm text-[#00f3ff] mb-2">{art.medium}</p>
                    <p className="text-sm text-gray-300 line-clamp-2">{art.story}</p>
                    
                    <button 
                      onClick={() => handleDelete(art.id!)}
                      className="mt-4 px-4 py-2 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>
    </main>
  );
}
