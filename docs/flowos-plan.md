# flowOS — Build Plan

flowOS is a personal platform that hosts small utility apps (time tracker, calculator, …), like a mini Steam for one publisher. Apps are developed **inside this repo**, one self-contained folder per app in `src/apps/`; there is no separate publishing step. Users install apps to their account and launch them only from flowOS, where they run as the signed-in user (no separate login). The UI follows the Supabase dashboard (`docs/refs/img/ui-reference.png`).

**Stack:** React 19 · React Router 8 · Ant Design v6 · Tailwind CSS v4 + plain CSS (no SCSS) · zustand · TanStack React Query · dayjs · i18next (en/vi) · Vite 8 · TypeScript 7 · oxlint · Prettier · Supabase (Auth, Postgres, RLS)

**Supabase projects** (both Free plan, ap-south-1; branching needs Pro, so environments are separate projects):

| Environment | Project        | Ref                    | Used by                                                              | Auth URLs                                                                |
| ----------- | -------------- | ---------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Development | `flow-os-app`  | `cxgliajkslpakdfwzuxf` | `npm run dev` via `.env.local`                                       | Site URL `http://localhost:3000`                                         |
| Production  | `flow-os-prod` | `xxzybkxzpzlhubdthsdt` | Vercel (`https://flow-os-project.vercel.app`) via the GitHub secrets | Site URL and the only redirect URL: `https://flow-os-project.vercel.app` |

Check items off as they're done. Phases 1 and 1.5 are complete; later phases are proposals and can be reordered.

---

## Architecture at a glance

