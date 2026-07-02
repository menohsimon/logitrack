import { NextResponse } from "next/server";

import { searchPlaces } from "@/lib/maps/provider";

export async function GET(request: Request) {
	const url = new URL(request.url);
	const query = url.searchParams.get("q") ?? "";
	const lat = Number(url.searchParams.get("lat"));
	const lng = Number(url.searchParams.get("lng"));

	try {
		const places = await searchPlaces({
			query,
			lat: Number.isFinite(lat) ? lat : undefined,
			lng: Number.isFinite(lng) ? lng : undefined,
		});
		return NextResponse.json(
			{ places },
			{ headers: { "Cache-Control": "public, max-age=3600" } },
		);
	} catch (error) {
		return NextResponse.json(
			{
				places: [],
				error: error instanceof Error ? error.message : "Search failed",
			},
			{ status: 503 },
		);
	}
}
