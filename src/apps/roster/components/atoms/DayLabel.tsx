import { dayjs } from "@/libs";
import { cn } from "@/utils";

interface DayLabelProps {
  date: string;
  today?: boolean;
}

export function DayLabel({ date, today = false }: DayLabelProps) {
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
