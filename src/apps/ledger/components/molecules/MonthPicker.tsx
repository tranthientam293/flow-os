import dayjs, { type Dayjs } from "dayjs";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button, DatePicker } from "antd";
import { MONTH_FORMAT } from "@/constants";
import { PICKER_SHEET } from "../../constants/modal";

// Picks a month (its first day): previous / next buttons around a month
// picker, and Today for the current month. Future months are disabled, so
// next and Today are off on the current month.
export function MonthPicker({
  value,
  onChange,
}: {
  value: Dayjs;
  onChange: (month: Dayjs) => void;
}) {
  const thisMonth = dayjs().startOf("month");
  const isThisMonth = value.isSame(thisMonth, "month");

  return (
    <div className='flex items-center gap-1 self-start'>
      <Button
        type='text'
        icon={<ChevronLeft />}
        title='Previous month'
        aria-label='Previous month'
        onClick={() => onChange(value.subtract(1, "month"))}
      />
      <DatePicker
        picker='month'
        format={MONTH_FORMAT}
        value={value}
        onChange={(month) => month && onChange(month.startOf("month"))}
        disabledDate={(d) => d.isAfter(dayjs(), "month")}
        allowClear={false}
        // No keyboard on phones; pick from the calendar.
        inputReadOnly
        classNames={{ popup: { root: PICKER_SHEET } }}
        className='w-28'
        aria-label='Month'
      />
      <Button
        type='text'
        icon={<ChevronRight />}
        title='Next month'
        aria-label='Next month'
        disabled={isThisMonth}
        onClick={() => onChange(value.add(1, "month"))}
      />
      <Button disabled={isThisMonth} onClick={() => onChange(thisMonth)}>
        Today
      </Button>
    </div>
  );
}
