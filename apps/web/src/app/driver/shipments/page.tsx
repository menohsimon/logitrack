"use client";

import { api } from "@logitrack/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { Package } from "lucide-react";
import Link from "next/link";

import { MobileHeader } from "@/components/mobile/mobile-header";
import { HorizontalTimeline } from "@/components/mobile/shipment-timeline";
import { StatusPill } from "@/components/mobile/status-pill";
import { formatDate } from "@/lib/format";

export default function DriverShipmentsPage() {
	const driverData = useQuery(api.drivers.getCurrentDriver);
	const shipments = useQuery(
		api.drivers.listAssignedShipments,
		driverData ? {} : "skip",
	);

	if (driverData === undefined) {
		return (
			<div>
				<MobileHeader subtitle="Assigned shipments" />
				<p className="text-muted-foreground text-sm">
					Loading driver profile...
				</p>
			</div>
		);
	}

	if (driverData === null) {
		return (
			<div>
				<MobileHeader subtitle="Driver portal" />
				<div className="rounded-3xl border bg-background p-8 text-center">
					<Package className="mx-auto mb-3 size-10 text-muted-foreground" />
					<p className="font-medium">Driver profile not active</p>
					<p className="mt-1 text-muted-foreground text-sm">
						Ask your company manager to invite you as a driver, then accept the
						invite from notifications.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div>
			<MobileHeader
				subtitle={driverData?.company?.name ?? "Assigned shipments"}
			/>

			<div className="mb-4 flex items-center justify-between">
				<h1 className="font-bold text-xl">My Shipments</h1>
				<span className="text-muted-foreground text-sm">
					{shipments?.length ?? 0} active
				</span>
			</div>

			{shipments === undefined ? (
				<p className="text-muted-foreground text-sm">Loading shipments...</p>
			) : shipments.length === 0 ? (
				<div className="rounded-3xl border bg-background p-8 text-center">
					<Package className="mx-auto mb-3 size-10 text-muted-foreground" />
					<p className="font-medium">No active shipments</p>
					<p className="mt-1 text-muted-foreground text-sm">
						Check back when your manager assigns you a route
					</p>
				</div>
			) : (
				<div className="space-y-3">
					{shipments.map((shipment) => (
						<Link
							key={shipment._id}
							href={`/driver/shipments/${shipment._id}`}
							className="block rounded-3xl border bg-background p-4 shadow-sm transition-shadow hover:shadow-md"
						>
							<div className="mb-3 flex items-center justify-between">
								<p className="font-bold">{shipment.shipmentNumber}</p>
								<StatusPill status={shipment.status} />
							</div>
							<div className="grid grid-cols-2 gap-2 text-muted-foreground text-xs">
								<div>
									<p className="font-medium text-foreground">Pickup</p>
									<p className="truncate">{shipment.pickupAddress}</p>
								</div>
								<div>
									<p className="font-medium text-foreground">Destination</p>
									<p className="truncate">{shipment.destinationAddress}</p>
								</div>
							</div>
							<HorizontalTimeline
								steps={[
									{ label: "Assigned", completed: true },
									{
										label: "In Transit",
										completed: [
											"in_transit",
											"out_for_delivery",
											"delivered",
											"picked_up",
											"at_checkpoint",
											"delayed",
										].includes(shipment.status),
										active: [
											"driver_assigned",
											"pickup_scheduled",
											"arriving_for_pickup",
											"picked_up",
											"in_transit",
											"at_checkpoint",
											"delayed",
											"out_for_delivery",
										].includes(shipment.status),
									},
									{
										label: "Delivered",
										completed: ["delivered", "delivery_confirmed"].includes(
											shipment.status,
										),
									},
								]}
							/>
							<p className="mt-2 text-muted-foreground text-xs">
								Updated {formatDate(shipment.updatedAt)}
							</p>
						</Link>
					))}
				</div>
			)}

			<section className="mt-8 rounded-3xl border bg-background p-4">
				<h2 className="font-bold">History</h2>
				<p className="mt-1 text-muted-foreground text-sm">
					Completed and cancelled assignments stay available from shipment
					notification links.
				</p>
			</section>
		</div>
	);
}
