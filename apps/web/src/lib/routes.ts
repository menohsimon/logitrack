import type { Route } from "next";

export function asRoute(href: string): Route {
  return href as Route;
}