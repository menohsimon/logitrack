"use client";

import { api } from "@logitrack/backend/convex/_generated/api";
import type { Doc, Id } from "@logitrack/backend/convex/_generated/dataModel";
import { Button } from "@logitrack/ui/components/button";
import { Input } from "@logitrack/ui/components/input";
import { Label } from "@logitrack/ui/components/label";
import { Textarea } from "@logitrack/ui/components/textarea";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Camera, Check, LocateFixed, Phone } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ShipmentMapCard } from "@/components/maps/shipment-map-card";
import {
	HorizontalTimeline,
	VerticalTimeline,
} from "@/components/mobile/shipment-timeline";
import { StatusPill } from "@/components/mobile/status-pill";
import { formatDate, formatDateTime, formatStatus } from "@/lib/format";
import { getMapRoute } from "@/lib/maps/client";
import { asLinkRender } from "@/lib/render-adapters";

type ProofType = "pickup_photo" | "delivery_photo";

function ProofUploadSection({
	shipmentId,
	type,
	label,
	uploaded,
	proofUrl,
}: {
	shipmentId: Id<"shipments">;
	type: ProofType;
	label: string;
	uploaded: boolean;
	proofUrl?: string | null;
}) {
	const generateUploadUrl = useMutation(api.proofs.generateUploadUrl);
	const attachProof = useMutation(api.proofs.attachProof);
	const [uploading, setUploading] = useState(false);

	async function handleFileChange(file: File | undefined) {
		if (!file) return;
		if (!file.type.startsWith("image/")) {
			toast.error("Select an image file");
			return;
		}
		if (file.size > 10 * 1024 * 1024) {
			toast.error("Image must be smaller than 10 MB");
			return;
		}

		setUploading(true);
		try {
			const uploadUrl = await generateUploadUrl();
			const result = await fetch(uploadUrl, {
				method: "POST",
				headers: { "Content-Type": file.type },
				body: file,
			});

			if (!result.ok) {
				throw new Error("Upload failed");
			}

			const { storageId } = (await result.json()) as {
				storageId: Id<"_storage">;
			};
			await attachProof({ shipmentId, type, storageId });
			toast.success(`${label} uploaded`);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Upload failed");
		} finally {
			setUploading(false);
		}
	}

	return (
		<div className="rounded-2xl border border-dashed p-4">
			<div className="mb-2 flex items-center gap-2">
				<Camera className="size-4 text-muted-foreground" />
				<p className="font-medium text-sm">{label}</p>
			</div>
			{uploaded ? (
				<div className="flex items-center gap-2 text-emerald-600 text-sm">
					<Check className="size-4" />
					Photo uploaded - you can update status
					{proofUrl && (
						<a
							href={proofUrl}
							target="_blank"
							className="text-primary underline"
							rel="noreferrer"
						>
							View
						</a>
					)}
				</div>
			) : (
				<div>
					<Label
						htmlFor={`proof-${type}`}
						className="text-muted-foreground text-xs"
					>
						Required before status update
					</Label>
					<Input
						id={`proof-${type}`}
						type="file"
						accept="image/*"
						capture="environment"
						className="mt-2"
						disabled={uploading}
						onChange={(e) => handleFileChange(e.target.files?.[0])}
					/>
					{uploading && (
						<p className="mt-2 text-muted-foreground text-xs">Uploading...</p>
					)}
				</div>
			)}
		</div>
	);
}

