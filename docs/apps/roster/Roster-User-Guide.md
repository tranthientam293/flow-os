# Roster: User guide

How to use Roster as an owner or a trainer. For the exact rules, see [Rules](Roster-Rules).

## Getting started

### As an owner

1. Install **Roster** from the flowOS App Store and open it.
2. Go to **Manage centers** and choose **Create a center**. It opens on the **Branches** tab.
3. Add your **branches**.
4. Add **session types** (for example "Piano 1:1"), each with how it pays and its minimum length.
5. Invite **trainers** by email from the **Trainers** tab, choosing the branches and session types each may book. Copy the invite message and send it to them.
6. Check **Settings**: opening hours, week start and default session length.

### As a trainer

1. Sign up to flowOS with **the email your owner invited**, then install and open **Roster**.
2. Click the **invitation bell** in the header and accept the invitation. The center's schedule opens.
3. Book your sessions from **My schedule**.

## Getting around

| Section        | Address                 | Who                            | What                                                                                 |
| -------------- | ----------------------- | ------------------------------ | ------------------------------------------------------------------------------------ |
| Manage centers | `/apps/roster/centers`  | Owners                         | "Centers you own": a card per center with shortcuts to its tabs, and Create a center |
| My schedule    | `/apps/roster/work`     | Trainers, and owners who train | "Your trainer schedule": your sessions at every center                               |
| My settings    | `/apps/roster/settings` | Everyone                       | Profile, salary, preferences, your centers, Back to flowOS                           |

Opening `/apps/roster` takes owners to Manage centers and everyone else to My schedule.

**On desktop** the header has Manage centers / My schedule, the invitation bell and the account menu (My settings, Back to flowOS).

**On phones** the top shows the app name and the bell; a bottom bar has **Centers**, **My schedule**, a raised round **+** (create a session), **Settings** and **flowOS** (Back to flowOS).

## Managing a center (owners)

Open a center from Manage centers. Its tabs:

| Tab           | What you do there                                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Trainers      | Invite, edit, set branches and session types (with a reference salary per type), see the registered date, deactivate or remove |
| Branches      | Add, edit, archive and restore branches. Each gets its own color automatically                                                 |
| Session types | A table of types (name, pay basis, default salary, minimum length); add or edit in a dialog                                    |
| Settings      | Center name, time zone (Vietnam), week start, opening hours, default session length; **Me as a trainer**; delete the center    |

**Me as a trainer** ("Show me in the trainer list when booking sessions") makes you bookable at your own center, with the session types you teach. The center then also shows in your My schedule. Owners aren't paid a salary.

## My schedule (trainers)

| Tab      | Address                     | What                                                                         |
| -------- | --------------------------- | ---------------------------------------------------------------------------- |
| Calendar | `/apps/roster/work`         | Your sessions at every center, as a **Calendar** (Day or Week) or a **List** |
| Income   | `/apps/roster/work/income`  | Your completed sessions in a month, with salary, fees and totals             |
| Repeats  | `/apps/roster/work/repeats` | Your active repeats, grouped by center (shown while you have any)            |
| Deleted  | `/apps/roster/work/deleted` | Sessions you deleted, newest first, with **Restore**                         |

The Calendar opens as a week grid on desktop and a list on phones until you choose. **Filters** narrow by center and status (scheduled, completed, cancelled, missed); they apply on **Apply**.

Session colors show their status: blue scheduled, green completed, red cancelled, amber missed.

### Booking a session

Click an empty time in the calendar, or **+** / **Create**. The form has:

- **Center** (when you train at several) and **branch**.
- **Session type** (optional): fills in the title and sets the minimum length.
- **Date**, **start** and **end** time. A new booking starts with the center's default length.
- **Trainees** (at least 1), **title** and **note**.
- **Repeat**: off for a one-time session. Turn it on to repeat **every week** or **every month** on chosen weekdays, from a start date.

### Working with a session

Click a session to see its details and actions:

| Action         | When                                      | Does                                                   |
| -------------- | ----------------------------------------- | ------------------------------------------------------ |
| Edit           | Scheduled or missed, in the current month | Change it                                              |
| Complete       | Scheduled and already started             | Opens the checkout: your salary and any extra fees     |
| Checkout       | Completed                                 | Review or change salary and fees (current month)       |
| Cancel         | Scheduled                                 | Keeps it on the schedule, marked cancelled             |
| Restore        | Cancelled, missed or completed            | Back to scheduled (clears pay for a completed session) |
| Delete         | In the current month                      | Removes it from the schedule; restore it from Deleted  |
| Stop repeating | A session from a repeat                   | Stops the repeat; sessions already held stay           |

The drawer also shows the session's **History**: who booked, edited, completed, cancelled, restored or deleted it, and when.

### Income

Pick a **month** (future months are disabled) and optionally a **center**, then **Apply**. Every completed session is listed with date, time, center, branch, title, hours, salary, fees and total, with the month's totals above. Click a row for its breakdown; the ✏️ icon reopens its checkout while the session is in the current month. On phones the filter opens from a **Filter** button.

### Repeats

Each repeat shows its days, time, branch, type or title, trainees, period and the date it's booked through:

- **Edit** changes days, time, branch, type, trainees, title or note (not the trainer).
- **Apply now** books the repeat for the whole current month right away.
- **Stop** ends it. Upcoming sessions nobody changed are removed; others stay.

## My settings

- **My profile**: your name and phone at each center (one tab per center).
- **My salary**: your salary for each session type you teach, with the owner's reference rate next to it. It prefills your checkouts.
- **Preferences**: your default calendar view.
- **My centers**: leave a center where you're a trainer.
- **Back to flowOS**.
