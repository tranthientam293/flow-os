import { useState } from "react";
import { History } from "lucide-react";
import { Skeleton } from "antd";
import { fromNow } from "@/libs";
import { useSessionEvents } from "../../hooks/useSessionEvents";

// The latest change to a session, with the earlier ones on demand.
export function SessionHistory({ sessionId }: { sessionId: string }) {
  const { events, isLoading, describe } = useSessionEvents(sessionId);
  const [expanded, setExpanded] = useState(false);
  const [last, ...earlier] = events;
  if (isLoading)
    return (
      <Skeleton
        active
        title={false}
        paragraph={{ rows: 1, width: "70%" }}
        className='mb-4'
      />
    );
  if (!last) return null;

  return (
    <div className='mb-4 text-xs text-muted-foreground'>
      <p className='flex flex-wrap items-center gap-1.5'>
        <History className='size-3.5 shrink-0' />
        {describe(last)} · {fromNow(last.created_at)}
        {earlier.length > 0 && (
          <button
            type='button'
            className='underline-offset-2 hover:text-foreground hover:underline'
            aria-expanded={expanded}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "Hide history" : `History (${earlier.length})`}
          </button>
        )}
      </p>
      {expanded && (
        <ul className='ms-1.5 mt-1 flex flex-col gap-0.5 border-l ps-3'>
          {earlier.map((e) => (
            <li key={e.id}>
              {describe(e)} · {fromNow(e.created_at)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
