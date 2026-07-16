import { db } from "./config";
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, arrayUnion } from "firebase/firestore";
import { createLog } from "./logs";

export type UserRole = "artist" | "buyer" | "admin";
export type VerificationStatus = "INCOMPLETE" | "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";

export interface Purchase {
  artworkId: string;
  title: string;
  medium: string;
  imageUrl: string;
  price: number;
  acquiredAt: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  createdAt: number;
  verificationStatus: VerificationStatus;
  
  // Buyer fields
  fullName?: string;
  displayName?: string;
  profilePictureUrl?: string;
  preferences?: string[];
  purchases?: Purchase[];
  
  // Artist fields
  legalName?: string;
  phone?: string;
  address?: string;
  country?: string;
  websiteUrl?: string;
  statement?: string;
  signatureUrl?: string;
  portfolioUrls?: string[];
  governmentIdUrl?: string;
  processVideoUrl?: string;
}

export const createUserProfile = async (
  uid: string, 
  email: string, 
  role: UserRole, 
  fullName?: string, 
  displayName?: string, 
  preferences?: string[]
) => {
  const userRef = doc(db, "users", uid);
  // Default to INCOMPLETE for artists, APPROVED for buyers (since they don't have a multi-step flow yet)
  const verificationStatus: VerificationStatus = role === "artist" ? "INCOMPLETE" : "APPROVED";
  
  const profile: UserProfile = {
    uid,
    email,
    role,
    verificationStatus,
    createdAt: Date.now(),
    ...(fullName && { fullName }),
    ...(displayName && { displayName }),
    ...(preferences && { preferences })
  };
  await setDoc(userRef, profile);
  return profile;
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const docRef = doc(db, "users", uid);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return snap.data() as UserProfile;
  }
  return null;
};

export const submitArtistApplication = async (
  uid: string,
  applicationData: {
    legalName: string;
    phone: string;
    address: string;
    country: string;
    websiteUrl: string;
    statement: string;
    signatureUrl: string;
    portfolioUrls: string[];
    governmentIdUrl: string;
    processVideoUrl: string;
  }
) => {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    ...applicationData,
    verificationStatus: "PENDING"
  });
};

export const getPendingArtists = async (): Promise<UserProfile[]> => {
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("role", "==", "artist"), where("verificationStatus", "==", "PENDING"));
  const snap = await getDocs(q);
  return snap.docs.map(doc => doc.data() as UserProfile);
};

export const updateArtistStatus = async (uid: string, status: VerificationStatus) => {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    verificationStatus: status
  });
  await createLog(uid, "Artist verification status updated", status === "APPROVED" ? "info" : "warning", `Status changed to ${status}`);
};

export const updateArtistProfile = async (uid: string, data: Partial<UserProfile>) => {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, data);
  await createLog(uid, "Artist profile updated", "info");
};

export const purchaseArtworks = async (uid: string, newPurchases: Purchase[]) => {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    purchases: arrayUnion(...newPurchases)
  });
};