| Folder                      | Holds                                                                                                                                                                        |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/atoms/`     | tiny custom pieces antd doesn't cover (logo, badge, spinner, app-icon); use antd components directly for everything else                                                     |
| `src/components/molecules/` | Small compositions: stat tile, empty state, form field, sidebar link, settings panel                                                                                         |
| `src/components/organisms/` | Feature blocks: top bar, sidebar, mobile nav, user menu , auth form, store card, app host                                                                                    |
| `src/components/pages/`     | One component per route                                                                                                                                                      |
| `src/layouts/`              | `AppLayout` (signed-in shell) and `AuthLayout` (split screen)                                                                                                                |
| `src/router/`               | `createBrowserRouter` config + `ProtectedRoute` / `GuestRoute` guards                                                                                                        |
| `src/context/`              | `AuthContext` (session), `FlowAppContext` (app SDK)                                                                                                                          |
| `src/providers/`            | `AppProviders`: composes i18n, React Query, auth, tooltips and the toaster around the router                                                                                 |
| `src/stores/`               | zustand: `theme-store` (persisted preference), `ui-store` (sidebar, drawer)                                                                                                  |
| `src/apis/`                 | One file per domain exporting `queryOptions` / `mutationOptions` factories (`profileQueryOptions(userId)`, `installAppMutationOptions(userId)`, …) that call `libs/supabase` |
| `src/hooks/`                | Hooks that add logic on top of the API (`useInstalledApps` joins with the registry, `useHealth`, `useAppStorage`) and UI hooks                                               |
| `src/models/`               | API/database types: generated `database.ts`, `Profile`, `InstalledApp`, auth payloads                                                                                        |
| `src/types/`                | UI-only types: `AppManifest`, theme, navigation, health                                                                                                                      |
| `src/constants/`            | `ENV` (validated env vars), routes, query keys, storage keys, navigation, app settings                                                                                       |
| `src/libs/`                 | Configured third-party clients: `supabase`, `queryClient`, `dayjs`, `i18n`                                                                                                   |
| `src/locales/`              | Translation dictionaries: `en.ts` (source of truth, `as const`) and `vi.ts` (typed against it)                                                                               |
| `src/utils/`                | Pure helpers: `cn`, errors, health, language, user display names; never import `@/libs`                                                                                      |
| `src/apps/`                 | One self-contained folder per app (folder name = app id) with `manifest.ts`; `registry.ts` discovers them (empty)                                                            |
| `src/styles/`               | `tokens.css` (CSS variables, Supabase palette; mirrored for antd in `libs/antd-theme.ts`) + `index.css` (Tailwind theme, utilities)                                          |
| `supabase/migrations/`      | Schema, RLS policies, triggers                                                                                                                                               |

**Data flow:** component → `useQuery(xQueryOptions(...))` / `useMutation(xMutationOptions(...))` from `src/apis` → `libs/supabase`. Cache updates (including optimistic ones) live in the mutation options. Toasts come from `meta: { successMessage, errorMessage }` and are shown globally by the `MutationCache` in `libs/query-client.ts`. Server state lives in React Query, global client state in zustand, and the auth session in context.

**App contract:** an app is a folder `src/apps/<app-id>/` holding everything it owns: `manifest.ts` (id, name, icon, category, version, `load()`, optional `getSummary()`), its root component and optional `components/`, `hooks/`, `apis/`, `models/`, `constants/`, `utils/` and a `README.md`. The folder name must equal `manifest.id` (the registry fails the build otherwise). An app talks to the platform only through `useFlowApp()` (user + signed-in Supabase client) and `useAppStorage()`, never imports another app, and platform code never imports an app. See `src/apps/README.md`.

---

## Phase 1 — Foundation ✅ (Sep 30, 2026)

### Project setup

- [x] Vite + React + TypeScript project, `@/` path alias
- [x] Tailwind v4 + plain CSS; design tokens as CSS variables mapped to Tailwind utilities (SCSS removed Sep 30)
- [x] Supabase client with generated database types
- [x] `.env.local` / `.env.example`, `.gitignore`, README
- [x] Dev server on port **3000**, set by `VITE_APP_PORT` in `.env.local` (read in `vite.config.ts` via `loadEnv`, falls back to 5173; `strictPort`). Exposed on the LAN (`server.host: true`) for testing on phones and tablets. Needs a Windows Firewall rule for inbound TCP 3000 when the network is Public

### Database

- [x] `profiles`, created by a trigger on sign-up
- [x] `installed_apps` (new users now start empty; starter-app seeding removed Sep 30)
- [x] `app_storage`: per-user, per-app key/value store
- [x] RLS on every table, scoped to `auth.uid()`, plus explicit grants
- [x] Security advisor: no findings

### Shell & pages

- [x] Top bar: breadcrumbs, version badge, account menu (search button and theme toggle removed Oct 1, 2026)
- [x] Collapsible sidebar; drawer on mobile
- [x] ~~Ctrl+K command palette~~: removed Oct 1, 2026 with the top-bar search (`cmdk`, the `Command` atom and `useModHotkey` deleted). The App Store keeps its own search box
- [x] Overview: status tiles, member since, app summaries, dotted "core" panel
- [x] App Store: search, category tabs, install / uninstall, empty state when no apps exist
- [x] Settings: display name, theme
- [x] Sign in / sign up, including the "check your inbox" state, with a language picker next to the logo (theme toggle removed Oct 1, 2026; theme is changed in Settings)
- [x] i18n (Sep 30, 2026; updated Oct 1, 2026): English + Vietnamese via `i18next` / `react-i18next`. The language (`en` | `vi`) is kept in a persisted zustand store and defaults to **English**; there is no "System" option and no browser/OS detection. Older saved "system" preferences are migrated to English. Switchers on the auth screen and Settings (not in the account menu, which only has Account settings and Log out). dayjs relative dates and `<html lang>` follow the language
- [x] Responsive: mobile-first padding and type, `100dvh`, larger touch targets on coarse pointers, 16px inputs on phones, no hover-only controls

### App platform

- [x] Manifest type + automatic discovery via `import.meta.glob`; the build fails if an app id doesn't match its folder name (Oct 1, 2026)
- [x] Lazy loading per app (separate chunks)
- [x] Error boundary per app
- [x] SDK: `useFlowApp()`, `useAppStorage()`

### Starter apps (removed Sep 30, 2026)

- [x] ~~Tasks~~, ~~Notes~~, ~~Focus Timer~~: removed from the codebase to start the app catalogue fresh

## Phase 1.5 — Restructure ✅ (Sep 30, 2026)

- [x] New folder structure (see Architecture): components / constants / context / libs / utils / router / models / types / layouts, plus hooks / services / stores / apps (services later replaced by `api/`)
- [x] Atomic design: atoms → molecules → organisms → pages; layouts act as templates
- [x] shadcn/ui (new-york, Radix) installed into `components/atoms`; restyled to the Supabase look (bordered green primary, 26px `xs` buttons, mono status badges)
- [x] Tokens renamed to shadcn conventions (`primary`, `muted-foreground`, `destructive`, …) with Supabase extras (`brand`, `surface-muted`, `border-strong`, `foreground-light`, `warning`)
- [x] zustand for theme + shell UI state (persisted: theme preference, sidebar collapsed)
- [x] React Query for all server state (profile, installed apps, app storage, health), with optimistic uninstall
- [x] axios removed (Oct 1, 2026): all data access, including Edge Functions (`supabase.functions.invoke`), goes through the Supabase client
- [x] dayjs (relativeTime, localizedFormat) configured in `libs/dayjs.ts`, with the `fromNow` / `formatDate` helpers (moved from `utils/date.ts` on Oct 1, 2026)
- [x] Toast notifications (antd `notification`, via `libs/notification.ts`) for install, uninstall, profile save and sign-out errors
- [x] Migrated from shadcn/ui (Radix, sonner, cva, tw-animate-css) to Ant Design v6 (Oct 5, 2026). Antd styles live in `@layer antd`, ordered before Tailwind `utilities`, so `className` overrides antd; theme tokens in `libs/antd-theme.ts`
- [x] Naming convention applied (Sep 30, 2026): 64 files renamed and imports rewritten; `*.tsx` → PascalCase, hooks → camelCase, other `.ts` → kebab-case
- [x] API layer (Sep 30, 2026): `src/services/` replaced by `src/apis/` (`auth`, `profile`, `installed-apps`, `app-storage`, `health`) exporting `queryOptions` / `mutationOptions`. Thin wrapper hooks (`useProfile`, `useInstallApp`, `useUninstallApp`) removed; toasts moved to mutation `meta` + a global `MutationCache`
- [x] Existing code comments removed (Sep 30, 2026) from `src/`, configs, `index.html`, `.prettierignore` and the SQL migrations; only the `/// <reference types="vite/client" />` directive remains. Docs (Markdown) keep their example snippets as-is
- [ ] **Decide:** drop the old `tasks` and `notes` tables and their data (1 task, 2 notes), and remove the 3 `installed_apps` rows pointing at the removed apps

