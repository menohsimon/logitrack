import type { Doc } from "../_generated/dataModel";

export type GeoPointInput = {
	lat: number;
	lng: number;
	displayName?: string;
	source: "gps" | "search" | "pin" | "import";
	provider?: string;
	providerPlaceId?: string;
	accuracyMeters?: number;
	capturedAt?: number;
};

export type RouteSnapshotInput = {
	provider: string;
	distanceMeters: number;
	durationSeconds: number;
	geometry: {
		type: "LineString";
		coordinates: number[][];
	};
};

export function assertCoordinate(lat: number, lng: number) {
	if (
		!Number.isFinite(lat) ||
		!Number.isFinite(lng) ||
		lat < -90 ||
		lat > 90 ||
		lng < -180 ||
		lng > 180
	) {
		throw new Error("Invalid coordinates");
	}
}

function optionalTrimmed(value: string | undefined) {
	const trimmed = value?.trim();
	return trimmed || undefined;
}

function optionalNonNegative(value: number | undefined, label: string) {
	if (value === undefined) return undefined;
	if (!Number.isFinite(value) || value < 0) {
		throw new Error(`${label} must be a positive number`);
	}
	return value;
}

export function sanitizeGeoPoint(input: GeoPointInput): GeoPointInput {
	assertCoordinate(input.lat, input.lng);
	return {
		lat: input.lat,
		lng: input.lng,
		displayName: optionalTrimmed(input.displayName),
		source: input.source,
		provider: optionalTrimmed(input.provider),
		providerPlaceId: optionalTrimmed(input.providerPlaceId),
		accuracyMeters: optionalNonNegative(
			input.accuracyMeters,
			"Location accuracy",
		),
		capturedAt:
			input.capturedAt !== undefined && Number.isFinite(input.capturedAt)
				? input.capturedAt
				: undefined,
	};
}

export function sanitizeRouteSnapshot(
	input: RouteSnapshotInput | undefined,
): RouteSnapshotInput | undefined {
	if (!input) return undefined;
	if (!input.provider.trim()) throw new Error("Route provider is required");
	if (!Number.isFinite(input.distanceMeters) || input.distanceMeters < 0) {
		throw new Error("Route distance must be a positive number");
	}
	if (!Number.isFinite(input.durationSeconds) || input.durationSeconds < 0) {
		throw new Error("Route duration must be a positive number");
	}
	if (input.geometry.type !== "LineString") {
		throw new Error("Route geometry must be a LineString");
	}
	const coordinates = input.geometry.coordinates.slice(0, 500).map((pair) => {
		if (pair.length < 2) throw new Error("Invalid route coordinate");
		const [lng, lat] = pair;
		assertCoordinate(lat, lng);
		return [lng, lat];
	});
	if (coordinates.length < 2) {
		throw new Error("Route must include at least two coordinates");
	}

	return {
		provider: input.provider.trim(),
		distanceMeters: Math.round(input.distanceMeters),
		durationSeconds: Math.round(input.durationSeconds),
		geometry: {
			type: "LineString",
			coordinates,
		},
	};
}

export function haversineMeters(
	a: { lat: number; lng: number },
	b: { lat: number; lng: number },
) {
	const radiusMeters = 6_371_000;
	const lat1 = (a.lat * Math.PI) / 180;
	const lat2 = (b.lat * Math.PI) / 180;
	const dLat = ((b.lat - a.lat) * Math.PI) / 180;
	const dLng = ((b.lng - a.lng) * Math.PI) / 180;
	const sinLat = Math.sin(dLat / 2);
	const sinLng = Math.sin(dLng / 2);
	const value =
		sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
	return 2 * radiusMeters * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export function coarsenLocation(location: Doc<"shipmentLocations">) {
	return {
		lat: Math.round(location.lat * 100) / 100,
		lng: Math.round(location.lng * 100) / 100,
		updatedAt: location.updatedAt,
		capturedAt: location.capturedAt,
		etaSeconds: location.etaSeconds,
		estimatedArrivalAt: location.estimatedArrivalAt,
	};
}
