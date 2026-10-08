import { Link } from "react-router";
import { ChevronRight, Clock, Globe, Plus } from "lucide-react";
import { timezoneLabel } from "../../constants/options";
import { sectionOf, type RosterSection } from "../../constants/routes";
import { useRosterPaths } from "../../hooks/useRosterPaths";
import type { Membership } from "../../models/roster";
import { hhmm } from "../../utils/time";

// One card per center; each center is viewed and managed on its own.
export function CenterList({
  section,
  memberships,
  onCreateCenter,
}: {
  section: RosterSection;
  memberships: Membership[];
  onCreateCenter?: () => void;
}) {
  const paths = useRosterPaths();
  const { tabs, title, description } = sectionOf(section);

  return (
    <div className='flex flex-col gap-4 px-4 py-4 sm:px-6'>
      <div>
        <h2 className='text-base font-medium text-foreground'>{title}</h2>
        <p className='text-sm text-muted-foreground'>{description}</p>
      </div>

      <ul className='grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
        {memberships.map(({ id, center }) => (
          <li key={id} className='flex flex-col rounded-md border bg-card'>
            <Link
              to={paths.center(section, center.id, tabs[0].key)}
              className='group flex items-start gap-2 rounded-t-md p-4 transition-colors hover:bg-accent'
            >
              <div className='min-w-0 flex-1'>
                <div className='truncate font-medium text-foreground'>
                  {center.name}
                </div>
                <div className='mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground'>
                  <span className='flex items-center gap-1'>
                    <Globe className='size-3.5' />
                    {timezoneLabel(center.timezone)}
                  </span>
                  <span className='flex items-center gap-1'>
                    <Clock className='size-3.5' />
                    {hhmm(center.opens_at)}–{hhmm(center.closes_at)}
                  </span>
                </div>
              </div>
              <ChevronRight className='mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5' />
            </Link>
            <nav
              aria-label={`${center.name} sections`}
              className='mt-auto flex flex-wrap gap-1 border-t p-2'
            >
              {tabs.map((t) => (
                <Link
                  key={t.key}
                  to={paths.center(section, center.id, t.key)}
                  className='flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-foreground-light transition-colors hover:bg-accent hover:text-foreground'
                >
                  <t.icon className='size-3.5' strokeWidth={1.75} />
                  {t.label}
                </Link>
              ))}
            </nav>
          </li>
        ))}
        {onCreateCenter && (
          <li>
            <button
              type='button'
              onClick={onCreateCenter}
              className='flex h-full min-h-28 w-full items-center justify-center gap-1.5 rounded-md border border-dashed text-sm text-foreground-light transition-colors hover:border-border-strong hover:text-foreground'
            >
              <Plus className='size-4' /> Create a center
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}
