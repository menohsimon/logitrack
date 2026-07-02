"use client";
import { api } from "@logitrack/backend/convex/_generated/api";

import type { Doc, Id } from "@logitrack/backend/convex/_generated/dataModel";
import { Button } from "@logitrack/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@logitrack/ui/components/card";
import { Input } from "@logitrack/ui/components/input";
import { Label } from "@logitrack/ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@logitrack/ui/components/select";
import { Textarea } from "@logitrack/ui/components/textarea";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { CompanySetup } from "@/components/company/company-setup";
import { StatusBadge } from "@/components/company/status-badge";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ShipmentMapCard } from "@/components/maps/shipment-map-card";
import { VerticalTimeline } from "@/components/mobile/shipment-timeline";
import { formatCargoCategory } from "@/lib/estimate-fare";
import { formatDate, formatDateTime, formatStatus } from "@/lib/format";
import { asLinkRender } from "@/lib/render-adapters";

function ShipmentDetail({
	shipmentId,
	companyId,
}: {
	shipmentId: Id<"shipments">;
	companyId: Id<"companies">;
}) {
	const data = useQuery(api.shipments.getById, { shipmentId });
	const nextStatuses = useQuery(api.shipments.getNextStatuses, { shipmentId });
	const proofs = useQuery(api.proofs.listByShipment, { shipmentId });
	const drivers = useQuery(api.drivers.listByCompany, { companyId });
	const vehicles = useQuery(api.vehicles.listByCompany, { companyId });
	const assignDriver = useMutation(api.shipments.assignDriver);
	const transitionStatus = useMutation(api.shipments.transitionStatus);
	const markDeliveredByCompany = useMutation(
		api.shipments.markDeliveredByCompany,
	);
	const updateTransitPlan = useMutation(api.shipments.updateTransitPlan);
	const completeTransitStep = useMutation(api.shipments.completeTransitStep);
	const confirmDeliveryOverride = useMutation(
		api.shipments.confirmDeliveryOverride,
	);
	const cancelBooking = useMutation(api.bookings.cancelByCompany);

	const [selectedDriverId, setSelectedDriverId] = useState<string>("");
	const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
	const [assigning, setAssigning] = useState(false);
	const [savingPlan, setSavingPlan] = useState(false);
	const [completingStepId, setCompletingStepId] = useState<string | null>(null);
	const [stepCompletionNote, setStepCompletionNote] = useState("");
	const [transitStepsDraft, setTransitStepsDraft] = useState([
		{ title: "", location: "", description: "", driverId: "" },
	]);
	const [statusNote, setStatusNote] = useState("");
	const [proofOverrideReason, setProofOverrideReason] = useState("");
	const [transitioning, setTransitioning] = useState<string | null>(null);
	const [deliveryOverrideReason, setDeliveryOverrideReason] = useState("");
	const [cancelReason, setCancelReason] = useState("");

	const activeDrivers =
		drivers?.filter(({ driver }) => driver.status === "active") ?? [];
	const activeVehicles = vehicles?.filter((v) => v.status === "active") ?? [];

	async function handleAssignDriver() {
		if (!selectedDriverId) {
			toast.error("Select a driver");
			return;
		}
		setAssigning(true);
		try {
			await assignDriver({
				shipmentId,
				driverId: selectedDriverId as Id<"drivers">,
				vehicleId: selectedVehicleId
					? (selectedVehicleId as Id<"vehicles">)
					: undefined,
			});
			toast.success("Driver assigned");
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to assign driver",
			);
		} finally {
			setAssigning(false);
		}
	}

	async function handleSaveTransitPlan() {
		setSavingPlan(true);
		try {
			await updateTransitPlan({
				shipmentId,
				steps: transitStepsDraft.map((step) => ({
					title: step.title,
					location: step.location || undefined,
					description: step.description || undefined,
					driverId: step.driverId
						? (step.driverId as Id<"drivers">)
						: undefined,
				})),
			});
			toast.success("Transit plan saved");
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to save transit plan",
			);
		} finally {
			setSavingPlan(false);
		}
	}

	async function handleCompleteStep(stepId: Id<"transitSteps">) {
		setCompletingStepId(stepId);
		try {
			await completeTransitStep({
				stepId,
				description: stepCompletionNote.trim() || undefined,
			});
			toast.success("Transit step completed");
			setStepCompletionNote("");
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to complete transit step",
			);
		} finally {
			setCompletingStepId(null);
		}
	}

	function hasProof(type: "pickup_photo" | "delivery_photo") {
		return proofs?.some(({ proof }) => proof.type === type) ?? false;
	}

	function needsProofOverride(status: string) {
		if (status === "picked_up") {
			return (
				Boolean(data?.shipment.pickupProofRequired) && !hasProof("pickup_photo")
			);
		}
		if (status === "delivered") {
			return (
				Boolean(data?.shipment.deliveryProofRequired) &&
				!hasProof("delivery_photo")
			);
		}
		return false;
	}

	async function handleTransition(newStatus: Doc<"shipments">["status"]) {
		const overrideRequired = needsProofOverride(newStatus);
		if (overrideRequired && !proofOverrideReason.trim()) {
			toast.error("Add a reason for overriding the missing proof");
			return;
		}

		setTransitioning(newStatus);
		try {
			await transitionStatus({
				shipmentId,
				newStatus,
				description: statusNote.trim() || undefined,
				proofOverrideReason: overrideRequired
					? proofOverrideReason.trim()
					: undefined,
			});
			toast.success(`Shipment updated to ${formatStatus(newStatus)}`);
			setStatusNote("");
			setProofOverrideReason("");
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to update status",
			);
		} finally {
			setTransitioning(null);
		}
	}

	async function handleMarkDelivered() {
		const overrideRequired = needsProofOverride("delivered");
		if (overrideRequired && !proofOverrideReason.trim()) {
			toast.error("Add a reason for overriding the missing proof");
			return;
		}

		setTransitioning("delivered");
		try {
			await markDeliveredByCompany({
				shipmentId,
				description: statusNote.trim() || undefined,
				proofOverrideReason: overrideRequired
					? proofOverrideReason.trim()
					: undefined,
			});
			toast.success("Shipment marked delivered");
			setStatusNote("");
			setProofOverrideReason("");
		} catch (err) {
			toast.error(
				err instanceof Error
					? err.message
					: "Failed to mark shipment delivered",
			);
		} finally {
			setTransitioning(null);
		}
	}

	async function handleDeliveryOverride() {
		if (!deliveryOverrideReason.trim()) {
			toast.error("Add an override reason");
			return;
		}
		setTransitioning("delivery_confirmed");
		try {
			await confirmDeliveryOverride({
				shipmentId,
				reason: deliveryOverrideReason.trim(),
			});
			toast.success("Delivery confirmed");
			setDeliveryOverrideReason("");
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to confirm delivery",
			);
		} finally {
			setTransitioning(null);
		}
	}

	async function handleCancelBooking(bookingId: Id<"bookings">) {
		if (!cancelReason.trim()) {
			toast.error("Add a cancellation reason");
			return;
		}
		setTransitioning("cancelled");
		try {
			await cancelBooking({ bookingId, reason: cancelReason.trim() });
			toast.success("Shipment cancelled");
			setCancelReason("");
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to cancel shipment",
			);
		} finally {
			setTransitioning(null);
		}
	}

	if (
		data === undefined ||
		nextStatuses === undefined ||
		proofs === undefined
	) {
		return <p className="text-muted-foreground text-sm">Loading shipment...</p>;
	}

	if (!data) {
		return (
			<div className="py-8 text-center">
				<p className="text-muted-foreground">Shipment not found</p>
				<Button
					render={asLinkRender("/company/shipments")}
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
		driver,
		driverUser,
		vehicle,
		transitSteps,
		currentLocation,
		events,
	} = data;
	const currentDriverId = shipment.driverId ?? "";
	const currentVehicleId = shipment.vehicleId ?? "";
	const canAssignDriver = [
		"created",
		"awaiting_driver_assignment",
		"driver_assigned",
		"pickup_scheduled",
		"arriving_for_pickup",
	].includes(shipment.status);
	const actionableStatuses = nextStatuses.filter(
		(status) =>
			![
				"driver_assigned",
				"cancelled",
				"delivered",
				"delivery_confirmed",
			].includes(status),
	);
	const canCancel =
		Boolean(booking) &&
		[
			"created",
			"awaiting_driver_assignment",
			"driver_assigned",
			"pickup_scheduled",
			"arriving_for_pickup",
		].includes(shipment.status);
	const selectedOrCurrentDriverId = selectedDriverId || currentDriverId;
	const selectedDriver = activeDrivers.find(
		({ driver: d }) => d._id === selectedOrCurrentDriverId,
	);
	const selectedDriverLabel =
		selectedDriver?.user?.name ??
		selectedDriver?.user?.email ??
		driverUser?.name ??
		driverUser?.email ??
		"Select a driver";
	const selectedVehicle = activeVehicles.find(
		(v) => v._id === (selectedVehicleId || currentVehicleId),
	);
	const selectedVehicleLabel =
		selectedVehicle?.label ?? vehicle?.label ?? "Use driver's vehicle details";
	const canEditTransitPlan = [
		"created",
		"awaiting_driver_assignment",
		"driver_assigned",
		"pickup_scheduled",
		"arriving_for_pickup",
	].includes(shipment.status);
	const canMarkDelivered = [
		"picked_up",
		"in_transit",
		"at_checkpoint",
		"delayed",
		"out_for_delivery",
	].includes(shipment.status);

	return (
		<div className="space-y-6">
			<Button
				render={asLinkRender("/company/shipments")}
				variant="ghost"
				size="sm"
			>
				<ArrowLeft className="size-4" />
				Back to shipments
			</Button>

			<div className="flex flex-wrap items-center gap-3">
				<h2 className="font-semibold text-xl">{shipment.shipmentNumber}</h2>
				<StatusBadge status={shipment.status} />
			</div>

			<ShipmentMapCard
				pickup={shipment.pickupLocation}
				destination={shipment.destinationLocation}
				route={shipment.routeSnapshot}
				currentLocation={currentLocation}
			/>

			<div className="grid gap-6 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Route</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3 text-sm">
						<div>
							<p className="mb-1 text-muted-foreground text-xs">Pickup</p>
							<p>{shipment.pickupAddress}</p>
						</div>
						<div>
							<p className="mb-1 text-muted-foreground text-xs">Destination</p>
							<p>{shipment.destinationAddress}</p>
						</div>
						{booking && (
							<div className="space-y-2 border-t pt-3">
								<p className="text-muted-foreground">
									Booking {booking.bookingNumber} · Pickup{" "}
									{formatDate(booking.requestedPickupDate)}
								</p>
								{booking.pickupContactName && (
									<p>
										Pickup contact: {booking.pickupContactName}
										{booking.pickupContactPhone
											? ` · ${booking.pickupContactPhone}`
											: ""}
									</p>
								)}
								{booking.destinationContactName && (
									<p>
										Receiver: {booking.destinationContactName}
										{booking.destinationContactPhone
											? ` · ${booking.destinationContactPhone}`
											: ""}
									</p>
								)}
								{booking.pickupInstructions && (
									<p className="text-muted-foreground">
										Pickup instructions: {booking.pickupInstructions}
									</p>
								)}
								{booking.destinationInstructions && (
									<p className="text-muted-foreground">
										Delivery instructions: {booking.destinationInstructions}
									</p>
								)}
							</div>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Driver assignment</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{driver && driverUser ? (
							<div className="text-sm">
								<p className="font-medium">{driverUser.name}</p>
								<p className="text-muted-foreground">{driverUser.email}</p>
								<StatusBadge status={driver.status} />
							</div>
						) : (
							<p className="text-muted-foreground text-sm">
								No driver assigned yet
							</p>
						)}

						<div className="space-y-2">
							<Label>Assign driver</Label>
							<Select
								value={selectedDriverId || currentDriverId || undefined}
								onValueChange={(v) => setSelectedDriverId(v ?? "")}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select a driver">
										{selectedDriverLabel}
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									{activeDrivers.map(({ driver: d, user }) => (
										<SelectItem key={d._id} value={d._id}>
											{user?.name ?? user?.email ?? "Driver"}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Button
								disabled={
									assigning || activeDrivers.length === 0 || !canAssignDriver
								}
								onClick={handleAssignDriver}
							>
								{assigning
									? "Assigning..."
									: shipment.driverId
										? "Reassign driver"
										: "Assign driver"}
							</Button>
							{!canAssignDriver && (
								<p className="text-muted-foreground text-xs">
									Driver assignment is locked after pickup begins.
								</p>
							)}
						</div>
						<div className="space-y-2">
							<Label>Delivery vehicle</Label>
							<Select
								value={selectedVehicleId || currentVehicleId || "driver"}
								onValueChange={(v) => {
									const value = v ?? "driver";
									setSelectedVehicleId(value === "driver" ? "" : value);
								}}
							>
								<SelectTrigger className="w-full">
									<SelectValue>{selectedVehicleLabel}</SelectValue>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="driver">Use driver's vehicle</SelectItem>
									{activeVehicles.map((v) => (
										<SelectItem key={v._id} value={v._id}>
											{v.label} · {v.immatriculation}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{vehicle && (
								<p className="text-muted-foreground text-xs">
									{vehicle.vehicleType}
									{vehicle.vehicleModel ? ` · ${vehicle.vehicleModel}` : ""} ·{" "}
									{vehicle.immatriculation}
									{vehicle.loadSupportKg != null
										? ` · ${vehicle.loadSupportKg} kg`
										: ""}
								</p>
							)}
						</div>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Transit plan</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{canEditTransitPlan && (
						<div className="space-y-3">
							{transitStepsDraft.map((step, index) => (
								<div
									key={`draft-${index}`}
									className="grid gap-3 rounded-2xl border p-3 md:grid-cols-4"
								>
									<div className="space-y-2">
										<Label>Step</Label>
										<Input
											value={step.title}
											onChange={(e) => {
												const next = [...transitStepsDraft];
												next[index] = { ...step, title: e.target.value };
												setTransitStepsDraft(next);
											}}
											placeholder="Checkpoint or handoff"
										/>
									</div>
									<div className="space-y-2">
										<Label>Location</Label>
										<Input
											value={step.location}
											onChange={(e) => {
												const next = [...transitStepsDraft];
												next[index] = { ...step, location: e.target.value };
												setTransitStepsDraft(next);
											}}
										/>
									</div>
									<div className="space-y-2">
										<Label>Assign to</Label>
										<Select
											value={step.driverId || "none"}
											onValueChange={(v) => {
												const value = v ?? "none";
												const next = [...transitStepsDraft];
												next[index] = {
													...step,
													driverId: value === "none" ? "" : value,
												};
												setTransitStepsDraft(next);
											}}
										>
											<SelectTrigger>
												<SelectValue placeholder="Driver" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="none">No driver</SelectItem>
												{activeDrivers.map(({ driver: d, user }) => (
													<SelectItem key={d._id} value={d._id}>
														{user?.name ?? user?.email ?? "Driver"}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-2">
										<Label>Details</Label>
										<Input
											value={step.description}
											onChange={(e) => {
												const next = [...transitStepsDraft];
												next[index] = {
													...step,
													description: e.target.value,
												};
												setTransitStepsDraft(next);
											}}
										/>
									</div>
								</div>
							))}
							<div className="flex flex-wrap gap-2">
								<Button
									type="button"
									variant="outline"
									onClick={() =>
										setTransitStepsDraft([
											...transitStepsDraft,
											{
												title: "",
												location: "",
												description: "",
												driverId: "",
											},
										])
									}
								>
									Add step
								</Button>
								<Button disabled={savingPlan} onClick={handleSaveTransitPlan}>
									{savingPlan ? "Saving..." : "Save transit plan"}
								</Button>
							</div>
						</div>
					)}

					{transitSteps.length === 0 ? (
						<p className="text-muted-foreground text-sm">
							A default transit step is created automatically when the shipment
							goes in transit. Add custom steps here before pickup if needed.
						</p>
					) : (
						<div className="space-y-3">
							{transitSteps.map((step) => {
								const assigned = activeDrivers.find(
									({ driver: d }) => d._id === step.driverId,
								);
								return (
									<div key={step._id} className="rounded-2xl border p-3">
										<div className="flex flex-wrap items-center justify-between gap-2">
											<div>
												<p className="font-medium">{step.title}</p>
												<p className="text-muted-foreground text-xs">
													{step.location ?? "No location"}
													{assigned
														? ` · ${assigned.user?.name ?? assigned.user?.email ?? "Driver"}`
														: ""}
												</p>
											</div>
											<StatusBadge status={step.status} />
										</div>
										{step.description && (
											<p className="mt-2 text-muted-foreground text-sm">
												{step.description}
											</p>
										)}
										{step.status !== "completed" && (
											<div className="mt-3 flex flex-wrap gap-2">
												<Input
													className="max-w-sm"
													value={stepCompletionNote}
													onChange={(e) =>
														setStepCompletionNote(e.target.value)
													}
													placeholder="Completion note"
												/>
												<Button
													size="sm"
													disabled={completingStepId !== null}
													onClick={() => handleCompleteStep(step._id)}
												>
													{completingStepId === step._id
														? "Completing..."
														: "Mark completed"}
												</Button>
											</div>
										)}
									</div>
								);
							})}
						</div>
					)}
				</CardContent>
			</Card>

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
					</CardContent>
				</Card>
			)}

			{proofs.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Shipment proof</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-wrap gap-3">
						{proofs.map(({ proof, uploadedBy, url }) => (
							<div key={proof._id} className="rounded-xl border p-3 text-sm">
								<p className="font-medium">{formatStatus(proof.type)}</p>
								<p className="text-muted-foreground text-xs">
									{formatDateTime(proof.createdAt)}
								</p>
								{uploadedBy && (
									<p className="text-muted-foreground text-xs">
										Uploaded by {uploadedBy.name}
									</p>
								)}
								{url && (
									<a href={url} target="_blank" rel="noreferrer">
										<Image
											src={url}
											alt={formatStatus(proof.type)}
											width={320}
											height={200}
											unoptimized
											className="mt-2 aspect-video w-full rounded-lg object-cover"
										/>
									</a>
								)}
							</div>
						))}
					</CardContent>
				</Card>
			)}

			{(actionableStatuses.length > 0 ||
				canMarkDelivered ||
				["delivered", "disputed"].includes(shipment.status)) && (
				<Card>
					<CardHeader>
						<CardTitle>Shipment operations</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{(actionableStatuses.length > 0 || canMarkDelivered) && (
							<>
								<div className="space-y-2">
									<Label htmlFor="status-note">Tracking note</Label>
									<Textarea
										id="status-note"
										value={statusNote}
										onChange={(event) => setStatusNote(event.target.value)}
										placeholder="Add checkpoint, delay, or delivery details"
										rows={2}
									/>
								</div>
								{(actionableStatuses.some(needsProofOverride) ||
									(canMarkDelivered && needsProofOverride("delivered"))) && (
									<div className="space-y-2">
										<Label htmlFor="proof-override">
											Missing proof override reason
										</Label>
										<Textarea
											id="proof-override"
											value={proofOverrideReason}
											onChange={(event) =>
												setProofOverrideReason(event.target.value)
											}
											placeholder="Required only when completing pickup or delivery without a photo"
											rows={2}
										/>
									</div>
								)}
								<div className="flex flex-wrap gap-2">
									{canMarkDelivered && (
										<Button
											size="sm"
											disabled={transitioning !== null}
											onClick={handleMarkDelivered}
										>
											{transitioning === "delivered"
												? "Updating..."
												: "Mark delivered"}
										</Button>
									)}
									{actionableStatuses.map((status) => (
										<Button
											key={status}
											size="sm"
											disabled={transitioning !== null}
											onClick={() =>
												handleTransition(status as Doc<"shipments">["status"])
											}
										>
											{transitioning === status
												? "Updating..."
												: formatStatus(status)}
										</Button>
									))}
								</div>
							</>
						)}

						{["delivered", "disputed"].includes(shipment.status) && (
							<div className="space-y-3 border-t pt-4">
								<p className="text-muted-foreground text-sm">
									Customers normally confirm receipt. Use this override only
									when customer confirmation is unavailable.
								</p>
								<div className="space-y-2">
									<Label htmlFor="delivery-override">Override reason</Label>
									<Textarea
										id="delivery-override"
										value={deliveryOverrideReason}
										onChange={(event) =>
											setDeliveryOverrideReason(event.target.value)
										}
										rows={2}
									/>
								</div>
								<Button
									variant="outline"
									disabled={transitioning !== null}
									onClick={handleDeliveryOverride}
								>
									Confirm delivery by override
								</Button>
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{canCancel && booking && (
				<Card>
					<CardHeader>
						<CardTitle>Cancel shipment</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<p className="text-muted-foreground text-sm">
							This cancels the linked booking and notifies the customer and
							assigned driver.
						</p>
						<div className="space-y-2">
							<Label htmlFor="cancel-reason">Cancellation reason</Label>
							<Textarea
								id="cancel-reason"
								value={cancelReason}
								onChange={(event) => setCancelReason(event.target.value)}
								rows={2}
							/>
						</div>
						<Button
							variant="destructive"
							disabled={transitioning !== null}
							onClick={() => handleCancelBooking(booking._id)}
						>
							Cancel shipment
						</Button>
					</CardContent>
				</Card>
			)}

			<Card>
				<CardHeader>
					<CardTitle>Tracking timeline</CardTitle>
				</CardHeader>
				<CardContent>
					{events.length === 0 ? (
						<p className="text-muted-foreground text-sm">
							No tracking events yet
						</p>
					) : (
						<VerticalTimeline
							events={events.map((e) => ({
								title: e.title,
								description: e.description,
								createdAt: e.createdAt,
								eventType: e.eventType,
								newStatus: e.newStatus,
							}))}
						/>
					)}
					<p className="mt-4 text-muted-foreground text-xs">
						Last updated {formatDateTime(shipment.updatedAt)}
					</p>
				</CardContent>
			</Card>
		</div>
	);
}

export default function CompanyShipmentDetailPage() {
	const params = useParams();
	const shipmentId = params.shipmentId as Id<"shipments">;

	return (
		<DashboardShell variant="company" title="Shipment Detail">
			<CompanySetup>
				{({ companyId }) => (
					<ShipmentDetail shipmentId={shipmentId} companyId={companyId} />
				)}
			</CompanySetup>
		</DashboardShell>
	);
}
