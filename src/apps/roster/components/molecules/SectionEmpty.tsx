import { Bell, Building2, GraduationCap } from "lucide-react";
import { Button } from "antd";
import { EmptyState } from "@/components/molecules";
import type { RosterSection } from "../../constants/routes";

export function SectionEmpty({
  section,
  email,
  inviteCount,
  ownsCenter,
  onCreate,
}: {
  section: RosterSection;
  email: string;
  inviteCount: number;
  ownsCenter: boolean;
  onCreate: () => void;
}) {
  if (section === "centers")
    return (
      <EmptyState
        icon={Building2}
        title='You don’t own a center yet'
        description='Create your center, add branches and invite your trainers.'
        action={
          <Button type='primary' size='small' onClick={onCreate}>
            Create a center
          </Button>
        }
        className='flex-1'
      />
    );

  return (
    <EmptyState
      icon={GraduationCap}
      title='You aren’t a trainer at any center yet'
      description={
        inviteCount ? (
          <>
            You have {inviteCount}{" "}
            {inviteCount === 1 ? "invitation" : "invitations"}. Open the{" "}
            <Bell className='inline size-3.5 align-[-2px]' /> bell at the top to
            join.
          </>
        ) : (
          <>
            Ask a center’s owner to invite{" "}
            <span className='text-foreground'>{email}</span>. The invitation
            shows up in the <Bell className='inline size-3.5 align-[-2px]' />{" "}
            bell at the top.
          </>
        )
      }
      action={
        ownsCenter ? (
          <p className='max-w-sm text-xs text-muted-foreground'>
            Own a center and train there too? Turn on “Show me in the trainer
            list” in its Settings tab.
          </p>
        ) : undefined
      }
      className='flex-1'
    />
  );
}
