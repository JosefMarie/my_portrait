"use client";

import { useState, useEffect, use } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Commission, Bid, getBidsForCommission, submitBid, acceptBid } from "@/lib/firebase/commissions";
import NoiseBackground from "@/components/background/NoiseBackground";
import Link from "next/link";
import { createEscrowPayment } from "@/lib/services/mockStripe";
import { useRouter } from "next/navigation";

export default function CommissionDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, userRole } = useAuth();
  const router = useRouter();
  
  const [commission, setCommission] = useState<Commission | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showCheckoutFor, setShowCheckoutFor] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      const docRef = doc(db, "commissions", id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setCommission({ id: snap.id, ...snap.data() } as Commission);
      }
      
      const bidsData = await getBidsForCommission(id);
      setBids(bidsData);
      setLoading(false);
    };
    fetchDetails();
  }, [id]);

  const handleBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("Log in to bid");
    
    await submitBid({
      commissionId: id,
      artistId: user.uid,
      amount: Number(amount),
      message
    });
    
    setAmount("");
    setMessage("");
    const updatedBids = await getBidsForCommission(id);
    setBids(updatedBids);
  };

  const handleAcceptBid = async (bidId: string, artistId: string, bidAmount: number) => {
    setProcessingPayment(true);
    
    // Simulate Mock Stripe Escrow Payment
    const payment = await createEscrowPayment(bidAmount, user!.uid, artistId);
    console.log("Mock Payment created:", payment);
    
    // Accept bid in DB
    await acceptBid(id, bidId);
    
    setProcessingPayment(false);
    setShowCheckoutFor(null);
    router.push("/marketplace");
  };

  if (loading) return <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">Loading...</div>;
  if (!commission) return <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">Commission not found.</div>;

  const isBuyer = user?.uid === commission.buyerId;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0A0A0A]">
      <NoiseBackground />
      
      <div className="relative z-10 p-8 max-w-5xl mx-auto min-h-screen">
        <Link href="/marketplace" className="text-gray-400 hover:text-white mb-8 inline-block">← Back to Marketplace</Link>
        
        <div className="glass p-12 mb-8">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-4xl font-bold text-white">{commission.title}</h1>
            <span className="text-2xl text-[#ffd700] font-bold">{commission.budget}</span>
          </div>
          <div className="flex gap-4 mb-6">
            <span className="px-4 py-1 bg-white/10 rounded-full text-sm text-[#00f3ff] border border-[#00f3ff]/30">{commission.medium}</span>
            <span className="px-4 py-1 bg-white/10 rounded-full text-sm text-gray-300 border border-white/20 capitalize">{commission.status}</span>
          </div>
          <p className="text-lg text-gray-300">{commission.description}</p>
        </div>

        {/* Bids Section */}
        <h2 className="text-2xl font-bold text-white mb-6">Bids ({bids.length})</h2>
        
        {userRole === "artist" && commission.status === "open" && (
          <form onSubmit={handleBid} className="glass-dark p-6 mb-8 flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm text-gray-400 mb-1">Your Message</label>
              <input required type="text" value={message} onChange={e=>setMessage(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white" placeholder="Why are you a good fit?" />
            </div>
            <div className="w-32">
              <label className="block text-sm text-gray-400 mb-1">Bid Amount</label>
              <input required type="number" value={amount} onChange={e=>setAmount(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white" placeholder="$" />
            </div>
            <button type="submit" className="px-6 py-2 bg-[#00f3ff]/20 text-[#00f3ff] rounded-lg border border-[#00f3ff]/30 hover:bg-[#00f3ff]/30 h-[42px]">Submit Bid</button>
          </form>
        )}

        <div className="space-y-4">
          {bids.map(bid => (
            <div key={bid.id} className={`glass-dark p-6 flex justify-between items-center ${bid.status === 'accepted' ? 'border-[#ffd700]/50 shadow-[0_0_15px_rgba(255,215,0,0.1)]' : ''}`}>
              <div>
                <p className="text-white font-medium mb-1">{bid.message}</p>
                <p className="text-sm text-gray-400">Bid by Artist {bid.artistId.slice(0,6)} • Status: <span className="capitalize">{bid.status}</span></p>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-xl text-[#ffd700] font-bold">${bid.amount}</span>
                
                {isBuyer && commission.status === "open" && (
                  <button 
                    onClick={() => setShowCheckoutFor(bid.id!)}
                    className="px-6 py-2 bg-[#050510] border border-[#00f3ff]/40 text-[#00f3ff] rounded-lg hover:bg-[#121212]"
                  >
                    Accept & Pay
                  </button>
                )}
              </div>
              
              {/* Mock Checkout Modal */}
              {showCheckoutFor === bid.id && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !processingPayment && setShowCheckoutFor(null)}></div>
                  <div className="glass relative z-10 w-full max-w-md p-8 text-center">
                    <h3 className="text-2xl font-bold text-white mb-2">Stripe Checkout (Mock)</h3>
                    <p className="text-gray-300 mb-6">You are about to deposit <span className="text-[#ffd700] font-bold">${bid.amount}</span> into escrow.</p>
                    
                    <button 
                      onClick={() => handleAcceptBid(bid.id!, bid.artistId, bid.amount)}
                      disabled={processingPayment}
                      className="w-full py-4 bg-[#00f3ff]/20 text-white font-bold rounded-xl border border-[#00f3ff]/40 hover:bg-[#00f3ff]/30 transition-colors"
                    >
                      {processingPayment ? "Processing Payment..." : "Confirm Escrow Deposit"}
                    </button>
                    <button 
                      onClick={() => setShowCheckoutFor(null)}
                      disabled={processingPayment}
                      className="mt-4 text-gray-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {bids.length === 0 && <p className="text-gray-500">No bids yet.</p>}
        </div>
      </div>
    </main>
  );
}
