"use client";

import { api } from "@logitrack/backend/convex/_generated/api";
import { Button } from "@logitrack/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@logitrack/ui/components/card";
import { Checkbox } from "@logitrack/ui/components/checkbox";
import { Input } from "@logitrack/ui/components/input";
import { Label } from "@logitrack/ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@logitrack/ui/components/select";
import { Textarea } from "@logitrack/ui/components/textarea";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { CurrencySelect } from "@/components/form/currency-select";
import { PlacePicker } from "@/components/maps/place-picker";
import {
	CARGO_CATEGORIES,
	estimateFareCents,
	formatCargoCategory,
} from "@/lib/estimate-fare";
import { DEFAULT_CURRENCY, formatCurrency } from "@/lib/format";
import { getMapRoute } from "@/lib/maps/client";
import { formatDistance, formatEta } from "@/lib/maps/geo";
import type { GeoPointInput, RouteSnapshot } from "@/lib/maps/types";
import { asLinkRender } from "@/lib/render-adapters";

const STEPS = ["Pickup", "Destination", "Cargo", "Summary"] as const;

type CargoForm = {
	category: string;
	title: string;
	description: string;
	quantity: string;
	unit: string;
	weightKg: string;
	volumeM3: string;
	lengthCm: string;
	widthCm: string;
	heightCm: string;
	declaredValue: string;
	currency: string;
	fragile: boolean;
	hazardous: boolean;
	requiresRefrigeration: boolean;
	requiresSpecialHandling: boolean;
	handlingInstructions: string;
};

