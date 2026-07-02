"use client";

import { api } from "@logitrack/backend/convex/_generated/api";
import type { Id } from "@logitrack/backend/convex/_generated/dataModel";
import { Button } from "@logitrack/ui/components/button";
import { cn } from "@logitrack/ui/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { Bell, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { asRoute } from "@/lib/routes";

export function PendingInvitesPanel({ className }: { className?: string }) {
	const router = useRouter();
	const invites = useQuery(api.companies.listPendingInvitesForCurrentUser, {});
	const acceptInvite = useMutation(api.companies.acceptInvite);
	const declineInvite = useMutation(api.companies.declineInvite);
	const [processingId, setProcessingId] = useState<Id<"companyInvites"> | null>(
		null,
	);

	if (invites === undefined || invites.length === 0) return null;

	async function handleAccept(inviteId: Id<"companyInvites">) {
		setProcessingId(inviteId);
		try {
			const result = await acceptInvite({ inviteId });
			toast.success("Invite accepted");
			router.replace(asRoute(result.redirectTo));
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to accept invite",
			);
		} finally {
			setProcessingId(null);
		}
	}

	async function handleDecline(inviteId: Id<"companyInvites">) {
		setProcessingId(inviteId);
		try {
			await declineInvite({ inviteId });
			toast.success("Invite declined");
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to decline invite",
			);
		} finally {
			setProcessingId(null);
		}
	}

	return (
		<div
			className={cn(
				"rounded-2xl border bg-background p-4 shadow-sm",
				className,
			)}
		>
			<div className="mb-3 flex items-center gap-2">
				<div className="rounded-full bg-primary/10 p-2 text-primary">
					<Bell className="size-4" />
				</div>
				<div>
					<h2 className="font-semibold text-sm">Pending company invites</h2>
					<p className="text-muted-foreground text-xs">
						{invites.length} invite{invites.length === 1 ? "" : "s"} waiting for
						your response
					</p>
				</div>
			</div>

			<div className="space-y-2">
				{invites.map(({ invite, company, inviter }) => (
					<div
						key={invite._id}
						className="flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between"
					>
						<div className="min-w-0">
							<div className="flex items-center gap-2">
								<Building2 className="size-4 text-muted-foreground" />
								<p className="truncate font-medium text-sm">
									{company?.name ?? "Company"}
								</p>
							</div>
							<p className="mt-1 text-muted-foreground text-xs">
								{invite.role} invite from {inviter?.name ?? "a company manager"}
							</p>
						</div>
						<div className="flex shrink-0 gap-2">
							<Button
								size="sm"
								variant="outline"
								disabled={processingId === invite._id}
								onClick={() => handleDecline(invite._id)}
							>
								Decline
							</Button>
							<Button
								size="sm"
								disabled={processingId === invite._id}
								onClick={() => handleAccept(invite._id)}
							>
								Accept
							</Button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
