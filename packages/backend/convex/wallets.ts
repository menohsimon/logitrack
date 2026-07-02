import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import {
	assertUserNotBanned,
	requireCompanyOperator,
	requireDriver,
	requireUser,
} from "./lib/auth";
import { walletOwnerType } from "./lib/validators";

const DEFAULT_WALLET_CURRENCY = "XAF";
const DEFAULT_DRIVER_COMPENSATION_RATE_BPS = 6000;

async function getWalletForUser(
	ctx: QueryCtx | MutationCtx,
	userId: Id<"users">,
) {
	const wallets = await ctx.db
		.query("wallets")
		.withIndex("by_user_id", (q) => q.eq("userId", userId))
		.collect();

	return (
		wallets.find((wallet) => wallet.ownerType === "user") ??
		wallets.find(
			(wallet) =>
				wallet.ownerType === undefined &&
				wallet.companyId === undefined &&
				wallet.driverId === undefined,
		) ??
		null
	);
}

async function getWalletForCompany(
	ctx: QueryCtx | MutationCtx,
	companyId: Id<"companies">,
) {
	const wallets = await ctx.db
		.query("wallets")
		.withIndex("by_owner_company", (q) =>
			q.eq("ownerType", "company").eq("companyId", companyId),
		)
		.collect();
	return wallets[0] ?? null;
}

async function getWalletForDriver(
	ctx: QueryCtx | MutationCtx,
	driverId: Id<"drivers">,
) {
	const wallets = await ctx.db
		.query("wallets")
		.withIndex("by_owner_driver", (q) =>
			q.eq("ownerType", "driver").eq("driverId", driverId),
		)
		.collect();
	return wallets[0] ?? null;
}

async function recentTransactions(ctx: QueryCtx, walletId: Id<"wallets">) {
	return await ctx.db
		.query("walletTransactions")
		.withIndex("by_wallet_id", (q) => q.eq("walletId", walletId))
		.order("desc")
		.take(10);
}

export async function ensureUserWallet(
	ctx: MutationCtx,
	userId: Id<"users">,
	currency = DEFAULT_WALLET_CURRENCY,
) {
	const wallet = await getWalletForUser(ctx, userId);
	if (wallet) {
		if (wallet.ownerType !== "user") {
			await ctx.db.patch(wallet._id, { ownerType: "user" });
		}
		return wallet;
	}

	const now = Date.now();
	const walletId = await ctx.db.insert("wallets", {
		ownerType: "user",
		userId,
		balanceCents: 0,
		currency,
		status: "active",
		createdAt: now,
		updatedAt: now,
	});
	const created = await ctx.db.get(walletId);
	if (!created) throw new Error("Wallet not available");
	return created;
}

export async function ensureCompanyWallet(
	ctx: MutationCtx,
	companyId: Id<"companies">,
	currency = DEFAULT_WALLET_CURRENCY,
) {
	const wallet = await getWalletForCompany(ctx, companyId);
	if (wallet) return wallet;

	const now = Date.now();
	const walletId = await ctx.db.insert("wallets", {
		ownerType: "company",
		companyId,
		balanceCents: 0,
		currency,
		status: "active",
		createdAt: now,
		updatedAt: now,
	});
	const created = await ctx.db.get(walletId);
	if (!created) throw new Error("Wallet not available");
	return created;
}

export async function ensureDriverWallet(
	ctx: MutationCtx,
	driverId: Id<"drivers">,
	currency = DEFAULT_WALLET_CURRENCY,
) {
	const wallet = await getWalletForDriver(ctx, driverId);
	if (wallet) return wallet;

	const now = Date.now();
	const walletId = await ctx.db.insert("wallets", {
		ownerType: "driver",
		driverId,
		balanceCents: 0,
		currency,
		status: "active",
		createdAt: now,
		updatedAt: now,
	});
	const created = await ctx.db.get(walletId);
	if (!created) throw new Error("Wallet not available");
	return created;
}

export const getCurrentWallet = query({
	args: {},
	handler: async (ctx) => {
		const user = await requireUser(ctx);
		const wallet = await getWalletForUser(ctx, user._id);
		if (!wallet) return null;
		const transactions = await recentTransactions(ctx, wallet._id);
		return { wallet, recentTransactions: transactions };
	},
});

