import { useState } from "react";
import { useMutation, useQueries, useQuery } from "@tanstack/react-query";
import { CircleStop, Pencil, Repeat as RepeatIcon } from "lucide-react";
import { Button, Popconfirm, Spin } from "antd";
import { EmptyState } from "@/components/molecules";
import {
  repeatsQueryOptions,
  stopRepeatMutationOptions,
} from "../../apis/repeats";
import type { RosterSection } from "../../constants/routes";
import { RosterContext, useRoster } from "../../context/roster-context";
import { useCenterContexts } from "../../hooks/useCenterContexts";
import type { Membership, Repeat } from "../../models/roster";
import { formatDate, hhmm } from "../../utils/time";
import { formatWeekdays } from "../../utils/weekdays";
import { BranchTag, MemberAvatar } from "../atoms";
import { RepeatModal } from "./RepeatModal";

const EMPTY = (
  <EmptyState
    icon={RepeatIcon}
    title='No repeats'
    description='Turn on “Repeat every week” when creating a session to book it every week.'
  />
);

// A center's active repeats (Manage centers → Repeats): every trainer's for
// the owner.
export function CenterRepeatsView() {
  const { center } = useRoster();
  const repeats = useQuery(repeatsQueryOptions(center.id));

  return (
    <div className='mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-4 sm:px-6'>
      <RepeatsIntro />
      {repeats.isLoading ? (
        <Spin className='self-center' />
      ) : repeats.data?.length ? (
        <RepeatList repeats={repeats.data} showTrainer />
      ) : (
        EMPTY
      )}
    </div>
  );
}

// Your own active repeats at every center you train at (My schedule →
// Repeats), grouped by center.
export function MyRepeatsView({
  section,
  memberships,
}: {
  section: RosterSection;
  memberships: Membership[];
}) {
  const { contexts } = useCenterContexts(section, memberships, () => {});
  const queries = useQueries({
    queries: memberships.map((m) => repeatsQueryOptions(m.center.id)),
  });
  const groups = memberships
    .map((m, i) => ({
      membership: m,
      repeats: (queries[i]?.data ?? []).filter((r) => r.member_id === m.id),
    }))
    .filter((g) => g.repeats.length);

  return (
    <div className='mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-4 sm:px-6'>
      <RepeatsIntro />
      {queries.some((q) => q.isLoading) ? (
        <Spin className='self-center' />
      ) : groups.length ? (
        groups.map(({ membership, repeats }) => {
          const ctx = contexts.get(membership.center.id);
          return ctx ? (
            <RosterContext.Provider key={membership.center.id} value={ctx}>
              {memberships.length > 1 && (
                <h3 className='text-sm font-medium text-foreground'>
                  {membership.center.name}
                </h3>
              )}
              <RepeatList repeats={repeats} />
            </RosterContext.Provider>
          ) : null;
        })
      ) : (
        EMPTY
      )}
    </div>
  );
}

function RepeatsIntro() {
  return (
    <div>
      <h2 className='text-base font-medium text-foreground'>Repeats</h2>
      <p className='text-sm text-muted-foreground'>
        Sessions booked every week. Each week is added on the last day of the
        week before. Editing or stopping a repeat changes its sessions from now
        on; sessions already held and ones edited by hand stay.
      </p>
    </div>
  );
}

function RepeatList({
  repeats,
  showTrainer = false,
}: {
  repeats: Repeat[];
  showTrainer?: boolean;
}) {
  return (
    <ul className='divide-y rounded-lg border bg-card'>
      {repeats.map((r) => (
        <RepeatRow key={r.id} repeat={r} showTrainer={showTrainer} />
      ))}
    </ul>
  );
}

function RepeatRow({
  repeat,
  showTrainer,
}: {
  repeat: Repeat;
  showTrainer: boolean;
}) {
  const { center, memberById, branchById, typeById } = useRoster();
  const stop = useMutation(stopRepeatMutationOptions(center.id));
  const [editing, setEditing] = useState(false);
  const member = memberById.get(repeat.member_id);
  const type = repeat.session_type_id
    ? typeById.get(repeat.session_type_id)
    : undefined;

  return (
    <li className='flex items-start gap-3 p-3 sm:items-center sm:gap-4 sm:p-4'>
      <div className='min-w-0 flex-1'>
        <p className='font-medium text-foreground'>
          {formatWeekdays(repeat.weekdays, center.week_start)} ·{" "}
          <span className='tabular-nums'>
            {hhmm(repeat.starts_time)}–{hhmm(repeat.ends_time)}
          </span>
        </p>
        <p className='mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground'>
          {showTrainer && member && (
            <span className='flex items-center gap-1'>
              <MemberAvatar
                name={member.display_name}
                color={member.color}
                size='sm'
              />
              {member.display_name}
            </span>
          )}
          <BranchTag branch={branchById.get(repeat.branch_id)} showName />
          <span>
            {repeat.title || type?.name || "Session"} · {repeat.trainee_count}{" "}
            {repeat.trainee_count === 1 ? "trainee" : "trainees"}
          </span>
          <span>Since {formatDate(repeat.starts_on)}</span>
        </p>
      </div>
      <div className='flex shrink-0 gap-1'>
        <Button
          type='text'
          icon={<Pencil />}
          title='Edit repeat'
          aria-label='Edit repeat'
          onClick={() => setEditing(true)}
        />
        <Popconfirm
          title='Stop this repeat?'
          description='No new weeks are booked, and its upcoming sessions are removed. Sessions already held, and upcoming ones edited by hand, stay.'
          okText='Stop repeat'
          okButtonProps={{ danger: true }}
          onConfirm={() => stop.mutate(repeat.id)}
        >
          <Button
            type='text'
            danger
            icon={<CircleStop />}
            title='Stop repeat'
            aria-label='Stop repeat'
            loading={stop.isPending}
          />
        </Popconfirm>
      </div>
      {editing && (
        <RepeatModal repeat={repeat} onClose={() => setEditing(false)} />
      )}
    </li>
  );
}
