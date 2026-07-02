import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { mutation } from "./_generated/server";
import { slugify } from "./lib/helpers";
import { ensureCompanyWallet } from "./wallets";

const CAMEROON_COMPANY_SEEDS = [
	["Douala Rapid Freight", "Douala", ["Douala", "Edea", "Limbe"]],
	["Wouri Express Logistics", "Douala", ["Douala", "Tiko", "Buea"]],
	["Akwa Cargo Services", "Douala", ["Douala", "Mbanga", "Nkongsamba"]],
	["Bonaberi Heavy Haul", "Douala", ["Douala", "Edea", "Kribi"]],
	["Littoral Cold Chain", "Douala", ["Douala", "Limbe", "Buea"]],
	["Yaounde Central Carriers", "Yaounde", ["Yaounde", "Mbalmayo", "Obala"]],
	["Mfoundi Dispatch", "Yaounde", ["Yaounde", "Akonolinga", "Bafia"]],
	["Etoudi Freight Link", "Yaounde", ["Yaounde", "Sangmelima", "Ebolowa"]],
	["Mvog-Mbi Moving Co", "Yaounde", ["Yaounde", "Mbalmayo", "Edea"]],
	["Centre Route Logistics", "Yaounde", ["Yaounde", "Obala", "Nkoteng"]],
	["Bafoussam Cargo Hub", "Bafoussam", ["Bafoussam", "Mbouda", "Dschang"]],
	["Mifi Transport Group", "Bafoussam", ["Bafoussam", "Foumban", "Bangangte"]],
	["West Highlands Haulage", "Bafoussam", ["Bafoussam", "Foumbot", "Dschang"]],
	["Dschang Fresh Logistics", "Dschang", ["Dschang", "Bafoussam", "Mbouda"]],
	["Foumban Line Services", "Foumban", ["Foumban", "Foumbot", "Bafoussam"]],
	["Bamenda Valley Freight", "Bamenda", ["Bamenda", "Kumbo", "Wum"]],
	["Mezam Express", "Bamenda", ["Bamenda", "Fundong", "Nkambe"]],
	["Northwest Cargo Partners", "Bamenda", ["Bamenda", "Kumbo", "Mamfe"]],
	["Kumbo Mountain Logistics", "Kumbo", ["Kumbo", "Bamenda", "Nkambe"]],
	["Mamfe Cross-River Freight", "Mamfe", ["Mamfe", "Kumba", "Bamenda"]],
	["Buea Mountain Movers", "Buea", ["Buea", "Limbe", "Mutengene"]],
	["Limbe Port Logistics", "Limbe", ["Limbe", "Douala", "Buea"]],
	["Tiko Route Express", "Tiko", ["Tiko", "Mutengene", "Douala"]],
	["Kumba Trade Carriers", "Kumba", ["Kumba", "Mamfe", "Buea"]],
	["Southwest Freight Works", "Buea", ["Buea", "Kumba", "Limbe"]],
	["Kribi Coastal Haul", "Kribi", ["Kribi", "Edea", "Douala"]],
	["Ocean Gate Logistics", "Kribi", ["Kribi", "Ebolowa", "Sangmelima"]],
	["Edea Industrial Freight", "Edea", ["Edea", "Douala", "Kribi"]],
	["Sanaga Cargo Services", "Edea", ["Edea", "Yaounde", "Douala"]],
	["Nkongsamba Transit Co", "Nkongsamba", ["Nkongsamba", "Melong", "Loum"]],
	["Mungo Valley Logistics", "Nkongsamba", ["Nkongsamba", "Mbanga", "Penja"]],
	["Loum Agro Freight", "Loum", ["Loum", "Manjo", "Nkongsamba"]],
	["Penja Produce Carriers", "Penja", ["Penja", "Mbanga", "Douala"]],
	["Mbanga Regional Express", "Mbanga", ["Mbanga", "Loum", "Douala"]],
	["Garoua Sahel Logistics", "Garoua", ["Garoua", "Guider", "Ngaoundere"]],
	["Benoue Freight Lines", "Garoua", ["Garoua", "Maroua", "Yagoua"]],
	["North Truck Services", "Garoua", ["Garoua", "Kousseri", "Mora"]],
	["Maroua Desert Cargo", "Maroua", ["Maroua", "Mora", "Kousseri"]],
	["Diamare Express", "Maroua", ["Maroua", "Kaele", "Mokolo"]],
	["Kousseri Border Freight", "Kousseri", ["Kousseri", "Maroua", "Yagoua"]],
	["Ngaoundere Rail Freight", "Ngaoundere", ["Ngaoundere", "Tibati", "Garoua"]],
	["Adamawa Cargo Network", "Ngaoundere", ["Ngaoundere", "Meiganga", "Garoua"]],
	["Meiganga Road Carriers", "Meiganga", ["Meiganga", "Bertoua", "Ngaoundere"]],
	["Tibati Central Freight", "Tibati", ["Tibati", "Ngaoundere", "Bafia"]],
	["Bertoua Timber Logistics", "Bertoua", ["Bertoua", "Batouri", "Belabo"]],
	["East Region Haulage", "Bertoua", ["Bertoua", "Abong-Mbang", "Meiganga"]],
	["Batouri Mineral Freight", "Batouri", ["Batouri", "Bertoua", "Yokadouma"]],
	["Belabo Junction Logistics", "Belabo", ["Belabo", "Bertoua", "Nkoteng"]],
	[
		"Abong-Mbang Cargo Link",
		"Abong-Mbang",
		["Abong-Mbang", "Bertoua", "Akonolinga"],
	],
	["Ebolowa South Freight", "Ebolowa", ["Ebolowa", "Sangmelima", "Kribi"]],
	["Mvila Carrier Services", "Ebolowa", ["Ebolowa", "Yaounde", "Mbalmayo"]],
	[
		"Sangmelima Timber Route",
		"Sangmelima",
		["Sangmelima", "Ebolowa", "Yaounde"],
	],
	["Mbalmayo Dispatch", "Mbalmayo", ["Mbalmayo", "Yaounde", "Ebolowa"]],
	["Bafia Northbound Freight", "Bafia", ["Bafia", "Obala", "Tibati"]],
	["Obala Market Logistics", "Obala", ["Obala", "Yaounde", "Bafia"]],
	["Nkoteng Agro Carriers", "Nkoteng", ["Nkoteng", "Obala", "Belabo"]],
	["Eséka Forest Freight", "Eséka", ["Eséka", "Edea", "Yaounde"]],
	[
		"Bangangte Trade Express",
		"Bangangte",
		["Bangangte", "Bafoussam", "Foumban"],
	],
	["Foumbot Produce Line", "Foumbot", ["Foumbot", "Foumban", "Bafoussam"]],
	["Mutengene Shuttle Freight", "Mutengene", ["Mutengene", "Buea", "Tiko"]],
] as const;

