"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase/client";
import { isGmail, validateGmailOnly } from "@/lib/auth";
import type { UserProfile } from "@/types";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInAsDemoUser: () => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER_PROFILE: UserProfile = {
  uid: "demo-admin-uid-123",
  email: "demo@gmail.com",
  fullName: "Demo Admin",
  photoURL: undefined,
  role: "admin",
  creditBalance: 150,
  creditResetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  subscriptionTier: "pro",
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string) => {
    try {
      const ref = doc(db, "users", uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setProfile(snap.data() as UserProfile);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.warn("Could not fetch profile from Firestore:", err);
    }
  };

  useEffect(() => {
    // 1. Check if demo session is stored in localStorage
    if (typeof window !== "undefined") {
      const storedDemo = localStorage.getItem("ai_super_demo_user");
      if (storedDemo) {
        try {
          const parsed = JSON.parse(storedDemo) as UserProfile;
          setUser({
            uid: parsed.uid,
            email: parsed.email,
            displayName: parsed.fullName,
          } as unknown as User);
          setProfile(parsed);
          setLoading(false);
          return;
        } catch (e) {
          localStorage.removeItem("ai_super_demo_user");
        }
      }
    }

    // 2. Otherwise listen to Firebase auth state if configured
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        if (!isGmail(firebaseUser.email)) {
          await firebaseSignOut(auth);
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }
        setUser(firebaseUser);
        await fetchProfile(firebaseUser.uid);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const createUserDocument = async (
    firebaseUser: User,
    fullName?: string
  ) => {
    try {
      const ref = doc(db, "users", firebaseUser.uid);
      const existing = await getDoc(ref);

      if (!existing.exists()) {
        const now = new Date().toISOString();
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email!,
          fullName: fullName || firebaseUser.displayName || "User",
          photoURL: firebaseUser.photoURL || undefined,
          role: "user",
          creditBalance: 100, // starter credits
          creditResetAt: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
          subscriptionTier: "free",
          isActive: true,
          createdAt: now,
          updatedAt: now,
        };
        await setDoc(ref, {
          ...newProfile,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setProfile(newProfile);
      } else {
        await fetchProfile(firebaseUser.uid);
      }
    } catch (err) {
      console.warn("Could not save user document to Firestore:", err);
    }
  };

  const signInAsDemoUser = () => {
    const mockUser = {
      uid: DEMO_USER_PROFILE.uid,
      email: DEMO_USER_PROFILE.email,
      displayName: DEMO_USER_PROFILE.fullName,
    } as unknown as User;

    setUser(mockUser);
    setProfile(DEMO_USER_PROFILE);
    if (typeof window !== "undefined") {
      localStorage.setItem("ai_super_demo_user", JSON.stringify(DEMO_USER_PROFILE));
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { valid, error } = validateGmailOnly(email);
    if (!valid) throw new Error(error);

    // If Firebase keys are not provided, or user is logging in with demo account
    if (!isFirebaseConfigured || email.toLowerCase().trim() === "demo@gmail.com") {
      signInAsDemoUser();
      return;
    }

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await createUserDocument(result.user);
    } catch (err: any) {
      // If Firebase auth throws api-key error, fallback gracefully to demo session
      if (err?.code?.includes("api-key") || err?.code?.includes("invalid-api-key")) {
        signInAsDemoUser();
        return;
      }
      throw err;
    }
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    fullName: string
  ) => {
    const { valid, error } = validateGmailOnly(email);
    if (!valid) throw new Error(error);

    if (!isFirebaseConfigured) {
      signInAsDemoUser();
      return;
    }

    const result = await createUserWithEmailAndPassword(auth, email, password);
    if (fullName) {
      await updateProfile(result.user, { displayName: fullName });
    }
    await createUserDocument(result.user, fullName);
  };

  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured) {
      signInAsDemoUser();
      return;
    }

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    const result = await signInWithPopup(auth, provider);

    if (!isGmail(result.user.email)) {
      await firebaseSignOut(auth);
      throw new Error("Only @gmail.com accounts are allowed.");
    }

    await createUserDocument(result.user);
  };

  const signOut = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("ai_super_demo_user");
    }
    if (isFirebaseConfigured) {
      try {
        await firebaseSignOut(auth);
      } catch (err) {
        console.warn("Sign out error:", err);
      }
    }
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (profile?.uid === DEMO_USER_PROFILE.uid) {
      // Re-read or update credits locally for demo session
      const stored = localStorage.getItem("ai_super_demo_user");
      if (stored) setProfile(JSON.parse(stored));
      return;
    }
    if (user && isFirebaseConfigured) {
      await fetchProfile(user.uid);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signInAsDemoUser,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
