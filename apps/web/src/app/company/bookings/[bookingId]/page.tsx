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
import { Input } from "@logitrack/ui/components/input";
import { Label } from "@logitrack/ui/components/label";
import { Textarea } from "@logitrack/ui/components/textarea";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CompanySetup } from "@/components/company/company-setup";
import { StatusBadge } from "@/components/company/status-badge";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { formatCargoCategory } from "@/lib/estimate-fare";
import {
	DEFAULT_CURRENCY,
	formatCurrency,
	formatDate,
	formatDateTime,
} from "@/lib/format";
import { asLinkRender } from "@/lib/render-adapters";

function BookingDetail({ bookingId }: { bookingId: Id<"bookings"> }) {
	const router = useRouter();
	const data = useQuery(api.bookings.getById, { bookingId });
	const acceptBooking = useMutation(api.bookings.accept);
	const rejectBooking = useMutation(api.bookings.reject);
	const cancelBooking = useMutation(api.bookings.cancelByCompany);

	const [acceptNote, setAcceptNote] = useState("");
	const [fareAmount, setFareAmount] = useState("");
	const [rejectReason, setRejectReason] = useState("");
	const [cancelReason, setCancelReason] = useState("");
	const [processing, setProcessing] = useState(false);

	useEffect(() => {
		if (data?.booking && !fareAmount) {
			setFareAmount((data.booking.estimatedFareCents / 100).toFixed(2));
		}
	}, [data?.booking, fareAmount]);

	async function handleAccept() {
		const fareCents = Math.round(Number(fareAmount) * 100);
		if (!Number.isFinite(fareCents) || fareCents < 100) {
			toast.error("Enter the final fare amount");
			return;
		}
		setProcessing(true);
		try {
			const shipmentId = await acceptBooking({
				bookingId,
				fareCents,
				note: acceptNote.trim() || undefined,
			});
			toast.success("Booking accepted and payment simulated");
			router.push(`/company/shipments/${shipmentId}`);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to accept");
		} finally {
			setProcessing(false);
		}
	}

	async function handleReject() {
		if (!rejectReason.trim()) {
			toast.error("Please provide a rejection reason");
			return;
		}
		setProcessing(true);
		try {
			await rejectBooking({ bookingId, reason: rejectReason.trim() });
			toast.success("Booking rejected");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to reject");
		} finally {
			setProcessing(false);
		}
	}

	async function handleCancel() {
		if (!cancelReason.trim()) {
			toast.error("Please provide a cancellation reason");
			return;
		}
		setProcessing(true);
		try {
			await cancelBooking({ bookingId, reason: cancelReason.trim() });
			toast.success("Booking cancelled");
			setCancelReason("");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to cancel");
		} finally {
			setProcessing(false);
		}
	}

	if (data === undefined) {
		return <p className="text-muted-foreground text-sm">Loading booking...</p>;
	}

	if (!data) {
		return (
			<div className="py-8 text-center">
				<p className="text-muted-foreground">Booking not found</p>
				<Button
					render={asLinkRender("/company/bookings")}
					variant="outline"
					className="mt-4"
				>
					Back to bookings
				</Button>
			</div>
		);
	}

	const { booking, cargo, shipment } = data;
	const fareCurrency =
		booking.fareCurrency ?? cargo?.currency ?? DEFAULT_CURRENCY;
	const isPending = booking.status === "pending_company_response";
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
		<div className="space-y-6">
			<Button
				render={asLinkRender("/company/bookings")}
				variant="ghost"
				size="sm"
			>
				<ArrowLeft className="size-4" />
				Back to bookings
			</Button>

			<div className="flex flex-wrap items-center gap-3">
				<h2 className="font-semibold text-xl">{booking.bookingNumber}</h2>
				<StatusBadge status={booking.status} />
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Pickup</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2 text-sm">
						<p>{booking.pickupAddress}</p>
						{booking.pickupContactName && (
							<p className="text-muted-foreground">
								Contact: {booking.pickupContactName}
							</p>
						)}
						{booking.pickupContactPhone && (
							<p className="text-muted-foreground">
								Phone: {booking.pickupContactPhone}
							</p>
						)}
						{booking.pickupInstructions && (
							<p className="text-muted-foreground">
								{booking.pickupInstructions}
							</p>
						)}
						<p className="text-muted-foreground">
							Requested: {formatDate(booking.requestedPickupDate)}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Destination</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2 text-sm">
						<p>{booking.destinationAddress}</p>
						{booking.destinationContactName && (
							<p className="text-muted-foreground">
								Contact: {booking.destinationContactName}
							</p>
						)}
						{booking.destinationContactPhone && (
							<p className="text-muted-foreground">
								Phone: {booking.destinationContactPhone}
							</p>
						)}
						{booking.destinationInstructions && (
							<p className="text-muted-foreground">
								{booking.destinationInstructions}
							</p>
						)}
						<p className="text-muted-foreground">
							Requested: {formatDate(booking.requestedDeliveryDate)}
						</p>
					</CardContent>
				</Card>
			</div>

			{cargo && (
				<Card>
					<CardHeader>
						<CardTitle>Cargo</CardTitle>
					</CardHeader>
					<CardContent className="grid gap-2 text-sm sm:grid-cols-2">
						<p>
							<span className="text-muted-foreground">Title:</span>{" "}
							{cargo.title}
						</p>
						<p>
							<span className="text-muted-foreground">Category:</span>{" "}
							{formatCargoCategory(cargo.category)}
						</p>
						{cargo.weightKg != null && (
							<p>
								<span className="text-muted-foreground">Weight:</span>{" "}
								{cargo.weightKg} kg
							</p>
						)}
						{cargo.quantity != null && (
							<p>
								<span className="text-muted-foreground">Quantity:</span>{" "}
								{cargo.quantity}
							</p>
						)}
						{cargo.description && (
							<p className="text-muted-foreground sm:col-span-2">
								{cargo.description}
							</p>
						)}
						<div className="flex flex-wrap gap-2 text-sm sm:col-span-2">
							{cargo.fragile && (
								<span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">
									Fragile
								</span>
							)}
							{cargo.hazardous && (
								<span className="rounded-full bg-red-100 px-2 py-0.5 text-red-800">
									Hazardous
								</span>
							)}
						</div>
					</CardContent>
				</Card>
			)}

			<Card>
				<CardHeader>
					<CardTitle>Summary</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2 text-sm">
					<p>
						<span className="text-muted-foreground">Estimated fare:</span>{" "}
						{formatCurrency(booking.estimatedFareCents, fareCurrency)}
					</p>
					{booking.finalFareCents != null && (
						<p>
							<span className="text-muted-foreground">Final fare:</span>{" "}
							{formatCurrency(booking.finalFareCents, fareCurrency)}
						</p>
					)}
					<p>
						<span className="text-muted-foreground">Submitted:</span>{" "}
						{formatDateTime(booking.createdAt)}
					</p>
					{booking.specialInstructions && (
						<p>
							<span className="text-muted-foreground">Instructions:</span>{" "}
							{booking.specialInstructions}
						</p>
					)}
					{booking.rejectionReason && (
						<p className="text-destructive">
							Rejected: {booking.rejectionReason}
						</p>
					)}
					{booking.companyResponseNote && (
						<p className="text-muted-foreground">
							Note: {booking.companyResponseNote}
						</p>
					)}
					{shipment && (
						<p>
							<span className="text-muted-foreground">Shipment:</span>{" "}
							<Link
								href={`/company/shipments/${shipment._id}`}
								className="font-medium text-primary hover:underline"
							>
								{shipment.shipmentNumber}
							</Link>
						</p>
					)}
					{booking.cancellationReason && (
						<p className="text-destructive">
							Cancelled: {booking.cancellationReason}
						</p>
					)}
				</CardContent>
			</Card>

			{isPending && (
				<Card>
					<CardHeader>
						<CardTitle>Respond to booking</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="fareAmount">Final fare</Label>
							<Input
								id="fareAmount"
								type="number"
								min="1"
								step="0.01"
								value={fareAmount}
								onChange={(e) => setFareAmount(e.target.value)}
								placeholder={(booking.estimatedFareCents / 100).toFixed(2)}
							/>
							<p className="text-muted-foreground text-xs">
								Customer estimate:{" "}
								{formatCurrency(booking.estimatedFareCents, fareCurrency)}
							</p>
							<Label htmlFor="acceptNote">Acceptance note (optional)</Label>
							<Textarea
								id="acceptNote"
								value={acceptNote}
								onChange={(e) => setAcceptNote(e.target.value)}
								rows={2}
							/>
							<Button disabled={processing} onClick={handleAccept}>
								Accept booking
							</Button>
						</div>
						<div className="space-y-2 border-t pt-4">
							<Label htmlFor="rejectReason">Rejection reason</Label>
							<Textarea
								id="rejectReason"
								value={rejectReason}
								onChange={(e) => setRejectReason(e.target.value)}
								rows={2}
							/>
							<Button
								variant="destructive"
								disabled={processing}
								onClick={handleReject}
							>
								Reject booking
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{canCancel && (
				<Card>
					<CardHeader>
						<CardTitle>Cancel booking</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<p className="text-muted-foreground text-sm">
							Cancellation is only available before cargo pickup begins.
						</p>
						<div className="space-y-2">
							<Label htmlFor="cancelReason">Cancellation reason</Label>
							<Textarea
								id="cancelReason"
								value={cancelReason}
								onChange={(event) => setCancelReason(event.target.value)}
								rows={2}
							/>
						</div>
						<Button
							variant="destructive"
							disabled={processing}
							onClick={handleCancel}
						>
							Cancel booking
						</Button>
					</CardContent>
				</Card>
			)}
		</div>
	);
}

export default function CompanyBookingDetailPage() {
	const params = useParams();
	const bookingId = params.bookingId as Id<"bookings">;

	return (
		<DashboardShell variant="company" title="Booking Detail">
			<CompanySetup>
				{() => <BookingDetail bookingId={bookingId} />}
			</CompanySetup>
		</DashboardShell>
	);
}
