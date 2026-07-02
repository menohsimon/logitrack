"use client";

import Loader from "@/components/loader";
import { AdminAccessRequestPanel } from "@/components/admin/admin-access-request-panel";
import { useAdminAccess } from "@/hooks/use-admin-access";
import { asRoute } from "@/lib/routes";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminRequestAccessPage() {
  const router = useRouter();
  const access = useAdminAccess();

  useEffect(() => {
    if (access?.isAdmin) {
      router.replace(asRoute("/admin"));
    }
  }, [access?.isAdmin, router]);

  if (access === undefined) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (access.isAdmin) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader />
      </div>
    );
  }

  return <AdminAccessRequestPanel access={access} />;
}