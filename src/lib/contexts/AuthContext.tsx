"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendEmailVerification } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { getUserProfile, createUserProfile, UserRole, VerificationStatus } from "@/lib/firebase/users";

interface AuthContextType {
  user: User | null;
  userRole: UserRole | null;
  verificationStatus: VerificationStatus | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, role: UserRole, fullName?: string, displayName?: string, preferences?: string[]) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  verificationStatus: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const profile = await getUserProfile(currentUser.uid);
        setUserRole(profile?.role || null);
        setVerificationStatus(profile?.verificationStatus || null);
      } else {
        setUserRole(null);
        setVerificationStatus(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signUp = async (email: string, pass: string, role: UserRole, fullName?: string, displayName?: string, preferences?: string[]) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const profile = await createUserProfile(cred.user.uid, email, role, fullName, displayName, preferences);
    await sendEmailVerification(cred.user);
    setUserRole(role);
    setVerificationStatus(profile.verificationStatus);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, userRole, verificationStatus, loading, signIn, signUp, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
