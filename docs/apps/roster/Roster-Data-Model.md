# Roster: Data model

Roster's tables are all prefixed `roster_` and **center-scoped**: none has a `user_id` column. Access comes from an active membership in the center, checked by row-level security (RLS).

```
roster_centers 1 ──< roster_members >── 0..1 auth.users
      │                   │
      ├──< roster_branches ──< roster_member_branches >── roster_members
      ├──< roster_session_types ──< roster_member_session_types >── roster_members
      │                         └──< roster_trainer_rates >── roster_members
      ├──< roster_repeats ──< roster_sessions
      └──< roster_sessions ──< roster_session_fees
                          └──< roster_session_events
```

## Tables

| Table                         | Purpose                                                                                                                                                                                                   |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `roster_centers`              | Center settings: name, time zone (Vietnam only, enforced by a check), week start, opening hours, default session length. `past_edit_days` is unused                                                       |
| `roster_members`              | One person's role at one center: `owner` or `trainer`, status (`invited`, active, inactive), email, name, phone, color, and `also_trainer` (the owner is bookable). Linked to a user once they accept     |
| `roster_branches`             | Branches, archived instead of deleted                                                                                                                                                                     |
| `roster_member_branches`      | Branches a trainer may book at                                                                                                                                                                            |
| `roster_session_types`        | Session types: name, `pay_basis` (`shift` default, `hour` or `trainee`), default salary per unit, minimum length (`min_session_min`)                                                                      |
| `roster_member_session_types` | Types a trainer teaches (none = all) and the owner's rate for them (null = the type's default). Owner and that trainer only                                                                               |
| `roster_trainer_rates`        | A trainer's own salary per type; prefills their checkout. That trainer edits, the owner reads                                                                                                             |
| `roster_sessions`             | Booked sessions: trainer, branch, type, start, end, status, title, note, `trainee_count` (≥ 1), `salary` and `completed_at` (set by the checkout), `repeat_id`, `deleted_at` / `deleted_by` (soft delete) |
| `roster_session_fees`         | Extra pay on a completed session (label, amount). Written only by the checkout functions                                                                                                                  |
| `roster_repeats`              | Repeats: trainer, branch, type, weekdays, times, trainees, start date, `period` (`week` or `month`), `generated_through`, `stopped_at`                                                                    |
| `roster_session_events`       | Session history: who booked, edited, completed, updated the checkout, reopened, cancelled, marked missed, deleted or restored, and when. Written by the `roster_sessions_log` trigger                     |

**No double booking:** an exclusion constraint, `roster_sessions_no_overlap`, stops a trainer's scheduled and completed sessions that aren't deleted from overlapping.

The app reads only sessions with `deleted_at` null, except **My schedule → Deleted**.

## Functions

| Kind                | Functions                                                                                                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Centers and members | `roster_create_center`, `roster_pending_invites`, `roster_claim_invite`, `roster_leave_center`, `roster_member_directory`, `roster_update_my_profile`                  |
| Sessions            | `roster_checkout_session`, `roster_reopen_session`, `roster_delete_session`, `roster_restore_session`                                                                  |
| Repeats             | `roster_start_repeat`, `roster_update_repeat`, `roster_apply_repeat`, `roster_stop_repeat`; `roster_generate_repeats` runs hourly (`roster-generate-repeats` cron job) |
| RLS helpers         | `roster_member_id`, `roster_is_owner`, `roster_can_book`, `roster_trainer_can_edit`, `roster_in_current_month`                                                         |

Invitations match on email: `roster_pending_invites` returns invited memberships whose email equals the signed-in user's, and `roster_claim_invite` links the membership to that user.

## Migrations

All in `supabase/migrations/`, named `<timestamp>_app_roster_<change>.sql`, from `20261006000000_app_roster_init.sql` to `20261018060000_app_roster_apply_repeat_month.sql` (32 files). The app's [`README.md`](https://github.com/tranthientam293/flow-os/blob/master/src/apps/roster/README.md#tables) lists them all, and the [Changelog](Roster-Changelog) says what each release changed.

## Changing the schema

- Name new migrations `<timestamp>_app_roster_<change>.sql` and prefix new tables `roster_`.
- Apply to the dev project first, then production (see [Deployment](flowOS-Deployment#database-migrations)).
- Regenerate `src/models/database.ts` and update the **Tables** section of the app's `README.md`.
