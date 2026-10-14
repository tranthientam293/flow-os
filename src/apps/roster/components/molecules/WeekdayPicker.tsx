import { cn } from "@/utils";
import { WEEKDAY_NAMES } from "../../utils/weekdays";

// Toggle chips for the days of the week, starting on the center's first day
// (`weekStart`: 0 = Sunday, 1 = Monday). antd Form passes value/onChange.
export function WeekdayPicker({
  id,
  value = [],
  onChange,
  weekStart,
  disabled,
}: {
  id?: string;
  value?: number[];
  onChange?: (days: number[]) => void;
  weekStart: number;
  disabled?: boolean;
}) {
  const days = Array.from({ length: 7 }, (_, i) => (weekStart + i) % 7);
  const toggle = (day: number) =>
    onChange?.(
      value.includes(day)
        ? value.filter((d) => d !== day)
        : [...value, day].sort((a, b) => a - b),
    );

  return (
    <fieldset
      id={id}
      className='m-0 grid min-w-0 grid-cols-7 gap-1.5 border-0 p-0'
    >
      {days.map((day) => {
        const on = value.includes(day);
        return (
          <button
            key={day}
            type='button'
            aria-pressed={on}
            disabled={disabled}
            onClick={() => toggle(day)}
            className={cn(
              "h-9 cursor-pointer rounded-md border text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
              on
                ? "border-brand bg-brand-soft font-medium text-brand-strong"
                : "border-border-strong bg-card text-foreground-light hover:bg-accent",
            )}
          >
            {WEEKDAY_NAMES[day]}
          </button>
        );
      })}
    </fieldset>
  );
}
