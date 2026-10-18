import { useCallback, useLayoutEffect, useMemo } from "react";
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
import { saveTrainerMutationOptions } from "../../apis/members";
import { useRoster } from "../../context/roster-context";
import type { Member } from "../../models/roster";
import { nextColor } from "../../utils/colors";
import { moneyInputProps, payBasisOf, rateSuffix } from "../../utils/money";
import { BranchTag } from "../atoms";

type SessionRow = { sessionTypeId?: string; hourlyRate?: number | null };

type Values = {
  display_name: string;
  email: string;
  phone?: string;
  any_branch: boolean;
  branchIds: string[];
  sessions: SessionRow[];
};

interface TrainerModalProps {
  open: boolean;
  data: Member | null;
  onClose: () => void;
  onCreated: (member: Member) => void;
}

export function TrainerModal({
  data,
  open,
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
  const anyBranch = Form.useWatch("any_branch", form);
  const rows: SessionRow[] = Form.useWatch("sessions", form) ?? [];

  const currentBranchIds = useMemo(() => {
    const result: string[] = [];
    if (data) {
      memberBranches.forEach((mb) => {
        if (mb.member_id === data.id) {
          result.push(mb.branch_id);
        }
      });
    }
    return result;
  }, [data, memberBranches]);

  const activeBranches = useMemo(
    () =>
      branches.filter((b) => !b.archived_at || currentBranchIds.includes(b.id)),
    [branches, currentBranchIds],
  );

  const defaultRate = useCallback(
    (typeId?: string) =>
      typeId ? (typeById.get(typeId)?.default_hourly_rate ?? null) : null,
    [typeById],
  );

  const submit = (values: Values) =>
    save.mutate(
      {
        id: data?.id,
        display_name: values.display_name.trim(),
        email: values.email.trim().toLowerCase(),
        phone: values.phone?.trim() || null,
        color: data?.color ?? nextColor(directory.map((m) => m.color)),
        any_branch: values.any_branch,
        branchIds: values.any_branch
          ? currentBranchIds
          : (values.branchIds ?? []),
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
          if (!data) onCreated(saved);
        },
      },
    );

  useLayoutEffect(() => {
    if (!open) return;

    const initialValues: Values = data
      ? {
          display_name: data.display_name,
          email: data.email,
          phone: data.phone ?? undefined,
          any_branch: data.any_branch,
          branchIds: currentBranchIds,
          sessions: memberSessionTypes
            .filter((mst) => mst.member_id === data.id)
            .map((mst) => ({
              sessionTypeId: mst.session_type_id,
              hourlyRate: mst.hourly_rate ?? defaultRate(mst.session_type_id),
            })),
        }
      : {
          display_name: "",
          email: "",
          phone: "",
          any_branch: true,
          branchIds: [],
          sessions: [],
        };

    form.setFieldsValue(initialValues);
  }, [data, open, currentBranchIds, memberSessionTypes, form, defaultRate]);

  return (
    <Modal
      open={open}
      title={data ? `Edit Trainer` : "Invite a trainer"}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText={data ? "Save" : "Invite"}
      confirmLoading={save.isPending}
      width={600}
      destroyOnHidden
    >
      <Form form={form} layout='vertical' onFinish={submit}>
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
              data?.user_id
                ? "Already joined with this email."
                : "They join by signing in to flowOS with this email."
            }
            rules={[{ required: true, type: "email" }]}
          >
            <Input type='email' disabled={!!data?.user_id} />
          </Form.Item>
          <Form.Item name='phone' label='Phone' rules={[{ max: 40 }]}>
            <Input maxLength={40} />
          </Form.Item>
        </div>

        <div className='mb-2'>
          <div className='text-sm font-medium text-foreground'>
            Sessions and salary
          </div>
          {!sessionTypes.length && (
            <p className='text-xs text-muted-foreground'>
              Add session types in the Session types tab first.
            </p>
          )}
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
                const rowTypeId = rows[field.name]?.sessionTypeId;
                const basis = payBasisOf(
                  rowTypeId ? typeById.get(rowTypeId) : undefined,
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
                        {...moneyInputProps}
                        className='w-full'
                        suffix={rateSuffix(basis)}
                        placeholder='Salary'
                        aria-label='Salary'
                      />
                    </Form.Item>
                    <Button
                      type='text'
                      danger
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
