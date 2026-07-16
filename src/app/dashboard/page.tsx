"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import ArtistDashboard from "@/components/dashboard/ArtistDashboard";
import CollectorDashboard from "@/components/dashboard/CollectorDashboard";

export default function DashboardPage() {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="min-h-[100vh] bg-[#0A0A0A]"></div>;
  }

  if (userRole === "admin") {
    router.push("/admin");
    return null;
  }

  if (userRole === "artist") {
    return <ArtistDashboard />;
  }

  return <CollectorDashboard />;
}
