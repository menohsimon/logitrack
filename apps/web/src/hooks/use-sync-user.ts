"use client";

import { useUser } from "@clerk/nextjs";
import { api } from "@logitrack/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { useEffect, useRef } from "react";

export function useSyncUser() {
	const { user, isLoaded } = useUser();
	const syncUser = useMutation(api.users.syncCurrentUserFromClerk);
	const synced = useRef(false);

	useEffect(() => {
		if (!isLoaded || !user || synced.current) return;
		synced.current = true;
		syncUser({
			name: user.fullName ?? undefined,
			email: user.primaryEmailAddress?.emailAddress,
			avatarUrl: user.imageUrl,
		}).catch((error) => {
			synced.current = false;
			console.error(error);
		});
	}, [isLoaded, user, syncUser]);
}
