"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { getAllArtworks, likeArtwork, addComment, getComments, Artwork, Comment } from "@/lib/firebase/artworks";
import AuthModal from "@/components/auth/AuthModal";

export default function FeedModule() {
  const { user } = useAuth();
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [openCommentsFor, setOpenCommentsFor] = useState<string | null>(null);
  const [buyingPrintFor, setBuyingPrintFor] = useState<string | null>(null);
  const [commentsMap, setCommentsMap] = useState<Record<string, Comment[]>>({});
  const [newComment, setNewComment] = useState("");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const loadArtworks = async () => {
    const items = await getAllArtworks();
    setArtworks(items.reverse()); 
    setLoading(false);
  };

  useEffect(() => {
    loadArtworks();
  }, []);

  const handleLike = async (id: string) => {
    if (!user) return alert("Log in to like artworks");
    await likeArtwork(id, user.uid);
    setArtworks(prev => prev.map(art => {
      if (art.id === id) {
        const likes = art.likes || [];
        const newLikes = likes.includes(user.uid) 
          ? likes.filter(u => u !== user.uid) 
          : [...likes, user.uid];
        return { ...art, likes: newLikes };
      }
      return art;
    }));
  };

  const toggleComments = async (id: string) => {
    if (openCommentsFor === id) {
      setOpenCommentsFor(null);
      return;
    }
    setOpenCommentsFor(id);
    const cmts = await getComments(id);
    setCommentsMap(prev => ({ ...prev, [id]: cmts }));
  };

  const handlePostComment = async (e: React.FormEvent, artworkId: string) => {
    e.preventDefault();
    if (!user) return alert("Log in to comment");
    if (!newComment.trim()) return;

    await addComment(artworkId, newComment, user.uid);
    setNewComment("");
    
    const cmts = await getComments(artworkId);
    setCommentsMap(prev => ({ ...prev, [artworkId]: cmts }));
  };

  if (loading) return <div className="text-gray-400 py-10 text-center">Loading Feed...</div>;

  return (
    <div className="w-full">
      <div className="space-y-12 pb-20 max-w-3xl mx-auto">
        {artworks.map(art => {
          const isLiked = user && art.likes?.includes(user.uid);
          const likesCount = art.likes?.length || 0;

          return (
            <div key={art.id} className="glass-dark overflow-hidden flex flex-col border border-white/5 hover:border-white/10 transition-colors">
              <div 
                className="w-full aspect-[4/5] bg-cover bg-center"
                style={{ backgroundImage: `url(${art.imageUrl})` }}
              ></div>
              
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-2xl font-medium text-white">{art.title}</h3>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => handleLike(art.id!)}
                      className={`flex items-center gap-2 transition-colors ${isLiked ? 'text-[#00f3ff]' : 'text-gray-400 hover:text-white'}`}
                    >
                      <span className="text-xl">{isLiked ? '♥' : '♡'}</span> {likesCount}
                    </button>
                    <button 
                      onClick={() => toggleComments(art.id!)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      💬
                    </button>
                    <button 
                      onClick={() => setBuyingPrintFor(art.id!)}
                      className="text-xs font-medium px-4 py-2 bg-[#ffd700]/10 text-[#ffd700] border border-[#ffd700]/30 rounded-lg hover:bg-[#ffd700]/20 transition-colors"
                    >
                      Buy Print ($50)
                    </button>
                  </div>
                </div>
                
                <p className="text-sm text-[#ffd700] mb-3">{art.medium}</p>
                <p className="text-gray-300 leading-relaxed text-sm md:text-base">{art.story}</p>
                
                {openCommentsFor === art.id && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <div className="space-y-4 mb-4 max-h-60 overflow-y-auto pr-2">
                      {commentsMap[art.id]?.length === 0 ? (
                        <p className="text-gray-500 text-sm">No comments yet. Be the first!</p>
                      ) : (
                        commentsMap[art.id]?.map(c => (
                          <div key={c.id} className="bg-white/5 p-3 rounded-lg">
                            <p className="text-xs text-[#00f3ff] mb-1">User {c.userId.slice(0,5)}</p>
                            <p className="text-sm text-gray-200">{c.text}</p>
                          </div>
                        ))
                      )}
                    </div>
                    
                    <form onSubmit={(e) => handlePostComment(e, art.id!)} className="flex gap-2">
                      <input 
                        type="text" 
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        placeholder="Add a comment..." 
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#00f3ff]/50"
                      />
                      <button type="submit" className="px-4 py-2 bg-[#00f3ff]/20 text-[#00f3ff] rounded-lg text-sm hover:bg-[#00f3ff]/30">
                        Post
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {artworks.length === 0 && (
          <div className="text-center text-gray-500 mt-20">
            No artworks have been shared yet.
          </div>
        )}
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      {/* Print-on-Demand Checkout Modal */}
      {buyingPrintFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setBuyingPrintFor(null)}></div>
          <div className="glass relative z-10 w-full max-w-md p-8 text-center border border-white/10">
            <h3 className="text-2xl font-bold text-white mb-2">Order High-Quality Print</h3>
            <p className="text-gray-300 mb-6">You are about to purchase a physical print of this artwork via our Print-on-Demand partner.</p>
            <div className="text-4xl font-bold text-[#ffd700] mb-8">$50.00</div>
            
            <button 
              onClick={() => {
                alert("Mock Print Order Placed! In production, this would route to Stripe & Gelato/Printful.");
                setBuyingPrintFor(null);
              }}
              className="w-full py-4 bg-[#ffd700]/20 hover:bg-[#ffd700]/30 transition-colors border border-[#ffd700]/50 rounded-xl text-[#ffd700] font-bold text-lg mb-4"
            >
              Confirm Print Order
            </button>
            <button 
              onClick={() => setBuyingPrintFor(null)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
