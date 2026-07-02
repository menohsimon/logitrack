"use client";

import { api } from "@logitrack/backend/convex/_generated/api";
import type { Doc, Id } from "@logitrack/backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";

export function useCompany() {
	const companyData = useQuery(api.companies.getCurrentCompany, {});
	const isLoaded = companyData !== undefined;

	const hasCompany = Boolean(companyData?.company);
	const hasMember = Boolean(companyData?.member);
	const needsOrganization = isLoaded && !hasCompany;

	return {
		isLoaded,
		company: companyData?.company ?? null,
		member: companyData?.member ?? null,
		companyId: companyData?.company?._id as Id<"companies"> | undefined,
		needsOrganization,
		isProvisioning: false,
		memberships: companyData?.memberships ?? [],
		hasMember,
	};
}

export type CompanyContext = {
	companyId: Id<"companies">;
	company: Doc<"companies">;
	member: Doc<"companyMembers"> | null;
};
