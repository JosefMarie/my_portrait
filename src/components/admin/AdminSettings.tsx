"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { updateArtistProfile, getUserProfile, UserProfile } from "@/lib/firebase/users";
import { getPlatformSettings, updatePlatformSettings, PlatformSettings, getSecret, saveSecret } from "@/lib/firebase/settings";
import { storage } from "@/lib/firebase/config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function AdminSettings() {
  const { user } = useAuth();
  
  // Profile State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Settings State
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState("");

  const [openAiKey, setOpenAiKey] = useState("");
  const [verifyingKey, setVerifyingKey] = useState(false);
  const [keyMessage, setKeyMessage] = useState("");

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    const p = await getUserProfile(user.uid);
    if (p) {
      setProfile(p);
      setDisplayName(p.displayName || p.fullName || "");
      setProfilePictureUrl(p.profilePictureUrl || "");
    }
    const s = await getPlatformSettings();
    setSettings(s);
    
    const key = await getSecret("gemini");
    if (key) setOpenAiKey(key);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSavingProfile(true);
    setProfileMessage("");
    try {
      await updateArtistProfile(user.uid, {
        displayName,
        fullName: displayName // Keep them in sync for Admin
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
    } catch (err: any) {
      console.error("Upload error:", err);
      setProfileMessage(`Failed: ${err.message || "Unknown error"}`);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdateSettings = async (newSettings: Partial<PlatformSettings>) => {
    setSavingSettings(true);
    setSettingsMessage("");
    try {
      await updatePlatformSettings(newSettings);
      setSettings(prev => prev ? { ...prev, ...newSettings } : null);
      setSettingsMessage("Settings saved.");
      setTimeout(() => setSettingsMessage(""), 3000);
    } catch (err) {
      setSettingsMessage("Failed to save settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveApiKey = async () => {
    if (!openAiKey.trim()) return;
    setVerifyingKey(true);
    setKeyMessage("Verifying API Key...");
    
    try {
      // Verify against Gemini API
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${openAiKey.trim()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Hello" }] }]
        })
      });
      
      if (res.ok) {
        await saveSecret("gemini", openAiKey.trim());
        setKeyMessage("API Key verified and saved successfully!");
      } else {
        setKeyMessage("Verification failed. Please check the key.");
      }
    } catch (e) {
      setKeyMessage("Network error during verification.");
    } finally {
      setVerifyingKey(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[600px]">
      
      {/* Admin Profile Section */}
      <div className="w-full lg:w-1/2 glass-dark border border-white/10 rounded-2xl p-8 overflow-y-auto">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          👤 Admin Profile
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
            <p className="text-xs text-gray-500 mt-2">This picture will appear in comment threads and other interactions.</p>
          </div>
        </div>

        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Display Name</label>
            <input 
              type="text" 
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500/50 transition-colors"
              placeholder="e.g. Admin Team"
            />
          </div>

          <button 
            type="submit" 
            disabled={savingProfile}
            className="w-full py-4 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 font-bold rounded-xl transition-colors mt-4 disabled:opacity-50"
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

      {/* System Configurations Section */}
      <div className="w-full lg:w-1/2 glass-dark border border-white/10 rounded-2xl p-8 flex flex-col">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          ⚙️ Global System Settings
        </h2>

        {settings ? (
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 p-5 rounded-xl">
              <h3 className="text-white font-medium mb-2">Platform Commission Fee (%)</h3>
              <p className="text-sm text-gray-400 mb-4">The percentage taken from all successful commissions.</p>
              <div className="flex items-center gap-4">
                <input 
                  type="number" 
                  value={settings.commissionFeePercent} 
                  onChange={(e) => setSettings({...settings, commissionFeePercent: Number(e.target.value)})}
                  className="w-24 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white" 
                />
                <button 
                  onClick={() => handleUpdateSettings({ commissionFeePercent: settings.commissionFeePercent })}
                  disabled={savingSettings}
                  className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 disabled:opacity-50"
                >
                  Update
                </button>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 p-5 rounded-xl">
              <h3 className="text-white font-medium mb-2">Auto-Approve Artworks</h3>
              <p className="text-sm text-gray-400 mb-4">If enabled, verified artists can publish artworks without admin review.</p>
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  checked={settings.autoApproveArtists} 
                  onChange={(e) => handleUpdateSettings({ autoApproveArtists: e.target.checked })}
                  className="w-5 h-5 accent-red-500" 
                  disabled={savingSettings}
                />
                <span className="text-white text-sm">Enable auto-approval</span>
              </div>
            </div>
            
            <div className="bg-white/5 border border-white/10 p-5 rounded-xl">
              <h3 className="text-white font-medium mb-2">Maintenance Mode</h3>
              <p className="text-sm text-gray-400 mb-4">Temporarily disable the platform for all non-admin users.</p>
              <button 
                onClick={() => handleUpdateSettings({ maintenanceMode: !settings.maintenanceMode })}
                disabled={savingSettings}
                className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${settings.maintenanceMode ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'}`}
              >
                {settings.maintenanceMode ? "Disable Maintenance Mode" : "Enable Maintenance Mode"}
              </button>
            </div>

            <div className="bg-white/5 border border-[#00f3ff]/30 p-5 rounded-xl shadow-[0_0_20px_rgba(0,243,255,0.05)]">
              <h3 className="text-[#00f3ff] font-medium mb-2 flex items-center gap-2">🤖 Google Gemini API Key (Vision)</h3>
              <p className="text-sm text-gray-400 mb-4">Required for the AI Visual Search and Automatic Tagging features.</p>
              <div className="flex flex-col gap-3">
                <input 
                  type="password" 
                  value={openAiKey}
                  onChange={(e) => setOpenAiKey(e.target.value)}
                  placeholder="AIzaSy..." 
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-[#00f3ff]/50" 
                />
                <button 
                  onClick={handleSaveApiKey}
                  disabled={verifyingKey || !openAiKey}
                  className="w-full px-4 py-3 bg-[#00f3ff]/20 text-[#00f3ff] font-bold rounded-lg hover:bg-[#00f3ff]/30 disabled:opacity-50 transition-colors"
                >
                  {verifyingKey ? "Verifying..." : "Verify & Save API Key"}
                </button>
                {keyMessage && (
                  <p className={`text-sm mt-2 ${keyMessage.includes("failed") || keyMessage.includes("error") ? "text-red-400" : "text-green-400"}`}>
                    {keyMessage}
                  </p>
                )}
              </div>
            </div>

            {settingsMessage && (
              <p className={`text-sm ${settingsMessage.includes("Failed") ? "text-red-400" : "text-green-400"}`}>
                {settingsMessage}
              </p>
            )}

            <p className="text-xs text-gray-500 italic mt-4">
              These settings take effect immediately across the platform.
            </p>
          </div>
        ) : (
          <p className="text-gray-500">Loading settings...</p>
        )}
      </div>
      
    </div>
  );
}
