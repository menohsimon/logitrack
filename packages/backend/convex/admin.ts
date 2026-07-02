import { query } from "./_generated/server";
import { requireAdmin } from "./lib/auth";

export const getDashboardStats = query({
	args: {},
	handler: async (ctx) => {
		await requireAdmin(ctx);

		const users = await ctx.db.query("users").collect();
		const companies = await ctx.db.query("companies").collect();
		const bookings = await ctx.db.query("bookings").collect();
		const shipments = await ctx.db.query("shipments").collect();
		const tickets = await ctx.db.query("supportTickets").collect();
		const pendingCompanies = companies.filter(
			(c) => c.verificationStatus === "pending",
		);
		const openTickets = tickets.filter(
			(t) => t.status === "open" || t.status === "waiting_for_admin",
		);
		const activeShipments = shipments.filter(
			(s) => !["delivery_confirmed", "cancelled"].includes(s.status),
		);
		const completedShipments = shipments.filter(
			(s) => s.status === "delivery_confirmed",
		);
		const awaitingDriverClosureShipments = shipments.filter(
			(s) => s.status === "delivered",
		);

		const recentActions = await ctx.db
			.query("adminActions")
			.order("desc")
			.take(10);

		return {
			totalUsers: users.length,
			totalCompanies: companies.length,
			totalBookings: bookings.length,
			totalShipments: shipments.length,
			pendingCompanies: pendingCompanies.length,
			openTickets: openTickets.length,
			activeShipments: activeShipments.length,
			completedShipments: completedShipments.length,
			awaitingDriverClosureShipments: awaitingDriverClosureShipments.length,
			recentActions,
			pendingCompanyList: pendingCompanies.slice(0, 5),
			recentBookings: bookings.slice(-5).reverse(),
			openTicketList: openTickets.slice(0, 5),
		};
	},
});

export const listAuditLogs = query({
	args: {},
	handler: async (ctx) => {
		await requireAdmin(ctx);
		const actions = await ctx.db.query("adminActions").order("desc").take(50);
		return await Promise.all(
			actions.map(async (action) => {
				const admin = await ctx.db.get(action.adminUserId);
				return { action, admin };
			}),
		);
	},
});

export const listAllBookings = query({
	args: {},
	handler: async (ctx) => {
		await requireAdmin(ctx);
		return await ctx.db.query("bookings").order("desc").take(50);
	},
});

export const listAllShipments = query({
	args: {},
	handler: async (ctx) => {
		await requireAdmin(ctx);
		return await ctx.db.query("shipments").order("desc").take(50);
	},
});
