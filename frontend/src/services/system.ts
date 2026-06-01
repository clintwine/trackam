import { apiClient } from "@/lib/apiClient";

export interface VersionInfo {
  current: string | null;
  currentFull: string | null;
  latest: string | null;
  latestFull: string | null;
  latestMessage: string | null;
  latestAuthor: string | null;
  latestDate: string | null;
  updateAvailable: boolean;
  compareUrl: string | null;
  repoUrl: string;
  branch: string;
  checkedAt: string;
  status: "ok" | "no-current-commit" | "unreachable";
  cache?: "hit" | "refreshed" | "stale";
}

export const systemApi = {
  version: () => apiClient.get<VersionInfo>("/api/system/version").then((r) => r.data),
};
