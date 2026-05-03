import { apiClient } from "@/lib/apiClient";

export type LoginPayload = {
  email: string;
  password: string;
};

export type SignupPayload = {
  email: string;
  password: string;
  profile?: {
    displayName?: string;
  };
};

export type ForgotPasswordPayload = {
  email: string;
};

export type VerifyEmailPayload = {
  idToken: string;
};

export async function login(payload: LoginPayload) {
  const { data } = await apiClient.post("/api/auth/login", payload, {
    withCredentials: true,
  });
  return data as { idToken?: string; [key: string]: unknown };
}

export async function signup(payload: SignupPayload) {
  const { data } = await apiClient.post("/api/auth/signup", payload, {
    withCredentials: true,
  });
  return data as { idToken?: string; [key: string]: unknown };
}

export async function forgotPassword(payload: ForgotPasswordPayload) {
  await apiClient.post("/api/auth/forgot-password", payload, {
    withCredentials: true,
  });
}

export async function verifyEmail(payload: VerifyEmailPayload) {
  await apiClient.post("/api/auth/verify-email", payload, {
    withCredentials: true,
  });
}
