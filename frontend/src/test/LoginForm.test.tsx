import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ToastProvider } from "@/context/ToastContext";
import Login from "@/pages/auth/Login";
import { authClient } from "@/services/authClient";
import { login } from "@/services/auth.api";

const mockNavigate = vi.fn();
const mockSuccessToast = vi.fn();
const mockErrorToast = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom"
  );

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/services/auth.api", () => ({
  login: vi.fn(),
}));

vi.mock("@/services/authClient", () => ({
  authClient: {
    getCurrentUser: vi.fn(),
  },
}));

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({
    success: mockSuccessToast,
    error: mockErrorToast,
  }),
}));

describe("Login page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("shows validation errors when submitting empty form", async () => {
    render(
      <ToastProvider>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </ToastProvider>
    );

    const submit = screen.getByRole("button", { name: /log in/i });
    fireEvent.click(submit);

    await waitFor(() => {
      expect(screen.getByText("Email is required")).toBeInTheDocument();
      expect(screen.getByText("Password is required")).toBeInTheDocument();
    });
  });

  it("shows an error toast when login does not establish a session", async () => {
    vi.mocked(login).mockResolvedValue({ idToken: "token-1" });
    vi.mocked(authClient.getCurrentUser).mockResolvedValue({
      authenticated: false,
      user: null,
      profile: null,
      isAdmin: false,
    });

    render(
      <ToastProvider>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </ToastProvider>
    );

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "admin@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(mockErrorToast).toHaveBeenCalledWith(
        "Login failed. Check your credentials and try again.",
        "Login failed"
      );
    });

    expect(mockSuccessToast).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
