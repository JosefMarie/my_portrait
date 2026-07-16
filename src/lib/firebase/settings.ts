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
  const ref = doc(db, "settings", "platform");
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return { ...DEFAULT_SETTINGS, ...snap.data() } as PlatformSettings;
  }
  return DEFAULT_SETTINGS;
};

export const updatePlatformSettings = async (settings: Partial<PlatformSettings>) => {
  const ref = doc(db, "settings", "platform");
  await setDoc(ref, settings, { merge: true });
};
