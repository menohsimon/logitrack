"use client";

import type { Id } from "@logitrack/backend/convex/_generated/dataModel";

import { BalanceCard } from "@/components/mobile/balance-card";
import { CurrencySettings } from "@/components/profile/currency-settings";

type OwnerType = "user" | "company" | "driver";

export function WalletSettings({
	ownerType = "user",
	companyId,
	balanceTitle,
	currencyTitle,
	currencyDescription,
}: {
	ownerType?: OwnerType;
	companyId?: Id<"companies">;
	balanceTitle?: string;
	currencyTitle?: string;
	currencyDescription?: string;
}) {
	return (
		<div className="space-y-4">
			<BalanceCard
				ownerType={ownerType}
				companyId={companyId}
				title={balanceTitle}
				className="mb-0"
			/>
			<CurrencySettings
				ownerType={ownerType}
				companyId={companyId}
				title={currencyTitle}
				description={currencyDescription}
			/>
		</div>
	);
}
