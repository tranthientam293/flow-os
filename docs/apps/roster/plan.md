# Roster — Plan

## 1. Problem

Many businesses work the same way: a **center** with several **branches**, and a team of **trainers** who don't work at a fixed branch. During the week, trainers move between branches to run timed **sessions** of different **types**, and are paid by the hour plus allowances. The first case was a music training center, but the same model fits:

| Business                  | Center         | Branch     | Trainer     | Session types (examples)            |
| ------------------------- | -------------- | ---------- | ----------- | ----------------------------------- |
| Music school              | Center         | Branch     | Teacher     | Piano 1:1, Guitar group, Theory     |
| Language center           | Center         | Campus     | Teacher     | IELTS, Kids English, Conversation   |
| Fitness / gym chain       | Gym            | Location   | Coach       | Personal training, Yoga, HIIT class |
| Tutoring center           | Center         | Branch     | Tutor       | Math 1:1, Physics group, Exam prep  |
| Dance / martial arts      | Studio         | Studio     | Instructor  | Beginner class, Private, Choreo     |
| Sports academy            | Academy        | Field      | Coach       | Football U10, Swimming, Tennis 1:1  |
| Art / coding / STEM class | School         | Branch     | Instructor  | Drawing kids, Scratch, Robotics     |

Today the schedule lives in chat messages or spreadsheets, so the owner can't easily answer:

- Who is working at branch X right now, or on Saturday morning?
- Where is trainer Y this week?
- Has anyone been booked at two branches at the same time?
- How many hours did each trainer work this month, and how much did they earn?

## 2. Goals

1. One schedule for the whole center, viewable by branch, by trainer, or as a whole.
2. Trainers book their own sessions without asking the owner.
3. Double-booking a trainer is impossible.
4. The owner controls who belongs to the center and which branches exist.
5. Works well on a phone, since trainers check and book on the move.
6. Every user can see what they earned: hours worked × hourly fee, plus any additional fees.
7. **Fits any center with this business model**, not only music schools: nothing in the data, rules or screens assumes an industry, and each center can use its own words (see §5, Any kind of center).

**Out of scope for v1:** the center's customers (students, trainees, members, clients…). Roster is built for owners and trainers only: customers have no accounts and are not recorded on sessions (decided Oct 6, 2026). Also out of scope: paying trainers (Roster calculates income but doesn't record payments, payslips or tax), room-level booking inside a branch, approval workflows, notifications, calendar sync (Google/iCal).

## 3. Roles

There are two kinds of identity:

- **Platform:** everyone is just a flowOS user who installed Roster from the App Store. flowOS has no idea who is an owner.
- **Roster:** each user has a role *inside a center*.

| Role        | Who                                         | Count per center |
| ----------- | ------------------------------------------- | ---------------- |
| **Owner**   | The user who registered the center          | Exactly 1        |
| **Trainer** | A user the owner added to the center        | Any number       |

**The owner is also a trainer**, with every trainer ability plus management rights. The owner gets a trainer profile automatically when the center is created.

### Permission matrix

| Action                                         | Trainer          | Owner |
| ---------------------------------------------- | ---------------- | ----- |
| View the center's branches                     | ✅               | ✅    |
| View all trainers in the center                | ✅ (name, color) | ✅    |
| View the full schedule (all trainers)          | ❌ own sessions only (Oct 6, 2026) | ✅    |
| Create / edit / cancel **own upcoming** sessions | ✅ (assigned branches and session types, up to 1 month ahead) | ✅ (any branch or session type, no limit) |
| Create / edit **own past** sessions            | ✅ within the edit window | ✅ any time |
| Create / edit / cancel **another trainer's** sessions | ❌        | ✅ (any branch, overrides assignments) |
| Create / edit / archive branches               | ❌               | ✅    |
| Add / edit / deactivate / remove trainers      | ❌               | ✅    |
| Assign / unassign a trainer's branches and session types | ❌      | ✅    |
| See **other** trainers' email and phone        | ❌               | ✅    |
| See **own** trainer profile (name, email, phone, color, branches, session types) | ✅ view only | ✅ |
| Edit **own** trainer profile                   | ❌ (the owner manages it) | ✅ |
| See **own** hourly fees, the additional fees assigned to them, and own income | ✅ | ✅ |
| See additional fees **not** assigned to them   | ❌               | ✅    |
| See **other** trainers' fees and income       | ❌               | ✅    |
| Manage session types, hourly fees and additional fees | ❌         | ✅    |
| Close / reopen a month                         | ❌               | ✅    |
| Edit center settings (name, timezone, edit window, currency, …) | ❌ | ✅ |
| Delete the center                              | ❌               | ✅    |
| Leave the center                               | ✅               | ❌ (must transfer or delete) |

