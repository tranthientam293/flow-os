# Ledger

**Ledger** is a flowOS app for tracking daily expenses: write down what you spend each day and see where your money goes. It is modeled on Money Lover's expense tracking, with amounts in Vietnamese đồng (₫).

| Field        | Value                                                                                                                                        |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| App id       | `ledger` (folder `src/apps/ledger/`, never renamed)                                                                                          |
| Display name | Ledger                                                                                                                                       |
| Category     | Utilities                                                                                                                                    |
| Version      | 0.29.0                                                                                                                                       |
| Currency     | Vietnamese đồng (VND, ₫), whole đồng only                                                                                                    |
| Tables       | `ledger_expenses`, `ledger_settings`, `ledger_funds`, `ledger_fund_members`, `ledger_fund_transactions`, `ledger_fund_transaction_revisions` |
| Source       | [`src/apps/ledger/`](https://github.com/tranthientam293/flow-os/tree/master/src/apps/ledger)                                                 |

## What you can do

- **Record expenses**: amount, category, note and date. The amount field takes a sum such as `50.000 + 20.000 − 5.000`.
- **See your month at a glance** on the Dashboard: total, comparison with last month, monthly limit, daily average, and four charts.
- **Browse and edit** every expense of a month, grouped by day.
- **Set a monthly limit** and see how much of it is left, including about how much you can spend per day.
- **Share a fund** with other people: everyone puts money in or uses it, each transaction shows whose money it is and who added it, and every edit is kept in its history.
- **Pick from 33 categories** (14 main categories, 6 of them with subcategories), each with its own icon and color.

Ledger runs inside flowOS: you sign in once to flowOS and install Ledger from the App Store. Your expenses follow your flowOS account and only you can see them; a fund is seen only by its members.

## Pages in this wiki

| Page                                              | For        | What it covers                                                 |
| ------------------------------------------------- | ---------- | -------------------------------------------------------------- |
| [User guide](Ledger-User-Guide)                   | Everyone   | Every screen, and how to add, edit and delete expenses         |
| [How numbers are calculated](Ledger-Calculations) | Everyone   | Totals, comparisons, the monthly limit and each chart's rules  |
| [Categories](Ledger-Categories)                   | Everyone   | Every category and subcategory, with its id                    |
| [Developer guide](Ledger-Developer-Guide)         | Developers | Code layout, routing, data fetching, shared state, conventions |
| [Data model](Ledger-Data-Model)                   | Developers | Tables, constraints, row-level security, migrations            |
| [Changelog](Ledger-Changelog)                     | Everyone   | What changed in each version                                   |

The app's own [`README.md`](https://github.com/tranthientam293/flow-os/blob/master/src/apps/ledger/README.md) in the repository is the source of truth; these pages explain it in more depth.
