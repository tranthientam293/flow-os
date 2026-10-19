# Ledger: Developer guide

How Ledger is built. Read the platform's [`src/apps/README.md`](https://github.com/tranthientam293/flow-os/blob/master/src/apps/README.md) first: it sets the rules every flowOS app follows (one folder per app, what an app may import, the platform SDK).

## Stack

| Concern      | Library                                                   |
| ------------ | --------------------------------------------------------- |
| UI           | React 19, antd 6, Tailwind CSS 4, Lucide icons            |
| Routing      | React Router (nested `<Routes>` under `/apps/ledger/*`)   |
| Server state | TanStack Query 5                                          |
| Backend      | Supabase (Postgres with RLS), through the platform client |
| Charts       | Recharts 3 (only in Ledger's lazy-loaded bundle)          |
| Dates        | dayjs                                                     |

## Folder layout

```
src/apps/ledger/
  manifest.ts            App id, name, icon, version; lazy-loads LedgerApp
  LedgerApp.tsx          Root: routes, header, bottom bar, footer, editor provider
  ledger.css             Dialog and picker animations (desktop and phone sheets)
  README.md              Screens, business rules, tables, changelog (source of truth)
  apis/                  Query and mutation options (expenses.ts, settings.ts)
  components/
    atoms/               CategoryIcon
    molecules/           AmountInput, CategoryPicker, ExpenseList, MonthPicker, …
    organisms/           Charts, ExpenseModal, ExpenseEditorProvider, header and bottom bar, …
    pages/               DashboardPage, ExpensesPage, SettingsPage
  constants/             categories, chart colors, query keys, modal sizes, routes
  context/               expense-editor-context.ts
  hooks/                 useConfirmDelete, useLedgerPaths, useMonthParam
  models/                ledger.ts (Expense, ExpenseDraft, LedgerSettings)
  utils/                 errors, expression (amount sums), money (formatting), stats
```

Components follow atomic design, as in `src/components`: each level has an `index.ts` barrel, other levels import through it, and siblings import each other directly.

## Routing

`LedgerApp.tsx` renders nested routes under the platform's `/apps/ledger/*`:

| Route      | Page                       |
| ---------- | -------------------------- |
| index      | `DashboardPage`            |
| `expenses` | `ExpensesPage`             |
| `settings` | `SettingsPage`             |
| `*`        | Redirects to the Dashboard |

Paths are built with `useLedgerPaths()`, never hard-coded. Path segments live in `constants/routes.ts`.

### The month in the URL

`useMonthParam()` reads and writes `?month=YYYY-MM`. A missing, invalid or future month means the current month, and choosing the current month removes the parameter. It updates with `replace`, so switching months doesn't add browser history. The Dashboard and Expenses both use it, so tabs and links keep the chosen month.

## Data fetching

All server state goes through TanStack Query. Query and mutation options live in `apis/` and are used as `useQuery(monthExpensesQueryOptions(userId, month))`.

| Options                           | Key                                             |
| --------------------------------- | ----------------------------------------------- |
| `monthExpensesQueryOptions`       | `["ledger", "expenses", userId, month]`         |
| `yearExpensesQueryOptions`        | `["ledger", "expenses", userId, "year", month]` |
| `settingsQueryOptions`            | `["ledger", "settings", userId]`                |
| `saveExpenseMutationOptions`      | Invalidates `["ledger", "expenses", userId]`    |
| `deleteExpenseMutationOptions`    | Invalidates `["ledger", "expenses", userId]`    |
| `saveMonthlyLimitMutationOptions` | Writes the result into the settings key         |

Keys are built by `LEDGER_KEYS` in `constants/keys.ts`. The year query sits under the `expenses` prefix on purpose: saving or deleting an expense refreshes the month lists and the 12-month chart together.

Mutations set `meta.successMessage` and `meta.errorMessage`; the platform's query client shows them as toasts. `utils/errors.ts` `check()` unwraps a Supabase result and throws a readable error.

## The shared expense editor

One expense dialog serves every page. `ExpenseEditorProvider` (wrapping the whole app in `LedgerApp.tsx`) owns the dialog and the delete confirmation, and exposes them through `useExpenseEditor()`:

| Member                           | Use                                                                                                                                            |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `openEditor(expense?, onSaved?)` | Open empty to add, or with `expense` to edit. `onSaved` runs after saving                                                                      |
| `deleteExpense(expense)`         | Confirm, then delete                                                                                                                           |
| `headerAdd` / `setHeaderAdd`     | While a page's **Add expense** button is scrolled out of view, the page registers its action here and the header shows its own **Add expense** |

## Calculations

Pure functions in `utils/`, kept free of React so they're easy to test:

| Function                               | File            | Does                                                  |
| -------------------------------------- | --------------- | ----------------------------------------------------- |
| `sumAmounts`                           | `stats.ts`      | Total of a list of expenses                           |
| `dailyTotals`                          | `stats.ts`      | Total per day of a month                              |
| `categoryTotals`                       | `stats.ts`      | Total and count per main category, largest first      |
| `monthlyTotals`                        | `stats.ts`      | Total per month for the 12 months ending with a month |
| `niceMax`                              | `stats.ts`      | Round axis maximum (1, 2 or 5 × 10ⁿ)                  |
| `tokenize`, `evaluate`, `formatTokens` | `expression.ts` | Parse, compute and display amount sums                |
| `formatAmount`, `formatCompact`        | `money.ts`      | `150.000 ₫`, and `1,5 Tr` for chart axes (vi-VN)      |

The user-facing rules they implement are on [How numbers are calculated](Ledger-Calculations).

## Styling and UI conventions

- Combine and toggle classes with `cn()` from `@/utils`, never template literals.
- Icon-button hints use the native `title` attribute, not antd `Tooltip`.
- Charts use Recharts. Category colors come from `CATEGORY_TONE_CLASS` (badges) and `CATEGORY_TONE_COLOR` (chart slices) in `constants/categories.ts`.
- Dialogs pass `transitionName={MODAL_TRANSITION}` and `width={MODAL_WIDTH}` (`constants/modal.ts`). Below 768px every dialog is a bottom sheet (platform rule in `src/styles/antd.css`); `ledger.css` adds Ledger's own fade and scale on desktop.
- Date and month pickers pass `classNames={{ popup: { root: PICKER_SHEET } }}` so their calendars open as bottom sheets on phones.
- Dates are shown as `YYYY/MM/DD` (`formatDate()` from `@/libs`, `DATE_FORMAT` from `@/constants`).
- Copy is English only; there is no i18n.

## Releasing a change

1. Add an entry to the **Changelog** in `src/apps/ledger/README.md` (versions in ascending order) and update **Screens**, **Business rules** or **Tables** as needed.
2. Bump `version` in `manifest.ts` to match. The App Store shows it.
3. Run `npm run check` (type-check, lint, format).
4. For schema changes, see [Data model](Ledger-Data-Model#changing-the-schema).
