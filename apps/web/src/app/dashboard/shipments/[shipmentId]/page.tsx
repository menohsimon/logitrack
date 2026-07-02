"use client";
import { api } from "@logitrack/backend/convex/_generated/api";

import type { Id } from "@logitrack/backend/convex/_generated/dataModel";
import { Button } from "@logitrack/ui/components/button";
import { Label } from "@logitrack/ui/components/label";
import { Textarea } from "@logitrack/ui/components/textarea";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Camera, Phone, Star, Truck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ShipmentMapCard } from "@/components/maps/shipment-map-card";
import {
	HorizontalTimeline,
	VerticalTimeline,
} from "@/components/mobile/shipment-timeline";
import { StatusPill } from "@/components/mobile/status-pill";
import { formatDate, formatDateTime } from "@/lib/format";
import { asAnchorRender, asLinkRender } from "@/lib/render-adapters";

export default function ShipmentDetailPage() {
	const params = useParams();
	const shipmentId = params.shipmentId as Id<"shipments">;

	const data = useQuery(api.shipments.getById, { shipmentId });
	const proofs = useQuery(api.proofs.listByShipment, { shipmentId });
	const confirmDelivery = useMutation(api.shipments.confirmDelivery);
	const createReview = useMutation(api.reviews.create);

	const [confirming, setConfirming] = useState(false);
	const [rating, setRating] = useState(5);
	const [comment, setComment] = useState("");
	const [submittingReview, setSubmittingReview] = useState(false);
	const [reviewSubmitted, setReviewSubmitted] = useState(false);

	async function handleConfirmDelivery() {
		setConfirming(true);
		try {
			await confirmDelivery({ shipmentId });
			toast.success("Receipt confirmed. Thank you.");
		} catch (e) {
			toast.error(
				e instanceof Error ? e.message : "Failed to confirm delivery",
			);
		} finally {
			setConfirming(false);
		}
	}

	async function handleSubmitReview() {
		setSubmittingReview(true);
		try {
			await createReview({
				shipmentId,
				rating,
				comment: comment.trim() || undefined,
			});
			toast.success("Review submitted!");
			setReviewSubmitted(true);
		} catch (e) {
			const message =
				e instanceof Error ? e.message : "Failed to submit review";
			if (message.includes("already exists")) {
				setReviewSubmitted(true);
			}
			toast.error(message);
		} finally {
			setSubmittingReview(false);
		}
	}

	if (data === undefined || proofs === undefined) {
		return (
			<p className="py-8 text-muted-foreground text-sm">Loading shipment...</p>
		);
	}

	if (!data) {
		return (
			<div className="py-8 text-center">
				<p className="text-muted-foreground">Shipment not found</p>
				<Button
					render={asLinkRender("/dashboard/shipments")}
					variant="outline"
					className="mt-4"
				>
					Back to shipments
				</Button>
			</div>
		);
	}

	const {
		shipment,
		booking,
		cargo,
		company,
		driver,
		driverUser,
		vehicle,
		transitSteps,
		currentLocation,
		events,
		review,
	} = data;
	const status = shipment.status;
	const hasReview = Boolean(review) || reviewSubmitted;
	const canConfirmReceipt =
		[
			"picked_up",
			"in_transit",
			"at_checkpoint",
			"delayed",
			"out_for_delivery",
			"delivered",
		].includes(status) && !shipment.userReceiptConfirmedAt;
	const awaitingCarrierConfirmation =
		Boolean(shipment.userReceiptConfirmedAt) &&
		status !== "delivery_confirmed";

	const timelineSteps = [
		{
			label: "Received",
			sublabel: formatDate(shipment.createdAt),
			completed: true,
		},
		{
			label: "In Transit",
			completed: [
				"in_transit",
				"out_for_delivery",
				"delivered",
				"delivery_confirmed",
				"picked_up",
				"at_checkpoint",
				"delayed",
			].includes(status),
			active: [
				"in_transit",
				"picked_up",
				"driver_assigned",
				"out_for_delivery",
				"arriving_for_pickup",
				"pickup_scheduled",
				"at_checkpoint",
				"delayed",
			].includes(status),
		},
		{
			label: "Delivered",
			completed: ["delivered", "delivery_confirmed"].includes(status),
		},
	];

	const driverPhone = driver?.phone ?? driverUser?.phone;
	const driverName = driverUser?.name ?? "Assigned driver";

	return (
		<div>
			<div className="mb-6 flex items-center gap-3">
				<Button
					render={asLinkRender("/dashboard/shipments")}
					variant="ghost"
					size="icon"
					className="rounded-full"
				>
					<ArrowLeft className="size-5" />
				</Button>
				<div className="min-w-0 flex-1">
					<p className="text-muted-foreground text-xs">Tracking ID</p>
					<h1 className="truncate font-bold text-lg">
						{shipment.shipmentNumber}
					</h1>
				</div>
				<StatusPill status={status} />
			</div>

			<section className="mb-4 rounded-3xl border bg-background p-4">
				<h2 className="mb-1 font-bold text-sm">Shipment Progress</h2>
				{shipment.currentStatusDescription && (
					<p className="mb-2 text-muted-foreground text-sm">
						{shipment.currentStatusDescription}
					</p>
				)}
				<HorizontalTimeline steps={timelineSteps} />
			</section>

			<ShipmentMapCard
				pickup={shipment.pickupLocation}
				destination={shipment.destinationLocation}
				route={shipment.routeSnapshot}
				currentLocation={currentLocation}
			/>

			<section className="mb-4 rounded-3xl border bg-background p-4">
				<h2 className="mb-3 font-bold">Delivery Details</h2>
				<div className="grid grid-cols-2 gap-4 text-sm">
					<div>
						<p className="mb-1 text-muted-foreground text-xs">Pickup</p>
						<p className="font-medium">{shipment.pickupAddress}</p>
						<p className="mt-1 text-muted-foreground">
							{formatDate(booking?.requestedPickupDate)}
						</p>
					</div>
					<div>
						<p className="mb-1 text-muted-foreground text-xs">Destination</p>
						<p className="font-medium">{shipment.destinationAddress}</p>
						<p className="mt-1 text-muted-foreground">
							{formatDate(booking?.requestedDeliveryDate)}
						</p>
					</div>
				</div>

				{cargo && (
					<div className="mt-4 border-t pt-4 text-sm">
						<p className="mb-1 text-muted-foreground text-xs">Cargo</p>
						<p className="font-medium">{cargo.title}</p>
						{cargo.description && (
							<p className="mt-1 text-muted-foreground">{cargo.description}</p>
						)}
						{cargo.weightKg && (
							<p className="mt-1 text-muted-foreground">{cargo.weightKg} kg</p>
						)}
					</div>
				)}

				{company && (
					<div className="mt-4 border-t pt-4 text-sm">
						<p className="mb-1 text-muted-foreground text-xs">Carrier</p>
						{company.slug ? (
							<Link
								href={`/dashboard/companies/${company.slug}`}
								className="font-medium text-primary hover:underline"
							>
								{company.name}
							</Link>
						) : (
							<p className="font-medium">{company.name}</p>
						)}
					</div>
				)}

				{shipment.deliveredAt && (
					<div className="mt-4 border-t pt-4 text-sm">
						<p className="mb-1 text-muted-foreground text-xs">Delivered at</p>
						<p className="font-medium">
							{formatDateTime(shipment.deliveredAt)}
						</p>
					</div>
				)}
			</section>

			{driver && (
				<section className="mb-4 rounded-3xl border bg-background p-4">
					<h2 className="mb-3 font-bold">Driver Contact</h2>
					<div className="flex items-center gap-3">
						<div className="flex size-10 items-center justify-center rounded-full bg-muted">
							<Truck className="size-5 text-muted-foreground" />
						</div>
						<div className="min-w-0 flex-1">
							<p className="font-medium">{driverName}</p>
							{driver.vehiclePlate && (
								<p className="text-muted-foreground text-xs">
									{driver.vehiclePlate}
								</p>
							)}
						</div>
						{driverPhone ? (
							<Button
								render={asAnchorRender(`tel:${driverPhone}`)}
								variant="outline"
								size="sm"
								className="rounded-full"
							>
								<Phone className="size-4" />
								Call
							</Button>
						) : (
							<p className="text-muted-foreground text-xs">No phone</p>
						)}
					</div>
				</section>
			)}

			{(vehicle || driver?.vehicleType || transitSteps.length > 0) && (
				<section className="mb-4 rounded-3xl border bg-background p-4">
					<h2 className="mb-3 font-bold">Transit details</h2>
					{vehicle || driver?.vehicleType ? (
						<div className="mb-4 text-sm">
							<p className="mb-1 text-muted-foreground text-xs">Vehicle</p>
							<p className="font-medium">
								{vehicle?.label ?? driver?.vehicleType ?? "Vehicle"}
							</p>
							<p className="text-muted-foreground">
								{vehicle?.vehicleModel ?? driver?.vehicleModel ?? ""}
								{(vehicle?.immatriculation ?? driver?.vehiclePlate)
									? ` · ${vehicle?.immatriculation ?? driver?.vehiclePlate}`
									: ""}
								{(vehicle?.loadSupportKg ?? driver?.vehicleCapacityKg) != null
									? ` · ${vehicle?.loadSupportKg ?? driver?.vehicleCapacityKg} kg`
									: ""}
							</p>
						</div>
					) : null}
					{transitSteps.length > 0 && (
						<div className="space-y-3 border-t pt-4">
							{transitSteps.map((step) => (
								<div key={step._id} className="text-sm">
									<div className="flex items-center justify-between gap-2">
										<p className="font-medium">{step.title}</p>
										<span className="text-muted-foreground text-xs">
											{step.status}
										</span>
									</div>
									{step.location && (
										<p className="text-muted-foreground">{step.location}</p>
									)}
									{step.description && (
										<p className="text-muted-foreground">{step.description}</p>
									)}
								</div>
							))}
						</div>
					)}
				</section>
			)}

			{proofs.length > 0 && (
				<section className="mb-4 rounded-3xl border bg-background p-4">
					<h2 className="mb-4 flex items-center gap-2 font-bold">
						<Camera className="size-4" />
						Proof of Pickup & Delivery
					</h2>
					<div className="grid gap-4 sm:grid-cols-2">
						{proofs.map(({ proof, url }) => (
							<div key={proof._id} className="rounded-2xl border p-3">
								<p className="mb-2 font-medium text-muted-foreground text-xs">
									{proof.type === "pickup_photo"
										? "Pickup photo"
										: "Delivery photo"}
								</p>
								{url ? (
									<a href={url} target="_blank" rel="noreferrer">
										<Image
											src={url}
											alt={proof.type}
											width={400}
											height={300}
											unoptimized
											className="aspect-video w-full rounded-xl object-cover"
										/>
									</a>
								) : (
									<p className="text-muted-foreground text-sm">
										Photo unavailable
									</p>
								)}
								<p className="mt-2 text-muted-foreground text-xs">
									{formatDateTime(proof.createdAt)}
								</p>
							</div>
						))}
					</div>
				</section>
			)}

			{events.length > 0 && (
				<section className="mb-4 rounded-3xl border bg-background p-4">
					<h2 className="mb-4 font-bold">Tracking Timeline</h2>
					<VerticalTimeline events={events} />
				</section>
			)}

			{canConfirmReceipt && (
				<section className="mb-4 rounded-3xl border bg-background p-4">
					<h2 className="mb-2 font-bold">Confirm Receipt</h2>
					<p className="mb-4 text-muted-foreground text-sm">
						Confirm when you have received your shipment. The shipment is fully
						completed once both you and the carrier confirm delivery.
					</p>
					<Button
						className="w-full rounded-full"
						disabled={confirming}
						onClick={handleConfirmDelivery}
					>
						{confirming ? "Confirming..." : "Confirm Receipt"}
					</Button>
				</section>
			)}

			{awaitingCarrierConfirmation && (
				<section className="mb-4 rounded-3xl border bg-emerald-50 p-4">
					<p className="font-medium text-emerald-700 text-sm">
						Receipt confirmed. Waiting for the carrier to mark the shipment as
						delivered.
					</p>
				</section>
			)}

			{status === "delivery_confirmed" && !hasReview && (
				<section className="mb-4 rounded-3xl border bg-background p-4">
					<h2 className="mb-3 font-bold">Rate Your Experience</h2>
					<p className="mb-4 text-muted-foreground text-sm">
						How was your delivery with {company?.name ?? "this carrier"}?
					</p>

					<div className="mb-4 flex gap-1">
						{[1, 2, 3, 4, 5].map((value) => (
							<button
								key={value}
								type="button"
								onClick={() => setRating(value)}
								className="p-1"
							>
								<Star
									className={`size-8 ${
										value <= rating
											? "fill-amber-400 text-amber-400"
											: "text-muted-foreground/30"
									}`}
								/>
							</button>
						))}
					</div>

					<div className="mb-4 space-y-2">
						<Label htmlFor="review-comment">Comment (optional)</Label>
						<Textarea
							id="review-comment"
							placeholder="Share your experience..."
							value={comment}
							onChange={(e) => setComment(e.target.value)}
							rows={3}
						/>
					</div>

					<Button
						className="w-full rounded-full"
						disabled={submittingReview}
						onClick={handleSubmitReview}
					>
						{submittingReview ? "Submitting..." : "Submit Review"}
					</Button>
				</section>
			)}

			{review && (
				<section className="mb-4 rounded-3xl border bg-background p-4">
					<h2 className="mb-2 font-bold">Your Review</h2>
					<div className="mb-2 flex gap-1">
						{[1, 2, 3, 4, 5].map((value) => (
							<Star
								key={value}
								className={`size-5 ${
									value <= review.rating
										? "fill-amber-400 text-amber-400"
										: "text-muted-foreground/30"
								}`}
							/>
						))}
					</div>
					{review.comment && <p className="text-sm">{review.comment}</p>}
				</section>
			)}

			{reviewSubmitted && !review && (
				<div className="mb-4 rounded-3xl border bg-emerald-50 p-4 text-center">
					<p className="font-medium text-emerald-700 text-sm">
						Thank you for your review!
					</p>
				</div>
			)}

			<Button
				render={asLinkRender(`/dashboard/support?shipmentId=${shipmentId}`)}
				variant="outline"
				className="w-full rounded-full"
			>
				Need help with this shipment?
			</Button>
		</div>
	);
}
