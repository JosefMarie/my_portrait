"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { getAllArtworks, Artwork } from "@/lib/firebase/artworks";
import * as THREE from "three";
import { Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const ART_GAP = 6;

// Smooth Camera Controller
function CameraController({ activeIndex, isZoomed, viewMode }: { activeIndex: number, isZoomed: boolean, viewMode: "gallery" | "details" }) {
  // In details mode, we shift the camera to the right so the art sits on the left of the screen.
  const targetX = activeIndex * ART_GAP + (viewMode === "details" ? 2.2 : 0);
  const targetZ = viewMode === "details" ? 3.8 : (isZoomed ? 2.8 : 6.0);
  const targetRotY = viewMode === "details" ? 0.05 : 0; // Very subtle angle towards the art

  useFrame((state, delta) => {
    state.camera.position.x = THREE.MathUtils.damp(state.camera.position.x, targetX, 4, delta);
    state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, 0, 4, delta);
    state.camera.position.z = THREE.MathUtils.damp(state.camera.position.z, targetZ, 4, delta);
    state.camera.rotation.y = THREE.MathUtils.damp(state.camera.rotation.y, targetRotY, 4, delta);
  });
  return null;
}

// Individual Floating Artwork
function FramedArtwork({ 
  artwork, 
  position, 
  isActive,
  onClick
}: { 
  artwork: Artwork, 
  position: [number, number, number], 
  isActive: boolean,
  onClick: () => void
}) {
  const proxiedUrl = artwork.imageUrl ? `/api/proxy-image?url=${encodeURIComponent(artwork.imageUrl)}` : "/placeholder.jpg";
  const texture = useTexture(proxiedUrl);
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state, delta) => {
    if (groupRef.current) {
      // Scale up slightly when active
      const targetScale = isActive ? 1.05 : 0.85;
      groupRef.current.scale.setScalar(THREE.MathUtils.damp(groupRef.current.scale.x, targetScale, 4, delta));
      
      // Subtle float effect
      const targetY = position[1] + (isActive ? Math.sin(state.clock.elapsedTime * 1.5) * 0.05 : 0);
      groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, targetY, 4, delta);
      groupRef.current.position.x = position[0];
      groupRef.current.position.z = position[2];
    }
  });

  return (
    <group ref={groupRef} onClick={(e) => { e.stopPropagation(); onClick(); }} onPointerOver={() => { document.body.style.cursor = "pointer" }} onPointerOut={() => { document.body.style.cursor = "default" }}>
      {/* Outer Glow */}
      <mesh position={[0, 0, -0.1]}>
        <planeGeometry args={[2.5, 2.9]} />
        <meshBasicMaterial color="#00f3ff" transparent opacity={isActive ? 0.15 : 0} />
      </mesh>

      {/* The Frame */}
      <mesh position={[0, 0, -0.05]}>
        <boxGeometry args={[2.2, 2.6, 0.1]} />
        <meshStandardMaterial color="#050505" metalness={0.9} roughness={0.1} />
      </mesh>
      
      {/* The Canvas (Image) */}
      <mesh>
        <planeGeometry args={[2, 2.4]} />
        <meshBasicMaterial map={texture} />
      </mesh>

      {/* Dynamic Spotlight */}
      <spotLight 
        position={[0, 4, 3]} 
        angle={0.6} 
        penumbra={0.5} 
        intensity={isActive ? 3 : 0.5} 
        color="#ffffff" 
      />
    </group>
  );
}

