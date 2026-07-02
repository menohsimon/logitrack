"use client";
import { api } from "@logitrack/backend/convex/_generated/api";

import type { Id } from "@logitrack/backend/convex/_generated/dataModel";
import { Badge } from "@logitrack/ui/components/badge";
import { Button } from "@logitrack/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@logitrack/ui/components/card";
import { useQuery } from "convex/react";
import { ClipboardList, Package, Star, Truck } from "lucide-react";
import Link from "next/link";
import {
	CompanyOrgSwitcher,
	CompanySetup,
} from "@/components/company/company-setup";
import { StatusBadge } from "@/components/company/status-badge";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { BalanceCard } from "@/components/mobile/balance-card";
import { formatDate } from "@/lib/format";
import { asLinkRender } from "@/lib/render-adapters";

function CompanyOverview({ companyId }: { companyId: Id<"companies"> }) {
	const bookings = useQuery(api.bookings.listForCompany, { companyId });
	const shipments = useQuery(api.shipments.listForCompany, { companyId });

	const pendingBookings =
		bookings?.filter((b) => b.status === "pending_company_response") ?? [];
	const activeShipments =
		shipments?.filter(
			(s) =>
				!["delivery_confirmed", "cancelled", "disputed"].includes(s.status),
		) ?? [];

	return (
		<div className="space-y-6">
			<CompanyOrgSwitcher />

			<BalanceCard
				ownerType="company"
				title="Company Wallet"
				companyId={companyId}
				className="mb-0"
			/>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Pending bookings</CardDescription>
						<CardTitle className="text-3xl">{pendingBookings.length}</CardTitle>
					</CardHeader>
					<CardContent>
						<Button
							render={asLinkRender("/company/bookings")}
							variant="outline"
							size="sm"
						>
							View inbox
						</Button>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Active shipments</CardDescription>
						<CardTitle className="text-3xl">{activeShipments.length}</CardTitle>
					</CardHeader>
					<CardContent>
						<Button
							render={asLinkRender("/company/shipments")}
							variant="outline"
							size="sm"
						>
							View shipments
						</Button>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Total bookings</CardDescription>
						<CardTitle className="text-3xl">
							{bookings?.length ?? "—"}
						</CardTitle>
					</CardHeader>
					<CardContent className="flex items-center gap-2 text-muted-foreground text-sm">
						<Package className="size-4" />
						All time
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Completed shipments</CardDescription>
						<CardTitle className="text-3xl">
							{shipments?.filter((s) => s.status === "delivery_confirmed")
								.length ?? "—"}
						</CardTitle>
					</CardHeader>
					<CardContent className="flex items-center gap-2 text-muted-foreground text-sm">
						<Truck className="size-4" />
						Delivered & confirmed
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Booking inbox</CardTitle>
						<CardDescription>Requests awaiting your response</CardDescription>
					</CardHeader>
					<CardContent>
						{bookings === undefined ? (
							<p className="text-muted-foreground text-sm">Loading...</p>
						) : pendingBookings.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								No pending bookings
							</p>
						) : (
							<div className="space-y-3">
								{pendingBookings.slice(0, 5).map((booking) => (
									<Link
										key={booking._id}
										href={`/company/bookings/${booking._id}`}
										className="flex items-center justify-between rounded-2xl border p-3 hover:bg-muted/50"
									>
										<div>
											<p className="font-medium text-sm">
												{booking.bookingNumber}
											</p>
											<p className="max-w-[200px] truncate text-muted-foreground text-xs">
												{booking.pickupAddress} → {booking.destinationAddress}
											</p>
										</div>
										<StatusBadge status={booking.status} />
									</Link>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Active shipments</CardTitle>
						<CardDescription>Shipments currently in progress</CardDescription>
					</CardHeader>
					<CardContent>
						{shipments === undefined ? (
							<p className="text-muted-foreground text-sm">Loading...</p>
						) : activeShipments.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								No active shipments
							</p>
						) : (
							<div className="space-y-3">
								{activeShipments.slice(0, 5).map((shipment) => (
									<Link
										key={shipment._id}
										href={`/company/shipments/${shipment._id}`}
										className="flex items-center justify-between rounded-2xl border p-3 hover:bg-muted/50"
									>
										<div>
											<p className="font-medium text-sm">
												{shipment.shipmentNumber}
											</p>
											<p className="text-muted-foreground text-xs">
												Updated {formatDate(shipment.updatedAt)}
											</p>
										</div>
										<StatusBadge status={shipment.status} />
									</Link>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Quick actions</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-wrap gap-3">
					<Button render={asLinkRender("/company/profile")} variant="outline">
						<ClipboardList className="size-4" />
						Edit profile
					</Button>
					<Button
						render={asLinkRender("/company/verification")}
						variant="outline"
					>
						Verification
					</Button>
					<Button render={asLinkRender("/company/drivers")} variant="outline">
						<Truck className="size-4" />
						Manage drivers
					</Button>
					<Button render={asLinkRender("/company/reviews")} variant="outline">
						<Star className="size-4" />
						Reviews
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}

export default function CompanyDashboardPage() {
	return (
		<DashboardShell variant="company" title="Overview">
			<CompanySetup>
				{({ companyId, company }) => (
					<div className="space-y-4">
						<div className="flex flex-wrap items-center gap-2">
							<h2 className="font-semibold text-lg">{company.name}</h2>
							<StatusBadge status={company.status} />
							{company.status === "approved" && (
								<Badge variant="secondary">Verified</Badge>
							)}
						</div>
						<CompanyOverview companyId={companyId} />
					</div>
				)}
			</CompanySetup>
		</DashboardShell>
	);
}
