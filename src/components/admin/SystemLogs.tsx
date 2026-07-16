"use client";

import { useState, useEffect } from "react";
import { getLogs, AuditLog } from "@/lib/firebase/logs";
import { Download, Search } from "lucide-react";

export default function SystemLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [search, setSearch] = useState("");

  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await getLogs();
      setLogs(data);
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("Missing or insufficient permissions") || err.code === "permission-denied") {
        setErrorMsg("Missing Firestore Permissions. Please go to your Firebase Console -> Firestore -> Rules and add: match /audit_logs/{document} { allow read, write: if request.auth != null; }");
      } else {
        setErrorMsg("Failed to load logs.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    applyFilters(logs, dateFilter, search);
  }, [dateFilter, search, logs]);

  const applyFilters = (data: AuditLog[], filter: string, q: string) => {
    let filtered = [...data];
    
    // Apply date
    const now = Date.now();
    if (filter === "today") {
      filtered = filtered.filter(l => now - l.createdAt < 24 * 60 * 60 * 1000);
    } else if (filter === "week") {
      filtered = filtered.filter(l => now - l.createdAt < 7 * 24 * 60 * 60 * 1000);
    } else if (filter === "month") {
      filtered = filtered.filter(l => now - l.createdAt < 30 * 24 * 60 * 60 * 1000);
    }

    // Apply search
    if (q) {
      const sq = q.toLowerCase();
      filtered = filtered.filter(l => 
        l.action.toLowerCase().includes(sq) || 
        (l.details || "").toLowerCase().includes(sq) ||
        l.userId.toLowerCase().includes(sq)
      );
    }

    setFilteredLogs(filtered);
  };

  const exportCSV = () => {
    if (filteredLogs.length === 0) return;
    
    const headers = ["Date", "User ID", "Action", "Severity", "Details"];
    const rows = filteredLogs.map(l => [
      new Date(l.createdAt).toISOString(),
      l.userId,
      `"${l.action}"`,
      l.severity,
      `"${(l.details || '').replace(/"/g, '""')}"`
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `system_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case "info": return "text-[#00f3ff] bg-[#00f3ff]/10 border-[#00f3ff]/20";
      case "warning": return "text-[#EBB34B] bg-[#EBB34B]/10 border-[#EBB34B]/20";
      case "error": return "text-red-400 bg-red-400/10 border-red-400/20";
      case "critical": return "text-red-500 bg-red-500/20 border-red-500/50 font-bold animate-pulse";
      default: return "text-gray-400 bg-gray-400/10";
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      
      {/* Filters Bar */}
      <div className="glass-dark border border-white/10 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input 
              type="text" 
              placeholder="Search logs..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#00f3ff]/50 transition-colors"
            />
          </div>
          <select 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#00f3ff]/50 transition-colors [&>option]:bg-black"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">This Month</option>
          </select>
        </div>

        <button 
          onClick={exportCSV}
          disabled={filteredLogs.length === 0}
          className="flex items-center gap-2 px-6 py-2 bg-white text-black text-sm font-bold rounded-xl hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
        >
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="sticky top-0 bg-[#121212] z-10">
              <tr className="border-b border-white/10 text-gray-400 text-xs uppercase tracking-wider">
                <th className="p-4 font-medium">Date & Time</th>
                <th className="p-4 font-medium">User / Actor</th>
                <th className="p-4 font-medium">Action Event</th>
                <th className="p-4 font-medium">Severity</th>
                <th className="p-4 font-medium">Additional Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">Loading system logs...</td>
                </tr>
              ) : errorMsg ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center bg-red-500/10 text-red-400 border border-red-500/20">
                    <p className="font-bold mb-2">Permission Denied</p>
                    <p>{errorMsg}</p>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">No logs found matching your filters.</td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors text-sm">
                    <td className="p-4 whitespace-nowrap text-gray-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4 text-gray-300 font-mono text-xs">
                      {log.userId.length > 20 ? log.userId.substring(0, 8) + '...' : log.userId}
                    </td>
                    <td className="p-4 text-white font-medium">
                      {log.action}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs border ${getSeverityColor(log.severity)} uppercase tracking-wider font-bold`}>
                        {log.severity}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400 text-xs max-w-xs truncate" title={log.details}>
                      {log.details || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-white/10 text-xs text-gray-500 flex justify-between items-center bg-white/5">
          <span>Showing {filteredLogs.length} logs</span>
          <span>{dateFilter === "all" ? "All historical records" : `Filtered by: ${dateFilter}`}</span>
        </div>
      </div>

    </div>
  );
}