export default function VirtualGallery() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [viewMode, setViewMode] = useState<"gallery" | "details">("gallery");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArts = async () => {
      const items = await getAllArtworks();
      setArtworks(items);
      setLoading(false);
    };
    fetchArts();
  }, []);

  // Keyboard Controls
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (viewMode === "details") {
      if (e.key === "Escape") setViewMode("gallery");
      return; // Disable other navigation in details mode
    }

    if (e.key === "ArrowRight") {
      setActiveIndex((prev) => Math.min(prev + 1, artworks.length - 1));
    } else if (e.key === "ArrowLeft") {
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "ArrowUp") {
      setIsZoomed(true);
    } else if (e.key === "ArrowDown") {
      setIsZoomed(false);
    }
  }, [artworks.length, viewMode]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (loading) {
    return <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-[#00f3ff] font-mono animate-pulse">Loading Virtual Gallery...</div>;
  }

  if (artworks.length === 0) {
    return <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-gray-500 font-mono">No artworks available to display.</div>;
  }

  const activeArt = artworks[activeIndex];

  return (
    <main className="relative w-full h-screen bg-[#050505] overflow-hidden select-none">
      
      {/* 3D Canvas */}
      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
          <color attach="background" args={["#050505"]} />
          <ambientLight intensity={0.2} />
          
          <CameraController activeIndex={activeIndex} isZoomed={isZoomed} viewMode={viewMode} />
          
          {artworks.map((art, index) => (
            <Suspense fallback={null} key={art.id}>
              <FramedArtwork 
                artwork={art} 
                position={[index * ART_GAP, 0, 0]} 
                isActive={index === activeIndex}
                onClick={() => {
                  if (viewMode === "details") return;
                  if (activeIndex === index) {
                    setIsZoomed(!isZoomed); // toggle zoom if already active
                  } else {
                    setActiveIndex(index);
                  }
                }}
              />
            </Suspense>
          ))}
        </Canvas>
      </div>

      {/* HTML UI Overlays */}
      <AnimatePresence>
        {viewMode === "gallery" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 z-10"
          >
            {/* Header */}
            <header className="flex justify-between items-center pointer-events-auto">
              <Link href="/" className="px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-lg text-white text-sm font-medium transition-colors border border-white/10">
                ← Exit Gallery
              </Link>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsZoomed(!isZoomed)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-lg text-white text-sm font-medium transition-colors border border-white/10 flex items-center gap-2"
                >
                  {isZoomed ? "🔍 Zoom Out" : "🔍 Zoom In"}
                </button>
              </div>
            </header>

            {/* Center Arrows */}
            <div className="flex justify-between items-center w-full absolute top-1/2 left-0 -translate-y-1/2 px-8 pointer-events-none">
              <button 
                onClick={() => setActiveIndex(prev => Math.max(prev - 1, 0))}
                disabled={activeIndex === 0}
                className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white text-2xl hover:bg-white/10 hover:border-white/30 transition-all disabled:opacity-0 pointer-events-auto"
              >
                ‹
              </button>
              <button 
                onClick={() => setActiveIndex(prev => Math.min(prev + 1, artworks.length - 1))}
                disabled={activeIndex === artworks.length - 1}
                className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white text-2xl hover:bg-white/10 hover:border-white/30 transition-all disabled:opacity-0 pointer-events-auto"
              >
                ›
              </button>
            </div>

            {/* Footer info */}
            <div className="pointer-events-auto flex justify-center w-full absolute bottom-8 left-0">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={activeIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-black/60 backdrop-blur-xl border border-white/10 px-8 py-6 rounded-2xl max-w-2xl text-center shadow-2xl"
                >
                  <h2 className="text-3xl font-bold text-white mb-2">{activeArt.title}</h2>
                  <p className="text-[#00f3ff] text-sm font-medium mb-4 uppercase tracking-widest">{activeArt.medium}</p>
                  
                  <div className="flex justify-center gap-4">
                    <button 
                      onClick={() => setViewMode("details")}
                      className="px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      View Details
                    </button>
                    {activeArt.price && (
                      <button className="px-6 py-2 bg-transparent border border-white/20 text-white font-medium rounded-lg hover:bg-white/5 transition-colors">
                        Buy Original - ${activeArt.price.toLocaleString()}
                      </button>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Controls Hint */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-gray-500 text-xs font-mono tracking-widest pointer-events-none opacity-50">
              USE ARROW KEYS OR CLICK TO NAVIGATE
            </div>
          </motion.div>
        )}

        {viewMode === "details" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-y-0 right-0 w-[45%] bg-black/70 backdrop-blur-3xl border-l border-white/10 p-12 flex flex-col justify-center overflow-y-auto"
          >
            <button 
              onClick={() => setViewMode("gallery")}
              className="absolute top-8 left-8 text-gray-400 hover:text-white transition-colors flex items-center gap-2"
            >
              <span>←</span> Back to Gallery
            </button>

            <motion.div 
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.3, delayChildren: 0.2 } }
              }}
              initial="hidden"
              animate="visible"
              className="max-w-xl"
            >
              <motion.h2 
                variants={{ hidden: { opacity: 0, x: 20 }, visible: { opacity: 1, x: 0 } }}
                className="text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight"
              >
                {activeArt.title}
              </motion.h2>
              <motion.p 
                variants={{ hidden: { opacity: 0, x: 20 }, visible: { opacity: 1, x: 0 } }}
                className="text-[#00f3ff] font-medium tracking-widest uppercase mb-10"
              >
                {activeArt.medium}
              </motion.p>
              
              <div className="space-y-6 text-gray-300 text-lg leading-relaxed mb-12">
                {(() => {
                  const sentences = activeArt.story ? activeArt.story.match(/[^.!?]+[.!?]+/g) || [activeArt.story] : ["No story provided."];
                  return sentences.map((sentence, i) => (
                    <motion.p 
                      key={i}
                      variants={{ 
                        hidden: { opacity: 0, x: 20 }, 
                        visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } } 
                      }}
                    >
                      {sentence.trim()}
                    </motion.p>
                  ));
                })()}
              </div>

              <motion.div 
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8 } } }}
                className="flex items-center gap-6"
              >
                {activeArt.price ? (
                  <button className="px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                    Acquire Original • ${activeArt.price.toLocaleString()}
                  </button>
                ) : (
                  <button className="px-8 py-4 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition-colors border border-white/20">
                    Inquire About Piece
                  </button>
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  );
}
