"use client";

import { api } from "@logitrack/backend/convex/_generated/api";
import type { Id } from "@logitrack/backend/convex/_generated/dataModel";
import { Badge } from "@logitrack/ui/components/badge";
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
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { formatDateTime } from "@/lib/format";
import { asLinkRender } from "@/lib/render-adapters";

type InviteRole = "manager" | "driver";

function TeamSettings({ companyId }: { companyId: Id<"companies"> }) {
	const members = useQuery(api.companies.listTeamMembers, { companyId });
	const invites = useQuery(api.companies.listCompanyInvites, { companyId });
	const incomingInvites = useQuery(
		api.companies.listPendingInvitesForCurrentUser,
		{},
	);
	const inviteMember = useMutation(api.companies.inviteMember);
	const revokeInvite = useMutation(api.companies.revokeInvite);
	const acceptInvite = useMutation(api.companies.acceptInvite);
	const declineInvite = useMutation(api.companies.declineInvite);

	const [email, setEmail] = useState("");
	const [role, setRole] = useState<InviteRole>("driver");
	const [driverCompensationPercent, setDriverCompensationPercent] =
		useState("60");
	const [isSubmitting, setIsSubmitting] = useState(false);

	async function handleInvite(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setIsSubmitting(true);
		try {
			await inviteMember({
				companyId,
				email,
				role,
				driverCompensationRateBps:
					role === "driver"
						? Math.round(Number(driverCompensationPercent) * 100)
						: undefined,
			});
			setEmail("");
			setRole("driver");
			setDriverCompensationPercent("60");
			toast.success("Invite recorded");
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to invite member",
			);
		} finally {
			setIsSubmitting(false);
		}
	}

	async function handleRevoke(inviteId: Id<"companyInvites">) {
		try {
			await revokeInvite({ inviteId });
			toast.success("Invite revoked");
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to revoke invite",
			);
		}
	}

	async function handleAccept(inviteId: Id<"companyInvites">) {
		try {
			const result = await acceptInvite({ inviteId });
			toast.success("Invite accepted");
			window.location.assign(result.redirectTo);
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to accept invite",
			);
		}
	}

	async function handleDecline(inviteId: Id<"companyInvites">) {
		try {
			await declineInvite({ inviteId });
			toast.success("Invite declined");
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to decline invite",
			);
		}
	}

	return (
		<div className="max-w-5xl space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Invite team member</CardTitle>
					<CardDescription>
						Driver is the default invite role. Managers can access the company
						portal.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						className="grid gap-3 md:grid-cols-[1fr_180px_180px_auto]"
						onSubmit={handleInvite}
					>
						<div className="space-y-2">
							<Label htmlFor="team-email">Email</Label>
							<Input
								id="team-email"
								type="email"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								placeholder="member@example.com"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="team-role">Role</Label>
							<Select
								value={role}
								onValueChange={(value) => setRole(value as InviteRole)}
							>
								<SelectTrigger id="team-role">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="driver">Driver</SelectItem>
									<SelectItem value="manager">Manager</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="team-driver-compensation">Compensation</Label>
							<Input
								id="team-driver-compensation"
								type="number"
								min="0"
								max="100"
								step="1"
								disabled={role !== "driver"}
								value={driverCompensationPercent}
								onChange={(event) =>
									setDriverCompensationPercent(event.target.value)
								}
							/>
							<p className="text-muted-foreground text-xs">
								Driver share of transit fees.
							</p>
						</div>
						<div className="flex items-end">
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting ? "Inviting..." : "Invite"}
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Members</CardTitle>
					<CardDescription>
						Active and inactive company memberships.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{members === undefined ? (
						<p className="text-muted-foreground text-sm">Loading members...</p>
					) : members.length === 0 ? (
						<p className="text-muted-foreground text-sm">No members yet.</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Name</TableHead>
									<TableHead>Email</TableHead>
									<TableHead>Role</TableHead>
									<TableHead>Status</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{members.map(({ member, user }) => (
									<TableRow key={member._id}>
										<TableCell className="font-medium">
											{user?.name ?? "Unknown"}
										</TableCell>
										<TableCell>{user?.email ?? "unknown"}</TableCell>
										<TableCell>
											<Badge variant="outline">{member.role}</Badge>
										</TableCell>
										<TableCell>{member.status}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Recorded invites</CardTitle>
					<CardDescription>
						Pending invites appear in the recipient's notifications after their
						account exists.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{invites === undefined ? (
						<p className="text-muted-foreground text-sm">Loading invites...</p>
					) : invites.length === 0 ? (
						<p className="text-muted-foreground text-sm">
							No invites recorded.
						</p>
					) : (
						<div className="space-y-3">
							{invites.map(({ invite, inviter }) => (
								<div
									key={invite._id}
									className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
								>
									<div>
										<div className="flex flex-wrap items-center gap-2">
											<p className="font-medium">{invite.email}</p>
											<Badge variant="outline">{invite.role}</Badge>
											{invite.role === "driver" && (
												<Badge variant="secondary">
													{(
														(invite.driverCompensationRateBps ?? 6000) / 100
													).toFixed(0)}
													%
												</Badge>
											)}
											<Badge
												variant={
													invite.status === "pending" ? "secondary" : "outline"
												}
											>
												{invite.status}
											</Badge>
										</div>
										<p className="text-muted-foreground text-xs">
											Invited by {inviter?.name ?? "Unknown"} on{" "}
											{formatDateTime(invite.createdAt)}
										</p>
									</div>
									{invite.status === "pending" && (
										<Button
											size="sm"
											variant="outline"
											onClick={() => handleRevoke(invite._id)}
										>
											Revoke
										</Button>
									)}
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			{incomingInvites && incomingInvites.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Your pending invites</CardTitle>
						<CardDescription>
							Accepting a driver invite opens the driver portal.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						{incomingInvites.map(({ invite, company }) => (
							<div
								key={invite._id}
								className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
							>
								<div>
									<div className="flex flex-wrap items-center gap-2">
										<p className="font-medium">
											{company?.name ?? "Unknown company"}
										</p>
										<Badge variant="outline">{invite.role}</Badge>
									</div>
									<p className="text-muted-foreground text-xs">
										Sent to {invite.email}
									</p>
								</div>
								<div className="flex gap-2">
									<Button
										size="sm"
										variant="outline"
										onClick={() => handleDecline(invite._id)}
									>
										Decline
									</Button>
									<Button size="sm" onClick={() => handleAccept(invite._id)}>
										Accept
									</Button>
								</div>
							</div>
						))}
					</CardContent>
				</Card>
			)}

			<Button render={asLinkRender("/company/drivers")} variant="outline">
				Back to drivers
			</Button>
		</div>
	);
}

export default function CompanyOrganizationPage() {
	return (
		<DashboardShell variant="company" title="Team settings">
			<CompanySetup>
				{({ companyId }) => <TeamSettings companyId={companyId} />}
			</CompanySetup>
		</DashboardShell>
	);
}
