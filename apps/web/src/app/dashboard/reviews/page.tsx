"use client";

import { api } from "@logitrack/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { Star } from "lucide-react";
import Link from "next/link";

import { MobileHeader } from "@/components/mobile/mobile-header";
import { formatDate } from "@/lib/format";

export default function ReviewsPage() {
  const reviews = useQuery(api.reviews.listForCurrentUser);

  return (
    <div>
      <MobileHeader subtitle="Your reviews" />

      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Reviews</h1>
        <span className="text-sm text-muted-foreground">
          {reviews?.length ?? 0} total
        </span>
      </div>

      {reviews === undefined ? (
        <p className="text-sm text-muted-foreground">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <div className="rounded-3xl border bg-background p-8 text-center">
          <Star className="mx-auto mb-3 size-10 text-muted-foreground" />
          <p className="font-medium">No reviews yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Confirm delivery on a completed shipment to leave a review
          </p>
          <Link
            href="/dashboard/shipments"
            className="mt-4 inline-block text-sm font-medium text-primary"
          >
            View shipments →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map(({ review, company, shipment }) => (
            <div
              key={review._id}
              className="rounded-3xl border bg-background p-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-bold">
                  {company?.name ?? "Company"}
                </p>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`size-3.5 ${
                        i < review.rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
              </div>
              {review.comment && (
                <p className="text-sm text-muted-foreground">{review.comment}</p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span>{formatDate(review.createdAt)}</span>
                {shipment && (
                  <Link
                    href={`/dashboard/shipments/${shipment._id}`}
                    className="text-primary"
                  >
                    {shipment.shipmentNumber}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}