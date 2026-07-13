"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import NoiseBackground from "@/components/background/NoiseBackground";
import Link from "next/link";
import { useRouter } from "next/navigation";
import FeedModule from "@/components/dashboard/FeedModule";

export default function Feed() {
  const { userRole, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && userRole === "artist") {
      router.push("/dashboard");
    }
  }, [userRole, authLoading, router]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0A0A0A]">
      <NoiseBackground />
      
      <div className="relative z-10 p-4 md:p-8 max-w-3xl mx-auto min-h-screen">
        <header className="flex justify-between items-center mb-8 pb-4 border-b border-white/10 sticky top-0 bg-[#0A0A0A]/80 backdrop-blur-xl z-20 pt-4">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
            <span>←</span> Home
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tighter">THE FEED</h1>
        </header>

        <FeedModule />
      </div>
    </main>
  );
}
