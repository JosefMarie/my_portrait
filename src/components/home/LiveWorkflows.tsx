"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Eye, MessageCircle, Calendar } from "lucide-react";
import { getActiveWorkflows } from "@/lib/firebase/commissions";

export default function LiveWorkflows() {
  const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

  const mockProjects = [
    {
      id: "mock1",
      artist: "John Doe",
      medium: "Oil on Canvas",
      title: "The Elder's Smile",
      dayText: "Day 5 of 5",
      progress: 100,
      status: "Completed",
      statusColor: "text-emerald-400 bg-emerald-400/10",
      avatar: "https://i.pravatar.cc/150?img=11",
      description: "Proportions and primary structural lines mapped."
    },
    {
      id: "mock2",
      artist: "Jane Doe",
      medium: "Watercolor & Ink",
      title: "Childhood Dreams",
      dayText: "Day 3 of 7",
      progress: 42,
      status: "In Progress",
      statusColor: "text-[#EBB34B] bg-[#EBB34B]/10",
      avatar: "https://i.pravatar.cc/150?img=47",
      description: "Working on the initial color blocking for the foreground."
    },
  ];

  const [projects, setProjects] = useState<any[]>(mockProjects);
  const [activeProjectIndex, setActiveProjectIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWorkflows() {
      try {
        const active = await getActiveWorkflows();
        if (active && active.length > 0) {
          setProjects(active);
        }
      } catch (error) {
        console.error("Error loading active workflows:", error);
      } finally {
        setLoading(false);
      }
    }
    loadWorkflows();
  }, []);

  const activeProject = projects[activeProjectIndex];

  return (
    <section className="w-full max-w-7xl mx-auto px-4 md:px-8 py-24 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1, ease }}
        className="mb-12"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-bold tracking-wider text-[#EBB34B] uppercase">Live Workflows</span>
        </div>
        <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-4">
          Live Drawing Progress
        </h2>
        <p className="text-gray-400 max-w-3xl">
          Follow the creation process step-by-step. Portrait buyers become emotionally invested by watching their commissions grow.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Project List */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          {projects.map((project, index) => {
            const isActive = index === activeProjectIndex;
            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease, delay: index * 0.1 }}
                onClick={() => setActiveProjectIndex(index)}
                className={`p-6 rounded-2xl cursor-pointer transition-all duration-300 ${
                  isActive
                    ? "bg-[#121212] border-2 border-[#EBB34B]"
                    : "bg-white/5 border-2 border-transparent hover:bg-white/10"
                }`}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700">
                      <img src={project.avatar} alt={project.artist} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold text-sm">{project.artist}</h4>
                      <p className="text-gray-400 text-xs">{project.medium}</p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-[10px] font-bold ${project.statusColor}`}>
                    {project.status}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white mb-6">{project.title}</h3>

                <div>
                  <p className="text-xs text-gray-400 mb-2">{project.dayText}</p>
                  <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#EBB34B] transition-all duration-1000 ease-out" 
                      style={{ width: `${project.progress}%` }} 
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Right Column: Project Details */}
        {activeProject && (
          <motion.div
            key={activeProject.id} // Re-animate when project changes
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease }}
            className="lg:col-span-2 glass-dark p-6 md:p-8 flex flex-col"
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10 mb-6">
              <div>
                <p className="text-xs font-bold text-[#EBB34B] tracking-wider mb-2 uppercase">Current Project Progress</p>
                <h2 className="text-2xl font-bold text-white">{activeProject.title}</h2>
              </div>
              <div className="flex items-center gap-3">
                <button className="w-10 h-10 rounded-full bg-[#EBB34B] text-black font-bold text-sm flex items-center justify-center">D1</button>
                <button className="w-10 h-10 rounded-full bg-white/10 text-gray-300 font-bold text-sm flex items-center justify-center hover:bg-white/20 transition-colors">D2</button>
                <button className="w-10 h-10 rounded-full bg-white/10 text-gray-300 font-bold text-sm flex items-center justify-center hover:bg-white/20 transition-colors">D5</button>
              </div>
            </div>

            {/* Content Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
              {/* Image section */}
              <div className="relative rounded-xl overflow-hidden aspect-[4/3] md:aspect-auto">
                <img 
                  src="https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=1000&auto=format&fit=crop" 
                  alt="Paintbrushes and colors" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-4">
                  <button className="flex items-center gap-2 bg-black/60 hover:bg-black/80 backdrop-blur-md px-4 py-2 rounded-lg text-white text-sm transition-colors border border-white/10">
                    <Eye className="w-4 h-4" />
                    Zoom Drawing
                  </button>
                </div>
              </div>

              {/* Details section */}
              <div className="flex flex-col">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-[#EBB34B]">DAY 1 - Sketch & Grid</span>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date().toLocaleDateString("en-US", { month: 'short', day: '2-digit', year: 'numeric' })}
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-3">Workflow Details</h3>
                <p className="text-sm text-gray-300 mb-8 leading-relaxed">
                  {activeProject.description || "Proportions and primary structural lines mapped."}
                </p>

                <div className="bg-white/5 border-l-2 border-[#EBB34B] p-4 rounded-r-lg mb-8">
                  <h4 className="text-xs font-bold text-[#EBB34B] mb-2">Artist Log Note:</h4>
                  <p className="text-sm text-gray-300 italic leading-relaxed">
                    "Shaping the light around the temple is critical today. Using the dry brush technique to establish soft textures."
                  </p>
                </div>

                <div className="mt-auto flex flex-wrap items-center gap-4">
                  <button className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/20 text-white text-sm font-medium hover:bg-white/5 transition-colors">
                    <MessageCircle className="w-4 h-4" />
                    Comment
                  </button>
                  <button className="px-6 py-2.5 rounded-full bg-[#EBB34B] text-black text-sm font-bold hover:scale-105 transition-transform">
                    Support Progress
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
