import { useNavigate } from "react-router";
import { LogOut, Settings } from "lucide-react";
import { Avatar, Dropdown } from "antd";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ROUTES } from "@/constants";
import { useRequiredUser } from "@/context";
import { profileQueryOptions, signOutMutationOptions } from "@/apis";
import { getDisplayName, getInitials } from "@/utils";

export function UserMenu() {
  const { t } = useTranslation();
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
            label: t("userMenu.accountSettings"),
            onClick: () => navigate(ROUTES.SETTINGS),
          },
          { type: "divider" },
          {
            key: "logout",
            icon: <LogOut />,
            label: t("userMenu.logOut"),
            onClick: () => signOut.mutate(),
          },
        ],
      }}
    >
      <button
        type='button'
        className='cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
        aria-label={t("userMenu.trigger")}
      >
        <Avatar
          size={32}
          className='bg-foreground text-xs font-semibold text-background'
        >
          {getInitials(name)}
        </Avatar>
      </button>
    </Dropdown>
  );
}
