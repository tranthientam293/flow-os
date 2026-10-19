# flowOS: Deployment

## Environments

Two separate Supabase projects (both Free plan, region `ap-south-1`); branching needs the Pro plan.

| Environment | Supabase project | Ref                    | Used by                                                                                  | Auth site URL                        |
| ----------- | ---------------- | ---------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------ |
| Development | `flow-os-app`    | `cxgliajkslpakdfwzuxf` | `npm run dev`, through `.env.local`                                                      | `http://localhost:3000`              |
| Production  | `flow-os-prod`   | `xxzybkxzpzlhubdthsdt` | [flow-os-project.vercel.app](https://flow-os-project.vercel.app), through GitHub secrets | `https://flow-os-project.vercel.app` |

## Frontend: Vercel

Pushing or merging to `master` runs `.github/workflows/deploy-vercel.yml` (it can also be started by hand from the Actions tab):

1. `npm ci`
2. `npm run check` (type-check, lint, format)
3. `vercel pull --environment=production`
4. `vercel build --prod`
5. `vercel deploy --prebuilt --prod`

Repository secrets (Settings → Secrets and variables → Actions):

| Secret                          | Value                                                       |
| ------------------------------- | ----------------------------------------------------------- |
| `VERCEL_TOKEN`                  | Vercel access token                                         |
| `VERCEL_ORG_ID`                 | `orgId` from `.vercel/project.json` after `npx vercel link` |
| `VERCEL_PROJECT_ID`             | `projectId` from the same file                              |
| `VITE_SUPABASE_URL`             | Production project URL                                      |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Production publishable key                                  |

The `VITE_*` values are public by design: Vite inlines them into the browser bundle. `vercel.json` rewrites every path that isn't a file to `index.html`, so deep links and reloads work with React Router.

## Database migrations

Deploys never touch the database. Migrations live in `supabase/migrations/` and are applied by hand:

1. Add a migration file. Platform: `<timestamp>_<change>.sql`; apps: `<timestamp>_app_<app-id>_<change>.sql`.
2. Apply it to **development** (`flow-os-app`) and test.
3. Apply the same file to **production** (`flow-os-prod`) before, or right after, deploying the code that needs it.
4. Regenerate `src/models/database.ts` and re-run the Supabase security and performance advisors.

To apply to production with the Supabase CLI, from the repo root:

```sh
npx supabase login
npx supabase link --project-ref xxzybkxzpzlhubdthsdt   # asks for the database password
npx supabase migration list                            # local files vs. what prod has applied
npx supabase db push                                   # applies what prod hasn't recorded
```

Never edit a migration that has shipped; add a new one.

## This wiki

The wiki pages live in the repository and are published by `.github/workflows/sync-wiki.yml`. It runs only by hand: **Actions → Sync wiki → Run workflow**.

| Pages                 | Kept in                       |
| --------------------- | ----------------------------- |
| Home, sidebar, flowOS | `docs/wiki/`                  |
| Ledger                | `docs/apps/ledger/`           |
| Roster                | `docs/apps/roster/Roster*.md` |

The workflow copies these to the wiki, deletes pages it published before that are gone from the repository, and leaves pages created by hand in the wiki alone. Page names must be unique, since the wiki has no folders. To add pages, add their pattern to `WIKI_PAGES` in the workflow.
