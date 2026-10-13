// Amounts are in Vietnamese đồng (VND), which has no minor unit.
export const CURRENCY = "VND";
export const CURRENCY_SYMBOL = "₫";

const amount = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: CURRENCY,
  maximumFractionDigits: 0,
});
const number = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 });

// An amount of money, e.g. "150.000 ₫".
export const formatAmount = (value: number) => amount.format(value);

// A plain number (hours and the like), e.g. "1,5".
export const formatNumber = (value: number) => number.format(value);

// Props for an antd InputNumber that takes an amount in đồng: whole đồng,
// grouped with dots like "150.000", and the ₫ sign after it.
export const moneyInputProps = {
  min: 0,
  step: 1000,
  precision: 0,
  suffix: CURRENCY_SYMBOL,
  formatter: (value: number | string | undefined) =>
    `${value ?? ""}`.replace(/\B(?=(\d{3})+(?!\d))/g, "."),
  parser: (value: string | undefined) =>
    Number((value ?? "").replace(/\D/g, "")),
};

// Salary for a session at an hourly rate, rounded to whole đồng.
export const salaryFor = (
  rate: number | null | undefined,
  startsAt: string,
  endsAt: string,
) =>
  Math.round(
    (rate ?? 0) * ((Date.parse(endsAt) - Date.parse(startsAt)) / 36e5),
  );

export const formatRate = (value: number | null | undefined) =>
  value === null || value === undefined
    ? "No salary set"
    : `${formatAmount(value)} / h`;
