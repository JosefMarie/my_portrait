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
      
      <div className="relative z-10 p-4 md:p-8 max-w-[1600px] mx-auto min-h-screen">


        <FeedModule />
      </div>
    </main>
  );
}
