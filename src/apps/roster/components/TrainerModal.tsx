import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import {
  Button,
  Checkbox,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Switch,
} from "antd";
import { saveTrainerMutationOptions } from "../apis/members";
import { useRoster } from "../context/roster-context";
import type { Member } from "../models/roster";
import { nextColor } from "../utils/colors";
import { BranchTag } from "./BranchTag";

type SessionRow = { sessionTypeId?: string; hourlyRate?: number | null };

type Values = {
  display_name: string;
  email: string;
  phone?: string;
  any_branch: boolean;
  branchIds: string[];
  sessions: SessionRow[];
};

type TrainerModalProps = {
  member: Member | "new" | null;
  onClose: () => void;
  onCreated: (member: Member) => void;
};

// Each opening gets a fresh form, so the previous trainer's values never carry
// over. (No `preserve={false}`: under StrictMode it wipes Form.List rows.)
export function TrainerModal(props: TrainerModalProps) {
  const [opening, setOpening] = useState({ open: false, count: 0 });
  const open = !!props.member;
  if (open !== opening.open)
    setOpening({ open, count: opening.count + (open ? 1 : 0) });
  return <TrainerModalContent key={opening.count} {...props} />;
}

function TrainerModalContent({
  member,
  onClose,
  onCreated,
}: TrainerModalProps) {
  const {
    center,
    branches,
    memberBranches,
    sessionTypes,
    typeById,
    memberSessionTypes,
    directory,
  } = useRoster();
  const [form] = Form.useForm<Values>();
  const save = useMutation(saveTrainerMutationOptions(center.id));
  const existing = member && member !== "new" ? member : null;
  const anyBranch = Form.useWatch("any_branch", form);
  const rows: SessionRow[] = Form.useWatch("sessions", form) ?? [];

  const currentBranchIds = memberBranches
    .filter((mb) => mb.member_id === existing?.id)
    .map((mb) => mb.branch_id);
  const activeBranches = branches.filter(
    (b) => !b.archived_at || currentBranchIds.includes(b.id),
  );
  const defaultRate = (typeId?: string) =>
    typeId ? (typeById.get(typeId)?.default_hourly_rate ?? null) : null;

  const initialValues: Values = existing
    ? {
        display_name: existing.display_name,
        email: existing.email,
        phone: existing.phone ?? undefined,
        any_branch: existing.any_branch,
        branchIds: currentBranchIds,
        sessions: memberSessionTypes
          .filter((mst) => mst.member_id === existing.id)
          .map((mst) => ({
            sessionTypeId: mst.session_type_id,
            hourlyRate: mst.hourly_rate ?? defaultRate(mst.session_type_id),
          })),
      }
    : {
        display_name: "",
        email: "",
        any_branch: true,
        branchIds: [],
        sessions: [],
      };

  const submit = (values: Values) =>
    save.mutate(
      {
        id: existing?.id,
        display_name: values.display_name.trim(),
        email: values.email.trim().toLowerCase(),
        phone: values.phone?.trim() || null,
        // Colors are picked automatically: the most distinct unused one.
        color: existing?.color ?? nextColor(directory.map((m) => m.color)),
        any_branch: values.any_branch,
        branchIds: values.any_branch
          ? currentBranchIds
          : (values.branchIds ?? []),
        // The salary is saved as entered: it starts at the type's default but
        // belongs to this trainer, so later changes to the default don't touch it.
        sessions: (values.sessions ?? []).flatMap((row) =>
          row?.sessionTypeId
            ? [
                {
                  sessionTypeId: row.sessionTypeId,
                  hourlyRate: row.hourlyRate ?? null,
                },
              ]
            : [],
        ),
      },
      {
        onSuccess: (saved) => {
          onClose();
          if (!existing) onCreated(saved);
        },
      },
    );

  return (
    <Modal
      open={!!member}
      title={existing ? `Edit ${existing.display_name}` : "Invite a trainer"}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText={existing ? "Save" : "Invite"}
      confirmLoading={save.isPending}
      width={600}
      destroyOnHidden
    >
      <Form
        form={form}
        layout='vertical'
        initialValues={initialValues}
        onFinish={submit}
      >
        <div className='grid gap-x-3 sm:grid-cols-2'>
          <Form.Item
            name='display_name'
            label='Name'
            rules={[{ required: true, whitespace: true }, { max: 80 }]}
          >
            <Input maxLength={80} />
          </Form.Item>
          <Form.Item
            name='email'
            label='Email'
            extra={
              existing?.user_id
                ? "Already joined with this email."
                : "They join by signing in to flowOS with this email."
            }
            rules={[{ required: true, type: "email" }]}
          >
            <Input type='email' disabled={!!existing?.user_id} />
          </Form.Item>
          <Form.Item name='phone' label='Phone' rules={[{ max: 40 }]}>
            <Input maxLength={40} />
          </Form.Item>
        </div>

        <div className='mb-2'>
          <div className='text-sm font-medium text-foreground'>
            Sessions and salary
          </div>
          <p className='text-xs text-muted-foreground'>
            {!sessionTypes.length
              ? "Add session types in the Session types tab first."
              : "Session types this trainer teaches, with their salary per hour. Each salary starts at the type’s default from the Session types tab and can be changed for this trainer; it won’t change when the default does. Leave the list empty to allow every type at its default salary."}
          </p>
        </div>
        <Form.List name='sessions'>
          {(fields, { add, remove }) => (
            <div className='mb-4 flex flex-col gap-2'>
              {fields.map((field) => {
                const chosen = new Set(
                  rows
                    .filter((_, i) => i !== field.name)
                    .map((r) => r?.sessionTypeId),
                );
                return (
                  <div
                    key={field.key}
                    className='grid grid-cols-[1fr_10rem_auto] items-start gap-2'
                  >
                    <Form.Item
                      name={[field.name, "sessionTypeId"]}
                      className='mb-0'
                      rules={[
                        { required: true, message: "Choose a session type" },
                      ]}
                    >
                      <Select
                        showSearch={{ optionFilterProp: "label" }}
                        placeholder='Session type'
                        aria-label='Session type'
                        onChange={(typeId: string) =>
                          form.setFieldValue(
                            ["sessions", field.name, "hourlyRate"],
                            defaultRate(typeId),
                          )
                        }
                        options={sessionTypes
                          .filter((t) => !chosen.has(t.id))
                          .map((t) => ({ value: t.id, label: t.name }))}
                      />
                    </Form.Item>
                    <Form.Item
                      name={[field.name, "hourlyRate"]}
                      className='mb-0'
                    >
                      <InputNumber<number>
                        min={0}
                        className='w-full'
                        placeholder='Salary / hour'
                        aria-label='Salary per hour'
                      />
                    </Form.Item>
                    <Button
                      type='text'
                      icon={<Trash2 />}
                      aria-label='Remove session type'
                      onClick={() => remove(field.name)}
                    />
                  </div>
                );
              })}
              <Button
                type='dashed'
                icon={<Plus />}
                disabled={fields.length >= sessionTypes.length}
                onClick={() => add({ hourlyRate: null })}
                className='self-start'
              >
                Add session type
              </Button>
            </div>
          )}
        </Form.List>

        <>
          <div className='mb-2 flex items-center justify-between gap-3'>
            <span className='text-sm font-medium text-foreground'>
              Branches
            </span>
            <span className='flex items-center gap-2 text-sm text-foreground-light'>
              <Form.Item name='any_branch' valuePropName='checked' noStyle>
                <Switch size='small' aria-label='Access to all branches' />
              </Form.Item>
              All branches
            </span>
          </div>
          {anyBranch ? (
            <p className='text-sm text-muted-foreground'>
              Can book at every branch, including ones you add later. Turn off
              to choose branches.
            </p>
          ) : !activeBranches.length ? (
            <p className='text-sm text-muted-foreground'>
              No branches yet. Add branches first, or turn on “All branches”.
            </p>
          ) : (
            <Form.Item
              name='branchIds'
              rules={[
                {
                  required: true,
                  type: "array",
                  min: 1,
                  message: "Choose at least one branch",
                },
              ]}
            >
              <Checkbox.Group className='flex flex-wrap gap-x-4 gap-y-2'>
                {activeBranches.map((b) => (
                  <Checkbox key={b.id} value={b.id}>
                    <BranchTag branch={b} showName />
                  </Checkbox>
                ))}
              </Checkbox.Group>
            </Form.Item>
          )}
        </>
      </Form>
    </Modal>
  );
}
