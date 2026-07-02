export const SHIPMENT_TRANSITIONS: Record<string, string[]> = {
	created: ["awaiting_driver_assignment", "cancelled"],
	awaiting_driver_assignment: ["driver_assigned", "cancelled"],
	driver_assigned: [
		"pickup_scheduled",
		"arriving_for_pickup",
		"picked_up",
		"cancelled",
	],
	pickup_scheduled: ["arriving_for_pickup", "cancelled"],
	arriving_for_pickup: ["picked_up", "cancelled"],
	picked_up: ["in_transit", "delayed"],
	in_transit: ["at_checkpoint", "out_for_delivery", "delayed"],
	at_checkpoint: ["in_transit", "out_for_delivery", "delayed"],
	delayed: ["in_transit", "out_for_delivery"],
	out_for_delivery: ["delivered", "failed_delivery"],
	delivered: ["delivery_confirmed", "disputed"],
	delivery_confirmed: [],
	failed_delivery: ["out_for_delivery", "disputed", "cancelled"],
	disputed: ["delivery_confirmed", "cancelled"],
	cancelled: [],
};

export const PROOF_REQUIRED_STATUSES = new Set(["picked_up", "delivered"]);
export const PRE_PICKUP_SHIPMENT_STATUSES = new Set([
	"created",
	"awaiting_driver_assignment",
	"driver_assigned",
	"pickup_scheduled",
	"arriving_for_pickup",
]);
export const TERMINAL_SHIPMENT_STATUSES = new Set([
	"delivery_confirmed",
	"cancelled",
]);
export const DESCRIPTION_REQUIRED_STATUSES = new Set([
	"at_checkpoint",
	"delayed",
	"failed_delivery",
	"disputed",
]);

export function canTransitionShipment(from: string, to: string): boolean {
	return SHIPMENT_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getNextShipmentStatuses(current: string): string[] {
	return SHIPMENT_TRANSITIONS[current] ?? [];
}
