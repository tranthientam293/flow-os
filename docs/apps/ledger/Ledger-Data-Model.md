# Ledger: Data model

Ledger stores its data in two Supabase (Postgres) tables in the `public` schema. Both are private to each user through row-level security (RLS).

Migrations:

- [`20261014000000_app_ledger_init.sql`](https://github.com/tranthientam293/flow-os/blob/master/supabase/migrations/20261014000000_app_ledger_init.sql): `ledger_expenses`
- [`20261014010000_app_ledger_settings.sql`](https://github.com/tranthientam293/flow-os/blob/master/supabase/migrations/20261014010000_app_ledger_settings.sql): `ledger_settings`

```
auth.users ──1───n── ledger_expenses
     │
     └─────1───1── ledger_settings   (row created on first save)
```

## `ledger_expenses`

One row per expense.

| Column        | Type          | Rules                                                                          |
| ------------- | ------------- | ------------------------------------------------------------------------------ |
| `id`          | `uuid`        | Primary key, generated                                                         |
| `user_id`     | `uuid`        | Owner. Defaults to `auth.uid()`. Deleted with the user (`on delete cascade`)   |
| `amount`      | `bigint`      | Whole đồng, `> 0`                                                              |
| `category_id` | `text`        | A category id from [Categories](Ledger-Categories). Format `^[a-z0-9-]{1,64}$` |
| `note`        | `text`        | Optional, up to 200 characters                                                 |
| `spent_on`    | `date`        | The day spent, in the user's local calendar. Defaults to today                 |
| `created_at`  | `timestamptz` | Set on insert                                                                  |
| `updated_at`  | `timestamptz` | Updated by the `ledger_expenses_updated_at` trigger                            |

**Index:** `ledger_expenses_user_spent_on_idx` on `(user_id, spent_on desc, created_at desc)`, matching how the month list is read.

**RLS:** signed-in users can select, insert, update and delete only rows where `user_id = auth.uid()`.

## `ledger_settings`

One row per user, holding Ledger preferences. It doesn't exist until the user first saves a setting; the app treats a missing row as "no settings".

| Column          | Type          | Rules                                                                  |
| --------------- | ------------- | ---------------------------------------------------------------------- |
| `user_id`       | `uuid`        | Primary key and owner. Defaults to `auth.uid()`. Deleted with the user |
| `monthly_limit` | `bigint`      | Whole đồng, `> 0`. `null` means no limit                               |
| `created_at`    | `timestamptz` | Set on insert                                                          |
| `updated_at`    | `timestamptz` | Updated by the `ledger_settings_updated_at` trigger                    |

**RLS:** signed-in users can select, insert and update only their own row. There is no delete; removing the limit sets `monthly_limit` to `null`.

## How the app reads and writes

All access goes through the Supabase client as the signed-in user, so RLS applies to every request. Code: [`src/apps/ledger/apis/`](https://github.com/tranthientam293/flow-os/tree/master/src/apps/ledger/apis).

| Operation        | Query                                                                                                |
| ---------------- | ---------------------------------------------------------------------------------------------------- |
| Month's expenses | `ledger_expenses` where `spent_on` is in the month, newest day first, then newest entry first        |
| Last 12 months   | `amount, spent_on` only, for the 12 months ending with the chosen month, read in pages of 1,000 rows |
| Add / edit       | Insert, or update by `id`; returns the saved row                                                     |
| Delete           | Delete by `id`                                                                                       |
| Settings         | Select the user's row (`maybeSingle`)                                                                |
| Save limit       | Upsert `{ user_id, monthly_limit }`                                                                  |

## Storage keys

Ledger keeps nothing in the platform's per-app storage (`useAppStorage`).

## Changing the schema

- Name new migrations `<timestamp>_app_ledger_<change>.sql` and keep every table name prefixed `ledger_`.
- Apply migrations to the dev project first, then to production.
- Update the generated types in `src/models/database.ts` and the **Tables** section of the app's `README.md`.
