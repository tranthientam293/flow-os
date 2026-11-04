# Ledger: Data model

Ledger stores its data in two Supabase (Postgres) tables in the `public` schema. Both are private to each user through row-level security (RLS).

Migrations:

- [`20261014000000_app_ledger_init.sql`](https://github.com/tranthientam293/flow-os/blob/master/supabase/migrations/20261014000000_app_ledger_init.sql): `ledger_expenses`
- [`20261014010000_app_ledger_settings.sql`](https://github.com/tranthientam293/flow-os/blob/master/supabase/migrations/20261014010000_app_ledger_settings.sql): `ledger_settings`
- [`20261104000000_app_ledger_funds.sql`](https://github.com/tranthientam293/flow-os/blob/master/supabase/migrations/20261104000000_app_ledger_funds.sql): `ledger_funds`, `ledger_fund_members`, `ledger_fund_transactions`, `ledger_fund_transaction_revisions`
- [`20261104010000_app_ledger_funds_owner_edits.sql`](https://github.com/tranthientam293/flow-os/blob/master/supabase/migrations/20261104010000_app_ledger_funds_owner_edits.sql): only the owner edits or deletes transactions
- [`20261104020000_app_ledger_fund_invites.sql`](https://github.com/tranthientam293/flow-os/blob/master/supabase/migrations/20261104020000_app_ledger_fund_invites.sql): invitations (`status`, `joined_at` on `ledger_fund_members`)
- [`20261104030000_app_ledger_fund_no_future.sql`](https://github.com/tranthientam293/flow-os/blob/master/supabase/migrations/20261104030000_app_ledger_fund_no_future.sql): no future dates
- [`20261104040000_app_ledger_fund_creator_edits.sql`](https://github.com/tranthientam293/flow-os/blob/master/supabase/migrations/20261104040000_app_ledger_fund_creator_edits.sql): only whoever added a transaction edits or deletes it

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

## Funds

Funds are shared between users, so unlike the tables above their RLS is by membership, not by `user_id`.

```
ledger_funds ──1───n── ledger_fund_members  (one owner per fund)
     │                        │ member_id, created_by, updated_by, actor_id
     └──1───n── ledger_fund_transactions ──1───n── ledger_fund_transaction_revisions
```

Deleting a fund cascades to all four tables. Members and transactions are never hard-deleted otherwise: removing a member sets `removed_at`, deleting a transaction sets `deleted_at`.

### `ledger_funds`

| Column                     | Type          | Rules                                    |
| -------------------------- | ------------- | ---------------------------------------- |
| `id`                       | `uuid`        | Primary key                              |
| `name`                     | `text`        | 1–80 characters (trimmed)                |
| `note`                     | `text`        | Optional, up to 200                      |
| `created_by`               | `uuid`        | The creating user (`on delete set null`) |
| `created_at`, `updated_at` | `timestamptz` | `updated_at` set by a trigger            |

**RLS:** members select; the owner updates and deletes. No insert grant: create with `ledger_create_fund(p_name, p_note)`.

### `ledger_fund_members`

| Column         | Type          | Rules                                                                                               |
| -------------- | ------------- | --------------------------------------------------------------------------------------------------- |
| `id`           | `uuid`        | Primary key                                                                                         |
| `fund_id`      | `uuid`        | The fund (`on delete cascade`)                                                                      |
| `user_id`      | `uuid`        | The account, once known; filled in when added or by `ledger_my_funds()`                             |
| `email`        | `text`        | Lowercase; unique per fund                                                                          |
| `display_name` | `text`        | 1–80; defaults to the flowOS profile name or the part of the email before @                         |
| `role`         | `text`        | `owner` (exactly one per fund, never removed) or `member`                                           |
| `status`       | `text`        | `invited` (added by the owner, not yet accepted) or `active` (joined). The owner is always `active` |
| `joined_at`    | `timestamptz` | When they accepted; null while invited                                                              |
| `removed_at`   | `timestamptz` | Set when the owner removes them or cancels the invitation, or they decline; null otherwise          |

A signed-in user is a member when a row of the fund has `removed_at` null, `status = 'active'`, and either `user_id = auth.uid()` or, not yet linked, `email` equal to their sign-in email (`ledger_fund_member_id()`).

**RLS:** members select every row of their fund, removed ones included. No write grants: `ledger_add_fund_member(p_fund_id, p_email, p_display_name)` (invites; inviting a removed or declined email again reuses its row) and `ledger_remove_fund_member(p_member_id)` (removes or cancels an invitation) check that the caller is the owner. The invitee answers with `ledger_accept_fund_invite(p_member_id)` (sets `active`, `joined_at` and `user_id`; returns the fund id) or `ledger_decline_fund_invite(p_member_id)`, and lists their open invitations with `ledger_my_fund_invites()` (fund, owner's name, when). A transaction's `member_id` must be an active member.

### `ledger_fund_transactions`

| Column        | Type          | Rules                                                                                                                               |
| ------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `id`          | `uuid`        | Primary key                                                                                                                         |
| `fund_id`     | `uuid`        | The fund (`on delete cascade`); can't change                                                                                        |
| `member_id`   | `uuid`        | Whose money: who put it in or used it. Must be a current member when set                                                            |
| `kind`        | `text`        | `contribute` (in) or `spend` (out)                                                                                                  |
| `amount`      | `bigint`      | Whole đồng, `> 0`                                                                                                                   |
| `note`        | `text`        | Optional, up to 200                                                                                                                 |
| `occurred_on` | `date`        | The day; defaults to today. Not after tomorrow (UTC), checked by the guard trigger (`20261104030000_app_ledger_fund_no_future.sql`) |
| `created_by`  | `uuid`        | Member who added it; set by the guard trigger, never changes                                                                        |
| `updated_by`  | `uuid`        | Member who last changed it; set by the guard trigger                                                                                |
| `deleted_at`  | `timestamptz` | Soft delete; a deleted transaction can't be changed again                                                                           |

**RLS:** members select and insert. Update (only `member_id`, `kind`, `amount`, `note`, `occurred_on` and `deleted_at` are granted) is allowed only to whoever added it (`created_by`), while it isn't deleted (`20261104040000_app_ledger_fund_creator_edits.sql`, replacing the owner-only rule of `20261104010000_app_ledger_funds_owner_edits.sql`). No delete grant.

### `ledger_fund_transaction_revisions`

One row per add, edit or delete, written by the `ledger_fund_transactions_log` trigger: `action` (`created`, `edited`, `deleted`), `actor_id` (member), and `member_id`, `kind`, `amount`, `note`, `occurred_on` as they were after the change. `created_at` uses `clock_timestamp()` so changes in one database transaction keep their order. An edit that changes none of those fields writes nothing.

**RLS:** members select. No write grants.

### `ledger_my_funds()`

Links the caller's unlinked member rows (by email), then returns each fund they're in: `id`, `name`, `note`, `created_at`, `my_member_id`, `my_role`, `member_count` (current members), `contributed`, `spent` and `balance` (over transactions that aren't deleted).

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
