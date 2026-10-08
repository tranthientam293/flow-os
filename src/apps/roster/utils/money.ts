const amount = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });

// Plain number formatting; centers don't have a currency setting.
export const formatAmount = (value: number) => amount.format(value);

// Salary for a session at an hourly rate, rounded to cents like the database.
export const salaryFor = (
  rate: number | null | undefined,
  startsAt: string,
  endsAt: string,
) =>
  Math.round(
    (rate ?? 0) * ((Date.parse(endsAt) - Date.parse(startsAt)) / 36e5) * 100,
  ) / 100;

export const formatRate = (value: number | null | undefined) =>
  value === null || value === undefined
    ? "No salary set"
    : `${formatAmount(value)} / h`;
