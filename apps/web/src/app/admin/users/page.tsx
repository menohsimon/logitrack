"use client";

import { api } from "@logitrack/backend/convex/_generated/api";
import type { Id } from "@logitrack/backend/convex/_generated/dataModel";
import { Badge } from "@logitrack/ui/components/badge";
import { Button } from "@logitrack/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@logitrack/ui/components/table";
import { useMutation } from "convex/react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { useAdminQuery } from "@/hooks/use-admin-access";
import { formatDate, formatStatus } from "@/lib/format";

export default function AdminUsersPage() {
  const users = useAdminQuery(api.users.listForAdmin, {});
  const banUser = useMutation(api.users.banUser);
  const unbanUser = useMutation(api.users.unbanUser);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleBan(userId: Id<"users">) {
    const reason = window.prompt("Enter ban reason:");
    if (!reason?.trim()) return;
    setLoadingId(userId);
    try {
      await banUser({ userId, reason: reason.trim() });
      toast.success("User banned");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to ban user");
    } finally {
      setLoadingId(null);
    }
  }

  async function handleUnban(userId: Id<"users">) {
    setLoadingId(userId);
    try {
      await unbanUser({ userId });
      toast.success("User unbanned");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to unban user");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <DashboardShell variant="admin" title="Users">
      {users === undefined ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>
                    <Link
                      href={`/admin/users/${user._id}`}
                      className="font-medium hover:underline"
                    >
                      {user.name}
                    </Link>
                    {user.isAdmin && (
                      <Badge variant="secondary" className="ml-2">
                        Admin
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.status === "banned" ? "destructive" : "outline"}>
                      {formatStatus(user.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatStatus(user.defaultRole)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {user.status === "banned" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={loadingId === user._id}
                        onClick={() => handleUnban(user._id)}
                      >
                        Unban
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={loadingId === user._id || user.isAdmin}
                        onClick={() => handleBan(user._id)}
                      >
                        Ban
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </DashboardShell>
  );
}