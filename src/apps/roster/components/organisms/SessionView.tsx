import type { ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import { Lock, Pencil } from "lucide-react";
import { Alert, Button, Popconfirm } from "antd";
import { setSessionStatusMutationOptions } from "../../apis/sessions";
import { useCheckout } from "../../context/checkout-context";
import { useRoster } from "../../context/roster-context";
import { useNow } from "../../hooks/useNow";
import type { Session } from "../../models/roster";
import { sessionAccess } from "../../utils/permissions";
import {
  editableUntil,
  formatLongDay,
  formatRange,
  inTz,
} from "../../utils/time";
import { BranchTag, MemberAvatar, SessionStatusBadge } from "../atoms";
import { SessionHistory } from "../molecules";

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
  const { center, isOwner, memberById, branchById, typeById } = ctx;
  const tz = center.timezone;
  const access = sessionAccess(session, ctx);
  const now = useNow();
  const setStatus = useMutation(setSessionStatusMutationOptions(center.id));
  const { openCheckout } = useCheckout();

  const member = memberById.get(session.member_id);
  const type = session.session_type_id
    ? typeById.get(session.session_type_id)
    : undefined;
  const started = Date.parse(session.starts_at) <= now;
  const inactive =
    session.status === "cancelled" || session.status === "missed";

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

      {access.canEdit && !isOwner && started && center.past_edit_days > 0 && (
        <p className='-mt-2 mb-4 text-xs text-muted-foreground'>
          Editable until {editableUntil(center, session.starts_at)}
        </p>
      )}

      <SessionHistory sessionId={session.id} />

      {inactive && (
        <Alert
          type='info'
          showIcon
          className='mb-4'
          title={`This session is ${session.status}.`}
          action={
            access.canEdit && (
              <Button
                size='small'
                loading={setStatus.isPending}
                onClick={() =>
                  setStatus.mutate(
                    { id: session.id, status: "scheduled" },
                    { onSuccess: onDone },
                  )
                }
              >
                Restore
              </Button>
            )
          }
        />
      )}

      {!inactive && (
        <div className='mb-4 flex items-center justify-between gap-3 rounded-md border bg-surface-muted p-3'>
          <div>
            <div className='text-sm text-foreground'>
              {session.status === "completed"
                ? "Completed"
                : "Complete session"}
            </div>
            <p className='text-xs text-muted-foreground'>
              {session.status === "completed"
                ? "Salary and fees are in the checkout."
                : started
                  ? "Record the salary and any fees once it has taken place."
                  : "Available once the session has started."}
            </p>
          </div>
          <Button
            size='small'
            disabled={
              session.status !== "completed" && (!access.canEdit || !started)
            }
            onClick={() => {
              onDone();
              openCheckout(session, ctx);
            }}
          >
            {session.status === "completed" ? "Checkout" : "Complete"}
          </Button>
        </div>
      )}

      <div className='flex items-center gap-2'>
        {session.status === "scheduled" && access.canEdit && (
          <Popconfirm
            title='Cancel this session?'
            description='It stays on the schedule, marked cancelled. You can restore it later.'
            okText='Cancel session'
            cancelText='Keep'
            onConfirm={() =>
              setStatus.mutate(
                { id: session.id, status: "cancelled" },
                { onSuccess: onDone },
              )
            }
          >
            <Button loading={setStatus.isPending}>Cancel session</Button>
          </Popconfirm>
        )}
        <Button className='ms-auto' onClick={onDone}>
          Close
        </Button>
        {access.canEdit && (
          <Button type='primary' icon={<Pencil />} onClick={onEdit}>
            Edit
          </Button>
        )}
      </div>
    </div>
  );
}
