"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendEmailVerification } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { getUserProfile, createUserProfile, UserRole, VerificationStatus, UserProfile } from "@/lib/firebase/users";
import { createLog } from "@/lib/firebase/logs";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  userRole: UserRole | null;
  verificationStatus: VerificationStatus | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<UserRole | undefined>;
  signUp: (email: string, pass: string, role: UserRole, fullName?: string, displayName?: string, preferences?: string[]) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  userRole: null,
  verificationStatus: null,
  loading: true,
  signIn: async () => undefined,
  signUp: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const profile = await getUserProfile(currentUser.uid);
        setUserProfile(profile);
        setUserRole(profile?.role || null);
        setVerificationStatus(profile?.verificationStatus || null);
      } else {
        setUserProfile(null);
        setUserRole(null);
        setVerificationStatus(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, pass: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    const profile = await getUserProfile(cred.user.uid);
    await createLog(cred.user.uid, "User logged in", "info");
    return profile?.role;
  };

  const signUp = async (email: string, pass: string, role: UserRole, fullName?: string, displayName?: string, preferences?: string[]) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const profile = await createUserProfile(cred.user.uid, email, role, fullName, displayName, preferences);
    await sendEmailVerification(cred.user);
    await createLog(cred.user.uid, "User signed up", "info", `Role: ${role}`);
    setUserRole(role);
    setVerificationStatus(profile.verificationStatus);
  };

  const logout = async () => {
    if (user) await createLog(user.uid, "User logged out", "info");
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, userRole, verificationStatus, loading, signIn, signUp, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
