# Roster — Design Suggestions

Roster runs inside the flowOS shell (top bar, sidebar), so it follows the platform look: Supabase-style dashboard, Ant Design v6, token-backed Tailwind classes, light and dark themes, mobile first. These are suggestions to agree on before M2.

## Navigation inside the app

An app is one root component, so Roster uses an in-app tab bar under its header:

| Tab        | Trainer | Owner |
| ---------- | ------- | ----- |
| Schedule   | ✅      | ✅    |
| My week    | ✅      | ✅    |
| Income     | ✅ (own) | ✅ (own + all trainers) |
| Branches   | —       | ✅    |
| Trainers   | —       | ✅    |
| Fees       | —       | ✅    |
| Settings   | —       | ✅    |

Trainers get three tabs, which keeps their experience simple. On phones, trainers get a bottom bar with those three. The owner's bottom bar shows Schedule, My week and Income, plus **More** (Branches, Trainers, Fees, Settings).

**My profile (trainer, read-only):** clicking their name or role badge in the header opens a small panel with their name, email, phone, color, assigned branches, assigned session types with their hourly fee for each, and the additional fees assigned to them. There is no Edit button, only the hint "Contact your owner to change these details."

Header: **center switcher** · the user's role badge in that center (`Owner` / `Trainer`) · a primary **+ Book session** button (always visible, a floating button on mobile).

**Center switcher:** a dropdown with the center name as its label. Each item shows the center name and the user's role there, and the last item is "+ Register a center". The tabs follow the role in the selected center, so a user who owns one center and trains at another sees all seven tabs in the first and three in the second. On phones the switcher sits above the tabs as a full-width select.

**Invite banner:** when there are pending invites, a banner sits above the tabs on every screen: "You're invited to *Center name*" [Join] [Dismiss]. With several invites it reads "You have 2 invites" and opens a list.

## First-run flows

```
open Roster
   │
   ├─ has an active membership ─────────────► Schedule
   │
   ├─ has pending invites (email match) ────► "You're invited to <Center>"  [Join] [Not now]
   │                                              └─ Join → Schedule
   │
   └─ nothing ──────────────────────────────► Empty state
                                                "Register your center" [Get started]
                                                "Waiting for an invite? Ask your owner to add <your email>."
```

**Register center:** a short two-step form.

1. **Your business:** center name, then **business type** as a grid of cards (Music school, Language center, Fitness / gym, Tutoring, Dance / martial arts, Sports academy, Art / coding / STEM, Other). Picking one shows a preview of its words underneath: "You'll see: Gym · Locations · Coaches · Session types". An "Edit words" link opens the labels form inline.
2. **Basics:** timezone (defaults to the browser's), currency (default VND), and the **starter session types** for that business type as checkboxes, each with an optional default hourly fee. "Other" skips the list.

There is no setup checklist on the Schedule (removed Oct 6, 2026 as redundant); the empty Branches and Trainers screens already point the owner to the next step.

## Screens

### Schedule (week view, default on desktop)

```
┌ Roster · Melody Center ─────────────── Owner ── [+ Book session] ┐
│ Schedule | My week | Branches | Trainers | Settings             │
├──────────────────────────────────────────────────────────────────┤
│ ‹ Oct 6 – 12, 2026 › [Today]   Week|Day   Branch ▾  Trainer ▾  ☐ Only me │
├──────┬────────┬────────┬────────┬────────┬────────┬────────┬─────┤
│      │ Mon 6  │ Tue 7  │ Wed 8  │ Thu 9  │ Fri 10 │ Sat 11 │ Sun │
│ 08:00│        │▌D1 An  │        │        │        │▌D2 An  │     │
│ 09:00│▌D2 Bình│▌Piano  │        │▌D1 Chi │        │▌D1 Bình│     │
│ 10:00│        │        │▌D3 An  │        │        │        │     │
│  …   │        │        │        │        │        │        │     │
└──────┴────────┴────────┴────────┴────────┴────────┴────────┴─────┘
```

- Block = left stripe in the **branch color**, then branch code, trainer name and title. Hover/tap opens a popover with details and Edit / Cancel.
- Your own sessions are slightly emphasized (filled background), others are outlined.
- Overlapping blocks for different trainers sit side by side in the column.
- Click-drag on an empty slot to start booking with the time pre-filled (desktop only, and never the only way to book).
- Hours shown: default 07:00–22:00, scrollable. Later it can follow branch opening hours.

### Schedule (day view)

Columns are **branches** instead of days. This is the screen to check "who is at each branch today" at a glance. It's the default on tablets.

### My week (mobile-first agenda)

A vertical list grouped by day, one card per session:

```
Today · Mon 6
┌──────────────────────────────┐
│ 09:00–10:30  ● D2 Thủ Đức     │
│ Piano 1:1 · Grade 3           │
└──────────────────────────────┘
Tue 7
┌──────────────────────────────┐
│ 08:00–09:00  ● D1 Quận 1      │
└──────────────────────────────┘
```

This is the default view on phones. A wide 7-column grid doesn't fit a 375px screen, so phones get an agenda list, and the full Schedule is still reachable with a day-by-day swipe.

### Book / edit session (drawer on desktop, bottom sheet on mobile)

Fields: **Trainer** (owner only; trainers are fixed to themselves) · **Branch** (radio cards with color + code) · **Date** · **Start / End** (End defaults to Start + center default length) · Title · Note · v1.1 *Repeat weekly until*.

- **Session type** comes first and is required, remembering the trainer's last choice. A trainer only sees their assigned session types (preselected if there's only one). The owner sees all active session types, with ones the chosen trainer isn't assigned marked "Not assigned", still selectable. Names only, never fees.
- **Branch options:** for a trainer, only their assigned branches (all branches if "Can book at any branch" is on). If there's only one, it's preselected. For the owner, every active branch; branches the chosen trainer isn't assigned to are marked "Not assigned", but the owner can still pick them.
- **Date range for trainers:** the date picker only allows dates from the edit window start (e.g. 7 days ago) to one month ahead. Disabled dates show a tooltip: "You can book up to one month ahead" or "Older sessions can only be added by the owner". The owner's picker has no limits.
- **No assigned branches or session types:** the drawer shows an empty state instead of the form, e.g. "You aren't assigned to any session type yet. Ask your owner."
- Check for conflicts live as the times change, and show an inline warning such as "You're already at D1 from 14:00 to 15:00". The database stays the final guard.

