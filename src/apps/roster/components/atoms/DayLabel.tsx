import { dayjs } from "@/libs";
import { cn } from "@/utils";

// A calendar column header: the weekday over the day of the month. Today's
// number sits in a filled circle.
export function DayLabel({
  date,
  today = false,
}: {
  date: string;
  today?: boolean;
}) {
  const d = dayjs(date);
  return (
    <span className='flex flex-col items-center gap-0.5 leading-tight'>
      <span>{d.format("ddd")}</span>
      <span
        className={cn(
          "inline-flex size-7 items-center justify-center rounded-full text-base font-medium",
          today && "bg-primary text-primary-foreground",
        )}
      >
        {d.date()}
      </span>
    </span>
  );
}
