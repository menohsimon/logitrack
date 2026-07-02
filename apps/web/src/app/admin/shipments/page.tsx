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
import { formatDate, formatStatus } from "@/lib/format";
import { asRoute } from "@/lib/routes";

export default function AdminShipmentsPage() {
	const shipments = useAdminQuery(api.admin.listAllShipments, {});

	return (
		<DashboardShell variant="admin" title="Shipments">
			{shipments === undefined ? (
				<p className="text-muted-foreground">Loading...</p>
			) : shipments.length === 0 ? (
				<p className="text-muted-foreground">No shipments yet</p>
			) : (
				<div className="rounded-lg border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Shipment #</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Pickup</TableHead>
								<TableHead>Destination</TableHead>
								<TableHead>Created</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{shipments.map((shipment) => (
								<TableRow key={shipment._id}>
									<TableCell className="font-medium">
										<Link
											href={asRoute(`/admin/shipments/${shipment._id}`)}
											className="hover:underline"
										>
											{shipment.shipmentNumber}
										</Link>
									</TableCell>
									<TableCell>
										<Badge variant="outline">
											{formatStatus(shipment.status)}
										</Badge>
									</TableCell>
									<TableCell className="max-w-[200px] truncate text-muted-foreground">
										{shipment.pickupAddress}
									</TableCell>
									<TableCell className="max-w-[200px] truncate text-muted-foreground">
										{shipment.destinationAddress}
									</TableCell>
									<TableCell className="text-muted-foreground">
										{formatDate(shipment.createdAt)}
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
