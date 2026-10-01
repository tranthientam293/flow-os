import { cn } from "@/utils";

function BreadcrumbSlash({ className }: { className?: string }) {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 16 16'
      aria-hidden='true'
      className={cn("shrink-0 text-border-strong", className)}
    >
      <path
        d='M10.5 2.5 5.5 13.5'
        stroke='currentColor'
        strokeWidth='1.2'
        strokeLinecap='round'
      />
    </svg>
  );
}

export { BreadcrumbSlash };
