import { db } from "./config";
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc, getDoc, orderBy, arrayUnion, arrayRemove } from "firebase/firestore";
import { createLog } from "./logs";

export interface Artwork {
  id?: string;
  artistId: string;
  title: string;
  medium: string;
  imageUrl: string;
  story: string;
  likes?: string[];
  isCurated?: boolean;
  price?: number;
  salesCount?: number;
  aiTags?: string[];
  saleType?: "fixed" | "auction" | "not_for_sale";
  auctionEndDate?: number;
}

export interface Comment {
  id?: string;
  userId: string;
  text: string;
  createdAt: number;
}

export const addArtwork = async (artwork: Artwork) => {
  const docRef = await addDoc(collection(db, "artworks"), artwork);
  await createLog(artwork.artistId, "Uploaded new artwork", "info", `Artwork: ${artwork.title}`);
  return docRef.id;
};

export const getArtworksByArtist = async (artistId: string) => {
  const q = query(collection(db, "artworks"), where("artistId", "==", artistId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Artwork));
};

export const deleteArtwork = async (artworkId: string) => {
  await deleteDoc(doc(db, "artworks", artworkId));
  await createLog("SYSTEM", "Artwork deleted", "warning", `Artwork ID: ${artworkId}`);
};

export const getAllArtworks = async () => {
  const q = query(collection(db, "artworks"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Artwork));
};

export const likeArtwork = async (artworkId: string, userId: string) => {
  const artworkRef = doc(db, "artworks", artworkId);
  const snap = await getDoc(artworkRef);
  if (snap.exists()) {
    const data = snap.data();
    const likes = data.likes || [];
    const isLiked = likes.includes(userId);
    
    if (!isLiked) {
      await updateDoc(artworkRef, { likes: arrayUnion(userId) });
    } else {
      await updateDoc(artworkRef, { likes: arrayRemove(userId) });
    }
    await createLog(userId, isLiked ? "Unliked artwork" : "Liked artwork", "info", `Artwork ID: ${artworkId}`);
  }
};

export const addComment = async (artworkId: string, comment: string, userId: string) => {
  const newComment: Comment = {
    userId,
    text: comment,
    createdAt: Date.now()
  };
  const docRef = await addDoc(collection(db, "artworks", artworkId, "comments"), newComment);
  await createLog(userId, "Commented on artwork", "info", `Artwork ID: ${artworkId}`);
  return docRef.id;
};

export const getComments = async (artworkId: string) => {
  const q = query(collection(db, "artworks", artworkId, "comments"), orderBy("createdAt", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
};

export const toggleArtworkCuration = async (artworkId: string, isCurated: boolean) => {
  const artworkRef = doc(db, "artworks", artworkId);
  await updateDoc(artworkRef, { isCurated });
  await createLog("SYSTEM", isCurated ? "Artwork featured" : "Artwork unfeatured", "info", `Artwork ID: ${artworkId}`);
};
