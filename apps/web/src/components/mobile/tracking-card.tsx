"use client";

import Link from "next/link";

import { formatDate } from "@/lib/format";
import { HorizontalTimeline } from "./shipment-timeline";
import { StatusPill } from "./status-pill";

type TrackingCardProps = {
	shipmentId: string;
	shipmentNumber: string;
	status: string;
	pickupAddress: string;
	destinationAddress: string;
	pickupDate?: number;
	deliveryDate?: number;
};

export function TrackingCard({
	shipmentId,
	shipmentNumber,
	status,
	pickupAddress,
	destinationAddress,
	pickupDate,
	deliveryDate,
}: TrackingCardProps) {
	const steps = [
		{ label: "Booked", completed: true },
		{
			label: "In Transit",
			completed: [
				"picked_up",
				"in_transit",
				"at_checkpoint",
				"delayed",
				"out_for_delivery",
				"delivered",
				"delivery_confirmed",
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

	return (
		<Link href={`/dashboard/shipments/${shipmentId}`}>
			<div className="rounded-3xl border bg-background p-4 shadow-sm transition-shadow hover:shadow-md">
				<div className="mb-3 flex items-center justify-between">
					<p className="font-bold">{shipmentNumber}</p>
					<StatusPill status={status} />
				</div>
				<div className="mb-1 grid grid-cols-2 gap-2 text-muted-foreground text-xs">
					<div>
						<p className="font-medium text-foreground">From</p>
						<p className="truncate">{pickupAddress}</p>
						<p>{formatDate(pickupDate)}</p>
					</div>
					<div>
						<p className="font-medium text-foreground">To</p>
						<p className="truncate">{destinationAddress}</p>
						<p>{formatDate(deliveryDate)} (EST)</p>
					</div>
				</div>
				<HorizontalTimeline steps={steps} />
			</div>
		</Link>
	);
}
