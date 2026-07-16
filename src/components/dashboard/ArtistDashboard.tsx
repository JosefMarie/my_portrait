"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import NoiseBackground from "@/components/background/NoiseBackground";
import { motion, AnimatePresence } from "framer-motion";
import AnalyticsStudio from "@/components/dashboard/AnalyticsStudio";
import CommissionDesk from "@/components/dashboard/CommissionDesk";
import PortfolioCurator from "@/components/dashboard/PortfolioCurator";
import AuthenticityHub from "@/components/dashboard/AuthenticityHub";
import ArtworkEngagement from "@/components/dashboard/ArtworkEngagement";
import SettingsAndPayouts from "@/components/dashboard/SettingsAndPayouts";
import { LayoutDashboard, MessageSquare, Briefcase, Settings, LogOut, ChevronLeft, ChevronRight } from "lucide-react";

export default function ArtistDashboard() {
  const { user, userRole, verificationStatus, loading } = useAuth();
  const router = useRouter();
  const [activeWidgets, setActiveWidgets] = useState({
    analytics: true,
    commissions: true,
    portfolio: true,
    authenticity: true
  });

  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/");
      else if (verificationStatus === "INCOMPLETE") router.push("/onboarding/artist");
    }
  }, [user, userRole, verificationStatus, loading, router]);

  const toggleWidget = (widget: keyof typeof activeWidgets) => {
    setActiveWidgets(prev => ({ ...prev, [widget]: !prev[widget] }));
  };

  const handleLogout = async () => {
    const { auth } = await import('@/lib/firebase/config');
    const { signOut } = await import('firebase/auth');
    await signOut(auth);
  };

  if (verificationStatus === "PENDING") {
    return (
      <main className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center relative overflow-hidden p-6">
        <NoiseBackground />
        <div className="relative z-10 glass-dark p-8 max-w-md text-center rounded-2xl">
          <h1 className="text-2xl font-bold text-white mb-4">Application Pending</h1>
          <p className="text-gray-400">
            Your artist application is currently under review by our admin team. Check back later or keep an eye on your email.
          </p>
        </div>
      </main>
    );
  }

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
            <h2 className="text-2xl font-bold text-white tracking-tighter truncate">ARTIST<span className="text-[#00f3ff]">PORTAL</span></h2>
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
            title="Smart Dashboard"
          >
            <LayoutDashboard size={20} className={isSidebarCollapsed ? '' : 'mr-3 shrink-0'} />
            {!isSidebarCollapsed && <span className="truncate">Smart Dashboard</span>}
          </button>
          <button 
            onClick={() => setActiveTab("engagement")}
            className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${activeTab === 'engagement' ? 'bg-[#00f3ff]/10 text-[#00f3ff] font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'} ${isSidebarCollapsed ? 'justify-center' : ''}`}
            title="Artwork Engagement"
          >
            <MessageSquare size={20} className={isSidebarCollapsed ? '' : 'mr-3 shrink-0'} />
            {!isSidebarCollapsed && <span className="truncate">Artwork Engagement</span>}
          </button>
          <button 
            onClick={() => setActiveTab("commissions")}
            className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${activeTab === 'commissions' ? 'bg-[#00f3ff]/10 text-[#00f3ff] font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'} ${isSidebarCollapsed ? 'justify-center' : ''}`}
            title="Commission Queue"
          >
            <Briefcase size={20} className={isSidebarCollapsed ? '' : 'mr-3 shrink-0'} />
            {!isSidebarCollapsed && <span className="truncate">Commission Queue</span>}
          </button>
          <button 
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${activeTab === 'settings' ? 'bg-[#00f3ff]/10 text-[#00f3ff] font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'} ${isSidebarCollapsed ? 'justify-center' : ''}`}
            title="Settings & Payouts"
          >
            <Settings size={20} className={isSidebarCollapsed ? '' : 'mr-3 shrink-0'} />
            {!isSidebarCollapsed && <span className="truncate">Settings & Payouts</span>}
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
          
          {/* Header Controls (Only shown on Dashboard tab) */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-4 border-b border-white/10">
            <h1 className="text-2xl font-bold text-white tracking-tighter">
              {activeTab === "dashboard" && "SMART LAYOUT"}
              {activeTab === "engagement" && "ARTWORK ENGAGEMENT"}
              {activeTab === "commissions" && "COMMISSION QUEUE"}
              {activeTab === "settings" && "SETTINGS & PAYOUTS"}
            </h1>
            
            {activeTab === "dashboard" && (
              <div className="flex flex-wrap gap-2 items-center bg-black/40 p-2 rounded-xl border border-white/5">
                <span className="text-xs text-gray-500 uppercase tracking-widest mr-2 ml-2">Toggle Widgets:</span>
                <button onClick={() => toggleWidget('analytics')} className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${activeWidgets.analytics ? 'bg-white/10 text-white' : 'bg-transparent text-gray-500 hover:text-gray-300'}`}>Analytics</button>
                <button onClick={() => toggleWidget('commissions')} className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${activeWidgets.commissions ? 'bg-white/10 text-white' : 'bg-transparent text-gray-500 hover:text-gray-300'}`}>Commissions</button>
                <button onClick={() => toggleWidget('portfolio')} className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${activeWidgets.portfolio ? 'bg-white/10 text-white' : 'bg-transparent text-gray-500 hover:text-gray-300'}`}>Portfolio</button>
                <button onClick={() => toggleWidget('authenticity')} className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${activeWidgets.authenticity ? 'bg-white/10 text-white' : 'bg-transparent text-gray-500 hover:text-gray-300'}`}>Trust</button>
              </div>
            )}
          </header>

          {/* Tab Content Routing */}
          {activeTab === "dashboard" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[450px]">
              {/* Top-Left: Revenue & Action Required (Golden Triangle) */}
              <div className="col-span-1 lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 h-[450px]">
                <AnimatePresence mode="popLayout">
                  {activeWidgets.commissions && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="h-full">
                      <CommissionDesk />
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <AnimatePresence mode="popLayout">
                  {activeWidgets.analytics && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="h-full">
                      <AnalyticsStudio />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <AnimatePresence mode="popLayout">
                {activeWidgets.portfolio && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="col-span-1 lg:col-span-2 xl:col-span-1 h-[450px]">
                    <PortfolioCurator />
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="popLayout">
                {activeWidgets.authenticity && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="col-span-1 h-[450px]">
                    <AuthenticityHub />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {activeTab === "engagement" && (
            <div className="flex-1 h-full max-h-[800px]">
              <ArtworkEngagement />
            </div>
          )}

          {activeTab === "commissions" && (
            <div className="flex-1 h-full max-h-[800px]">
              <CommissionDesk />
            </div>
          )}

          {activeTab === "settings" && (
            <div className="flex-1 h-full max-h-[800px]">
              <SettingsAndPayouts />
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
