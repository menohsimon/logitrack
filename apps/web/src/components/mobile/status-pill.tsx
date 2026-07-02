import { cn } from "@logitrack/ui/lib/utils";

const statusStyles: Record<string, string> = {
  in_transit: "bg-sky-100 text-sky-700",
  out_for_delivery: "bg-sky-100 text-sky-700",
  picked_up: "bg-sky-100 text-sky-700",
  delivery_confirmed: "bg-emerald-100 text-emerald-700",
  delivered: "bg-emerald-100 text-emerald-700",
  completed: "bg-emerald-100 text-emerald-700",
  pending_company_response: "bg-amber-100 text-amber-700",
  awaiting_driver_assignment: "bg-amber-100 text-amber-700",
  cancelled: "bg-red-100 text-red-700",
  rejected: "bg-red-100 text-red-700",
};

export function StatusPill({ status, className }: { status: string; className?: string }) {
  const label = status
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const inTransitStatuses = [
    "in_transit",
    "out_for_delivery",
    "picked_up",
    "driver_assigned",
    "pickup_scheduled",
    "arriving_for_pickup",
  ];
  const styleKey = inTransitStatuses.includes(status)
    ? "in_transit"
    : ["delivery_confirmed", "delivered", "accepted"].includes(status)
      ? "completed"
      : status;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        statusStyles[styleKey] ?? "bg-muted text-muted-foreground",
        className,
      )}
    >
      {inTransitStatuses.includes(status) ? "In Transit" : label}
    </span>
  );
}