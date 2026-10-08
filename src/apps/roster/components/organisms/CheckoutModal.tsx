import { useMutation, useQuery } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Spin,
} from "antd";
import {
  checkoutSessionMutationOptions,
  reopenSessionMutationOptions,
  sessionFeesQueryOptions,
} from "../../apis/sessions";
import { useRoster } from "../../context/roster-context";
import type { Session, SessionFee } from "../../models/roster";
import { formatAmount, formatRate, salaryFor } from "../../utils/money";
import { sessionAccess } from "../../utils/permissions";
import { formatLongDay, formatRange, inTz } from "../../utils/time";
import { BranchTag, MemberAvatar } from "../atoms";

type FeeRow = { label?: string; amount?: number | null };
type Values = { salary: number | null; fees: FeeRow[] };

const sum = (values: (number | null | undefined)[]) =>
  values.reduce<number>((total, v) => total + (v ?? 0), 0);

// extra pay (fees). The owner edits both; a trainer edits the fees, and their
// salary comes from their rate.
// and their salary comes from their rate.
export function CheckoutModal({
  session,
  onClose,
}: {
  session: Session;
  onClose: () => void;
}) {
  const { center } = useRoster();
  const completed = session.status === "completed";
  const fees = useQuery({
    ...sessionFeesQueryOptions(center.id, session.id),
    enabled: completed,
  });

  return (
    <Modal
      open
      title={completed ? "Checkout" : "Complete session"}
      onCancel={onClose}
      footer={null}
      width={520}
      destroyOnHidden
    >
      {completed && fees.isLoading ? (
        <div className='flex justify-center py-8'>
          <Spin />
        </div>
      ) : (
        <CheckoutForm
          session={session}
          fees={fees.data ?? []}
          onClose={onClose}
        />
      )}
    </Modal>
  );
}