export const getCurrentCompanyWallet = query({
	args: { companyId: v.optional(v.id("companies")) },
	handler: async (ctx, args) => {
		const user = await requireUser(ctx);
		const companyId = args.companyId ?? user.activeCompanyId;
		if (!companyId) return null;
		await requireCompanyOperator(ctx, companyId);
		const wallet = await getWalletForCompany(ctx, companyId);
		if (!wallet) return null;
		const transactions = await recentTransactions(ctx, wallet._id);
		return { wallet, recentTransactions: transactions };
	},
});

export const getCurrentDriverWallet = query({
	args: {},
	handler: async (ctx) => {
		const { driver } = await requireDriver(ctx);
		const wallet = await getWalletForDriver(ctx, driver._id);
		if (!wallet) return null;
		const transactions = await recentTransactions(ctx, wallet._id);
		return { wallet, recentTransactions: transactions };
	},
});

async function getOrCreateWalletForCurrentActor(
	ctx: MutationCtx,
	ownerType: "user" | "company" | "driver",
	companyId?: Id<"companies">,
) {
	const user = await requireUser(ctx);
	assertUserNotBanned(user);

	if (ownerType === "user") {
		return { user, wallet: await ensureUserWallet(ctx, user._id) };
	}

	if (ownerType === "company") {
		const targetCompanyId = companyId ?? user.activeCompanyId;
		if (!targetCompanyId) {
			throw new Error("Select a company before using this wallet");
		}
		await requireCompanyOperator(ctx, targetCompanyId);
		return {
			user,
			wallet: await ensureCompanyWallet(ctx, targetCompanyId),
		};
	}

	const { driver } = await requireDriver(ctx);
	return { user, wallet: await ensureDriverWallet(ctx, driver._id) };
}

export const createSimulatedTopUp = mutation({
	args: {
		amountCents: v.number(),
		ownerType: v.optional(walletOwnerType),
		companyId: v.optional(v.id("companies")),
	},
	handler: async (ctx, args) => {
		if (args.amountCents < 100 || args.amountCents > 1_000_000) {
			throw new Error("Amount must be between 1.00 and 10,000.00");
		}

		const { user, wallet } = await getOrCreateWalletForCurrentActor(
			ctx,
			args.ownerType ?? "user",
			args.companyId,
		);
		if (wallet.status !== "active") {
			throw new Error("Wallet not available");
		}

		const now = Date.now();
		const intentId = await ctx.db.insert("paymentIntents", {
			userId: user._id,
			walletId: wallet._id,
			amountCents: args.amountCents,
			currency: wallet.currency,
			provider: "simulated",
			status: "succeeded",
			purpose: "top_up",
			createdAt: now,
			updatedAt: now,
		});

		const newBalance = wallet.balanceCents + args.amountCents;
		await ctx.db.patch(wallet._id, {
			balanceCents: newBalance,
			updatedAt: now,
		});
		await ctx.db.insert("walletTransactions", {
			walletId: wallet._id,
			userId: user._id,
			type: "top_up",
			amountCents: args.amountCents,
			balanceAfterCents: newBalance,
			description: "Simulated wallet top-up",
			paymentIntentId: intentId,
			createdAt: now,
		});

		return { newBalance, intentId };
	},
});

export const updateCurrency = mutation({
	args: {
		ownerType: v.optional(walletOwnerType),
		companyId: v.optional(v.id("companies")),
		currency: v.string(),
	},
	handler: async (ctx, args) => {
		const currency = args.currency.trim().toUpperCase();
		if (!/^[A-Z]{3}$/.test(currency)) {
			throw new Error("Select a valid currency");
		}

		const { wallet } = await getOrCreateWalletForCurrentActor(
			ctx,
			args.ownerType ?? "user",
			args.companyId,
		);
		await ctx.db.patch(wallet._id, {
			currency,
			updatedAt: Date.now(),
		});
		return { currency };
	},
});

async function creditCompanyForBooking(
	ctx: MutationCtx,
	booking: Doc<"bookings">,
	amountCents: number,
) {
	const wallet = await ensureCompanyWallet(
		ctx,
		booking.companyId,
		booking.fareCurrency ?? DEFAULT_WALLET_CURRENCY,
	);
	if (wallet.status !== "active") return;

	const now = Date.now();
	const newBalance = wallet.balanceCents + amountCents;
	await ctx.db.patch(wallet._id, { balanceCents: newBalance, updatedAt: now });
	await ctx.db.insert("walletTransactions", {
		walletId: wallet._id,
		userId: booking.userId,
		type: "booking_capture",
		amountCents,
		balanceAfterCents: newBalance,
		description: `Booking ${booking.bookingNumber} captured`,
		bookingId: booking._id,
		createdAt: now,
	});
}

