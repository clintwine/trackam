import { apiClient } from "@/lib/apiClient";
import type { UserProfile } from "./dashboard.api";

export type AdminUser = UserProfile & {
  photoURL?: string | null;
};

export type RoleItem = {
  id: string;
  description?: string;
  permissions: string[];
};

export type EventItem = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  createdAt?: number;
};

export async function fetchAllUsers(): Promise<AdminUser[]> {
  const { data } = await apiClient.get("/api/users", {
    withCredentials: true,
  });
  return data as AdminUser[];
}

export async function fetchRoles(): Promise<RoleItem[]> {
  const { data } = await apiClient.get("/api/roles", {
    withCredentials: true,
  });
  return data as RoleItem[];
}

export async function fetchEvents(type?: string): Promise<EventItem[]> {
  const { data } = await apiClient.get("/api/events", {
    withCredentials: true,
    params: type ? { type } : undefined,
  });
  return data as EventItem[];
}

