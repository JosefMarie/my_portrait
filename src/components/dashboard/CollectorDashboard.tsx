"use client";

import { useState } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import NoiseBackground from "@/components/background/NoiseBackground";
import { motion } from "framer-motion";
import CommissionDesk from "@/components/dashboard/CommissionDesk";
import SettingsAndPayouts from "@/components/dashboard/SettingsAndPayouts";
import { LayoutDashboard, Briefcase, Settings, LogOut, ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";

export default function CollectorDashboard() {
  const { userRole, loading } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleLogout = async () => {
    const { auth } = await import('@/lib/firebase/config');
    const { signOut } = await import('firebase/auth');
    await signOut(auth);
    router.push("/");
  };

  if (loading || userRole !== "buyer") return <div className="min-h-screen bg-[#0A0A0A]"></div>;

  return (
    <div className="flex flex-1 h-[calc(100vh-73px)] bg-[#0A0A0A]">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarCollapsed ? 80 : 256 }}
        className="border-r border-white/10 bg-[#0A0A0A] hidden md:flex flex-col relative z-20 shrink-0"
      >
        <div className="p-6 flex items-center justify-between">
          {!isSidebarCollapsed && (
            <h2 className="text-2xl font-bold text-white tracking-tighter truncate">COLLECTOR<span className="text-[#00f3ff]">HUB</span></h2>
          )}
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white mx-auto"
          >
            {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <button 
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${activeTab === 'dashboard' ? 'bg-[#00f3ff]/10 text-[#00f3ff] font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'} ${isSidebarCollapsed ? 'justify-center' : ''}`}
            title="My Collection"
          >
            <LayoutDashboard size={20} className={isSidebarCollapsed ? '' : 'mr-3 shrink-0'} />
            {!isSidebarCollapsed && <span className="truncate">My Collection</span>}
          </button>
          
          <button 
            onClick={() => setActiveTab("commissions")}
            className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${activeTab === 'commissions' ? 'bg-[#00f3ff]/10 text-[#00f3ff] font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'} ${isSidebarCollapsed ? 'justify-center' : ''}`}
            title="Active Commissions"
          >
            <Briefcase size={20} className={isSidebarCollapsed ? '' : 'mr-3 shrink-0'} />
            {!isSidebarCollapsed && <span className="truncate">Active Commissions</span>}
          </button>
          
          <button 
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${activeTab === 'settings' ? 'bg-[#00f3ff]/10 text-[#00f3ff] font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'} ${isSidebarCollapsed ? 'justify-center' : ''}`}
            title="Profile Settings"
          >
            <Settings size={20} className={isSidebarCollapsed ? '' : 'mr-3 shrink-0'} />
            {!isSidebarCollapsed && <span className="truncate">Profile Settings</span>}
          </button>
        </nav>
        <div className="p-6 border-t border-white/10">
          <button 
            onClick={handleLogout}
            className={`w-full flex items-center px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors font-medium ${isSidebarCollapsed ? 'justify-center' : ''}`}
            title="Logout"
          >
            <LogOut size={20} className={isSidebarCollapsed ? '' : 'mr-3 shrink-0'} />
            {!isSidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-y-auto">
        <NoiseBackground />
        
        <div className="relative z-10 p-8 max-w-[1600px] mx-auto h-full flex flex-col">
          
          <header className="mb-8 pb-4 border-b border-white/10">
            <h1 className="text-2xl font-bold text-white tracking-tighter">
              {activeTab === "dashboard" && "MY COLLECTION"}
              {activeTab === "commissions" && "COMMISSIONS"}
              {activeTab === "settings" && "PROFILE SETTINGS"}
            </h1>
          </header>

          {activeTab === "dashboard" && (
            <div className="flex flex-col items-center justify-center h-[500px] glass-dark border border-white/10 rounded-2xl p-8 text-center">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
                <ImageIcon size={32} className="text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Your Private Gallery</h2>
              <p className="text-gray-400 max-w-md mx-auto mb-8">
                This is where all your purchased artworks and completed commissions will live. 
                We are currently building out the secure checkout system.
              </p>
              <button 
                onClick={() => router.push('/marketplace')}
                className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Explore Marketplace
              </button>
            </div>
          )}

          {activeTab === "commissions" && (
            <div className="flex-1 h-full max-h-[800px]">
              {/* Reuse CommissionDesk for Buyers (it already filters appropriately) */}
              <CommissionDesk />
            </div>
          )}

          {activeTab === "settings" && (
            <div className="flex-1 h-full max-h-[800px]">
              {/* Reuse Settings for Buyers */}
              <SettingsAndPayouts />
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
