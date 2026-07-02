import type { Doc } from "@logitrack/backend/convex/_generated/dataModel";

type Company = Doc<"companies">;

export function getCompanyLocationLabel(company: Company) {
	return (
		company.operatingRegions[0] ??
		company.location?.displayName ??
		company.address ??
		"Location not set"
	);
}

export function groupCompaniesByLocation<T extends Company>(companies: T[]) {
	const groups = new Map<string, T[]>();

	for (const company of companies) {
		const location = getCompanyLocationLabel(company);
		const group = groups.get(location) ?? [];
		group.push(company);
		groups.set(location, group);
	}

	return Array.from(groups.entries())
		.map(([location, groupCompanies]) => ({
			location,
			companies: [...groupCompanies].sort(
				(a, b) => b.averageRating - a.averageRating,
			),
		}))
		.sort((a, b) => a.location.localeCompare(b.location));
}
