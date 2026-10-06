# Roster — Data Model

Proposed schema for v1, described in words and tables only. The SQL is written in milestone M1 as `supabase/migrations/<timestamp>_app_roster_init.sql`.

## Overview

```
roster_centers 1 ──< roster_members >── 0..1 auth.users
      │                 │      │
      │ 1               │ 1    │ 1
      ▼ *               │      ▼ *
roster_branches 1 ──<───┼── roster_member_branches   (assignments)
      │ 1               │ 1
      ▼ *               ▼ *
      └──────────< roster_sessions

roster_centers 1 ──< roster_session_types 1 ──< roster_sessions
                     roster_session_types 1 ──< roster_member_session_types >── roster_members
roster_centers 1 ──< roster_fees 1 ──< roster_fee_members >── roster_members
roster_centers 1 ──< roster_month_closes 1 ──< roster_income_lines
```

- A **center** has many **branches** and many **members**.
- A **member** is one person's role in one center (owner or trainer). It may not be linked to a user yet (invited).
- A **member branch** says a trainer may book at that branch.
- A **session** is one booked time block: one member, one branch, start and end.
- A **session type** (e.g. "Piano 1:1", "Personal training") sets a session's default hourly fee.
- A **member session type** says a trainer may teach that session type, optionally with their own hourly fee.
- A **fee** is an additional fee rule (per session, per hour or per month) for all or selected trainers.
- A **month close** freezes one month's income as **income lines**.

A user can be a member of **many centers** (D6), with one member row per center and possibly a different role in each. Every query in the app is filtered by the currently selected `center_id`.

The tables are center-scoped rather than user-scoped. Unlike the platform tables, rows are shared by everyone in the center, so these tables have no `user_id default auth.uid()` column. Access comes from membership instead.

## Industry-neutral by design (D17)

The schema never mentions an industry. Table and column names are neutral (`branch`, `member`, `session`, `session_type`), and `business_type` is only a hint for prefilling labels and starter session types; no constraint, policy or function reads it. Everything that differs between businesses is data (`labels`, session types, fees) or a center setting (timezone, currency, week start, session length). The presets themselves (labels and starter session types per business type) live in the app's `constants/`, not the database, so adding a preset needs no migration.

## Tables

### `roster_centers`

| Column                      | Type        | Notes                                                                                                                                                                                                                                         |
| --------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                        | uuid PK     | `gen_random_uuid()`                                                                                                                                                                                                                           |
| `name`                      | text        | 1–120 chars                                                                                                                                                                                                                                   |
| `timezone`                  | text        | IANA name, e.g. `Asia/Ho_Chi_Minh`                                                                                                                                                                                                            |
| `week_start`                | smallint    | 0 = Sunday, 1 = Monday (default 1)                                                                                                                                                                                                            |
| `default_session_min`       | smallint    | default 60, between 15 and 480                                                                                                                                                                                                                |
| `past_edit_days`            | smallint    | default 7, between 0 and 90. How long trainers can edit their own past sessions (0 = never)                                                                                                                                                   |
| `currency`                  | text        | ISO 4217 code, default `VND`                                                                                                                                                                                                                  |
| `business_type`             | text        | `music` \| `language` \| `fitness` \| `tutoring` \| `dance` \| `sports` \| `art_stem` \| `other` (default). Only used to prefill labels and starter session types; no rule depends on it                                                      |
| `labels`                    | jsonb       | The center's words: `{ center, centers, branch, branches, trainer, trainers, session_type, session_types }`, each 1–30 chars. Missing keys fall back to the defaults (Center, Branch, Trainer, Session type). Validated by a check constraint |
| `created_by`                | uuid        | `auth.users`, default `auth.uid()`                                                                                                                                                                                                            |
| `created_at` / `updated_at` | timestamptz | `set_updated_at()` trigger                                                                                                                                                                                                                    |

### `roster_members`

