# Roster: Developer guide

How Roster is built. Read [Building an app](flowOS-Building-Apps) first for the rules every flowOS app follows.

## Folder layout

```
src/apps/roster/
  manifest.ts        App id, name, version; lazy-loads RosterApp and summary.ts
  RosterApp.tsx      Root: routes, header, bottom bar, footer, providers
  summary.ts         getSummary() for the flowOS Overview tile
  README.md          Routes, screens, rules, tables, changelog (source of truth)
  apis/              queryOptions / mutationOptions per table and RPC
  components/
    atoms/           BranchTag, DayLabel, MemberAvatar, SessionStatusBadge
    molecules/       SessionBlock, SessionActions, SessionDetails, filters, pickers, …
    organisms/       Shells, views per tab, TimeGrid, SessionDrawer, CheckoutModal, …
    pages/           SectionPage, MySettingsPage
  constants/         Routes (sections and tabs), options, query and storage keys
  context/           roster-context, checkout-context, add-action-context
  hooks/             useSessions, useSessionEvents, useNow, useRosterPaths, useCenterContexts
  models/            roster.ts: types derived from src/models/database.ts
  utils/             Time zones, permissions, overlap layout, colors, rates, money, errors
```

## Routing

Nested under `/apps/roster/*`. Sections and tabs are defined in `constants/routes.ts` (`SECTIONS`).

| Path                            | Screen                                                        |
| ------------------------------- | ------------------------------------------------------------- |
| `/apps/roster`                  | Redirects to `centers` for owners, otherwise `work`           |
| `/apps/roster/centers`          | Manage centers: cards for centers you own                     |
| `/apps/roster/centers/:id/:tab` | A center you own: `trainers`, `branches`, `types`, `settings` |
| `/apps/roster/work`             | My schedule: calendar or list across your centers             |
| `/apps/roster/work/income`      | Income                                                        |
| `/apps/roster/work/repeats`     | Your repeats                                                  |
| `/apps/roster/work/deleted`     | Your deleted sessions                                         |
| `/apps/roster/work/:id/:tab`    | Your work at one center: `schedule`                           |
| `/apps/roster/settings`         | My settings                                                   |

An unknown center returns to the section's main page; a missing or unknown tab opens the first one. The owner's **Schedule** and **Repeats** tabs and the trainer's **My week** tab are hidden in this release, but their views (`ScheduleView`, `CenterRepeatsView`, `MyWeekView`) stay in the code, and old links land on the first tab.

## Shared state

| Context            | Hook                     | Holds                                                                                                                          |
| ------------------ | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `RosterContext`    | `useRoster()`            | The selected center, your membership and role, the section (`centers` or `work`), and lookups (branches, members, types by id) |
| Checkout context   | (via `CheckoutProvider`) | Opens the checkout modal for a session from anywhere                                                                           |
| Add-action context | `useRegisterAddAction`   | Lets a page hand its "create session" action to the phone bottom bar's **+**                                                   |

## Data fetching

Everything goes through TanStack Query, with options in `apis/`:

| File               | Covers                                                                                        |
| ------------------ | --------------------------------------------------------------------------------------------- |
| `centers.ts`       | Centers, create, update, delete                                                               |
| `members.ts`       | Members, invites, pending invites, claim, leave, my profile                                   |
| `branches.ts`      | Branches, archive and restore                                                                 |
| `session-types.ts` | Session types and trainer assignments                                                         |
| `sessions.ts`      | Sessions by range and filters, book, edit, cancel, checkout, reopen, delete, restore, history |
| `repeats.ts`       | Start, update, apply, stop repeats                                                            |
| `income.ts`        | Your completed sessions and their fees in a month                                             |
| `trainer-rates.ts` | A trainer's own salary per type                                                               |

`useSessions` loads a date range with filters and prefetches the neighboring range, so moving between weeks doesn't flicker. My schedule passes your member id, so it loads only your sessions.

## Permissions

The database is the authority: RLS policies and `security definer` functions enforce every rule in [Rules](Roster-Rules). `utils/permissions.ts` mirrors them so the UI only offers allowed actions, but never replaces the database checks.

## Storage keys (`useAppStorage`)

| Key              | Value                              |
| ---------------- | ---------------------------------- |
| `activeCenterId` | Last center opened (Overview tile) |
| `scheduleView`   | `week` or `day`                    |

## Releasing a change

1. Add a changelog entry to `src/apps/roster/README.md` and update its rules and tables sections.
2. Bump `version` in `manifest.ts` to match.
3. Run `npm run check`.
4. For schema changes, see [Data model](Roster-Data-Model#changing-the-schema).
