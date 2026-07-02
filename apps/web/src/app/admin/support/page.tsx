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

import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { useAdminQuery } from "@/hooks/use-admin-access";
import { formatDateTime, formatStatus } from "@/lib/format";

export default function AdminSupportPage() {
  const tickets = useAdminQuery(api.support.listAllForAdmin, {});

  return (
    <DashboardShell variant="admin" title="Support">
      {tickets === undefined ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : tickets.length === 0 ? (
        <p className="text-muted-foreground">No support tickets</p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket #</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow key={ticket._id}>
                  <TableCell>
                    <Link
                      href={`/admin/support/${ticket._id}`}
                      className="font-medium hover:underline"
                    >
                      {ticket.ticketNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-[250px] truncate">{ticket.subject}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatStatus(ticket.category)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        ticket.priority === "urgent" || ticket.priority === "high"
                          ? "destructive"
                          : "outline"
                      }
                    >
                      {formatStatus(ticket.priority)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{formatStatus(ticket.status)}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDateTime(ticket.lastMessageAt ?? ticket.createdAt)}
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