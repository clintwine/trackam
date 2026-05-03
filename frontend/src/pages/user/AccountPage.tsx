import { useEffect, useState } from "react";
import {
  fetchAuthMe,
  fetchUser,
  type UserProfile,
} from "@/services/dashboard.api";

export default function AccountPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const me = await fetchAuthMe();
        const user = await fetchUser(me.uid);
        if (!active) return;
        setProfile(user);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-4 w-28 rounded-md bg-muted/60 animate-pulse" />
          <div className="h-3 w-64 rounded-md bg-muted/40 animate-pulse" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-4 animate-pulse space-y-3">
            <div className="h-3 w-24 rounded-md bg-muted/60" />
            <div className="h-3 w-40 rounded-md bg-muted/40" />
            <div className="h-3 w-32 rounded-md bg-muted/40" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-sm text-destructive">
        Could not load your profile.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Account</h2>
        <p className="text-sm text-muted-foreground">
          Basic information about your account.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-medium mb-3">Profile</h3>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium">{profile.email}</dd>
            </div>
            {profile.displayName && (
              <div>
                <dt className="text-muted-foreground">Name</dt>
                <dd className="font-medium">{profile.displayName}</dd>
              </div>
            )}
            {Array.isArray(profile.roles) && profile.roles.length > 0 && (
              <div>
                <dt className="text-muted-foreground">Roles</dt>
                <dd className="font-medium">{profile.roles.join(", ")}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}

