"use client";

import { api } from "@logitrack/backend/convex/_generated/api";
import type { Id } from "@logitrack/backend/convex/_generated/dataModel";
import { Button } from "@logitrack/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@logitrack/ui/components/card";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { CurrencySelect } from "@/components/form/currency-select";
import { DEFAULT_CURRENCY } from "@/lib/format";

type OwnerType = "user" | "company" | "driver";

export function CurrencySettings({
	ownerType = "user",
	companyId,
	title = "Currency",
	description = "Used for wallet balances and new booking forms.",
}: {
	ownerType?: OwnerType;
	companyId?: Id<"companies">;
	title?: string;
	description?: string;
}) {
	const userWallet = useQuery(
		api.wallets.getCurrentWallet,
		ownerType === "user" ? {} : "skip",
	);
	const companyWallet = useQuery(
		api.wallets.getCurrentCompanyWallet,
		ownerType === "company" ? { companyId } : "skip",
	);
	const driverWallet = useQuery(
		api.wallets.getCurrentDriverWallet,
		ownerType === "driver" ? {} : "skip",
	);
	const updateCurrency = useMutation(api.wallets.updateCurrency);
	const walletData =
		ownerType === "company"
			? companyWallet
			: ownerType === "driver"
				? driverWallet
				: userWallet;
	const walletCurrency = walletData?.wallet.currency ?? DEFAULT_CURRENCY;
	const [currency, setCurrency] = useState(walletCurrency);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		setCurrency(walletCurrency);
	}, [walletCurrency]);

	async function handleSave() {
		setSaving(true);
		try {
			await updateCurrency({ ownerType, companyId, currency });
			toast.success("Currency updated");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to update currency",
			);
		} finally {
			setSaving(false);
		}
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<CurrencySelect
					id={`${ownerType}-currency`}
					value={currency}
					onChange={setCurrency}
				/>
				<Button
					type="button"
					disabled={saving || currency === walletCurrency}
					onClick={handleSave}
				>
					{saving ? "Saving..." : "Save currency"}
				</Button>
			</CardContent>
		</Card>
	);
}
