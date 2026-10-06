import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { MoreHorizontal, Plus, Users } from "lucide-react";
import { Button, Dropdown, Grid, Modal, Table, Tag } from "antd";
import { Badge } from "@/components/atoms";
import { CopyButton, EmptyState } from "@/components/molecules";
import { dayjs } from "@/libs";
import {
  membersQueryOptions,
  removeMemberMutationOptions,
  setMemberStatusMutationOptions,
} from "../apis/members";
import { useRoster } from "../context/roster-context";
import type { Member } from "../models/roster";
import { formatRate } from "../utils/money";
import { MemberAvatar } from "./MemberAvatar";
import { TrainerModal } from "./TrainerModal";

const inviteMessage = (name: string, email: string, center: string) =>
  `Hi ${name}, sign in to flowOS with ${email}, install Roster from the App Store and open it to join ${center}.`;

const statusBadge = (m: Member) =>
  m.status === "invited" ? (
    <Badge variant='warning'>Invited</Badge>
  ) : m.status === "inactive" ? (
    <Badge>Inactive</Badge>
  ) : (
    <Badge>Active</Badge>
  );

const registered = (m: Member) => dayjs(m.created_at).format("MMM D, YYYY");

export function TrainersView() {
  const {
    center,
    branchById,
    memberBranches,
    memberSessionTypes,
    typeById,
    filters,
    setFilters,
    goTo,
  } = useRoster();
  const screens = Grid.useBreakpoint();
  const members = useQuery(membersQueryOptions(center.id));
  const setStatus = useMutation(setMemberStatusMutationOptions(center.id));
  const remove = useMutation(removeMemberMutationOptions(center.id));
  const [modal, modalHolder] = Modal.useModal();
  const [editing, setEditing] = useState<Member | "new" | null>(null);
  const [invited, setInvited] = useState<Member | null>(null);

  // The owner never shows here; they opt into booking as a trainer in Settings.
  const list = (members.data ?? []).filter((m) => m.role === "trainer");
  const viewWeek = (m: Member) => {
    setFilters({ ...filters, memberIds: [m.id], onlyMe: false });
    goTo("schedule");
  };

  const confirmRemove = (m: Member) =>
    modal.confirm({
      title: `Remove ${m.display_name}?`,
      content: `This only works when they have no sessions. Otherwise deactivate them to keep their history.`,
      okText: "Remove",
      okButtonProps: { danger: true },
      onOk: () => remove.mutateAsync(m.id),
    });

  const sessionsOf = (m: Member) =>
    memberSessionTypes.filter((mst) => mst.member_id === m.id);

  // One line per session type, so the Sessions and Salary columns line up.
  const sessionList = (m: Member) => {
    const rows = sessionsOf(m);
    return rows.length ? (
      rows.map((mst) => (
        <span key={mst.session_type_id} className='block truncate leading-6'>
          {typeById.get(mst.session_type_id)?.name}
        </span>
      ))
    ) : (
      <span className='leading-6 text-muted-foreground'>All session types</span>
    );
  };

  // A trainer's salary falls back to the type's default.
  const salaryList = (m: Member) => {
    const rows = sessionsOf(m);
    return rows.length ? (
      rows.map((mst) => (
        <span
          key={mst.session_type_id}
          className='block leading-6 whitespace-nowrap tabular-nums'
        >
          {formatRate(
            mst.hourly_rate ??
              typeById.get(mst.session_type_id)?.default_hourly_rate,
          )}
        </span>
      ))
    ) : (
      <span className='leading-6 text-muted-foreground'>Default salaries</span>
    );
  };
  const branchChips = (m: Member) =>
    m.any_branch ? (
      <Tag className='me-0'>Any branch</Tag>
    ) : (
      memberBranches
        .filter((mb) => mb.member_id === m.id)
        .map((mb) => (
          <Tag key={mb.branch_id} className='me-0 font-mono'>
            {branchById.get(mb.branch_id)?.code}
          </Tag>
        ))
    );

  const actions = (m: Member) => {
    const items = [
      { key: "edit", label: "Edit", onClick: () => setEditing(m) },
      { key: "week", label: "View week", onClick: () => viewWeek(m) },
      ...(m.status === "invited"
        ? [
            {
              key: "invite",
              label: "Invite message",
              onClick: () => setInvited(m),
            },
          ]
        : []),
      m.status === "inactive"
        ? {
            key: "reactivate",
            label: "Reactivate",
            onClick: () =>
              setStatus.mutate({
                id: m.id,
                status: m.user_id ? "active" : "invited",
              }),
          }
        : {
            key: "deactivate",
            label: "Deactivate",
            onClick: () => setStatus.mutate({ id: m.id, status: "inactive" }),
          },
      {
        key: "remove",
        label: "Remove",
        danger: true,
        onClick: () => confirmRemove(m),
      },
    ];
    return (
      <Dropdown menu={{ items }} trigger={["click"]}>
        <Button
          size='small'
          type='text'
          icon={<MoreHorizontal />}
          aria-label={`Actions for ${m.display_name}`}
        />
      </Dropdown>
    );
  };

  return (
    <div className='flex flex-col gap-4 px-4 py-4 sm:px-6'>
      {modalHolder}
      <div className='flex justify-end'>
        <Button
          type='primary'
          icon={<Plus />}
          onClick={() => setEditing("new")}
        >
          Invite trainer
        </Button>
      </div>

      {!members.isLoading && !list.length && (
        <EmptyState
          icon={Users}
          title='No trainers yet'
          description='Invite trainers by email. They see the invite in Roster’s notification bell after signing in to flowOS with that email.'
          className='min-h-40'
        />
      )}

      {screens.md ? (
        <Table<Member>
          rowKey='id'
          size='small'
          loading={members.isLoading}
          pagination={false}
          dataSource={list}
          onRow={(m) => ({ onDoubleClick: () => viewWeek(m) })}
          columns={[
            {
              title: "Name",
              render: (_, m) => (
                <button
                  type='button'
                  className='flex items-center gap-2 text-left hover:underline'
                  onClick={() => viewWeek(m)}
                >
                  <MemberAvatar name={m.display_name} color={m.color} />
                  {m.display_name}
                </button>
              ),
            },
            {
              title: "Contact",
              render: (_, m) => (
                <div className='text-xs'>
                  <div>{m.email}</div>
                  {m.phone && (
                    <div className='text-muted-foreground'>{m.phone}</div>
                  )}
                </div>
              ),
            },
            {
              title: "Branches",
              render: (_, m) => (
                <div className='flex flex-wrap gap-1'>{branchChips(m)}</div>
              ),
            },
            {
              title: "Sessions",
              render: (_, m) => <div className='text-sm'>{sessionList(m)}</div>,
            },
            {
              title: "Salary",
              align: "right",
              render: (_, m) => <div className='text-sm'>{salaryList(m)}</div>,
            },
            {
              title: "Registered",
              render: (_, m) => (
                <span className='whitespace-nowrap'>{registered(m)}</span>
              ),
            },
            { title: "Status", render: (_, m) => statusBadge(m) },
            { key: "actions", width: 48, render: (_, m) => actions(m) },
          ]}
        />
      ) : (
        <ul className='flex flex-col gap-2'>
          {list.map((m) => (
            <li key={m.id} className='rounded-md border bg-card p-3'>
              <div className='flex items-center gap-2'>
                <MemberAvatar name={m.display_name} color={m.color} />
                <span className='min-w-0 flex-1 truncate text-sm text-foreground'>
                  {m.display_name}
                </span>
                {statusBadge(m)}
                {actions(m)}
              </div>
              <div className='mt-2 text-xs text-muted-foreground'>
                {m.email} · Registered {registered(m)}
              </div>
              <div className='mt-2 flex flex-wrap gap-1'>{branchChips(m)}</div>
              <div className='mt-2 grid grid-cols-[1fr_auto] gap-x-3 text-xs'>
                <div className='min-w-0'>{sessionList(m)}</div>
                <div className='text-right'>{salaryList(m)}</div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <TrainerModal
        member={editing}
        onClose={() => setEditing(null)}
        onCreated={setInvited}
      />
      <Modal
        open={!!invited}
        title='Next step'
        onCancel={() => setInvited(null)}
        footer={null}
      >
        {invited && (
          <div className='flex flex-col gap-3'>
            <p className='text-sm text-foreground-light'>
              Ask {invited.display_name} to sign in to flowOS with{" "}
              <span className='font-medium text-foreground'>
                {invited.email}
              </span>{" "}
              and open Roster. Nothing is emailed automatically.
            </p>
            <div className='rounded-md border bg-surface-muted p-3 text-sm'>
              {inviteMessage(invited.display_name, invited.email, center.name)}
            </div>
            <div className='flex justify-end'>
              <CopyButton
                value={inviteMessage(
                  invited.display_name,
                  invited.email,
                  center.name,
                )}
                label='Copy message'
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
