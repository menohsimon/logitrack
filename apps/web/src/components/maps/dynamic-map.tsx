"use client";

import dynamic from "next/dynamic";

export const DynamicMap = dynamic(
	() => import("./map-client").then((mod) => mod.MapClient),
	{
		ssr: false,
		loading: () => (
			<div className="flex h-72 items-center justify-center rounded-2xl border bg-muted text-muted-foreground text-sm">
				Loading map...
			</div>
		),
	},
);
