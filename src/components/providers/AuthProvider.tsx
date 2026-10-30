"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  updateProfile,
  getAdditionalUserInfo,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase/client";
import { isGmail, validateGmailOnly } from "@/lib/auth";
import type { UserProfile } from "@/types";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  /** The signed-in account's e-mail has been verified. */
  emailVerified: boolean;
  isAdmin: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<void>;
  signInWithGoogle: () => Promise<{ isNewUser: boolean }>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  /** Re-reads the Firebase user (used after e-mail verification). */
  reloadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const readProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
      const snap = await getDoc(doc(db, "users", uid));
      return snap.exists() ? (snap.data() as UserProfile) : null;
    } catch (err) {
      console.warn("Could not fetch profile from Firestore:", err);
      return null;
    }
  };

  /** Runs server-side provisioning so role/credits/claims are authoritative. */
  const provision = async (
    firebaseUser: User,
    provider: string
  ): Promise<UserProfile | null> => {
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch("/api/auth/provision", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          provider,
        }),
      });
      if (!res.ok) return readProfile(firebaseUser.uid);
      const data = await res.json();
      if (data?.claimUpdated) {
        // Refresh the token so the `admin` claim is visible to Firestore rules.
        await firebaseUser.getIdToken(true);
      }
      return (data?.profile as UserProfile) || (await readProfile(firebaseUser.uid));
    } catch (err) {
      console.warn("Provisioning failed, falling back to Firestore:", err);
      return readProfile(firebaseUser.uid);
    }
  };

  useEffect(() => {
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
        let p = await readProfile(firebaseUser.uid);
        if (!p) p = await provision(firebaseUser, "load");
        setProfile(p);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    const { valid, error } = validateGmailOnly(email);
    if (!valid) throw new Error(error);
    if (!isFirebaseConfigured) throw new Error("Sign-in is not available right now.");

    const result = await signInWithEmailAndPassword(auth, email, password);
    setUser(result.user);
    setProfile(await provision(result.user, "password"));
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string) => {
    const { valid, error } = validateGmailOnly(email);
    if (!valid) throw new Error(error);
    if (!isFirebaseConfigured) throw new Error("Sign-up is not available right now.");

    const result = await createUserWithEmailAndPassword(auth, email, password);
    if (fullName) await updateProfile(result.user, { displayName: fullName });
    setUser(result.user);
    setProfile(await provision(result.user, "password"));
  };

  const signInWithGoogle = async (): Promise<{ isNewUser: boolean }> => {
    if (!isFirebaseConfigured) throw new Error("Sign-in is not available right now.");

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const result = await signInWithPopup(auth, provider);

    if (!isGmail(result.user.email)) {
      await firebaseSignOut(auth);
      throw new Error("Only @gmail.com accounts are allowed.");
    }

    setUser(result.user);
    const p = await provision(result.user, "google.com");
    setProfile(p);
    return { isNewUser: !p || getAdditionalUserInfo(result)?.isNewUser === true };
  };

  const sendPasswordReset = async (email: string) => {
    const { valid, error } = validateGmailOnly(email);
    if (!valid) throw new Error(error);
    if (!isFirebaseConfigured) throw new Error("Password reset is not available right now.");
    await sendPasswordResetEmail(auth, email);
  };

  const signOut = async () => {
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
    if (user) setProfile(await readProfile(user.uid));
  };

  const reloadUser = async () => {
    if (!auth.currentUser) return;
    await auth.currentUser.reload();
    const refreshed = auth.currentUser;
    setUser(refreshed ? ({ ...refreshed } as User) : null);
    if (refreshed && !profile) setProfile(await readProfile(refreshed.uid));
  };

  const isAdmin = profile?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        emailVerified: user?.emailVerified ?? false,
        isAdmin,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        sendPasswordReset,
        signOut,
        refreshProfile,
        reloadUser,
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
