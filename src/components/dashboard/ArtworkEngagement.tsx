"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { getArtworksByArtist, getComments, addComment, Artwork, Comment } from "@/lib/firebase/artworks";
import { motion } from "framer-motion";

export default function ArtworkEngagement() {
  const { user, userProfile } = useAuth();
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [commentsMap, setCommentsMap] = useState<Record<string, Comment[]>>({});
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [posting, setPosting] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    const artistArtworks = await getArtworksByArtist(user.uid);
    setArtworks(artistArtworks);

    const cmtsMap: Record<string, Comment[]> = {};
    for (const art of artistArtworks) {
      if (art.id) {
        cmtsMap[art.id] = await getComments(art.id);
      }
    }
    setCommentsMap(cmtsMap);
    setLoading(false);
  };

  const handleReply = async (e: React.FormEvent, artworkId: string) => {
    e.preventDefault();
    const text = replyText[artworkId];
    if (!text || !text.trim() || !user) return;

    setPosting(prev => ({ ...prev, [artworkId]: true }));
    try {
      await addComment(artworkId, text, user.uid);
      setReplyText(prev => ({ ...prev, [artworkId]: "" }));
      // Reload comments for this artwork
      const updatedCmts = await getComments(artworkId);
      setCommentsMap(prev => ({ ...prev, [artworkId]: updatedCmts }));
    } finally {
      setPosting(prev => ({ ...prev, [artworkId]: false }));
    }
  };

  if (loading) {
    return <div className="text-gray-400 py-10 text-center">Loading engagement data...</div>;
  }

  if (artworks.length === 0) {
    return (
      <div className="glass-dark border border-white/5 flex-1 rounded-2xl flex flex-col items-center justify-center text-center p-8 h-full min-h-[400px]">
        <span className="text-4xl mb-4">🖼️</span>
        <h2 className="text-2xl font-bold text-white mb-2">No Artworks Yet</h2>
        <p className="text-gray-400 max-w-md">
          Upload some pieces to your portfolio to start getting likes and comments from collectors!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full">
      {artworks.map(art => {
        const comments = commentsMap[art.id!] || [];
        const likesCount = art.likes?.length || 0;
        
        return (
          <div key={art.id} className="glass-dark border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/3 shrink-0">
              <div 
                className="w-full aspect-square rounded-xl bg-cover bg-center border border-white/10"
                style={{ backgroundImage: `url(${art.imageUrl})` }}
              ></div>
            </div>
            
            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-start border-b border-white/10 pb-4 mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{art.title}</h3>
                  <p className="text-sm text-[#00f3ff]">{art.medium}</p>
                </div>
                <div className="bg-red-500/10 text-red-500 border border-red-500/30 px-4 py-2 rounded-xl flex items-center gap-2 font-bold">
                  ♥ {likesCount} Likes
                </div>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[300px] pr-2 space-y-4 mb-4">
                {comments.length === 0 ? (
                  <p className="text-gray-500 text-sm italic">No comments on this piece yet.</p>
                ) : (
                  comments.map(c => {
                    const isAuthor = c.userId === user?.uid;
                    return (
                      <div key={c.id} className={`p-4 rounded-xl border ${isAuthor ? 'bg-[#00f3ff]/5 border-[#00f3ff]/20 ml-8' : 'bg-white/5 border-white/5 mr-8'}`}>
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                            {isAuthor && userProfile?.profilePictureUrl && (
                              <img src={userProfile.profilePictureUrl} alt="Profile" className="w-5 h-5 rounded-full object-cover" />
                            )}
                            <span className={`text-xs font-bold ${isAuthor ? 'text-[#00f3ff]' : 'text-[#ffd700]'}`}>
                              {isAuthor ? 'You (Artist)' : `Collector ${c.userId.slice(0,4)}`}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-gray-200">{c.text}</p>
                      </div>
                    );
                  })
                )}
              </div>

              <form onSubmit={(e) => handleReply(e, art.id!)} className="mt-auto flex gap-2">
                <input 
                  type="text" 
                  value={replyText[art.id!] || ""}
                  onChange={e => setReplyText(prev => ({ ...prev, [art.id!]: e.target.value }))}
                  placeholder="Reply to comments..." 
                  className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#00f3ff]/50 transition-colors"
                />
                <button 
                  type="submit" 
                  disabled={posting[art.id!] || !replyText[art.id!]?.trim()}
                  className="px-6 py-3 bg-[#00f3ff]/10 text-[#00f3ff] border border-[#00f3ff]/20 hover:bg-[#00f3ff]/20 font-medium rounded-xl text-sm transition-colors disabled:opacity-50"
                >
                  {posting[art.id!] ? "Sending..." : "Reply"}
                </button>
              </form>
            </div>
          </div>
        );
      })}
    </div>
  );
}