| Column                      | Type             | Notes                                                                                                                   |
| --------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `id`                        | uuid PK          |                                                                                                                         |
| `center_id`                 | uuid             | → `roster_centers` on delete cascade                                                                                    |
| `user_id`                   | uuid null        | → `auth.users` on delete set null. Null while the invite is pending                                                     |
| `role`                      | text             | `owner` \| `trainer`                                                                                                    |
| `status`                    | text             | `invited` \| `active` \| `inactive`                                                                                     |
| `display_name`              | text             | 1–80 chars. Roster's own copy, because `profiles` is private                                                            |
| `email`                     | text             | Lower-cased. Used to match invites                                                                                      |
| `phone`                     | text null        |                                                                                                                         |
| `color`                     | text             | Hex, for the trainer's chip and avatar                                                                                  |
| `any_branch`                | boolean          | default false. "Can book at any branch"; ignored for the owner                                                          |
| `deactivated_at`            | timestamptz null | Set when status becomes `inactive`, cleared on reactivation. With `created_at`, decides which months get per-month fees |
| `created_at` / `updated_at` | timestamptz      |                                                                                                                         |

All columns are written by the owner only. A trainer can read their own full row but can't update it.

Constraints:

- unique `(center_id, email)`: no inviting the same person twice.
- unique `(center_id, user_id)` where `user_id` is not null.
- exactly one `owner` per center (partial unique index on `center_id` where `role = 'owner'`).
- `status = 'invited'` ⇔ `user_id is null`.

### `roster_branches`

| Column                      | Type             | Notes                                        |
| --------------------------- | ---------------- | -------------------------------------------- |
| `id`                        | uuid PK          |                                              |
| `center_id`                 | uuid             | → `roster_centers` on delete cascade         |
| `name`                      | text             | 1–120 chars                                  |
| `code`                      | text             | Short label, 1–8 chars, unique per center    |
| `address`                   | text null        |                                              |
| `color`                     | text             | Hex, used for session blocks                 |
| `archived_at`               | timestamptz null | Archived instead of deleted, to keep history |
| `created_at` / `updated_at` | timestamptz      |                                              |

### `roster_member_branches`

Which branches a trainer may book at. Managed by the owner only.

| Column       | Type        | Notes                                 |
| ------------ | ----------- | ------------------------------------- |
| `center_id`  | uuid        | → `roster_centers` on delete cascade  |
| `member_id`  | uuid        | → `roster_members` on delete cascade  |
| `branch_id`  | uuid        | → `roster_branches` on delete cascade |
| `created_at` | timestamptz |                                       |

Primary key `(member_id, branch_id)`. The member and branch must belong to `center_id`.

Removing an assignment doesn't touch existing sessions. It only stops the trainer from booking (or moving a session) to that branch from then on.

### `roster_session_types`

Kinds of session, each with a default hourly fee (D11). Managed by the owner; every member can read the name (needed to book), but not the fee.

| Column                      | Type             | Notes                                                         |
| --------------------------- | ---------------- | ------------------------------------------------------------- |
| `id`                        | uuid PK          |                                                               |
| `center_id`                 | uuid             | → `roster_centers` on delete cascade                          |
| `name`                      | text             | 1–80 chars, unique per center, e.g. "Piano 1:1", "Yoga class" |
| `default_hourly_fee`        | numeric(14,2)    | ≥ 0, in the center's currency. **Private**                    |
| `archived_at`               | timestamptz null | Hidden from booking, kept on past sessions                    |
| `created_at` / `updated_at` | timestamptz      |                                                               |

### `roster_member_session_types`

Which session types a trainer may teach (D15), and optionally their own hourly fee for it (D11). Managed by the owner only.

| Column                      | Type               | Notes                                      |
| --------------------------- | ------------------ | ------------------------------------------ |
| `center_id`                 | uuid               | → `roster_centers` on delete cascade       |
| `member_id`                 | uuid               | → `roster_members` on delete cascade       |
| `session_type_id`           | uuid               | → `roster_session_types` on delete cascade |
| `hourly_fee`                | numeric(14,2) null | ≥ 0. Null = use the session type's default |
| `created_at` / `updated_at` | timestamptz        |                                            |

Primary key `(member_id, session_type_id)`. The member and session type must belong to `center_id`.