---

## Phase 2 — Verify & harden

- [ ] Sign up end to end: profile created, empty workspace, email confirmation flow
- [ ] Email confirmation **off** during development. Decided Sep 30, 2026; switch it in Dashboard → Authentication → Providers → Email → "Confirm email"
- [ ] Set Site URL and redirect URLs in Supabase Auth (Dashboard → Authentication → URL Configuration): dev `http://localhost:3000`; prod `https://flow-os-project.vercel.app` with `https://flow-os-project.vercel.app/**` as the only redirect URL
- [ ] Walk every page in light and dark mode at phone, tablet and desktop widths on real devices
- [ ] Keyboard pass: tab order, focus rings, Escape closes menus and dialogs
- [ ] `git init`, first commit, push to GitHub
- [x] Lint + format (Sep 30, 2026): oxlint (`.oxlintrc.json`) + Prettier with the Tailwind class-sorting plugin (`.prettierrc.json`), `.editorconfig`, VS Code settings/extensions. `npm run check` = typecheck + lint + format check. First run fixed real issues (setState-in-effect, ref write during render, missing `override`, radio a11y, hook deps)
- [x] TypeScript import safety: `forceConsistentCasingInFileNames`, `noUncheckedSideEffectImports`, `isolatedModules`, `verbatimModuleSyntax`, `noImplicitOverride`. Unused locals/params moved from `tsc` to oxlint so the `_` prefix is honoured
- [x] Run `npm run check` in CI: the Vercel deploy workflow runs it before every production build (Oct 1, 2026). Optional: a pre-commit hook
- [ ] Add Vitest + React Testing Library; test the registry, `useAppStorage` and the install flow
- [ ] Code-split: lazy route components + vendor chunk (main bundle is ~1.2 MB with antd and React Query; cmdk removed Oct 1, 2026)
- [ ] Use antd `Form` once forms grow beyond a couple of fields

## Phase 3 — Platform features

- [ ] Drag to reorder apps in the sidebar (persist `installed_apps.position`)
- [ ] Pin favourite apps; recently used apps on the Overview
- [ ] App settings page generated from a manifest `settings` schema
- [ ] Realtime sync between tabs and devices (Supabase Realtime on `installed_apps`, `app_storage`)
- [ ] Offline-friendly writes: queue mutations while offline, replay on reconnect
- [ ] Global keyboard shortcuts per app
- [ ] Avatar upload (Supabase Storage bucket + RLS)
- [ ] OAuth sign-in (GitHub, Google)
- [ ] Account deletion (edge function that removes the auth user; data cascades)

## Phase 4 — Utility apps

