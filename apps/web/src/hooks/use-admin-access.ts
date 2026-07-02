"use client";

import { api } from "@logitrack/backend/convex/_generated/api";
import type { FunctionArgs, FunctionReference } from "convex/server";
import { useConvexAuth, useQuery } from "convex/react";

export function useAdminAccess() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  return useQuery(
    api.adminAccess.getAccessStatus,
    !isLoading && isAuthenticated ? {} : "skip",
  );
}

export function useIsAdmin() {
  const access = useAdminAccess();
  return access?.isAdmin ?? false;
}

/** Skips admin-only Convex queries until the user is approved — prevents runtime crashes. */
export function useAdminQuery<Query extends FunctionReference<"query">>(
  query: Query,
  args: FunctionArgs<Query>,
) {
  const access = useAdminAccess();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return useQuery(query, (access?.isAdmin ? args : "skip") as any);
}