import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { Alert } from "antd";
import { useRoster } from "../../context/roster-context";
import type { Session } from "../../models/roster";
import { sessionAccess } from "../../utils/permissions";
import {
  formatDate,
  formatLongDay,
  formatRange,
  inTz,
  monthBounds,
  todayIn,
} from "../../utils/time";
import { BranchTag, MemberAvatar, SessionStatusBadge } from "../atoms";
import { RepeatNotice, SessionActions, SessionHistory } from "../molecules";

// An existing session, read-only, with its actions. Edit switches the drawer
// to the session form.
export function SessionView({
  session,
  onEdit,
  onDone,
}: {
  session: Session;
  onEdit: () => void;
  onDone: () => void;
}) {
  const ctx = useRoster();
  const { center, memberById, branchById, typeById } = ctx;
  const tz = center.timezone;
  const access = sessionAccess(session, ctx);

  const member = memberById.get(session.member_id);
  const type = session.session_type_id
    ? typeById.get(session.session_type_id)
    : undefined;
  // Completed and cancelled sessions aren't edited, only restored.
  const editable =
    session.status === "scheduled" || session.status === "missed";

  const details: [string, ReactNode][] = [
    ["Center", center.name],
    ["Date", formatLongDay(inTz(session.starts_at, tz).format("YYYY-MM-DD"))],
    ["Time", formatRange(session.starts_at, session.ends_at, tz)],
    [
      "Trainer",
      member ? (
        <span key='trainer' className='flex items-center gap-1.5'>
          <MemberAvatar
            name={member.display_name}
            color={member.color}
            size='sm'
          />
          {member.display_name}
        </span>
      ) : (
        "—"
      ),
    ],
    [
      "Branch",
      <BranchTag
        key='branch'
        branch={branchById.get(session.branch_id)}
        showName
      />,
    ],
    ["Session type", type?.name ?? "—"],
  ];
  if (session.note)
    details.push([
      "Note",
      <span key='note' className='whitespace-pre-wrap'>
        {session.note}
      </span>,
    ]);

  return (
    <div className='flex flex-col'>
      {access.reason && (
        <Alert
          type='warning'
          showIcon
          icon={<Lock />}
          className='mb-4'
          title={access.reason}
        />
      )}

      <div className='mb-3 flex items-start justify-between gap-3'>
        <h3 className='min-w-0 text-base font-medium text-foreground'>
          {session.title || "Session"}
        </h3>
        <SessionStatusBadge status={session.status} />
      </div>

      <dl className='mb-4 grid grid-cols-[7rem_1fr] gap-x-3 gap-y-2 rounded-md border bg-surface-muted p-3 text-sm'>
        {details.map(([label, value]) => (
          <div key={label} className='contents'>
            <dt className='text-muted-foreground'>{label}</dt>
            <dd className='min-w-0 text-foreground'>{value}</dd>
          </div>
        ))}
      </dl>

      {access.canEdit && editable && (
        <p className='-mt-2 mb-4 text-xs text-muted-foreground'>
          Editable until {formatDate(monthBounds(todayIn(tz)).last)} (end of
          this month)
        </p>
      )}

      <RepeatNotice session={session} onStopped={onDone} />

      <SessionHistory sessionId={session.id} />

      {/* Cancelled shows only its badge. */}
      {session.status === "missed" && (
        <Alert
          type='info'
          showIcon
          className='mb-4'
          title='This session is missed.'
        />
      )}

      <SessionActions session={session} onEdit={onEdit} onDone={onDone} />
    </div>
  );
}
