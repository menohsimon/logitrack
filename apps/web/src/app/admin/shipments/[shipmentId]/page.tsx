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
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/company/status-badge";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ShipmentMapCard } from "@/components/maps/shipment-map-card";
import { VerticalTimeline } from "@/components/mobile/shipment-timeline";
import { formatDateTime, formatStatus } from "@/lib/format";
import { asLinkRender } from "@/lib/render-adapters";

export default function AdminShipmentDetailPage() {
	const params = useParams();
	const shipmentId = params.shipmentId as Id<"shipments">;

	const data = useQuery(api.shipments.getById, { shipmentId });
	const nextStatuses = useQuery(api.shipments.getNextStatuses, { shipmentId });
	const proofs = useQuery(api.proofs.listByShipment, { shipmentId });
	const drivers = useQuery(
		api.drivers.listByCompany,
		data?.shipment.companyId ? { companyId: data.shipment.companyId } : "skip",
	);

	const assignDriver = useMutation(api.shipments.assignDriver);
	const transitionStatus = useMutation(api.shipments.transitionStatus);
	const confirmDeliveryOverride = useMutation(
		api.shipments.confirmDeliveryOverride,
	);
	const cancelBooking = useMutation(api.bookings.cancelByCompany);

	const [selectedDriverId, setSelectedDriverId] = useState("");
	const [note, setNote] = useState("");
	const [overrideReason, setOverrideReason] = useState("");
	const [processing, setProcessing] = useState<string | null>(null);

	function hasProof(type: "pickup_photo" | "delivery_photo") {
		return proofs?.some(({ proof }) => proof.type === type) ?? false;
	}

	function needsProofOverride(status: string) {
		if (status === "picked_up") return !hasProof("pickup_photo");
		if (status === "delivered") return !hasProof("delivery_photo");
		return false;
	}

	async function handleAssign() {
		if (!selectedDriverId) {
			toast.error("Select a driver");
			return;
		}
		setProcessing("driver");
		try {
			await assignDriver({
				shipmentId,
				driverId: selectedDriverId as Id<"drivers">,
			});
			toast.success("Driver assigned");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Assignment failed");
		} finally {
			setProcessing(null);
		}
	}

	async function handleTransition(status: Doc<"shipments">["status"]) {
		const requiresOverride = needsProofOverride(status);
		if (requiresOverride && !overrideReason.trim()) {
			toast.error("Add a proof override reason");
			return;
		}
		setProcessing(status);
		try {
			await transitionStatus({
				shipmentId,
				newStatus: status,
				description: note.trim() || undefined,
				proofOverrideReason: requiresOverride
					? overrideReason.trim()
					: undefined,
			});
			toast.success(`Shipment updated to ${formatStatus(status)}`);
			setNote("");
			setOverrideReason("");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Update failed");
		} finally {
			setProcessing(null);
		}
	}

	async function handleDeliveryConfirmation() {
		if (!overrideReason.trim()) {
			toast.error("Add an override reason");
			return;
		}
		setProcessing("delivery_confirmed");
		try {
			await confirmDeliveryOverride({
				shipmentId,
				reason: overrideReason.trim(),
			});
			toast.success("Delivery confirmed");
			setOverrideReason("");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Confirmation failed",
			);
		} finally {
			setProcessing(null);
		}
	}

	async function handleCancel(bookingId: Id<"bookings">) {
		if (!overrideReason.trim()) {
			toast.error("Add a cancellation reason");
			return;
		}
		setProcessing("cancelled");
		try {
			await cancelBooking({ bookingId, reason: overrideReason.trim() });
			toast.success("Shipment cancelled");
			setOverrideReason("");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Cancellation failed",
			);
		} finally {
			setProcessing(null);
		}
	}

	if (
		data === undefined ||
		nextStatuses === undefined ||
		proofs === undefined
	) {
		return (
			<DashboardShell variant="admin" title="Shipment">
				<p className="text-muted-foreground">Loading...</p>
			</DashboardShell>
		);
	}

	if (!data) {
		return (
			<DashboardShell variant="admin" title="Shipment">
				<p className="text-muted-foreground">Shipment not found.</p>
				<Button
					render={asLinkRender("/admin/shipments")}
					variant="outline"
					className="mt-4"
				>
					Back to shipments
				</Button>
			</DashboardShell>
		);
	}

	const {
		shipment,
		booking,
		cargo,
		company,
		driverUser,
		transitSteps,
		currentLocation,
		events,
	} = data;
	const activeDrivers =
		drivers?.filter(({ driver }) => driver.status === "active") ?? [];
	const canAssign = [
		"created",
		"awaiting_driver_assignment",
		"driver_assigned",
		"pickup_scheduled",
		"arriving_for_pickup",
	].includes(shipment.status);
	const canCancel = canAssign;
	const actionableStatuses = nextStatuses.filter(
		(status) =>
			!["driver_assigned", "cancelled", "delivery_confirmed"].includes(status),
	);
	const completedTransitSteps = transitSteps.filter(
		(step) => step.status === "completed",
	).length;
	const allTransitStepsCompleted =
		transitSteps.length > 0 && completedTransitSteps === transitSteps.length;

	return (
		<DashboardShell variant="admin" title="Shipment Detail">
			<div className="space-y-6">
				<div className="flex flex-wrap items-center gap-3">
					<h1 className="font-semibold text-xl">{shipment.shipmentNumber}</h1>
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
							<CardTitle>Route and cargo</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3 text-sm">
							<p>
								<span className="text-muted-foreground">Company:</span>{" "}
								{company?.name ?? "Unknown"}
							</p>
							<p>
								<span className="text-muted-foreground">Pickup:</span>{" "}
								{shipment.pickupAddress}
							</p>
							<p>
								<span className="text-muted-foreground">Destination:</span>{" "}
								{shipment.destinationAddress}
							</p>
							{cargo && (
								<p>
									<span className="text-muted-foreground">Cargo:</span>{" "}
									{cargo.title}
								</p>
							)}
							{driverUser && (
								<p>
									<span className="text-muted-foreground">Driver:</span>{" "}
									{driverUser.name}
								</p>
							)}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Driver assignment</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<Select
								value={selectedDriverId || shipment.driverId || undefined}
								onValueChange={(value) => setSelectedDriverId(value ?? "")}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select an active driver" />
								</SelectTrigger>
								<SelectContent>
									{activeDrivers.map(({ driver, user }) => (
										<SelectItem key={driver._id} value={driver._id}>
											{user?.name ?? user?.email ?? "Driver"}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Button
								disabled={!canAssign || processing !== null}
								onClick={handleAssign}
							>
								{shipment.driverId ? "Reassign driver" : "Assign driver"}
							</Button>
							{!canAssign && (
								<p className="text-muted-foreground text-xs">
									Assignment is locked after pickup begins.
								</p>
							)}
						</CardContent>
					</Card>
				</div>

				{proofs.length > 0 && (
					<Card>
						<CardHeader>
							<CardTitle>Proof</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-wrap gap-3">
							{proofs.map(({ proof, url }) => (
								<div key={proof._id} className="rounded-xl border p-3 text-sm">
									<p className="font-medium">{formatStatus(proof.type)}</p>
									{url && (
										<a
											href={url}
											target="_blank"
											rel="noreferrer"
											className="text-primary text-xs hover:underline"
										>
											View proof
										</a>
									)}
								</div>
							))}
						</CardContent>
					</Card>
				)}

				<Card>
					<CardHeader>
						<CardTitle>Transit completion</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="flex flex-wrap items-center justify-between gap-2 text-sm">
							<p className="text-muted-foreground">
								{completedTransitSteps} of {transitSteps.length} transit steps
								completed
							</p>
							<StatusBadge
								status={
									shipment.status === "delivery_confirmed"
										? "delivery_confirmed"
										: allTransitStepsCompleted
											? "completed"
											: "pending"
								}
							/>
						</div>
						{transitSteps.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								No transit plan has been recorded for this shipment.
							</p>
						) : (
							<div className="space-y-2">
								{transitSteps.map((step) => (
									<div
										key={step._id}
										className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3 text-sm"
									>
										<div>
											<p className="font-medium">{step.title}</p>
											{step.location && (
												<p className="text-muted-foreground text-xs">
													{step.location}
												</p>
											)}
										</div>
										<StatusBadge status={step.status} />
									</div>
								))}
							</div>
						)}
						{shipment.status === "delivered" && allTransitStepsCompleted && (
							<p className="text-muted-foreground text-sm">
								The assigned driver can now close this shipment to confirm
								reception.
							</p>
						)}
					</CardContent>
				</Card>

				{(actionableStatuses.length > 0 ||
					["delivered", "disputed"].includes(shipment.status) ||
					canCancel) && (
					<Card>
						<CardHeader>
							<CardTitle>Admin operations</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="admin-status-note">Public tracking note</Label>
								<Textarea
									id="admin-status-note"
									value={note}
									onChange={(event) => setNote(event.target.value)}
									rows={2}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="admin-override-reason">
									Override or cancellation reason
								</Label>
								<Textarea
									id="admin-override-reason"
									value={overrideReason}
									onChange={(event) => setOverrideReason(event.target.value)}
									rows={2}
								/>
							</div>
							<div className="flex flex-wrap gap-2">
								{actionableStatuses.map((status) => (
									<Button
										key={status}
										size="sm"
										disabled={processing !== null}
										onClick={() =>
											handleTransition(status as Doc<"shipments">["status"])
										}
									>
										{formatStatus(status)}
									</Button>
								))}
								{["delivered", "disputed"].includes(shipment.status) && (
									<Button
										variant="outline"
										disabled={processing !== null}
										onClick={handleDeliveryConfirmation}
									>
										Confirm delivery override
									</Button>
								)}
								{canCancel && booking && (
									<Button
										variant="destructive"
										disabled={processing !== null}
										onClick={() => handleCancel(booking._id)}
									>
										Cancel shipment
									</Button>
								)}
							</div>
						</CardContent>
					</Card>
				)}

				<Card>
					<CardHeader>
						<CardTitle>Tracking timeline</CardTitle>
					</CardHeader>
					<CardContent>
						<VerticalTimeline events={events} />
						<p className="mt-4 text-muted-foreground text-xs">
							Last updated {formatDateTime(shipment.updatedAt)}
						</p>
					</CardContent>
				</Card>
			</div>
		</DashboardShell>
	);
}
