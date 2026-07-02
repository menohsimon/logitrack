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
import { Input } from "@logitrack/ui/components/input";
import { Label } from "@logitrack/ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@logitrack/ui/components/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@logitrack/ui/components/table";
import { useMutation, useQuery } from "convex/react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { CompanySetup } from "@/components/company/company-setup";
import { StatusBadge } from "@/components/company/status-badge";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { asLinkRender } from "@/lib/render-adapters";

const DRIVER_STATUSES = ["active", "inactive", "suspended", "removed"] as const;

function DriversContent({ companyId }: { companyId: Id<"companies"> }) {
	const drivers = useQuery(api.drivers.listByCompany, { companyId });
	const updateStatus = useMutation(api.drivers.updateStatus);
	const inviteMember = useMutation(api.companies.inviteMember);
	const [inviteEmail, setInviteEmail] = useState("");
	const [driverCompensationPercent, setDriverCompensationPercent] =
		useState("60");
	const [isInviting, setIsInviting] = useState(false);

	async function handleStatusChange(
		driverId: Id<"drivers">,
		status: (typeof DRIVER_STATUSES)[number],
	) {
		try {
			await updateStatus({ driverId, status });
			toast.success("Driver status updated");
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to update status",
			);
		}
	}

	async function handleInvite(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setIsInviting(true);
		try {
			await inviteMember({
				companyId,
				email: inviteEmail,
				role: "driver",
				driverCompensationRateBps: Math.round(
					Number(driverCompensationPercent) * 100,
				),
			});
			setInviteEmail("");
			setDriverCompensationPercent("60");
			toast.success("Driver invite recorded");
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to invite driver",
			);
		} finally {
			setIsInviting(false);
		}
	}

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Invite drivers</CardTitle>
					<CardDescription>
						Record a driver invite. If the user has an account, it appears in
						their notifications; otherwise it appears after they sign in with
						that email.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<form
						className="grid gap-3 md:grid-cols-[1fr_180px_auto]"
						onSubmit={handleInvite}
					>
						<div className="min-w-0 flex-1 space-y-2">
							<Label htmlFor="driver-email">Driver email</Label>
							<Input
								id="driver-email"
								type="email"
								value={inviteEmail}
								onChange={(event) => setInviteEmail(event.target.value)}
								placeholder="driver@example.com"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="driver-compensation">Driver compensation</Label>
							<Input
								id="driver-compensation"
								type="number"
								min="0"
								max="100"
								step="1"
								value={driverCompensationPercent}
								onChange={(event) =>
									setDriverCompensationPercent(event.target.value)
								}
							/>
							<p className="text-muted-foreground text-xs">
								Percent of transit fees. Default is 60%.
							</p>
						</div>
						<div className="flex items-end gap-2">
							<Button type="submit" disabled={isInviting}>
								{isInviting ? "Inviting..." : "Invite driver"}
							</Button>
							<Button
								render={asLinkRender("/company/organization")}
								type="button"
								variant="outline"
							>
								Settings
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Drivers</CardTitle>
					<CardDescription>
						Active and inactive drivers in your company.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{drivers === undefined ? (
						<p className="text-muted-foreground text-sm">Loading drivers...</p>
					) : drivers.length === 0 ? (
						<p className="text-muted-foreground text-sm">
							No drivers yet. Invite team members with the driver role.
						</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Name</TableHead>
									<TableHead>Email</TableHead>
									<TableHead>Shipments</TableHead>
									<TableHead>Rating</TableHead>
									<TableHead>Compensation</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{drivers.map(({ driver, user }) => (
									<TableRow key={driver._id}>
										<TableCell className="font-medium">
											{user?.name ?? "—"}
										</TableCell>
										<TableCell>{user?.email ?? "—"}</TableCell>
										<TableCell>{driver.completedShipmentCount}</TableCell>
										<TableCell>
											{driver.reviewCount > 0
												? `${driver.averageRating} (${driver.reviewCount})`
												: "—"}
										</TableCell>
										<TableCell>
											{((driver.compensationRateBps ?? 6000) / 100).toFixed(0)}%
										</TableCell>
										<TableCell>
											<StatusBadge status={driver.status} />
										</TableCell>
										<TableCell>
											<Select
												value={driver.status}
												onValueChange={(v) =>
													v &&
													handleStatusChange(
														driver._id,
														v as (typeof DRIVER_STATUSES)[number],
													)
												}
											>
												<SelectTrigger size="sm" className="w-32">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													{DRIVER_STATUSES.map((status) => (
														<SelectItem key={status} value={status}>
															{status.charAt(0).toUpperCase() + status.slice(1)}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

export default function CompanyDriversPage() {
	return (
		<DashboardShell variant="company" title="Drivers">
			<CompanySetup>
				{({ companyId }) => <DriversContent companyId={companyId} />}
			</CompanySetup>
		</DashboardShell>
	);
}
