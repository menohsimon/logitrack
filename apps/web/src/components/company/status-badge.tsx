"use client";

import { Badge } from "@logitrack/ui/components/badge";

import { formatStatus } from "@/lib/format";

const statusVariants: Record<
	string,
	"default" | "secondary" | "destructive" | "outline"
> = {
	approved: "default",
	active: "default",
	accepted: "default",
	completed: "default",
	delivery_confirmed: "default",
	delivered: "default",
	published: "default",
	resolved: "default",
	pending_company_response: "secondary",
	pending_verification: "secondary",
	pending: "secondary",
	awaiting_driver_assignment: "secondary",
	open: "secondary",
	rejected: "destructive",
	cancelled: "destructive",
	cancelled_by_user: "destructive",
	banned: "destructive",
	suspended: "destructive",
	inactive: "outline",
	draft: "outline",
	not_submitted: "outline",
};

export function StatusBadge({ status }: { status: string }) {
	return (
		<Badge variant={statusVariants[status] ?? "outline"}>
			{formatStatus(status)}
		</Badge>
	);
}
