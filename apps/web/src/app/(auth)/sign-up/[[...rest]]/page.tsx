"use client";

import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { clerkAppearance } from "@/lib/clerk-appearance";
import { asRoute } from "@/lib/routes";

function SignUpContent() {
	const searchParams = useSearchParams();
	const redirectUrl = searchParams.get("redirect_url") ?? "/dashboard";

	return (
		<div className="w-full max-w-md space-y-6">
			<div className="space-y-2 text-center">
				<h1 className="font-bold text-2xl">Create your account</h1>
				<p className="text-muted-foreground text-sm">
					Join LogiTrack to book and track shipments
				</p>
			</div>
			<SignUp
				routing="path"
				path="/sign-up"
				signInUrl="/sign-in"
				forceRedirectUrl={redirectUrl}
				appearance={clerkAppearance}
			/>
			<p className="text-center text-muted-foreground text-sm">
				Registering a transport company?{" "}
				<Link
					href={asRoute("/sign-up?redirect_url=/company/onboarding")}
					className="font-medium text-foreground hover:underline"
				>
					Sign up as a company
				</Link>
			</p>
		</div>
	);
}

export default function SignUpPage() {
	return (
		<Suspense
			fallback={<div className="text-muted-foreground text-sm">Loading...</div>}
		>
			<SignUpContent />
		</Suspense>
	);
}