Removing an assignment doesn't touch existing sessions; it stops the trainer from booking that session type from then on. It also removes the trainer-specific fee, so open months fall back to the default for those sessions.

**Hourly fee of a session** = `roster_member_session_types.hourly_fee` for (member, session type) if present and not null, else `roster_session_types.default_hourly_fee`.

### `roster_sessions`

| Column                      | Type        | Notes                                                                    |
| --------------------------- | ----------- | ------------------------------------------------------------------------ |
| `id`                        | uuid PK     |                                                                          |
| `center_id`                 | uuid        | → `roster_centers` on delete cascade. Kept on the row to keep RLS simple |
| `member_id`                 | uuid        | → `roster_members` (the trainer running it)                              |
| `branch_id`                 | uuid        | → `roster_branches`                                                      |
| `session_type_id`           | uuid        | → `roster_session_types`. Required; sets the hourly fee                  |
| `starts_at`                 | timestamptz |                                                                          |
| `ends_at`                   | timestamptz | `ends_at > starts_at`, max 12 h                                          |
| `title`                     | text null   | e.g. "Grade 3", "Morning group", ≤ 120 chars                             |
| `note`                      | text null   | ≤ 1000 chars                                                             |
| `status`                    | text        | `scheduled` \| `missed` \| `cancelled`                                   |
| `series_id`                 | uuid null   | Groups the sessions of one fixed shift (weekly repeat)                   |
| `created_by`                | uuid        | default `auth.uid()`, so we know whether the owner booked it for someone |
| `updated_by`                | uuid null   | set by trigger to `auth.uid()` on every update; shown as "edited by …"   |
| `created_at` / `updated_at` | timestamptz |                                                                          |

Status meaning: `scheduled` = planned or happened as planned; `missed` = was planned but didn't happen (set after the fact); `cancelled` = called off in advance. Only `scheduled` counts toward hours and the overlap check.

Constraints and indexes:

- **No double-booking:** an exclusion constraint on `(member_id, tstzrange(starts_at, ends_at))` with `&&`, only where `status = 'scheduled'`. Needs the `btree_gist` extension (check that it is enabled on both projects). The app turns the constraint's error code into a friendly "Already booked at D1 14:00–15:00" message.
- `member_id`, `branch_id`, `session_type_id` and `center_id` must all belong to the same center. New sessions can't use an archived branch or session type. Enforced by a trigger, or by composite foreign keys on `(center_id, id)`.
- Index `(center_id, starts_at)` for the week/day views, and `(member_id, starts_at)` for "my schedule" and income.

### `roster_fees`

Additional fee rules. Managed by the owner only.

| Column                      | Type          | Notes                                                                           |
| --------------------------- | ------------- | ------------------------------------------------------------------------------- |
| `id`                        | uuid PK       |                                                                                 |
| `center_id`                 | uuid          | → `roster_centers` on delete cascade                                            |
| `name`                      | text          | 1–80 chars, e.g. "Travel allowance D3"                                          |
| `amount`                    | numeric(14,2) | ≥ 0, in the center's currency                                                   |
| `unit`                      | text          | `per_session` \| `per_hour` \| `per_month`                                      |
| `all_members`               | boolean       | true = every trainer (and the owner); false = only rows in `roster_fee_members` |
| `branch_id`                 | uuid null     | → `roster_branches`. Null = all branches. Must be null for `per_month`          |
| `active`                    | boolean       | default true. Inactive fees are ignored in open months                          |
| `created_at` / `updated_at` | timestamptz   |                                                                                 |

### `roster_fee_members`

Which trainers a fee applies to when `all_members` is false.

| Column      | Type | Notes                                |
| ----------- | ---- | ------------------------------------ |
| `fee_id`    | uuid | → `roster_fees` on delete cascade    |
| `member_id` | uuid | → `roster_members` on delete cascade |

Primary key `(fee_id, member_id)`. Both must belong to the same center.

### `roster_month_closes`

One row per closed month. Deleting the row reopens the month.