export function BookingFormContent({
	slug,
	companyBasePath,
}: {
	slug: string;
	companyBasePath: string;
}) {
	const router = useRouter();

	const company = useQuery(api.companies.getBySlug, { slug });
	const walletData = useQuery(api.wallets.getCurrentWallet);
	const createBooking = useMutation(api.bookings.create);

	const [step, setStep] = useState(0);
	const [loading, setLoading] = useState(false);
	const currencyTouchedRef = useRef(false);

	const [pickupAddress, setPickupAddress] = useState("");
	const [pickupLocation, setPickupLocation] = useState<GeoPointInput | null>(
		null,
	);
	const [pickupContactName, setPickupContactName] = useState("");
	const [pickupContactPhone, setPickupContactPhone] = useState("");
	const [pickupInstructions, setPickupInstructions] = useState("");
	const [requestedPickupDate, setRequestedPickupDate] = useState("");

	const [destinationAddress, setDestinationAddress] = useState("");
	const [destinationLocation, setDestinationLocation] =
		useState<GeoPointInput | null>(null);
	const [destinationContactName, setDestinationContactName] = useState("");
	const [destinationContactPhone, setDestinationContactPhone] = useState("");
	const [destinationInstructions, setDestinationInstructions] = useState("");
	const [requestedDeliveryDate, setRequestedDeliveryDate] = useState("");
	const [specialInstructions, setSpecialInstructions] = useState("");
	const [routeSnapshot, setRouteSnapshot] = useState<RouteSnapshot | null>(
		null,
	);

	const [cargo, setCargo] = useState<CargoForm>({
		category: "general_package",
		title: "",
		description: "",
		quantity: "",
		unit: "",
		weightKg: "",
		volumeM3: "",
		lengthCm: "",
		widthCm: "",
		heightCm: "",
		declaredValue: "",
		currency: DEFAULT_CURRENCY,
		fragile: false,
		hazardous: false,
		requiresRefrigeration: false,
		requiresSpecialHandling: false,
		handlingInstructions: "",
	});

	const estimatedFare = useMemo(
		() =>
			estimateFareCents({
				declaredValue: cargo.declaredValue
					? Number(cargo.declaredValue)
					: undefined,
			}),
		[cargo],
	);
	const supportedCargoCategories = useMemo(
		() =>
			CARGO_CATEGORIES.filter((category) =>
				company?.cargoCategories.includes(category.value),
			),
		[company],
	);

	useEffect(() => {
		if (walletData?.wallet.currency) {
			setCargo((current) => ({
				...current,
				currency: currencyTouchedRef.current
					? current.currency
					: walletData.wallet.currency,
			}));
		}
	}, [walletData?.wallet.currency]);

	useEffect(() => {
		if (
			supportedCargoCategories.length > 0 &&
			!supportedCargoCategories.some(
				(category) => category.value === cargo.category,
			)
		) {
			setCargo((current) => ({
				...current,
				category: supportedCargoCategories[0]?.value ?? "general_package",
			}));
		}
	}, [cargo.category, supportedCargoCategories]);

	useEffect(() => {
		if (!pickupLocation || !destinationLocation) {
			setRouteSnapshot(null);
			return;
		}
		let cancelled = false;
		getMapRoute({
			pickup: pickupLocation,
			destination: destinationLocation,
		})
			.then((route) => {
				if (!cancelled) setRouteSnapshot(route);
			})
			.catch(() => {
				if (!cancelled) setRouteSnapshot(null);
			});
		return () => {
			cancelled = true;
		};
	}, [destinationLocation, pickupLocation]);

	function canProceed(): boolean {
		if (step === 0) return Boolean(pickupLocation);
		if (step === 1) return Boolean(destinationLocation);
		if (step === 2)
			return (
				cargo.title.trim().length > 0 &&
				cargo.category.length > 0 &&
				Number(cargo.declaredValue) > 0 &&
				cargo.currency.length > 0
			);
		return true;
	}

	async function handleSubmit() {
		if (!company) return;
		if (!pickupLocation || !destinationLocation) {
			toast.error("Select pickup and destination locations on the map");
			return;
		}
		setLoading(true);
		try {
			const bookingId = await createBooking({
				companyId: company._id,
				pickupAddress: pickupLocation.displayName ?? pickupAddress.trim(),
				pickupLocation,
				pickupContactName: pickupContactName.trim() || undefined,
				pickupContactPhone: pickupContactPhone.trim() || undefined,
				pickupInstructions: pickupInstructions.trim() || undefined,
				requestedPickupDate: requestedPickupDate
					? new Date(requestedPickupDate).getTime()
					: undefined,
				destinationAddress:
					destinationLocation.displayName ?? destinationAddress.trim(),
				destinationLocation,
				routeSnapshot: routeSnapshot ?? undefined,
				destinationContactName: destinationContactName.trim() || undefined,
				destinationContactPhone: destinationContactPhone.trim() || undefined,
				destinationInstructions: destinationInstructions.trim() || undefined,
				requestedDeliveryDate: requestedDeliveryDate
					? new Date(requestedDeliveryDate).getTime()
					: undefined,
				specialInstructions: specialInstructions.trim() || undefined,
				cargo: {
					category:
						cargo.category as (typeof CARGO_CATEGORIES)[number]["value"],
					title: cargo.title.trim(),
					description: cargo.description.trim() || undefined,
					quantity: cargo.quantity ? Number(cargo.quantity) : undefined,
					unit: cargo.unit.trim() || undefined,
					weightKg: cargo.weightKg ? Number(cargo.weightKg) : undefined,
					volumeM3: cargo.volumeM3 ? Number(cargo.volumeM3) : undefined,
					lengthCm: cargo.lengthCm ? Number(cargo.lengthCm) : undefined,
					widthCm: cargo.widthCm ? Number(cargo.widthCm) : undefined,
					heightCm: cargo.heightCm ? Number(cargo.heightCm) : undefined,
					declaredValue: cargo.declaredValue ? Number(cargo.declaredValue) : 0,
					currency: cargo.currency,
					fragile: cargo.fragile,
					hazardous: cargo.hazardous,
					requiresRefrigeration: cargo.requiresRefrigeration,
					requiresSpecialHandling: cargo.requiresSpecialHandling,
					handlingInstructions: cargo.handlingInstructions.trim() || undefined,
				},
			});
			toast.success("Booking submitted successfully!");
			router.push(`/dashboard/bookings/${bookingId}`);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Failed to create booking");
		} finally {
			setLoading(false);
		}
	}

	if (company === undefined) {
		return <p className="text-muted-foreground">Loading...</p>;
	}

	if (company === null) {
		return (
			<div>
				<h1 className="mb-2 font-bold text-2xl">Company not found</h1>
				<Button render={asLinkRender(companyBasePath)} variant="outline">
					Back to marketplace
				</Button>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-2xl">
			<Button
				render={asLinkRender(`${companyBasePath}/${slug}`)}
				variant="ghost"
				size="sm"
				className="mb-4 -ml-2"
			>
				<ArrowLeft className="mr-1 size-4" /> Back to {company.name}
			</Button>

			<h1 className="mb-1 font-bold text-2xl">Book with {company.name}</h1>
			<p className="mb-6 text-muted-foreground">
				Complete the steps below to request a shipment.
			</p>

			<div className="mb-8 flex items-center gap-2">
				{STEPS.map((label, i) => (
					<div key={label} className="flex items-center gap-2">
						<div
							className={`flex size-8 items-center justify-center rounded-full font-medium text-sm ${
								i < step
									? "bg-primary text-primary-foreground"
									: i === step
										? "border border-primary bg-primary/10 text-primary"
										: "bg-muted text-muted-foreground"
							}`}
						>
							{i < step ? <Check className="size-4" /> : i + 1}
						</div>
						<span
							className={`hidden text-sm sm:inline ${i === step ? "font-medium" : "text-muted-foreground"}`}
						>
							{label}
						</span>
						{i < STEPS.length - 1 && (
							<div className="hidden h-px w-8 bg-border sm:block" />
						)}
					</div>
				))}
			</div>

			<Card>
				<CardHeader>
					<CardTitle>{STEPS[step]}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{step === 0 && (
						<>
							<PlacePicker
								id="pickupAddress"
								label="Pickup location *"
								value={pickupLocation}
								onChange={(point) => {
									setPickupLocation(point);
									setPickupAddress(point?.displayName ?? "");
								}}
								placeholder="Search pickup address or place a pin"
								required
							/>
							<div className="grid gap-4 sm:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="pickupContactName">Contact name</Label>
									<Input
										id="pickupContactName"
										value={pickupContactName}
										onChange={(e) => setPickupContactName(e.target.value)}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="pickupContactPhone">Contact phone</Label>
									<Input
										id="pickupContactPhone"
										value={pickupContactPhone}
										onChange={(e) => setPickupContactPhone(e.target.value)}
									/>
								</div>
							</div>
							<div className="space-y-2">
								<Label htmlFor="pickupInstructions">Pickup instructions</Label>
								<Textarea
									id="pickupInstructions"
									value={pickupInstructions}
									onChange={(e) => setPickupInstructions(e.target.value)}
									placeholder="Gate code, loading dock, etc."
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="requestedPickupDate">
									Requested pickup date
								</Label>
								<Input
									id="requestedPickupDate"
									type="datetime-local"
									value={requestedPickupDate}
									onChange={(e) => setRequestedPickupDate(e.target.value)}
								/>
							</div>
						</>
					)}

					{step === 1 && (
						<>
							<PlacePicker
								id="destinationAddress"
								label="Destination location *"
								value={destinationLocation}
								onChange={(point) => {
									setDestinationLocation(point);
									setDestinationAddress(point?.displayName ?? "");
								}}
								placeholder="Search delivery address or place a pin"
								required
							/>
							<div className="grid gap-4 sm:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="destinationContactName">Contact name</Label>
									<Input
										id="destinationContactName"
										value={destinationContactName}
										onChange={(e) => setDestinationContactName(e.target.value)}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="destinationContactPhone">Contact phone</Label>
									<Input
										id="destinationContactPhone"
										value={destinationContactPhone}
										onChange={(e) => setDestinationContactPhone(e.target.value)}
									/>
								</div>
							</div>
							<div className="space-y-2">
								<Label htmlFor="destinationInstructions">
									Delivery instructions
								</Label>
								<Textarea
									id="destinationInstructions"
									value={destinationInstructions}
									onChange={(e) => setDestinationInstructions(e.target.value)}
								/>
							</div>
							<div className="grid gap-4 sm:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="requestedDeliveryDate">
										Requested delivery date
									</Label>
									<Input
										id="requestedDeliveryDate"
										type="datetime-local"
										value={requestedDeliveryDate}
										onChange={(e) => setRequestedDeliveryDate(e.target.value)}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="specialInstructions">
										Special instructions
									</Label>
									<Input
										id="specialInstructions"
										value={specialInstructions}
										onChange={(e) => setSpecialInstructions(e.target.value)}
										placeholder="Time window, access notes, etc."
									/>
								</div>
							</div>
						</>
					)}

					{step === 2 && (
						<>
							<div className="space-y-2">
								<Label>Cargo category *</Label>
								<Select
									value={cargo.category}
									onValueChange={(v) =>
										v && setCargo((c) => ({ ...c, category: v }))
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{supportedCargoCategories.map((c) => (
											<SelectItem key={c.value} value={c.value}>
												{c.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label htmlFor="cargoTitle">Cargo title *</Label>
								<Input
									id="cargoTitle"
									value={cargo.title}
									onChange={(e) =>
										setCargo((c) => ({ ...c, title: e.target.value }))
									}
									placeholder="e.g. Office furniture"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="cargoDescription">Description</Label>
								<Textarea
									id="cargoDescription"
									value={cargo.description}
									onChange={(e) =>
										setCargo((c) => ({ ...c, description: e.target.value }))
									}
								/>
							</div>
							<div className="grid gap-4 sm:grid-cols-3">
								<div className="space-y-2">
									<Label htmlFor="quantity">Quantity</Label>
									<Input
										id="quantity"
										type="number"
										min="0"
										value={cargo.quantity}
										onChange={(e) =>
											setCargo((c) => ({ ...c, quantity: e.target.value }))
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="unit">Unit</Label>
									<Input
										id="unit"
										value={cargo.unit}
										onChange={(e) =>
											setCargo((c) => ({ ...c, unit: e.target.value }))
										}
										placeholder="boxes, pallets"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="weightKg">Weight (kg)</Label>
									<Input
										id="weightKg"
										type="number"
										min="0"
										value={cargo.weightKg}
										onChange={(e) =>
											setCargo((c) => ({ ...c, weightKg: e.target.value }))
										}
									/>
								</div>
							</div>
							<div className="grid gap-4 sm:grid-cols-4">
								<div className="space-y-2">
									<Label htmlFor="lengthCm">Length (cm)</Label>
									<Input
										id="lengthCm"
										type="number"
										min="0"
										value={cargo.lengthCm}
										onChange={(e) =>
											setCargo((c) => ({ ...c, lengthCm: e.target.value }))
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="widthCm">Width (cm)</Label>
									<Input
										id="widthCm"
										type="number"
										min="0"
										value={cargo.widthCm}
										onChange={(e) =>
											setCargo((c) => ({ ...c, widthCm: e.target.value }))
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="heightCm">Height (cm)</Label>
									<Input
										id="heightCm"
										type="number"
										min="0"
										value={cargo.heightCm}
										onChange={(e) =>
											setCargo((c) => ({ ...c, heightCm: e.target.value }))
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="volumeM3">Volume (m3)</Label>
									<Input
										id="volumeM3"
										type="number"
										min="0"
										value={cargo.volumeM3}
										onChange={(e) =>
											setCargo((c) => ({ ...c, volumeM3: e.target.value }))
										}
									/>
								</div>
							</div>
							<div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,16rem)]">
								<div className="space-y-2">
									<Label htmlFor="declaredValue">Declared value *</Label>
									<Input
										id="declaredValue"
										type="number"
										min="1"
										value={cargo.declaredValue}
										onChange={(e) =>
											setCargo((c) => ({ ...c, declaredValue: e.target.value }))
										}
									/>
								</div>
								<div className="space-y-2">
									<CurrencySelect
										id="currency"
										value={cargo.currency}
										onChange={(currency) => {
											currencyTouchedRef.current = true;
											setCargo((current) => ({ ...current, currency }));
										}}
									/>
								</div>
							</div>
							<div className="space-y-2">
								<Label htmlFor="handlingInstructions">
									Handling instructions
								</Label>
								<Textarea
									id="handlingInstructions"
									value={cargo.handlingInstructions}
									onChange={(e) =>
										setCargo((c) => ({
											...c,
											handlingInstructions: e.target.value,
										}))
									}
								/>
							</div>
							<div className="grid gap-3 sm:grid-cols-2">
								{[
									{ key: "fragile" as const, label: "Fragile" },
									{ key: "hazardous" as const, label: "Hazardous" },
									{
										key: "requiresRefrigeration" as const,
										label: "Requires refrigeration",
									},
									{
										key: "requiresSpecialHandling" as const,
										label: "Special handling",
									},
								].map(({ key, label }) => (
									<div key={key} className="flex items-center gap-2 text-sm">
										<Checkbox
											id={key}
											checked={cargo[key]}
											onCheckedChange={(checked) =>
												setCargo((c) => ({ ...c, [key]: checked === true }))
											}
										/>
										<Label htmlFor={key} className="cursor-pointer">
											{label}
										</Label>
									</div>
								))}
							</div>
						</>
					)}

					{step === 3 && (
						<div className="space-y-4">
							<div className="space-y-2 rounded-lg bg-muted/50 p-4 text-sm">
								<div>
									<p className="font-medium text-muted-foreground">Pickup</p>
									<p>{pickupLocation?.displayName ?? pickupAddress}</p>
								</div>
								<div>
									<p className="font-medium text-muted-foreground">
										Destination
									</p>
									<p>
										{destinationLocation?.displayName ?? destinationAddress}
									</p>
								</div>
								{routeSnapshot && (
									<div>
										<p className="font-medium text-muted-foreground">Route</p>
										<p>
											{formatDistance(routeSnapshot.distanceMeters)} ·{" "}
											{formatEta(routeSnapshot.durationSeconds)}
										</p>
									</div>
								)}
								<div>
									<p className="font-medium text-muted-foreground">Cargo</p>
									<p>
										{cargo.title} · {formatCargoCategory(cargo.category)}
										{cargo.weightKg && ` · ${cargo.weightKg} kg`}
										{cargo.quantity &&
											` · ${cargo.quantity} ${cargo.unit || "units"}`}
									</p>
								</div>
							</div>

							<div className="flex items-center justify-between rounded-lg border p-4">
								<span className="font-medium">Estimated fare</span>
								<span className="font-bold text-lg">
									{formatCurrency(estimatedFare, cargo.currency)}
								</span>
							</div>
							<p className="text-muted-foreground text-xs">
								The carrier will confirm the final fare before this request
								becomes a shipment. Payment is simulated when the company
								accepts.
							</p>
						</div>
					)}

					<div className="flex justify-between pt-4">
						<Button
							variant="outline"
							disabled={step === 0 || loading}
							onClick={() => setStep((s) => s - 1)}
						>
							Previous
						</Button>
						{step < STEPS.length - 1 ? (
							<Button
								disabled={!canProceed()}
								onClick={() => setStep((s) => s + 1)}
							>
								Next <ArrowRight className="ml-1 size-4" />
							</Button>
						) : (
							<Button disabled={loading} onClick={handleSubmit}>
								{loading ? "Submitting..." : "Submit Booking"}
							</Button>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
