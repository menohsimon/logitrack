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
import {
	DEFAULT_CURRENCY,
	formatCurrency,
	formatDate,
	formatStatus,
} from "@/lib/format";
import { asRoute } from "@/lib/routes";

export default function AdminBookingsPage() {
	const bookings = useAdminQuery(api.admin.listAllBookings, {});

	return (
		<DashboardShell variant="admin" title="Bookings">
			{bookings === undefined ? (
				<p className="text-muted-foreground">Loading...</p>
			) : bookings.length === 0 ? (
				<p className="text-muted-foreground">No bookings yet</p>
			) : (
				<div className="rounded-lg border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Booking #</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Pickup</TableHead>
								<TableHead>Destination</TableHead>
								<TableHead>Fare</TableHead>
								<TableHead>Created</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{bookings.map((booking) => (
								<TableRow key={booking._id}>
									<TableCell className="font-medium">
										<Link
											href={asRoute(`/admin/bookings/${booking._id}`)}
											className="hover:underline"
										>
											{booking.bookingNumber}
										</Link>
									</TableCell>
									<TableCell>
										<Badge variant="outline">
											{formatStatus(booking.status)}
										</Badge>
									</TableCell>
									<TableCell className="max-w-[200px] truncate text-muted-foreground">
										{booking.pickupAddress}
									</TableCell>
									<TableCell className="max-w-[200px] truncate text-muted-foreground">
										{booking.destinationAddress}
									</TableCell>
									<TableCell>
										{formatCurrency(
											booking.finalFareCents ?? booking.estimatedFareCents,
											booking.fareCurrency ?? DEFAULT_CURRENCY,
										)}
									</TableCell>
									<TableCell className="text-muted-foreground">
										{formatDate(booking.createdAt)}
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
