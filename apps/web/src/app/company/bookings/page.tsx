"use client";

import { api } from "@logitrack/backend/convex/_generated/api";
import type { Doc, Id } from "@logitrack/backend/convex/_generated/dataModel";
import { Button } from "@logitrack/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@logitrack/ui/components/card";
import { Label } from "@logitrack/ui/components/label";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@logitrack/ui/components/sheet";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@logitrack/ui/components/table";
import { Textarea } from "@logitrack/ui/components/textarea";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { CompanySetup } from "@/components/company/company-setup";
import { StatusBadge } from "@/components/company/status-badge";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { formatCargoCategory } from "@/lib/estimate-fare";
import {
	DEFAULT_CURRENCY,
	formatCurrency,
	formatDate,
	formatDateTime,
} from "@/lib/format";

type CargoSnapshot = {
	category?: string;
	title?: string;
	description?: string;
	quantity?: number;
	unit?: string;
	weightKg?: number;
	volumeM3?: number;
	lengthCm?: number;
	widthCm?: number;
	heightCm?: number;
	declaredValue?: number;
	currency?: string;
	fragile?: boolean;
	hazardous?: boolean;
	requiresRefrigeration?: boolean;
	requiresSpecialHandling?: boolean;
	handlingInstructions?: string;
};

function asCargoSnapshot(value: unknown): CargoSnapshot {
	return value && typeof value === "object" ? (value as CargoSnapshot) : {};
}

function formatDeclaredValue(value?: number, currency = DEFAULT_CURRENCY) {
	if (value === undefined) return "—";
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency,
		currencyDisplay: "code",
	}).format(value);
}

function formatNumber(value: number | undefined, suffix: string) {
	return value === undefined ? "—" : `${value.toLocaleString()} ${suffix}`;
}

function DetailSection({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<section className="rounded-2xl border bg-background p-4">
			<h3 className="mb-3 font-semibold text-sm">{title}</h3>
			<div className="space-y-3">{children}</div>
		</section>
	);
}

function DetailRow({
	label,
	value,
}: {
	label: string;
	value?: React.ReactNode;
}) {
	return (
		<div className="grid gap-1 text-sm sm:grid-cols-[150px_1fr]">
			<p className="text-muted-foreground">{label}</p>
			<div className="font-medium">{value || "—"}</div>
		</div>
	);
}

function BooleanFlags({ cargo }: { cargo: CargoSnapshot }) {
	const flags = [
		cargo.fragile && "Fragile",
		cargo.hazardous && "Hazardous",
		cargo.requiresRefrigeration && "Refrigerated",
		cargo.requiresSpecialHandling && "Special handling",
	].filter(Boolean);

	if (flags.length === 0) return <span>None selected</span>;
	return <span>{flags.join(", ")}</span>;
}

