import { cn } from "@/utils";

function LogoMark({
  size = 20,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='none'
      aria-hidden='true'
      className={className}
    >
      <path
        d='M5 17.5C7.5 9.5 16 14 19 6.5'
        stroke='var(--brand)'
        strokeWidth='2.4'
        strokeLinecap='round'
      />
      <circle cx='5' cy='17.5' r='2.2' fill='var(--brand)' />
      <circle cx='19' cy='6.5' r='2.2' fill='var(--brand)' />
    </svg>
  );
}

function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground",
        className,
      )}
    >
      <LogoMark size={24} />
      <span>
        flow<span className='text-brand-strong'>OS</span>
      </span>
    </span>
  );
}

export { LogoMark, Wordmark };
