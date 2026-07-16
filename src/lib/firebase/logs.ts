import { db } from "./config";
import { collection, addDoc, getDocs, query, orderBy } from "firebase/firestore";

export type LogSeverity = "info" | "warning" | "error" | "critical";

export interface AuditLog {
  id?: string;
  userId: string;
  action: string;
  severity: LogSeverity;
  details?: string;
  createdAt: number;
}

export const createLog = async (userId: string, action: string, severity: LogSeverity = "info", details?: string) => {
  try {
    const log: any = {
      userId,
      action,
      severity,
      createdAt: Date.now()
    };
    if (details !== undefined) {
      log.details = details;
    }
    await addDoc(collection(db, "audit_logs"), log);
  } catch (err) {
    console.error("Failed to write audit log", err);
  }
};

export const getLogs = async () => {
  const q = query(collection(db, "audit_logs"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));
};

export const getSystemMetrics = async () => {
  const usersSnap = await getDocs(collection(db, "users"));
  const artsSnap = await getDocs(collection(db, "artworks"));
  const commsSnap = await getDocs(collection(db, "commissions"));
  
  const totalUsers = usersSnap.size;
  const totalArtworks = artsSnap.size;
  const totalCommissions = commsSnap.size;
  
  const activeCommissions = commsSnap.docs.filter(d => d.data().status === 'open' || d.data().status === 'in-progress').length;
  const completedCommissions = commsSnap.docs.filter(d => d.data().status === 'completed');
  
  const estimatedVolume = completedCommissions.reduce((sum, doc) => {
    // Attempt to parse budget which might be stored as string or number
    let budget = 0;
    if (doc.data().agreedBudget) {
      budget = Number(doc.data().agreedBudget);
    } else if (doc.data().budget) {
      budget = Number(doc.data().budget.replace(/[^0-9.-]+/g, ""));
    }
    return sum + (isNaN(budget) ? 0 : budget);
  }, 0);
  
  return {
    totalUsers,
    totalArtworks,
    totalCommissions,
    activeCommissions,
    completedCommissions: completedCommissions.length,
    estimatedVolume
  };
};
