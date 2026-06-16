"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChange } from "@/lib/auth.client";
import type { User as FirebaseUser } from "firebase/auth";

import { saveCurrentUser, clearCurrentUser } from "@/lib/auth-flow";

type AuthContextType = {
  user: FirebaseUser | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      if (firebaseUser) {
        // Sync local storage user for helper functions like isLoggedIn() and getCurrentUser()
        saveCurrentUser({
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
          email: firebaseUser.email || "",
          role: firebaseUser.email?.toLowerCase() === "krishnadiamond404@gmail.com" ? "ADMIN" : "USER"
        });

        // Sync session with Next.js backend to get the HttpOnly cookie for SSR / middleware
        const idToken = await firebaseUser.getIdToken();
        await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });
      } else {
        clearCurrentUser();
        // Clear session cookie
        await fetch("/api/auth/session", { method: "DELETE" });
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
