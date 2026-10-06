import { useMutation } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import { Button, Popconfirm } from "antd";
import { Badge } from "@/components/atoms";
import { fromNow } from "@/libs";
import { setSessionStatusMutationOptions } from "../apis/sessions";
import { useRoster } from "../context/roster-context";
import { useNow } from "../hooks/useNow";
import type { Session } from "../models/roster";
import { sessionAccess } from "../utils/permissions";
import { formatLongDay, formatRange, inTz } from "../utils/time";
import { BranchTag } from "./BranchTag";
import { MemberAvatar } from "./MemberAvatar";

const STATUS_LABEL: Record<string, string> = {
  completed: "Completed",
  missed: "Missed",
  cancelled: "Cancelled",
};

export function SessionDetails({
  session,
  onDone,
}: {
  session: Session;
  onDone?: () => void;
}) {
  const ctx = useRoster();
  const { center, memberById, branchById, directory, openBooking } = ctx;
  const access = sessionAccess(session, ctx);
  const now = useNow();
  const cancel = useMutation(setSessionStatusMutationOptions(center.id));
  const member = memberById.get(session.member_id);
  const editor = session.updated_by
    ? directory.find((m) => m.user_id === session.updated_by)
    : undefined;
  const date = inTz(session.starts_at, center.timezone).format("YYYY-MM-DD");

  return (
    <div className='flex w-64 flex-col gap-2 text-sm'>
      <div className='flex items-start justify-between gap-2'>
        <div className='min-w-0 font-medium text-foreground'>
          {session.title || "Session"}
        </div>
        {session.status !== "scheduled" && (
          <Badge variant={session.status === "completed" ? "brand" : "warning"}>
            {STATUS_LABEL[session.status] ?? session.status}
          </Badge>
        )}
      </div>
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
      {session.updated_by && (
        <p className='text-xs text-muted-foreground'>
          Edited by {editor?.display_name ?? "someone"} ·{" "}
          {fromNow(session.updated_at)}
        </p>
      )}
      {access.canEdit && (
        <div className='flex justify-end gap-2 pt-1'>
          {session.status === "scheduled" &&
            new Date(session.starts_at).getTime() > now && (
              <Popconfirm
                title='Cancel this session?'
                okText='Cancel session'
                cancelText='Keep'
                onConfirm={() =>
                  cancel.mutate(
                    { id: session.id, status: "cancelled" },
                    { onSuccess: onDone },
                  )
                }
              >
                <Button size='small' danger loading={cancel.isPending}>
                  Cancel
                </Button>
              </Popconfirm>
            )}
          <Button
            size='small'
            type='primary'
            onClick={() => {
              onDone?.();
              openBooking({ session });
            }}
          >
            {session.status === "cancelled" ? "Open" : "Edit"}
          </Button>
        </div>
      )}
    </div>
  );
}