Each app is a new self-contained folder `src/apps/<app-id>/` built in this repo (decided Oct 1, 2026: no external apps or publishing flow; adding the folder ships the app). Candidates, roughly easiest first:

- [ ] **Calculator**: basic + scientific, history saved with `useAppStorage`
- [ ] **Unit Converter**: length, weight, temperature, data sizes
- [ ] **JSON Formatter**: format, validate, minify, tree view (client-only)
- [ ] **Password Generator**: length and character options, copy to clipboard (client-only)
- [ ] **Bookmarks**: saved links with tags (own table)
- [ ] **Habit Tracker**: daily check-ins, streaks (own table)
- [ ] **Study Planner**: import the term plans in `docs/refs/` as checklists and track evening sessions
- [ ] **Markdown Preview**: split-pane editor, export to `.md`
- [ ] **Clipboard / Snippets**: reusable text snippets with search

## Phase 5 — Ship

- [x] Deploy the frontend to **Vercel** via GitHub Actions (Oct 1, 2026; switched from Netlify the same day): `.github/workflows/deploy-vercel.yml` runs on every push/merge to `master` (and manually via "Run workflow"): `npm ci` → `npm run check` → `vercel pull --environment=production` → `vercel build --prod` → `vercel deploy --prebuilt --prod`. Needs repo secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`; the two `VITE_*` values are passed to `vercel build` from GitHub (Vercel refuses to store `VITE_*` vars as Sensitive because they end up in the browser bundle). `vercel.json` sets the Vite build (`npm ci`, `npm run build`, `dist`) and rewrites `/(.*)` → `/index.html` so deep links and reloads on any React Router route work. Still to do: add the Vercel URL to Supabase Auth Site URL / redirect URLs, and disable Vercel's own Git deployments (or don't connect the repo) so production only deploys from CI
- [x] Separate Supabase environments (Oct 1, 2026): `flow-os-app` for localhost, new `flow-os-prod` for production (both migrations applied, security advisor clean, no data). Branching was skipped because it needs the Pro plan
- [ ] Manage migrations through the Supabase CLI (`supabase db push`) instead of ad-hoc changes
- [ ] Error monitoring (e.g. Sentry) and basic usage analytics
- [ ] Custom domain + favicon / social preview images
- [ ] Turn email confirmation back **on** and set up custom SMTP (the built-in mailer is rate-limited)
- [ ] Re-run the Supabase security and performance advisors before launch

---

## Conventions

- **Where things go:** see the Architecture table. Rule of thumb: an API type goes in `models/`, a UI-only type goes in `types/`, a network call goes in `src/apis/` as a `queryOptions` / `mutationOptions` factory (never call `supabase` directly from a component), a hook in `hooks/` only when it adds logic, and a hard-coded value goes in `constants/`. Never read `import.meta.env` outside `constants/env.ts`.
- **File naming:**

  | Files                                                       | Case                                 | Examples                                                                           |
  | ----------------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------- |
  | Every `*.tsx` (components, pages, layouts, context, router) | PascalCase, matching the main export | `Button.tsx`, `OverviewPage.tsx`, `AppLayout.tsx`, `AuthContext.tsx`, `Router.tsx` |
  | Hooks (`src/hooks/*.ts`)                                    | camelCase, starting with `use`       | `useHealth.ts`, `useInstalledApps.ts`                                              |
  | Every other `*.ts`                                          | kebab-case, no dots in the name      | `profile-service.ts`, `query-keys.ts`, `theme-store.ts`, `cn.ts`                   |

  Exceptions: `main.tsx` (the Vite entry, referenced by `index.html`) and `*.d.ts`. Folder names are lowercase kebab-case (`atoms`, `focus-timer`).

- **API:** each domain gets a file in `src/apis/` (kebab-case, e.g. `installed-apps.ts`) that exports `xQueryOptions(params)` and `xMutationOptions(params)` built with TanStack's `queryOptions()` / `mutationOptions()`:
  - **Query keys** come from `constants/query-keys.ts`.
  - **Cache updates** go in the mutation's `onSuccess` / `onMutate` / `onError`, using the shared `queryClient`.
  - **User feedback** is declared as `meta: { successMessage, errorMessage }`. Don't call `toast` from API files or components for mutation results.
  - **Components** use `useQuery(xQueryOptions(...))` / `useMutation(xMutationOptions(...))` directly. Per-call reactions (e.g. navigate after install) go in `mutate(vars, { onSuccess })`.
- **Comments:** don't add code comments automatically. Write one only when explicitly asked; explanations belong in this plan, the READMEs or the PR description.
- **Components:** Atoms have no app logic. Molecules compose atoms. Organisms may use hooks and stores. Pages only compose organisms and molecules.
- **Ant Design:** import components straight from `antd`. `providers/AntdProvider.tsx` sets the theme (from `libs/antd-theme.ts`, switched by our theme store), the global Spin indicator and antd `App`. Show toasts with `notify` from `@/libs` (or mutation `meta`), not antd's static `notification`, so they follow the theme. Override styles with Tailwind classes; antd sits in `@layer antd` below `utilities`.
- **State:** server data → React Query (keys in `constants/query-keys.ts`, scoped by user). Global client state → zustand store. Auth → `useAuth()` / `useRequiredUser()`.
- **i18n:** every user-facing string goes through `t()` / `<Trans>`, with no hard-coded copy in components.
  - **Adding copy:** add the key to `src/locales/en.ts` first; `vi.ts` is typed from it, so a missing Vietnamese key fails the type-check.
  - **Outside React:** constants store translation keys (`labelKey`), not text. API toasts use `() => i18n.t(...)` so they render in the current language.
  - **Markup in copy:** use `<Trans>` with named components (`<email>…</email>`, `<file/>`), never interpolate HTML.
  - **Not translated:** app manifests (`name`, `tagline`) and Supabase error messages.
- **Dates:** always use `dayjs`, `fromNow` or `formatDate` from `@/libs`, never `new Date()` formatting by hand.
- **New app:** add `src/apps/<app-id>/` (see its README). The folder name is the id (`a-z 0-9 -`, never renamed once shipped); keep all of the app's code, types and docs inside that folder.
- **Data:** use `useAppStorage` for settings and small state. Create a dedicated table (with RLS and a `user_id default auth.uid()` column) when the app stores many rows; name it `<app_id>_<thing>` and its migration `<timestamp>_app_<app-id>_<change>.sql`.
- **Lint & format:** run `npm run check` before committing; `npm run lint:fix` and `npm run format` fix most issues automatically.
  - **Unused names:** anything intentionally unused starts with `_` (`_event`, `const [_first, second]`, `catch (_err)`).
  - **Imports:** use `import type` for type-only imports (enforced). No import cycles, duplicate imports or self-imports.
  - **One-level import paths (Oct 1, 2026):** every source folder has an `index.ts` barrel (`export * from "./file";`), and code imports the folder, never a file inside it: `@/types`, `@/constants`, `@/utils`, `@/libs`, `@/hooks`, `@/apis`, `@/models`, `@/stores`, `@/context`, `@/providers`, `@/locales`, `@/layouts`, `@/router`, `@/validations`, `@/apps`, and `@/components/atoms` / `molecules` / `organisms` / `pages`. When you add a file, add its line to that folder's `index.ts`. Inside the same folder, import a sibling by relative path (`./routes`) instead, so a file never imports its own barrel. App folders (`src/apps/<app-id>/`) import their own files relatively and are not re-exported.
  - **Layering (keeps barrels cycle-free):** `utils` imports only `constants` / `types` / `models`; `libs` may use `utils` but never the reverse; `context` never imports `hooks` or components; `AppProviders` lives in `src/providers/` because it composes everything.
  - **Linter comments:** don't disable rules inline without a comment saying why.
- **Schema changes:** add a migration file in `supabase/migrations/`, apply it to **development** (`flow-os-app`) first, test, then apply the same file to **production** (`flow-os-prod`) before merging to `master`. Re-run the advisors on both and regenerate `src/models/database.ts`.
- **Brand colour:** mid green. Primary button `#188552`, accent `#24b573` (dark theme: `#005a35` / `#36c281`). Change it only in `src/styles/tokens.css` (plus `public/favicon.svg`).
- **Styling:** CSS only, no SCSS. Use Tailwind utilities first; put reusable extras as an `@utility` in `src/styles/index.css`. Use token-backed classes (`bg-card`, `text-muted-foreground`, `border-border-strong`) instead of raw colours, so both themes keep working.
- **Responsive:** design mobile first (`sm` 640, `md` 768 = sidebar appears, `lg` 1024). Use `pointer-coarse:` for bigger touch targets. Never hide controls behind hover only. Inputs are 14px; add `text-base md:text-sm` if iOS zoom on focus becomes a problem.
