import { db } from "./config";
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc, getDoc, orderBy } from "firebase/firestore";

export interface Artwork {
  id?: string;
  artistId: string;
  title: string;
  medium: string;
  imageUrl: string;
  story: string;
  likes?: string[];
}

export interface Comment {
  id?: string;
  userId: string;
  text: string;
  createdAt: number;
}

export const addArtwork = async (artwork: Artwork) => {
  const docRef = await addDoc(collection(db, "artworks"), artwork);
  return docRef.id;
};

export const getArtworksByArtist = async (artistId: string) => {
  const q = query(collection(db, "artworks"), where("artistId", "==", artistId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Artwork));
};

export const deleteArtwork = async (artworkId: string) => {
  await deleteDoc(doc(db, "artworks", artworkId));
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
    if (!likes.includes(userId)) {
      await updateDoc(artworkRef, { likes: [...likes, userId] });
    } else {
      await updateDoc(artworkRef, { likes: likes.filter((id: string) => id !== userId) });
    }
  }
};

export const addComment = async (artworkId: string, comment: string, userId: string) => {
  const newComment: Comment = {
    userId,
    text: comment,
    createdAt: Date.now()
  };
  await addDoc(collection(db, "artworks", artworkId, "comments"), newComment);
};

export const getComments = async (artworkId: string) => {
  const q = query(collection(db, "artworks", artworkId, "comments"), orderBy("createdAt", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
};
