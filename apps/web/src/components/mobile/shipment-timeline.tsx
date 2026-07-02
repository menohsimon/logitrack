"use client";

import { cn } from "@logitrack/ui/lib/utils";
import { Check } from "lucide-react";

type TimelineStep = {
	label: string;
	sublabel?: string;
	completed: boolean;
	active?: boolean;
};

export function HorizontalTimeline({ steps }: { steps: TimelineStep[] }) {
	return (
		<div className="mt-4 flex items-start justify-between gap-1">
			{steps.map((step, i) => (
				<div
					key={step.label}
					className="relative flex flex-1 flex-col items-center"
				>
					{i < steps.length - 1 && (
						<div
							className={cn(
								"absolute top-2 left-1/2 h-0.5 w-full",
								step.completed ? "bg-foreground" : "bg-border",
							)}
						/>
					)}
					<div
						className={cn(
							"relative z-10 size-4 rounded-full border-2",
							step.completed || step.active
								? "border-foreground bg-foreground"
								: "border-muted-foreground/30 bg-background",
						)}
					/>
					<p className="mt-2 text-center font-medium text-[10px]">
						{step.label}
					</p>
					{step.sublabel && (
						<p className="text-center text-[9px] text-muted-foreground">
							{step.sublabel}
						</p>
					)}
				</div>
			))}
		</div>
	);
}

export function VerticalTimeline({
	events,
}: {
	events: Array<{
		title: string;
		description?: string;
		createdAt: number;
		eventType?: string;
		newStatus?: string;
		completed?: boolean;
	}>;
}) {
	return (
		<div className="space-y-4">
			{events.map((event) => {
				const completed =
					event.completed ??
					Boolean(
						event.eventType?.includes("completed") ||
							event.eventType?.includes("confirmed") ||
							["delivered", "delivery_confirmed"].includes(
								event.newStatus ?? "",
							),
					);

				return (
					<div key={`${event.createdAt}-${event.title}`} className="flex gap-3">
						<div
							className={cn(
								"mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
								completed
									? "bg-emerald-100"
									: "border border-muted-foreground/30 bg-background",
							)}
						>
							{completed ? (
								<Check className="size-3 text-emerald-600" />
							) : (
								<span className="size-2 rounded-full bg-muted-foreground/40" />
							)}
						</div>
						<div>
							<p className="text-muted-foreground text-xs">
								{new Intl.DateTimeFormat("en-US", {
									hour: "numeric",
									minute: "2-digit",
									day: "numeric",
									month: "short",
									year: "numeric",
								}).format(new Date(event.createdAt))}
							</p>
							<p className="mt-0.5 font-medium text-sm">{event.title}</p>
							{event.description && (
								<p className="mt-1 text-muted-foreground text-sm">
									{event.description}
								</p>
							)}
						</div>
					</div>
				);
			})}
		</div>
	);
}
