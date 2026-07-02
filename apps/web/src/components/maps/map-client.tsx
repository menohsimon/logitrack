"use client";

import L, { type LatLngBoundsExpression } from "leaflet";
import { useEffect, useMemo } from "react";
import {
	Circle,
	MapContainer,
	Marker,
	Polyline,
	Popup,
	TileLayer,
	useMap,
	useMapEvents,
} from "react-leaflet";

import { routeToLatLngs, toLatLngTuple } from "@/lib/maps/geo";
import type {
	GeoPointInput,
	RouteSnapshot,
	ShipmentMapLocation,
} from "@/lib/maps/types";

type MarkerKind = "pickup" | "destination" | "current" | "pin";

type MapClientProps = {
	pickup?: GeoPointInput | null;
	destination?: GeoPointInput | null;
	currentLocation?: ShipmentMapLocation | null;
	route?: RouteSnapshot | null;
	selectedPoint?: GeoPointInput | null;
	onPointChange?: (point: { lat: number; lng: number }) => void;
	heightClassName?: string;
	className?: string;
};

function makeIcon(kind: MarkerKind) {
	return L.divIcon({
		className: "",
		html: `<span class="logitrack-map-marker logitrack-map-marker--${kind}"></span>`,
		iconSize: [22, 22],
		iconAnchor: [11, 11],
	});
}

function FitBounds({
	points,
}: {
	points: Array<{ lat: number; lng: number }>;
}) {
	const map = useMap();

	useEffect(() => {
		if (points.length === 0) return;
		if (points.length === 1) {
			map.setView(toLatLngTuple(points[0]), 13);
			return;
		}
		const bounds = points.map((point) => toLatLngTuple(point));
		map.fitBounds(bounds as LatLngBoundsExpression, {
			padding: [24, 24],
			maxZoom: 14,
		});
	}, [map, points]);

	return null;
}

function InvalidateSize() {
	const map = useMap();
	useEffect(() => {
		const timeout = window.setTimeout(() => map.invalidateSize(), 100);
		return () => window.clearTimeout(timeout);
	}, [map]);
	return null;
}

function ClickToSelect({
	onPointChange,
}: {
	onPointChange?: (point: { lat: number; lng: number }) => void;
}) {
	useMapEvents({
		click(event) {
			onPointChange?.({ lat: event.latlng.lat, lng: event.latlng.lng });
		},
	});
	return null;
}

function DraggablePin({
	point,
	onPointChange,
	icon,
}: {
	point: GeoPointInput;
	onPointChange?: (point: { lat: number; lng: number }) => void;
	icon: L.DivIcon;
}) {
	return (
		<Marker
			position={toLatLngTuple(point)}
			icon={icon}
			draggable={Boolean(onPointChange)}
			eventHandlers={{
				dragend(event) {
					const marker = event.target;
					const next = marker.getLatLng();
					onPointChange?.({ lat: next.lat, lng: next.lng });
				},
			}}
		>
			<Popup>{point.displayName ?? "Selected location"}</Popup>
		</Marker>
	);
}

export function MapClient({
	pickup,
	destination,
	currentLocation,
	route,
	selectedPoint,
	onPointChange,
	heightClassName = "h-72",
	className = "",
}: MapClientProps) {
	const icons = useMemo(
		() => ({
			pickup: makeIcon("pickup"),
			destination: makeIcon("destination"),
			current: makeIcon("current"),
			pin: makeIcon("pin"),
		}),
		[],
	);
	const routeLatLngs = routeToLatLngs(route);
	const boundsPoints = [
		...routeLatLngs,
		pickup,
		destination,
		currentLocation,
		selectedPoint,
	].filter(
		(point): point is { lat: number; lng: number } =>
			Boolean(point) &&
			Number.isFinite(point?.lat) &&
			Number.isFinite(point?.lng),
	);
	const center = boundsPoints[0] ?? { lat: 4.0511, lng: 9.7679 };

	return (
		<div
			className={`overflow-hidden rounded-2xl border bg-muted ${heightClassName} ${className}`}
		>
			<MapContainer
				center={toLatLngTuple(center)}
				zoom={boundsPoints.length > 1 ? 10 : 12}
				scrollWheelZoom
				className="h-full w-full"
			>
				<TileLayer
					attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
					url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
					maxZoom={19}
				/>
				<InvalidateSize />
				<FitBounds points={boundsPoints} />
				<ClickToSelect onPointChange={onPointChange} />
				{routeLatLngs.length > 1 && (
					<Polyline
						positions={routeLatLngs.map(toLatLngTuple)}
						pathOptions={{ color: "#2563eb", weight: 4, opacity: 0.8 }}
					/>
				)}
				{pickup && (
					<Marker position={toLatLngTuple(pickup)} icon={icons.pickup}>
						<Popup>{pickup.displayName ?? "Pickup"}</Popup>
					</Marker>
				)}
				{destination && (
					<Marker
						position={toLatLngTuple(destination)}
						icon={icons.destination}
					>
						<Popup>{destination.displayName ?? "Destination"}</Popup>
					</Marker>
				)}
				{currentLocation && (
					<>
						<Marker
							position={toLatLngTuple(currentLocation)}
							icon={icons.current}
						>
							<Popup>Current package location</Popup>
						</Marker>
						{currentLocation.accuracyMeters ? (
							<Circle
								center={toLatLngTuple(currentLocation)}
								radius={currentLocation.accuracyMeters}
								pathOptions={{
									color: "#2563eb",
									fillColor: "#2563eb",
									fillOpacity: 0.08,
									weight: 1,
								}}
							/>
						) : null}
					</>
				)}
				{selectedPoint && (
					<DraggablePin
						point={selectedPoint}
						onPointChange={onPointChange}
						icon={icons.pin}
					/>
				)}
			</MapContainer>
		</div>
	);
}
