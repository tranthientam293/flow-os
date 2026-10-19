# flowOS: Architecture

## Stack

React 19 · React Router 8 · Ant Design 6 · Tailwind CSS 4 · zustand · TanStack Query 5 · dayjs · Vite 8 · TypeScript 7 · oxlint · Prettier · Supabase (Auth, Postgres, row-level security)

## Folder layout

```
src/
  components/
    atoms/        tiny custom pieces antd doesn't have (logo, app icon, badge, spinner)
    molecules/    small compositions (stat tile, empty state, settings panel, …)
    organisms/    feature blocks (top bar, sidebar, sign-in form, sessions table, …)
    pages/        one component per route
  layouts/        AppLayout (signed-in shell), AppFullscreenLayout (apps), AuthLayout
  router/         routes, ProtectedRoute / GuestRoute guards, loaders
  context/        AuthContext (session), FlowAppContext (app SDK)
  providers/      AppProviders (every provider), AntdProvider (theme, popups)
  stores/         zustand stores (theme, shell UI)
  apis/           queryOptions / mutationOptions per domain
  hooks/          hooks that add logic on top of the API, plus UI hooks
  models/         API and database types (generated database.ts)
  types/          UI-only types (AppManifest, theme, navigation)
  constants/      env, routes, query keys, app settings
  libs/           configured clients: supabase, queryClient, dayjs, antd theme, notify
  utils/          pure helpers (cn, errors, user names, user agents)
  validations/    form rules
  apps/           one folder per app (see Building an app)
  styles/         tokens.css, index.css, antd.css
supabase/migrations/   schema, RLS policies, functions, triggers
```

## Routes

| Path             | Page                | Guard           |
| ---------------- | ------------------- | --------------- |
| `/sign-in`       | Sign in             | Signed out only |
| `/sign-up`       | Sign up             | Signed out only |
| `/`              | Overview            | Signed in       |
| `/store`         | App Store           | Signed in       |
| `/settings`      | Settings            | Signed in       |
| `/apps/:appId/*` | An app, full screen | Signed in       |

Routes are lazy-loaded. Signed-out visitors are sent to sign-in and returned to the page they asked for afterwards.

## Data flow

```
component ─► useQuery(xQueryOptions()) / useMutation(xMutationOptions())   (src/apis)
          ─► libs/supabase  ─►  Supabase (RLS checks every row)
```

- **Server state** lives in TanStack Query. Query keys come from `constants/query-keys.ts` and are scoped by user.
- **Client state** that's global (theme, sidebar) lives in zustand stores.
- **The auth session** lives in `AuthContext` (`useAuth()`, `useRequiredUser()`). Signing out clears the query cache.
- **Toasts** for mutations are declared as `meta: { successMessage, errorMessage }` and shown by the global `MutationCache`. Components never call the toast API for mutation results.
- **Cache updates** go in the mutation's `onSuccess` / `onMutate`, using the shared `queryClient`.

## UI

- Use [Ant Design](https://ant.design/components/overview) components directly. Colors, radius, control heights and fonts come from `src/libs/antd-theme.ts`, which mirrors `src/styles/tokens.css` for light and dark.
- antd styles live in the `antd` CSS layer, ordered before Tailwind's `utilities`, so a Tailwind `className` always overrides antd without `!important`.
- Below 768px every `Modal` (including confirms) is a bottom sheet, and selects and pickers inside a modal open as bottom sheets too (`src/styles/antd.css`).
- Brand color is a mid green (`#188552` primary, `#24b573` accent). Use token-backed classes (`bg-card`, `text-muted-foreground`) rather than raw colors so both themes work.
- Breakpoints: `sm` 640, `md` 768 (sidebar appears), `lg` 1024. Design mobile first; never hide a control behind hover only.

## Conventions

| Topic         | Rule                                                                                                |
| ------------- | --------------------------------------------------------------------------------------------------- |
| File names    | `*.tsx` PascalCase; hooks `useX.ts`; other `.ts` kebab-case                                         |
| Imports       | Import a folder's barrel (`@/hooks`), never a file inside it; siblings import each other relatively |
| Layering      | `utils` imports only `constants` / `types` / `models`; `libs` may use `utils`, never the reverse    |
| Network calls | Only in `src/apis/`, never `supabase` straight from a component                                     |
| Props         | An `interface <Component>Props`, with JSDoc on props that need a description                        |
| Classes       | Combine and toggle with `cn()` from `@/utils`                                                       |
| Dates         | `YYYY/MM/DD` via `formatDate()` / `DATE_FORMAT`; relative times via `fromNow()`                     |
| Language      | English only, no i18n                                                                               |
| Comments      | Minimal; business rules belong in the app's README, not code comments                               |
| Checks        | `npm run check` (type-check, lint, format) before committing                                        |

## Scripts

| Command                           | Does                                                    |
| --------------------------------- | ------------------------------------------------------- |
| `npm run dev`                     | Dev server on `http://localhost:3000`, also on your LAN |
| `npm run build`                   | Type-check and production build                         |
| `npm run check`                   | Type-check, lint and format check                       |
| `npm run lint` / `lint:fix`       | oxlint                                                  |
| `npm run format` / `format:check` | Prettier, including Tailwind class sorting              |

## Getting started

```bash
npm install
cp .env.example .env.local   # Supabase URL and publishable key of the dev project
npm run dev
```
