import { useEffect } from "react";
import { Outlet } from "react-router";
import { Wordmark } from "@/components/atoms";
import { APP_NAME } from "@/constants";

export function AuthLayout() {
  useEffect(() => {
    document.title = APP_NAME;
  }, []);

  return (
    <div className='flex min-h-full bg-background'>
      <div className='flex w-full flex-col px-6 py-6 sm:px-10 lg:w-120 lg:shrink-0 lg:border-r lg:bg-card'>
        <Wordmark />
        <div className='mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12'>
          <Outlet />
        </div>
      </div>

      <div className='hidden flex-1 items-center justify-center dot-grid p-12 lg:flex'>
        <figure className='max-w-md'>
          <blockquote className='text-2xl leading-snug text-foreground'>
            “One place for the small tools I reach for every day. Open it, get
            it done, get back to work.”
          </blockquote>
          <figcaption className='mt-6 flex items-center gap-3 text-sm text-muted-foreground'>
            <span className='h-px w-8 bg-border-strong' />
            The idea behind {APP_NAME}
          </figcaption>
        </figure>
      </div>
    </div>
  );
}
