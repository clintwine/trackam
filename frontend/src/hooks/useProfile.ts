import { create } from "zustand";
import type { Profile } from "@/types/profile";

type ProfileState = {
  profile: Profile | null;
  authenticated: boolean;
  setProfile: (profile: Profile | null) => void;
  setAuthenticated: (auth: boolean) => void;
  clearProfile: () => void;
};

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  authenticated: false,
  setProfile: (profile) => set({ profile }),
  setAuthenticated: (authenticated) => set({ authenticated }),
  clearProfile: () => set({ profile: null, authenticated: false })
}));

