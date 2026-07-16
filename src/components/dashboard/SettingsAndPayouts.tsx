"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { getArtistActiveCommissions, markCommissionWithdrawn } from "@/lib/firebase/commissions";
import { updateArtistProfile, getUserProfile, UserProfile } from "@/lib/firebase/users";
import { storage } from "@/lib/firebase/config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function SettingsAndPayouts() {
  const { user } = useAuth();
  
  // Profile State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [statement, setStatement] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Payout State
  const [completedCommissions, setCompletedCommissions] = useState<any[]>([]);
  const [withdrawing, setWithdrawing] = useState(false);
  const [payoutMessage, setPayoutMessage] = useState("");

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    // Load Profile
    const p = await getUserProfile(user.uid);
    if (p) {
      setProfile(p);
      setDisplayName(p.displayName || p.legalName || "");
      setPhone(p.phone || "");
      setStatement(p.statement || "");
      setProfilePictureUrl(p.profilePictureUrl || "");
    }

    // Load Commissions
    const active = await getArtistActiveCommissions(user.uid);
    // Filter to only completed commissions
    const completed = active.filter(c => c.status === "completed");
    setCompletedCommissions(completed);
  };

  const availableBalance = completedCommissions
    .filter(c => c.payoutStatus !== "withdrawn")
    .reduce((sum, c) => sum + (c.agreedBudget || 0), 0);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSavingProfile(true);
    setProfileMessage("");
    try {
      await updateArtistProfile(user.uid, {
        displayName,
        phone,
        statement
      });
      setProfileMessage("Profile updated successfully!");
    } catch (err: any) {
      setProfileMessage("Error updating profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    setSavingProfile(true);
    setProfileMessage("Uploading picture...");
    
    try {
      const storageRef = ref(storage, `artists/${user.uid}/profile_${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      await updateArtistProfile(user.uid, { profilePictureUrl: url });
      setProfilePictureUrl(url);
      setProfileMessage("Profile picture updated!");
    } catch (err) {
      setProfileMessage("Failed to upload picture.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleWithdraw = async () => {
    if (!user || availableBalance === 0) return;
    
    setWithdrawing(true);
    setPayoutMessage("");
    
    try {
      const toWithdraw = completedCommissions.filter(c => c.payoutStatus !== "withdrawn");
      for (const c of toWithdraw) {
        await markCommissionWithdrawn(c.id!);
      }
      
      setPayoutMessage(`Successfully withdrew $${availableBalance} to your linked Stripe account!`);
      await loadData();
    } catch (err) {
      setPayoutMessage("Withdrawal failed. Please try again.");
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[600px]">
      
      {/* Profile Settings Section */}
      <div className="w-full lg:w-1/2 glass-dark border border-white/10 rounded-2xl p-8 overflow-y-auto">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          ⚙️ Profile Settings
        </h2>
        
        <div className="mb-8 flex flex-col items-center sm:flex-row gap-6">
          <div 
            className="w-24 h-24 rounded-full bg-black/50 border border-white/10 flex items-center justify-center bg-cover bg-center overflow-hidden shrink-0"
            style={profilePictureUrl ? { backgroundImage: `url(${profilePictureUrl})` } : {}}
          >
            {!profilePictureUrl && <span className="text-4xl text-gray-500">👤</span>}
          </div>
          <div>
            <h3 className="text-white font-medium mb-2">Profile Picture</h3>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handlePictureUpload}
            />
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={savingProfile}
              className="px-4 py-2 bg-white/10 text-white text-sm font-medium rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              Upload New Photo
            </button>
          </div>
        </div>

        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Display Name</label>
            <input 
              type="text" 
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00f3ff]/50 transition-colors"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Phone Number</label>
            <input 
              type="text" 
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00f3ff]/50 transition-colors"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Artist Statement</label>
            <textarea 
              rows={4}
              value={statement}
              onChange={e => setStatement(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00f3ff]/50 transition-colors resize-none"
            />
          </div>

          <button 
            type="submit" 
            disabled={savingProfile}
            className="w-full py-4 bg-[#00f3ff] text-black hover:bg-[#00d0dd] font-bold rounded-xl transition-colors mt-4 disabled:opacity-50"
          >
            {savingProfile ? "Saving..." : "Save Profile Changes"}
          </button>
          
          {profileMessage && (
            <div className={`mt-4 p-3 rounded-xl text-sm text-center ${profileMessage.includes("Error") || profileMessage.includes("Failed") ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-green-500/10 text-green-400 border border-green-500/20"}`}>
              {profileMessage}
            </div>
          )}
        </form>
      </div>

      {/* Payouts Section */}
      <div className="w-full lg:w-1/2 glass-dark border border-white/10 rounded-2xl p-8 flex flex-col">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          💸 Earnings & Payouts
        </h2>

        <div className="bg-[#00f3ff]/10 border border-[#00f3ff]/30 rounded-2xl p-6 mb-8 text-center flex flex-col items-center justify-center">
          <p className="text-[#00f3ff] text-sm font-bold uppercase tracking-widest mb-2">Available Balance</p>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">${availableBalance.toLocaleString()}</h1>
          
          <button 
            onClick={handleWithdraw}
            disabled={withdrawing || availableBalance === 0}
            className="px-8 py-4 bg-white text-black font-bold rounded-xl hover:scale-105 transition-transform shadow-lg disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2 mx-auto"
          >
            {withdrawing ? "Processing..." : "Withdraw to Stripe"}
          </button>
        </div>

        {payoutMessage && (
          <div className="mb-6 p-4 rounded-xl text-sm text-center bg-green-500/10 text-green-400 border border-green-500/20">
            {payoutMessage}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Completed Commissions</h4>
          {completedCommissions.length === 0 ? (
            <p className="text-gray-500 italic">No completed commissions yet.</p>
          ) : (
            <div className="space-y-3 pr-2">
              {completedCommissions.map(c => (
                <div key={c.id} className="bg-white/5 border border-white/10 p-4 rounded-xl flex justify-between items-center">
                  <div>
                    <h5 className="text-white font-medium">{c.title}</h5>
                    <p className="text-xs text-gray-400">Collector: {c.buyerName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#00f3ff] font-bold">${c.agreedBudget}</p>
                    <p className={`text-[10px] font-bold uppercase ${c.payoutStatus === 'withdrawn' ? 'text-gray-500' : 'text-green-400'}`}>
                      {c.payoutStatus === 'withdrawn' ? 'Withdrawn' : 'Available'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}
