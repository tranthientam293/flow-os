import { useNavigate } from "react-router";
import { LogOut, Settings } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Avatar,
  AvatarFallback,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/atoms";
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
    <DropdownMenu>
      <DropdownMenuTrigger
        className='cursor-pointer rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50'
        aria-label={t("userMenu.trigger")}
      >
        <Avatar className='size-8'>
          <AvatarFallback className='bg-foreground text-xs font-semibold text-background'>
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-56'>
        <DropdownMenuLabel className='font-normal'>
          <div className='truncate text-sm text-foreground'>{name}</div>
          <div className='truncate text-xs text-muted-foreground'>
            {user.email}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate(ROUTES.SETTINGS)}>
          <Settings /> {t("userMenu.accountSettings")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => signOut.mutate()}>
          <LogOut /> {t("userMenu.logOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
