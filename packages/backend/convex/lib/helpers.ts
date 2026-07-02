export function generateBookingNumber(): string {
	const part = Math.random().toString(36).slice(2, 5).toUpperCase();
	const num = Math.floor(100 + Math.random() * 900);
	return `BK-${num}-${part}`;
}

export function generateShipmentNumber(): string {
	const part = Math.random().toString(36).slice(2, 5).toUpperCase();
	const num = Math.floor(100 + Math.random() * 900);
	return `PAQ-${num}-${part}`;
}

export function generateTicketNumber(): string {
	const num = Math.floor(10000 + Math.random() * 90000);
	return `TKT-${num}`;
}

export function slugify(name: string): string {
	return name
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, "")
		.replace(/[\s_-]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export function estimateFareCents(input: { declaredValue?: number }): number {
	return Math.round((input.declaredValue ?? 0) * 0.1 * 100);
}
