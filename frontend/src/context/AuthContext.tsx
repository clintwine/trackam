/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from "react";
import { authClient } from "@/services/authClient";
import { useProfileStore } from "@/hooks/useProfile";
import type { Profile } from "@/types/profile";

type AuthContextValue = {
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const setProfile = useProfileStore((s) => s.setProfile);
  const setAuthenticated = useProfileStore((s) => s.setAuthenticated);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const result = await authClient.getCurrentUser();
      if (!isMounted) return;
      setAuthenticated(result.authenticated);
      setProfile((result.profile as Profile | null) ?? null);
      setLoading(false);
    })();
    return () => {
      isMounted = false;
    };
  }, [setAuthenticated, setProfile]);

  const value: AuthContextValue = { loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return ctx;
}
