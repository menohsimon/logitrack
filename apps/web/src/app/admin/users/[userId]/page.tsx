"use client";
import { asLinkRender } from "@/lib/render-adapters";

import { api } from "@logitrack/backend/convex/_generated/api";
import type { Id } from "@logitrack/backend/convex/_generated/dataModel";
import { Badge } from "@logitrack/ui/components/badge";
import { Button } from "@logitrack/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@logitrack/ui/components/card";
import { useMutation } from "convex/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { useAdminQuery } from "@/hooks/use-admin-access";
import { formatDate, formatDateTime, formatStatus } from "@/lib/format";

export default function AdminUserDetailPage() {
  const params = useParams();
  const userId = params.userId as Id<"users">;

  const user = useAdminQuery(api.users.getById, { userId });
  const banUser = useMutation(api.users.banUser);
  const unbanUser = useMutation(api.users.unbanUser);
  const [loading, setLoading] = useState(false);

  async function handleBan() {
    const reason = window.prompt("Enter ban reason:");
    if (!reason?.trim()) return;
    setLoading(true);
    try {
      await banUser({ userId, reason: reason.trim() });
      toast.success("User banned");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to ban user");
    } finally {
      setLoading(false);
    }
  }

  async function handleUnban() {
    setLoading(true);
    try {
      await unbanUser({ userId });
      toast.success("User unbanned");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to unban user");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardShell variant="admin" title="User Detail">
      <Button render={asLinkRender("/admin/users")} variant="ghost" size="sm" className="mb-4 -ml-2">
        ← Back to users
      </Button>

      {user === undefined ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : user === null ? (
        <p className="text-muted-foreground">User not found</p>
      ) : (
        <div className="space-y-6 max-w-2xl">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold">{user.name}</h2>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
            <div className="flex gap-2">
              {user.status === "banned" ? (
                <Button variant="outline" disabled={loading} onClick={handleUnban}>
                  Unban
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  disabled={loading || user.isAdmin}
                  onClick={handleBan}
                >
                  Ban User
                </Button>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={user.status === "banned" ? "destructive" : "outline"}>
                  {formatStatus(user.status)}
                </Badge>
                {user.isAdmin && (
                  <Badge variant="secondary" className="ml-2">
                    Admin
                  </Badge>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Default Role</CardTitle>
              </CardHeader>
              <CardContent>{formatStatus(user.defaultRole)}</CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone</span>
                <span>{user.phone ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Address</span>
                <span>{user.address ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Clerk ID</span>
                <span className="font-mono text-xs">{user.clerkUserId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Joined</span>
                <span>{formatDate(user.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last updated</span>
                <span>{formatDateTime(user.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardShell>
  );
}