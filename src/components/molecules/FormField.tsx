import { useId, type ReactNode } from "react";
import { Label } from "@/components/atoms";

type FormFieldProps = {
  label: string;
  hint?: ReactNode;
  error?: string | null;
  children: (id: string) => ReactNode;
};

export function FormField({ label, hint, error, children }: FormFieldProps) {
  const id = useId();
  return (
    <div className='flex flex-col gap-1.5'>
      <Label htmlFor={id} className='font-normal text-foreground-light'>
        {label}
      </Label>
      {children(id)}
      {error ? (
        <p className='text-xs text-destructive'>{error}</p>
      ) : hint ? (
        <p className='text-xs text-muted-foreground'>{hint}</p>
      ) : null}
    </div>
  );
}
