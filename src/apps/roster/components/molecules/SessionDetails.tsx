import { Lock } from "lucide-react";
import { useRoster } from "../../context/roster-context";
import type { Session } from "../../models/roster";
import { sessionAccess } from "../../utils/permissions";
import { formatLongDay, formatRange, inTz } from "../../utils/time";
import { BranchTag, MemberAvatar, SessionStatusBadge } from "../atoms";

// Read-only summary of a session (the calendar's hover card). Actions and the
// history are in the session drawer.
export function SessionDetails({ session }: { session: Session }) {
  const ctx = useRoster();
  const { center, memberById, branchById } = ctx;
  const access = sessionAccess(session, ctx);
  const member = memberById.get(session.member_id);
  const date = inTz(session.starts_at, center.timezone).format("YYYY-MM-DD");

  return (
    <div className='flex w-64 flex-col gap-2 text-sm'>
      <div className='flex items-start justify-between gap-2'>
        <div className='min-w-0 font-medium text-foreground'>
          {session.title || "Session"}
        </div>
        <SessionStatusBadge status={session.status} />
      </div>
      <div className='text-foreground-light'>{center.name}</div>
      <div className='text-foreground-light'>
        {formatLongDay(date)} ·{" "}
        {formatRange(session.starts_at, session.ends_at, center.timezone)}
      </div>
      <div className='flex flex-wrap items-center gap-3'>
        {member && (
          <span className='flex items-center gap-1.5 text-foreground-light'>
            <MemberAvatar
              name={member.display_name}
              color={member.color}
              size='sm'
            />
            {member.display_name}
          </span>
        )}
        <BranchTag branch={branchById.get(session.branch_id)} showName />
      </div>
      {session.note && (
        <p className='whitespace-pre-wrap text-muted-foreground'>
          {session.note}
        </p>
      )}
      {access.reason && (
        <p className='flex items-start gap-1.5 text-xs text-muted-foreground'>
          <Lock className='mt-0.5 size-3 shrink-0' />
          {access.reason}
        </p>
      )}
    </div>
  );
}
