"use client";

import { useState, useRef } from "react";
import { getAllArtworks, Artwork } from "@/lib/firebase/artworks";
import NoiseBackground from "@/components/background/NoiseBackground";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function SearchPage() {
  const [dragActive, setDragActive] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<Artwork[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
      startScanning();
    };
    reader.readAsDataURL(file);
  };

  const startScanning = async () => {
    setIsScanning(true);
    setResults([]);
    
    // Simulate AI scanning delay
    await new Promise((resolve) => setTimeout(resolve, 3000));
    
    // Fetch mock results (randomly selecting 3 artworks for simulation)
    const allArtworks = await getAllArtworks();
    const shuffled = allArtworks.sort(() => 0.5 - Math.random());
    setResults(shuffled.slice(0, 3));
    
    setIsScanning(false);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0A0A0A]">
      <NoiseBackground />
      
      <div className="relative z-10 p-8 max-w-7xl mx-auto min-h-screen flex flex-col">
        <header className="flex justify-between items-center mb-12 pb-4 border-b border-white/10">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
            <span>←</span> Home
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tighter">AI VISUAL SEARCH</h1>
          <div className="w-16"></div>
        </header>

        <div className="flex-1 flex flex-col items-center">
          {!image ? (
            <div 
              className={`w-full max-w-2xl h-80 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all ${dragActive ? 'border-[#00f3ff] bg-[#00f3ff]/10 scale-105' : 'border-white/20 hover:border-white/50 glass'}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
            >
              <input ref={inputRef} type="file" className="hidden" accept="image/*" onChange={handleChange} />
              <div className="text-6xl mb-4 opacity-50">🖼️</div>
              <p className="text-xl text-white font-medium mb-2">Drag & Drop an inspiration photo</p>
              <p className="text-sm text-gray-400">or click to browse your files</p>
              <p className="text-xs text-[#00f3ff] mt-6">Our AI will find matching artistic styles.</p>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center">
              {/* Uploaded Image & Scanner */}
              <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-2xl overflow-hidden mb-12 border border-white/10 shadow-2xl">
                <img src={image} alt="Upload" className="w-full h-full object-cover" />
                
                {isScanning && (
                  <motion.div 
                    initial={{ top: 0 }}
                    animate={{ top: "100%" }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
                    className="absolute left-0 right-0 h-1 bg-[#00f3ff] shadow-[0_0_15px_#00f3ff] z-10"
                  />
                )}
                
                {isScanning && (
                  <div className="absolute inset-0 bg-[#00f3ff]/10 animate-pulse z-0 mix-blend-overlay"></div>
                )}
              </div>

              {isScanning && (
                <div className="text-[#00f3ff] text-lg font-mono animate-pulse">
                  Extracting visual embeddings...
                </div>
              )}

              {/* Results */}
              <AnimatePresence>
                {!isScanning && results.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full"
                  >
                    <div className="flex justify-between items-end mb-6">
                      <h2 className="text-2xl font-bold text-white">AI Matches Found</h2>
                      <button onClick={() => setImage(null)} className="text-sm text-gray-400 hover:text-white transition-colors">Start New Search</button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {results.map((art, idx) => (
                        <motion.div 
                          key={art.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.1 }}
                          className="glass-dark overflow-hidden flex flex-col group cursor-pointer"
                        >
                          <div 
                            className="w-full aspect-[4/5] bg-cover bg-center group-hover:scale-105 transition-transform duration-700"
                            style={{ backgroundImage: `url(${art.imageUrl})` }}
                          ></div>
                          <div className="p-6">
                            <h3 className="text-lg font-medium text-white mb-1">{art.title}</h3>
                            <p className="text-sm text-[#ffd700]">{art.medium}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