function CheckoutForm({
  session,
  fees,
  onClose,
}: {
  session: Session;
  fees: SessionFee[];
  onClose: () => void;
}) {
  const ctx = useRoster();
  const { center, isOwner, memberById, branchById, typeById } = ctx;
  const checkout = useMutation(checkoutSessionMutationOptions(center.id));
  const reopen = useMutation(reopenSessionMutationOptions(center.id));
  const [form] = Form.useForm<Values>();
  const completed = session.status === "completed";
  const canEdit = sessionAccess(session, ctx).canEdit;

  const tz = center.timezone;
  const member = memberById.get(session.member_id);
  const type = session.session_type_id
    ? typeById.get(session.session_type_id)
    : undefined;
  const rate =
    ctx.memberSessionTypes.find(
      (mst) =>
        mst.member_id === session.member_id &&
        mst.session_type_id === session.session_type_id,
    )?.hourly_rate ??
    type?.default_hourly_rate ??
    null;
  const hours =
    (Date.parse(session.ends_at) - Date.parse(session.starts_at)) / 36e5;
  const defaultSalary = salaryFor(rate, session.starts_at, session.ends_at);

  const salaryValue = Form.useWatch("salary", form);
  const feeRows: FeeRow[] = Form.useWatch("fees", form) ?? [];
  const salary = isOwner
    ? (salaryValue ?? 0)
    : (session.salary ?? defaultSalary);
  const feeTotal = canEdit
    ? sum(feeRows.map((f) => f?.amount))
    : sum(fees.map((f) => f.amount));

  const initialValues: Values = {
    salary: session.salary ?? defaultSalary,
    fees: fees.map((f) => ({ label: f.label, amount: f.amount })),
  };

  const submit = (values: Values) =>
    checkout.mutate(
      {
        sessionId: session.id,
        salary: values.salary ?? 0,
        fees: (values.fees ?? []).flatMap((f) =>
          f?.label?.trim()
            ? [{ label: f.label.trim(), amount: f.amount ?? 0 }]
            : [],
        ),
      },
      { onSuccess: onClose },
    );

  const date = inTz(session.starts_at, tz).format("YYYY-MM-DD");
  const details: [string, React.ReactNode][] = [
    ["Session", session.title || type?.name || "Session"],
    [
      "When",
      `${formatLongDay(date)} · ${formatRange(session.starts_at, session.ends_at, tz)} (${formatAmount(hours)} h)`,
    ],
    [
      "Trainer",
      member ? (
        <span key='trainer' className='flex items-center gap-1.5'>
          <MemberAvatar
            name={member.display_name}
            color={member.color}
            size='sm'
          />
          {member.display_name}
        </span>
      ) : (
        "—"
      ),
    ],
    [
      "Branch",
      <BranchTag
        key='branch'
        branch={branchById.get(session.branch_id)}
        showName
      />,
    ],
    ["Session type", type?.name ?? "—"],
  ];

  return (
    <Form
      form={form}
      layout='vertical'
      initialValues={initialValues}
      onFinish={submit}
      disabled={!canEdit}
    >
      <dl className='mb-4 grid grid-cols-[7rem_1fr] gap-x-3 gap-y-2 rounded-md border bg-surface-muted p-3 text-sm'>
        {details.map(([label, value]) => (
          <div key={label} className='contents'>
            <dt className='text-muted-foreground'>{label}</dt>
            <dd className='min-w-0 text-foreground'>{value}</dd>
          </div>
        ))}
      </dl>

      {isOwner ? (
        <Form.Item
          name='salary'
          label='Salary'
          extra={`${formatRate(rate)} × ${formatAmount(hours)} h = ${formatAmount(defaultSalary)}`}
          rules={[{ required: true, message: "Enter the salary" }]}
        >
          <InputNumber<number> min={0} className='w-full' />
        </Form.Item>
      ) : (
        <div className='mb-4'>
          <div className='mb-1.5 text-sm text-foreground-light'>Salary</div>
          <div className='text-sm text-foreground tabular-nums'>
            {formatAmount(salary)}
          </div>
          <p className='text-xs text-muted-foreground'>
            {session.salary === null
              ? `From your rate: ${formatRate(rate)} × ${formatAmount(hours)} h. `
              : ""}
            The owner sets the salary.
          </p>
        </div>
      )}

      <div className='mb-2 text-sm text-foreground-light'>Additional fees</div>
      {canEdit ? (
        <Form.List name='fees'>
          {(fields, { add, remove }) => (
            <div className='mb-4 flex flex-col gap-2'>
              {fields.map((field) => (
                <div
                  key={field.key}
                  className='grid grid-cols-[1fr_8rem_auto] items-start gap-2'
                >
                  <Form.Item
                    name={[field.name, "label"]}
                    className='mb-0'
                    rules={[
                      { required: true, whitespace: true, message: "Name it" },
                      { max: 80 },
                    ]}
                  >
                    <Input
                      maxLength={80}
                      placeholder='e.g. Travel'
                      aria-label='Fee name'
                    />
                  </Form.Item>
                  <Form.Item
                    name={[field.name, "amount"]}
                    className='mb-0'
                    rules={[{ required: true, message: "Amount" }]}
                  >
                    <InputNumber<number>
                      min={0}
                      className='w-full'
                      placeholder='Amount'
                      aria-label='Fee amount'
                    />
                  </Form.Item>
                  <Button
                    type='text'
                    icon={<Trash2 />}
                    aria-label='Remove fee'
                    onClick={() => remove(field.name)}
                  />
                </div>
              ))}
              <Button
                type='dashed'
                icon={<Plus />}
                onClick={() => add({ label: "", amount: null })}
                className='self-start'
              >
                Add fee
              </Button>
            </div>
          )}
        </Form.List>
      ) : fees.length ? (
        <ul className='mb-4 flex flex-col gap-1 text-sm'>
          {fees.map((f) => (
            <li key={f.id} className='flex justify-between gap-3'>
              <span className='text-foreground'>{f.label}</span>
              <span className='tabular-nums'>{formatAmount(f.amount)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className='mb-4 text-sm text-muted-foreground'>None</p>
      )}

      <div className='mb-4 flex items-center justify-between border-t pt-3 text-sm'>
        <span className='text-foreground-light'>Total pay</span>
        <span className='font-medium text-foreground tabular-nums'>
          {formatAmount(salary + feeTotal)}
        </span>
      </div>

      <div className='flex items-center gap-2'>
        {completed && canEdit && (
          <Popconfirm
            title='Reopen this session?'
            description='It goes back to scheduled and its salary and fees are cleared.'
            okText='Reopen'
            onConfirm={() => reopen.mutate(session.id, { onSuccess: onClose })}
          >
            <Button disabled={false} loading={reopen.isPending}>
              Reopen
            </Button>
          </Popconfirm>
        )}
        <div className='ms-auto flex gap-2'>
          <Button disabled={false} onClick={onClose}>
            {canEdit ? "Cancel" : "Close"}
          </Button>
          {canEdit && (
            <Button
              type='primary'
              disabled={false}
              loading={checkout.isPending}
              onClick={() => form.submit()}
            >
              {completed ? "Save" : "Complete"}
            </Button>
          )}
        </div>
      </div>
    </Form>
  );
}
