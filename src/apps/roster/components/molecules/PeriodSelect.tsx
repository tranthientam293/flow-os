import { Select } from "antd";
import type { Period } from "../../utils/time";

const OPTIONS: { value: Period; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
];

interface PeriodSelectProps {
  value: Period;
  onChange: (period: Period) => void;
}

export function PeriodSelect({ value, onChange }: PeriodSelectProps) {
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
