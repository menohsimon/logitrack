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

export type MapPlace = {
	id: string;
	displayName: string;
	lat: number;
	lng: number;
	provider: string;
	town?: string;
	region?: string;
	country?: string;
};

export type RouteSnapshot = {
	provider: string;
	distanceMeters: number;
	durationSeconds: number;
	geometry: {
		type: "LineString";
		coordinates: number[][];
	};
};

export type ShipmentMapLocation = {
	lat: number;
	lng: number;
	accuracyMeters?: number;
	capturedAt?: number;
	updatedAt?: number;
	etaSeconds?: number;
	estimatedArrivalAt?: number;
};
