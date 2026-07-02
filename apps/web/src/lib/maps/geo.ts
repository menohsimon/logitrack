import type { GeoPointInput, RouteSnapshot } from "./types";

export function isValidCoordinate(lat: number, lng: number) {
	return (
		Number.isFinite(lat) &&
		Number.isFinite(lng) &&
		lat >= -90 &&
		lat <= 90 &&
		lng >= -180 &&
		lng <= 180
	);
}

export function toLatLngTuple(point: { lat: number; lng: number }) {
	return [point.lat, point.lng] as [number, number];
}

export function routeToLatLngs(route?: RouteSnapshot | null) {
	return (
		route?.geometry.coordinates
			.map(([lng, lat]) => ({ lat, lng }))
			.filter((point) => isValidCoordinate(point.lat, point.lng)) ?? []
	);
}

export function formatEta(seconds?: number | null) {
	if (seconds == null || !Number.isFinite(seconds)) return "ETA unavailable";
	const minutes = Math.max(1, Math.round(seconds / 60));
	if (minutes < 60) return `${minutes} min`;
	const hours = Math.floor(minutes / 60);
	const remaining = minutes % 60;
	return remaining ? `${hours} hr ${remaining} min` : `${hours} hr`;
}

export function formatDistance(meters?: number | null) {
	if (meters == null || !Number.isFinite(meters)) return "Distance unavailable";
	if (meters < 1000) return `${Math.round(meters)} m`;
	return `${(meters / 1000).toFixed(meters < 10_000 ? 1 : 0)} km`;
}

export function isStaleLocation(updatedAt?: number | null) {
	if (!updatedAt) return true;
	return Date.now() - updatedAt > 10 * 60 * 1000;
}

export function makeGeoPoint(
	point: {
		lat: number;
		lng: number;
		displayName?: string;
		provider?: string;
		providerPlaceId?: string;
		accuracyMeters?: number;
	},
	source: GeoPointInput["source"],
): GeoPointInput {
	return {
		lat: point.lat,
		lng: point.lng,
		displayName: point.displayName,
		source,
		provider: point.provider,
		providerPlaceId: point.providerPlaceId,
		accuracyMeters: point.accuracyMeters,
		capturedAt: Date.now(),
	};
}
