import { redirect } from "react-router";
import { useProfileStore } from "@/hooks/useProfile";
import { authClient } from "@/services/authClient";
import type { Profile } from "@/types/profile";

export async function requireAuth() {
  const result = await authClient.getCurrentUser();

  if (!result.authenticated || !result.user) {
    return redirect("/auth/login");
  }

  try {
    useProfileStore.getState().setAuthenticated(true);
    useProfileStore.getState().setProfile(result.profile as Profile | null);
  } catch {
    // non-fatal
  }

  return { user: result.profile };
}

export async function adminLoader() {
  const isAdmin = await authClient.checkIsAdmin();
  if (!isAdmin) {
    return redirect("/auth/login");
  }

  const result = await authClient.getCurrentUser();

  try {
    useProfileStore.getState().setProfile(result.profile as Profile | null);
  } catch {
    // non-fatal
  }

  return { profile: result.profile };
}

