# Roster — App Docs

**Roster** is a flowOS app for schedules across branches. A center owner (a music school, language center, gym, tutoring center, studio, or any business whose trainers move between branches) registers the center, opens branches, manages trainers, and every trainer books their own teaching sessions at any branch. Everyone sees one schedule, so it is always clear who is teaching where and when.

| Field           | Value                                                    |
| --------------- | -------------------------------------------------------- |
| App id          | `roster` (folder `src/apps/roster/`, never renamed)      |
| Display name    | Roster                                                   |
| Category        | Productivity                                             |
| Table prefix    | `roster_`                                                |
| Migration names | `<timestamp>_app_roster_<change>.sql`                    |
| Status          | v1 built (M1–M6, Oct 6, 2026); migration applied to dev only |

## Documents

| File                             | What it covers                                                                |
| -------------------------------- | ----------------------------------------------------------------------------- |
| [plan.md](plan.md)               | Goals, roles and permissions, features, milestones, open questions            |
| [data-model.md](data-model.md)   | Tables, relationships, constraints, RLS rules, how the platform fits in       |
| [design.md](design.md)           | Screens, user flows, layout and UI suggestions (desktop and mobile)           |

## Key decisions so far

- **Id is `roster`** (Oct 6, 2026). Display name "Roster"; "RosterFlow" stays an option for the display name only.
- **Two roles inside the app, one kind of user on the platform.** For flowOS, owners and trainers are ordinary signed-in users. The roles exist only in Roster's own tables.
- **The owner is also a trainer.** Owners can book their own sessions, and they show up in the trainer list and on the schedule like anyone else.
- **No customers in v1** (Oct 6, 2026). Roster is built for owners and trainers only; sessions don't record trainees, students or clients yet.
- **Trainer privacy and profiles** (Oct 6, 2026). Trainers can't see each other's email or phone. They can view their own profile but only the owner edits it.
- **Past sessions** (Oct 6, 2026). Trainers can edit their own past sessions within an edit window (default 7 days); after that only the owner can.
- **Branch assignments** (Oct 6, 2026). Trainers book only at branches the owner assigned them to, unless the owner turns on "Can book at any branch" for them. The owner can always book anyone anywhere.
- **Booking range** (Oct 6, 2026). Trainers can create sessions from the edit window start up to one month ahead; the owner has no limit.
- **Many centers per user** (Oct 6, 2026). A user can own some centers and be a trainer in others, with a center switcher in the header.
- **English only, no i18n** (Oct 6, 2026). Neither Roster nor the platform needs translations; copy is written directly in components (also noted in `docs/flowos-plan.md`).
- **Fees and income** (Oct 6, 2026). Currency VND, one per center. Hourly fees are set by **session type**; the owner assigns session types to trainers (like branches), optionally with a trainer-specific fee. A trainer added mid-month gets the full per-month fee. The owner adds any number of additional fees (per session, per hour, or per month; per-month fees are paid every month a trainer is active). Income counts **completed sessions only**. Every user sees their own monthly income and only the fees assigned to them; the owner sees everyone's and can close a month to freeze it.
- **Any kind of center** (Oct 6, 2026). Not tied to music schools: the core is industry-neutral, and each center picks a business type preset and can rename Center, Branch, Trainer and Session type to its own words. "Lesson type" is now **session type** everywhere.
- **Docs live here, code lives in `src/apps/roster/`.** Once code exists, the app's `README.md` there lists its tables and changelog, as the platform rules require. This folder holds planning and design.
