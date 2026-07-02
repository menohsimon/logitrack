"use client";

import { api } from "@logitrack/backend/convex/_generated/api";
import type { Id } from "@logitrack/backend/convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@logitrack/ui/components/avatar";
import { Badge } from "@logitrack/ui/components/badge";
import { Button } from "@logitrack/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@logitrack/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@logitrack/ui/components/table";
import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { useAdminQuery } from "@/hooks/use-admin-access";
import { formatDateTime, formatStatus } from "@/lib/format";

export default function AdminAccessRequestsPage() {
  const pending = useAdminQuery(api.adminAccess.listPendingRequests, {});
  const allRequests = useAdminQuery(api.adminAccess.listAllRequests, {});
  const approve = useMutation(api.adminAccess.approveRequest);
  const reject = useMutation(api.adminAccess.rejectRequest);
  const [actingId, setActingId] = useState<Id<"adminAccessRequests"> | null>(null);

  async function handleApprove(requestId: Id<"adminAccessRequests">) {
    setActingId(requestId);
    try {
      await approve({ requestId });
      toast.success("Admin access approved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Approval failed");
    } finally {
      setActingId(null);
    }
  }

  async function handleReject(requestId: Id<"adminAccessRequests">) {
    setActingId(requestId);
    try {
      await reject({ requestId });
      toast.success("Request rejected");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Rejection failed");
    } finally {
      setActingId(null);
    }
  }

  return (
    <DashboardShell variant="admin" title="Admin Access Requests">
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Pending requests</CardTitle>
            <CardDescription>
              Approve users to grant admin dashboard access. You can also approve
              directly in the Convex dashboard by setting{" "}
              <code className="text-xs">approved: true</code> on the request and{" "}
              <code className="text-xs">isAdmin: true</code> on the user.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pending === undefined ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : pending.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending requests</p>
            ) : (
              <div className="space-y-4">
                {pending.map((request) => (
                  <div
                    key={request._id}
                    className="flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={request.avatarUrl} />
                        <AvatarFallback>{request.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{request.name}</p>
                        <p className="text-sm text-muted-foreground">{request.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Requested {formatDateTime(request.requestedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={actingId === request._id}
                        onClick={() => handleApprove(request._id)}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actingId === request._id}
                        onClick={() => handleReject(request._id)}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All requests</CardTitle>
          </CardHeader>
          <CardContent>
            {allRequests === undefined ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : allRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No requests yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Approved</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Reviewed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allRequests.map((request) => (
                    <TableRow key={request._id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{request.name}</p>
                          <p className="text-xs text-muted-foreground">{request.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{formatStatus(request.status)}</Badge>
                      </TableCell>
                      <TableCell>{request.approved ? "Yes" : "No"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDateTime(request.requestedAt)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {request.reviewedAt ? formatDateTime(request.reviewedAt) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}