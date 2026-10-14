// Amounts are in Vietnamese đồng (VND), which has no minor unit.
export const CURRENCY_SYMBOL = "₫";

const amount = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

// An amount of money, e.g. "150.000 ₫".
export const formatAmount = (value: number) => amount.format(value);

const compact = new Intl.NumberFormat("vi-VN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

// A short amount for chart axes, e.g. "1,5 Tr" (no currency sign).
export const formatCompact = (value: number) => compact.format(value);
