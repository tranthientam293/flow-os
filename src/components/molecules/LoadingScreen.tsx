import { LogoMark } from "@/components/atoms";

export function LoadingScreen() {
  return (
    <output className='relative flex h-dvh items-center justify-center overflow-hidden bg-background'>
      <div
        aria-hidden='true'
        className='absolute inset-0 dot-grid [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_65%)]'
      />

      {/* Delayed fade-in, so fast loads never flash this screen. */}
      <div className='relative flex animate-fade-up-delayed flex-col items-center'>
        <div className='flex size-14 items-center justify-center rounded-xl border bg-card shadow-sm'>
          <LogoMark size={28} />
        </div>
        <span className='mt-4 text-base font-semibold tracking-tight text-foreground'>
          flow<span className='text-brand-strong'>OS</span>
        </span>
        <div className='mt-5 h-0.5 w-28 overflow-hidden rounded-full bg-border'>
          <div className='h-full w-1/3 animate-loading-bar rounded-full bg-brand' />
        </div>
        <span className='sr-only'>Loading</span>
      </div>
    </output>
  );
}
