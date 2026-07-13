import { db } from "./config";
import { collection, addDoc, getDocs, doc, updateDoc, query, where, orderBy } from "firebase/firestore";

export type CommissionStatus = "open" | "in-progress" | "completed";
export type BidStatus = "pending" | "accepted" | "rejected";

export interface Commission {
  id?: string;
  buyerId: string;
  title: string;
  description: string;
  budget: string;
  medium: string;
  status: CommissionStatus;
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
    status: "open",
    createdAt: Date.now(),
  };
  const docRef = await addDoc(collection(db, "commissions"), newComm);
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
};

export const updateCommissionStatus = async (id: string, newStatus: string) => {
  const commRef = doc(db, "commissions", id);
  await updateDoc(commRef, { status: newStatus });
};
