import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { Link } from "react-router";

interface BackLinkProps {
  to: string;
  children: ReactNode;
}

// "‹ Funds" above a page's title, back to the screen it was opened from.
export function BackLink({ to, children }: BackLinkProps) {
  return (
    <Link
      to={to}
      className='-ms-1 flex w-fit max-w-full items-center gap-0.5 rounded-md text-sm text-foreground-light outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50'
    >
      <ChevronLeft className='size-4 shrink-0' />
      <span className='truncate'>{children}</span>
    </Link>
  );
}
