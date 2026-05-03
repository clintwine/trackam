import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { getAuthToken } from "@/lib/authToken";
import { verifyEmail } from "@/services/auth.api";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { useToast } from "@/hooks/useToast";

type VerifyEmailFormValues = {
  idToken: string;
};

export default function VerifyEmail() {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<VerifyEmailFormValues>();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { success, error: showErrorToast } = useToast();

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      setValue("idToken", token);
    }
  }, [setValue]);

  async function onSubmit(values: VerifyEmailFormValues) {
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      await verifyEmail(values);
      const msg = "Verification email sent. Please check your inbox.";
      setMessage(msg);
      success(msg, "Email sent");
    } catch (err) {
      console.error(err);
      setError("Failed to send verification email. Please try again.");
      showErrorToast(
        "Failed to send verification email. Please try again.",
        "Request failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Verify your email"
      description="Send a verification link to confirm your address."
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
        <p className="text-sm text-muted-foreground">
          In a real app, the ID token would typically be obtained after login.
          For the scaffold, we read it from your current session if available.
        </p>
        <div className="space-y-2">
          <label className="block text-sm font-medium" htmlFor="idToken">
            ID Token
          </label>
          <textarea
            id="idToken"
            {...register("idToken", { required: "ID token is required" })}
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
          {errors.idToken && (
            <p className="text-xs text-destructive" role="alert">
              {errors.idToken.message}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
        >
          {loading ? "Sending email..." : "Send verification email"}
        </button>
      </form>
    </AuthLayout>
  );
}
