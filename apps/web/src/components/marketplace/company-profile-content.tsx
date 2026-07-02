"use client";

import { api } from "@logitrack/backend/convex/_generated/api";
import { Badge } from "@logitrack/ui/components/badge";
import { buttonVariants } from "@logitrack/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@logitrack/ui/components/card";
import { cn } from "@logitrack/ui/lib/utils";
import { useQuery } from "convex/react";
import { ArrowLeft, BriefcaseBusiness, MapPin, Package, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { formatCargoCategory } from "@/lib/estimate-fare";
import { formatDate } from "@/lib/format";
import { asRoute } from "@/lib/routes";

type CompanyProfileContentProps = {
  slug: string;
  /** Base path for company routes, e.g. `/companies` or `/dashboard/companies` */
  basePath: string;
  backHref?: string;
  backLabel?: string;
};

export function CompanyProfileContent({
  slug,
  basePath,
  backHref,
  backLabel = "Back",
}: CompanyProfileContentProps) {
  const profile = useQuery(api.companies.getPublicProfileBySlug, { slug });
  const company = profile?.company;
  const reviews = useQuery(
    api.reviews.listByCompany,
    company ? { companyId: company._id } : "skip",
  );

  if (profile === undefined) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  if (profile === null || !company) {
    return (
      <div>
        <h1 className="mb-2 text-2xl font-bold">Company not found</h1>
        <p className="mb-4 text-muted-foreground">
          This company may not exist or is not yet approved.
        </p>
        <Link
          href={asRoute(backHref ?? basePath)}
          className={buttonVariants({ variant: "outline" })}
        >
          {backLabel}
        </Link>
      </div>
    );
  }

  return (
    <div>
      {backHref && (
        <Link
          href={asRoute(backHref)}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "mb-4 -ml-2 inline-flex items-center gap-1",
          )}
        >
          <ArrowLeft className="size-4" />
          {backLabel}
        </Link>
      )}

      <div className="mb-6 overflow-hidden rounded-3xl border bg-muted">
        {profile.coverImageUrl ? (
          <Image
            src={profile.coverImageUrl}
            alt={`${company.name} cover`}
            width={1200}
            height={384}
            unoptimized
            className="h-40 w-full object-cover md:h-56"
          />
        ) : (
          <div className="h-32 bg-muted md:h-48" />
        )}
      </div>

      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-4">
          <div className="-mt-12 flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-background text-xl font-bold shadow-sm">
            {profile.logoUrl ? (
              <Image
                src={profile.logoUrl}
                alt={`${company.name} logo`}
                width={80}
                height={80}
                unoptimized
                className="size-full object-cover"
              />
            ) : (
              company.name.slice(0, 2).toUpperCase()
            )}
          </div>
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold md:text-3xl">{company.name}</h1>
              {company.verificationStatus === "approved" && (
                <Badge variant="secondary">Verified</Badge>
              )}
            </div>
            <div className="mb-4 flex items-center gap-1 text-sm">
              <Star className="size-4 fill-amber-400 text-amber-400" />
              <span className="font-medium">{company.averageRating.toFixed(1)}</span>
              <span className="text-muted-foreground">
                ({company.reviewCount} reviews · {company.completedShipmentCount}{" "}
                shipments)
              </span>
            </div>
            <p className="max-w-2xl text-muted-foreground">
              {company.description ?? "Transport and logistics provider."}
            </p>
          </div>
        </div>
        <Link
          href={asRoute(`${basePath}/${slug}/book`)}
          className={cn(buttonVariants({ size: "lg" }), "shrink-0 rounded-full")}
        >
          Book Shipment
        </Link>
      </div>

      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="size-4" /> Operating Regions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {company.operatingRegions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Not specified</p>
            ) : (
              <div className="flex flex-wrap gap-1">
                {company.operatingRegions.map((region) => (
                  <Badge key={region} variant="outline">
                    {region}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="size-4" /> Cargo Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {company.cargoCategories.map((cat) => (
                <Badge key={cat} variant="outline">
                  {formatCargoCategory(cat)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BriefcaseBusiness className="size-4" /> Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            {company.serviceCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground">Not specified</p>
            ) : (
              <div className="flex flex-wrap gap-1">
                {company.serviceCategories.map((service) => (
                  <Badge key={service} variant="outline">
                    {service}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {company.contactEmail && <p>{company.contactEmail}</p>}
            {company.phone && <p>{company.phone}</p>}
            {company.address && (
              <p className="text-muted-foreground">{company.address}</p>
            )}
            {!company.contactEmail && !company.phone && !company.address && (
              <p className="text-muted-foreground">Contact info not listed</p>
            )}
          </CardContent>
        </Card>
      </div>

      <section>
        <h2 className="mb-4 text-xl font-bold">Reviews</h2>
        {reviews === undefined ? (
          <p className="text-muted-foreground">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p className="text-muted-foreground">No reviews yet.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map(({ review, user }) => (
              <Card key={review._id}>
                <CardContent className="pt-6">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{user?.name ?? "Anonymous"}</span>
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
                    <span className="text-xs text-muted-foreground">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}