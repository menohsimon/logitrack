"use client";

import { api } from "@logitrack/backend/convex/_generated/api";
import { Button, buttonVariants } from "@logitrack/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@logitrack/ui/components/card";
import { Input } from "@logitrack/ui/components/input";
import { Label } from "@logitrack/ui/components/label";
import { useQuery } from "convex/react";
import { Search } from "lucide-react";
import Link from "next/link";
import type { FormEvent } from "react";
import { useState } from "react";

import { ShipmentMapCard } from "@/components/maps/shipment-map-card";
import { formatDateTime, formatStatus } from "@/lib/format";

export default function TrackPage() {
	const [input, setInput] = useState("");
	const [trackingNumber, setTrackingNumber] = useState("");
	const tracking = useQuery(
		api.shipments.getPublicByNumber,
		trackingNumber ? { shipmentNumber: trackingNumber } : "skip",
	);

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setTrackingNumber(input.trim().toUpperCase());
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="max-w-2xl">
				<h1 className="mb-2 font-bold text-3xl">Track Shipment</h1>
				<p className="mb-6 text-muted-foreground">
					Enter a shipment number to view the public shipment timeline.
				</p>
				<form onSubmit={handleSubmit} className="flex gap-3">
					<div className="flex-1 space-y-2">
						<Label htmlFor="tracking-number">Shipment number</Label>
						<Input
							id="tracking-number"
							value={input}
							onChange={(event) => setInput(event.target.value)}
							placeholder="PAQ-123-ABC"
						/>
					</div>
					<Button type="submit" className="mt-7">
						<Search className="size-4" /> Track
					</Button>
				</form>
			</div>

			{trackingNumber && tracking === undefined && (
				<p className="mt-8 text-muted-foreground">
					Loading tracking details...
				</p>
			)}

			{trackingNumber && tracking === null && (
				<Card className="mt-8 max-w-2xl">
					<CardContent className="pt-6">
						<p className="text-muted-foreground">
							No shipment was found for that number.
						</p>
					</CardContent>
				</Card>
			)}

			{tracking && (
				<div className="mt-8 space-y-6">
					<ShipmentMapCard
						pickup={tracking.shipment.pickupLocation}
						destination={tracking.shipment.destinationLocation}
						route={tracking.shipment.routeSnapshot}
						currentLocation={tracking.currentLocation}
						title="Public shipment map"
						publicView
					/>
					<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
						<Card>
							<CardHeader>
								<CardTitle>{tracking.shipment.shipmentNumber}</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<p className="text-muted-foreground text-sm">Status</p>
									<p className="font-medium">
										{formatStatus(tracking.shipment.status)}
									</p>
								</div>
								<div>
									<p className="text-muted-foreground text-sm">Route</p>
									<p>{tracking.shipment.pickupAddress}</p>
									<p>{tracking.shipment.destinationAddress}</p>
								</div>
								{tracking.company && (
									<Link
										href={`/companies/${tracking.company.slug}`}
										className={buttonVariants({ variant: "outline" })}
									>
										View company
									</Link>
								)}
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Timeline</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								{tracking.events.length === 0 ? (
									<p className="text-muted-foreground text-sm">
										No public events yet.
									</p>
								) : (
									tracking.events.map((event) => (
										<div key={event._id} className="border-l pl-4">
											<p className="font-medium">{event.title}</p>
											{event.description && (
												<p className="text-muted-foreground text-sm">
													{event.description}
												</p>
											)}
											<p className="mt-1 text-muted-foreground text-xs">
												{formatDateTime(event.createdAt)}
											</p>
										</div>
									))
								)}
							</CardContent>
						</Card>
					</div>
				</div>
			)}
		</div>
	);
}
