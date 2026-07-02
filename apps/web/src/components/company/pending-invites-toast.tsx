"use client";

import { api } from "@logitrack/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { asRoute } from "@/lib/routes";

export function PendingInvitesToast() {
	const router = useRouter();
	const invites = useQuery(api.companies.listPendingInvitesForCurrentUser, {});
	const acceptInvite = useMutation(api.companies.acceptInvite);
	const shownKeyRef = useRef<string | null>(null);

	useEffect(() => {
		if (!invites || invites.length === 0) return;
		const key = invites.map(({ invite }) => invite._id).join(",");
		if (shownKeyRef.current === key) return;
		shownKeyRef.current = key;

		const first = invites[0];
		if (!first) return;
		toast("You have pending company invitations", {
			id: `pending-invites-${key}`,
			duration: 20_000,
			description:
				invites.length === 1
					? `${first.company?.name ?? "A company"} invited you as a ${first.invite.role}.`
					: `${invites.length} companies are waiting for your response.`,
			action: {
				label: "Accept",
				onClick: async () => {
					try {
						const result = await acceptInvite({ inviteId: first.invite._id });
						toast.success("Invite accepted");
						router.replace(asRoute(result.redirectTo));
					} catch (error) {
						toast.error(
							error instanceof Error
								? error.message
								: "Failed to accept invite",
						);
					}
				},
			},
		});
	}, [acceptInvite, invites, router]);

	return null;
}
