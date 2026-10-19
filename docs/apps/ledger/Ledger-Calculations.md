# Ledger: How numbers are calculated

The rules behind every number and chart in Ledger. All amounts are whole Vietnamese đồng (₫): there are no cents, and results are rounded to the nearest đồng.

## Months and days

- An expense belongs to the day it was spent (`spent_on`), not the day it was entered.
- Days are plain calendar dates in your own time zone. An expense on 2026/09/30 always counts toward September, wherever you open Ledger.
- "The current month" means the month containing today. "A past month" is any earlier month. Future months can't be chosen.

## Summary

| Number             | Rule                                                                                                                                                                              |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Month total        | The sum of every expense in the chosen month.                                                                                                                                     |
| vs. last month     | **Current month:** compared with the same days of last month, the 1st up to today's date. **Past month:** compared with the whole previous month. Up shows in red, down in green. |
| Daily average      | **Current month:** the total divided by the days so far, today included. **Past month:** the total divided by every day of the month.                                             |
| Number of expenses | How many expenses the month has.                                                                                                                                                  |

**Example.** On October 10, October's total so far is compared with September 1–10, not with all of September, so the comparison is fair halfway through a month.

## Monthly limit

Set in Settings; empty means no limit.

| Number       | Rule                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------ |
| Used         | The month total as a share of the limit.                                                   |
| Left / over  | The limit minus the total. Over the limit, the amount over shows in red.                   |
| Per day left | Current month only: what's left divided by the days left in the month, **today included**. |

**Example.** Limit 10.000.000 ₫, spent 6.000.000 ₫ by October 22. Left: 4.000.000 ₫. Days left, October 22–31: 10. About 400.000 ₫ per day.

## Charts

### Compared with last month

Two columns: last month's **whole** total, and the chosen month's total (so far, for the current month). Unlike the summary, this chart always uses last month's full total.

### Last 12 months

- One column per month: the chosen month and the 11 before it.
- The dashed line is the monthly average over the months that **had spending**. Months with nothing spent don't pull the average down.
- Clicking a column opens that month.

### Daily spending

- One column per day of the chosen month.
- The axis maximum is rounded up to 1, 2 or 5 times a power of ten (for example 2.000.000 rather than 1.730.000).
- Axis labels are compact, e.g. `1,5 Tr` for 1.500.000.

### Top spending

- Spending is added up per **main** category: a subcategory counts toward its parent (Electricity Bill counts toward Bills & Utilities).
- Categories are ranked by amount. The top five are shown on their own; the rest are combined into **Everything else** (gray).
- Each share is that category's amount divided by the month total.
- Each slice uses its category's color, matching its icon.

## Category search

In **Select category**, a main category stays in the list when its own name or any of its subcategories' names match. When the main category itself matches, all its subcategories show; otherwise only the matching ones do.
