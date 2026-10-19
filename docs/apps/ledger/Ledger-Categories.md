# Ledger: Categories

Ledger has 14 main categories, modeled on Money Lover's defaults. Six of them have subcategories: 19 subcategories, 33 categories in all. You can pick a main category on its own or one of its subcategories.

In **Top spending** and the Dashboard totals, a subcategory counts toward its main category.

| Main category     | Id                  | Subcategories (id)                                                                                                                                                                                                                                 |
| ----------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Food & Beverage   | `food`              | —                                                                                                                                                                                                                                                  |
| Transportation    | `transportation`    | Vehicle Maintenance (`vehicle-maintenance`)                                                                                                                                                                                                        |
| Bills & Utilities | `bills`             | Rentals (`rentals`), Water Bill (`water-bill`), Phone Bill (`phone-bill`), Electricity Bill (`electricity-bill`), Gas Bill (`gas-bill`), Television Bill (`television-bill`), Internet Bill (`internet-bill`), Other Utility Bills (`other-bills`) |
| Shopping          | `shopping`          | Personal Items (`personal-items`), Houseware (`houseware`), Makeup (`makeup`)                                                                                                                                                                      |
| Family            | `family`            | Home Maintenance (`home-maintenance`), Home Services (`home-services`), Pets (`pets`)                                                                                                                                                              |
| Health & Fitness  | `health`            | Medical Check-up (`medical`), Fitness (`fitness`)                                                                                                                                                                                                  |
| Entertainment     | `entertainment`     | Streaming Service (`streaming`), Fun Money (`fun-money`)                                                                                                                                                                                           |
| Education         | `education`         | —                                                                                                                                                                                                                                                  |
| Insurances        | `insurances`        | —                                                                                                                                                                                                                                                  |
| Gifts & Donations | `gifts`             | —                                                                                                                                                                                                                                                  |
| Investment        | `investment`        | —                                                                                                                                                                                                                                                  |
| Pay Interest      | `pay-interest`      | —                                                                                                                                                                                                                                                  |
| Outgoing Transfer | `outgoing-transfer` | —                                                                                                                                                                                                                                                  |
| Other Expense     | `other`             | —                                                                                                                                                                                                                                                  |

## Colors and icons

Every category has its own icon and color, used for its badge in lists and pickers and for its slice in the **Top spending** chart. A main category and each of its subcategories get different colors. Other Expense and "Everything else" are gray.

The colors are not checked as a colorblind-safe set (some pairs, such as Family and Investment, are close), so lists always show names and amounts alongside the color.

## For developers

Categories are defined in code, not in the database: [`src/apps/ledger/constants/categories.ts`](https://github.com/tranthientam293/flow-os/blob/master/src/apps/ledger/constants/categories.ts).

- Each expense stores its category's **id** in `ledger_expenses.category_id`. **Never change or reuse an id once shipped**: existing expenses would lose their category. The database only checks the id's format (`^[a-z0-9-]{1,64}$`), not that it exists.
- To add a category, add an entry with a new unique id, a `name`, a Lucide `icon` and a `tone` (a Tailwind color family). Pick a tone that differs from its parent and siblings.
- Renaming a category (`name`) or changing its icon or tone is safe.
- `CATEGORY_BY_ID` looks up any category by id; `PARENT_CATEGORY` maps any id to its main category (itself for a main category).
