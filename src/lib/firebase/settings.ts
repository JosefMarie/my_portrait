import { db } from "./config";
import { doc, getDoc, setDoc } from "firebase/firestore";

export interface PlatformSettings {
  commissionFeePercent: number;
  autoApproveArtists: boolean;
  maintenanceMode: boolean;
}

const DEFAULT_SETTINGS: PlatformSettings = {
  commissionFeePercent: 10,
  autoApproveArtists: true,
  maintenanceMode: false
};

export const getPlatformSettings = async (): Promise<PlatformSettings> => {
  try {
    const ref = doc(db, "settings", "platform");
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return { ...DEFAULT_SETTINGS, ...snap.data() } as PlatformSettings;
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.warn("Failed to fetch platform settings:", error);
    return DEFAULT_SETTINGS;
  }
};

export const updatePlatformSettings = async (settings: Partial<PlatformSettings>) => {
  const ref = doc(db, "settings", "platform");
  await setDoc(ref, settings, { merge: true });
};

export const getSecret = async (key: string): Promise<string | null> => {
  try {
    const ref = doc(db, "settings", "secrets");
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data()[key] || null;
    }
    return null;
  } catch (error) {
    console.warn("Failed to fetch secret:", error);
    return null;
  }
};

export const saveSecret = async (key: string, value: string) => {
  const ref = doc(db, "settings", "secrets");
  await setDoc(ref, { [key]: value }, { merge: true });
};
