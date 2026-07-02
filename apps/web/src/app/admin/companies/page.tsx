"use client";

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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@logitrack/ui/components/table";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@logitrack/ui/components/tabs";
import { useMutation } from "convex/react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { useAdminQuery } from "@/hooks/use-admin-access";
import { formatDate, formatStatus } from "@/lib/format";

export default function AdminCompaniesPage() {
	const pending = useAdminQuery(api.companies.listPendingForAdmin, {});
	const allCompanies = useAdminQuery(api.companies.listAllForAdmin, {});
	const approveCompany = useMutation(api.companies.approveCompany);
	const rejectCompany = useMutation(api.companies.rejectCompany);
	const banCompany = useMutation(api.companies.banCompany);
	const suspendCompany = useMutation(api.companies.suspendCompany);
	const restoreCompany = useMutation(api.companies.restoreCompany);
	const [loadingId, setLoadingId] = useState<string | null>(null);

	async function handleApprove(companyId: Id<"companies">) {
		setLoadingId(companyId);
		try {
			await approveCompany({ companyId });
			toast.success("Company approved");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Failed to approve");
		} finally {
			setLoadingId(null);
		}
	}

	async function handleReject(companyId: Id<"companies">) {
		const reason = window.prompt("Enter rejection reason:");
		if (!reason?.trim()) return;
		setLoadingId(companyId);
		try {
			await rejectCompany({ companyId, reason: reason.trim() });
			toast.success("Company rejected");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Failed to reject");
		} finally {
			setLoadingId(null);
		}
	}

	async function handleBan(companyId: Id<"companies">) {
		const reason = window.prompt("Enter ban reason:");
		if (!reason?.trim()) return;
		setLoadingId(companyId);
		try {
			await banCompany({ companyId, reason: reason.trim() });
			toast.success("Company banned");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Failed to ban");
		} finally {
			setLoadingId(null);
		}
	}

	async function handleSuspend(companyId: Id<"companies">) {
		const reason = window.prompt("Enter suspension reason:");
		if (!reason?.trim()) return;
		setLoadingId(companyId);
		try {
			await suspendCompany({ companyId, reason: reason.trim() });
			toast.success("Company suspended");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Failed to suspend");
		} finally {
			setLoadingId(null);
		}
	}

	async function handleRestore(companyId: Id<"companies">) {
		setLoadingId(companyId);
		try {
			await restoreCompany({ companyId });
			toast.success("Company restored");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Failed to restore");
		} finally {
			setLoadingId(null);
		}
	}

	return (
		<DashboardShell variant="admin" title="Companies">
			<Tabs defaultValue="pending">
				<TabsList>
					<TabsTrigger value="pending">
						Pending
						{pending && pending.length > 0 && (
							<Badge variant="secondary" className="ml-2">
								{pending.length}
							</Badge>
						)}
					</TabsTrigger>
					<TabsTrigger value="all">All Companies</TabsTrigger>
				</TabsList>

				<TabsContent value="pending" className="mt-4">
					{pending === undefined ? (
						<p className="text-muted-foreground">Loading...</p>
					) : pending.length === 0 ? (
						<Card>
							<CardContent className="py-8 text-center text-muted-foreground">
								No pending verifications
							</CardContent>
						</Card>
					) : (
						<div className="space-y-4">
							{pending.map((company) => (
								<Card key={company._id}>
									<CardHeader className="flex flex-row items-center justify-between">
										<div>
											<CardTitle className="text-base">
												<Link
													href={`/admin/companies/${company._id}`}
													className="hover:underline"
												>
													{company.name}
												</Link>
											</CardTitle>
											<p className="mt-1 text-muted-foreground text-sm">
												Submitted {formatDate(company.updatedAt)}
											</p>
										</div>
										<Badge variant="outline">Pending</Badge>
									</CardHeader>
									<CardContent className="flex gap-2">
										<Button
											size="sm"
											disabled={loadingId === company._id}
											onClick={() => handleApprove(company._id)}
										>
											Approve
										</Button>
										<Button
											size="sm"
											variant="outline"
											disabled={loadingId === company._id}
											onClick={() => handleReject(company._id)}
										>
											Reject
										</Button>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</TabsContent>

				<TabsContent value="all" className="mt-4">
					{allCompanies === undefined ? (
						<p className="text-muted-foreground">Loading...</p>
					) : (
						<div className="rounded-lg border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Name</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Verification</TableHead>
										<TableHead>Rating</TableHead>
										<TableHead>Created</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{allCompanies.map((company) => (
										<TableRow key={company._id}>
											<TableCell>
												<Link
													href={`/admin/companies/${company._id}`}
													className="font-medium hover:underline"
												>
													{company.name}
												</Link>
											</TableCell>
											<TableCell>
												<Badge
													variant={
														company.status === "banned"
															? "destructive"
															: "outline"
													}
												>
													{formatStatus(company.status)}
												</Badge>
											</TableCell>
											<TableCell>
												{formatStatus(company.verificationStatus)}
											</TableCell>
											<TableCell>{company.averageRating.toFixed(1)}</TableCell>
											<TableCell className="text-muted-foreground">
												{formatDate(company.createdAt)}
											</TableCell>
											<TableCell className="space-x-2 text-right">
												{company.verificationStatus === "pending" && (
													<>
														<Button
															size="sm"
															disabled={loadingId === company._id}
															onClick={() => handleApprove(company._id)}
														>
															Approve
														</Button>
														<Button
															size="sm"
															variant="outline"
															disabled={loadingId === company._id}
															onClick={() => handleReject(company._id)}
														>
															Reject
														</Button>
													</>
												)}
												{["banned", "suspended"].includes(company.status) ? (
													<Button
														size="sm"
														variant="outline"
														disabled={loadingId === company._id}
														onClick={() => handleRestore(company._id)}
													>
														Restore
													</Button>
												) : (
													<>
														<Button
															size="sm"
															variant="outline"
															disabled={loadingId === company._id}
															onClick={() => handleSuspend(company._id)}
														>
															Suspend
														</Button>
														<Button
															size="sm"
															variant="destructive"
															disabled={loadingId === company._id}
															onClick={() => handleBan(company._id)}
														>
															Ban
														</Button>
													</>
												)}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</TabsContent>
			</Tabs>
		</DashboardShell>
	);
}
