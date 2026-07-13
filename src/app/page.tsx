"use client";

import NoiseBackground from "@/components/background/NoiseBackground";
import AuthButtons from "@/components/home/AuthButtons";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (userRole === "artist") {
        router.push("/dashboard");
      } else if (userRole === "buyer") {
        router.push("/collection");
      } else if (userRole === "admin") {
        router.push("/admin");
      }
    }
  }, [user, userRole, loading, router]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0A0A0A]">
      <NoiseBackground />
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[100dvh] p-4 md:p-8">
        <div className="glass max-w-5xl w-full p-8 md:p-16 text-center space-y-10">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-white">
            PORTRAITS <span className="text-[#00f3ff] opacity-80">•</span> EXPRESSION <span className="text-[#ffd700] opacity-80">•</span> CANVAS
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto font-light leading-relaxed">
            A premium sanctuary for portrait artists. Showcase your work, accept commissions, and grow your reputation in an environment built exclusively for high-end artistry.
          </p>
          
          <AuthButtons />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-5xl w-full">
          {[1, 2, 3].map((item) => (
            <div key={item} className="glass-dark aspect-[3/4] p-8 flex flex-col justify-end relative overflow-hidden group cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10"></div>
              
              <div className="absolute inset-0 bg-white/5 group-hover:scale-105 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"></div>
              
              <div className="relative z-20 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]">
                <h3 className="text-xl font-medium text-white mb-2">Featured Artist {item}</h3>
                <p className="text-sm text-gray-400">Oil on Canvas</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
