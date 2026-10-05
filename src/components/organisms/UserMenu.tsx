import { useNavigate } from "react-router";
import { LogOut, Settings, UserRound } from "lucide-react";
import { Avatar, Dropdown } from "antd";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ROUTES } from "@/constants";
import { useRequiredUser } from "@/context";
import { profileQueryOptions, signOutMutationOptions } from "@/apis";
import { getDisplayName } from "@/utils";

export function UserMenu() {
  const user = useRequiredUser();
  const { data: profile } = useQuery(profileQueryOptions(user.id));
  const navigate = useNavigate();
  const signOut = useMutation(signOutMutationOptions());
  const name = getDisplayName(user, profile);

  return (
    <Dropdown
      trigger={["click"]}
      placement='bottomRight'
      menu={{
        className: "w-56",
        items: [
          {
            key: "account",
            type: "group",
            label: (
              <>
                <div className='truncate text-sm text-foreground'>{name}</div>
                <div className='truncate text-xs text-muted-foreground'>
                  {user.email}
                </div>
              </>
            ),
          },
          { type: "divider" },
          {
            key: "settings",
            icon: <Settings />,
            label: "Account settings",
            onClick: () => navigate(ROUTES.SETTINGS),
          },
          { type: "divider" },
          {
            key: "sign-out",
            icon: <LogOut />,
            label: "Sign out",
            onClick: () => signOut.mutate(),
          },
        ],
      }}
    >
      <button
        type='button'
        className='cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
        aria-label='Account menu'
      >
        <Avatar
          size={26}
          icon={<UserRound className='size-3.5' strokeWidth={2} />}
          className='bg-foreground text-background'
        />
      </button>
    </Dropdown>
  );
}
