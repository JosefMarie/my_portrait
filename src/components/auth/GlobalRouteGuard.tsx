"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";

export default function GlobalRouteGuard() {
  const { user, userRole, verificationStatus, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && user) {
      if (userRole === "artist" && verificationStatus === "INCOMPLETE") {
        // Force them to the onboarding page if they aren't already there
        if (pathname !== "/onboarding/artist") {
          router.push("/onboarding/artist");
        }
      }
    }
  }, [user, userRole, verificationStatus, loading, pathname, router]);

  return null; // This component doesn't render anything visually
}
