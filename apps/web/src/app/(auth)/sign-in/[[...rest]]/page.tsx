"use client";

import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { clerkAppearance } from "@/lib/clerk-appearance";
import { asRoute } from "@/lib/routes";

function SignInContent() {
	const searchParams = useSearchParams();
	const redirectUrl = searchParams.get("redirect_url") ?? "/dashboard";

	return (
		<div className="w-full max-w-md space-y-6">
			<div className="space-y-2 text-center">
				<h1 className="font-bold text-2xl">Welcome back</h1>
				<p className="text-muted-foreground text-sm">
					Sign in to track shipments and manage bookings
				</p>
			</div>
			<SignIn
				routing="path"
				path="/sign-in"
				signUpUrl="/sign-up"
				forceRedirectUrl={redirectUrl}
				appearance={clerkAppearance}
			/>
			<p className="text-center text-muted-foreground text-sm">
				Transport company?{" "}
				<Link
					href={asRoute("/sign-in?redirect_url=/company/onboarding")}
					className="font-medium text-foreground hover:underline"
				>
					Sign in to company portal
				</Link>
			</p>
		</div>
	);
}

export default function SignInPage() {
	return (
		<Suspense
			fallback={<div className="text-muted-foreground text-sm">Loading...</div>}
		>
			<SignInContent />
		</Suspense>
	);
}
