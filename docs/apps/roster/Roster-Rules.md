# Roster: Rules

The rules Roster enforces, many of them in the database itself. The [Changelog](Roster-Changelog) says when each one changed.

## Centers

- Only Vietnam time (`Asia/Ho_Chi_Minh`, GMT+7) is supported.
- Every date-based rule uses the center's time zone.

## Who books and changes sessions

- Sessions can be booked, edited, cancelled, restored, completed, deleted and restored from Deleted only while they start in the center's **current month** (1st to last day). Earlier and later months are locked for everyone.
- Within the current month, the **owner** can act on any session and a **trainer** on their own sessions only.
- Only the owner, and only in **Manage centers**, books for another trainer. **My schedule** always books the signed-in person, owners who train included.
- A trainer books at the branches they're assigned to, or at any branch when set to "any branch".
- Archived branches and inactive trainers can't be booked.

## Session time

- A session lies within the center's opening hours and lasts at most 12 hours.
- It lasts at least 1 minute, or at least its session type's minimum length.
- A new booking starts with the center's default session length, stretched to the type's minimum if that's longer. Changing the start keeps the length.
- **A trainer can't be in two places at once:** scheduled and completed sessions that aren't deleted can't overlap for the same trainer. Different trainers can share a time.

## Session types and pay

| Pay basis                             | Salary                                                            |
| ------------------------------------- | ----------------------------------------------------------------- |
| **Per shift** (default for new types) | The base salary once per session, whatever its length or trainees |
| **Per hour**                          | Base salary × hours                                               |
| **Per trainee**                       | Base salary × trainees                                            |

- A session without a type counts as per hour. Every session has at least 1 trainee.
- A trainer with no session types assigned can teach all of them.
- Picking a type fills in the title, unless the title was typed by hand.
- **Which rate applies**, first that's set: the trainer's own salary for the type (My settings), then the owner's reference rate for that trainer, then the type's default salary.
- The owner's rate for a trainer is saved as entered; later changes to the type's default don't change it.
- Owners aren't paid a salary. They can be given session types (without salaries) to appear as a trainer.

## Status

- **Cancel** keeps the session on the schedule, marked cancelled. It can be restored.
- **Complete** goes through the checkout, once the session has started. The session's trainer enters the salary (prefilled from their rate); the owner sees it read only. Whoever may check out the session edits the **fees** (extra pay such as travel). Total pay = salary + fees.
- Completed and cancelled sessions aren't edited, only restored. Restoring a completed session clears its salary and fees.
- Every change is recorded in the session's history by a database trigger.

## Deleting

- Deleting is a **soft delete**: the session leaves the schedule, income and the overlap check, but nothing is erased.
- The trainer finds it in **My schedule → Deleted** and can restore it while it's in the current month and its time is still free.
- Deleted sessions can't be edited, completed or reopened.

## Repeats

- A repeat books the same time on chosen weekdays, **every week** (default) or **every month**, in the center's time zone.
- **Weekly:** books through the end of the current week, and adds the next week on the week's last day (Sunday, for weeks starting on Monday).
- **Monthly:** books through the end of the current month, and adds the next month on the month's last day.
- An hourly job adds the next period. Days where the trainer is busy are skipped.
- **Apply now** books the **whole current month**, days already past included, and removes the repeat's untouched sessions in later months.
- **Editing or stopping** applies from now on: upcoming sessions from the repeat that nobody changed are rebooked or removed. Sessions already held, edited by hand, or deleted stay.
- A repeat never books a day it already has a session for, deleted ones included, so deleting one of its sessions keeps that day free.
- A repeat's trainer can't be changed; stop it and start a new one.

## Income

- **My schedule → Income** shows only your own completed sessions in one month, at every center including ones you own.
- Months after the current one are disabled. The filter applies on **Apply**.
- Fees can be changed while the session is in the current month.

## Schedule

- My schedule shows only your own sessions, owners who train included.
- A center's filters last while it's open; every visit starts on all trainers and branches.
- Picking no status shows every status.
- New branches and trainers get the most distinct unused color automatically.
- The Overview tile in flowOS shows the center you opened last.