## 4. How a trainer joins

Trainers need their own flowOS account, because every app runs as the signed-in user. The platform has no admin API for creating accounts from the browser, so the owner **invites by email** and the trainer **claims** the invite:

1. The owner adds a trainer: display name, email, optional phone and color, and the branches and session types they can book. The trainer row is created with status **invited**.
2. The trainer signs up for flowOS (or already has an account) with that same email, installs Roster, and opens it.
3. Roster sees a pending invite matching the signed-in email and shows "Join *Center name*?". Accepting links the trainer row to the user, and the status becomes **active**.

Inviting does not send an email in v1. The owner tells the trainer directly (in person or by chat), which avoids needing SMTP or an Edge Function.

**Trainers who never sign in:** the owner can still schedule sessions for an invited (unlinked) trainer, so the center can use Roster before every trainer has an account. Once the trainer joins, those sessions are already theirs.

## 5. Features

### v1 — MVP

**Centers (everyone)**
- A user can belong to **many centers**, with a different role in each: e.g. the owner of one center and a trainer at two others.
- A **center switcher** in the app header lists every center the user is an active member of, with their role in each. The last one opened is remembered.
- **Register a center** is always available from the switcher, so any user can register more centers and becomes owner of each.
- Pending invites show on every launch as a banner ("You're invited to *Center name*" with Join / Dismiss), not only when the user has no center.
- A trainer can **leave** a center. The owner can't, and must delete the center instead (ownership transfer is a later idea).

**Any kind of center (owner)**
- **Industry-neutral core.** Tables, rules and code use neutral names only (center, branch, member, session, session type). Nothing branches on the industry: a gym and a music school get exactly the same features.
- **Business type preset** when registering a center: Music school, Language center, Fitness / gym, Tutoring, Dance / martial arts, Sports academy, Art / coding / STEM, or **Other**. The preset only fills in two things, both editable later:
  - **Labels**: the words shown in the app (table in §1).
  - **Starter session types**: 2–4 suggested types with no fees, which the owner can accept, rename or skip. "Other" suggests none.
- **Custom labels** in center settings: the owner can rename **Center**, **Branch**, **Trainer** and **Session type**, singular and plural (e.g. "Coach / Coaches"). Every screen, button, empty state, message and the Overview summary uses the center's labels. Fixed words stay fixed: Owner, Session, Schedule, Income, Fees.
- **Labels are per center**, so a user who coaches at a gym and teaches at a language center sees "Coach" in one and "Teacher" in the other.
- Defaults when nothing is chosen: Center, Branch, Trainer, Session type.
- Other things that differ between businesses are already settings, not assumptions: timezone, currency, week start, default session length, past-session edit window.

**Center setup (owner)**
- First launch with no center and no invite → "Register your center" (name, business type, timezone, currency). The user becomes owner.
- Center settings: name, business type and **labels**, timezone, currency, default session length, week start day, **past-session edit window** (default 7 days).

**Branches (owner)**
- Create, edit, archive: name, address, short code (e.g. "D1"), color.
- Archived branches disappear from the booking form but stay on past sessions.
- After creating a branch, the owner is offered "Assign trainers now?". New branches are never assigned automatically.

**Trainers (owner)**
- Add (invite), edit, deactivate, remove.
- Deactivated trainers can't sign in to the center or book. Their past sessions stay.
- The owner appears in the list with an "Owner" badge and can't be removed.
- **Profile is owner-managed:** name, email, phone and color are edited only by the owner. Trainers can view their own profile but not change it.
- **Branch assignments:** the owner picks which branches each trainer can book at, and can change them at any time. A per-trainer switch, **"Can book at any branch"** (off by default), suits floating trainers.
- Unassigning a branch keeps the trainer's existing sessions there, and the owner is warned how many future sessions are affected.
- **Session type assignments:** the owner picks which session types each trainer can teach, and can change them at any time. There's no "any session type" switch: every session type is assigned explicitly. Each assignment can carry a trainer-specific hourly fee (see Fees).
- Unassigning a session type works like a branch: existing sessions stay, and the owner is warned about affected upcoming sessions. The trainer-specific fee is stored on the assignment, so once it's removed, that trainer's sessions of this type earn the session type's **default** fee in every month that isn't closed. The confirm dialog says so.

