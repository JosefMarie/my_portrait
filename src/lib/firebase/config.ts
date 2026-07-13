import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAFjFGhACkYtZE52rLjir_R4N-LQfr7qes",
  authDomain: "my-portraits.firebaseapp.com",
  projectId: "my-portraits",
  storageBucket: "my-portraits.firebasestorage.app",
  messagingSenderId: "580276525665",
  appId: "1:580276525665:web:fa9387cac13fc7d5766820",
  measurementId: "G-SBXRCFEGLQ"
};

// Initialize Firebase only if it hasn't been initialized already
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