function BookingDetailsSheet({
	booking,
	onOpenChange,
}: {
	booking: Doc<"bookings"> | null;
	onOpenChange: (open: boolean) => void;
}) {
	const cargo = asCargoSnapshot(booking?.cargoSnapshot);
	const fareCurrency =
		booking?.fareCurrency ?? cargo.currency ?? DEFAULT_CURRENCY;
	const dimensions = [cargo.lengthCm, cargo.widthCm, cargo.heightCm].every(
		(value) => value !== undefined,
	)
		? `${cargo.lengthCm} × ${cargo.widthCm} × ${cargo.heightCm} cm`
		: "—";

	return (
		<Sheet open={Boolean(booking)} onOpenChange={onOpenChange}>
			<SheetContent className="w-full overflow-y-auto sm:max-w-xl">
				{booking && (
					<>
						<SheetHeader>
							<SheetTitle>{booking.bookingNumber}</SheetTitle>
							<SheetDescription>
								Full booking details submitted by the customer.
							</SheetDescription>
						</SheetHeader>

						<div className="space-y-4 px-6 pb-6">
							<DetailSection title="Cargo">
								<DetailRow label="Title" value={cargo.title} />
								<DetailRow
									label="Category"
									value={
										cargo.category ? formatCargoCategory(cargo.category) : "—"
									}
								/>
								<DetailRow label="Description" value={cargo.description} />
								<DetailRow
									label="Quantity"
									value={
										cargo.quantity === undefined
											? "—"
											: `${cargo.quantity.toLocaleString()} ${cargo.unit ?? "unit(s)"}`
									}
								/>
								<DetailRow
									label="Weight"
									value={formatNumber(cargo.weightKg, "kg")}
								/>
								<DetailRow
									label="Volume"
									value={formatNumber(cargo.volumeM3, "m³")}
								/>
								<DetailRow label="Dimensions" value={dimensions} />
								<DetailRow
									label="Declared value"
									value={formatDeclaredValue(
										cargo.declaredValue,
										cargo.currency,
									)}
								/>
								<DetailRow
									label="Flags"
									value={<BooleanFlags cargo={cargo} />}
								/>
								<DetailRow
									label="Handling notes"
									value={cargo.handlingInstructions}
								/>
							</DetailSection>

							<DetailSection title="Route">
								<DetailRow label="Pickup" value={booking.pickupAddress} />
								<DetailRow
									label="Pickup contact"
									value={
										booking.pickupContactName || booking.pickupContactPhone
											? `${booking.pickupContactName ?? "No name"} · ${booking.pickupContactPhone ?? "No phone"}`
											: "—"
									}
								/>
								<DetailRow
									label="Pickup date"
									value={formatDateTime(booking.requestedPickupDate)}
								/>
								<DetailRow
									label="Pickup notes"
									value={booking.pickupInstructions}
								/>
								<DetailRow
									label="Destination"
									value={booking.destinationAddress}
								/>
								<DetailRow
									label="Receiver contact"
									value={
										booking.destinationContactName ||
										booking.destinationContactPhone
											? `${booking.destinationContactName ?? "No name"} · ${booking.destinationContactPhone ?? "No phone"}`
											: "—"
									}
								/>
								<DetailRow
									label="Delivery date"
									value={formatDateTime(booking.requestedDeliveryDate)}
								/>
								<DetailRow
									label="Delivery notes"
									value={booking.destinationInstructions}
								/>
								<DetailRow
									label="Special instructions"
									value={booking.specialInstructions}
								/>
							</DetailSection>

							<DetailSection title="Commercial">
								<DetailRow
									label="Estimated fare"
									value={formatCurrency(
										booking.estimatedFareCents,
										fareCurrency,
									)}
								/>
								{booking.finalFareCents != null && (
									<DetailRow
										label="Final fare"
										value={formatCurrency(booking.finalFareCents, fareCurrency)}
									/>
								)}
								<DetailRow label="Status" value={booking.status} />
								<DetailRow
									label="Submitted"
									value={formatDateTime(booking.createdAt)}
								/>
								<DetailRow
									label="Last updated"
									value={formatDateTime(booking.updatedAt)}
								/>
							</DetailSection>
						</div>
					</>
				)}
			</SheetContent>
		</Sheet>
	);
}

