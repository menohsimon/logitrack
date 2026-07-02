"use client";

import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import Loader from "./loader";
import { useSyncUser } from "@/hooks/use-sync-user";
import { asRoute } from "@/lib/routes";

export function AuthGate({ children }: { children: React.ReactNode }) {
  useSyncUser();
  const pathname = usePathname();
  const redirectUrl = encodeURIComponent(pathname);
  const signInHref = `/sign-in?redirect_url=${redirectUrl}`;
  const signUpHref = `/sign-up?redirect_url=${redirectUrl}`;

  return (
    <>
      <Authenticated>{children}</Authenticated>
      <Unauthenticated>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6 text-center">
          <h2 className="text-lg font-semibold">Sign in required</h2>
          <p className="text-muted-foreground text-sm max-w-sm">
            Sign in or create an account to access this page.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href={asRoute(signInHref)}
              className="bg-foreground text-background px-6 py-3 rounded-full font-medium text-sm"
            >
              Sign In
            </Link>
            <Link
              href={asRoute(signUpHref)}
              className="border px-6 py-3 rounded-full font-medium text-sm hover:bg-muted"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </Unauthenticated>
      <AuthLoading>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader />
        </div>
      </AuthLoading>
    </>
  );
}