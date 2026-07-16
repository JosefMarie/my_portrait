import { db } from "./config";
import { collection, addDoc, getDocs, doc, updateDoc, query, where, orderBy, arrayUnion } from "firebase/firestore";
import { getUserProfile } from "./users";
import { createLog } from "./logs";

export type CommissionStatus = "pending_admin_approval" | "open" | "in-progress" | "completed";
export type BidStatus = "pending" | "accepted" | "rejected";

export interface Commission {
  id?: string;
  buyerId: string;
  title: string;
  description: string;
  budget: string;
  medium: string;
  status: CommissionStatus;
  referenceImageUrl?: string;
  milestone?: string;
  milestoneImageUrl?: string;
  bidders?: string[];
  payoutStatus?: "pending" | "withdrawn";
  createdAt: number;
}

export interface Bid {
  id?: string;
  commissionId: string;
  artistId: string;
  amount: number;
  message: string;
  status: BidStatus;
  createdAt: number;
}

export const createCommission = async (commission: Omit<Commission, "id" | "createdAt" | "status">) => {
  const newComm: Commission = {
    ...commission,
    status: "pending_admin_approval",
    bidders: [],
    createdAt: Date.now(),
  };
  const docRef = await addDoc(collection(db, "commissions"), newComm);
  await createLog(commission.buyerId, "Created commission request", "info", `Commission: ${commission.title}`);
  return docRef.id;
};

export const getOpenCommissions = async () => {
  const q = query(collection(db, "commissions"), where("status", "==", "open"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Commission));
};

export const submitBid = async (bid: Omit<Bid, "id" | "createdAt" | "status">) => {
  const newBid: Bid = {
    ...bid,
    status: "pending",
    createdAt: Date.now(),
  };
  const docRef = await addDoc(collection(db, "commissions", bid.commissionId, "bids"), newBid);
  
  const commRef = doc(db, "commissions", bid.commissionId);
  await updateDoc(commRef, { bidders: arrayUnion(bid.artistId) });
  
  await createLog(bid.artistId, "Submitted bid on commission", "info", `Commission ID: ${bid.commissionId}, Amount: ${bid.amount}`);
  return docRef.id;
};

export const getBidsForCommission = async (commissionId: string) => {
  const q = query(collection(db, "commissions", commissionId, "bids"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bid));
};

export const acceptBid = async (commissionId: string, bidId: string) => {
  const commRef = doc(db, "commissions", commissionId);
  await updateDoc(commRef, { status: "in-progress" });

  const bidRef = doc(db, "commissions", commissionId, "bids", bidId);
  await updateDoc(bidRef, { status: "accepted" });
  await createLog("SYSTEM", "Commission bid accepted", "info", `Commission ID: ${commissionId}`);
};

export const updateCommissionStatus = async (id: string, newStatus: string) => {
  const commRef = doc(db, "commissions", id);
  await updateDoc(commRef, { status: newStatus });
  await createLog("SYSTEM", "Commission status updated", "info", `Commission ID: ${id}, Status: ${newStatus}`);
};

export const updateCommissionMilestone = async (id: string, milestone: string, milestoneImageUrl?: string) => {
  const commRef = doc(db, "commissions", id);
  const data: any = { milestone };
  if (milestoneImageUrl !== undefined) {
    data.milestoneImageUrl = milestoneImageUrl;
  }
  if (milestone === "Completed") {
    data.status = "completed";
  }
  await updateDoc(commRef, data);
  await createLog("SYSTEM", "Commission milestone updated", "info", `Commission ID: ${id}, Milestone: ${milestone}`);
};

export const getActiveWorkflows = async () => {
  // Keeping this for backward compatibility if used anywhere else
  return [];
};

export const getPendingAdminCommissions = async () => {
  const q = query(collection(db, "commissions"), where("status", "==", "pending_admin_approval"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Commission));
};

export const getCollectorActiveCommissions = async (buyerId: string) => {
  const q = query(collection(db, "commissions"), where("buyerId", "==", buyerId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  
  const workflows = [];
  for (const docSnap of snapshot.docs) {
    const commission = { id: docSnap.id, ...docSnap.data() } as Commission;
    let artistName = "Waiting for Bids...";
    
    if (commission.status === "in-progress" || commission.status === "completed") {
      const actualBidsQ = query(collection(db, "commissions", commission.id!, "bids"), where("status", "==", "accepted"));
      const bidsSnap = await getDocs(actualBidsQ);
      if (!bidsSnap.empty) {
        const bid = bidsSnap.docs[0].data() as Bid;
        const artistProfile = await getUserProfile(bid.artistId);
        if (artistProfile) artistName = artistProfile.displayName || artistProfile.legalName || "Artist";
      }
    }
    workflows.push({
      ...commission,
      assignedArtistName: artistName,
    });
  }
  return workflows;
};

export const getArtistActiveCommissions = async (artistId: string) => {
  const q = query(collection(db, "commissions"), where("status", "in", ["in-progress", "completed"]), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  
  const workflows = [];
  for (const docSnap of snapshot.docs) {
    const commission = { id: docSnap.id, ...docSnap.data() } as Commission;
    
    // Check if THIS artist has an accepted bid on THIS commission
    const bidsQ = query(collection(db, "commissions", commission.id!, "bids"), where("artistId", "==", artistId), where("status", "==", "accepted"));
    const bidsSnap = await getDocs(bidsQ);
    
    if (!bidsSnap.empty) {
      let buyerName = "Collector";
      const buyerProfile = await getUserProfile(commission.buyerId);
      if (buyerProfile) buyerName = buyerProfile.displayName || buyerProfile.fullName || "Collector";
      
      const bid = bidsSnap.docs[0].data() as Bid;
      workflows.push({
        ...commission,
        buyerName,
        agreedBudget: bid.amount
      });
    }
  }
  return workflows;
};

export const markCommissionWithdrawn = async (id: string) => {
  const commRef = doc(db, "commissions", id);
  await updateDoc(commRef, { payoutStatus: "withdrawn" });
  await createLog("SYSTEM", "Commission funds withdrawn", "info", `Commission ID: ${id}`);
};
