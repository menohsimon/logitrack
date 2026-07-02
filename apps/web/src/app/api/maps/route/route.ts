import { NextResponse } from "next/server";

import { getRoute } from "@/lib/maps/provider";

type RouteRequest = {
	pickup?: {
		lat?: number;
		lng?: number;
	};
	destination?: {
		lat?: number;
		lng?: number;
	};
};

function isValidPoint(
	point: RouteRequest["pickup"],
): point is { lat: number; lng: number } {
	if (!point) return false;
	const { lat, lng } = point;
	return (
		Number.isFinite(lat) &&
		Number.isFinite(lng) &&
		lat !== undefined &&
		lng !== undefined &&
		lat >= -90 &&
		lat <= 90 &&
		lng >= -180 &&
		lng <= 180
	);
}

export async function POST(request: Request) {
	const body = (await request.json().catch(() => null)) as RouteRequest | null;
	const pickup = body?.pickup;
	const destination = body?.destination;
	if (!isValidPoint(pickup) || !isValidPoint(destination)) {
		return NextResponse.json(
			{ route: null, error: "Invalid route points" },
			{
				status: 400,
			},
		);
	}

	try {
		const route = await getRoute({
			pickup,
			destination,
		});
		return NextResponse.json(
			{ route },
			{ headers: { "Cache-Control": "public, max-age=86400" } },
		);
	} catch (error) {
		return NextResponse.json(
			{
				route: null,
				error: error instanceof Error ? error.message : "Routing failed",
			},
			{ status: 503 },
		);
	}
}
