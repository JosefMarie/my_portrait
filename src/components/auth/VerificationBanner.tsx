"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import { useState, useEffect } from "react";
import { sendEmailVerification } from "firebase/auth";
import { auth } from "@/lib/firebase/config";

export default function VerificationBanner() {
  const { user, loading } = useAuth();
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  
  // We need to check if user exists and if emailVerified is false
  // Because Firebase auth state might not immediately reflect emailVerified after they click the link,
  // typically users have to reload the page or we call user.reload().
  // For simplicity, we just check user.emailVerified on mount/auth state change.
  
  if (loading || !user || user.emailVerified) {
    return null; // Don't show if loading, not logged in, or already verified
  }

  const handleResend = async () => {
    if (!auth.currentUser) return;
    setResendStatus("sending");
    try {
      await sendEmailVerification(auth.currentUser);
      setResendStatus("sent");
    } catch (error) {
      console.error(error);
      setResendStatus("error");
    }
  };

  return (
    <div className="bg-orange-500/20 border-b border-orange-500/30 text-orange-200 px-4 py-3 text-center text-sm backdrop-blur-md sticky top-0 z-50">
      Please verify your email address ({user.email}) to secure your account. 
      <button 
        onClick={handleResend}
        disabled={resendStatus !== "idle"}
        className="ml-4 underline font-medium hover:text-white transition-colors"
      >
        {resendStatus === "idle" && "Resend Email"}
        {resendStatus === "sending" && "Sending..."}
        {resendStatus === "sent" && "Sent!"}
        {resendStatus === "error" && "Error. Try later."}
      </button>
    </div>
  );
}
