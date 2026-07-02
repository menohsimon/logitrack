"use client";

import { useAuth } from "@clerk/nextjs";
import { env } from "@logitrack/env/web";
import { Toaster } from "@logitrack/ui/components/sonner";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";

import { ThemeProvider } from "./theme-provider";

const convexUrl = env.NEXT_PUBLIC_CONVEX_URL.replace(/\/+$/, "");
const convex = new ConvexReactClient(convexUrl);

export default function Providers({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="system"
			enableSystem
			disableTransitionOnChange
		>
			<ConvexProviderWithClerk client={convex} useAuth={useAuth}>
				{children}
			</ConvexProviderWithClerk>
			<Toaster richColors />
		</ThemeProvider>
	);
}
