import { useMutation, useQuery } from "@tanstack/react-query";
import { Repeat } from "lucide-react";
import { Button, Popconfirm } from "antd";
import {
  repeatQueryOptions,
  stopRepeatMutationOptions,
} from "../../apis/repeats";
import { repeatPeriodOf } from "../../constants/options";
import { useRoster } from "../../context/roster-context";
import type { Session } from "../../models/roster";
import { formatDate } from "../../utils/time";
import { formatWeekdays } from "../../utils/weekdays";

interface RepeatNoticeProps {
  session: Session;
  /** E.g. close the drawer: this session may have been one of those removed. */
  onStopped?: () => void;
}

export function RepeatNotice({ session, onStopped }: RepeatNoticeProps) {
  const { center, isOwner, meId } = useRoster();
  const repeat = useQuery({
    ...repeatQueryOptions(center.id, session.repeat_id ?? ""),
    enabled: !!session.repeat_id,
  });
  const stop = useMutation(stopRepeatMutationOptions(center.id));
  const r = repeat.data;
  if (!session.repeat_id || !r) return null;

  const canStop = isOwner || r.member_id === meId;
  const days = formatWeekdays(r.weekdays, center.week_start);
  const period = repeatPeriodOf(r);

  return (
    <div className='mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md border px-3 py-2 text-sm'>
      <Repeat className='size-4 shrink-0 text-muted-foreground' />
      <span className='min-w-0 flex-1 text-foreground'>
        {r.stopped_at ? (
          <>
            Repeated every {period} on {days}{" "}
            <span className='text-muted-foreground'>
              (stopped {formatDate(r.stopped_at.slice(0, 10))})
            </span>
          </>
        ) : (
          <>
            Repeats every {period} on {days}
          </>
        )}
      </span>
      {!r.stopped_at && canStop && (
        <Popconfirm
          title='Stop repeating?'
          description='No new weeks or months are booked, and its upcoming sessions are removed. Sessions already held, and upcoming ones edited by hand, stay.'
          okText='Stop repeating'
          okButtonProps={{ danger: true }}
          onConfirm={() => stop.mutate(r.id, { onSuccess: onStopped })}
        >
          <Button size='small' danger loading={stop.isPending}>
            Stop repeating
          </Button>
        </Popconfirm>
      )}
    </div>
  );
}
