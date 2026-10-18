import { useMutation, useQueries } from "@tanstack/react-query";
import { ArchiveRestore, Trash2 } from "lucide-react";
import { Button, Spin, Table } from "antd";
import { EmptyState } from "@/components/molecules";
import {
  deletedSessionsQueryOptions,
  restoreSessionMutationOptions,
} from "../../apis/sessions";
import type { RosterSection } from "../../constants/routes";
import { RosterContext, useRoster } from "../../context/roster-context";
import { useCenterContexts } from "../../hooks/useCenterContexts";
import type { Membership, Session } from "../../models/roster";
import {
  DATE,
  formatDate,
  formatLongDay,
  formatRange,
  inCurrentMonth,
  inTz,
} from "../../utils/time";
import { BranchTag } from "../atoms";

interface MyDeletedViewProps {
  section: RosterSection;
  memberships: Membership[];
}

export function MyDeletedView({ section, memberships }: MyDeletedViewProps) {
  const { contexts } = useCenterContexts(section, memberships, () => {});
  const queries = useQueries({
    queries: memberships.map((m) =>
      deletedSessionsQueryOptions(m.center.id, m.id),
    ),
  });
  const groups = memberships
    .map((m, i) => ({ membership: m, sessions: queries[i]?.data ?? [] }))
    .filter((g) => g.sessions.length);

  return (
    <div className='mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-4 sm:px-6'>
      <div>
        <h2 className='text-base font-medium text-foreground'>Deleted</h2>
        <p className='text-sm text-muted-foreground'>
          Sessions you or the owner deleted. Restore puts one back on the
          schedule while it’s in the current month.
        </p>
      </div>
      {queries.some((q) => q.isLoading) ? (
        <Spin className='self-center' />
      ) : groups.length ? (
        groups.map(({ membership, sessions }) => {
          const ctx = contexts.get(membership.center.id);
          return ctx ? (
            <RosterContext.Provider key={membership.center.id} value={ctx}>
              {memberships.length > 1 && (
                <h3 className='text-sm font-medium text-foreground'>
                  {membership.center.name}
                </h3>
              )}
              <DeletedTable sessions={sessions} />
            </RosterContext.Provider>
          ) : null;
        })
      ) : (
        <EmptyState
          icon={Trash2}
          title='No deleted sessions'
          description='Sessions you delete show up here, so you can restore them.'
        />
      )}
    </div>
  );
}

interface DeletedTableProps {
  sessions: Session[];
}

function DeletedTable({ sessions }: DeletedTableProps) {
  const { center, branchById, typeById } = useRoster();
  const tz = center.timezone;
  const restore = useMutation(restoreSessionMutationOptions(center.id));

  return (
    <Table<Session>
      rowKey='id'
      size='small'
      pagination={false}
      dataSource={sessions}
      scroll={{ x: "max-content" }}
      columns={[
        {
          title: "Date",
          render: (_, s) => formatLongDay(inTz(s.starts_at, tz).format(DATE)),
        },
        {
          title: "Time",
          className: "tabular-nums",
          render: (_, s) => formatRange(s.starts_at, s.ends_at, tz),
        },
        {
          title: "Branch",
          render: (_, s) => <BranchTag branch={branchById.get(s.branch_id)} />,
        },
        {
          title: "Session",
          render: (_, s) =>
            s.title ||
            (s.session_type_id && typeById.get(s.session_type_id)?.name) ||
            "Session",
        },
        {
          title: "Deleted",
          render: (_, s) =>
            s.deleted_at
              ? formatDate(inTz(s.deleted_at, tz).format(DATE))
              : "—",
        },
        {
          key: "actions",
          align: "right",
          render: (_, s) => {
            const canRestore = inCurrentMonth(center, s.starts_at);
            return (
              <Button
                size='small'
                icon={<ArchiveRestore />}
                title={
                  canRestore
                    ? undefined
                    : "Only sessions in the current month can be restored"
                }
                disabled={!canRestore}
                loading={restore.isPending && restore.variables === s.id}
                onClick={() => restore.mutate(s.id)}
              >
                Restore
              </Button>
            );
          },
        },
      ]}
    />
  );
}
