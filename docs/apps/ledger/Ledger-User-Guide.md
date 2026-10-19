# Ledger: User guide

How to use every screen in Ledger. For the rules behind the numbers, see [How numbers are calculated](Ledger-Calculations).

## Getting started

1. Sign in to flowOS.
2. Open the **App Store**, find **Ledger** and install it.
3. Open Ledger from the sidebar or the Overview. It opens full screen.

To leave, choose **Back to flowOS** (account menu on desktop, **flowOS** in the bottom bar on phones, or the Settings page). It asks for confirmation, then returns you to the flowOS Overview. You stay signed in.

## Getting around

Ledger has three pages:

| Page      | Address                 | What it shows                               |
| --------- | ----------------------- | ------------------------------------------- |
| Dashboard | `/apps/ledger`          | Your month at a glance                      |
| Expenses  | `/apps/ledger/expenses` | Every expense of the month, day by day      |
| Settings  | `/apps/ledger/settings` | Monthly limit, your account, Back to flowOS |

Any other address inside Ledger takes you to the Dashboard.

**On desktop** (640px wide and up), the header has the app name (links to the Dashboard), **Dashboard** and **Expenses** tabs, and your account menu (your email, **Settings**, **Back to flowOS**).

**On phones** there is no top bar. A bar at the bottom of the screen has **Dashboard**, **Expenses**, a raised round **+** (Add expense), **Settings** and **flowOS** (Back to flowOS). The active tab is green.

Each page starts with its title and a one-line description, so you always know where you are.

### Choosing a month

The Dashboard and Expenses both show one month at a time. The month picker has:

- **‹** previous month and **›** next month,
- the month itself (click to pick from a calendar),
- **Today**, to jump back to the current month.

Future months can't be picked: **›** and **Today** are disabled on the current month.

The chosen month is kept in the address (`?month=2026-09`). Switching between Dashboard and Expenses keeps it, and so does reloading the page or sharing the link. Without it, Ledger shows the current month.

## Adding an expense

Open the expense dialog from:

- **Add expense** on the Dashboard or Expenses (desktop). If you scroll that button out of view, a second **Add expense** appears in the header.
- The round **+** in the bottom bar (phones), on any page.

The dialog always opens empty, with today's date.

| Field    | How it works                                                                                                                                                                     |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Amount   | In đồng (₫), whole numbers only. You can type a sum (see below). Must be more than 0.                                                                                            |
| Category | Opens **Select category**: search by name, subcategories are indented under their parent, the chosen one is checked. Picking one closes it. See [Categories](Ledger-Categories). |
| Note     | Optional, up to 200 characters. Enter adds a new line.                                                                                                                           |
| Date     | Today by default. Pick any day from the calendar.                                                                                                                                |

Click **Add expense** to save. Pressing Enter never saves the dialog; only the button does.

After saving, Ledger shows the month the expense belongs to. For example, if you add an expense dated last month, the page switches to last month.

### Typing a sum in the amount field

The amount field works like a small calculator:

- Type `50000+20000-5000` and it shows `50.000 + 20.000 − 5.000`, with the result **65.000 ₫** below it.
- Operators: **+**, **−**, **×**, **÷**. Multiplication and division happen before addition and subtraction.
- On a keyboard you can also type `-`, `*` or `x`, and `/` or `:`.
- On phones, the number keyboard opens with a row of **+ − × ÷ =** buttons under the field.
- **=**, Enter, or leaving the field replaces the sum with its result.
- The saved amount is the result, rounded to whole đồng. Dividing by zero, or a result of 0 or less, shows "The amount must be more than 0".

## Editing and deleting

On **Expenses**, every expense has two buttons:

- ✏️ **Edit** opens it in the expense dialog. **Save changes** stays disabled until you change something.
- 🗑️ **Delete** asks "Delete this expense?" and removes it once you confirm. The dialog stays open if deleting fails.

The edit dialog also has a **Delete** button on the left, which asks the same confirmation.

**Recent expenses** on the Dashboard is display only; use **See all** to open Expenses.

## Dashboard

From top to bottom:

1. **Summary**: the month's total, compared with last month (up in red, down in green, with an arrow). Then the monthly limit (how much is used, what's left or how much you're over, a progress bar, and in the current month about how much you can still spend per day). Without a limit, a link to Settings. Then the daily average and the number of expenses.
2. **Compared with last month**: two columns, last month's whole total (gray) and this month's (green), each labelled with its month (`09/2026`) and amount.
3. **Last 12 months**: one column per month ending with the chosen month (chosen month in green) and a dashed line at the monthly average. Click a column to open that month.
4. **Daily spending**: one column per day of the month. Hover, focus or tap a column to see the day and amount.
5. **Top spending**: a doughnut chart of your top five categories, with "Everything else" for the rest. The list beside it doubles as the legend, with each category's icon, name, amount and share. Subcategories count toward their main category.
6. **Recent expenses**: the 5 latest, with **See all**.

Every section stays visible with its own message when there's nothing to show.

## Expenses

The month's total (with **Add expense** next to it on desktop), the month picker, then every expense of the month grouped by day, newest first. Each day shows its total; each expense shows its category icon and name, note and amount.

## Settings

- **Monthly limit**: a plain amount in đồng (no sums here). Leave it empty for no limit. **Save** and **Cancel** appear when you change it; **Remove limit** clears a saved limit. Your limit follows your account to every device.
- **Account**: your flowOS sign-in email (read only).
- **Back to flowOS**.

## On phones

- Dialogs open as bottom sheets that slide up from the bottom of the screen.
- The date and month calendars also open as bottom sheets, with bigger day cells.
- The category search box and the note field use 16px text so iOS doesn't zoom in.
