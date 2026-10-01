import { lazy } from "react";
import { APP_ID_PATTERN } from "@/constants";
import type { AppManifest, RegisteredApp } from "@/types";

const modules = import.meta.glob<AppManifest>("./*/manifest.ts", {
  eager: true,
  import: "default",
});

const apps: RegisteredApp[] = [];
const byId = new Map<string, RegisteredApp>();

for (const [path, manifest] of Object.entries(modules)) {
  if (!APP_ID_PATTERN.test(manifest.id))
    throw new Error(`Invalid app id "${manifest.id}" in ${path}`);
  const folder = path.split("/")[1];
  if (folder !== manifest.id)
    throw new Error(
      `App id "${manifest.id}" must match its folder name "${folder}" in ${path}`,
    );
  if (byId.has(manifest.id))
    throw new Error(`Duplicate app id "${manifest.id}" in ${path}`);
  const app: RegisteredApp = { ...manifest, Component: lazy(manifest.load) };
  apps.push(app);
  byId.set(app.id, app);
}

apps.sort((a, b) => a.name.localeCompare(b.name));

export const appRegistry: readonly RegisteredApp[] = apps;

export function getApp(id: string | undefined): RegisteredApp | undefined {
  return id ? byId.get(id) : undefined;
}
