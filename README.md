# flowOS

A workspace that hosts small utility apps. The UI follows the Supabase dashboard (see `docs/refs/img/ui-reference.png`).

**Stack:** React 19 · React Router · Tailwind CSS v4 · shadcn/ui · zustand · TanStack React Query · dayjs · Vite · Supabase

The full roadmap and conventions are in [`docs/flowos-plan.md`](docs/flowos-plan.md).

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your Supabase URL + publishable key
npm run dev                  # http://localhost:3000 (also exposed on your LAN)
```

The database schema is in `supabase/migrations/`. It is already applied to the `flow-os-app` project.

## Scripts

| Command                           | What it does                                                          |
| --------------------------------- | --------------------------------------------------------------------- |
| `npm run dev`                     | Dev server                                                            |
| `npm run build`                   | Type-check + production build                                         |
| `npm run check`                   | Type-check, lint and format check. Run before committing              |
| `npm run lint` / `lint:fix`       | oxlint (`.oxlintrc.json`); unused names prefixed with `_` are allowed |
| `npm run format` / `format:check` | Prettier (`.prettierrc.json`), including Tailwind class sorting       |

VS Code users: install the recommended extensions (`.vscode/extensions.json`) for format-on-save and inline lint.

## Structure

```
src/
  components/
    atoms/        shadcn/ui primitives + tiny custom pieces (logo, kbd, spinner)
    molecules/    small compositions (stat tile, empty state, form field, …)
    organisms/    feature blocks (top bar, sidebar, auth form, …)
    pages/        one component per route
  layouts/        AppLayout (signed-in shell), AuthLayout
  router/         routes + ProtectedRoute / GuestRoute
  context/        AuthContext, FlowAppContext (app SDK)
  providers/      AppProviders (wraps the app in every provider)
  stores/         zustand stores (theme, shell UI)
  apis/           queryOptions / mutationOptions per domain (Supabase client)
  hooks/          hooks that add logic on top of the API + UI hooks
  models/         API / database types
  types/          UI-only types
  constants/      env, routes, query keys, settings
  libs/           configured clients: supabase, queryClient, dayjs (+ date helpers), i18n
  utils/          pure helpers (cn, errors, user names)
  apps/           plug-in apps, one folder each (see src/apps/README.md)
  styles/         tokens.css + index.css
```

Data flows component → `useQuery(xQueryOptions())` / `useMutation(xMutationOptions())` from `src/apis` → `libs/supabase`. Mutation toasts are declared in `meta` and shown globally.

## Adding a UI primitive

```bash
npx shadcn@latest add <component>
```

The component lands in `src/components/atoms/`. The CLI names it in kebab-case and writes `import { cn } from "cn"`, so rename the file to PascalCase and change the import to `@/utils`, then add the file to `src/components/atoms/index.ts`.

## Naming

| Files       | Case       | Examples                                                                |
| ----------- | ---------- | ----------------------------------------------------------------------- |
| `*.tsx`     | PascalCase | `OverviewPage.tsx`, `AuthContext.tsx` (`main.tsx` is the one exception) |
| Hooks       | camelCase  | `useHealth.ts`, `useInstalledApps.ts`                                   |
| Other `.ts` | kebab-case | `profile-service.ts`, `query-keys.ts`                                   |

## Adding an app

Create `src/apps/<id>/manifest.ts` and a root component; the folder name must match the id and holds everything the app owns. The registry discovers the app automatically. Details and the SDK (`useFlowApp`, `useAppStorage`) are in [`src/apps/README.md`](src/apps/README.md).

## Deployment

Pushing or merging to `master` runs `.github/workflows/deploy-vercel.yml`: it installs dependencies, runs `npm run check`, then `vercel pull` → `vercel build --prod` → `vercel deploy --prebuilt --prod`. You can also start it by hand from the Actions tab ("Run workflow").

Add these repository secrets (Settings → Secrets and variables → Actions):

| Secret                          | Value                                                                                             |
| ------------------------------- | ------------------------------------------------------------------------------------------------- |
| `VERCEL_TOKEN`                  | Vercel access token (Account settings → Tokens)                                                   |
| `VERCEL_ORG_ID`                 | `orgId` from `.vercel/project.json` after running `npx vercel link` locally                       |
| `VERCEL_PROJECT_ID`             | `projectId` from the same file                                                                    |
| `VITE_SUPABASE_URL`             | Production project URL: `https://xxzybkxzpzlhubdthsdt.supabase.co` (`flow-os-prod`)               |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Production publishable key (`sb_publishable_…` from `flow-os-prod` → Project Settings → API Keys) |

The two `VITE_*` values are passed to `vercel build` from these GitHub secrets, so nothing needs to be set in the Vercel project. They are public by design (Vite inlines them into the browser bundle), which is also why Vercel won't store `VITE_*` variables as "Sensitive".

`vercel.json` rewrites every path that isn't a real file to `index.html`, so reloading or opening a deep link such as `/settings` works with React Router.

## Database

| Table            | Purpose                                                  |
| ---------------- | -------------------------------------------------------- |
| `profiles`       | Display name; created by a trigger on sign-up            |
| `installed_apps` | Which apps are in each user's sidebar                    |
| `app_storage`    | Per-user, per-app key/value store behind `useAppStorage` |

Every table has RLS enabled, with policies scoped to `auth.uid()`. After changing the schema, regenerate `src/models/database.ts` with `supabase gen types typescript`.
