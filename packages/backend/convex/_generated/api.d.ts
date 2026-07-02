/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as adminAccess from "../adminAccess.js";
import type * as bookings from "../bookings.js";
import type * as companies from "../companies.js";
import type * as drivers from "../drivers.js";
import type * as healthCheck from "../healthCheck.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_geo from "../lib/geo.js";
import type * as lib_helpers from "../lib/helpers.js";
import type * as lib_invites from "../lib/invites.js";
import type * as lib_statusTransitions from "../lib/statusTransitions.js";
import type * as lib_validators from "../lib/validators.js";
import type * as notifications from "../notifications.js";
import type * as privateData from "../privateData.js";
import type * as proofs from "../proofs.js";
import type * as reviews from "../reviews.js";
import type * as seed from "../seed.js";
import type * as shipments from "../shipments.js";
import type * as support from "../support.js";
import type * as trackingEvents from "../trackingEvents.js";
import type * as trackingLocations from "../trackingLocations.js";
import type * as users from "../users.js";
import type * as vehicles from "../vehicles.js";
import type * as wallets from "../wallets.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  adminAccess: typeof adminAccess;
  bookings: typeof bookings;
  companies: typeof companies;
  drivers: typeof drivers;
  healthCheck: typeof healthCheck;
  "lib/auth": typeof lib_auth;
  "lib/geo": typeof lib_geo;
  "lib/helpers": typeof lib_helpers;
  "lib/invites": typeof lib_invites;
  "lib/statusTransitions": typeof lib_statusTransitions;
  "lib/validators": typeof lib_validators;
  notifications: typeof notifications;
  privateData: typeof privateData;
  proofs: typeof proofs;
  reviews: typeof reviews;
  seed: typeof seed;
  shipments: typeof shipments;
  support: typeof support;
  trackingEvents: typeof trackingEvents;
  trackingLocations: typeof trackingLocations;
  users: typeof users;
  vehicles: typeof vehicles;
  wallets: typeof wallets;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
