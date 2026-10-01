import type { ReactNode } from "react";
import { Card } from "@/components/atoms";

type SettingsPanelProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function SettingsPanel({
  title,
  description,
  children,
  footer,
}: SettingsPanelProps) {
  return (
    <Card className='gap-0 overflow-hidden py-0 shadow-none'>
      <div className='border-b px-4 py-4 sm:px-5'>
        <h2 className='text-sm font-medium text-foreground'>{title}</h2>
        <p className='mt-0.5 text-xs text-muted-foreground'>{description}</p>
      </div>
      <div className='px-4 py-5 sm:px-5'>{children}</div>
      {footer && (
        <div className='flex flex-wrap items-center justify-end gap-2 border-t bg-surface-muted px-4 py-3 sm:px-5'>
          {footer}
        </div>
      )}
    </Card>
  );
}
