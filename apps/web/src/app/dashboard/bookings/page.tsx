"use client";

import { api } from "@logitrack/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { Calendar } from "lucide-react";
import Link from "next/link";

import { MobileHeader } from "@/components/mobile/mobile-header";
import { StatusPill } from "@/components/mobile/status-pill";
import { DEFAULT_CURRENCY, formatCurrency, formatDate } from "@/lib/format";

export default function BookingsPage() {
	const bookings = useQuery(api.bookings.listForCurrentUser);

	return (
		<div>
			<MobileHeader subtitle="Your bookings" />

			<div className="mb-4 flex items-center justify-between">
				<h1 className="font-bold text-xl">Bookings</h1>
				<span className="text-muted-foreground text-sm">
					{bookings?.length ?? 0} total
				</span>
			</div>

			{bookings === undefined ? (
				<p className="text-muted-foreground text-sm">Loading bookings...</p>
			) : bookings.length === 0 ? (
				<div className="rounded-3xl border bg-background p-8 text-center">
					<Calendar className="mx-auto mb-3 size-10 text-muted-foreground" />
					<p className="font-medium">No bookings yet</p>
					<p className="mt-1 text-muted-foreground text-sm">
						Browse companies to place your first booking
					</p>
					<Link
						href="/dashboard/explore"
						className="mt-4 inline-block font-medium text-primary text-sm"
					>
						Find a company →
					</Link>
				</div>
			) : (
				<div className="space-y-3">
					{bookings.map((booking) => (
						<Link
							key={booking._id}
							href={`/dashboard/bookings/${booking._id}`}
							className="block rounded-3xl border bg-background p-4 transition-shadow hover:shadow-md"
						>
							<div className="mb-2 flex items-center justify-between">
								<p className="font-bold text-sm">{booking.bookingNumber}</p>
								<StatusPill status={booking.status} />
							</div>
							<div className="grid grid-cols-2 gap-2 text-muted-foreground text-xs">
								<div>
									<p className="font-medium text-foreground">From</p>
									<p className="truncate">{booking.pickupAddress}</p>
									<p>{formatDate(booking.requestedPickupDate)}</p>
								</div>
								<div>
									<p className="font-medium text-foreground">To</p>
									<p className="truncate">{booking.destinationAddress}</p>
									<p>{formatDate(booking.requestedDeliveryDate)}</p>
								</div>
							</div>
							<p className="mt-3 font-medium text-sm">
								{formatCurrency(
									booking.finalFareCents ?? booking.estimatedFareCents,
									booking.fareCurrency ?? DEFAULT_CURRENCY,
								)}
							</p>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
