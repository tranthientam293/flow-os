import { useState } from "react";
import { Bell, Mail } from "lucide-react";
import { Badge, Button, Popover } from "antd";
import { useMutation } from "@tanstack/react-query";
import { claimInviteMutationOptions } from "../apis/centers";
import type { PendingInvite } from "../models/roster";

export function InviteBell({
  invites,
  onJoined,
}: {
  invites: PendingInvite[];
  onJoined: (centerId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const claim = useMutation(claimInviteMutationOptions());
  const label = invites.length
    ? `${invites.length} ${invites.length === 1 ? "invitation" : "invitations"}`
    : "No invitations";

  const join = (invite: PendingInvite) =>
    claim.mutate(invite.member_id, {
      onSuccess: (centerId) => {
        setOpen(false);
        onJoined(centerId);
      },
    });

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger='click'
      placement='bottomRight'
      arrow={false}
      title='Invitations'
      content={
        invites.length ? (
          <ul className='-mx-1 flex w-72 flex-col divide-y'>
            {invites.map((invite) => (
              <li
                key={invite.member_id}
                className='flex items-center gap-3 px-1 py-2.5'
              >
                <Mail className='size-4 shrink-0 text-brand-strong' />
                <div className='min-w-0 flex-1'>
                  <div className='truncate text-sm font-medium text-foreground'>
                    {invite.center_name}
                  </div>
                  <div className='truncate text-xs text-muted-foreground'>
                    Join as {invite.display_name}
                  </div>
                </div>
                <Button
                  type='primary'
                  size='small'
                  loading={
                    claim.isPending && claim.variables === invite.member_id
                  }
                  onClick={() => join(invite)}
                >
                  Join
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className='w-64 text-sm text-muted-foreground'>
            No invitations. When a center owner invites your email, it shows up
            here.
          </p>
        )
      }
    >
      <button
        type='button'
        aria-label={label}
        className='flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'
      >
        <Badge count={invites.length} size='small' offset={[2, -2]}>
          <Bell className='size-4 text-current' />
        </Badge>
      </button>
    </Popover>
  );
}
