import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type AuthLayoutProps = {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthLayout({
  title,
  description,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <header className="mb-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 text-primary"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <img
                src="/bkyd%20gem.png"
                alt="Logo"
                className="h-6 w-6 rounded-full object-cover"
              />
            </span>
            <span className="text-sm font-semibold tracking-wide uppercase">
              Workspace
            </span>
          </Link>
        </header>
        <section className="rounded-2xl border border-border bg-card px-6 py-6 shadow-sm">
          <div className="mb-6 text-center space-y-1">
            <h1 className="text-2xl font-semibold">{title}</h1>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {children}
        </section>
        {footer && (
          <div className="mt-4 text-center text-xs text-muted-foreground">
            {footer}
          </div>
        )}
      </div>
    </main>
  );
}
