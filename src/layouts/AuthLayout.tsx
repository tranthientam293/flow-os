import { useEffect } from "react";
import { Outlet } from "react-router";
import { useTranslation } from "react-i18next";
import { Wordmark } from "@/components/atoms";
import { LanguageSwitcher } from "@/components/molecules";
import { APP_NAME } from "@/constants";

export function AuthLayout() {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = APP_NAME;
  }, []);

  return (
    <div className='flex min-h-full bg-background'>
      <div className='flex w-full flex-col px-6 py-6 sm:px-10 lg:w-[480px] lg:shrink-0 lg:border-r lg:bg-card'>
        <div className='flex items-center justify-between gap-2'>
          <Wordmark />
          <LanguageSwitcher />
        </div>
        <div className='mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12'>
          <Outlet />
        </div>
      </div>

      <div className='hidden flex-1 items-center justify-center dot-grid p-12 lg:flex'>
        <figure className='max-w-md'>
          <blockquote className='text-2xl leading-snug text-foreground'>
            {t("auth.quote")}
          </blockquote>
          <figcaption className='mt-6 flex items-center gap-3 text-sm text-muted-foreground'>
            <span className='h-px w-8 bg-border-strong' />
            {t("auth.quoteCaption", { app: APP_NAME })}
          </figcaption>
        </figure>
      </div>
    </div>
  );
}
