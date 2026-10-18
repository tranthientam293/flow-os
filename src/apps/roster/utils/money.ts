import type { Session, SessionType } from "../models/roster";

export const CURRENCY = "VND";
export const CURRENCY_SYMBOL = "₫";

const amount = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: CURRENCY,
  maximumFractionDigits: 0,
});
const number = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 });

export const formatAmount = (value: number) => amount.format(value);

export const formatNumber = (value: number) => number.format(value);

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

export type PayBasis = "shift" | "hour" | "trainee";

export const DEFAULT_PAY_BASIS: PayBasis = "shift";

const PAY_BASES: Record<
  PayBasis,
  { label: string; unit: string; unitPlural: string; unitShort: string }
> = {
  shift: {
    label: "Per shift",
    unit: "shift",
    unitPlural: "shifts",
    unitShort: "shift",
  },
  hour: {
    label: "Per hour",
    unit: "hour",
    unitPlural: "hours",
    unitShort: "h",
  },
  trainee: {
    label: "Per trainee",
    unit: "trainee",
    unitPlural: "trainees",
    unitShort: "trainee",
  },
};

export const PAY_BASIS_OPTIONS = (Object.keys(PAY_BASES) as PayBasis[]).map(
  (value) => ({ value, label: PAY_BASES[value].label }),
);

export const payBasisLabel = (basis: PayBasis) => PAY_BASES[basis].label;

const isPayBasis = (value: unknown): value is PayBasis =>
  typeof value === "string" && value in PAY_BASES;

export const payBasisOf = (type: SessionType | undefined): PayBasis =>
  isPayBasis(type?.pay_basis) ? type.pay_basis : "hour";

export const rateSuffix = (basis: PayBasis) =>
  `${CURRENCY_SYMBOL} / ${PAY_BASES[basis].unitShort}`;

const sessionHours = (session: Pick<Session, "starts_at" | "ends_at">) =>
  (Date.parse(session.ends_at) - Date.parse(session.starts_at)) / 36e5;

export const payUnits = (
  session: Pick<Session, "starts_at" | "ends_at" | "trainee_count">,
  basis: PayBasis,
) => {
  if (basis === "shift") return 1;
  if (basis === "trainee") return session.trainee_count;
  return sessionHours(session);
};

export const formatUnits = (units: number, basis: PayBasis) => {
  if (basis === "hour") return `${formatNumber(units)} h`;
  const { unit, unitPlural } = PAY_BASES[basis];
  return `${units} ${units === 1 ? unit : unitPlural}`;
};

export const salaryFor = (rate: number | null | undefined, units: number) =>
  Math.round((rate ?? 0) * units);

export const formatRate = (
  value: number | null | undefined,
  basis: PayBasis = "hour",
) =>
  value === null || value === undefined
    ? "No salary set"
    : `${formatAmount(value)} / ${PAY_BASES[basis].unitShort}`;
