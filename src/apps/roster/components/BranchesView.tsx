import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { MapPin, Plus } from "lucide-react";
import { Button, Form, Grid, Input, Modal, Switch, Table } from "antd";
import { Badge } from "@/components/atoms";
import { EmptyState } from "@/components/molecules";
import {
  archiveBranchMutationOptions,
  saveBranchMutationOptions,
} from "../apis/branches";
import { useRoster } from "../context/roster-context";
import { useSessions } from "../hooks/useSessions";
import type { Branch } from "../models/roster";
import { nextColor } from "../utils/colors";
import { todayIn, weekStartOf } from "../utils/time";
import { BranchTag } from "./BranchTag";
import { ColorSwatches } from "./ColorSwatches";

type Values = Pick<Branch, "name" | "code" | "color"> & { address?: string };

export function BranchesView() {
  const { center, branches, memberBranches, anyBranchIds } = useRoster();
  const screens = Grid.useBreakpoint();
  const [showArchived, setShowArchived] = useState(false);
  const [editing, setEditing] = useState<Branch | "new" | null>(null);
  const archive = useMutation(archiveBranchMutationOptions(center.id));
  const { all: weekSessions } = useSessions(
    weekStartOf(todayIn(center.timezone), center.week_start),
    7,
    { applyFilters: false },
  );

  const visible = branches.filter((b) => showArchived || !b.archived_at);
  const trainersAt = (id: string) =>
    new Set([
      ...memberBranches
        .filter((mb) => mb.branch_id === id)
        .map((mb) => mb.member_id),
      ...anyBranchIds,
    ]).size;
  const sessionsAt = (id: string) =>
    weekSessions.filter((s) => s.branch_id === id && s.status !== "cancelled")
      .length;

  const actions = (branch: Branch) => (
    <div className='flex justify-end gap-1'>
      <Button size='small' type='text' onClick={() => setEditing(branch)}>
        Edit
      </Button>
      <Button
        size='small'
        type='text'
        loading={archive.isPending && archive.variables?.id === branch.id}
        onClick={() =>
          archive.mutate({ id: branch.id, archived: !branch.archived_at })
        }
      >
        {branch.archived_at ? "Restore" : "Archive"}
      </Button>
    </div>
  );

  return (
    <div className='flex flex-col gap-4 px-4 py-4 sm:px-6'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <span className='flex items-center gap-2 text-sm text-foreground-light'>
          <Switch
            size='small'
            aria-label='Show archived'
            checked={showArchived}
            onChange={setShowArchived}
          />
          Show archived
        </span>
        <Button
          type='primary'
          icon={<Plus />}
          onClick={() => setEditing("new")}
        >
          Add branch
        </Button>
      </div>

      {!visible.length ? (
        <EmptyState
          icon={MapPin}
          title='No branches yet'
          description='Add your first branch so sessions can be booked there.'
        />
      ) : screens.md ? (
        <Table<Branch>
          rowKey='id'
          size='small'
          pagination={false}
          dataSource={visible}
          columns={[
            {
              title: "Code",
              render: (_, b) => <BranchTag branch={b} />,
              width: 100,
            },
            {
              title: "Name",
              render: (_, b) => (
                <span className='flex items-center gap-2'>
                  {b.name}
                  {b.archived_at && <Badge>Archived</Badge>}
                </span>
              ),
            },
            {
              title: "Address",
              dataIndex: "address",
              render: (a: string | null) => a ?? "—",
            },
            {
              title: "Trainers",
              align: "right",
              render: (_, b) => trainersAt(b.id),
            },
            {
              title: "Sessions this week",
              align: "right",
              render: (_, b) => sessionsAt(b.id),
            },
            { key: "actions", render: (_, b) => actions(b) },
          ]}
        />
      ) : (
        <ul className='flex flex-col gap-2'>
          {visible.map((b) => (
            <li key={b.id} className='rounded-md border bg-card p-3'>
              <div className='flex items-center justify-between gap-2'>
                <BranchTag branch={b} showName />
                {b.archived_at && <Badge>Archived</Badge>}
              </div>
              {b.address && (
                <p className='mt-1 text-xs text-muted-foreground'>
                  {b.address}
                </p>
              )}
              <div className='mt-2 flex items-center justify-between text-xs text-muted-foreground'>
                <span>
                  {trainersAt(b.id)} trainers · {sessionsAt(b.id)} sessions this
                  week
                </span>
                {actions(b)}
              </div>
            </li>
          ))}
        </ul>
      )}

      <BranchModal branch={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

function BranchModal({
  branch,
  onClose,
}: {
  branch: Branch | "new" | null;
  onClose: () => void;
}) {
  const { center, branches } = useRoster();
  const [form] = Form.useForm<Values>();
  const save = useMutation(saveBranchMutationOptions(center.id));
  const existing = branch && branch !== "new" ? branch : null;

  const onFinish = (values: Values) =>
    save.mutate(
      {
        id: existing?.id,
        name: values.name.trim(),
        code: values.code.trim(),
        color: values.color,
        address: values.address?.trim() || null,
      },
      { onSuccess: onClose },
    );

  return (
    <Modal
      open={!!branch}
      title={existing ? "Edit branch" : "Add branch"}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText='Save'
      confirmLoading={save.isPending}
      destroyOnHidden
    >
      <Form
        form={form}
        layout='vertical'
        preserve={false}
        onFinish={onFinish}
        initialValues={
          existing
            ? { ...existing, address: existing.address ?? undefined }
            : { color: nextColor(branches.map((b) => b.color)) }
        }
      >
        <div className='grid grid-cols-[1fr_7rem] gap-3'>
          <Form.Item
            name='name'
            label='Name'
            rules={[{ required: true, whitespace: true }, { max: 120 }]}
          >
            <Input maxLength={120} />
          </Form.Item>
          <Form.Item
            name='code'
            label='Short code'
            rules={[{ required: true, whitespace: true }, { max: 8 }]}
          >
            <Input maxLength={8} placeholder='D1' />
          </Form.Item>
        </div>
        <Form.Item name='address' label='Address' rules={[{ max: 300 }]}>
          <Input maxLength={300} />
        </Form.Item>
        <Form.Item name='color' label='Color'>
          <ColorSwatches
            used={branches
              .filter((b) => b.id !== existing?.id)
              .map((b) => b.color)}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
