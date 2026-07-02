"use client";

import { SignOutButton, UserProfile } from "@clerk/nextjs";
import { api } from "@logitrack/backend/convex/_generated/api";
import type { Id } from "@logitrack/backend/convex/_generated/dataModel";
import { Button } from "@logitrack/ui/components/button";
import { Input } from "@logitrack/ui/components/input";
import { Label } from "@logitrack/ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@logitrack/ui/components/select";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@logitrack/ui/components/tabs";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { MobileHeader } from "@/components/mobile/mobile-header";
import { WalletSettings } from "@/components/profile/wallet-settings";

function DriverInfoForm() {
	const data = useQuery(api.drivers.getCurrentDriver);
	const vehicles = useQuery(
		api.vehicles.listByCompany,
		data?.driver.companyId ? { companyId: data.driver.companyId } : "skip",
	);
	const updateDriver = useMutation(api.drivers.updateCurrentDriverInfo);
	const [saving, setSaving] = useState(false);
	const [form, setForm] = useState({
		vehicleId: "",
		phone: "",
		licenseNumber: "",
		vehicleType: "",
		vehicleClass: "",
		vehicleModel: "",
		vehiclePlate: "",
		vehicleCapacityKg: "",
	});

	useEffect(() => {
		if (!data) return;
		setForm({
			vehicleId: data.driver.vehicleId ?? "",
			phone: data.driver.phone ?? "",
			licenseNumber: data.driver.licenseNumber ?? "",
			vehicleType: data.driver.vehicleType ?? "",
			vehicleClass: data.driver.vehicleClass ?? "",
			vehicleModel: data.driver.vehicleModel ?? "",
			vehiclePlate: data.driver.vehiclePlate ?? "",
			vehicleCapacityKg:
				data.driver.vehicleCapacityKg != null
					? String(data.driver.vehicleCapacityKg)
					: "",
		});
	}, [data]);

	async function handleSave() {
		setSaving(true);
		try {
			await updateDriver({
				vehicleId: form.vehicleId
					? (form.vehicleId as Id<"vehicles">)
					: undefined,
				phone: form.phone || undefined,
				licenseNumber: form.licenseNumber || undefined,
				vehicleType: form.vehicleType || undefined,
				vehicleClass: form.vehicleClass || undefined,
				vehicleModel: form.vehicleModel || undefined,
				vehiclePlate: form.vehiclePlate || undefined,
				vehicleCapacityKg: form.vehicleCapacityKg
					? Number(form.vehicleCapacityKg)
					: undefined,
			});
			toast.success("Driver info saved");
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to save driver info",
			);
		} finally {
			setSaving(false);
		}
	}

	if (data === undefined) {
		return (
			<p className="text-muted-foreground text-sm">Loading driver info...</p>
		);
	}
	if (!data) return null;

	const selectedCompanyVehicle = Boolean(form.vehicleId);
	const activeVehicles = vehicles?.filter((v) => v.status === "active") ?? [];
	const compensationRate = data.driver.compensationRateBps ?? 6000;

	return (
		<div className="mt-4 rounded-3xl border bg-background p-4">
			<h2 className="mb-3 font-bold">Driver information</h2>
			<div className="space-y-3">
				<div className="rounded-2xl border bg-muted/40 p-3">
					<p className="text-muted-foreground text-xs">Compensation rule</p>
					<p className="font-medium">
						{(compensationRate / 100).toFixed(0)}% of transit fees
					</p>
				</div>
				<div className="space-y-2">
					<Label>Company vehicle (optional)</Label>
					<Select
						value={form.vehicleId || "manual"}
						onValueChange={(value) => {
							const selectedValue = value ?? "manual";
							const vehicle = activeVehicles.find(
								(v) => v._id === selectedValue,
							);
							setForm({
								...form,
								vehicleId: selectedValue === "manual" ? "" : selectedValue,
								vehicleType: vehicle?.vehicleType ?? form.vehicleType,
								vehicleClass: vehicle?.vehicleClass ?? form.vehicleClass,
								vehicleModel: vehicle?.vehicleModel ?? form.vehicleModel,
								vehiclePlate: vehicle?.immatriculation ?? form.vehiclePlate,
								vehicleCapacityKg:
									vehicle?.loadSupportKg != null
										? String(vehicle.loadSupportKg)
										: form.vehicleCapacityKg,
							});
						}}
					>
						<SelectTrigger>
							<SelectValue placeholder="Select a company vehicle" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="manual">Manual vehicle info</SelectItem>
							{activeVehicles.map((vehicle) => (
								<SelectItem key={vehicle._id} value={vehicle._id}>
									{vehicle.label} · {vehicle.immatriculation}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="grid gap-3 sm:grid-cols-2">
					<div className="space-y-2">
						<Label htmlFor="driver-phone">Phone</Label>
						<Input
							id="driver-phone"
							value={form.phone}
							onChange={(e) => setForm({ ...form, phone: e.target.value })}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="license">License number</Label>
						<Input
							id="license"
							value={form.licenseNumber}
							onChange={(e) =>
								setForm({ ...form, licenseNumber: e.target.value })
							}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="vehicle-type">Vehicle</Label>
						<Input
							id="vehicle-type"
							value={form.vehicleType}
							disabled={selectedCompanyVehicle}
							onChange={(e) =>
								setForm({ ...form, vehicleType: e.target.value })
							}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="vehicle-class">Vehicle class</Label>
						<Input
							id="vehicle-class"
							value={form.vehicleClass}
							disabled={selectedCompanyVehicle}
							onChange={(e) =>
								setForm({ ...form, vehicleClass: e.target.value })
							}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="model">Specific model</Label>
						<Input
							id="model"
							value={form.vehicleModel}
							disabled={selectedCompanyVehicle}
							onChange={(e) =>
								setForm({ ...form, vehicleModel: e.target.value })
							}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="plate">Immatriculation</Label>
						<Input
							id="plate"
							value={form.vehiclePlate}
							disabled={selectedCompanyVehicle}
							onChange={(e) =>
								setForm({ ...form, vehiclePlate: e.target.value })
							}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="capacity">Load support (kg)</Label>
						<Input
							id="capacity"
							type="number"
							min="0"
							value={form.vehicleCapacityKg}
							disabled={selectedCompanyVehicle}
							onChange={(e) =>
								setForm({ ...form, vehicleCapacityKg: e.target.value })
							}
						/>
					</div>
				</div>
				<Button disabled={saving} onClick={handleSave}>
					{saving ? "Saving..." : "Save driver info"}
				</Button>
			</div>
		</div>
	);
}

export default function DriverProfilePage() {
	return (
		<div>
			<MobileHeader subtitle="Driver profile" />

			<div className="mb-4">
				<h1 className="font-bold text-xl">Profile</h1>
				<p className="text-muted-foreground text-sm">
					Manage your account information and security settings.
				</p>
			</div>

			<Tabs defaultValue="profile">
				<TabsList>
					<TabsTrigger value="profile">Profile</TabsTrigger>
					<TabsTrigger value="wallet">Wallet</TabsTrigger>
				</TabsList>
				<TabsContent value="profile" className="mt-4">
					<div className="overflow-hidden rounded-3xl border bg-background">
						<UserProfile routing="hash" />
					</div>

					<div className="mt-4">
						<SignOutButton redirectUrl="/">
							<Button variant="destructive" className="w-full">
								Sign out
							</Button>
						</SignOutButton>
					</div>

					<DriverInfoForm />
				</TabsContent>
				<TabsContent value="wallet" className="mt-4">
					<WalletSettings
						ownerType="driver"
						balanceTitle="Driver Wallet"
						currencyTitle="Driver currency"
						currencyDescription="Used for your driver wallet balance and payouts."
					/>
				</TabsContent>
			</Tabs>
		</div>
	);
}
