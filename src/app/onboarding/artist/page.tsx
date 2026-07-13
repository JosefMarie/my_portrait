"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { submitArtistApplication } from "@/lib/firebase/users";
import { storage } from "@/lib/firebase/config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { artistApplicationSchema, sanitizeInput } from "@/lib/validations/auth";
import NoiseBackground from "@/components/background/NoiseBackground";

export default function ArtistOnboardingPage() {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();

  // Form State
  const [legalName, setLegalName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [statement, setStatement] = useState("");
  
  // Files
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [portfolioFiles, setPortfolioFiles] = useState<File[]>([]);
  
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Simple auth check - we rely on the component mounting to check status.
  // In a real production app, we'd have a HOC or middleware for this.
  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
    if (!loading && userRole !== "artist") {
      router.push("/feed"); // Non-artists don't belong here
    }
  }, [user, loading, userRole, router]);

  const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setError("Signature image must be under 5MB.");
        return;
      }
      setSignatureFile(file);
    }
  };

  const handlePortfolioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const validFiles = files.filter(f => f.size <= 5 * 1024 * 1024);
      if (validFiles.length < files.length) {
        setError("Some files were removed because they exceed the 5MB limit.");
      }
      setPortfolioFiles(prev => [...prev, ...validFiles].slice(0, 3)); // Max 3 for prototype
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (!user) throw new Error("Not authenticated");
      if (!signatureFile) throw new Error("Signature file is required.");
      if (portfolioFiles.length === 0) throw new Error("At least 1 portfolio image is required.");

      // 1. Upload Signature
      const sigRef = ref(storage, `artists/${user.uid}/signature/${signatureFile.name}`);
      await uploadBytes(sigRef, signatureFile);
      const signatureUrl = await getDownloadURL(sigRef);

      // 2. Upload Portfolio (Parallel)
      const portfolioUrls = await Promise.all(
        portfolioFiles.map(async (file) => {
          const pRef = ref(storage, `artists/${user.uid}/portfolio/${file.name}`);
          await uploadBytes(pRef, file);
          return getDownloadURL(pRef);
        })
      );

      // 3. Validate Data with Zod
      const formData = {
        legalName,
        phone,
        address,
        websiteUrl,
        statement,
        signatureUrl,
        portfolioUrls
      };

      const result = artistApplicationSchema.safeParse(formData);
      
      if (!result.success) {
        throw new Error(result.error.issues[0]?.message || "Validation failed");
      }

      // 4. Sanitize text fields
      const cleanLegalName = sanitizeInput(result.data.legalName);
      const cleanPhone = sanitizeInput(result.data.phone);
      const cleanAddress = sanitizeInput(result.data.address);
      const cleanWebsite = sanitizeInput(result.data.websiteUrl); // Basic sanitization, though Zod ensures it's a URL
      const cleanStatement = sanitizeInput(result.data.statement);

      // 5. Submit to Firestore
      await submitArtistApplication(user.uid, {
        legalName: cleanLegalName,
        phone: cleanPhone,
        address: cleanAddress,
        websiteUrl: cleanWebsite,
        statement: cleanStatement,
        signatureUrl: result.data.signatureUrl,
        portfolioUrls: result.data.portfolioUrls
      });

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit application.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) return <div className="min-h-screen bg-[#0A0A0A]"></div>;

  if (success) {
    return (
      <main className="min-h-screen bg-[#0A0A0A] flex items-center justify-center relative overflow-hidden">
        <NoiseBackground />
        <div className="relative z-10 glass-dark p-8 max-w-md text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Application Received</h1>
          <p className="text-gray-300 mb-6">
            Your application is now <span className="text-orange-400 font-bold">PENDING VERIFICATION</span>. 
            Our admin team will review your portfolio and statement. We will notify you via email once you are approved to join the network.
          </p>
          <button 
            onClick={() => router.push("/feed")}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            Browse Feed in Read-Only Mode
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] relative overflow-hidden pb-20">
      <NoiseBackground />
      
      <div className="relative z-10 max-w-3xl mx-auto pt-20 px-6">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-white mb-2">Qualified Artist Application</h1>
          <p className="text-gray-400">Please provide your professional credentials and portfolio for the admin review queue.</p>
        </div>

        <div className="glass-dark p-8 rounded-2xl border border-white/10 shadow-2xl">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Full Legal Name (For Taxes/Payouts) *</label>
                <input 
                  required
                  type="text" 
                  value={legalName}
                  onChange={e => setLegalName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00f3ff]/50 transition-colors"
                  placeholder="Jane Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Verified Phone Number *</label>
                <input 
                  required
                  type="tel" 
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00f3ff]/50 transition-colors"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Studio / Business Address *</label>
              <input 
                required
                type="text" 
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00f3ff]/50 transition-colors"
                placeholder="123 Art St, New York, NY 10001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Professional Website / Social Link *</label>
              <input 
                required
                type="url" 
                value={websiteUrl}
                onChange={e => setWebsiteUrl(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00f3ff]/50 transition-colors"
                placeholder="https://instagram.com/myart"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Artist Statement (Min 200 chars) *
                <span className={`float-right text-xs ${statement.length >= 200 ? 'text-green-400' : 'text-gray-500'}`}>
                  {statement.length} / 200
                </span>
              </label>
              <textarea 
                required
                rows={5}
                value={statement}
                onChange={e => setStatement(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00f3ff]/50 transition-colors resize-none"
                placeholder="Describe your medium, process, and background..."
              />
            </div>

            <div className="pt-6 border-t border-white/10 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Digital Signature (For Authenticity Certificates) *</label>
                <input 
                  type="file" 
                  accept="image/png, image/jpeg"
                  onChange={handleSignatureChange}
                  className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#00f3ff]/10 file:text-[#00f3ff] hover:file:bg-[#00f3ff]/20 transition-colors"
                />
                {signatureFile && <p className="text-xs text-green-400 mt-2">✓ Selected: {signatureFile.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Initial Portfolio (1-3 images for prototype) *</label>
                <input 
                  type="file" 
                  multiple
                  accept="image/png, image/jpeg"
                  onChange={handlePortfolioChange}
                  className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 transition-colors"
                />
                {portfolioFiles.length > 0 && (
                  <p className="text-xs text-green-400 mt-2">✓ Selected {portfolioFiles.length} files.</p>
                )}
              </div>
            </div>

            <div className="pt-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" required className="mt-1" />
                <span className="text-sm text-gray-400">
                  I agree to the <span className="text-white">Artist Code of Conduct</span>. I confirm that all uploaded works are my original creations and I agree to engage in fair play and ethical commission practices.
                </span>
              </label>
            </div>

            <button 
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-[#050510]/80 hover:bg-[#121212] transition-colors border border-[#00f3ff]/20 rounded-xl text-white font-medium shadow-[0_0_20px_rgba(0,243,255,0.05)] mt-8 disabled:opacity-50"
            >
              {submitting ? "Uploading & Submitting Application..." : "Submit Application"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