**Past sessions:** opening a past session shows a **Status** control (`Happened` / `Missed`) as well as the time fields.
- Inside the edit window, a trainer sees "Editable until Oct 13" under the title.
- After the window closes, a trainer sees the session read-only with "Locked. Only the owner can change this session".
- Every session popover ends with a small line such as "Edited by An · 2 hours ago" whenever it was changed after creation.
- Missed sessions show in the grid with a dashed border and a "Missed" badge.
- v1.1 travel warning (not blocking): "Your previous session ends at D2 at 13:45 — only 15 min to get to D1".

### Branches (owner)

A table on desktop, cards on mobile: color dot, code, name, address, number of assigned trainers, sessions this week, actions (Edit, Archive). There's a "Show archived" toggle.

After creating a branch, a prompt asks "Assign trainers to <code> now?" with a multi-select of trainers.

### Trainers (owner)

A table: avatar (initials on the member color), name, email, phone, **branches** (code chips, or an "Any branch" chip), **session types** (name chips; a small ₫ mark on ones with a trainer-specific fee), status badge (`Owner`, `Active`, `Invited`, `Inactive`), hours this week, actions.

- **Add / Edit trainer** modal: name, email, phone, color, then:
  - a **Branches** section with a checkbox per active branch and a "Can book at any branch" switch, which disables the checkboxes when on;
  - a **Session types** section: one row per active session type with a checkbox (assigned or not) and, when checked, an hourly fee field showing the default as a placeholder ("Default ₫150,000"). Leave it empty to use the default, or type an amount for a trainer-specific fee.
- **Unassigning a session type** shows a confirm like the branch one, adding: "An's sessions of this type will be paid at the default fee (₫150,000) in open months."
- **Unassigning a branch** that still has future sessions for that trainer shows a confirm: "An has 4 upcoming sessions at D2. They'll stay booked; An just can't add new ones there."
- After adding a trainer, the modal shows the next step: "Ask <name> to sign in to flowOS with <email> and open Roster", with a copy-to-clipboard button for that message.
- Clicking a trainer opens their week (the Schedule filtered to them).

### Income (everyone)

A month picker (‹ October 2026 ›) at the top. The month is shown as **Open** or **Closed 🔒** next to the picker.