| Column      | Type        | Notes                                                       |
| ----------- | ----------- | ----------------------------------------------------------- |
| `center_id` | uuid        | → `roster_centers` on delete cascade                        |
| `month`     | date        | First day of the month (center timezone), e.g. `2026-10-01` |
| `closed_by` | uuid        | default `auth.uid()`                                        |
| `closed_at` | timestamptz | default `now()`                                             |

Primary key `(center_id, month)`. Only past months can be closed.

### `roster_income_lines`

The frozen income of a closed month, written by `roster_close_month()`, deleted (cascade) when the month is reopened.

| Column                | Type          | Notes                                                                             |
| --------------------- | ------------- | --------------------------------------------------------------------------------- |
| `id`                  | uuid PK       |                                                                                   |
| `center_id` / `month` | —             | → `roster_month_closes` on delete cascade                                         |
| `member_id`           | uuid          | → `roster_members`                                                                |
| `kind`                | text          | `base` \| `fee`                                                                   |
| `session_type_id`     | uuid null     | For `base` lines → `roster_session_types` on delete set null                      |
| `fee_id`              | uuid null     | For `fee` lines → `roster_fees` on delete set null                                |
| `label`               | text          | Session type name or fee name at closing time, so it survives renames and deletes |
| `quantity`            | numeric(10,2) | hours or sessions or 1 (per month)                                                |
| `unit_amount`         | numeric(14,2) | fee per unit at closing time                                                      |
| `amount`              | numeric(14,2) | quantity × unit_amount, rounded to the currency                                   |

## Income calculation

One function, `roster_income(center_id, month, member_id default null)`, returns income lines in the same shape as `roster_income_lines`, plus `hours` and `sessions` totals per member. It's `security definer` and checks the caller:

- **Trainer:** `member_id` must be their own (or null, meaning their own). They never get other members' lines.
- **Owner:** any member, or null for every member of the center.

How it works for each member and month:

1. If the month is **closed**, return the stored `roster_income_lines`.
2. Otherwise compute live from the current fees:
   - **Completed sessions:** that member's sessions in the month (by `starts_at` in the center's timezone) with `status = 'scheduled'` and `ends_at <= now()`. Upcoming, missed and cancelled sessions never count. Hours = exact minutes / 60.
   - **Base lines, one per session type:** hours of completed sessions of that type × the session hourly fee (the trainer-specific fee on `roster_member_session_types`, else the session type default).
   - **One line per active fee assigned to the member** (`all_members`, or a `roster_fee_members` row):
     - `per_hour`: hours of completed sessions (at `branch_id`, if set) × amount
     - `per_session`: number of completed sessions (at `branch_id`, if set) × amount
     - `per_month`: 1 × amount if the member was active in the month, i.e. `created_at` is before the month ends and `deactivated_at` is null or after the month starts. Sessions aren't required. No proration
   - Lines with quantity 0 are left out. Each amount is rounded to the currency's minor unit (0 decimals for VND).

Because the function only builds lines for fees assigned to the member, a trainer's result never contains fees that aren't theirs (D13).

`roster_close_month(center_id, month)` (owner only) runs step 2 for every member, writes the result into `roster_income_lines` and inserts the `roster_month_closes` row, all in one transaction. `roster_reopen_month(center_id, month)` deletes the close row, and its lines go with it.

## Helper functions

RLS policies need to ask "is the current user a member/owner of this center?" Querying `roster_members` from inside its own policy would recurse, so add two small `security definer` functions (`set search_path = ''`, execute granted to `authenticated` only):

| Function                                                 | Returns true when                                                                                                                                                         |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `roster_member_id(center_id)`                            | (returns uuid) the current user's active member id in that center, or null                                                                                                |
| `roster_is_owner(center_id)`                             | the current user is the active owner of that center                                                                                                                       |
| `roster_can_book(member_id, branch_id, session_type_id)` | the member is the owner, **or** both: (`any_branch` or a `roster_member_branches` row for that branch) and a `roster_member_session_types` row for that session type      |
| `roster_month_open(center_id, ts)`                       | the month containing `ts` (center timezone) has no `roster_month_closes` row                                                                                              |
| `roster_trainer_can_edit(center_id, starts_at)`          | `starts_at` is no more than `past_edit_days` in the past **and** no more than one month ahead (D2, D5, D7). "Today" and "one month" are computed in the center's timezone |

