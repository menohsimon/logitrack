"use client";

import { api } from "@logitrack/backend/convex/_generated/api";
import type { Id } from "@logitrack/backend/convex/_generated/dataModel";
import { Badge } from "@logitrack/ui/components/badge";
import { Button } from "@logitrack/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@logitrack/ui/components/table";
import { useMutation } from "convex/react";
import { Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { useAdminQuery } from "@/hooks/use-admin-access";
import { formatDate, formatStatus } from "@/lib/format";

export default function AdminReviewsPage() {
  const reviews = useAdminQuery(api.reviews.listForAdmin, {});
  const moderate = useMutation(api.reviews.moderate);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleModerate(
    reviewId: Id<"reviews">,
    status: "published" | "hidden" | "removed",
  ) {
    setLoadingId(reviewId);
    try {
      await moderate({ reviewId, status });
      toast.success(`Review ${formatStatus(status).toLowerCase()}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to moderate review");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <DashboardShell variant="admin" title="Reviews">
      {reviews === undefined ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : reviews.length === 0 ? (
        <p className="text-muted-foreground">No reviews yet</p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rating</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((review) => (
                <TableRow key={review._id}>
                  <TableCell>
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
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate text-muted-foreground">
                    {review.comment ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        review.status === "removed"
                          ? "destructive"
                          : review.status === "hidden"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {formatStatus(review.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(review.createdAt)}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {review.status !== "published" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={loadingId === review._id}
                        onClick={() => handleModerate(review._id, "published")}
                      >
                        Publish
                      </Button>
                    )}
                    {review.status !== "hidden" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={loadingId === review._id}
                        onClick={() => handleModerate(review._id, "hidden")}
                      >
                        Hide
                      </Button>
                    )}
                    {review.status !== "removed" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={loadingId === review._id}
                        onClick={() => handleModerate(review._id, "removed")}
                      >
                        Remove
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </DashboardShell>
  );
}