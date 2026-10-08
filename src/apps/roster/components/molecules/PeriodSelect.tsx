import { Select } from "antd";
import type { Period } from "../../utils/time";

const OPTIONS: { value: Period; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
];

// Day or week: how much of the schedule is shown.
export function PeriodSelect({
  value,
  onChange,
}: {
  value: Period;
  onChange: (period: Period) => void;
}) {
  return (
    <Select<Period>
      aria-label='View'
      className='w-24'
      value={value}
      onChange={onChange}
      options={OPTIONS}
    />
  );
}
