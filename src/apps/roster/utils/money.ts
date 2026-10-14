import type { Session, SessionType } from "../models/roster";

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

// How a session type pays: per hour, or per trainee in the session. No type
// means per hour.
export type PayBasis = "hour" | "trainee";

export const payBasisOf = (type: SessionType | undefined): PayBasis =>
  type?.pay_basis === "trainee" ? "trainee" : "hour";

// "₫ / h" or "₫ / trainee", for rate inputs.
export const rateSuffix = (basis: PayBasis) =>
  `${CURRENCY_SYMBOL} / ${basis === "trainee" ? "trainee" : "h"}`;

// What a session is paid for: base salary × hours (per-hour types) or base
// salary × its number of trainees (per-trainee types; at least 1).
export const payUnits = (
  session: Pick<Session, "starts_at" | "ends_at" | "trainee_count">,
  basis: PayBasis,
) =>
  basis === "trainee"
    ? session.trainee_count
    : (Date.parse(session.ends_at) - Date.parse(session.starts_at)) / 36e5;

// "1,5 h" or "8 trainees".
export const formatUnits = (units: number, basis: PayBasis) =>
  basis === "trainee"
    ? `${units} ${units === 1 ? "trainee" : "trainees"}`
    : `${formatNumber(units)} h`;

// Salary at a rate for a number of units, rounded to whole đồng.
export const salaryFor = (rate: number | null | undefined, units: number) =>
  Math.round((rate ?? 0) * units);

export const formatRate = (
  value: number | null | undefined,
  basis: PayBasis = "hour",
) =>
  value === null || value === undefined
    ? "No salary set"
    : `${formatAmount(value)} / ${basis === "trainee" ? "trainee" : "h"}`;
