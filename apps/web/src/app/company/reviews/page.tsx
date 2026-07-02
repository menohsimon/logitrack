"use client";

import type { Id } from "@logitrack/backend/convex/_generated/dataModel";
import { api } from "@logitrack/backend/convex/_generated/api";
import { Badge } from "@logitrack/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@logitrack/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@logitrack/ui/components/table";
import { useQuery } from "convex/react";
import { Star } from "lucide-react";

import { CompanySetup } from "@/components/company/company-setup";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { formatDate } from "@/lib/format";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`size-4 ${i < rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

function ReviewsList({
  companyId,
  company,
}: {
  companyId: Id<"companies">;
  company: { averageRating: number; reviewCount: number };
}) {
  const reviews = useQuery(api.reviews.listByCompany, { companyId });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average rating</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              {company.averageRating.toFixed(1)}
              <Star className="size-6 fill-amber-400 text-amber-400" />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total reviews</CardDescription>
            <CardTitle className="text-3xl">{company.reviewCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer reviews</CardTitle>
          <CardDescription>Published reviews from completed shipments</CardDescription>
        </CardHeader>
        <CardContent>
          {reviews === undefined ? (
            <p className="text-sm text-muted-foreground">Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reviews yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map(({ review, user }) => (
                  <TableRow key={review._id}>
                    <TableCell className="font-medium">
                      {user?.name ?? "Anonymous"}
                    </TableCell>
                    <TableCell>
                      <StarRating rating={review.rating} />
                    </TableCell>
                    <TableCell className="max-w-[280px]">
                      {review.comment ?? (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {review.tags?.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        )) ?? "—"}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(review.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function CompanyReviewsPage() {
  return (
    <DashboardShell variant="company" title="Reviews">
      <CompanySetup>
        {({ companyId, company }) => (
          <ReviewsList companyId={companyId} company={company} />
        )}
      </CompanySetup>
    </DashboardShell>
  );
}