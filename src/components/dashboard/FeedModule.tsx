"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useCart } from "@/lib/contexts/CartContext";
import { getAllArtworks, likeArtwork, addComment, getComments, Artwork, Comment } from "@/lib/firebase/artworks";
import AuthModal from "@/components/auth/AuthModal";

export default function FeedModule() {
  const { user, userProfile } = useAuth();
  const { addToCart } = useCart();
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [openCommentsFor, setOpenCommentsFor] = useState<string | null>(null);
  const [expandedArtwork, setExpandedArtwork] = useState<Artwork | null>(null);
  const [commentsMap, setCommentsMap] = useState<Record<string, Comment[]>>({});
  const [newComment, setNewComment] = useState("");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingLike, setPendingLike] = useState<string | null>(null);

  const loadArtworks = async () => {
    const items = await getAllArtworks();
    const reversed = items.reverse();
    setArtworks(reversed); 
    setLoading(false);
    
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const artworkId = searchParams.get('artworkId');
      if (artworkId) {
        const art = reversed.find(a => a.id === artworkId);
        if (art) {
          setExpandedArtwork(art);
          toggleComments(artworkId);
          
          // Optionally, remove the query param so refresh doesn't keep opening it
          window.history.replaceState({}, '', '/feed');
        }
      }
    }
  };

  useEffect(() => {
    loadArtworks();
  }, []);

  useEffect(() => {
    if (user && pendingLike) {
      handleLike(pendingLike);
      setPendingLike(null);
    }
  }, [user, pendingLike]);

  const handleLike = async (id: string) => {
    if (!user) {
      setPendingLike(id);
      setIsAuthModalOpen(true);
      return;
    }
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
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!newComment.trim()) return;

    await addComment(artworkId, newComment, user.uid);
    setNewComment("");
    
    const cmts = await getComments(artworkId);
    setCommentsMap(prev => ({ ...prev, [artworkId]: cmts }));
  };

  if (loading) return <div className="text-gray-400 py-10 text-center">Loading Feed...</div>;

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-20 max-w-[1600px] mx-auto px-4 md:px-8">
        {artworks.map(art => {
          const isLiked = user && art.likes?.includes(user.uid);
          const likesCount = art.likes?.length || 0;

          return (
            <div key={art.id} className="glass-dark overflow-hidden flex flex-col border border-white/5 hover:border-white/20 transition-all duration-300">
              <div className="overflow-hidden cursor-pointer bg-[#050510]" onClick={() => { setExpandedArtwork(art); toggleComments(art.id!); }}>
                <div 
                  className="w-full aspect-video sm:aspect-[4/3] bg-cover bg-center hover:scale-105 transition-transform duration-700 ease-out"
                  style={{ backgroundImage: `url(${art.imageUrl})` }}
                ></div>
              </div>
              
              <div className="p-5 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-2 gap-4">
                  <h3 
                    className="text-lg font-bold text-white truncate cursor-pointer hover:text-[#EBB34B] transition-colors" 
                    onClick={() => { setExpandedArtwork(art); toggleComments(art.id!); }}
                  >
                    {art.title}
                  </h3>
                  <button 
                    onClick={() => addToCart(art)}
                    className="text-xs font-bold px-3 py-2 bg-[#EBB34B] text-black rounded-lg hover:scale-105 transition-transform shrink-0"
                  >
                    Add to Cart
                  </button>
                </div>
                
                <p className="text-xs text-[#EBB34B] font-medium mb-3">{art.medium}</p>
                <p className="text-gray-400 text-sm line-clamp-3 mb-6">{art.story}</p>
                
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/10">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => handleLike(art.id!)}
                      className={`flex items-center gap-1.5 transition-colors text-sm font-medium ${isLiked ? 'text-red-500' : 'text-gray-400 hover:text-white'}`}
                    >
                      <span className="text-lg">{isLiked ? '♥' : '♡'}</span> {likesCount}
                    </button>
                    <button 
                      onClick={() => { setExpandedArtwork(art); toggleComments(art.id!); }}
                      className="text-gray-400 hover:text-white transition-colors text-sm font-medium flex items-center gap-1.5"
                    >
                      💬 Details
                    </button>
                  </div>
                </div>
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

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} redirectOnLogin={false} />

      {/* Expanded Artwork Modal */}
      {expandedArtwork && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setExpandedArtwork(null)}></div>
          <div className="glass-dark relative z-10 w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row border border-white/10 rounded-2xl">
            <button 
              onClick={() => setExpandedArtwork(null)}
              className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-[#EBB34B] hover:text-black transition-colors"
            >
              ✕
            </button>
            
            <div className="w-full md:w-3/5 bg-black flex items-center justify-center max-h-[40vh] md:max-h-full">
              <img src={expandedArtwork.imageUrl} alt={expandedArtwork.title} className="max-w-full max-h-full object-contain" />
            </div>
            
            <div className="w-full md:w-2/5 flex flex-col p-6 md:p-8 overflow-y-auto max-h-[50vh] md:max-h-[90vh]">
              <h2 className="text-3xl font-bold text-white mb-2">{expandedArtwork.title}</h2>
              <p className="text-[#EBB34B] font-medium mb-6">{expandedArtwork.medium}</p>
              
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
                <button 
                  onClick={() => addToCart(expandedArtwork)}
                  className="flex-1 py-3 bg-[#EBB34B] hover:scale-[1.02] transition-transform text-black font-bold rounded-xl shadow-lg"
                >
                  Add to Cart
                </button>
                <button 
                  onClick={() => handleLike(expandedArtwork.id!)}
                  className={`w-12 h-12 flex items-center justify-center rounded-xl border border-white/10 transition-colors ${user && expandedArtwork.likes?.includes(user.uid) ? 'bg-red-500/20 text-red-500 border-red-500/30' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                >
                  <span className="text-xl">{user && expandedArtwork.likes?.includes(user.uid) ? '♥' : '♡'}</span>
                </button>
              </div>

              <div className="mb-8">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">The Story</h4>
                <p className="text-gray-300 text-sm leading-relaxed">{expandedArtwork.story}</p>
              </div>

              <div className="flex-1 flex flex-col min-h-0">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Comments</h4>
                <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
                  {commentsMap[expandedArtwork.id!]?.length === 0 ? (
                    <p className="text-gray-500 text-sm italic">No comments yet. Be the first to share your thoughts!</p>
                  ) : (
                    commentsMap[expandedArtwork.id!]?.map(c => {
                      const isAuthor = c.userId === user?.uid;
                      return (
                        <div key={c.id} className="bg-white/5 p-3 rounded-xl border border-white/5">
                          <div className="flex items-center gap-2 mb-1">
                            {isAuthor && userProfile?.profilePictureUrl && (
                              <img src={userProfile.profilePictureUrl} alt="Profile" className="w-4 h-4 rounded-full object-cover" />
                            )}
                            <p className="text-xs text-[#EBB34B] font-medium">
                              {isAuthor ? 'You' : `Collector ${c.userId.slice(0,4)}`}
                            </p>
                          </div>
                          <p className="text-sm text-gray-200">{c.text}</p>
                        </div>
                      );
                    })
                  )}
                </div>
                
                <form onSubmit={(e) => handlePostComment(e, expandedArtwork.id!)} className="flex gap-2 mt-auto">
                  <input 
                    type="text" 
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Share your thoughts..." 
                    className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#EBB34B]/50 transition-colors"
                  />
                  <button type="submit" className="px-5 py-3 bg-white/10 text-white font-medium rounded-xl text-sm hover:bg-white/20 transition-colors">
                    Post
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