const TOWN_COORDINATES: Record<string, { lat: number; lng: number }> = {
	Douala: { lat: 4.0511, lng: 9.7679 },
	Yaounde: { lat: 3.848, lng: 11.5021 },
	Bafoussam: { lat: 5.4778, lng: 10.4176 },
	Bamenda: { lat: 5.9631, lng: 10.1591 },
	Buea: { lat: 4.1534, lng: 9.2423 },
	Limbe: { lat: 4.0242, lng: 9.2149 },
	Kribi: { lat: 2.9406, lng: 9.9102 },
	Edea: { lat: 3.8004, lng: 10.1333 },
	Nkongsamba: { lat: 4.9547, lng: 9.9404 },
	Garoua: { lat: 9.3014, lng: 13.3977 },
	Maroua: { lat: 10.591, lng: 14.3159 },
	Ngaoundere: { lat: 7.3277, lng: 13.5847 },
	Bertoua: { lat: 4.5773, lng: 13.6846 },
	Ebolowa: { lat: 2.9158, lng: 11.1537 },
};

export const createTestCompanies = mutation({
	args: {
		ownerUserId: v.id("users"),
		count: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const owner = await ctx.db.get(args.ownerUserId);
		if (!owner) throw new Error("Owner user not found");

		const count = Math.min(Math.max(args.count ?? 60, 1), 60);
		const now = Date.now();
		let created = 0;
		let skipped = 0;

		for (const [index, seed] of CAMEROON_COMPANY_SEEDS.slice(
			0,
			count,
		).entries()) {
			const [name, baseTown, towns] = seed;
			const slug = slugify(name);
			const existing = await ctx.db
				.query("companies")
				.withIndex("by_slug", (q) => q.eq("slug", slug))
				.unique();
			if (existing) {
				skipped += 1;
				continue;
			}

			const base = TOWN_COORDINATES[baseTown] ?? TOWN_COORDINATES.Douala;
			const jitter = (index % 7) * 0.003;
			const companyId = await ctx.db.insert("companies", {
				ownerUserId: args.ownerUserId,
				name,
				legalName: `${name} SARL`,
				slug,
				description: `Reliable ${baseTown}-based logistics provider for freight, parcel, and regional cargo movements.`,
				contactEmail: `operations@${slug}.cm`,
				phone: `+237 6${String(70000000 + index * 13791).slice(0, 8)}`,
				address: `${baseTown} logistics depot`,
				location: {
					lat: base.lat + jitter,
					lng: base.lng - jitter,
					displayName: `${baseTown} logistics depot, Cameroon`,
					source: "import",
					provider: "seed",
					capturedAt: now,
				},
				operatingRegions: [...towns],
				serviceCategories:
					index % 3 === 0
						? ["Freight", "Cold chain", "Warehousing"]
						: index % 3 === 1
							? ["Last-mile", "Express delivery", "Intercity"]
							: ["Heavy haul", "Industrial cargo", "Agriculture"],
				cargoCategories:
					index % 4 === 0
						? ["general_package", "agriculture", "other"]
						: index % 4 === 1
							? ["general_package", "industrial", "construction"]
							: index % 4 === 2
								? ["general_package", "housing", "other"]
								: ["general_package", "petroleum", "industrial"],
				status: "approved",
				verificationStatus: "approved",
				verificationNotes: "Seeded test company for proximity filtering.",
				averageRating: Math.round((3.8 + (index % 12) * 0.1) * 10) / 10,
				reviewCount: 8 + ((index * 7) % 90),
				completedShipmentCount: 20 + ((index * 13) % 260),
				createdAt: now - index * 86_400_000,
				updatedAt: now,
			});

			await ctx.db.insert("companyMembers", {
				companyId,
				userId: args.ownerUserId,
				role: "owner",
				status: "active",
				createdAt: now,
				updatedAt: now,
			});
			await ensureCompanyWallet(ctx, companyId as Id<"companies">);
			created += 1;
		}

		return { created, skipped };
	},
});
