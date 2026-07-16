"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useCart } from "@/lib/contexts/CartContext";
import { getAllArtworks, likeArtwork, addComment, getComments, toggleArtworkCuration, Artwork, Comment } from "@/lib/firebase/artworks";
import AuthModal from "@/components/auth/AuthModal";
import { Star, TrendingUp, Heart } from "lucide-react";

export default function ExploreFeed() {
  const { user, userProfile, userRole } = useAuth();
  const { addToCart } = useCart();
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [expandedArtwork, setExpandedArtwork] = useState<Artwork | null>(null);
  const [commentsMap, setCommentsMap] = useState<Record<string, Comment[]>>({});
  const [newComment, setNewComment] = useState("");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingLike, setPendingLike] = useState<string | null>(null);

  // Category State
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [expandedBestOf, setExpandedBestOf] = useState<"masterpieces" | "topsellers" | "favorites" | null>(null);

  const loadArtworks = async () => {
    const items = await getAllArtworks();
    const reversed = items.reverse();
    setArtworks(reversed); 
    setLoading(false);
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

  const handleToggleCuration = async (art: Artwork) => {
    if (userRole !== "admin" || !art.id) return;
    const newStatus = !art.isCurated;
    await toggleArtworkCuration(art.id, newStatus);
    setArtworks(prev => prev.map(a => a.id === art.id ? { ...a, isCurated: newStatus } : a));
  };

  const toggleComments = async (id: string) => {
    const cmts = await getComments(id);
    setCommentsMap(prev => ({ ...prev, [id]: cmts }));
  };

  const openArtwork = (art: Artwork) => {
    setExpandedArtwork(art);
    toggleComments(art.id!);
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

  // Derived Data
  const categories = Array.from(new Set(artworks.map(a => a.medium)));
  
  const masterpieces = artworks.filter(a => a.isCurated);
  const topSellers = [...artworks].sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0)).slice(0, 10);
  const fanFavorites = [...artworks].sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0)).slice(0, 10);
  
  const categoryArtworks = activeCategory ? artworks.filter(a => a.medium === activeCategory) : artworks;

  const renderArtworkGrid = (gridArtworks: Artwork[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {gridArtworks.map(art => {
        const isLiked = user && art.likes?.includes(user.uid);
        const likesCount = art.likes?.length || 0;

        return (
          <div key={art.id} className="glass-dark overflow-hidden flex flex-col border border-white/5 hover:border-white/20 transition-all duration-300 relative group">
            {userRole === "admin" && (
              <button 
                onClick={(e) => { e.stopPropagation(); handleToggleCuration(art); }}
                className={`absolute top-4 left-4 z-20 px-3 py-1.5 text-xs font-bold rounded-full transition-colors ${art.isCurated ? 'bg-[#EBB34B] text-black' : 'bg-black/60 text-white hover:bg-white/20'}`}
              >
                {art.isCurated ? '★ Featured' : '☆ Feature'}
              </button>
            )}
            
            <div className="overflow-hidden cursor-pointer bg-[#050510]" onClick={() => openArtwork(art)}>
              <div 
                className="w-full aspect-video sm:aspect-[4/3] bg-cover bg-center hover:scale-105 transition-transform duration-700 ease-out"
                style={{ backgroundImage: `url(${art.imageUrl})` }}
              ></div>
            </div>
            
            <div className="p-5 flex flex-col flex-1">
              <div className="flex justify-between items-start mb-2 gap-4">
                <h3 
                  className="text-lg font-bold text-white truncate cursor-pointer hover:text-[#EBB34B] transition-colors" 
                  onClick={() => openArtwork(art)}
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
              
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/10">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => handleLike(art.id!)}
                    className={`flex items-center gap-1.5 transition-colors text-sm font-medium ${isLiked ? 'text-red-500' : 'text-gray-400 hover:text-white'}`}
                  >
                    <span className="text-lg">{isLiked ? '♥' : '♡'}</span> {likesCount}
                  </button>
                  <button 
                    onClick={() => openArtwork(art)}
                    className="text-gray-400 hover:text-white transition-colors text-sm font-medium flex items-center gap-1.5"
                  >
                    💬 Details
                  </button>
                </div>
                {(art.salesCount || 0) > 0 && (
                  <span className="text-xs text-gray-500">{art.salesCount} sold</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
      {gridArtworks.length === 0 && (
        <div className="col-span-full py-12 text-center text-gray-500">
          No artworks found in this section.
        </div>
      )}
    </div>
  );

  if (loading) return <div className="text-gray-400 py-20 text-center">Loading Explore Feed...</div>;

  return (
    <div className="w-full pb-32 space-y-24">
      
      {/* Stage 1: Explore the Best of My Portraits */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">Explore the best of <span className="text-[#EBB34B]">My Portraits</span></h2>
          <p className="text-gray-400 max-w-2xl mx-auto">Discover our most exclusive, popular, and beautifully crafted pieces selected by curators and collectors worldwide.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div 
            onClick={() => setExpandedBestOf(expandedBestOf === 'masterpieces' ? null : 'masterpieces')}
            className={`cursor-pointer p-8 rounded-2xl border transition-all duration-500 ${expandedBestOf === 'masterpieces' ? 'bg-[#EBB34B]/10 border-[#EBB34B] shadow-[0_0_30px_rgba(235,179,75,0.15)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
          >
            <Star className={`w-8 h-8 mb-4 ${expandedBestOf === 'masterpieces' ? 'text-[#EBB34B]' : 'text-gray-400'}`} />
            <h3 className="text-2xl font-bold text-white mb-2">Masterpieces</h3>
            <p className="text-gray-400 text-sm">Hand-selected by our curators.</p>
          </div>
          
          <div 
            onClick={() => setExpandedBestOf(expandedBestOf === 'topsellers' ? null : 'topsellers')}
            className={`cursor-pointer p-8 rounded-2xl border transition-all duration-500 ${expandedBestOf === 'topsellers' ? 'bg-[#EBB34B]/10 border-[#EBB34B] shadow-[0_0_30px_rgba(235,179,75,0.15)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
          >
            <TrendingUp className={`w-8 h-8 mb-4 ${expandedBestOf === 'topsellers' ? 'text-[#EBB34B]' : 'text-gray-400'}`} />
            <h3 className="text-2xl font-bold text-white mb-2">Top Sellers</h3>
            <p className="text-gray-400 text-sm">Most purchased artworks.</p>
          </div>
          
          <div 
            onClick={() => setExpandedBestOf(expandedBestOf === 'favorites' ? null : 'favorites')}
            className={`cursor-pointer p-8 rounded-2xl border transition-all duration-500 ${expandedBestOf === 'favorites' ? 'bg-[#EBB34B]/10 border-[#EBB34B] shadow-[0_0_30px_rgba(235,179,75,0.15)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
          >
            <Heart className={`w-8 h-8 mb-4 ${expandedBestOf === 'favorites' ? 'text-[#EBB34B]' : 'text-gray-400'}`} />
            <h3 className="text-2xl font-bold text-white mb-2">Fan Favorites</h3>
            <p className="text-gray-400 text-sm">Highest rated by the community.</p>
          </div>
        </div>

        <div className="transition-all duration-500">
          {expandedBestOf === 'masterpieces' && renderArtworkGrid(masterpieces)}
          {expandedBestOf === 'topsellers' && renderArtworkGrid(topSellers)}
          {expandedBestOf === 'favorites' && renderArtworkGrid(fanFavorites)}
        </div>
      </section>

      {/* Stage 2: Browse by Category */}
      <section>
        <div className="flex flex-col items-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-8">Browse by category</h2>
          <div className="flex flex-wrap justify-center gap-3">
            <button 
              onClick={() => setActiveCategory(null)}
              className={`px-6 py-3 rounded-full text-sm font-bold transition-all ${!activeCategory ? 'bg-white text-black scale-105' : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'}`}
            >
              All Mediums
            </button>
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-3 rounded-full text-sm font-bold transition-all ${activeCategory === cat ? 'bg-white text-black scale-105' : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        
        {renderArtworkGrid(categoryArtworks)}
      </section>

      {/* Stage 3: What's New */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">What's new on My Portraits</h2>
          <p className="text-gray-400">The latest creations added to the marketplace.</p>
        </div>
        {renderArtworkGrid(artworks)}
      </section>


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
      
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} redirectOnLogin={false} />

    </div>
  );
}
