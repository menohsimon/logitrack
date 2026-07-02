"use client";

import { api } from "@logitrack/backend/convex/_generated/api";
import type { Id } from "@logitrack/backend/convex/_generated/dataModel";
import { Button } from "@logitrack/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@logitrack/ui/components/card";
import { Input } from "@logitrack/ui/components/input";
import { Label } from "@logitrack/ui/components/label";
import { Textarea } from "@logitrack/ui/components/textarea";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { CompanySetup } from "@/components/company/company-setup";
import { StatusBadge } from "@/components/company/status-badge";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

function VehiclesContent({ companyId }: { companyId: Id<"companies"> }) {
	const vehicles = useQuery(api.vehicles.listByCompany, { companyId });
	const createVehicle = useMutation(api.vehicles.create);
	const [saving, setSaving] = useState(false);
	const [form, setForm] = useState({
		label: "",
		vehicleType: "",
		vehicleClass: "",
		vehicleModel: "",
		immatriculation: "",
		loadSupportKg: "",
		notes: "",
	});

	async function handleCreate() {
		setSaving(true);
		try {
			await createVehicle({
				companyId,
				label: form.label,
				vehicleType: form.vehicleType,
				vehicleClass: form.vehicleClass || undefined,
				vehicleModel: form.vehicleModel || undefined,
				immatriculation: form.immatriculation,
				loadSupportKg: form.loadSupportKg
					? Number(form.loadSupportKg)
					: undefined,
				notes: form.notes || undefined,
			});
			toast.success("Vehicle registered");
			setForm({
				label: "",
				vehicleType: "",
				vehicleClass: "",
				vehicleModel: "",
				immatriculation: "",
				loadSupportKg: "",
				notes: "",
			});
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to register vehicle",
			);
		} finally {
			setSaving(false);
		}
	}

	return (
		<div className="grid gap-6 lg:grid-cols-[360px_1fr]">
			<Card>
				<CardHeader>
					<CardTitle>Register vehicle</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<div className="space-y-2">
						<Label htmlFor="label">Vehicle name</Label>
						<Input
							id="label"
							value={form.label}
							onChange={(e) => setForm({ ...form, label: e.target.value })}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="type">Vehicle type</Label>
						<Input
							id="type"
							value={form.vehicleType}
							onChange={(e) =>
								setForm({ ...form, vehicleType: e.target.value })
							}
						/>
					</div>
					<div className="grid gap-3 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="class">Class</Label>
							<Input
								id="class"
								value={form.vehicleClass}
								onChange={(e) =>
									setForm({ ...form, vehicleClass: e.target.value })
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="model">Model</Label>
							<Input
								id="model"
								value={form.vehicleModel}
								onChange={(e) =>
									setForm({ ...form, vehicleModel: e.target.value })
								}
							/>
						</div>
					</div>
					<div className="grid gap-3 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="plate">Immatriculation</Label>
							<Input
								id="plate"
								value={form.immatriculation}
								onChange={(e) =>
									setForm({ ...form, immatriculation: e.target.value })
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="load">Load support (kg)</Label>
							<Input
								id="load"
								type="number"
								min="0"
								value={form.loadSupportKg}
								onChange={(e) =>
									setForm({ ...form, loadSupportKg: e.target.value })
								}
							/>
						</div>
					</div>
					<div className="space-y-2">
						<Label htmlFor="notes">Notes</Label>
						<Textarea
							id="notes"
							value={form.notes}
							onChange={(e) => setForm({ ...form, notes: e.target.value })}
							rows={2}
						/>
					</div>
					<Button disabled={saving} onClick={handleCreate}>
						{saving ? "Saving..." : "Register vehicle"}
					</Button>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Fleet</CardTitle>
				</CardHeader>
				<CardContent>
					{vehicles === undefined ? (
						<p className="text-muted-foreground text-sm">Loading...</p>
					) : vehicles.length === 0 ? (
						<p className="text-muted-foreground text-sm">
							No vehicles registered yet
						</p>
					) : (
						<div className="grid gap-3 md:grid-cols-2">
							{vehicles.map((vehicle) => (
								<div key={vehicle._id} className="rounded-2xl border p-4">
									<div className="mb-2 flex items-center justify-between gap-2">
										<p className="font-medium">{vehicle.label}</p>
										<StatusBadge status={vehicle.status} />
									</div>
									<div className="space-y-1 text-muted-foreground text-sm">
										<p>{vehicle.vehicleType}</p>
										{vehicle.vehicleClass && <p>{vehicle.vehicleClass}</p>}
										{vehicle.vehicleModel && <p>{vehicle.vehicleModel}</p>}
										<p>{vehicle.immatriculation}</p>
										{vehicle.loadSupportKg != null && (
											<p>{vehicle.loadSupportKg} kg load support</p>
										)}
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

export default function CompanyVehiclesPage() {
	return (
		<DashboardShell variant="company" title="Vehicles">
			<CompanySetup>
				{({ companyId }) => <VehiclesContent companyId={companyId} />}
			</CompanySetup>
		</DashboardShell>
	);
}