function BookingsInbox({ companyId }: { companyId: Id<"companies"> }) {
	const router = useRouter();
	const bookings = useQuery(api.bookings.listForCompany, { companyId });
	const acceptBooking = useMutation(api.bookings.accept);
	const rejectBooking = useMutation(api.bookings.reject);

	const [rejectingId, setRejectingId] = useState<Id<"bookings"> | null>(null);
	const [rejectReason, setRejectReason] = useState("");
	const [processingId, setProcessingId] = useState<Id<"bookings"> | null>(null);
	const [selectedBooking, setSelectedBooking] =
		useState<Doc<"bookings"> | null>(null);

	const pending =
		bookings?.filter((b) => b.status === "pending_company_response") ?? [];
	const other =
		bookings?.filter((b) => b.status !== "pending_company_response") ?? [];

	async function handleAccept(booking: Doc<"bookings">) {
		const bookingId = booking._id;
		setProcessingId(bookingId);
		try {
			const shipmentId = await acceptBooking({
				bookingId,
				fareCents: booking.estimatedFareCents,
			});
			toast.success("Booking accepted. Shipment created.");
			router.push(`/company/shipments/${shipmentId}`);
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to accept booking",
			);
		} finally {
			setProcessingId(null);
		}
	}

	async function handleReject(bookingId: Id<"bookings">) {
		if (!rejectReason.trim()) {
			toast.error("Please provide a rejection reason");
			return;
		}
		setProcessingId(bookingId);
		try {
			await rejectBooking({ bookingId, reason: rejectReason.trim() });
			toast.success("Booking rejected");
			setRejectingId(null);
			setRejectReason("");
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to reject booking",
			);
		} finally {
			setProcessingId(null);
		}
	}

	return (
		<div className="space-y-6">
			<BookingDetailsSheet
				booking={selectedBooking}
				onOpenChange={(open) => {
					if (!open) setSelectedBooking(null);
				}}
			/>

			<Card>
				<CardHeader>
					<CardTitle>Inbox</CardTitle>
					<CardDescription>
						{pending.length} booking{pending.length === 1 ? "" : "s"} awaiting
						response
					</CardDescription>
				</CardHeader>
				<CardContent>
					{bookings === undefined ? (
						<p className="text-muted-foreground text-sm">Loading bookings...</p>
					) : pending.length === 0 ? (
						<p className="text-muted-foreground text-sm">No pending bookings</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Booking</TableHead>
									<TableHead>Route</TableHead>
									<TableHead>Pickup</TableHead>
									<TableHead>Fare</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{pending.map((booking) => (
									<TableRow key={booking._id}>
										<TableCell>
											<Link
												href={`/company/bookings/${booking._id}`}
												className="font-medium hover:underline"
											>
												{booking.bookingNumber}
											</Link>
										</TableCell>
										<TableCell className="max-w-[200px] truncate text-muted-foreground">
											{booking.pickupAddress} → {booking.destinationAddress}
										</TableCell>
										<TableCell>
											{formatDate(booking.requestedPickupDate)}
										</TableCell>
										<TableCell>
											{formatCurrency(
												booking.estimatedFareCents,
												booking.fareCurrency ?? DEFAULT_CURRENCY,
											)}
										</TableCell>
										<TableCell>
											<StatusBadge status={booking.status} />
										</TableCell>
										<TableCell className="text-right">
											<div className="flex justify-end gap-2">
												<Button
													size="sm"
													variant="outline"
													onClick={() => setSelectedBooking(booking)}
												>
													Details
												</Button>
												<Button
													size="sm"
													disabled={processingId === booking._id}
													onClick={() => handleAccept(booking)}
												>
													Accept
												</Button>
												<Button
													size="sm"
													variant="destructive"
													disabled={processingId === booking._id}
													onClick={() => {
														setRejectingId(booking._id);
														setRejectReason("");
													}}
												>
													Reject
												</Button>
											</div>
											{rejectingId === booking._id && (
												<div className="mt-3 space-y-2 text-left">
													<Label htmlFor={`reject-${booking._id}`}>
														Rejection reason
													</Label>
													<Textarea
														id={`reject-${booking._id}`}
														value={rejectReason}
														onChange={(e) => setRejectReason(e.target.value)}
														rows={2}
														placeholder="Explain why this booking cannot be fulfilled"
													/>
													<div className="flex gap-2">
														<Button
															size="sm"
															variant="destructive"
															disabled={processingId === booking._id}
															onClick={() => handleReject(booking._id)}
														>
															Confirm reject
														</Button>
														<Button
															size="sm"
															variant="outline"
															onClick={() => setRejectingId(null)}
														>
															Cancel
														</Button>
													</div>
												</div>
											)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>All bookings</CardTitle>
				</CardHeader>
				<CardContent>
					{bookings === undefined ? (
						<p className="text-muted-foreground text-sm">Loading...</p>
					) : other.length === 0 ? (
						<p className="text-muted-foreground text-sm">No other bookings</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Booking</TableHead>
									<TableHead>Route</TableHead>
									<TableHead>Created</TableHead>
									<TableHead>Fare</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{other.map((booking) => (
									<TableRow key={booking._id}>
										<TableCell>
											<Link
												href={`/company/bookings/${booking._id}`}
												className="font-medium hover:underline"
											>
												{booking.bookingNumber}
											</Link>
										</TableCell>
										<TableCell className="max-w-[200px] truncate text-muted-foreground">
											{booking.pickupAddress} → {booking.destinationAddress}
										</TableCell>
										<TableCell>{formatDate(booking.createdAt)}</TableCell>
										<TableCell>
											{formatCurrency(
												booking.finalFareCents ?? booking.estimatedFareCents,
												booking.fareCurrency ?? DEFAULT_CURRENCY,
											)}
										</TableCell>
										<TableCell>
											<StatusBadge status={booking.status} />
										</TableCell>
										<TableCell className="text-right">
											<Button
												size="sm"
												variant="outline"
												onClick={() => setSelectedBooking(booking)}
											>
												Details
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

export default function CompanyBookingsPage() {
	return (
		<DashboardShell variant="company" title="Bookings">
			<CompanySetup>
				{({ companyId }) => <BookingsInbox companyId={companyId} />}
			</CompanySetup>
		</DashboardShell>
	);
}
