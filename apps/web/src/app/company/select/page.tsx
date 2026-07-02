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
import { useMutation, useQuery } from "convex/react";
import { Building2, MailCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AuthGate } from "@/components/auth-gate";
import Loader from "@/components/loader";
import { asLinkRender } from "@/lib/render-adapters";
import { asRoute } from "@/lib/routes";

function SelectCompanyContent() {
	const router = useRouter();
	const companies = useQuery(api.companies.listCurrentUserCompanies, {});
	const invites = useQuery(api.companies.listPendingInvitesForCurrentUser, {});
	const setActiveCompany = useMutation(api.companies.setActiveCompany);
	const acceptInvite = useMutation(api.companies.acceptInvite);
	const declineInvite = useMutation(api.companies.declineInvite);

	async function handleSelect(companyId: Id<"companies">) {
		try {
			await setActiveCompany({ companyId });
			router.replace(asRoute("/company"));
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to switch company",
			);
		}
	}

	async function handleAccept(inviteId: Id<"companyInvites">) {
		try {
			const result = await acceptInvite({ inviteId });
			toast.success("Invite accepted");
			router.replace(asRoute(result.redirectTo));
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

	if (companies === undefined || invites === undefined) {
		return (
			<div className="flex min-h-svh items-center justify-center bg-muted/30">
				<Loader />
			</div>
		);
	}

	return (
		<div className="flex min-h-svh flex-col bg-muted/30">
			<header className="flex items-center justify-between border-b bg-background px-6 py-4">
				<Link href="/" className="font-bold text-lg">
					LogiTrack
				</Link>
				<Link
					href={asRoute("/company/onboarding")}
					className="text-muted-foreground text-sm hover:text-foreground"
				>
					Back
				</Link>
			</header>
			<main className="flex flex-1 items-center justify-center p-6">
				<div className="w-full max-w-2xl space-y-4">
					<div className="space-y-1 text-center">
						<h1 className="font-bold text-xl">Company access</h1>
						<p className="text-muted-foreground text-sm">
							Switch between companies you manage or accept a team invite.
						</p>
					</div>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Building2 className="size-5" />
								Managed companies
							</CardTitle>
							<CardDescription>
								Owner and manager memberships can open the company portal.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							{companies.memberships.length === 0 ? (
								<p className="text-muted-foreground text-sm">
									You are not managing any companies yet.
								</p>
							) : (
								companies.memberships.map(({ company, member }) => {
									const isActive = companies.activeCompanyId === company._id;
									return (
										<div
											key={company._id}
											className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
										>
											<div>
												<div className="flex flex-wrap items-center gap-2">
													<p className="font-medium">{company.name}</p>
													<Badge variant="outline">{member.role}</Badge>
													{isActive && <Badge>Active</Badge>}
												</div>
												<p className="text-muted-foreground text-xs">
													{company.status.replaceAll("_", " ")}
												</p>
											</div>
											<Button
												size="sm"
												variant={isActive ? "outline" : "default"}
												onClick={() => handleSelect(company._id)}
											>
												{isActive ? "Open" : "Select"}
											</Button>
										</div>
									);
								})
							)}
							<Button
								render={asLinkRender("/company/create")}
								variant="outline"
								className="w-full"
							>
								Create another company
							</Button>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<MailCheck className="size-5" />
								Pending invites
							</CardTitle>
							<CardDescription>
								Invites are matched against your account email.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							{invites.length === 0 ? (
								<p className="text-muted-foreground text-sm">
									No pending invites.
								</p>
							) : (
								invites.map(({ invite, company, inviter }) => (
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
												Invited by {inviter?.name ?? "a company manager"}
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
											<Button
												size="sm"
												onClick={() => handleAccept(invite._id)}
											>
												Accept
											</Button>
										</div>
									</div>
								))
							)}
						</CardContent>
					</Card>
				</div>
			</main>
		</div>
	);
}

export default function SelectCompanyPage() {
	return (
		<AuthGate>
			<SelectCompanyContent />
		</AuthGate>
	);
}
