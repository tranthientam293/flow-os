const amount = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });

// Plain number formatting; centers don't have a currency setting.
export const formatAmount = (value: number) => amount.format(value);

export const formatRate = (value: number | null | undefined) =>
  value === null || value === undefined
    ? "No salary set"
    : `${formatAmount(value)} / h`;
