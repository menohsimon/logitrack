"use client";

import { SignOutButton } from "@clerk/nextjs";
import { api } from "@logitrack/backend/convex/_generated/api";
import type { Id } from "@logitrack/backend/convex/_generated/dataModel";
import { Button } from "@logitrack/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@logitrack/ui/components/card";
import { Input } from "@logitrack/ui/components/input";
import { Label } from "@logitrack/ui/components/label";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@logitrack/ui/components/tabs";
import { Textarea } from "@logitrack/ui/components/textarea";
import { useMutation } from "convex/react";
import { LocateFixed } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { CompanySetup } from "@/components/company/company-setup";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { TagSelector } from "@/components/form/tag-selector";
import { PlacePicker } from "@/components/maps/place-picker";
import { WalletSettings } from "@/components/profile/wallet-settings";
import { CARGO_CATEGORIES } from "@/lib/estimate-fare";
import { makeGeoPoint } from "@/lib/maps/geo";
import type { GeoPointInput } from "@/lib/maps/types";
import { CAMEROON_TOWNS } from "@/lib/towns";

function ProfileForm({
	companyId,
	company,
}: {
	companyId: Id<"companies">;
	company: {
		name: string;
		legalName?: string;
		description?: string;
		contactEmail?: string;
		phone?: string;
		address?: string;
		location?: GeoPointInput;
		operatingRegions: string[];
		serviceCategories: string[];
		cargoCategories: string[];
	};
}) {
	const updateProfile = useMutation(api.companies.updateProfile);
	const updateLocation = useMutation(api.companies.updateLocation);
	const [saving, setSaving] = useState(false);
	const [savingLocation, setSavingLocation] = useState(false);

	const [name, setName] = useState(company.name);
	const [legalName, setLegalName] = useState(company.legalName ?? "");
	const [description, setDescription] = useState(company.description ?? "");
	const [contactEmail, setContactEmail] = useState(company.contactEmail ?? "");
	const [phone, setPhone] = useState(company.phone ?? "");
	const [address, setAddress] = useState(company.address ?? "");
	const [location, setLocation] = useState<GeoPointInput | null>(
		company.location ?? null,
	);
	const [operatingRegions, setOperatingRegions] = useState<string[]>(
		company.operatingRegions,
	);
	const [serviceCategories, setServiceCategories] = useState(
		company.serviceCategories.join(", "),
	);
	const [cargoCategories, setCargoCategories] = useState<string[]>(
		company.cargoCategories,
	);

	useEffect(() => {
		setName(company.name);
		setLegalName(company.legalName ?? "");
		setDescription(company.description ?? "");
		setContactEmail(company.contactEmail ?? "");
		setPhone(company.phone ?? "");
		setAddress(company.address ?? "");
		setLocation(company.location ?? null);
		setOperatingRegions(company.operatingRegions);
		setServiceCategories(company.serviceCategories.join(", "));
		setCargoCategories(company.cargoCategories);
	}, [company]);

	function parseList(value: string) {
		return value
			.split(",")
			.map((s) => s.trim())
			.filter(Boolean);
	}

	function toggleCargoCategory(value: string) {
		setCargoCategories((prev) =>
			prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value],
		);
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setSaving(true);
		try {
			await updateProfile({
				companyId,
				name: name.trim(),
				legalName: legalName.trim() || undefined,
				description: description.trim() || undefined,
				contactEmail: contactEmail.trim() || undefined,
				phone: phone.trim() || undefined,
				address: address.trim() || undefined,
				operatingRegions,
				serviceCategories: parseList(serviceCategories),
				cargoCategories:
					cargoCategories as (typeof CARGO_CATEGORIES)[number]["value"][],
			});
			toast.success("Profile updated");
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to update profile",
			);
		} finally {
			setSaving(false);
		}
	}

	function handleUseCurrentLocation() {
		if (!navigator.geolocation) {
			toast.error("Geolocation is not available in this browser");
			return;
		}

		navigator.geolocation.getCurrentPosition(
			(position) => {
				const point = makeGeoPoint(
					{
						lat: position.coords.latitude,
						lng: position.coords.longitude,
						displayName: "Current browser location",
						accuracyMeters: position.coords.accuracy,
					},
					"gps",
				);
				setLocation(point);
				toast.success(
					`Location captured with ${Math.round(position.coords.accuracy)} m accuracy`,
				);
			},
			(error) => {
				toast.error(error.message || "Location permission was denied");
			},
			{ enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
		);
	}

	async function handleSaveLocation() {
		if (!location) {
			toast.error("Select or capture a company location");
			return;
		}
		setSavingLocation(true);
		try {
			await updateLocation({ companyId, location });
			toast.success("Company location saved");
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to save location",
			);
		} finally {
			setSavingLocation(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Company information</CardTitle>
					<CardDescription>
						This information is shown to customers browsing the marketplace.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="name">Display name</Label>
						<Input
							id="name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="legalName">Legal name</Label>
						<Input
							id="legalName"
							value={legalName}
							onChange={(e) => setLegalName(e.target.value)}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="description">Description</Label>
						<Textarea
							id="description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							rows={4}
						/>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Contact</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="contactEmail">Contact email</Label>
						<Input
							id="contactEmail"
							type="email"
							value={contactEmail}
							onChange={(e) => setContactEmail(e.target.value)}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="phone">Phone</Label>
						<Input
							id="phone"
							value={phone}
							onChange={(e) => setPhone(e.target.value)}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="address">Address</Label>
						<Input
							id="address"
							value={address}
							onChange={(e) => setAddress(e.target.value)}
						/>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Exact location</CardTitle>
					<CardDescription>
						Used for marketplace maps, dispatch context, and routing.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex flex-wrap gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={handleUseCurrentLocation}
						>
							<LocateFixed className="size-4" />
							Use current location
						</Button>
						{location?.accuracyMeters != null && (
							<p className="self-center text-muted-foreground text-xs">
								Accuracy: {Math.round(location.accuracyMeters)} m
							</p>
						)}
					</div>
					<PlacePicker
						id="companyLocation"
						label="Company location"
						value={location}
						onChange={setLocation}
						placeholder="Search office, depot, or place a pin"
					/>
					<Button
						type="button"
						disabled={savingLocation || !location}
						onClick={handleSaveLocation}
					>
						{savingLocation ? "Saving location..." : "Save location"}
					</Button>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Service areas & categories</CardTitle>
					<CardDescription>
						Add the towns where this company can pick up or deliver shipments.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<TagSelector
						id="regions"
						label="Operating towns"
						value={operatingRegions}
						onChange={setOperatingRegions}
						options={CAMEROON_TOWNS}
						placeholder="Search or add a town"
						emptyText="No towns found"
					/>
					<div className="space-y-2">
						<Label htmlFor="services">Service categories</Label>
						<Input
							id="services"
							placeholder="e.g. Last-mile, Freight, Cold chain"
							value={serviceCategories}
							onChange={(e) => setServiceCategories(e.target.value)}
						/>
						<p className="text-muted-foreground text-xs">
							Comma-separated list
						</p>
					</div>
					<div className="space-y-2">
						<Label>Cargo categories</Label>
						<div className="flex flex-wrap gap-2">
							{CARGO_CATEGORIES.map((cat) => (
								<Button
									key={cat.value}
									type="button"
									size="sm"
									variant={
										cargoCategories.includes(cat.value) ? "default" : "outline"
									}
									onClick={() => toggleCargoCategory(cat.value)}
								>
									{cat.label}
								</Button>
							))}
						</div>
					</div>
				</CardContent>
			</Card>

			<Button type="submit" disabled={saving}>
				{saving ? "Saving..." : "Save profile"}
			</Button>

			<SignOutButton redirectUrl="/">
				<Button type="button" variant="destructive">
					Sign out
				</Button>
			</SignOutButton>
		</form>
	);
}

export default function CompanyProfilePage() {
	return (
		<DashboardShell variant="company" title="Company Profile">
			<CompanySetup>
				{({ companyId, company }) => (
					<Tabs defaultValue="profile" className="mx-auto max-w-2xl">
						<TabsList>
							<TabsTrigger value="profile">Profile</TabsTrigger>
							<TabsTrigger value="wallet">Wallet</TabsTrigger>
						</TabsList>
						<TabsContent value="profile" className="mt-4">
							<ProfileForm companyId={companyId} company={company} />
						</TabsContent>
						<TabsContent value="wallet" className="mt-4">
							<WalletSettings
								ownerType="company"
								companyId={companyId}
								balanceTitle="Company Wallet"
								currencyTitle="Company currency"
								currencyDescription="Used for this company's wallet balance and payouts."
							/>
						</TabsContent>
					</Tabs>
				)}
			</CompanySetup>
		</DashboardShell>
	);
}
