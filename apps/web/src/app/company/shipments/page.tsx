"use client";

import type { Id } from "@logitrack/backend/convex/_generated/dataModel";
import { api } from "@logitrack/backend/convex/_generated/api";
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
import { useQuery } from "convex/react";
import Link from "next/link";

import { CompanySetup } from "@/components/company/company-setup";
import { StatusBadge } from "@/components/company/status-badge";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { formatDate } from "@/lib/format";

function ShipmentsList({ companyId }: { companyId: Id<"companies"> }) {
  const shipments = useQuery(api.shipments.listForCompany, { companyId });

  const active =
    shipments?.filter(
      (s) => !["delivery_confirmed", "cancelled", "disputed"].includes(s.status),
    ) ?? [];
  const completed =
    shipments?.filter((s) => s.status === "delivery_confirmed") ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Active shipments</CardTitle>
          <CardDescription>{active.length} in progress</CardDescription>
        </CardHeader>
        <CardContent>
          {shipments === undefined ? (
            <p className="text-sm text-muted-foreground">Loading shipments...</p>
          ) : active.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active shipments</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shipment</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {active.map((shipment) => (
                  <TableRow key={shipment._id}>
                    <TableCell>
                      <Link
                        href={`/company/shipments/${shipment._id}`}
                        className="font-medium hover:underline"
                      >
                        {shipment.shipmentNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[240px] truncate text-muted-foreground">
                      {shipment.pickupAddress} → {shipment.destinationAddress}
                    </TableCell>
                    <TableCell>{formatDate(shipment.updatedAt)}</TableCell>
                    <TableCell>
                      <StatusBadge status={shipment.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Completed</CardTitle>
          <CardDescription>Delivery confirmed by customers</CardDescription>
        </CardHeader>
        <CardContent>
          {shipments === undefined ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : completed.length === 0 ? (
            <p className="text-sm text-muted-foreground">No completed shipments yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shipment</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Confirmed</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completed.map((shipment) => (
                  <TableRow key={shipment._id}>
                    <TableCell>
                      <Link
                        href={`/company/shipments/${shipment._id}`}
                        className="font-medium hover:underline"
                      >
                        {shipment.shipmentNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[240px] truncate text-muted-foreground">
                      {shipment.pickupAddress} → {shipment.destinationAddress}
                    </TableCell>
                    <TableCell>{formatDate(shipment.deliveryConfirmedAt)}</TableCell>
                    <TableCell>
                      <StatusBadge status={shipment.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function CompanyShipmentsPage() {
  return (
    <DashboardShell variant="company" title="Shipments">
      <CompanySetup>
        {({ companyId }) => <ShipmentsList companyId={companyId} />}
      </CompanySetup>
    </DashboardShell>
  );
}