Two RPCs handle the steps plain RLS can't express safely:

| RPC                                                                              | Does                                                                                                                                                     |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `roster_create_center(name, tz, currency, business_type, labels, session_types)` | Creates the center, the owner's member row, and the starter session types the owner accepted (with their fees), in one transaction                       |
| `roster_pending_invites()`                                                       | Lists `invited` rows whose email matches `auth.jwt() ->> 'email'`, with center name, for the invite banner                                               |
| `roster_claim_invite(member_id)`                                                 | Links that one invite to `auth.uid()` and sets it `active`, if the email matches. One call per invite, since a user may join some centers and not others |
| `roster_leave_center(center_id)`                                                 | Sets the caller's trainer row to `inactive` and unlinks it. Refused for the owner                                                                        |

## RLS rules

`authenticated` only, with explicit grants. "Member" means an **active** member of the row's center.

| Table                               | Select                                                                        | Insert                                                                                                                | Update                                                                                                                                                                                                   | Delete                                                    |
| ----------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `roster_centers`                    | member                                                                        | via `roster_create_center` only                                                                                       | owner                                                                                                                                                                                                    | owner                                                     |
| `roster_members`                    | owner: all rows. Trainer: **own row only** (others via the view below)        | owner (role `trainer`, status `invited`)                                                                              | owner only                                                                                                                                                                                               | owner, never the owner row                                |
| `roster_member_branches`            | owner: all. Trainer: own rows                                                 | owner                                                                                                                 | —                                                                                                                                                                                                        | owner                                                     |
| `roster_branches`                   | member                                                                        | owner                                                                                                                 | owner                                                                                                                                                                                                    | owner (prefer archive)                                    |
| `roster_session_types`              | owner: all columns. Trainer: through `roster_session_type_directory` (no fee) | owner                                                                                                                 | owner                                                                                                                                                                                                    | owner (prefer archive)                                    |
| `roster_member_session_types`       | owner: all. Trainer: own rows                                                 | owner                                                                                                                 | owner                                                                                                                                                                                                    | owner                                                     |
| `roster_fees`, `roster_fee_members` | owner (trainers see their assigned fees only through `roster_income`)         | owner                                                                                                                 | owner                                                                                                                                                                                                    | owner                                                     |
| `roster_month_closes`               | member (so everyone can see a month is locked)                                | via `roster_close_month` only                                                                                         | —                                                                                                                                                                                                        | via `roster_reopen_month` only                            |
| `roster_income_lines`               | owner: all. Trainer: own rows                                                 | via `roster_close_month` only                                                                                         | —                                                                                                                                                                                                        | cascade on reopen                                         |
| `roster_sessions`                   | member                                                                        | owner: any member, any branch. Trainer: `member_id` = own, `roster_can_book` true, and `roster_trainer_can_edit` true | owner: any. Trainer: own rows where `roster_trainer_can_edit` holds for both the old and new `starts_at`; can't reassign `member_id`; a new `branch_id` or `session_type_id` must pass `roster_can_book` | owner, or trainer for own future sessions (prefer cancel) |

Notes:

