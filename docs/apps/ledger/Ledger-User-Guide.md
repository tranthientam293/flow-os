# Ledger: User guide

How to use every screen in Ledger. For the rules behind the numbers, see [How numbers are calculated](Ledger-Calculations).

## Getting started

1. Sign in to flowOS.
2. Open the **App Store**, find **Ledger** and install it.
3. Open Ledger from the sidebar or the Overview. It opens full screen.

To leave, choose **Back to flowOS** (account menu on desktop, or the Settings page). It asks for confirmation, then returns you to the flowOS Overview. You stay signed in.

## Getting around

Ledger has these pages:

| Page      | Address                 | What it shows                               |
| --------- | ----------------------- | ------------------------------------------- |
| Dashboard | `/apps/ledger`          | Your month at a glance                      |
| Expenses  | `/apps/ledger/expenses` | Every expense of the month, day by day      |
| Funds     | `/apps/ledger/funds`    | The shared funds you're in                  |
| Fund      | `/apps/ledger/funds/…`  | One fund: balance, transactions, members    |
| Settings  | `/apps/ledger/settings` | Monthly limit, your account, Back to flowOS |

Any other address inside Ledger takes you to the Dashboard.

**On desktop** (640px wide and up), the header has the app name (links to the Dashboard), **Dashboard**, **Expenses** and **Funds** tabs, and your account menu (your email, **Settings**, **Back to flowOS**).

**On phones** there is no top bar. A bar at the bottom of the screen has **Dashboard**, **Expenses**, a raised round **+** (Add expense), **Funds** and **Settings** (which has Back to flowOS). The active tab is green.

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

To see one category only, tap **All categories** (next to the month picker) and pick it. The list has top-level categories only, and each includes its subcategories (Transportation also shows Vehicle Maintenance). Searching a subcategory's name finds its parent. The total above shows what you spent in that category. Tap ✕ to clear the filter.

On phones the button shows only the filter icon, with a green dot while a filter is on. Tap it, pick a category, then tap **Apply**; **Clear** removes the filter. Closing the dialog without either keeps the filter as it was. The filter is kept in the address (`?category=transportation`), so reloading keeps it.

## Funds

A fund is money you share with other people: a trip, a household pot, a team kitty. **Funds** lists the ones you're in, each with its balance; **Owner** marks the ones you own.

### Creating a fund and inviting people

1. On **Funds**, tap **New fund**, give it a name (and a note if you like), then **Create fund**. You are its owner.
2. On the fund's page, tap **Members** (the people icon with a count), type someone's flowOS email (and a name, or leave it empty to use their flowOS name), then **Invite**. They show as **Invited** until they answer. You can invite someone before they have a flowOS account; they see the invitation once they sign up with that email.
3. The invited person sees it under **Invitations** at the top of **Funds**, with who invited them. **Accept** joins the fund and opens it; **Decline** drops the invitation. Until they accept, they can't see the fund and nobody can record money for them.
4. To cancel an invitation, or remove someone who has joined, tap the button on their row. A removed member can no longer see the fund, but their transactions stay, marked "(removed)". You can invite them (or someone who declined) again.

Only the owner invites or removes people, edits the fund's name and note (✏️) and deletes the fund (🗑️, which deletes everything in it for everyone).

### Putting money in and using it

On a fund's page, tap **Put money in** or **Use money**. Pick who the money is from (or who used it; you by default), the amount (sums work, as for expenses), a note and the date (today or earlier; future days can't be picked). Any member can do this.

On phones, the round **+** in the bottom bar does this on a fund's page: it opens a new transaction with a **Put money in** / **Use money** switch at the top (Put money in to start), whichever tab you're on. On the Funds list it creates a fund. Everywhere else it adds an expense. On phones that + replaces the page's own **New fund**, **Put money in** and **Use money** buttons, which are hidden.

Each transaction shows:

- whose money it is, and whether it was **put in** (green, +) or **used** (red, −),
- the note,
- **Added by** whoever recorded it (who changed it later is in History),
- the amount, under its day (each day shows its net change).

The card at the top shows the **Balance** (put in − used; red below 0) and the totals **Put in** and **Used**. **Members** (top right) opens the list of people in the fund, with what each put in and used.

The transactions are split into two tabs: **In** (money put in, shown first) and **Out** (money used).

### Editing, deleting and history

Only the person who added a transaction can ✏️ edit or 🗑️ delete it (the owner too, but only for their own); everyone can see its history. A deleted transaction no longer counts toward the balance, but it isn't gone: turn on **Show deleted** to see it struck through.

Tap 🕘 (History) on any transaction to see every change: who added it and with what values, each edit with the old and new value of every field that changed, and who deleted it. Ledger records this itself, so it can't be skipped or rewritten.

## Settings

- **Monthly limit**: a plain amount in đồng (no sums here). Leave it empty for no limit. **Save** and **Cancel** appear when you change it; **Remove limit** clears a saved limit. Your limit follows your account to every device.
- **Account**: your flowOS sign-in email (read only).
- **Back to flowOS**.

## On phones

- Dialogs open as bottom sheets that slide up from the bottom of the screen.
- The date and month calendars also open as bottom sheets, with bigger day cells.
- The category search box and the note field use 16px text so iOS doesn't zoom in.
