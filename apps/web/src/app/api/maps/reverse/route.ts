import { NextResponse } from "next/server";

import { reversePlace } from "@/lib/maps/provider";

export async function GET(request: Request) {
	const url = new URL(request.url);
	const lat = Number(url.searchParams.get("lat"));
	const lng = Number(url.searchParams.get("lng"));
	if (
		!Number.isFinite(lat) ||
		!Number.isFinite(lng) ||
		lat < -90 ||
		lat > 90 ||
		lng < -180 ||
		lng > 180
	) {
		return NextResponse.json(
			{ place: null, error: "Invalid coordinates" },
			{
				status: 400,
			},
		);
	}

	try {
		const place = await reversePlace({ lat, lng });
		return NextResponse.json(
			{ place },
			{ headers: { "Cache-Control": "public, max-age=86400" } },
		);
	} catch (error) {
		return NextResponse.json(
			{
				place: null,
				error: error instanceof Error ? error.message : "Reverse failed",
			},
			{ status: 503 },
		);
	}
}