- A user with a pending invite can't read the center until they claim it, because the invite RPCs run as security definer.
- **Colleague view (D1):** trainers see other members through a view `roster_member_directory` with only `id, center_id, display_name, color, role, status`. No email or phone. The view runs with the owner's rights (`security_invoker = false`) and filters to centers where the caller is an active member.
- **Edit window and horizon (D2, D5, D7):** checked in RLS on insert, and on update for both the old row (`using`) and the new row (`with check`). A trainer can create or edit sessions from `past_edit_days` ago up to one month ahead; outside that range only the owner can.
- **Assignments (D3, D15):** checked on insert, and on update when `branch_id` or `session_type_id` changes. Changing the time of an existing session whose branch or session type is no longer assigned is still allowed. The owner is never restricted, for their own sessions or when booking for others.
- **Closed months:** every insert, update and delete on `roster_sessions` also requires `roster_month_open` for the old and new `starts_at`, **for the owner too**. To change a closed month, the owner reopens it first.
- **Fee privacy (D9, D13):** trainers read session types through a view `roster_session_type_directory` (`id, center_id, name, archived_at`), without `default_hourly_fee`. They can read only their own `roster_member_session_types` rows. Additional fee rules are owner-only tables. A trainer's own effective hourly fees and assigned fees reach them only through `roster_income` and the profile panel (via an RPC `roster_my_rates(center_id)`).
- Inactive members lose all access, but their sessions stay visible to others. Their income is still calculated for the months they taught, and shown to the owner.

## Platform storage

Per-user preferences go in `useAppStorage`, not in tables:

| Key                | Value                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------- |
| `activeCenterId`   | the center selected in the switcher; falls back to the first active membership if it's gone |
| `dismissedInvites` | member ids of invites the user dismissed from the banner                                    |
| `scheduleView`     | `week` \| `day`                                                                             |
| `scheduleFilters`  | `{ branchIds, memberIds, onlyMe }`                                                          |
| `incomeAllCenters` | boolean, the "All centers" toggle on Income                                                 |

## Implementation notes (Oct 6, 2026)

Where the built schema (`supabase/migrations/20261006000000_app_roster_init.sql`) differs from the proposal above:

- **Directories are RPCs, not views.** `roster_member_directory(center_id)` and `roster_session_type_directory(center_id)` are `security definer` functions instead of `security_invoker = false` views, because the Supabase security advisor reports definer views as errors. The member directory also returns `user_id`, so "Edited by" can show a name.
- **`roster_fee_members` has a `center_id` column**, so composite foreign keys guarantee the fee and the member belong to the same center.
- **`roster_income_lines.sessions`** stores the completed-session count per line, so closed months still show "N completed sessions".
- **`roster_create_center`** also takes `p_display_name` and `p_color` for the owner's member row.
- **`roster_compute_income`** is the internal live calculation shared by `roster_income` and `roster_close_month`; signed-in users can't call it directly.
- **Guards in triggers:** `roster_members_guard` stops anyone but the RPCs from changing `role`, `user_id` or the owner's status, and keeps `deactivated_at` in sync (including when an auth user is deleted). `roster_sessions_guard` sets `created_by` / `updated_by`, blocks archived branches, archived session types and inactive trainers, and checks assignments when a trainer changes a session's branch or session type.
- **Advisors:** the only new warnings are "signed-in users can execute SECURITY DEFINER function" for the RPCs and RLS helpers above, which is intended, plus "unused index" notices while the tables are empty.

## Removing the app

Following `src/apps/README.md`: a migration that drops the eleven `roster_*` tables, the two directory views and the helper functions, and deletes `installed_apps` / `app_storage` rows where `app_id = 'roster'`. Then regenerate `src/models/database.ts`.

## Changes (Oct 6, 2026, `20261006010000_app_roster_hours_and_series.sql`)

- **Opening hours:** `roster_centers.opens_at` / `closes_at` (`time`, default 07:00–22:00, `closes_at > opens_at`, `24:00` allowed for midnight). `roster_sessions_guard` refuses a session whose start or end falls outside them on its day (center timezone), only when the times are set or changed, so existing sessions stay editable after the hours change.
- **Fixed shifts:** a weekly series is one row per occurrence sharing `series_id` (indexed). `roster_update_series(session_id, start, end, branch_id, session_type_id, title, note)` is `security invoker`, so RLS still applies; it moves this session and every later `scheduled` one in the series to the new times, branch and session type in one statement. Cancelling "this and following" is a plain update on `series_id` + `starts_at`.
- **Trainers see only their own sessions** (`20261006020000_app_roster_trainers_see_own_sessions.sql`): the `roster_sessions` select policy is now owner, or `member_id` = the caller's member id. The owner still sees every session.
