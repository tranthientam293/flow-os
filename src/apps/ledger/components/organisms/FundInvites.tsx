import { useMutation, useQuery } from "@tanstack/react-query";
import { MailOpen } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "antd";
import { useFlowApp } from "@/context";
import { fromNow } from "@/libs";
import {
  acceptFundInviteMutationOptions,
  declineFundInviteMutationOptions,
  myFundInvitesQueryOptions,
} from "../../apis/funds";
import { useLedgerPaths } from "../../hooks/useLedgerPaths";

// Funds the user was invited to: Accept joins (and opens the fund), Decline
// drops the invitation. Shows nothing when there are none.
export function FundInvites() {
  const { user } = useFlowApp();
  const paths = useLedgerPaths();
  const navigate = useNavigate();
  const invites = useQuery(myFundInvitesQueryOptions(user.id));
  const accept = useMutation(acceptFundInviteMutationOptions(user.id));
  const decline = useMutation(declineFundInviteMutationOptions(user.id));

  if (!invites.data?.length) return null;
  // Which invitation a pending action is for, so only its buttons spin.
  const busy =
    (accept.isPending && accept.variables) ||
    (decline.isPending && decline.variables);

  return (
    <section className='flex flex-col gap-2'>
      <h2 className='text-sm font-medium text-foreground'>
        Invitations ({invites.data.length})
      </h2>
      <ul className='flex flex-col gap-2'>
        {invites.data.map((invite) => (
          <li
            key={invite.member_id}
            className='flex flex-col gap-3 rounded-lg border border-brand/40 bg-brand-soft/40 px-4 py-3 sm:flex-row sm:items-center'
          >
            <span className='flex min-w-0 flex-1 items-center gap-3'>
              <span className='flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-strong'>
                <MailOpen className='size-4.5' />
              </span>
              <span className='flex min-w-0 flex-col'>
                <span className='truncate text-sm font-medium text-foreground'>
                  {invite.fund_name}
                </span>
                <span className='truncate text-xs text-muted-foreground'>
                  {invite.invited_by
                    ? `${invite.invited_by} invited you`
                    : "You’re invited"}{" "}
                  · {fromNow(invite.invited_at)}
                </span>
              </span>
            </span>
            <span className='grid grid-cols-2 gap-2 sm:flex'>
              <Button
                disabled={!!busy}
                loading={
                  decline.isPending && decline.variables === invite.member_id
                }
                onClick={() => decline.mutate(invite.member_id)}
                className='max-sm:h-11'
              >
                Decline
              </Button>
              <Button
                type='primary'
                disabled={!!busy && busy !== invite.member_id}
                loading={
                  accept.isPending && accept.variables === invite.member_id
                }
                onClick={() =>
                  accept.mutate(invite.member_id, {
                    onSuccess: (fundId) => navigate(paths.fund(fundId)),
                  })
                }
                className='max-sm:h-11'
              >
                Accept
              </Button>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
