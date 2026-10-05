import { useId, type ReactNode } from "react";

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
      <label
        htmlFor={id}
        className='text-sm leading-none text-foreground-light select-none'
      >
        {label}
      </label>
      {children(id)}
      {error ? (
        <p className='text-xs text-destructive'>{error}</p>
      ) : hint ? (
        <p className='text-xs text-muted-foreground'>{hint}</p>
      ) : null}
    </div>
  );
}
