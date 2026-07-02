"use client";

import { Button } from "@logitrack/ui/components/button";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Loader from "@/components/loader";
import { type CompanyContext, useCompany } from "@/hooks/use-company";
import { asLinkRender } from "@/lib/render-adapters";
import { asRoute } from "@/lib/routes";

export function CompanySetup({
	children,
}: {
	children: (ctx: CompanyContext) => React.ReactNode;
}) {
	const router = useRouter();
	const {
		isLoaded,
		company,
		member,
		companyId,
		needsOrganization,
		isProvisioning,
	} = useCompany();

	useEffect(() => {
		if (isLoaded && needsOrganization) {
			router.replace(asRoute("/company/onboarding"));
		}
	}, [isLoaded, needsOrganization, router]);

	if (!isLoaded || needsOrganization) {
		return (
			<div className="flex flex-col items-center justify-center gap-3 py-16">
				<Loader />
				<p className="text-muted-foreground text-sm">Loading company...</p>
			</div>
		);
	}

	if (isProvisioning || !companyId || !company) {
		return (
			<div className="flex flex-col items-center justify-center gap-3 py-16">
				<Loader />
				<p className="text-muted-foreground text-sm">
					Setting up your company profile...
				</p>
			</div>
		);
	}

	return children({ companyId, company, member });
}

export function CompanyOrgSwitcher() {
	return (
		<div className="mb-6 flex items-center gap-2">
			<Button
				render={asLinkRender("/company/select")}
				variant="outline"
				size="sm"
				className="rounded-full"
			>
				Switch company
			</Button>
			<Button
				render={asLinkRender("/company/organization")}
				variant="ghost"
				size="sm"
				className="rounded-full"
			>
				Manage team
			</Button>
		</div>
	);
}
