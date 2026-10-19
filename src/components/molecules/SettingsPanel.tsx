import type { ReactNode } from "react";
import { Card } from "antd";
import { cn } from "@/utils";

interface SettingsPanelProps {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  // Drops the body padding so content like a table runs edge to edge.
  flush?: boolean;
}

export function SettingsPanel({
  title,
  description,
  children,
  footer,
  flush = false,
}: SettingsPanelProps) {
  return (
    <Card className='overflow-hidden' classNames={{ body: "p-0" }}>
      <div className='border-b px-4 py-4 sm:px-5'>
        <h2 className='text-sm font-medium text-foreground'>{title}</h2>
        <p className='mt-0.5 text-xs text-muted-foreground'>{description}</p>
      </div>
      <div className={cn(!flush && "px-4 py-5 sm:px-5")}>{children}</div>
      {footer && (
        <div className='flex flex-wrap items-center justify-end gap-2 border-t bg-surface-muted px-4 py-3 sm:px-5'>
          {footer}
        </div>
      )}
    </Card>
  );
}
