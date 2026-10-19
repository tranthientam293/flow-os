# flowOS: Building an app

Apps are built inside the flowOS repository, one folder each in `src/apps/`. There is no separate publishing step: adding the folder ships the app. The registry finds every `src/apps/*/manifest.ts` at build time, the app appears in the App Store, and its code loads only the first time someone opens it.

Examples: [Ledger](Ledger) and [Roster](Roster).

## One folder per app

The folder name **is** the app id. It uses `a-z 0-9 -`, must be unique, and must never change once shipped: installs and stored data are keyed by it. The build fails if `manifest.id` doesn't match the folder name.

```
src/apps/time-tracker/
  manifest.ts           required: default-exports an AppManifest
  TimeTrackerApp.tsx    required: default-exports the app's root component
  components/           atoms/ molecules/ organisms/ pages/, each with an index.ts
  hooks/                useX.ts
  apis/                 queryOptions / mutationOptions for the app's tables
  models/               the app's database and API types
  constants/            query keys, limits, defaults
  utils/                pure helpers
  README.md             what the app does, rules, tables, storage keys, changelog
```

## The manifest

```ts
import { Timer } from "lucide-react";
import type { AppManifest } from "@/types";

export default {
  id: "time-tracker",
  name: "Time Tracker",
  tagline: "Track where your hours go",
  description: "Start and stop timers, tag entries, see weekly totals.",
  icon: Timer,
  category: "Productivity", // Productivity | Utilities | Developer
  version: "1.0.0",
  load: () => import("./TimeTrackerApp"),
  // Optional: one line for the app's Overview tile.
  getSummary: async (ctx) => (await import("./summary")).getSummary(ctx),
} satisfies AppManifest;
```

Bump `version` with every changelog entry; the App Store shows it.

## Boundaries

- An app may import from the platform: `@/components/atoms`, `@/components/molecules`, `@/libs`, `@/utils`, `@/types`, `@/constants`, and the SDK below.
- An app imports its own files relatively, and never imports another app.
- Platform code never imports an app; only `src/apps/registry.ts` reads manifests.

## Platform SDK

| API                                    | From                     | Gives                                                                                    |
| -------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------- |
| `useFlowApp()`                         | `@/context`              | `{ app, user, supabase }`; `supabase` is already signed in as the user                   |
| `useAppStorage(key, initial)`          | `@/hooks`                | Persistent per-user, per-app state, no migration needed                                  |
| `useBackToPlatform(note?)`             | `@/hooks`                | `{ backToPlatform, holder }`: confirm, then return to the Overview. Render `holder` once |
| `AppFooter`                            | `@/components/molecules` | The shared copyright line; put it last in the app's full-height column                   |
| `formatDate`, `fromNow`, `DATE_FORMAT` | `@/libs`, `@/constants`  | Dates as `YYYY/MM/DD`, relative times                                                    |

Apps open **full screen**, without the platform's top bar or sidebar, so every screen must offer a way back to the Overview, usually a **Back to flowOS** action built on `useBackToPlatform()`.

Moving to a new path scrolls the page back to the top automatically; changing only the query string keeps the scroll position.

## App data

| Need                     | Use                                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Settings and small state | `useAppStorage`                                                                                              |
| Many rows                | A dedicated table named `<app_id>_<thing>` (underscores), with RLS and a `user_id default auth.uid()` column |

Put migrations in `supabase/migrations/` named `<timestamp>_app_<app-id>_<change>.sql` and list the tables in the app's `README.md`. See [Deployment](flowOS-Deployment#database-migrations) for applying them.

## Removing an app

Delete its folder, write a migration that drops its tables and deletes its `installed_apps` and `app_storage` rows, then regenerate `src/models/database.ts`.
