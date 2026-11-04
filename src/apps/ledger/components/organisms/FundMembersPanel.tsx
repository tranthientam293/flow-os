import { useMutation } from "@tanstack/react-query";
import { UserMinus, UserPlus, X } from "lucide-react";
import { Button, Form, Input } from "antd";
import { Badge } from "@/components/atoms";
import { SettingsPanel } from "@/components/molecules";
import { useFlowApp } from "@/context";
import { fromNow } from "@/libs";
import {
  addFundMemberMutationOptions,
  removeFundMemberMutationOptions,
} from "../../apis/funds";
import { useConfirmDelete } from "../../hooks/useConfirmDelete";
import type { FundMember } from "../../models/ledger";
import type { FundTotals } from "../../utils/funds";
import { formatAmount } from "../../utils/money";

type InviteValues = { email: string; displayName?: string };

interface FundMembersPanelProps {
  fundId: string;
  members: FundMember[];
  totals: Map<string, FundTotals>;
  myMemberId: string;
  isOwner: boolean;
}

// Who's in the fund, with what each put in and used, then who's invited but
// hasn't accepted yet. The owner invites people by email, cancels
// invitations and removes members; a removed member's transactions stay.
export function FundMembersPanel({
  fundId,
  members,
  totals,
  myMemberId,
  isOwner,
}: FundMembersPanelProps) {
  const { user } = useFlowApp();
  const invite = useMutation(addFundMemberMutationOptions(user.id, fundId));
  const remove = useMutation(removeFundMemberMutationOptions(user.id));
  const { confirmDelete, holder } = useConfirmDelete();
  const [form] = Form.useForm<InviteValues>();
  const current = members.filter((m) => !m.removed_at);
  const joined = current.filter((m) => m.status === "active");
  const invited = current.filter((m) => m.status === "invited");

  return (
    <SettingsPanel
      title='Members'
      description={
        isOwner
          ? "Everyone here can put money in and use it. Invite people by their flowOS email; they join once they accept."
          : "Everyone here can put money in and use it. Only the owner invites or removes people."
      }
      flush
    >
      {holder}
      <ul className='divide-y'>
        {joined.map((m) => {
          const t = totals.get(m.id);
          return (
            <li
              key={m.id}
              className='flex items-center gap-3 px-4 py-3 sm:px-5'
            >
              <MemberName member={m} you={m.id === myMemberId} />
              <div className='flex shrink-0 flex-col items-end text-xs tabular-nums'>
                <span className='text-brand-strong'>
                  +{formatAmount(t?.contributed ?? 0)}
                </span>
                <span className='text-destructive'>
                  −{formatAmount(t?.spent ?? 0)}
                </span>
              </div>
              {isOwner && m.role !== "owner" && (
                <Button
                  type='text'
                  size='small'
                  danger
                  icon={<UserMinus />}
                  title='Remove'
                  aria-label={`Remove ${m.display_name}`}
                  onClick={() =>
                    confirmDelete(() => remove.mutateAsync(m.id), {
                      title: `Remove ${m.display_name}?`,
                      content:
                        "They can no longer see or use this fund. Their transactions stay, under their name.",
                      okText: "Remove",
                    })
                  }
                />
              )}
            </li>
          );
        })}
        {invited.map((m) => (
          <li key={m.id} className='flex items-center gap-3 px-4 py-3 sm:px-5'>
            <MemberName member={m} />
            <span className='shrink-0 text-xs text-muted-foreground'>
              {fromNow(m.created_at)}
            </span>
            {isOwner && (
              <Button
                type='text'
                size='small'
                danger
                icon={<X />}
                title='Cancel invitation'
                aria-label={`Cancel invitation for ${m.display_name}`}
                onClick={() =>
                  confirmDelete(() => remove.mutateAsync(m.id), {
                    title: `Cancel ${m.display_name}'s invitation?`,
                    content:
                      "They won't be able to join. You can invite them again later.",
                    okText: "Cancel invitation",
                  })
                }
              />
            )}
          </li>
        ))}
      </ul>
      {isOwner && (
        <Form<InviteValues>
          form={form}
          layout='vertical'
          requiredMark={false}
          className='border-t bg-surface-muted px-4 py-4 sm:px-5'
          onFinish={(values) =>
            invite.mutate(
              {
                email: values.email.trim(),
                displayName: values.displayName?.trim() || undefined,
              },
              { onSuccess: () => form.resetFields() },
            )
          }
        >
          <div className='flex flex-col gap-2 sm:flex-row sm:items-start'>
            <Form.Item
              name='email'
              className='mb-0 flex-1'
              rules={[
                { required: true, message: "Enter an email" },
                { type: "email", message: "Enter a valid email" },
              ]}
            >
              <Input
                type='email'
                inputMode='email'
                autoComplete='off'
                className='text-base sm:text-sm'
                placeholder='Email'
              />
            </Form.Item>
            <Form.Item name='displayName' className='mb-0 flex-1'>
              <Input
                maxLength={80}
                className='text-base sm:text-sm'
                placeholder='Name (optional)'
              />
            </Form.Item>
            <Button
              htmlType='submit'
              icon={<UserPlus />}
              loading={invite.isPending}
            >
              Invite
            </Button>
          </div>
        </Form>
      )}
    </SettingsPanel>
  );
}

interface MemberNameProps {
  member: FundMember;
  you?: boolean;
}

function MemberName({ member: m, you }: MemberNameProps) {
  return (
    <div className='flex min-w-0 flex-1 flex-col'>
      <span className='flex items-center gap-2 text-sm font-medium text-foreground'>
        <span className='truncate'>
          {m.display_name}
          {you && (
            <span className='font-normal text-muted-foreground'> (you)</span>
          )}
        </span>
        {m.role === "owner" && <Badge variant='brand'>Owner</Badge>}
        {m.status === "invited" && <Badge variant='warning'>Invited</Badge>}
      </span>
      <span className='truncate text-xs text-muted-foreground'>{m.email}</span>
    </div>
  );
}