export default function DriverShipmentDetailPage() {
	const params = useParams();
	const shipmentId = params.shipmentId as Id<"shipments">;

	const data = useQuery(api.shipments.getById, { shipmentId });
	const nextStatuses = useQuery(api.shipments.getNextStatuses, { shipmentId });
	const proofs = useQuery(api.proofs.listByShipment, { shipmentId });
	const transitionStatus = useMutation(api.shipments.transitionStatus);
	const completeTransitStep = useMutation(api.shipments.completeTransitStep);
	const closeShipment = useMutation(api.shipments.closeByDriver);
	const shareCurrentLocation = useMutation(api.trackingLocations.upsertCurrent);

	const [description, setDescription] = useState("");
	const [transitioning, setTransitioning] = useState<string | null>(null);
	const [completingStepId, setCompletingStepId] = useState<string | null>(null);
	const [markingDelivered, setMarkingDelivered] = useState(false);
	const [proofOverrideReason, setProofOverrideReason] = useState("");
	const [sharingLocation, setSharingLocation] = useState(false);
	const [sendingLocation, setSendingLocation] = useState(false);
	const [locationMessage, setLocationMessage] = useState<string | null>(null);
	const etaRef = useRef<{
		calculatedAt: number;
		etaSeconds?: number;
		estimatedArrivalAt?: number;
		routeProvider?: string;
	}>({ calculatedAt: 0 });

	const pickupProof = proofs?.find(
		({ proof }) => proof.type === "pickup_photo",
	);
	const deliveryProof = proofs?.find(
		({ proof }) => proof.type === "delivery_photo",
	);
	const pickupProofUploaded = Boolean(pickupProof);
	const deliveryProofUploaded = Boolean(deliveryProof);

	const needsPickupProof = nextStatuses?.includes("picked_up") ?? false;
	const needsDeliveryProof = nextStatuses?.includes("delivered") ?? false;

	function canTransitionTo(status: string): boolean {
		if (status === "picked_up" && needsPickupProof && !pickupProofUploaded)
			return false;
		if (status === "delivered" && needsDeliveryProof && !deliveryProofUploaded)
			return false;
		return true;
	}

	async function handleTransition(newStatus: string) {
		if (!canTransitionTo(newStatus)) {
			toast.error("Upload required proof photo first");
			return;
		}

		setTransitioning(newStatus);
		try {
			await transitionStatus({
				shipmentId,
				newStatus: newStatus as Doc<"shipments">["status"],
				description: description.trim() || undefined,
			});
			toast.success(`Status updated to ${formatStatus(newStatus)}`);
			setDescription("");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Status update failed");
		} finally {
			setTransitioning(null);
		}
	}

	async function handleCompleteStep(stepId: Id<"transitSteps">) {
		setCompletingStepId(stepId);
		try {
			await completeTransitStep({
				stepId,
				description: description.trim() || undefined,
			});
			toast.success("Transit step completed");
			setDescription("");
		} catch (e) {
			toast.error(
				e instanceof Error ? e.message : "Failed to complete transit step",
			);
		} finally {
			setCompletingStepId(null);
		}
	}

	async function handleMarkDelivered() {
		const overrideRequired =
			data?.shipment.deliveryProofRequired && !deliveryProofUploaded;
		if (overrideRequired && !proofOverrideReason.trim()) {
			toast.error("Add a reason for overriding the missing proof");
			return;
		}

		setMarkingDelivered(true);
		try {
			await closeShipment({
				shipmentId,
				description: description.trim() || undefined,
				proofOverrideReason: overrideRequired
					? proofOverrideReason.trim()
					: undefined,
			});
			toast.success("Shipment marked delivered");
			setDescription("");
			setProofOverrideReason("");
		} catch (e) {
			toast.error(
				e instanceof Error ? e.message : "Failed to mark shipment delivered",
			);
		} finally {
			setMarkingDelivered(false);
		}
	}

	const handleShareCurrentLocation = useCallback(async () => {
		if (!navigator.geolocation) {
			toast.error("Geolocation is not available in this browser");
			setSharingLocation(false);
			return;
		}

		setSendingLocation(true);
		navigator.geolocation.getCurrentPosition(
			async (position) => {
				try {
					const point = {
						lat: position.coords.latitude,
						lng: position.coords.longitude,
					};
					const destination = data?.shipment.destinationLocation;
					if (
						destination &&
						Date.now() - etaRef.current.calculatedAt > 5 * 60 * 1000
					) {
						const route = await getMapRoute({
							pickup: point,
							destination,
						}).catch(() => null);
						etaRef.current = {
							calculatedAt: Date.now(),
							etaSeconds: route?.durationSeconds,
							estimatedArrivalAt: route?.durationSeconds
								? Date.now() + route.durationSeconds * 1000
								: undefined,
							routeProvider: route?.provider,
						};
					}

					const result = await shareCurrentLocation({
						shipmentId,
						lat: point.lat,
						lng: point.lng,
						accuracyMeters: position.coords.accuracy,
						heading: position.coords.heading ?? undefined,
						speedMps: position.coords.speed ?? undefined,
						capturedAt: position.timestamp,
						etaSeconds: etaRef.current.etaSeconds,
						estimatedArrivalAt: etaRef.current.estimatedArrivalAt,
						routeProvider: etaRef.current.routeProvider,
					});
					const message = result.updated
						? `Location shared with ${Math.round(position.coords.accuracy)} m accuracy`
						: "Location unchanged; server throttle skipped this update";
					setLocationMessage(message);
					if (result.updated) toast.success(message);
				} catch (error) {
					const message =
						error instanceof Error ? error.message : "Location sharing failed";
					setLocationMessage(message);
					toast.error(message);
				} finally {
					setSendingLocation(false);
				}
			},
			(error) => {
				setSendingLocation(false);
				setSharingLocation(false);
				setLocationMessage(error.message || "Location permission denied");
				toast.error(error.message || "Location permission denied");
			},
			{ enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
		);
	}, [data?.shipment.destinationLocation, shareCurrentLocation, shipmentId]);

	const locationSharingClosed = data
		? [
				"delivered",
				"delivery_confirmed",
				"cancelled",
				"failed_delivery",
				"disputed",
			].includes(data.shipment.status)
		: false;

	useEffect(() => {
		if (locationSharingClosed && sharingLocation) {
			setSharingLocation(false);
		}
	}, [locationSharingClosed, sharingLocation]);

	useEffect(() => {
		if (!sharingLocation || locationSharingClosed) return;
		void handleShareCurrentLocation();
		const interval = window.setInterval(() => {
			void handleShareCurrentLocation();
		}, 60_000);
		return () => window.clearInterval(interval);
	}, [handleShareCurrentLocation, locationSharingClosed, sharingLocation]);

	if (
		data === undefined ||
		nextStatuses === undefined ||
		proofs === undefined
	) {
		return (
			<p className="py-8 text-muted-foreground text-sm">Loading shipment...</p>
		);
	}

	if (!data) {
		return (
			<div className="py-8 text-center">
				<p className="text-muted-foreground">Shipment not found</p>
				<Button
					render={asLinkRender("/driver/shipments")}
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
		vehicle,
		transitSteps,
		currentLocation,
		events,
	} = data;
	const status = shipment.status;

	const timelineSteps = [
		{
			label: "Assigned",
			sublabel: formatDate(shipment.createdAt),
			completed: true,
		},
		{
			label: "In Transit",
			completed: [
				"in_transit",
				"out_for_delivery",
				"delivered",
				"picked_up",
				"at_checkpoint",
				"delayed",
			].includes(status),
			active: [
				"driver_assigned",
				"pickup_scheduled",
				"arriving_for_pickup",
				"picked_up",
				"in_transit",
				"at_checkpoint",
				"delayed",
				"out_for_delivery",
			].includes(status),
		},
		{
			label: "Delivered",
			completed: ["delivered", "delivery_confirmed"].includes(status),
		},
	];

	const actionableStatuses = (nextStatuses ?? []).filter(
		(s) => s !== "cancelled" && s !== "disputed",
	);
	const canMarkDelivered = [
		"picked_up",
		"in_transit",
		"at_checkpoint",
		"delayed",
		"out_for_delivery",
	].includes(status);
	const deliveryProofOverrideRequired =
		canMarkDelivered &&
		Boolean(data?.shipment.deliveryProofRequired) &&
		!deliveryProofUploaded;

	return (
		<div>
			<div className="mb-6 flex items-center gap-3">
				<Button
					render={asLinkRender("/driver/shipments")}
					variant="ghost"
					size="icon"
					className="rounded-full"
				>
					<ArrowLeft className="size-5" />
				</Button>
				<div className="min-w-0 flex-1">
					<p className="text-muted-foreground text-xs">Shipment</p>
					<h1 className="truncate font-bold text-lg">
						{shipment.shipmentNumber}
					</h1>
				</div>
				<StatusPill status={status} />
			</div>

			<section className="mb-4 rounded-3xl border bg-background p-4">
				<h2 className="mb-1 font-bold text-sm">Progress</h2>
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
				<h2 className="mb-3 font-bold">Location Sharing</h2>
				<p className="mb-3 text-muted-foreground text-sm">
					Share foreground GPS while this shipment screen is open.
				</p>
				<div className="flex flex-wrap gap-2">
					<Button
						type="button"
						variant={sharingLocation ? "default" : "outline"}
						className="rounded-full"
						disabled={locationSharingClosed}
						onClick={() => setSharingLocation((current) => !current)}
					>
						<LocateFixed className="size-4" />
						{sharingLocation ? "Sharing on" : "Start sharing"}
					</Button>
					<Button
						type="button"
						variant="outline"
						className="rounded-full"
						disabled={sendingLocation || locationSharingClosed}
						onClick={handleShareCurrentLocation}
					>
						{sendingLocation ? "Sharing..." : "Share now"}
					</Button>
				</div>
				{locationMessage && (
					<p className="mt-2 text-muted-foreground text-xs">
						{locationMessage}
					</p>
				)}
				{locationSharingClosed && (
					<p className="mt-2 text-muted-foreground text-xs">
						Location sharing is closed for this shipment status.
					</p>
				)}
			</section>

			<section className="mb-4 rounded-3xl border bg-background p-4">
				<h2 className="mb-3 font-bold">Route Details</h2>
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
					</div>
				)}

				{booking && (
					<div className="mt-4 space-y-3 border-t pt-4 text-sm">
						<div>
							<p className="mb-1 text-muted-foreground text-xs">
								Pickup contact
							</p>
							<p className="font-medium">
								{booking.pickupContactName ?? "Not provided"}
							</p>
							{booking.pickupContactPhone && (
								<a
									href={`tel:${booking.pickupContactPhone}`}
									className="mt-1 inline-flex items-center gap-1 text-primary"
								>
									<Phone className="size-3" />
									{booking.pickupContactPhone}
								</a>
							)}
							{booking.pickupInstructions && (
								<p className="mt-1 text-muted-foreground">
									{booking.pickupInstructions}
								</p>
							)}
						</div>
						<div>
							<p className="mb-1 text-muted-foreground text-xs">Receiver</p>
							<p className="font-medium">
								{booking.destinationContactName ?? "Not provided"}
							</p>
							{booking.destinationContactPhone && (
								<a
									href={`tel:${booking.destinationContactPhone}`}
									className="mt-1 inline-flex items-center gap-1 text-primary"
								>
									<Phone className="size-3" />
									{booking.destinationContactPhone}
								</a>
							)}
							{booking.destinationInstructions && (
								<p className="mt-1 text-muted-foreground">
									{booking.destinationInstructions}
								</p>
							)}
						</div>
						{booking.specialInstructions && (
							<div>
								<p className="mb-1 text-muted-foreground text-xs">
									Special instructions
								</p>
								<p>{booking.specialInstructions}</p>
							</div>
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

			{(vehicle || transitSteps.length > 0) && (
				<section className="mb-4 rounded-3xl border bg-background p-4">
					<h2 className="mb-3 font-bold">Transit Plan</h2>
					{vehicle && (
						<div className="mb-4 text-sm">
							<p className="mb-1 text-muted-foreground text-xs">Vehicle</p>
							<p className="font-medium">{vehicle.label}</p>
							<p className="text-muted-foreground">
								{vehicle.vehicleType}
								{vehicle.vehicleModel ? ` · ${vehicle.vehicleModel}` : ""} ·{" "}
								{vehicle.immatriculation}
								{vehicle.loadSupportKg != null
									? ` · ${vehicle.loadSupportKg} kg`
									: ""}
							</p>
						</div>
					)}
					{transitSteps.length > 0 && (
						<div className="space-y-3 border-t pt-4">
							{transitSteps.map((step) => (
								<div key={step._id} className="text-sm">
									<div className="flex items-center justify-between gap-2">
										<p className="font-medium">{step.title}</p>
										<span className="text-muted-foreground text-xs">
											{formatStatus(step.status)}
										</span>
									</div>
									{step.location && (
										<p className="text-muted-foreground">{step.location}</p>
									)}
									{step.description && (
										<p className="text-muted-foreground">{step.description}</p>
									)}
									{step.status !== "completed" && (
										<Button
											size="sm"
											variant="outline"
											className="mt-2 rounded-full"
											disabled={completingStepId !== null}
											onClick={() => handleCompleteStep(step._id)}
										>
											{completingStepId === step._id
												? "Completing..."
												: "Mark completed"}
										</Button>
									)}
								</div>
							))}
						</div>
					)}
				</section>
			)}

			{actionableStatuses.length > 0 && (
				<section className="mb-4 rounded-3xl border bg-background p-4">
					<h2 className="mb-3 font-bold">Update Status</h2>

					{(needsPickupProof || needsDeliveryProof) && (
						<div className="mb-4 space-y-3">
							{needsPickupProof && (
								<ProofUploadSection
									shipmentId={shipmentId}
									type="pickup_photo"
									label="Pickup photo"
									uploaded={pickupProofUploaded}
									proofUrl={pickupProof?.url}
								/>
							)}
							{needsDeliveryProof && (
								<ProofUploadSection
									shipmentId={shipmentId}
									type="delivery_photo"
									label="Delivery photo"
									uploaded={deliveryProofUploaded}
									proofUrl={deliveryProof?.url}
								/>
							)}
						</div>
					)}

					<div className="mb-4 space-y-2">
						<Label htmlFor="status-note">Note (optional)</Label>
						<Textarea
							id="status-note"
							placeholder="Add a note for the customer..."
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							rows={2}
						/>
					</div>

					<div className="flex flex-wrap gap-2">
						{actionableStatuses.map((nextStatus) => (
							<Button
								key={nextStatus}
								size="sm"
								className="rounded-full"
								disabled={
									transitioning !== null || !canTransitionTo(nextStatus)
								}
								onClick={() => handleTransition(nextStatus)}
							>
								{transitioning === nextStatus
									? "Updating..."
									: formatStatus(nextStatus)}
							</Button>
						))}
					</div>
				</section>
			)}

			{canMarkDelivered && (
				<section className="mb-4 rounded-3xl border bg-background p-4">
					<h2 className="mb-2 font-bold">Mark Delivered</h2>
					<p className="mb-4 text-muted-foreground text-sm">
						Mark the shipment as delivered once it reaches the customer. The
						shipment is fully completed once both you and the customer confirm.
					</p>
					{deliveryProofOverrideRequired && (
						<div className="mb-4 space-y-2">
							<Label htmlFor="proof-override">Missing proof override reason</Label>
							<Textarea
								id="proof-override"
								value={proofOverrideReason}
								onChange={(e) => setProofOverrideReason(e.target.value)}
								placeholder="Required when completing delivery without a photo"
								rows={2}
							/>
						</div>
					)}
					<Button
						className="w-full rounded-full"
						disabled={markingDelivered}
						onClick={handleMarkDelivered}
					>
						{markingDelivered ? "Updating..." : "Mark delivered"}
					</Button>
				</section>
			)}

			{events.length > 0 && (
				<section className="mb-4 rounded-3xl border bg-background p-4">
					<h2 className="mb-4 font-bold">Timeline</h2>
					<VerticalTimeline events={events} />
				</section>
			)}

			<Button
				render={asLinkRender(`/driver/support?shipmentId=${shipmentId}`)}
				variant="outline"
				className="w-full rounded-full"
			>
				Need help with this shipment?
			</Button>
		</div>
	);
}
