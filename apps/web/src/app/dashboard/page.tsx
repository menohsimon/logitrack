"use client";

import { api } from "@logitrack/backend/convex/_generated/api";
import { Button } from "@logitrack/ui/components/button";
import { Input } from "@logitrack/ui/components/input";
import { useQuery } from "convex/react";
import { Box, MoreHorizontal, Package, Search, Truck } from "lucide-react";
import Link from "next/link";
import { PendingInvitesPanel } from "@/components/company/pending-invites-panel";
import { PendingInvitesToast } from "@/components/company/pending-invites-toast";
import { ExploreContent } from "@/components/marketplace/explore-content";
import { BalanceCard } from "@/components/mobile/balance-card";
import { MobileHeader } from "@/components/mobile/mobile-header";
import { StatusPill } from "@/components/mobile/status-pill";
import { TrackingCard } from "@/components/mobile/tracking-card";
import { formatDate } from "@/lib/format";
import { asLinkRender } from "@/lib/render-adapters";
import { asRoute } from "@/lib/routes";

export default function DashboardPage() {
	const activeTracking = useQuery(api.shipments.getActiveForCurrentUser);
	const recentShipments = useQuery(api.shipments.listForCurrentUser);

	const activities = (recentShipments ?? [])
		.filter((s) => ["delivery_confirmed", "delivered"].includes(s.status))
		.slice(0, 3);

	return (
		<div>
			<PendingInvitesToast />
			<MobileHeader />

			<PendingInvitesPanel className="mb-6" />

			<div className="lg:hidden">
				<BalanceCard />
			</div>

			<div className="mb-6 grid grid-cols-2 gap-3">
				<Button
					render={asLinkRender("/dashboard/explore")}
					variant="outline"
					className="h-auto flex-col gap-2 rounded-2xl py-4"
				>
					<Truck className="size-5" />
					<span className="font-medium text-sm">New Shipping</span>
				</Button>
				<Button
					render={asLinkRender("/dashboard/shipments")}
					variant="outline"
					className="h-auto flex-col gap-2 rounded-2xl py-4"
				>
					<Package className="size-5" />
					<span className="font-medium text-sm">Track Shipping</span>
				</Button>
			</div>

			<div className="relative mb-6 lg:hidden">
				<Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					placeholder="Search Shipping"
					className="rounded-2xl bg-background pl-10"
				/>
				<button
					type="button"
					className="absolute top-1/2 right-3 -translate-y-1/2"
				>
					<MoreHorizontal className="size-4 text-muted-foreground" />
				</button>
			</div>

			<section className="mb-6">
				<h2 className="mb-3 font-bold">Current Tracking</h2>
				{activeTracking === undefined ? (
					<p className="text-muted-foreground text-sm">Loading...</p>
				) : activeTracking ? (
					<TrackingCard
						shipmentId={activeTracking.shipment._id}
						shipmentNumber={activeTracking.shipment.shipmentNumber}
						status={activeTracking.shipment.status}
						pickupAddress={activeTracking.shipment.pickupAddress}
						destinationAddress={activeTracking.shipment.destinationAddress}
						pickupDate={activeTracking.booking?.requestedPickupDate}
						deliveryDate={activeTracking.booking?.requestedDeliveryDate}
					/>
				) : (
					<div className="rounded-3xl border bg-background p-6 text-center">
						<Box className="mx-auto mb-2 size-8 text-muted-foreground" />
						<p className="text-muted-foreground text-sm">No active shipments</p>
						<Button
							render={asLinkRender("/dashboard/explore")}
							size="sm"
							className="mt-3 rounded-full"
						>
							Book a Company
						</Button>
					</div>
				)}
			</section>

			<section className="mb-6">
				<div className="mb-3 flex items-center justify-between">
					<h2 className="font-bold">Explore Companies</h2>
					<Link
						href={asRoute("/dashboard/explore")}
						className="text-primary text-sm"
					>
						See more
					</Link>
				</div>
				<ExploreContent
					compact
					limit={3}
					companyBasePath="/dashboard/companies"
				/>
			</section>

			<section>
				<div className="mb-3 flex items-center justify-between">
					<h2 className="font-bold">Recent Activities</h2>
					<Link href="/dashboard/shipments" className="text-primary text-sm">
						See all
					</Link>
				</div>
				{activities.length === 0 ? (
					<p className="text-muted-foreground text-sm">
						No completed shipments yet
					</p>
				) : (
					<div className="space-y-3">
						{activities.map((shipment) => (
							<Link
								key={shipment._id}
								href={`/dashboard/shipments/${shipment._id}`}
								className="block rounded-2xl border bg-background p-4"
							>
								<div className="flex items-center justify-between">
									<p className="font-bold text-sm">{shipment.shipmentNumber}</p>
									<StatusPill status={shipment.status} />
								</div>
								<p className="mt-1 text-muted-foreground text-xs">
									{formatDate(
										shipment.deliveryConfirmedAt ?? shipment.deliveredAt,
									)}
								</p>
							</Link>
						))}
					</div>
				)}
			</section>
		</div>
	);
}
