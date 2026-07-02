"use client";

import { SignOutButton, useUser } from "@clerk/nextjs";
import { api } from "@logitrack/backend/convex/_generated/api";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@logitrack/ui/components/avatar";
import { Button } from "@logitrack/ui/components/button";
import { Input } from "@logitrack/ui/components/input";
import { Label } from "@logitrack/ui/components/label";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { MobileHeader } from "@/components/mobile/mobile-header";
import { WalletSettings } from "@/components/profile/wallet-settings";

export default function ProfilePage() {
	const { user: clerkUser } = useUser();
	const convexUser = useQuery(api.users.getCurrentUser);
	const updateProfile = useMutation(api.users.updateProfile);

	const [name, setName] = useState("");
	const [phone, setPhone] = useState("");
	const [address, setAddress] = useState("");
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (convexUser) {
			setName(convexUser.name);
			setPhone(convexUser.phone ?? "");
			setAddress(convexUser.address ?? "");
		}
	}, [convexUser]);

	async function handleSave(e: React.FormEvent) {
		e.preventDefault();
		if (!name.trim()) {
			toast.error("Name is required");
			return;
		}

		setSaving(true);
		try {
			await updateProfile({
				name: name.trim(),
				phone: phone.trim() || undefined,
				address: address.trim() || undefined,
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

	const displayName = convexUser?.name ?? clerkUser?.firstName ?? "User";
	const email =
		convexUser?.email ?? clerkUser?.primaryEmailAddress?.emailAddress ?? "";

	return (
		<div>
			<MobileHeader subtitle="Account settings" />

			<div className="mb-8 flex flex-col items-center">
				<Avatar className="mb-3 size-20">
					<AvatarImage src={convexUser?.avatarUrl ?? clerkUser?.imageUrl} />
					<AvatarFallback className="text-2xl">
						{displayName.charAt(0)}
					</AvatarFallback>
				</Avatar>
				<p className="font-bold text-lg">{displayName}</p>
				<p className="text-muted-foreground text-sm">{email}</p>
			</div>

			<div className="space-y-4">
				<form onSubmit={handleSave} className="space-y-4">
					<div className="space-y-4 rounded-3xl border bg-background p-4">
						<h2 className="font-bold">Edit Profile</h2>

						<div className="space-y-2">
							<Label htmlFor="profile-name">Full name</Label>
							<Input
								id="profile-name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Your name"
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="profile-phone">Phone</Label>
							<Input
								id="profile-phone"
								type="tel"
								value={phone}
								onChange={(e) => setPhone(e.target.value)}
								placeholder="+1 (555) 000-0000"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="profile-address">Address</Label>
							<Input
								id="profile-address"
								value={address}
								onChange={(e) => setAddress(e.target.value)}
								placeholder="Your default address"
							/>
						</div>
					</div>

					<Button
						type="submit"
						className="w-full rounded-full"
						disabled={saving}
					>
						{saving ? "Saving..." : "Save Changes"}
					</Button>
				</form>

				<WalletSettings
					balanceTitle="User Wallet"
					currencyTitle="Wallet currency"
					currencyDescription="Used for your wallet balance and new booking forms."
				/>

				<SignOutButton redirectUrl="/">
					<Button variant="destructive" className="w-full rounded-full">
						Sign out
					</Button>
				</SignOutButton>
			</div>
		</div>
	);
}
