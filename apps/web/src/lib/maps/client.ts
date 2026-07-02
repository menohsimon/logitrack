import type { MapPlace, RouteSnapshot } from "./types";

export async function searchMapPlaces(
	query: string,
	options?: { lat?: number; lng?: number; signal?: AbortSignal },
) {
	const url = new URL("/api/maps/search", window.location.origin);
	url.searchParams.set("q", query);
	if (options?.lat !== undefined && options.lng !== undefined) {
		url.searchParams.set("lat", String(options.lat));
		url.searchParams.set("lng", String(options.lng));
	}
	const response = await fetch(url, { signal: options?.signal });
	if (!response.ok) throw new Error("Place search failed");
	const data = (await response.json()) as { places: MapPlace[] };
	return data.places;
}

export async function reverseMapPlace(input: { lat: number; lng: number }) {
	const url = new URL("/api/maps/reverse", window.location.origin);
	url.searchParams.set("lat", String(input.lat));
	url.searchParams.set("lng", String(input.lng));
	const response = await fetch(url);
	if (!response.ok) return null;
	const data = (await response.json()) as { place: MapPlace | null };
	return data.place;
}

export async function getMapRoute(input: {
	pickup: { lat: number; lng: number };
	destination: { lat: number; lng: number };
}) {
	const response = await fetch("/api/maps/route", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	if (!response.ok) return null;
	const data = (await response.json()) as { route: RouteSnapshot | null };
	return data.route;
}
