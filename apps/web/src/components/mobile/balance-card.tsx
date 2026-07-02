"use client";

import { api } from "@logitrack/backend/convex/_generated/api";
import type { Id } from "@logitrack/backend/convex/_generated/dataModel";
import { Button } from "@logitrack/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@logitrack/ui/components/dialog";
import { Input } from "@logitrack/ui/components/input";
import { cn } from "@logitrack/ui/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { DEFAULT_CURRENCY, formatCurrency } from "@/lib/format";

const DEFAULT_TOP_UP_AMOUNTS = [2500, 5000, 10000, 25000];
const XAF_TOP_UP_AMOUNTS = [100000, 250000, 500000, 1000000];

type WalletOwnerType = "user" | "company" | "driver";

export function BalanceCard({
	ownerType = "user",
	title = "Your Balance",
	className,
	companyId,
}: {
	ownerType?: WalletOwnerType;
	title?: string;
	className?: string;
	companyId?: Id<"companies">;
}) {
	const displayTitle = title ?? "Your Balance";
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
	const topUp = useMutation(api.wallets.createSimulatedTopUp);
	const [hidden, setHidden] = useState(false);
	const [customAmount, setCustomAmount] = useState("");
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);

	const walletData =
		ownerType === "company"
			? companyWallet
			: ownerType === "driver"
				? driverWallet
				: userWallet;
	const balance = walletData?.wallet?.balanceCents ?? 0;
	const currency = walletData?.wallet?.currency ?? DEFAULT_CURRENCY;
	const topUpAmounts =
		currency === DEFAULT_CURRENCY ? XAF_TOP_UP_AMOUNTS : DEFAULT_TOP_UP_AMOUNTS;

	async function handleTopUp(cents: number) {
		setLoading(true);
		try {
			await topUp({ amountCents: cents, ownerType, companyId });
			toast.success(`Added ${formatCurrency(cents, currency)} to your wallet`);
			setOpen(false);
			setCustomAmount("");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Top up failed");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div
			className={cn(
				"relative mb-4 rounded-3xl bg-foreground p-5 text-background",
				className,
			)}
		>
			<div className="flex items-start justify-between">
				<div>
					<p className="text-sm opacity-80">{displayTitle}</p>
					<div className="mt-1 flex items-center gap-2">
						<p className="font-bold text-3xl">
							{hidden ? "••••••" : formatCurrency(balance, currency)}
						</p>
						<button
							type="button"
							onClick={() => setHidden(!hidden)}
							className="opacity-70"
						>
							{hidden ? (
								<EyeOff className="size-4" />
							) : (
								<Eye className="size-4" />
							)}
						</button>
					</div>
				</div>
				<Dialog open={open} onOpenChange={setOpen}>
					<DialogTrigger
						render={(props) => (
							<Button
								size="sm"
								className="rounded-full bg-background text-foreground hover:bg-background/90"
								{...props}
							>
								Top Up
							</Button>
						)}
					/>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Top Up Wallet</DialogTitle>
						</DialogHeader>
						<p className="mb-4 text-muted-foreground text-sm">
							Simulated payment — funds are added instantly for testing.
						</p>
						<div className="mb-4 grid grid-cols-2 gap-2">
							{topUpAmounts.map((amount) => (
								<Button
									key={amount}
									variant="outline"
									disabled={loading}
									onClick={() => handleTopUp(amount)}
								>
									{formatCurrency(amount, currency)}
								</Button>
							))}
						</div>
						<div className="flex gap-2">
							<Input
								type="number"
								placeholder={`Custom amount (${currency})`}
								value={customAmount}
								onChange={(e) => setCustomAmount(e.target.value)}
							/>
							<Button
								disabled={loading || !customAmount}
								onClick={() =>
									handleTopUp(Math.round(Number(customAmount) * 100))
								}
							>
								Add
							</Button>
						</div>
						{walletData?.recentTransactions.length ? (
							<div className="mt-5 border-t pt-4">
								<p className="mb-2 font-medium text-sm">Recent activity</p>
								<div className="space-y-2">
									{walletData.recentTransactions
										.slice(0, 4)
										.map((transaction) => (
											<div
												key={transaction._id}
												className="flex items-center justify-between gap-3 text-sm"
											>
												<p className="min-w-0 truncate text-muted-foreground">
													{transaction.description}
												</p>
												<p className="shrink-0 font-medium">
													{transaction.amountCents > 0 ? "+" : ""}
													{formatCurrency(transaction.amountCents, currency)}
												</p>
											</div>
										))}
								</div>
							</div>
						) : null}
					</DialogContent>
				</Dialog>
			</div>
		</div>
	);
}
