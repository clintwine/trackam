export type Profile = {
  id: string;
  email: string;
  role?: string;
  displayName?: string | null;
  [key: string]: unknown;
};
