"use client";

import { UserButton } from "@clerk/nextjs";
import { api } from "@logitrack/backend/convex/_generated/api";
import { Button } from "@logitrack/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@logitrack/ui/components/card";
import { useMutation } from "convex/react";
import { Clock, Shield, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { formatDateTime } from "@/lib/format";
import { asRoute } from "@/lib/routes";
import type { Doc } from "@logitrack/backend/convex/_generated/dataModel";

export function AdminAccessRequestPanel({
  access,
}: {
  access: {
    isAdmin: boolean;
    hasUserProfile: boolean;
    request: Doc<"adminAccessRequests"> | null;
  };
}) {
  const router = useRouter();
  const requestAccess = useMutation(api.adminAccess.requestAccess);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (access.isAdmin) {
      router.replace(asRoute("/admin"));
    }
  }, [access.isAdmin, router]);

  async function handleRequest() {
    setLoading(true);
    try {
      await requestAccess({});
      toast.success("Admin access request submitted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  const request = access.request;
  const isPending = request?.status === "pending";
  const wasRejected = request?.status === "rejected";
  const wasApproved = request?.status === "approved" || access.isAdmin;

  if (wasApproved) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-sm text-muted-foreground">Redirecting to admin dashboard…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex h-14 items-center justify-between border-b px-4">
        <Link href={asRoute("/")} className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to site
        </Link>
        <UserButton />
      </header>
      <main className="flex flex-1 items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-muted">
              {isPending ? (
                <Clock className="size-6 text-muted-foreground" />
              ) : wasRejected ? (
                <ShieldAlert className="size-6 text-destructive" />
              ) : (
                <Shield className="size-6 text-muted-foreground" />
              )}
            </div>
            <CardTitle>
              {isPending
                ? "Admin access pending"
                : wasRejected
                  ? "Admin access denied"
                  : "Request admin access"}
            </CardTitle>
            <CardDescription>
              {isPending
                ? "Your request is waiting for approval from an existing administrator."
                : wasRejected
                  ? "Your previous request was not approved. You may submit a new request."
                  : "Submit a request to access the LogiTrack admin dashboard."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isPending && request && (
              <div className="rounded-xl border bg-muted/40 p-3 text-sm">
                <p className="font-medium">{request.name}</p>
                <p className="text-muted-foreground">{request.email}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Requested {formatDateTime(request.requestedAt)}
                </p>
              </div>
            )}

            {wasRejected && request?.rejectionReason && (
              <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-muted-foreground">
                Reason: {request.rejectionReason}
              </p>
            )}

            {!access.hasUserProfile && (
              <p className="text-center text-sm text-muted-foreground">
                Setting up your profile… try again in a moment.
              </p>
            )}

            {(!isPending || wasRejected) && access.hasUserProfile && (
              <Button
                className="w-full rounded-full"
                disabled={loading}
                onClick={handleRequest}
              >
                {wasRejected ? "Request again" : "Request admin access"}
              </Button>
            )}

            {isPending && (
              <p className="text-center text-xs text-muted-foreground">
                An existing admin can approve your request from the admin dashboard
                or directly in the Convex dashboard.
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}