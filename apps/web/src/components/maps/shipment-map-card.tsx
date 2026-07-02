"use client";

import { useState } from "react";
import { Button } from "@logitrack/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@logitrack/ui/components/dialog";
import { Maximize2, Navigation } from "lucide-react";

import { formatDistance, formatEta, isStaleLocation } from "@/lib/maps/geo";
import type {
	GeoPointInput,
	RouteSnapshot,
	ShipmentMapLocation,
} from "@/lib/maps/types";
import { DynamicMap } from "./dynamic-map";

type ShipmentMapCardProps = {
	pickup?: GeoPointInput | null;
	destination?: GeoPointInput | null;
	route?: RouteSnapshot | null;
	currentLocation?: ShipmentMapLocation | null;
	title?: string;
	publicView?: boolean;
};

export function ShipmentMapCard({
	pickup,
	destination,
	route,
	currentLocation,
	title = "Shipment map",
	publicView,
}: ShipmentMapCardProps) {
	const [fullscreenOpen, setFullscreenOpen] = useState(false);

	if (!pickup || !destination) return null;

	const stale = isStaleLocation(currentLocation?.updatedAt);
	const etaSeconds = currentLocation?.etaSeconds ?? route?.durationSeconds;

	return (
		<section className="mb-4 rounded-3xl border bg-background p-4">
			<div className="mb-3 flex items-center justify-between gap-3">
				<div className="min-w-0">
					<h2 className="font-bold">{title}</h2>
					<p className="truncate text-muted-foreground text-xs">
						{formatDistance(route?.distanceMeters)} · {formatEta(etaSeconds)}
					</p>
				</div>
				<Dialog open={fullscreenOpen} onOpenChange={setFullscreenOpen}>
					<DialogTrigger
						render={(props) => (
							<Button {...props} type="button" variant="outline" size="sm">
								<Maximize2 className="size-4" />
								Full screen
							</Button>
						)}
					/>
					<DialogContent className="sm:max-w-7xl">
						<DialogHeader>
							<DialogTitle>{title}</DialogTitle>
						</DialogHeader>
						<DynamicMap
							pickup={pickup}
							destination={destination}
							route={route}
							currentLocation={currentLocation}
							heightClassName="h-[70vh]"
						/>
					</DialogContent>
				</Dialog>
			</div>
			{!fullscreenOpen && (
				<DynamicMap
					pickup={pickup}
					destination={destination}
					route={route}
					currentLocation={currentLocation}
					heightClassName="h-64"
				/>
			)}
			<div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
				<div>
					<p className="text-muted-foreground">Pickup</p>
					<p className="truncate font-medium">
						{pickup.displayName ?? "Pickup location"}
					</p>
				</div>
				<div>
					<p className="text-muted-foreground">Destination</p>
					<p className="truncate font-medium">
						{destination.displayName ?? "Destination location"}
					</p>
				</div>
				<div>
					<p className="flex items-center gap-1 text-muted-foreground">
						<Navigation className="size-3" />
						Package
					</p>
					<p className="font-medium">
						{currentLocation
							? stale
								? "Location stale"
								: publicView
									? "Coarse location"
									: "Live location"
							: "No live location yet"}
					</p>
				</div>
			</div>
		</section>
	);
}
