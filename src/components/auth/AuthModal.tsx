"use client";

import { useState } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { UserRole } from "@/lib/firebase/users";
import { useRouter } from "next/navigation";
import { registrationSchema, sanitizeInput, sanitizePreferences } from "@/lib/validations/auth";
import { z } from "zod";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectOnLogin?: boolean;
}

const PREFERENCE_OPTIONS = ["Portrait", "Oil", "Abstract", "Digital", "Sketch"];

export default function AuthModal({ isOpen, onClose, redirectOnLogin = true }: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  
  // Basic Credentials
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("artist");
  
  // Collector specific fields
  const [fullName, setFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [preferences, setPreferences] = useState<string[]>([]);
  
  // Anti-spam
  const [honeypot, setHoneypot] = useState("");

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const togglePreference = (pref: string) => {
    setPreferences(prev => 
      prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    // Bot check
    if (honeypot) {
      console.warn("Bot detected via honeypot.");
      // Fail silently for bots
      onClose();
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const loggedInRole = await signIn(email, password);
        onClose();
        if (redirectOnLogin) {
          if (loggedInRole === "admin") {
            router.push("/admin");
          } else if (loggedInRole === "artist") {
            router.push("/dashboard");
          }
        }
        // Buyer stays on the current page
      } else {
        // Validation for Sign Up
        const formData = {
          role,
          email,
          password,
          fullName,
          displayName,
          preferences
        };

        const result = registrationSchema.safeParse(formData);
        
        if (!result.success) {
          // Format Zod errors into a readable string
          const firstError = result.error.issues[0]?.message || "Validation failed";
          throw new Error(firstError);
        }

        // Sanitization
        const cleanFullName = sanitizeInput(result.data.fullName);
        const cleanDisplayName = sanitizeInput(result.data.displayName);
        const cleanPreferences = sanitizePreferences(result.data.preferences);

        await signUp(
          result.data.email, 
          result.data.password, 
          result.data.role,
          cleanFullName,
          cleanDisplayName,
          cleanPreferences
        );
        
        setSuccessMsg("Account created! Please check your email to verify your account.");
        // We do not close the modal immediately so they can see the success message.
        setTimeout(() => {
          onClose();
          setSuccessMsg("");
        }, 4000);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="glass-dark relative z-10 w-full max-w-md p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
        
        <h2 className="text-2xl font-bold text-white mb-6">
          {isLogin ? "Welcome Back" : "Create an Account"}
        </h2>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm">
            {error}
          </div>
        )}
        
        {successMsg && (
          <div className="mb-4 p-3 rounded-lg bg-green-500/20 border border-green-500/30 text-green-200 text-sm">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* HONEYPOT - Visually hidden from humans */}
          <input 
            type="text" 
            name="customer_code" 
            style={{ display: 'none' }} 
            tabIndex={-1} 
            autoComplete="off" 
            value={honeypot}
            onChange={e => setHoneypot(e.target.value)}
          />

          {!isLogin && (
            <div className="flex gap-4 mb-4">
              <label className={`flex-1 p-3 rounded-xl border text-center cursor-pointer transition-colors ${role === 'artist' ? 'bg-[#00f3ff]/20 border-[#00f3ff]/50 text-[#00f3ff]' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}>
                <input type="radio" name="role" value="artist" checked={role === 'artist'} onChange={() => setRole('artist')} className="hidden" />
                I am an Artist
              </label>
              <label className={`flex-1 p-3 rounded-xl border text-center cursor-pointer transition-colors ${role === 'buyer' ? 'bg-[#00f3ff]/20 border-[#00f3ff]/50 text-[#00f3ff]' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}>
                <input type="radio" name="role" value="buyer" checked={role === 'buyer'} onChange={() => setRole('buyer')} className="hidden" />
                I am a Collector
              </label>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input 
              required
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00f3ff]/50 transition-colors"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <input 
              required
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00f3ff]/50 transition-colors"
              placeholder="••••••••"
            />
            {!isLogin && (
              <p className="text-xs text-gray-500 mt-1">Must be 8+ chars, 1 uppercase, 1 number, 1 symbol.</p>
            )}
          </div>

          {!isLogin && role === "buyer" && (
            <>
              <div className="pt-4 border-t border-white/10">
                <label className="block text-sm font-medium text-gray-300 mb-1">Full Name *</label>
                <input 
                  required
                  type="text" 
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00f3ff]/50 transition-colors"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Display Name (Optional)</label>
                <input 
                  type="text" 
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00f3ff]/50 transition-colors"
                  placeholder="ArtLover99"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Preferred Styles (Optional)</label>
                <div className="flex flex-wrap gap-2">
                  {PREFERENCE_OPTIONS.map(pref => (
                    <button
                      key={pref}
                      type="button"
                      onClick={() => togglePreference(pref)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        preferences.includes(pref) 
                          ? 'bg-[#ffd700]/20 text-[#ffd700] border-[#ffd700]/50' 
                          : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
                      }`}
                    >
                      {pref}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#050510]/80 hover:bg-[#121212] transition-colors border border-[#00f3ff]/20 rounded-xl text-white font-medium shadow-[0_0_20px_rgba(0,243,255,0.05)] mt-6 disabled:opacity-50"
          >
            {loading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
