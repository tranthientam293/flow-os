# Roster

**Roster** is a flowOS app for schedules across branches. A center owner (a music school, language center, gym, tutoring center, studio, or any business whose trainers move between branches) sets up the center, opens branches and invites trainers. Each trainer books their own teaching sessions, completes them with their pay, and sees their monthly income.

| Field        | Value                                                                                        |
| ------------ | -------------------------------------------------------------------------------------------- |
| App id       | `roster` (folder `src/apps/roster/`, never renamed)                                          |
| Display name | Roster                                                                                       |
| Category     | Productivity                                                                                 |
| Version      | 2.44.0                                                                                       |
| Currency     | Vietnamese đồng (VND, ₫)                                                                     |
| Time zone    | Vietnam (`Asia/Ho_Chi_Minh`, GMT+7) only                                                     |
| Tables       | 11 tables prefixed `roster_`                                                                 |
| Source       | [`src/apps/roster/`](https://github.com/tranthientam293/flow-os/tree/master/src/apps/roster) |

## Two roles

Roles exist only inside Roster; for flowOS, everyone is an ordinary signed-in user. One person can own some centers and train at others.

| Role        | Can                                                                                                                                                                   |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Owner**   | Create a center; manage its trainers, branches, session types and settings; act on any session in the current month. Can also appear as a trainer at their own center |
| **Trainer** | Join a center from an invitation; book, change, complete, cancel and delete their own sessions in the current month; set their own salary; see their income           |

## What you can do

- **Set up a center**: opening hours, week start, default session length, branches, session types with pay rules.
- **Invite trainers** by email and choose which branches and session types each may book.
- **Book sessions** one at a time or as a repeat (every week or every month), with a check that a trainer is never booked twice at once.
- **Complete sessions** through a checkout that records salary and extra fees.
- **See income** per month: sessions, hours, salary, fees and total.
- **Track every change**: each session keeps a history of who did what and when.

## Pages in this wiki

| Page                                      | For        | What it covers                                         |
| ----------------------------------------- | ---------- | ------------------------------------------------------ |
| [User guide](Roster-User-Guide)           | Everyone   | Getting started as an owner or trainer, every screen   |
| [Rules](Roster-Rules)                     | Everyone   | Who can do what, session times, pay, repeats, deleting |
| [Developer guide](Roster-Developer-Guide) | Developers | Code layout, routing, context, data fetching           |
| [Data model](Roster-Data-Model)           | Developers | Tables, functions, row-level security, migrations      |
| [Changelog](Roster-Changelog)             | Everyone   | What changed in each version                           |

The app's own [`README.md`](https://github.com/tranthientam293/flow-os/blob/master/src/apps/roster/README.md) is the source of truth. The original v1 planning documents (`docs/apps/roster/plan.md`, `data-model.md`, `design.md`) describe a design that has since changed a lot; read them as history.
