import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type Ctx = QueryCtx | MutationCtx;
type CompanyMemberRole = Doc<"companyMembers">["role"];

const companyProfileRoles: readonly CompanyMemberRole[] = ["owner", "manager"];
const companyOperatorRoles: readonly CompanyMemberRole[] = ["owner", "manager"];

export async function getIdentity(ctx: Ctx) {
	return await ctx.auth.getUserIdentity();
}

export async function requireIdentity(ctx: Ctx) {
	const identity = await getIdentity(ctx);
	if (!identity) {
		throw new Error("Unauthenticated");
	}
	return identity;
}

export async function getUserByClerkId(ctx: Ctx, clerkUserId: string) {
	return await ctx.db
		.query("users")
		.withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", clerkUserId))
		.unique();
}

export async function getOptionalUser(ctx: Ctx): Promise<Doc<"users"> | null> {
	const identity = await getIdentity(ctx);
	if (!identity) return null;
	return await getUserByClerkId(ctx, identity.subject);
}

export async function requireUser(ctx: Ctx): Promise<Doc<"users">> {
	const identity = await requireIdentity(ctx);
	const user = await getUserByClerkId(ctx, identity.subject);
	if (!user) {
		throw new Error("User profile not found. Please sync your account.");
	}
	return user;
}

export async function requireAdmin(ctx: Ctx): Promise<Doc<"users">> {
	const user = await requireUser(ctx);
	if (!user.isAdmin) {
		throw new Error("Admin access required");
	}
	return user;
}

export function assertUserNotBanned(user: Doc<"users">) {
	if (user.status === "banned") {
		throw new Error("Your account has been banned");
	}
	if (user.status === "suspended") {
		throw new Error("Your account has been suspended");
	}
}

export async function getCompanyMember(
	ctx: Ctx,
	companyId: Id<"companies">,
	userId: Id<"users">,
) {
	return await ctx.db
		.query("companyMembers")
		.withIndex("by_company_and_user", (q) =>
			q.eq("companyId", companyId).eq("userId", userId),
		)
		.unique();
}

export async function requireCompanyMember(
	ctx: Ctx,
	companyId: Id<"companies">,
): Promise<{ user: Doc<"users">; member: Doc<"companyMembers"> }> {
	const user = await requireUser(ctx);
	assertUserNotBanned(user);
	const member = await getCompanyMember(ctx, companyId, user._id);
	if (member?.status !== "active") {
		throw new Error("Company access denied");
	}
	return { user, member };
}

export async function requireCompanyMemberRole(
	ctx: Ctx,
	companyId: Id<"companies">,
	roles: readonly CompanyMemberRole[],
): Promise<{ user: Doc<"users">; member: Doc<"companyMembers"> }> {
	const access = await requireCompanyMember(ctx, companyId);
	if (!roles.includes(access.member.role)) {
		throw new Error("Insufficient company role");
	}
	return access;
}

export async function requireCompanyProfileManager(
	ctx: Ctx,
	companyId: Id<"companies">,
) {
	return await requireCompanyMemberRole(ctx, companyId, companyProfileRoles);
}

export async function requireCompanyOperator(
	ctx: Ctx,
	companyId: Id<"companies">,
) {
	return await requireCompanyMemberRole(ctx, companyId, companyOperatorRoles);
}

export async function getActiveCompanyOperators(
	ctx: Ctx,
	companyId: Id<"companies">,
) {
	const members = await ctx.db
		.query("companyMembers")
		.withIndex("by_company_id", (q) => q.eq("companyId", companyId))
		.collect();

	return members.filter(
		(member) =>
			member.status === "active" && companyOperatorRoles.includes(member.role),
	);
}

export async function getDriverByUserId(ctx: Ctx, userId: Id<"users">) {
	return await ctx.db
		.query("drivers")
		.withIndex("by_user_id", (q) => q.eq("userId", userId))
		.unique();
}

export async function requireDriver(ctx: Ctx): Promise<{
	user: Doc<"users">;
	driver: Doc<"drivers">;
}> {
	const user = await requireUser(ctx);
	assertUserNotBanned(user);
	const driver = await getDriverByUserId(ctx, user._id);
	if (driver?.status !== "active") {
		throw new Error("Driver access denied");
	}
	return { user, driver };
}

export async function canAccessShipment(
	ctx: Ctx,
	shipment: Doc<"shipments">,
	user: Doc<"users">,
): Promise<boolean> {
	if (user.isAdmin) return true;
	if (shipment.userId === user._id) return true;

	const member = await getCompanyMember(ctx, shipment.companyId, user._id);
	if (member?.status === "active") return true;

	if (shipment.driverId) {
		const driver = await ctx.db.get(shipment.driverId);
		if (driver?.userId === user._id && driver.status === "active") return true;
	}

	return false;
}

export async function requireShipmentAccess(
	ctx: Ctx,
	shipmentId: Id<"shipments">,
): Promise<{ user: Doc<"users">; shipment: Doc<"shipments"> }> {
	const user = await requireUser(ctx);
	assertUserNotBanned(user);
	const shipment = await ctx.db.get(shipmentId);
	if (!shipment) {
		throw new Error("Shipment not found");
	}
	const hasAccess = await canAccessShipment(ctx, shipment, user);
	if (!hasAccess) {
		throw new Error("Shipment access denied");
	}
	return { user, shipment };
}

export function assertCompanyApproved(company: Doc<"companies">) {
	if (company.status !== "approved") {
		throw new Error("Company is not approved for operations");
	}
}

export async function requireOperationalCompany(
	ctx: Ctx,
	companyId: Id<"companies">,
) {
	const company = await ctx.db.get(companyId);
	if (!company) {
		throw new Error("Company not found");
	}
	assertCompanyApproved(company);
	return company;
}

export function assertCompanyCanReceiveBookings(company: Doc<"companies">) {
	if (company.status === "banned" || company.status === "suspended") {
		throw new Error("Company cannot receive bookings");
	}
	if (company.status !== "approved") {
		throw new Error("Company is not approved");
	}
}
