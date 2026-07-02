"use client";
import { asLinkRender } from "@/lib/render-adapters";

import { api } from "@logitrack/backend/convex/_generated/api";
import type { Id } from "@logitrack/backend/convex/_generated/dataModel";
import { Badge } from "@logitrack/ui/components/badge";
import { Button } from "@logitrack/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@logitrack/ui/components/card";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { formatCargoCategory } from "@/lib/estimate-fare";
import { formatDate, formatDateTime, formatStatus } from "@/lib/format";

export default function AdminCompanyDetailPage() {
	const params = useParams();
	const companyId = params.companyId as Id<"companies">;

	const company = useQuery(api.companies.getById, { companyId });
	const approveCompany = useMutation(api.companies.approveCompany);
	const rejectCompany = useMutation(api.companies.rejectCompany);
	const banCompany = useMutation(api.companies.banCompany);
	const suspendCompany = useMutation(api.companies.suspendCompany);
	const restoreCompany = useMutation(api.companies.restoreCompany);
	const [loading, setLoading] = useState(false);

	async function handleApprove() {
		setLoading(true);
		try {
			await approveCompany({ companyId });
			toast.success("Company approved");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Failed to approve");
		} finally {
			setLoading(false);
		}
	}

	async function handleReject() {
		const reason = window.prompt("Enter rejection reason:");
		if (!reason?.trim()) return;
		setLoading(true);
		try {
			await rejectCompany({ companyId, reason: reason.trim() });
			toast.success("Company rejected");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Failed to reject");
		} finally {
			setLoading(false);
		}
	}

	async function handleBan() {
		const reason = window.prompt("Enter ban reason:");
		if (!reason?.trim()) return;
		setLoading(true);
		try {
			await banCompany({ companyId, reason: reason.trim() });
			toast.success("Company banned");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Failed to ban");
		} finally {
			setLoading(false);
		}
	}

	async function handleSuspend() {
		const reason = window.prompt("Enter suspension reason:");
		if (!reason?.trim()) return;
		setLoading(true);
		try {
			await suspendCompany({ companyId, reason: reason.trim() });
			toast.success("Company suspended");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Failed to suspend");
		} finally {
			setLoading(false);
		}
	}

	async function handleRestore() {
		setLoading(true);
		try {
			await restoreCompany({ companyId });
			toast.success("Company restored");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Failed to restore");
		} finally {
			setLoading(false);
		}
	}

	return (
		<DashboardShell variant="admin" title="Company Detail">
			<Button
				render={asLinkRender("/admin/companies")}
				variant="ghost"
				size="sm"
				className="mb-4 -ml-2"
			>
				← Back to companies
			</Button>

			{company === undefined ? (
				<p className="text-muted-foreground">Loading...</p>
			) : company === null ? (
				<p className="text-muted-foreground">Company not found</p>
			) : (
				<div className="max-w-3xl space-y-6">
					<div className="flex items-start justify-between gap-4">
						<div>
							<h2 className="font-bold text-2xl">{company.name}</h2>
							{company.legalName && (
								<p className="text-muted-foreground">{company.legalName}</p>
							)}
							<div className="mt-2 flex gap-2">
								<Badge variant="outline">{formatStatus(company.status)}</Badge>
								<Badge variant="secondary">
									{formatStatus(company.verificationStatus)}
								</Badge>
							</div>
						</div>
						<div className="flex flex-wrap gap-2">
							{company.verificationStatus === "pending" && (
								<>
									<Button size="sm" disabled={loading} onClick={handleApprove}>
										Approve
									</Button>
									<Button
										size="sm"
										variant="outline"
										disabled={loading}
										onClick={handleReject}
									>
										Reject
									</Button>
								</>
							)}
							{["banned", "suspended"].includes(company.status) ? (
								<Button
									size="sm"
									variant="outline"
									disabled={loading}
									onClick={handleRestore}
								>
									Restore
								</Button>
							) : (
								<>
									<Button
										size="sm"
										variant="outline"
										disabled={loading}
										onClick={handleSuspend}
									>
										Suspend
									</Button>
									<Button
										size="sm"
										variant="destructive"
										disabled={loading}
										onClick={handleBan}
									>
										Ban
									</Button>
								</>
							)}
						</div>
					</div>

					{company.description && (
						<Card>
							<CardHeader>
								<CardTitle className="text-base">Description</CardTitle>
							</CardHeader>
							<CardContent className="text-muted-foreground text-sm">
								{company.description}
							</CardContent>
						</Card>
					)}

					<div className="grid gap-4 sm:grid-cols-2">
						<Card>
							<CardHeader>
								<CardTitle className="text-base">Contact</CardTitle>
							</CardHeader>
							<CardContent className="space-y-2 text-sm">
								<div className="flex justify-between">
									<span className="text-muted-foreground">Email</span>
									<span>{company.contactEmail ?? "—"}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Phone</span>
									<span>{company.phone ?? "—"}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Address</span>
									<span>{company.address ?? "—"}</span>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="text-base">Stats</CardTitle>
							</CardHeader>
							<CardContent className="space-y-2 text-sm">
								<div className="flex justify-between">
									<span className="text-muted-foreground">Rating</span>
									<span>
										{company.averageRating.toFixed(1)} ({company.reviewCount}{" "}
										reviews)
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Shipments</span>
									<span>{company.completedShipmentCount}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Slug</span>
									<span className="font-mono text-xs">{company.slug}</span>
								</div>
							</CardContent>
						</Card>
					</div>

					<Card>
						<CardHeader>
							<CardTitle className="text-base">Operating Regions</CardTitle>
						</CardHeader>
						<CardContent>
							{company.operatingRegions.length === 0 ? (
								<p className="text-muted-foreground text-sm">None listed</p>
							) : (
								<div className="flex flex-wrap gap-1">
									{company.operatingRegions.map((r) => (
										<Badge key={r} variant="outline">
											{r}
										</Badge>
									))}
								</div>
							)}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="text-base">Cargo Categories</CardTitle>
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

					{company.verificationNotes && (
						<Card>
							<CardHeader>
								<CardTitle className="text-base">Verification Notes</CardTitle>
							</CardHeader>
							<CardContent className="text-muted-foreground text-sm">
								{company.verificationNotes}
							</CardContent>
						</Card>
					)}

					<Card>
						<CardHeader>
							<CardTitle className="text-base">Timestamps</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2 text-sm">
							<div className="flex justify-between">
								<span className="text-muted-foreground">Created</span>
								<span>{formatDate(company.createdAt)}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">Updated</span>
								<span>{formatDateTime(company.updatedAt)}</span>
							</div>
						</CardContent>
					</Card>
				</div>
			)}
		</DashboardShell>
	);
}