**My income** (every user's own figures):

```
┌ October 2026 · Open ─────────────────────────────┐
│  Earned                                          │
│  ₫6,100,000                                      │
│  32.5 h · 26 completed sessions                  │
├──────────────────────────────────────────────────┤
│ Piano 1:1    20 h × ₫150,000        ₫3,000,000   │
│ Group class  12.5 h × ₫120,000      ₫1,500,000   │
│ Senior bonus  32.5 h × ₫20,000        ₫650,000   │
│ Travel allowance D3  15 × ₫50,000     ₫750,000   │
│ Phone allowance  1 month × ₫200,000   ₫200,000   │
├──────────────────────────────────────────────────┤
│ By branch   D1 12 h · D2 8 h · D3 12.5 h         │
└──────────────────────────────────────────────────┘
```

- The total first, then one line per session type, then one line per additional fee **assigned to this user**, then hours by branch. Only completed sessions count, so there is no projected figure.
- In the current month, a hint under the total says "Completed sessions up to now. 10 upcoming sessions will count once they're done."
- Missed and cancelled sessions don't appear in the lines, but a small note says "2 missed sessions not counted".
- **All centers** toggle (only shown with 2+ centers): one card per center, with totals grouped by currency.

**Trainers** (owner only, below "My income"): one row per trainer with hours, base, additional fees and total, a center total in the footer, and **Export CSV**. Clicking a row opens that trainer's breakdown in a drawer.

**Close month** (owner, past months only): a button opens a confirm: "Close October 2026? Income will be saved as shown and sessions in this month will be locked." A closed month shows **Reopen** instead. In the schedule, sessions in a closed month show a lock icon and open read-only.

### Fees (owner)

- **Session types** table first: name, default hourly fee ("₫150,000 / h"), number of assigned trainers, actions (Edit, Archive). **Add session type** modal: name and default hourly fee; after saving, a prompt asks "Assign trainers to Piano 1:1 now?" with a multi-select. A link under the table: "Assign session types and set trainer-specific fees in Trainers".
- **Additional fees** table: name, amount + unit ("₫50,000 / session"), who ("All trainers" or name chips), where ("All branches" or a branch code), active switch, actions.
- **Add / Edit fee** modal: name · amount · unit (`Per session` / `Per hour` / `Per month`) · who (All trainers / Selected → multi-select) · where (All branches / one branch; hidden for per-month) · active.
- The fee form shows a note: "Changes apply to all open months, including past ones. Close a month to keep its numbers."

### Settings (owner)

Center name, **business type and labels**, timezone, **currency** (select, default VND), week start, default session length, **past-session edit window** (number of days, default 7; 0 = trainers can't edit past sessions), v1.1 travel buffer. A danger zone with **Delete center**, which requires typing the center name.

**Labels** section: four rows (Center, Branch, Trainer, Session type), each with a singular and a plural field, prefilled from the business type. Changing the business type asks "Use the Fitness / gym words?" instead of silently overwriting custom words. A live preview shows a tab bar and a button with the new words. "Reset to defaults" restores the preset.

## Labels on screen

Every mention of a labelled noun uses the center's words. Examples for a gym using the Fitness preset (Gym · Location · Coach · Session type):

| Default wording                          | Fitness preset                             |
| ---------------------------------------- | ------------------------------------------ |
| Tabs: Branches, Trainers                 | Tabs: Locations, Coaches                   |
| "Add trainer"                            | "Add coach"                                |
| "Ask your owner to assign you a branch"  | "Ask your owner to assign you a location"  |
| Filters: Branch ▾  Trainer ▾             | Filters: Location ▾  Coach ▾               |

The mockups in this doc use a music school with the default words (Center, Branch, Trainer), so "Piano 1:1" and "Grade 3" are sample data, not fixed wording. Fixed words never change: Owner, Session, Schedule, My week, Income, Fees, Settings.

## Visual suggestions

- Session blocks show the session type as text ("Piano 1:1", "Yoga class"). Session types have no color of their own.
- **Branch color is the main visual key** in every schedule view. Trainer color is only used for avatars. Use one color system for one meaning, so the two never compete.
- Colors are generated (golden-angle hues at fixed saturation and lightness). New branches and trainers get the hue farthest from the ones already used; the picker offers more generated swatches and a custom color (changed Oct 6, 2026).
- Status styles: cancelled sessions are shown struck through and at 50% opacity (only when "Show cancelled" is on). Missed sessions get a dashed border and a "Missed" badge. Invited trainers use the `warning` token.
- Use the platform's mono status badges for roles and statuses, matching the rest of flowOS.
- Money is right-aligned with tabular numerals and formatted with the center currency (`₫6,100,000`). Never show amounts in a color that implies good/bad; income isn't a status.
- Times are always shown in the center timezone. If the device timezone differs, show a small hint in the header, e.g. "Times in Asia/Ho_Chi_Minh".
- Empty states use the platform `EmptyState` molecule with a single clear action.

## Manifest (proposal)

| Field         | Value                                                                  |
| ------------- | ---------------------------------------------------------------------- |
| `name`        | Roster                                                                 |
| `tagline`     | Who works where, and when                                              |
| `description` | Schedule staff across all your branches and see what everyone earns. For music schools, language centers, gyms, tutoring centers, studios and any business whose staff move between branches. Owners manage branches, staff and fees; staff book their own sessions. |
| `icon`        | lucide `CalendarRange` (or `CalendarClock`)                            |
| `category`    | Productivity                                                           |
| `getSummary`  | "3 sessions today · this month 32.5 h · ₫6,100,000" (fixed words only, so it reads right for every center) |

All copy is English and written directly in the components (D8, no i18n).

## Accessibility

- Every session block is a real button with an accessible label ("Piano 1:1, Grade 3, An, D1, Tuesday 08:00 to 09:00").
- The grid can be navigated with the keyboard (arrow keys between days/slots), and Escape closes the drawer.
- Never rely on color alone: always show the branch code next to its color.
