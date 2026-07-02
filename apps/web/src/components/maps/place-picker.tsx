"use client";

import { Button } from "@logitrack/ui/components/button";
import { Input } from "@logitrack/ui/components/input";
import { Label } from "@logitrack/ui/components/label";
import { LocateFixed, MapPin, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { reverseMapPlace, searchMapPlaces } from "@/lib/maps/client";
import { makeGeoPoint } from "@/lib/maps/geo";
import type { GeoPointInput, MapPlace } from "@/lib/maps/types";
import { DynamicMap } from "./dynamic-map";

type PlacePickerProps = {
	id: string;
	label: string;
	value: GeoPointInput | null;
	onChange: (point: GeoPointInput | null) => void;
	placeholder?: string;
	required?: boolean;
};

function placeToGeoPoint(place: MapPlace): GeoPointInput {
	return makeGeoPoint(
		{
			lat: place.lat,
			lng: place.lng,
			displayName: place.displayName,
			provider: place.provider,
			providerPlaceId: place.id,
		},
		"search",
	);
}

export function PlacePicker({
	id,
	label,
	value,
	onChange,
	placeholder = "Search for a city, address, or landmark",
	required,
}: PlacePickerProps) {
	const [query, setQuery] = useState(value?.displayName ?? "");
	const [places, setPlaces] = useState<MapPlace[]>([]);
	const [loading, setLoading] = useState(false);
	const [locating, setLocating] = useState(false);
	const [message, setMessage] = useState<string | null>(null);

	useEffect(() => {
		setQuery(value?.displayName ?? "");
	}, [value?.displayName]);

	useEffect(() => {
		if (query.trim().length < 3) {
			setPlaces([]);
			setMessage(null);
			return;
		}
		const controller = new AbortController();
		const timeout = window.setTimeout(async () => {
			setLoading(true);
			try {
				const results = await searchMapPlaces(query, {
					signal: controller.signal,
				});
				setPlaces(results);
				setMessage(results.length === 0 ? "No places found" : null);
			} catch (error) {
				if (!controller.signal.aborted) {
					setPlaces([]);
					setMessage(
						error instanceof Error ? error.message : "Place search failed",
					);
				}
			} finally {
				if (!controller.signal.aborted) setLoading(false);
			}
		}, 600);

		return () => {
			window.clearTimeout(timeout);
			controller.abort();
		};
	}, [query]);

	const selectedText = useMemo(() => {
		if (!value) return required ? "Location required" : "No location selected";
		return `${value.displayName ?? "Selected location"} · ${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}`;
	}, [required, value]);

	async function handleMapPointChange(point: { lat: number; lng: number }) {
		const reverse = await reverseMapPlace(point).catch(() => null);
		const next = makeGeoPoint(
			{
				lat: point.lat,
				lng: point.lng,
				displayName:
					reverse?.displayName ??
					`${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`,
				provider: reverse?.provider,
				providerPlaceId: reverse?.id,
			},
			"pin",
		);
		onChange(next);
		setQuery(next.displayName ?? "");
		setPlaces([]);
		setMessage(null);
	}

	function handlePlaceSelect(place: MapPlace) {
		const next = placeToGeoPoint(place);
		onChange(next);
		setQuery(next.displayName ?? "");
		setPlaces([]);
		setMessage(null);
	}

	function handleUseCurrentLocation() {
		if (!navigator.geolocation) {
			setMessage("Geolocation is not available in this browser");
			return;
		}

		setLocating(true);
		navigator.geolocation.getCurrentPosition(
			async (position) => {
				try {
					const reverse = await reverseMapPlace({
						lat: position.coords.latitude,
						lng: position.coords.longitude,
					}).catch(() => null);
					const next = makeGeoPoint(
						{
							lat: position.coords.latitude,
							lng: position.coords.longitude,
							displayName:
								reverse?.displayName ??
								`Current location · ${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`,
							provider: reverse?.provider,
							providerPlaceId: reverse?.id,
							accuracyMeters: position.coords.accuracy,
						},
						"gps",
					);
					onChange(next);
					setQuery(next.displayName ?? "");
					setPlaces([]);
					setMessage(
						`Current location captured with ${Math.round(position.coords.accuracy)} m accuracy`,
					);
				} finally {
					setLocating(false);
				}
			},
			(error) => {
				setLocating(false);
				setMessage(error.message || "Location permission denied");
			},
			{ enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
		);
	}

	return (
		<div className="space-y-3">
			<div className="space-y-2">
				<Label htmlFor={id}>{label}</Label>
				<div className="relative">
					<Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						id={id}
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder={placeholder}
						className="pl-9"
					/>
				</div>
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={locating}
					onClick={handleUseCurrentLocation}
				>
					<LocateFixed className="size-4" />
					{locating ? "Locating..." : "Use current location"}
				</Button>
			</div>
			{(places.length > 0 || loading || message) && (
				<div className="rounded-2xl border bg-background p-2">
					{loading && (
						<p className="px-2 py-1 text-muted-foreground text-sm">
							Searching...
						</p>
					)}
					{message && !loading && (
						<p className="px-2 py-1 text-muted-foreground text-sm">{message}</p>
					)}
					<div className="space-y-1">
						{places.map((place) => (
							<Button
								key={place.id}
								type="button"
								variant="ghost"
								className="h-auto w-full justify-start gap-2 rounded-xl px-2 py-2 text-left"
								onClick={() => handlePlaceSelect(place)}
							>
								<MapPin className="size-4 shrink-0 text-muted-foreground" />
								<span className="min-w-0 truncate text-sm">
									{place.displayName}
								</span>
							</Button>
						))}
					</div>
				</div>
			)}
			<div className="rounded-2xl border bg-muted/30 p-3">
				<p className="mb-2 text-muted-foreground text-xs">{selectedText}</p>
				<DynamicMap
					selectedPoint={value}
					onPointChange={handleMapPointChange}
					heightClassName="h-64"
				/>
			</div>
		</div>
	);
}
