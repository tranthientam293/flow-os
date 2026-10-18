interface PageTitleProps {
  title: string;
  description: string;
}
export function PageTitle({ title, description }: PageTitleProps) {
  return (
    <div>
      <h1 className='text-base font-medium text-foreground'>{title}</h1>
      <p className='text-sm text-muted-foreground'>{description}</p>
    </div>
  );
}
