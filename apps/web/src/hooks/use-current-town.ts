"use client";

import { useCallback, useState } from "react";

import { reverseMapPlace } from "@/lib/maps/client";
import { extractTownFromPlace } from "@/lib/towns";

type CurrentTownState = {
	town: string | null;
	loading: boolean;
	error: string | null;
};

export function useCurrentTown() {
	const [state, setState] = useState<CurrentTownState>({
		town: null,
		loading: false,
		error: null,
	});

	const detectTown = useCallback(async () => {
		if (!navigator.geolocation) {
			setState({
				town: null,
				loading: false,
				error: "Geolocation is not available in this browser",
			});
			return null;
		}

		setState((current) => ({ ...current, loading: true, error: null }));

		return await new Promise<string | null>((resolve) => {
			navigator.geolocation.getCurrentPosition(
				async (position) => {
					try {
						const place = await reverseMapPlace({
							lat: position.coords.latitude,
							lng: position.coords.longitude,
						});
						const town = place ? extractTownFromPlace(place) : null;
						setState({ town, loading: false, error: null });
						resolve(town);
					} catch (error) {
						const message =
							error instanceof Error
								? error.message
								: "Could not detect current town";
						setState({ town: null, loading: false, error: message });
						resolve(null);
					}
				},
				(error) => {
					setState({
						town: null,
						loading: false,
						error: error.message || "Location permission denied",
					});
					resolve(null);
				},
				{ enableHighAccuracy: false, timeout: 12000, maximumAge: 600000 },
			);
		});
	}, []);

	return { ...state, detectTown };
}
