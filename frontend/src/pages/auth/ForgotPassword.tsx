import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { forgotPassword } from "@/services/auth.api";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { useToast } from "@/hooks/useToast";

type ForgotPasswordFormValues = {
  email: string;
};

export default function ForgotPassword() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { success, error: showErrorToast } = useToast();

  async function onSubmit(values: ForgotPasswordFormValues) {
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      await forgotPassword(values);
      const msg =
        "If an account exists for this email, a reset link was sent.";
      setMessage(msg);
      success(msg, "Email sent");
    } catch (err) {
      console.error(err);
      setError("Failed to send reset email. Please try again.");
      showErrorToast(
        "Failed to send reset email. Please try again.",
        "Request failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Reset your password"
      description="Enter the email associated with your account."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {message && (
          <p className="text-sm text-emerald-400 text-center" role="status">
            {message}
          </p>
        )}
        {error && (
          <p className="text-sm text-destructive text-center" role="alert">
            {error}
          </p>
        )}
        <div className="space-y-2">
          <label className="block text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            {...register("email", { required: "Email is required" })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
          {errors.email && (
            <p className="text-xs text-destructive" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
        >
          {loading ? "Sending reset link..." : "Send reset link"}
        </button>
        <p className="text-xs text-center text-muted-foreground">
          Remembered your password?{" "}
          <Link
            to="/auth/login"
            className="font-medium text-primary hover:underline"
          >
            Back to log in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
