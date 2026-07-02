import type { Doc } from "@logitrack/backend/convex/_generated/dataModel";
import { Badge } from "@logitrack/ui/components/badge";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@logitrack/ui/components/card";
import { MapPin, Star } from "lucide-react";
import Link from "next/link";
import { getCompanyLocationLabel } from "@/lib/company-location";
import { asRoute } from "@/lib/routes";

export function CompanyCard({
	company,
	basePath = "/companies",
}: {
	company: Doc<"companies">;
	basePath?: string;
}) {
	const location = getCompanyLocationLabel(company);

	return (
		<Link href={asRoute(`${basePath}/${company.slug}`)}>
			<Card className="h-full transition-shadow hover:shadow-md">
				<CardHeader>
					<div className="flex items-start justify-between gap-2">
						<CardTitle className="text-lg">{company.name}</CardTitle>
						{company.verificationStatus === "approved" && (
							<Badge variant="secondary">Verified</Badge>
						)}
					</div>
				</CardHeader>
				<CardContent>
					<p className="mb-3 line-clamp-2 text-muted-foreground text-sm">
						{company.description ?? "Transport and logistics provider"}
					</p>
					<div className="mb-2 flex items-center gap-1 text-muted-foreground text-sm">
						<MapPin className="size-4" />
						<span className="truncate">{location}</span>
					</div>
					<div className="mb-2 flex items-center gap-1 text-sm">
						<Star className="size-4 fill-amber-400 text-amber-400" />
						<span className="font-medium">
							{company.averageRating.toFixed(1)}
						</span>
						<span className="text-muted-foreground">
							({company.reviewCount} reviews)
						</span>
					</div>
					<div className="flex flex-wrap gap-1">
						{company.operatingRegions.slice(0, 2).map((region) => (
							<Badge key={region} variant="outline" className="text-xs">
								{region}
							</Badge>
						))}
					</div>
				</CardContent>
			</Card>
		</Link>
	);
}
