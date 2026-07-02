"use client";

import { api } from "@logitrack/backend/convex/_generated/api";
import { Button } from "@logitrack/ui/components/button";
import { useQuery } from "convex/react";
import { Package, Truck } from "lucide-react";
import Link from "next/link";
import { BalanceCard } from "@/components/mobile/balance-card";
import { MobileHeader } from "@/components/mobile/mobile-header";
import { HorizontalTimeline } from "@/components/mobile/shipment-timeline";
import { StatusPill } from "@/components/mobile/status-pill";
import { formatDate } from "@/lib/format";
import { asLinkRender } from "@/lib/render-adapters";

export default function DriverOverviewPage() {
	const driverData = useQuery(api.drivers.getCurrentDriver);
	const assignedShipments = useQuery(
		api.drivers.listAssignedShipments,
		driverData ? {} : "skip",
	);

	const companyName = driverData?.company?.name ?? "Your company";
	const activeCount = assignedShipments?.length ?? 0;
	const preview = assignedShipments?.slice(0, 3) ?? [];

	if (driverData === undefined) {
		return (
			<div>
				<MobileHeader subtitle="Driver portal" />
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
					<Truck className="mx-auto mb-3 size-10 text-muted-foreground" />
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
			<MobileHeader subtitle={companyName} />

			<BalanceCard ownerType="driver" title="Driver Wallet" />

			<div className="mb-6 grid grid-cols-2 gap-3">
				<div className="rounded-2xl border bg-background p-4">
					<Truck className="mb-2 size-5 text-muted-foreground" />
					<p className="font-bold text-2xl">{activeCount}</p>
					<p className="text-muted-foreground text-xs">Active assignments</p>
				</div>
				<Button
					render={asLinkRender("/driver/shipments")}
					variant="outline"
					className="h-auto flex-col gap-2 rounded-2xl py-4"
				>
					<Package className="size-5" />
					<span className="font-medium text-sm">View All</span>
				</Button>
			</div>

			<section>
				<div className="mb-3 flex items-center justify-between">
					<h2 className="font-bold">Assigned Shipments</h2>
					<Link href="/driver/shipments" className="text-primary text-sm">
						See all
					</Link>
				</div>

				{assignedShipments === undefined ? (
					<p className="text-muted-foreground text-sm">
						Loading assignments...
					</p>
				) : preview.length === 0 ? (
					<div className="rounded-3xl border bg-background p-8 text-center">
						<Package className="mx-auto mb-3 size-10 text-muted-foreground" />
						<p className="font-medium">No active assignments</p>
						<p className="mt-1 text-muted-foreground text-sm">
							New shipments will appear here when assigned to you
						</p>
					</div>
				) : (
					<div className="space-y-3">
						{preview.map((shipment) => (
							<Link
								key={shipment._id}
								href={`/driver/shipments/${shipment._id}`}
								className="block rounded-3xl border bg-background p-4 shadow-sm transition-shadow hover:shadow-md"
							>
								<div className="mb-3 flex items-center justify-between">
									<p className="font-bold">{shipment.shipmentNumber}</p>
									<StatusPill status={shipment.status} />
								</div>
								<div className="mb-1 grid grid-cols-2 gap-2 text-muted-foreground text-xs">
									<div>
										<p className="font-medium text-foreground">From</p>
										<p className="truncate">{shipment.pickupAddress}</p>
									</div>
									<div>
										<p className="font-medium text-foreground">To</p>
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
			</section>
		</div>
	);
}
