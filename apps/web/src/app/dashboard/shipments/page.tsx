"use client";

import { api } from "@logitrack/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { Package } from "lucide-react";
import Link from "next/link";

import { MobileHeader } from "@/components/mobile/mobile-header";
import { StatusPill } from "@/components/mobile/status-pill";
import { TrackingCard } from "@/components/mobile/tracking-card";
export default function ShipmentsPage() {
  const shipments = useQuery(api.shipments.listForCurrentUser);

  return (
    <div>
      <MobileHeader subtitle="Your shipments" />

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">All Shipments</h1>
        <span className="text-sm text-muted-foreground">
          {shipments?.length ?? 0} total
        </span>
      </div>

      {shipments === undefined ? (
        <p className="text-sm text-muted-foreground">Loading shipments...</p>
      ) : shipments.length === 0 ? (
        <div className="rounded-3xl border bg-background p-8 text-center">
          <Package className="size-10 mx-auto mb-3 text-muted-foreground" />
          <p className="font-medium">No shipments yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Book a company to create your first shipment
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {shipments.map((shipment) => (
            <TrackingCard
              key={shipment._id}
              shipmentId={shipment._id}
              shipmentNumber={shipment.shipmentNumber}
              status={shipment.status}
              pickupAddress={shipment.pickupAddress}
              destinationAddress={shipment.destinationAddress}
            />
          ))}
        </div>
      )}

      <section className="mt-8">
        <Link
          href="/dashboard/bookings"
          className="block rounded-2xl border bg-background p-4 text-sm text-primary font-medium"
        >
          View booking history →
        </Link>
      </section>
    </div>
  );
}