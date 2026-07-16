import { db } from "./config";
import { collection, addDoc, query, orderBy, onSnapshot } from "firebase/firestore";

export interface CommissionMessage {
  id?: string;
  senderId: string;
  text: string;
  createdAt: number;
}

export const sendMessage = async (commissionId: string, senderId: string, text: string) => {
  const messagesRef = collection(db, "commissions", commissionId, "messages");
  await addDoc(messagesRef, {
    senderId,
    text,
    createdAt: Date.now()
  });
};

export const subscribeToMessages = (
  commissionId: string,
  callback: (messages: CommissionMessage[]) => void
) => {
  const messagesRef = collection(db, "commissions", commissionId, "messages");
  const q = query(messagesRef, orderBy("createdAt", "asc"));
  
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as CommissionMessage[];
    callback(messages);
  });
};
