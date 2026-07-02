"use client";
import { api } from "@logitrack/backend/convex/_generated/api";

import type { Id } from "@logitrack/backend/convex/_generated/dataModel";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@logitrack/ui/components/alert-dialog";
import { Button } from "@logitrack/ui/components/button";
import { Label } from "@logitrack/ui/components/label";
import { Textarea } from "@logitrack/ui/components/textarea";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { StatusPill } from "@/components/mobile/status-pill";
import {
	DEFAULT_CURRENCY,
	formatCurrency,
	formatDate,
	formatDateTime,
	formatStatus,
} from "@/lib/format";
import { asLinkRender } from "@/lib/render-adapters";

export default function BookingDetailPage() {
	const params = useParams();
	const router = useRouter();
	const bookingId = params.bookingId as Id<"bookings">;

	const data = useQuery(api.bookings.getById, { bookingId });
	const cancelBooking = useMutation(api.bookings.cancelByUser);

	const [cancelReason, setCancelReason] = useState("");
	const [cancelling, setCancelling] = useState(false);
	const [dialogOpen, setDialogOpen] = useState(false);

	const canCancel =
		data?.booking &&
		(data.booking.status === "pending_company_response" ||
			(data.booking.status === "accepted" &&
				(!data.shipment ||
					[
						"created",
						"awaiting_driver_assignment",
						"driver_assigned",
						"pickup_scheduled",
						"arriving_for_pickup",
					].includes(data.shipment.status))));

	async function handleCancel() {
		setCancelling(true);
		try {
			await cancelBooking({
				bookingId,
				reason: cancelReason.trim() || undefined,
			});
			toast.success("Booking cancelled");
			setDialogOpen(false);
			router.push("/dashboard/bookings");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Failed to cancel booking");
		} finally {
			setCancelling(false);
		}
	}

	if (data === undefined) {
		return (
			<p className="py-8 text-muted-foreground text-sm">Loading booking...</p>
		);
	}

	if (!data) {
		return (
			<div className="py-8 text-center">
				<p className="text-muted-foreground">Booking not found</p>
				<Button
					render={asLinkRender("/dashboard/bookings")}
					variant="outline"
					className="mt-4"
				>
					Back to bookings
				</Button>
			</div>
		);
	}

	const { booking, cargo, company, shipment } = data;
	const fareCurrency =
		booking.fareCurrency ?? cargo?.currency ?? DEFAULT_CURRENCY;

	return (
		<div>
			<div className="mb-6 flex items-center gap-3">
				<Button
					render={asLinkRender("/dashboard/bookings")}
					variant="ghost"
					size="icon"
					className="rounded-full"
				>
					<ArrowLeft className="size-5" />
				</Button>
				<div className="min-w-0 flex-1">
					<p className="text-muted-foreground text-xs">Booking</p>
					<h1 className="truncate font-bold text-lg">
						{booking.bookingNumber}
					</h1>
				</div>
				<StatusPill status={booking.status} />
			</div>

			<section className="mb-4 space-y-4 rounded-3xl border bg-background p-4">
				<div>
					<p className="text-muted-foreground text-xs">Company</p>
					{company?.slug ? (
						<Link
							href={`/dashboard/companies/${company.slug}`}
							className="font-medium text-primary hover:underline"
						>
							{company.name}
						</Link>
					) : (
						<p className="font-medium">{company?.name ?? "—"}</p>
					)}
				</div>
				{shipment && (
					<div>
						<p className="text-muted-foreground text-xs">Shipment</p>
						<div className="flex flex-wrap items-center gap-2">
							<Link
								href={`/dashboard/shipments/${shipment._id}`}
								className="font-medium text-primary hover:underline"
							>
								Track {shipment.shipmentNumber}
							</Link>
							<StatusPill status={shipment.status} />
						</div>
					</div>
				)}
				<div>
					<p className="text-muted-foreground text-xs">Estimated fare</p>
					<p className="font-bold text-xl">
						{formatCurrency(booking.estimatedFareCents, fareCurrency)}
					</p>
				</div>
				{booking.finalFareCents != null && (
					<div>
						<p className="text-muted-foreground text-xs">Final fare</p>
						<p className="font-bold text-xl">
							{formatCurrency(booking.finalFareCents, fareCurrency)}
						</p>
					</div>
				)}
				<div>
					<p className="text-muted-foreground text-xs">Created</p>
					<p className="font-medium">{formatDateTime(booking.createdAt)}</p>
				</div>
				{booking.acceptedAt && (
					<div>
						<p className="text-muted-foreground text-xs">Accepted</p>
						<p className="font-medium">{formatDateTime(booking.acceptedAt)}</p>
					</div>
				)}
				{booking.rejectedAt && (
					<div>
						<p className="text-muted-foreground text-xs">Rejected</p>
						<p className="font-medium">{formatDateTime(booking.rejectedAt)}</p>
						{booking.rejectionReason && (
							<p className="mt-1 text-muted-foreground text-sm">
								{booking.rejectionReason}
							</p>
						)}
					</div>
				)}
				{booking.cancelledAt && (
					<div>
						<p className="text-muted-foreground text-xs">Cancelled</p>
						<p className="font-medium">{formatDateTime(booking.cancelledAt)}</p>
						{booking.cancellationReason && (
							<p className="mt-1 text-muted-foreground text-sm">
								{booking.cancellationReason}
							</p>
						)}
					</div>
				)}
				{booking.companyResponseNote && (
					<div>
						<p className="text-muted-foreground text-xs">Company note</p>
						<p className="text-sm">{booking.companyResponseNote}</p>
					</div>
				)}
			</section>

			<section className="mb-4 rounded-3xl border bg-background p-4">
				<h2 className="mb-3 font-bold">Route</h2>
				<div className="space-y-4 text-sm">
					<div>
						<p className="mb-1 text-muted-foreground text-xs">Pickup</p>
						<p className="font-medium">{booking.pickupAddress}</p>
						{booking.pickupContactName && (
							<p className="text-muted-foreground">
								{booking.pickupContactName}
							</p>
						)}
						<p className="mt-1 text-muted-foreground">
							{formatDate(booking.requestedPickupDate)}
						</p>
					</div>
					<div>
						<p className="mb-1 text-muted-foreground text-xs">Destination</p>
						<p className="font-medium">{booking.destinationAddress}</p>
						{booking.destinationContactName && (
							<p className="text-muted-foreground">
								{booking.destinationContactName}
							</p>
						)}
						<p className="mt-1 text-muted-foreground">
							{formatDate(booking.requestedDeliveryDate)}
						</p>
					</div>
				</div>
				{booking.specialInstructions && (
					<div className="mt-4 border-t pt-4 text-sm">
						<p className="mb-1 text-muted-foreground text-xs">
							Special instructions
						</p>
						<p>{booking.specialInstructions}</p>
					</div>
				)}
			</section>

			{cargo && (
				<section className="mb-4 rounded-3xl border bg-background p-4">
					<h2 className="mb-3 font-bold">Cargo</h2>
					<div className="space-y-2 text-sm">
						<div>
							<p className="text-muted-foreground text-xs">Item</p>
							<p className="font-medium">{cargo.title}</p>
						</div>
						<div>
							<p className="text-muted-foreground text-xs">Category</p>
							<p>{formatStatus(cargo.category)}</p>
						</div>
						{cargo.description && (
							<div>
								<p className="text-muted-foreground text-xs">Description</p>
								<p>{cargo.description}</p>
							</div>
						)}
						{cargo.weightKg && (
							<div>
								<p className="text-muted-foreground text-xs">Weight</p>
								<p>{cargo.weightKg} kg</p>
							</div>
						)}
						<div className="flex flex-wrap gap-2 pt-2">
							{cargo.fragile && (
								<span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700 text-xs">
									Fragile
								</span>
							)}
							{cargo.hazardous && (
								<span className="rounded-full bg-red-100 px-2 py-0.5 text-red-700 text-xs">
									Hazardous
								</span>
							)}
							{cargo.requiresRefrigeration && (
								<span className="rounded-full bg-sky-100 px-2 py-0.5 text-sky-700 text-xs">
									Refrigerated
								</span>
							)}
						</div>
					</div>
				</section>
			)}

			{canCancel && (
				<AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
					<AlertDialogTrigger
						render={(props) => (
							<Button
								variant="destructive"
								className="w-full rounded-full"
								{...props}
							>
								Cancel Booking
							</Button>
						)}
					/>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
							<AlertDialogDescription>
								Any payment hold will be refunded. This action cannot be undone.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<div className="space-y-2">
							<Label htmlFor="cancel-reason">Reason (optional)</Label>
							<Textarea
								id="cancel-reason"
								placeholder="Why are you cancelling?"
								value={cancelReason}
								onChange={(e) => setCancelReason(e.target.value)}
								rows={3}
							/>
						</div>
						<AlertDialogFooter>
							<AlertDialogCancel disabled={cancelling}>
								Keep booking
							</AlertDialogCancel>
							<AlertDialogAction
								variant="destructive"
								disabled={cancelling}
								onClick={handleCancel}
							>
								{cancelling ? "Cancelling..." : "Yes, cancel"}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			)}
		</div>
	);
}