**Schedule (everyone)**
- **Week view** (default): days as columns, sessions as blocks colored by branch.
- **Day view**: branches as columns, which answers "who is at each branch today".
- Filters: branch, trainer, "only me" (owner). Trainers only see their own sessions (decided Oct 6, 2026, enforced by RLS), so they only get the branch filter.
- **Book a session:** **session type** (required, e.g. "Piano 1:1" or "Personal training"), branch, date, start–end time, optional title (e.g. "Grade 3", "Morning group") and note.
- **Branch choices:** a trainer only sees their assigned branches (or all branches if "Can book at any branch" is on). A trainer with no assigned branches sees "Ask your owner to assign you a branch" instead of the form. The owner can book anyone at any branch.
- **Session type choices:** a trainer only sees their assigned session types. With none assigned, they see "Ask your owner to assign you a session type" instead of the form. The owner can book anyone for any session type; unassigned ones are marked "Not assigned".
- Edit, or cancel (soft delete with status `cancelled`, so history stays).
- **Past sessions:** within the center's edit window (default 7 days), a trainer can edit their own past sessions (fix the times, mark one **missed**) and **create** sessions in the past to log one they forgot. After the window closes, only the owner can change or add them. Every session shows who last edited it and when.
- **Booking horizon:** trainers can book up to **one month ahead** (until the same date next month, in the center's timezone). The owner has no limit. In v1.1, "repeat weekly until" is capped the same way for trainers.
- **Conflict guard:** a trainer can't have two overlapping `scheduled` sessions, past or future. Enforced by the database, with a friendly message in the form.

**Fees (owner)**
- **Currency:** one per center, set in center settings (default `VND`). All amounts in that center use it.
- **Session types:** the owner defines the center's session types, e.g. "Piano 1:1" and "Theory" at a music school, or "Personal training" and "Yoga class" at a gym (starter types come from the business type preset). Each has a name and a **default hourly fee**. They can be archived (hidden from booking, kept on past sessions). After creating one, the owner is offered "Assign trainers now?". New session types are never assigned automatically.
- **Hourly fee by session type:** a session's hourly fee comes from its session type. When assigning a session type to a trainer, the owner can set a **trainer-specific hourly fee** (e.g. a senior trainer earns more for "Piano 1:1" or "Personal training"). Lookup: trainer's own fee for that session type → otherwise the session type's default fee.
- **Additional fees:** the owner defines as many as needed, each with:
  - **Name**, e.g. "Travel allowance D3", "Phone allowance", "Senior bonus".
  - **Amount** and **unit**: `per session`, `per hour`, or `per month`.
  - **Who:** all trainers, or selected trainers.
  - **Where:** all branches, or one branch (only sessions at that branch count). Only for per-session and per-hour fees.
  - **Active switch**, so a fee can be paused without deleting it.
- Examples: "Travel allowance D3: 50,000 per session at D3, all trainers"; "Senior bonus: 20,000 per hour, An and Bình"; "Phone allowance: 200,000 per month, all trainers".

**Income (everyone)**
- Income is calculated **per calendar month** (in the center's timezone), for one center at a time.
- **Only completed sessions count:** sessions with status `scheduled` that have **ended**. Upcoming, missed and cancelled sessions earn nothing, and there is no projected figure.
- **Formula per trainer per month:**
  - base = Σ (session hours × hourly fee for that session's session type), shown as one line per session type
  - \+ per-hour fees = Σ hours of matching completed sessions × amount
  - \+ per-session fees = number of matching completed sessions × amount
  - \+ per-month fees = the full amount, once, for **every month the trainer is active** in the center, even with no completed sessions. "Active in a month" = an active or invited member at any point in that month (between being added and being deactivated). No proration for partial months
- Hours use exact minutes (90 min = 1.5 h). Each line is rounded to the currency's smallest unit.
- **Trainer view ("My income"):** the month total, hours worked, and a breakdown with one line per session type and one line per **additional fee assigned to them**, plus hours by branch. Trainers never see fees that aren't assigned to them.
- **Owner view:** the same for themselves, plus a table of every trainer for the month (hours, base, additional fees, total) and the center total. Export CSV.
- **Many centers:** "My income" can show all the user's centers together, grouped by currency (totals are never added across currencies).
- **Closing a month:** the owner can **close** a past month. This saves that month's income lines as they are, and locks the month's sessions so nobody (owner included) can change them until the owner **reopens** it. Open months are always calculated live from current fees, so changing a fee also changes open past months. Closing a month is how the owner freezes the numbers they paid out.

**Overview tile**
- `getSummary()`: "3 sessions today · this month 32.5 h · ₫6,100,000" for the user's active center.

### v1.1

- **Repeat weekly** (built early, Oct 6, 2026, as fixed shifts: one or more weekdays): "repeat every week until <date>" creates one row per week, linked by a series id. Edit or cancel *this one* or *this and following*.
- **Copy week:** duplicate a trainer's (or the whole center's) week to the next week.
- **Hours report:** hours per branch and per trainer for any date range (not only whole months), for planning. Income already covers hours per month.
- **Travel buffer:** a center setting (e.g. 30 min) that warns when a trainer's back-to-back sessions are at different branches.

### Later ideas

- Branch opening hours, with bookings outside them blocked. (Center-wide opening hours were added Oct 6, 2026.)
- Trainer availability / time-off blocks.
- Approval mode: trainer bookings start as *pending* until the owner confirms.
- Customers on sessions (deferred Oct 6, 2026), called by the center's own label (Students, Members, Clients…). The lightest option is a list of names per session with autocomplete and no personal data; a full customer table and attendance would come after that.
- More label slots if centers need them (e.g. renaming "Session" to "Class" or "Shift").
- Realtime updates when someone else books (Supabase Realtime).
- Notifications (email/push) and an iCal feed per trainer.
- Several owners/managers per center, and ownership transfer.
- Booking horizon as a center setting instead of a fixed month.
- Fee conditions beyond branch and session type: weekend / evening / holiday fees.
- Fee history (effective dates), so open past months keep the fee that applied at the time without closing the month.
- Mark a closed month as **paid** per trainer, and simple payslips (PDF).

## 6. Milestones

Each milestone ends with `npm run check` passing, migrations applied to **dev** (`flow-os-app`) and tested before **prod** (`flow-os-prod`), and both Supabase advisors clean.

| #   | Milestone                    | Done when                                                                            |
| --- | ---------------------------- | ------------------------------------------------------------------------------------ |
| M0  | Docs & decisions             | These docs agreed; open questions answered (done Oct 6, 2026, D1–D8)                 |
| M1  | Schema + RLS                 | Migration for all v1 tables, helper functions, policies; RLS tested with 3 users (owner, trainer, outsider) |
| M2  | App shell + centers          | Manifest, root component, register-center flow with business type presets, labels used on every screen, center switcher, invite banner, center settings |
| M3  | Branches, session types & trainers | Owner CRUD screens; branch and session type assignments; invite and claim flow works end to end (fees on session types are entered here but only used from M5) |
| M4  | Schedule                     | Week and day views, booking form, conflict errors, filters                           |
| M5  | Fees & income                | Trainer-specific hourly fees; additional fees; income function tested against hand-worked examples; My income and owner views; close/reopen month; CSV export |
| M6  | Polish & ship v1             | Mobile pass, empty states, Overview summary, app README in `src/apps/roster/`        |
| M7  | v1.1                         | Repeat weekly, copy week, hours report, travel buffer                                |

## 7. Risks & platform notes

- **First multi-user app.** Every existing table is "own rows only". Roster is the first app whose rows are shared between users, so its RLS is more complex and must be tested carefully (M1).
- **Profiles are private.** `public.profiles` only lets users read their own row, so Roster can't show other users' platform display names. Roster keeps its own `display_name` on the trainer row instead.
- **Email matching relies on the JWT.** Claiming an invite compares the invite email with the signed-in user's email. That is only safe if emails are verified, so email confirmation must be **on** in production before v1 ships (it is already on the Phase 5 list).
- **Uninstalling isn't leaving.** Uninstalling Roster from the App Store only hides it for that user; the center's data stays. Leaving the center and deleting it are separate in-app actions.
- **Timezones.** All sessions are shown in the **center's timezone**, whatever the viewer's device says. This needs the dayjs `utc` + `timezone` plugins, which aren't in `libs/dayjs.ts` yet.
- **Language.** English only, with no i18n (decided Oct 6, 2026, same as the platform). Copy is written directly in components.
- **Money is calculated in the database.** One SQL function computes income lines, so the trainer view, the owner table, CSV export, `getSummary()` and month closing always agree. Amounts are stored as `numeric`, never floats, and shown with `Intl.NumberFormat` in the center's currency.
- **Fees are private.** Hourly fees and income must never reach other trainers through the colleague view, the schedule, or the income function. RLS tests in M1 and M5 must cover this.
- **Live fees change open months.** Without fee history, changing a fee also changes past months that aren't closed. The owner should close each month after paying; the UI says so on the fee form.
- **Labels must be used everywhere.** One hard-coded "Trainer" or "Branch" in a button breaks the illusion for a gym. All copy that mentions a labelled noun reads it from the center's labels (one helper, e.g. `useLabels()`), and the M6 polish pass checks every screen with a non-default preset. Write copy that doesn't depend on grammar the label can change: avoid "a/an" before a label ("Add trainer", not "Add a trainer") and use the stored plural instead of adding "s". Code and tables keep the neutral names; CSV exports use the labels in their headers, since owners read them.
- **No in-app routing.** An app is one root component, so screens (Schedule / Branches / Trainers / Settings) are switched with in-app tabs or state, not URLs. Check whether deep links are needed.

## 8. Decisions (Oct 6, 2026)

| #   | Question                                        | Decision                                                                                                   |
| --- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| D1  | Can trainers see each other's email/phone?      | **No.** Trainers see others' name, color and role only, and only their own sessions (Oct 6, 2026). They can view their own profile but not edit it; the owner manages all trainer details |
| D2  | Can trainers edit sessions that already happened? | **Yes, within an edit window** (default 7 days, set by the owner). After that only the owner can. Adds the `missed` status and "last edited by" tracking |
| D3  | Any branch, or only assigned branches?          | **Assigned branches by default.** The owner edits each trainer's assignments, can turn on "Can book at any branch" per trainer, and can override when booking for someone |
| D4  | Record trainees (customers) on sessions?        | **Not now.** Roster is for owners and trainers only; customers may be added later (see Later ideas)       |
| D5  | Can trainers create sessions in the past?       | **Yes, within the edit window**, same as editing                                                           |
| D6  | One center per user, or many?                   | **Many** in v1, with a center switcher; a user can own some centers and be a trainer in others             |
| D7  | How far ahead can trainers book?                | **Up to one month ahead.** No limit for the owner                                                          |
| D8  | Languages                                       | **English only, no i18n** in Roster or the platform                                                        |
| D9  | Fees and income                                 | **In v1.** Owner sets hourly fees and any number of additional fees; every user sees their own income per month (see §5) |
| D10 | Currency                                        | **VND by default, one currency per center**                                                                |
| D11 | What sets the hourly fee?                       | **The session type.** Each session type has a default hourly fee; the owner can override it per trainer. Sessions require a session type |
| D12 | Per-month fees                                  | **Paid every month the trainer is active**, even with no sessions. Everything else counts **completed sessions only** (no projected income) |
| D13 | What trainers see of fees                       | **Only fees assigned to them** (name, amount, total), never other fees                                     |
| D14 | Close month                                     | **In v1**                                                                                                  |
| D15 | Session types per trainer                        | **Assigned by the owner**, like branches (no "any session type" switch). The owner can override when booking for someone |
| D16 | Partial months                                  | **Full per-month fee**, no proration, for any month the trainer was active in                              |
| D17 | Only music centers?                             | **No, any center with this business model.** Industry-neutral core; per-center business type preset and custom labels for Center, Branch, Trainer and Session type |

## 9. Open questions

None right now.
