export const DEFAULT_CURRENCY = "XAF";

export function formatCurrency(
	cents: number,
	currency = DEFAULT_CURRENCY,
): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency,
		currencyDisplay: "code",
	}).format(cents / 100);
}

export function formatDate(timestamp?: number): string {
	if (!timestamp) return "—";
	return new Intl.DateTimeFormat("en-US", {
		day: "numeric",
		month: "short",
		year: "numeric",
	}).format(new Date(timestamp));
}

export function formatDateTime(timestamp?: number): string {
	if (!timestamp) return "—";
	return new Intl.DateTimeFormat("en-US", {
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
	}).format(new Date(timestamp));
}

export function formatStatus(status: string): string {
	return status
		.split("_")
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
		.join(" ");
}
