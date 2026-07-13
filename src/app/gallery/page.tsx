"use client";

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls, useTexture, Text } from "@react-three/drei";
import { getAllArtworks, Artwork } from "@/lib/firebase/artworks";
import * as THREE from "three";
import Link from "next/link";
import { Suspense } from "react";

// A single artwork frame in 3D space
function FramedArtwork({ artwork, position, rotation }: { artwork: Artwork, position: [number, number, number], rotation: [number, number, number] }) {
  // Route through our Next.js proxy to bypass Firebase CORS entirely
  const proxiedUrl = artwork.imageUrl ? `/api/proxy-image?url=${encodeURIComponent(artwork.imageUrl)}` : "/placeholder.jpg";
  const texture = useTexture(proxiedUrl);

  return (
    <group position={position} rotation={rotation}>
      {/* The Frame */}
      <mesh position={[0, 0, -0.05]}>
        <boxGeometry args={[2.2, 2.6, 0.1]} />
        <meshStandardMaterial color="#111" roughness={0.8} />
      </mesh>
      
      {/* The Canvas (Image) */}
      <mesh>
        <planeGeometry args={[2, 2.4]} />
        <meshBasicMaterial map={texture} />
      </mesh>

      {/* Spotlight on the artwork */}
      <spotLight 
        position={[0, 3, 2]} 
        angle={0.5} 
        penumbra={0.8} 
        intensity={2} 
        color="#fff" 
        target-position={[0, 0, 0]}
      />

      {/* Title Tag */}
      <Text
        position={[0, -1.5, 0]}
        fontSize={0.1}
        color="#fff"
        anchorX="center"
        anchorY="middle"
      >
        {artwork.title}
      </Text>
      <Text
        position={[0, -1.65, 0]}
        fontSize={0.06}
        color="#ffd700"
        anchorX="center"
        anchorY="middle"
      >
        {artwork.medium}
      </Text>
    </group>
  );
}

// The Main Gallery Room
function VoidGallery({ artworks }: { artworks: Artwork[] }) {
  return (
    <>
      <OrbitControls 
        enableZoom={true} 
        maxDistance={15} 
        minDistance={2} 
        maxPolarAngle={Math.PI / 2 + 0.1} 
      />
      
      <Environment preset="city" />
      <ambientLight intensity={0.1} />

      {/* The Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#050505" roughness={0.1} metalness={0.8} />
      </mesh>

      {/* Render artworks in a circle around the center */}
      {artworks.map((art, index) => {
        const radius = 6;
        const angle = (index / artworks.length) * Math.PI * 2;
        const x = Math.sin(angle) * radius;
        const z = Math.cos(angle) * radius;
        // Face the center
        const rotY = angle + Math.PI; 

        return (
          <Suspense fallback={null} key={art.id}>
            <FramedArtwork 
              artwork={art} 
              position={[x, 0, z]} 
              rotation={[0, rotY, 0]} 
            />
          </Suspense>
        );
      })}
    </>
  );
}

export default function VirtualGallery() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);

  useEffect(() => {
    const fetchArts = async () => {
      const items = await getAllArtworks();
      // Show up to 12 artworks in the gallery for performance
      setArtworks(items.slice(0, 12));
    };
    fetchArts();
  }, []);

  return (
    <main className="relative w-full h-screen bg-[#0A0A0A] overflow-hidden">
      <div className="absolute top-0 left-0 w-full z-10 p-8 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <Link href="/" className="text-gray-400 hover:text-white transition-colors pointer-events-auto flex items-center gap-2">
          <span>←</span> Exit Gallery
        </Link>
        <h1 className="text-2xl font-bold text-white tracking-tighter">THE VOID GALLERY</h1>
        <div className="w-24 text-right text-xs text-gray-500 uppercase tracking-widest">
          {artworks.length} Exhibits
        </div>
      </div>
      
      {/* 3D Canvas */}
      <Canvas camera={{ position: [0, 0, 0], fov: 60 }}>
        <VoidGallery artworks={artworks} />
      </Canvas>
      
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-400 text-sm pointer-events-none opacity-50">
        Drag to look around • Scroll to zoom
      </div>
    </main>
  );
}
