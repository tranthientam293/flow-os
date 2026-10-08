# Apps

Each folder here is one flowOS app, developed in this repo. There is no separate publishing step: adding the folder is publishing it. The registry (`registry.ts`) finds every `*/manifest.ts` at build time. The app then shows up in the App Store, and its code only loads the first time someone opens it.

Apps only run inside flowOS. A user installs an app to their account from the App Store, then launches it from the sidebar or the Overview. The app runs as the signed-in flowOS user: there is no separate login, and every database call goes through the platform's Supabase session and RLS.

## One folder per app

Everything an app owns lives in its folder, so the app can be managed (reviewed, changed or removed) as a single unit. The folder name **is** the app id; the registry fails the build if `manifest.id` doesn't match the folder name.

```
src/apps/
  time-tracker/
    manifest.ts           ← required: default-exports an AppManifest
    TimeTrackerApp.tsx    ← required: default-exports the app's root component
    components/           ← app-private components, laid out like src/components:
      atoms/ molecules/ organisms/ pages/   (PascalCase .tsx + index.ts each)
    hooks/                ← app-private hooks (useX.ts)
    apis/                 ← queryOptions / mutationOptions for the app's own tables
    models/               ← the app's database/API types
    constants/            ← query keys, limits, defaults
    utils/                ← pure helpers
    README.md             ← what the app does, its tables and storage keys, changelog
```

Only `manifest.ts` and the root component are required; add the other folders when the app needs them. They follow the same naming and API conventions as the platform (see `docs/flowos-plan.md`).

```ts
// src/apps/time-tracker/manifest.ts
import { Timer } from "lucide-react";
import type { AppManifest } from "@/types";

export default {
  id: "time-tracker",
  name: "Time Tracker",
  tagline: "Track where your hours go",
  description: "Start and stop timers, tag entries, see weekly totals.",
  icon: Timer,
  category: "Productivity",
  version: "1.0.0",
  load: () => import("./TimeTrackerApp"),
} satisfies AppManifest;
```

The id uses `a-z 0-9 -`, must be unique, and must never change once shipped: installs and stored data are keyed by it.

## Boundaries

- An app may import from the platform: `@/components/atoms`, `@/components/molecules`, `@/libs`, `@/utils`, `@/types`, `@/constants`, `useFlowApp()` and `useAppStorage()`. Always import the folder (`@/types`), never a file inside it (`@/types/app`).
- An app imports its own files with relative paths, never from another app's folder. As in `src/components`, components come through their level's barrel (`./components/organisms`, or `../atoms` from another level), and a file imports a sibling in the same level directly (`./EntryList`).
- Platform code never imports from an app folder; only `registry.ts` touches apps, through their manifests.

## Platform SDK

- `useFlowApp()` from `@/context`: `{ app, user, supabase }`. `supabase` is already signed in as the current user.
- `useAppStorage(key, initial)` from `@/hooks`: persistent per-user state for this app, with no migration needed.
- **Dates:** show them as `YYYY/MM/DD` everywhere: `formatDate()` from `@/libs`, or `DATE_FORMAT` / `DAY_FORMAT` (`ddd, YYYY/MM/DD`) from `@/constants` with dayjs. Relative times use `fromNow()`.
- **A way back to flowOS (required):** apps open full screen with no platform top bar or sidebar, so every screen must offer a way back to the Overview, e.g. a "Back to flowOS" action that asks for confirmation and then navigates to `ROUTES.HOME` (from `@/constants`). Roster’s `hooks/useBackToPlatform.ts` is an example.

## App data

- Small state and settings: `useAppStorage`.
- Many rows: a dedicated table. Name it `<app_id_with_underscores>_<thing>` (e.g. `time_tracker_entries`), with RLS and a `user_id default auth.uid()` column. Put the migration in `supabase/migrations/` named `<timestamp>_app_<app-id>_<change>.sql`, and list the table in the app's `README.md`.

## Removing an app

Delete its folder, write a migration that drops its tables and deletes its `installed_apps` and `app_storage` rows, then regenerate `src/models/database.ts`.
