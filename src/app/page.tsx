"use client";

import NoiseBackground from "@/components/background/NoiseBackground";
import FeaturedArtworks from "@/components/home/FeaturedArtworks";
import LiveWorkflows from "@/components/home/LiveWorkflows";
import Footer from "@/components/layout/Footer";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function Home() {
  // Kinetic language easing from design principles
  const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#0A0A0A] flex flex-col">
      <NoiseBackground />
      
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 p-4 md:p-8 mt-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease }}
          className="max-w-4xl w-full text-center space-y-8"
        >
          <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-bold tracking-tight text-white leading-[1.1]">
            Where Portrait Artistry <br />
            <span className="text-[#EBB34B]">Meets Its Collectors</span>
          </h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease, delay: 0.1 }}
            className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto font-light leading-relaxed"
          >
            A specialized online sanctuary and marketplace for portrait painters, sketchers, and digital artists. Showcase portfolios, handle secure commissions, and discover breathtaking customized art.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8"
          >
            <Link href="/feed" className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#EBB34B] text-black font-semibold flex items-center justify-center gap-2 hover:scale-105 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]">
              Meet Top Artists
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/search" className="w-full sm:w-auto px-8 py-3.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-[12px] text-white font-medium hover:bg-white/10 hover:scale-105 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] flex items-center justify-center">
              Try AI Artwork Search
            </Link>
          </motion.div>
        </motion.div>
      </div>

      <FeaturedArtworks />
      <LiveWorkflows />
      <Footer />
    </main>
  );
}