async function reverseCompanyBookingCapture(
	ctx: MutationCtx,
	bookingId: Id<"bookings">,
) {
	const booking = await ctx.db.get(bookingId);
	if (!booking) return;

	const wallet = await getWalletForCompany(ctx, booking.companyId);
	if (!wallet) return;

	const transactions = await ctx.db
		.query("walletTransactions")
		.withIndex("by_booking_id", (q) => q.eq("bookingId", bookingId))
		.collect();
	const alreadyReversed = transactions.some(
		(transaction) =>
			transaction.walletId === wallet._id && transaction.type === "refund",
	);
	if (alreadyReversed) return;

	const capture = transactions.find(
		(transaction) =>
			transaction.walletId === wallet._id &&
			transaction.type === "booking_capture" &&
			transaction.amountCents > 0,
	);
	if (!capture) return;

	const now = Date.now();
	const refundAmount = Math.abs(capture.amountCents);
	const newBalance = wallet.balanceCents - refundAmount;
	await ctx.db.patch(wallet._id, { balanceCents: newBalance, updatedAt: now });
	await ctx.db.insert("walletTransactions", {
		walletId: wallet._id,
		userId: booking.userId,
		type: "refund",
		amountCents: -refundAmount,
		balanceAfterCents: newBalance,
		description: `Booking ${booking.bookingNumber} capture reversed`,
		bookingId,
		createdAt: now,
	});
}

export async function settleDriverCompensationForShipment(
	ctx: MutationCtx,
	shipment: Doc<"shipments">,
) {
	if (!shipment.driverId) return;

	const booking = await ctx.db.get(shipment.bookingId);
	const driver = await ctx.db.get(shipment.driverId);
	if (!booking || !driver) return;

	const fareCents = booking.finalFareCents ?? booking.estimatedFareCents;
	if (!Number.isFinite(fareCents) || fareCents <= 0) return;

	const rateBps =
		driver.compensationRateBps ?? DEFAULT_DRIVER_COMPENSATION_RATE_BPS;
	if (rateBps <= 0) return;

	const driverWallet = await ensureDriverWallet(
		ctx,
		driver._id,
		booking.fareCurrency ?? DEFAULT_WALLET_CURRENCY,
	);
	const companyWallet = await ensureCompanyWallet(
		ctx,
		shipment.companyId,
		booking.fareCurrency ?? DEFAULT_WALLET_CURRENCY,
	);
	if (driverWallet.status !== "active" || companyWallet.status !== "active") {
		return;
	}

	const existingSettlement = await ctx.db
		.query("walletTransactions")
		.withIndex("by_booking_id", (q) => q.eq("bookingId", booking._id))
		.collect();
	if (
		existingSettlement.some(
			(transaction) =>
				transaction.walletId === driverWallet._id &&
				transaction.shipmentId === shipment._id &&
				transaction.type === "adjustment",
		)
	) {
		return;
	}

	const driverAmountCents = Math.round((fareCents * rateBps) / 10_000);
	if (driverAmountCents <= 0) return;

	const now = Date.now();
	const companyBalance = companyWallet.balanceCents - driverAmountCents;
	await ctx.db.patch(companyWallet._id, {
		balanceCents: companyBalance,
		updatedAt: now,
	});
	await ctx.db.insert("walletTransactions", {
		walletId: companyWallet._id,
		userId: driver.userId,
		type: "adjustment",
		amountCents: -driverAmountCents,
		balanceAfterCents: companyBalance,
		description: `Driver compensation paid for ${shipment.shipmentNumber}`,
		bookingId: booking._id,
		shipmentId: shipment._id,
		createdAt: now,
	});

	const driverBalance = driverWallet.balanceCents + driverAmountCents;
	await ctx.db.patch(driverWallet._id, {
		balanceCents: driverBalance,
		updatedAt: now,
	});
	await ctx.db.insert("walletTransactions", {
		walletId: driverWallet._id,
		userId: driver.userId,
		type: "adjustment",
		amountCents: driverAmountCents,
		balanceAfterCents: driverBalance,
		description: `Driver compensation for ${shipment.shipmentNumber}`,
		bookingId: booking._id,
		shipmentId: shipment._id,
		createdAt: now,
	});
}

