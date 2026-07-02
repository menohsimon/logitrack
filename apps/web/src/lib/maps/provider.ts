import type { MapPlace, RouteSnapshot } from "./types";

const PHOTON_BASE_URL = "https://photon.komoot.io";
const OSRM_BASE_URL = "https://router.project-osrm.org";
const APP_USER_AGENT = "LogiTrack/0.1 (+https://logitrack.local)";

type CacheEntry<T> = {
	value: T;
	expiresAt: number;
};

const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | undefined {
	const entry = cache.get(key);
	if (!entry) return undefined;
	if (entry.expiresAt < Date.now()) {
		cache.delete(key);
		return undefined;
	}
	return entry.value as T;
}

function setCached<T>(key: string, value: T, ttlMs: number) {
	cache.set(key, { value, expiresAt: Date.now() + ttlMs });
	return value;
}

function jsonHeaders() {
	return {
		"User-Agent": APP_USER_AGENT,
		Accept: "application/json",
	};
}

function asNumber(value: unknown) {
	if (typeof value === "number") return value;
	if (typeof value === "string") return Number(value);
	return Number.NaN;
}

function joinParts(parts: Array<string | undefined>) {
	return parts
		.map((part) => part?.trim())
		.filter((part): part is string => Boolean(part))
		.filter((part, index, array) => array.indexOf(part) === index)
		.join(", ");
}

type PhotonFeature = {
	geometry?: {
		coordinates?: unknown[];
	};
	properties?: {
		osm_id?: number | string;
		osm_type?: string;
		name?: string;
		street?: string;
		housenumber?: string;
		city?: string;
		state?: string;
		country?: string;
		postcode?: string;
	};
};

type PhotonResponse = {
	features?: PhotonFeature[];
};

function photonFeatureToPlace(feature: PhotonFeature): MapPlace | null {
	const coordinates = feature.geometry?.coordinates;
	if (!coordinates || coordinates.length < 2) return null;
	const lng = asNumber(coordinates[0]);
	const lat = asNumber(coordinates[1]);
	if (
		!Number.isFinite(lat) ||
		!Number.isFinite(lng) ||
		lat < -90 ||
		lat > 90 ||
		lng < -180 ||
		lng > 180
	) {
		return null;
	}

	const props = feature.properties ?? {};
	const addressLine = joinParts([
		joinParts([props.housenumber, props.street]),
		props.name,
		props.city,
		props.state,
		props.postcode,
		props.country,
	]);
	const id = `${props.osm_type ?? "place"}:${props.osm_id ?? `${lat},${lng}`}`;

	return {
		id,
		displayName: addressLine || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
		lat,
		lng,
		provider: "photon",
		town: props.city ?? props.name,
		region: props.state,
		country: props.country,
	};
}

export async function searchPlaces(input: {
	query: string;
	lat?: number;
	lng?: number;
	limit?: number;
}) {
	const query = input.query.trim();
	if (query.length < 3) return [];

	const url = new URL("/api/", PHOTON_BASE_URL);
	url.searchParams.set("q", query);
	url.searchParams.set("lang", "en");
	url.searchParams.set("limit", String(Math.min(input.limit ?? 6, 10)));
	if (Number.isFinite(input.lat) && Number.isFinite(input.lng)) {
		url.searchParams.set("lat", String(input.lat));
		url.searchParams.set("lon", String(input.lng));
	}

	const key = `search:${url.searchParams.toString()}`;
	const cached = getCached<MapPlace[]>(key);
	if (cached !== undefined) return cached;

	const response = await fetch(url, { headers: jsonHeaders() });
	if (!response.ok) {
		throw new Error("Place search is unavailable");
	}
	const data = (await response.json()) as PhotonResponse;
	const places =
		data.features
			?.map(photonFeatureToPlace)
			.filter((place): place is MapPlace => Boolean(place)) ?? [];
	return setCached(key, places, 24 * 60 * 60 * 1000);
}

export async function reversePlace(input: { lat: number; lng: number }) {
	const url = new URL("/reverse", PHOTON_BASE_URL);
	url.searchParams.set("lat", String(input.lat));
	url.searchParams.set("lon", String(input.lng));
	url.searchParams.set("lang", "en");

	const key = `reverse:${input.lat.toFixed(5)},${input.lng.toFixed(5)}`;
	const cached = getCached<MapPlace | null>(key);
	if (cached !== undefined) return cached;

	const response = await fetch(url, { headers: jsonHeaders() });
	if (!response.ok) {
		throw new Error("Reverse geocoding is unavailable");
	}
	const data = (await response.json()) as PhotonResponse;
	const place =
		data.features
			?.map(photonFeatureToPlace)
			.find((candidate): candidate is MapPlace => Boolean(candidate)) ?? null;
	return setCached(key, place, 7 * 24 * 60 * 60 * 1000);
}

type OsrmRouteResponse = {
	code?: string;
	routes?: Array<{
		distance?: number;
		duration?: number;
		geometry?: {
			type?: string;
			coordinates?: number[][];
		};
	}>;
};

function capCoordinates(coordinates: number[][]) {
	if (coordinates.length <= 500) return coordinates;
	const stride = Math.ceil(coordinates.length / 500);
	return coordinates.filter((_, index) => index % stride === 0);
}

export async function getRoute(input: {
	pickup: { lat: number; lng: number };
	destination: { lat: number; lng: number };
}): Promise<RouteSnapshot | null> {
	const coords = `${input.pickup.lng},${input.pickup.lat};${input.destination.lng},${input.destination.lat}`;
	const url = new URL(`/route/v1/driving/${coords}`, OSRM_BASE_URL);
	url.searchParams.set("overview", "full");
	url.searchParams.set("geometries", "geojson");
	url.searchParams.set("steps", "false");

	const key = `route:${coords}`;
	const cached = getCached<RouteSnapshot | null>(key);
	if (cached !== undefined) return cached;

	const response = await fetch(url, { headers: jsonHeaders() });
	if (!response.ok) return setCached(key, null, 10 * 60 * 1000);

	const data = (await response.json()) as OsrmRouteResponse;
	const route = data.routes?.[0];
	if (
		data.code !== "Ok" ||
		!route ||
		!Number.isFinite(route.distance) ||
		!Number.isFinite(route.duration) ||
		route.geometry?.type !== "LineString" ||
		!route.geometry.coordinates ||
		route.geometry.coordinates.length < 2
	) {
		return setCached(key, null, 10 * 60 * 1000);
	}
	const distance = route.distance;
	const duration = route.duration;
	const coordinates = route.geometry.coordinates;
	if (distance === undefined || duration === undefined || !coordinates) {
		return setCached(key, null, 10 * 60 * 1000);
	}

	return setCached(
		key,
		{
			provider: "osrm",
			distanceMeters: Math.round(distance),
			durationSeconds: Math.round(duration),
			geometry: {
				type: "LineString",
				coordinates: capCoordinates(coordinates),
			},
		},
		24 * 60 * 60 * 1000,
	);
}
