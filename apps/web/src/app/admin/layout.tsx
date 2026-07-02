"use client";

import { useConvexAuth } from "convex/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import Loader from "@/components/loader";
import { useSyncUser } from "@/hooks/use-sync-user";
import { useAdminAccess } from "@/hooks/use-admin-access";
import { asRoute } from "@/lib/routes";

const PUBLIC_ADMIN_ROUTES = ["/admin/request-access"];

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  useSyncUser();
  const pathname = usePathname();
  const router = useRouter();
  const access = useAdminAccess();
  const isPublicRoute = PUBLIC_ADMIN_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  useEffect(() => {
    if (!access) return;

    if (access.isAdmin && isPublicRoute) {
      router.replace(asRoute("/admin"));
      return;
    }

    if (!access.isAdmin && !isPublicRoute) {
      router.replace(asRoute("/admin/request-access"));
    }
  }, [access, isPublicRoute, router]);

  if (access === undefined) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader />
      </div>
    );
  }

  if ((access.isAdmin && isPublicRoute) || (!access.isAdmin && !isPublicRoute)) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader />
      </div>
    );
  }

  return children;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const redirectUrl = encodeURIComponent(pathname);
      router.replace(asRoute(`/sign-in?redirect_url=${redirectUrl}`));
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader />
      </div>
    );
  }

  return <AdminLayoutContent>{children}</AdminLayoutContent>;
}