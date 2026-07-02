import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

export function normalizeInviteEmail(email: string) {
	return email.trim().toLowerCase();
}

export async function ensureCompanyInviteNotification(
	ctx: MutationCtx,
	userId: Id<"users">,
	inviteId: Id<"companyInvites">,
) {
	const invite = await ctx.db.get(inviteId);
	if (invite?.status !== "pending") return;

	const existing = await ctx.db
		.query("notifications")
		.withIndex("by_related_company_invite_id", (q) =>
			q.eq("relatedCompanyInviteId", inviteId),
		)
		.collect();
	if (
		existing.some((notification) => notification.recipientUserId === userId)
	) {
		return;
	}

	const company = await ctx.db.get(invite.companyId);
	if (!company) return;

	const roleLabel = invite.role === "driver" ? "driver" : "manager";
	await ctx.db.insert("notifications", {
		recipientUserId: userId,
		type: "company_invite",
		title: "Company invite",
		body: `${company.name} invited you as a ${roleLabel}.`,
		relatedCompanyInviteId: invite._id,
		createdAt: Date.now(),
	});
}

export async function notifyPendingCompanyInvitesForUser(
	ctx: MutationCtx,
	user: Doc<"users">,
) {
	const email = normalizeInviteEmail(user.email);
	if (!email) return;

	const invites = await ctx.db
		.query("companyInvites")
		.withIndex("by_email", (q) => q.eq("email", email))
		.collect();

	for (const invite of invites) {
		if (invite.status === "pending") {
			await ensureCompanyInviteNotification(ctx, user._id, invite._id);
		}
	}
}
