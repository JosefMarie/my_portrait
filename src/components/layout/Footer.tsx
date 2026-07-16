import { Palette, ShieldCheck, ArrowUpRight } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full bg-[#050510] border-t border-white/5 pt-16 pb-8 relative z-10 mt-24">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          {/* Column 1: Brand */}
          <div className="md:col-span-5 flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <Palette className="w-6 h-6 text-[#EBB34B]" />
              <span className="text-xl font-bold text-white tracking-tight">My Portrait</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
              A specialized online marketplace, portfolio environment, and escrow-backed network dedicated to the classical and modern art of portraiture.
            </p>
          </div>

          {/* Column 2: Platform Links */}
          <div className="md:col-span-3 flex flex-col gap-6">
            <h4 className="text-xs font-bold text-white tracking-wider uppercase">Platform</h4>
            <div className="flex flex-col gap-4">
              <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Explore Artworks</a>
              <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Marketplace Bids</a>
              <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Virtual Exhibitions</a>
              <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Artist Dashboard</a>
            </div>
          </div>

          {/* Column 3: Guarantees */}
          <div className="md:col-span-4 flex flex-col gap-6">
            <h4 className="text-xs font-bold text-white tracking-wider uppercase">Guarantees</h4>
            <div className="bg-[#121216] border border-white/5 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-[#EBB34B]" />
                <h5 className="text-sm font-bold text-[#EBB34B]">Escrow Security</h5>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                All contract commission deposits are kept secure. Payment is only released to the artist upon digital delivery approval.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500">
            © 2026 My Portrait Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-8">
            <a href="#" className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1">
              Instagram <ArrowUpRight className="w-3 h-3" />
            </a>
            <a href="#" className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1">
              Behance <ArrowUpRight className="w-3 h-3" />
            </a>
            <a href="#" className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1">
              Fiverr <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
