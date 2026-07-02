"use client";

import { api } from "@logitrack/backend/convex/_generated/api";
import { Badge } from "@logitrack/ui/components/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@logitrack/ui/components/table";


import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { useAdminQuery } from "@/hooks/use-admin-access";
import { formatDateTime, formatStatus } from "@/lib/format";

export default function AdminAuditLogsPage() {
  const logs = useAdminQuery(api.admin.listAuditLogs, {});

  return (
    <DashboardShell variant="admin" title="Audit Logs">
      {logs === undefined ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : logs.length === 0 ? (
        <p className="text-muted-foreground">No audit logs yet</p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map(({ action, admin }) => (
                <TableRow key={action._id}>
                  <TableCell>
                    <Badge variant="outline">{formatStatus(action.actionType)}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {formatStatus(action.targetType)}
                    </span>
                    <span className="text-xs text-muted-foreground block font-mono truncate max-w-[120px]">
                      {action.targetId}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {admin?.name ?? admin?.email ?? "—"}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">
                    {action.reason ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                    {formatDateTime(action.createdAt)}
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