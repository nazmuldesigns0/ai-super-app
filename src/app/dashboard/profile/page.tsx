"use client";

import { useAuth } from "@/components/providers/AuthProvider";

export default function ProfilePage() {
  const { profile } = useAuth();

  if (!profile) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>

      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-4">
          {profile.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.photoURL}
              alt=""
              className="h-16 w-16 rounded-full"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
              {profile.fullName.charAt(0)}
            </div>
          )}
          <div>
            <h2 className="text-lg font-semibold">{profile.fullName}</h2>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
          <div>
            <p className="text-sm text-muted-foreground">Credits</p>
            <p className="text-xl font-bold">{profile.creditBalance}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Plan</p>
            <p className="text-xl font-bold capitalize">
              {profile.subscriptionTier}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Role</p>
            <p className="font-medium capitalize">{profile.role}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Next credit reset</p>
            <p className="font-medium">
              {new Date(profile.creditResetAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
