"use client";

import { api } from "@logitrack/backend/convex/_generated/api";
import { Button } from "@logitrack/ui/components/button";
import { Input } from "@logitrack/ui/components/input";
import { Label } from "@logitrack/ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@logitrack/ui/components/select";
import { useQuery } from "convex/react";
import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { CompanyCard } from "@/components/marketplace/company-card";
import { useCurrentTown } from "@/hooks/use-current-town";
import { groupCompaniesByLocation } from "@/lib/company-location";
import { CARGO_CATEGORIES } from "@/lib/estimate-fare";
import { townMatches } from "@/lib/towns";

export function ExploreContent({
	compact = false,
	limit,
	companyBasePath = "/companies",
}: {
	compact?: boolean;
	limit?: number;
	companyBasePath?: string;
}) {
	const [search, setSearch] = useState("");
	const [region, setRegion] = useState<string>("all");
	const [category, setCategory] = useState<string>("all");
	const [minRating, setMinRating] = useState<string>("all");
	const [showAllTowns, setShowAllTowns] = useState(false);
	const { town, loading: detectingTown, detectTown } = useCurrentTown();
	const detectionStartedRef = useRef(false);

	const allCompanies = useQuery(api.companies.listApproved, {});
	const companies = useQuery(api.companies.listApproved, {
		search: search.trim() || undefined,
		region: region !== "all" ? region : undefined,
		category: category !== "all" ? category : undefined,
		minRating: minRating !== "all" ? Number(minRating) : undefined,
	});

	const regions = useMemo(() => {
		if (!allCompanies) return [];
		const set = new Set<string>();
		for (const company of allCompanies) {
			for (const r of company.operatingRegions) set.add(r);
		}
		return Array.from(set).sort();
	}, [allCompanies]);

	const filteredCompanies = companies ?? [];
	const canUseTownFilter = !compact && region === "all" && Boolean(town);
	const nearbyCompanies = canUseTownFilter
		? filteredCompanies.filter((company) =>
				company.operatingRegions.some((companyTown) =>
					town ? townMatches(companyTown, town) : false,
				),
			)
		: [];
	const otherCompanies = canUseTownFilter
		? filteredCompanies.filter(
				(company) =>
					!company.operatingRegions.some((companyTown) =>
						town ? townMatches(companyTown, town) : false,
					),
			)
		: [];
	const locationScopedCompanies =
		canUseTownFilter && nearbyCompanies.length > 0 && !showAllTowns
			? nearbyCompanies
			: canUseTownFilter && nearbyCompanies.length > 0 && showAllTowns
				? [...nearbyCompanies, ...otherCompanies]
				: filteredCompanies;
	const displayed = companies
		? limit
			? locationScopedCompanies.slice(0, limit)
			: locationScopedCompanies
		: undefined;
	const companyGroups = useMemo(
		() => (displayed ? groupCompaniesByLocation(displayed) : []),
		[displayed],
	);
	const hiddenTownCount =
		canUseTownFilter && nearbyCompanies.length > 0 && !showAllTowns
			? otherCompanies.length
			: 0;

	useEffect(() => {
		if (compact || detectionStartedRef.current) return;
		detectionStartedRef.current = true;
		void detectTown();
	}, [compact, detectTown]);

	return (
		<div>
			{!compact && (
				<div className="mb-6">
					<h1 className="mb-1 font-bold text-2xl">Explore</h1>
					<p className="text-muted-foreground text-sm">
						Discover verified transport companies and book your next shipment.
					</p>
				</div>
			)}

			{!compact && (
				<div className="mb-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem_12rem_10rem]">
					<div className="space-y-2">
						<Label htmlFor="company-search">Search</Label>
						<div className="relative">
							<Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								id="company-search"
								placeholder="Search companies..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="rounded-xl pl-10"
							/>
						</div>
					</div>
					<div className="space-y-2">
						<p className="font-medium text-sm">Region</p>
						<Select value={region} onValueChange={(v) => setRegion(v ?? "all")}>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="All regions" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All regions</SelectItem>
								{regions.map((r) => (
									<SelectItem key={r} value={r}>
										{r}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<p className="font-medium text-sm">Cargo type</p>
						<Select
							value={category}
							onValueChange={(v) => setCategory(v ?? "all")}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="All categories" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All categories</SelectItem>
								{CARGO_CATEGORIES.map((c) => (
									<SelectItem key={c.value} value={c.value}>
										{c.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<p className="font-medium text-sm">Min rating</p>
						<Select
							value={minRating}
							onValueChange={(v) => setMinRating(v ?? "all")}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Any" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Any</SelectItem>
								<SelectItem value="3">3+ stars</SelectItem>
								<SelectItem value="4">4+ stars</SelectItem>
								<SelectItem value="4.5">4.5+ stars</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			)}

			{!compact && region === "all" && (
				<div className="mb-6 rounded-2xl border bg-muted/30 p-4">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<p className="font-medium text-sm">
								{town
									? `Showing companies in ${town} first`
									: "Find companies near your current town"}
							</p>
							<p className="text-muted-foreground text-xs">
								Location is detected from your browser GPS and reverse geocoded.
							</p>
						</div>
						<Button
							type="button"
							variant="outline"
							size="sm"
							disabled={detectingTown}
							onClick={() => {
								setShowAllTowns(false);
								void detectTown();
							}}
						>
							{detectingTown
								? "Detecting..."
								: town
									? "Refresh town"
									: "Use my town"}
						</Button>
					</div>
				</div>
			)}

			{displayed === undefined ? (
				<p className="text-muted-foreground text-sm">Loading companies...</p>
			) : displayed.length === 0 ? (
				<p className="text-muted-foreground text-sm">
					No companies match your filters.
				</p>
			) : (
				<div className="space-y-6">
					{companyGroups.map((group) => (
						<section key={group.location}>
							<div className="mb-3 flex items-center justify-between">
								<h2
									className={
										compact ? "font-semibold text-sm" : "font-bold text-lg"
									}
								>
									{group.location}
								</h2>
								<span className="text-muted-foreground text-xs">
									{`${group.companies.length} ${
										group.companies.length === 1 ? "company" : "companies"
									}`}
								</span>
							</div>
							<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
								{group.companies.map((company) => (
									<CompanyCard
										key={company._id}
										company={company}
										basePath={companyBasePath}
									/>
								))}
							</div>
						</section>
					))}
					{hiddenTownCount > 0 && (
						<div className="pt-2 text-center">
							<Button
								type="button"
								variant="outline"
								onClick={() => setShowAllTowns(true)}
							>
								{`Show ${hiddenTownCount} more ${
									hiddenTownCount === 1 ? "company" : "companies"
								}`}
							</Button>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