export async function holdBookingFunds(
	ctx: MutationCtx,
	userId: Id<"users">,
	bookingId: Id<"bookings">,
	amountCents: number,
) {
	const wallet = await getWalletForUser(ctx, userId);
	if (!wallet) throw new Error("Wallet not found");
	if (wallet.balanceCents < amountCents) {
		throw new Error("Insufficient wallet balance");
	}

	const now = Date.now();
	const newBalance = wallet.balanceCents - amountCents;
	await ctx.db.patch(wallet._id, { balanceCents: newBalance, updatedAt: now });
	await ctx.db.insert("walletTransactions", {
		walletId: wallet._id,
		userId,
		type: "booking_hold",
		amountCents: -amountCents,
		balanceAfterCents: newBalance,
		description: "Booking payment hold",
		bookingId,
		createdAt: now,
	});
}

export async function simulateBookingPayment(
	ctx: MutationCtx,
	userId: Id<"users">,
	bookingId: Id<"bookings">,
	amountCents: number,
) {
	const wallet = await getWalletForUser(ctx, userId);
	if (!wallet) throw new Error("Wallet not found");
	if (wallet.status !== "active") throw new Error("Wallet not available");

	const now = Date.now();
	let balanceCents = wallet.balanceCents;
	if (balanceCents < amountCents) {
		const topUpAmount = amountCents - balanceCents;
		balanceCents += topUpAmount;
		const intentId = await ctx.db.insert("paymentIntents", {
			userId,
			walletId: wallet._id,
			amountCents: topUpAmount,
			currency: wallet.currency,
			provider: "simulated",
			status: "succeeded",
			purpose: "booking_payment",
			createdAt: now,
			updatedAt: now,
		});
		await ctx.db.patch(wallet._id, {
			balanceCents,
			updatedAt: now,
		});
		await ctx.db.insert("walletTransactions", {
			walletId: wallet._id,
			userId,
			type: "top_up",
			amountCents: topUpAmount,
			balanceAfterCents: balanceCents,
			description: "Simulated booking payment funding",
			bookingId,
			paymentIntentId: intentId,
			createdAt: now,
		});
	}

	await holdBookingFunds(ctx, userId, bookingId, amountCents);
	await captureBookingFunds(ctx, bookingId);
}

export async function captureBookingFunds(
	ctx: MutationCtx,
	bookingId: Id<"bookings">,
) {
	const existingCapture = await ctx.db
		.query("walletTransactions")
		.withIndex("by_booking_id", (q) => q.eq("bookingId", bookingId))
		.filter((q) => q.eq(q.field("type"), "booking_capture"))
		.first();
	if (existingCapture) return;

	const hold = await ctx.db
		.query("walletTransactions")
		.withIndex("by_booking_id", (q) => q.eq("bookingId", bookingId))
		.filter((q) => q.eq(q.field("type"), "booking_hold"))
		.first();

	if (!hold) return;

	await ctx.db.insert("walletTransactions", {
		walletId: hold.walletId,
		userId: hold.userId,
		type: "booking_capture",
		amountCents: 0,
		balanceAfterCents: hold.balanceAfterCents,
		description: "Booking payment captured",
		bookingId,
		createdAt: Date.now(),
	});

	const booking = await ctx.db.get(bookingId);
	if (booking) {
		await creditCompanyForBooking(ctx, booking, Math.abs(hold.amountCents));
	}
}

export async function refundBookingFunds(
	ctx: MutationCtx,
	bookingId: Id<"bookings">,
) {
	const existingRefund = await ctx.db
		.query("walletTransactions")
		.withIndex("by_booking_id", (q) => q.eq("bookingId", bookingId))
		.filter((q) => q.eq(q.field("type"), "refund"))
		.first();
	if (existingRefund) return;

	const hold = await ctx.db
		.query("walletTransactions")
		.withIndex("by_booking_id", (q) => q.eq("bookingId", bookingId))
		.filter((q) => q.eq(q.field("type"), "booking_hold"))
		.first();

	if (!hold) return;

	const wallet = await ctx.db.get(hold.walletId);
	if (!wallet) return;

	const refundAmount = Math.abs(hold.amountCents);
	const now = Date.now();
	const newBalance = wallet.balanceCents + refundAmount;
	await ctx.db.patch(wallet._id, { balanceCents: newBalance, updatedAt: now });
	await ctx.db.insert("walletTransactions", {
		walletId: wallet._id,
		userId: hold.userId,
		type: "refund",
		amountCents: refundAmount,
		balanceAfterCents: newBalance,
		description: "Booking hold refunded",
		bookingId,
		createdAt: now,
	});

	await reverseCompanyBookingCapture(ctx, bookingId);
}
