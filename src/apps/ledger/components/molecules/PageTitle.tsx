// A page's heading and one-line description, at the top of each Ledger page
// (phones have no top bar, so this is what names the page there).
export function PageTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h1 className='text-base font-medium text-foreground'>{title}</h1>
      <p className='text-sm text-muted-foreground'>{description}</p>
    </div>
  );
}
