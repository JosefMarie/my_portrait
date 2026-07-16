"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getAllArtworks, Artwork } from "@/lib/firebase/artworks";
import { useRouter } from "next/navigation";

export default function FeaturedArtworks() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadArtworks() {
      try {
        const data = await getAllArtworks();
        setArtworks(data);
      } catch (error) {
        console.error("Failed to load artworks:", error);
      } finally {
        setLoading(false);
      }
    }
    loadArtworks();
  }, []);

  const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto mt-24 px-4 md:px-8 py-16 text-center text-gray-400">
        Loading masterpieces...
      </div>
    );
  }

  if (artworks.length === 0) {
    return null; // Don't show the section if there's no art yet
  }

  return (
    <section className="w-full max-w-7xl mx-auto mt-24 px-4 md:px-8 pb-24 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1, ease }}
        className="flex flex-col items-center mb-16 text-center"
      >
        <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-4">
          Discover The <span className="text-[#EBB34B]">Collection</span>
        </h2>
        <p className="text-gray-400 max-w-2xl">
          Explore curated portraits from our global network of masterful painters and digital illustrators.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {artworks.map((artwork, index) => (
          <motion.div
            key={artwork.id || index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, ease, delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => artwork.id && router.push(`/feed?artworkId=${artwork.id}`)}
            className="glass-dark overflow-hidden flex flex-col group cursor-pointer"
          >
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-black/40">
              <img
                src={artwork.imageUrl}
                alt={artwork.title}
                className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent opacity-80" />
            </div>
            
            <div className="p-6 relative z-20 -mt-16">
              <h3 className="text-xl font-bold text-white mb-1 drop-shadow-md">{artwork.title}</h3>
              <p className="text-sm font-medium text-[#EBB34B] mb-3 drop-shadow-md">{artwork.medium}</p>
              <p className="text-sm text-gray-300 line-clamp-2 leading-relaxed">
                {artwork.story}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
