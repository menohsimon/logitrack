export function estimateFareCents(input: { declaredValue?: number }): number {
	return Math.round((input.declaredValue ?? 0) * 0.1 * 100);
}

export const CARGO_CATEGORIES = [
	{ value: "general_package", label: "General Package" },
	{ value: "petroleum", label: "Petroleum" },
	{ value: "agriculture", label: "Agriculture" },
	{ value: "construction", label: "Construction" },
	{ value: "housing", label: "Housing" },
	{ value: "industrial", label: "Industrial" },
	{ value: "other", label: "Other" },
] as const;

export function formatCargoCategory(category: string): string {
	return (
		CARGO_CATEGORIES.find((c) => c.value === category)?.label ??
		formatStatus(category)
	);
}

function formatStatus(status: string): string {
	return status
		.split("_")
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
		.join(" ");
}
