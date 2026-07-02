import "@logitrack/env/web";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const appDir = dirname(fileURLToPath(import.meta.url));
const monorepoRoot = join(appDir, "../..");

const nextConfig: NextConfig = {
	typedRoutes: true,
	reactCompiler: true,
	allowedDevOrigins: [
		"192.168.1.152",
		"100.114.223.34",
		"100.114.223.34:3001",
		"100.114.223.34:3773",
	],
	// Let Next.js auto-detect turbopack root via pnpm-lock.yaml at monorepo root.
	// A manual turbopack.root breaks HMR path normalization in dev.
	transpilePackages: ["@logitrack/ui", "@logitrack/backend", "@logitrack/env"],
	outputFileTracingRoot: monorepoRoot,
};

export default nextConfig;
