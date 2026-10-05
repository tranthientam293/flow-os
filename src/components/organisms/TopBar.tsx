import { Link, useLocation } from "react-router";
import { ChevronsUpDown, Menu } from "lucide-react";
import { Button } from "antd";
import { useQuery } from "@tanstack/react-query";
import { Badge, BreadcrumbSlash, LogoMark } from "@/components/atoms";
import { ROUTES, APP_NAME } from "@/constants";
import { useRequiredUser } from "@/context";
import { useCurrentApp, usePageTitle } from "@/hooks";
import { profileQueryOptions } from "@/apis";
import { useUiStore } from "@/stores";
import { getDisplayName } from "@/utils";
import { UserMenu } from "./UserMenu";

export function TopBar() {
  const user = useRequiredUser();
  const { data: profile } = useQuery(profileQueryOptions(user.id));
  const { pathname } = useLocation();
  const title = usePageTitle();
  const currentApp = useCurrentApp();
  const setMobileNavOpen = useUiStore((s) => s.setMobileNavOpen);

  return (
    <header className='flex h-12 shrink-0 items-center gap-1.5 border-b bg-card px-2 sm:gap-2 sm:px-3'>
      <Button
        type='text'
        className='-ml-1 size-8 md:hidden'
        icon={<Menu />}
        onClick={() => setMobileNavOpen(true)}
        aria-label='Open navigation'
      />

      <Link
        to={ROUTES.HOME}
        className='rounded-md p-1'
        aria-label={`${APP_NAME} home`}
      >
        <LogoMark />
      </Link>

      <nav aria-label='Breadcrumb' className='min-w-0'>
        <ol className='flex min-w-0 items-center gap-1 text-sm'>
          <li aria-hidden='true'>
            <BreadcrumbSlash />
          </li>
          <li className='hidden min-w-0 items-center gap-2 sm:flex'>
            <span className='truncate text-foreground'>
              {getDisplayName(user, profile)}’s workspace
            </span>
            <Badge variant='status'>Free</Badge>
            <ChevronsUpDown className='size-3.5 shrink-0 text-muted-foreground' />
          </li>
          <li aria-hidden='true' className='hidden sm:block'>
            <BreadcrumbSlash />
          </li>
          <li className='flex min-w-0 items-center gap-2'>
            <Link
              to={pathname}
              aria-current='page'
              className='truncate text-foreground'
            >
              {title}
            </Link>
            {currentApp && (
              <Badge variant='warning'>v{currentApp.version}</Badge>
            )}
          </li>
        </ol>
      </nav>

      <div className='ml-auto flex items-center gap-2'>
        <UserMenu />
      </div>
    </header>
  );
}
