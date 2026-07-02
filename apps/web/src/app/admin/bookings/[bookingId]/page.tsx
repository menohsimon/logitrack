"use client";

import { api } from "@logitrack/backend/convex/_generated/api";
import type { Id } from "@logitrack/backend/convex/_generated/dataModel";
import { Button } from "@logitrack/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@logitrack/ui/components/card";
import { Label } from "@logitrack/ui/components/label";
import { Textarea } from "@logitrack/ui/components/textarea";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/company/status-badge";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DEFAULT_CURRENCY, formatCurrency, formatDateTime } from "@/lib/format";
import { asLinkRender } from "@/lib/render-adapters";
import { asRoute } from "@/lib/routes";

export default function AdminBookingDetailPage() {
	const params = useParams();
	const router = useRouter();
	const bookingId = params.bookingId as Id<"bookings">;
	const data = useQuery(api.bookings.getById, { bookingId });
	const accept = useMutation(api.bookings.accept);
	const reject = useMutation(api.bookings.reject);
	const cancel = useMutation(api.bookings.cancelByCompany);

	const [note, setNote] = useState("");
	const [reason, setReason] = useState("");
	const [processing, setProcessing] = useState(false);

	async function handleAccept() {
		if (!data?.booking) return;
		setProcessing(true);
		try {
			const shipmentId = await accept({
				bookingId,
				fareCents: data.booking.estimatedFareCents,
				note: note.trim() || "Accepted by platform admin",
			});
			toast.success("Booking accepted");
			router.push(asRoute(`/admin/shipments/${shipmentId}`));
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to accept");
		} finally {
			setProcessing(false);
		}
	}

	async function handleReject() {
		if (!note.trim()) {
			toast.error("Add a reason");
			return;
		}
		setProcessing(true);
		try {
			await reject({ bookingId, reason: note.trim() });
			toast.success("Booking rejected");
			setNote("");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to reject");
		} finally {
			setProcessing(false);
		}
	}

	async function handleCancel() {
		if (!reason.trim()) {
			toast.error("Add a reason");
			return;
		}
		setProcessing(true);
		try {
			await cancel({ bookingId, reason: reason.trim() });
			toast.success("Booking cancelled");
			setReason("");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to cancel");
		} finally {
			setProcessing(false);
		}
	}

	if (data === undefined) {
		return (
			<DashboardShell variant="admin" title="Booking">
				<p className="text-muted-foreground">Loading...</p>
			</DashboardShell>
		);
	}

	if (!data) {
		return (
			<DashboardShell variant="admin" title="Booking">
				<p className="text-muted-foreground">Booking not found.</p>
				<Button
					render={asLinkRender("/admin/bookings")}
					variant="outline"
					className="mt-4"
				>
					Back to bookings
				</Button>
			</DashboardShell>
		);
	}

	const { booking, cargo, company, shipment } = data;
	const fareCurrency =
		booking.fareCurrency ?? cargo?.currency ?? DEFAULT_CURRENCY;
	const canCancel =
		booking.status === "accepted" &&
		(!shipment ||
			[
				"created",
				"awaiting_driver_assignment",
				"driver_assigned",
				"pickup_scheduled",
				"arriving_for_pickup",
			].includes(shipment.status));

	return (
		<DashboardShell variant="admin" title="Booking Detail">
			<div className="space-y-6">
				<div className="flex flex-wrap items-center gap-3">
					<h1 className="font-semibold text-xl">{booking.bookingNumber}</h1>
					<StatusBadge status={booking.status} />
				</div>

				<div className="grid gap-6 lg:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle>Route</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3 text-sm">
							<div>
								<p className="text-muted-foreground">Pickup</p>
								<p>{booking.pickupAddress}</p>
							</div>
							<div>
								<p className="text-muted-foreground">Destination</p>
								<p>{booking.destinationAddress}</p>
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>Summary</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2 text-sm">
							<p>Company: {company?.name ?? "Unknown"}</p>
							<p>
								Estimated fare:{" "}
								{formatCurrency(booking.estimatedFareCents, fareCurrency)}
							</p>
							{booking.finalFareCents != null && (
								<p>
									Final fare:{" "}
									{formatCurrency(booking.finalFareCents, fareCurrency)}
								</p>
							)}
							<p>Created: {formatDateTime(booking.createdAt)}</p>
							{shipment && (
								<Link
									href={asRoute(`/admin/shipments/${shipment._id}`)}
									className="text-primary hover:underline"
								>
									Open shipment {shipment.shipmentNumber}
								</Link>
							)}
						</CardContent>
					</Card>
				</div>

				{cargo && (
					<Card>
						<CardHeader>
							<CardTitle>Cargo</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2 text-sm">
							<p className="font-medium">{cargo.title}</p>
							{cargo.description && <p>{cargo.description}</p>}
							{cargo.weightKg != null && <p>{cargo.weightKg} kg</p>}
						</CardContent>
					</Card>
				)}

				{(booking.status === "pending_company_response" || canCancel) && (
					<Card>
						<CardHeader>
							<CardTitle>Admin actions</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="admin-booking-note">Note or reason</Label>
								<Textarea
									id="admin-booking-note"
									value={
										booking.status === "pending_company_response"
											? note
											: reason
									}
									onChange={(event) =>
										booking.status === "pending_company_response"
											? setNote(event.target.value)
											: setReason(event.target.value)
									}
									rows={3}
								/>
							</div>
							{booking.status === "pending_company_response" ? (
								<div className="flex flex-wrap gap-2">
									<Button disabled={processing} onClick={handleAccept}>
										Accept booking
									</Button>
									<Button
										variant="destructive"
										disabled={processing}
										onClick={handleReject}
									>
										Reject booking
									</Button>
								</div>
							) : (
								<Button
									variant="destructive"
									disabled={processing}
									onClick={handleCancel}
								>
									Cancel booking
								</Button>
							)}
						</CardContent>
					</Card>
				)}
			</div>
		</DashboardShell>
	);
}
