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
import {
  formatAmount,
  formatNumber,
  formatRate,
  formatUnits,
  moneyInputProps,
  payBasisOf,
  payUnits,
  salaryFor,
} from "../../utils/money";
import { sessionAccess } from "../../utils/permissions";
import { ownerRateFor, trainerOwnRateFor } from "../../utils/rates";
import { formatLongDay, formatRange, inTz } from "../../utils/time";
import { BranchTag, MemberAvatar } from "../atoms";

type FeeRow = { label?: string; amount?: number | null };
type Values = { salary: number | null; fees: FeeRow[] };

const sum = (values: (number | null | undefined)[]) =>
  values.reduce<number>((total, v) => total + (v ?? 0), 0);

// Completes a session or edits its checkout: the session, its salary and any
// extra pay (fees). The session's trainer manages their own salary (prefilled
// from base salary × hours or × trainees); the owner sees it read-only.
// Whoever may check it out (the owner, or its trainer within their edit
// window) edits the fees.
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
  const { center, memberById, branchById, typeById } = ctx;
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
  const hours =
    (Date.parse(session.ends_at) - Date.parse(session.starts_at)) / 36e5;
  // The session's trainer manages their salary. Until it's saved it starts
  // from base salary × units: their own rate (else the owner's rate for them,
  // else the type's default) × hours or × trainees, by the type's pay basis.
  const isTrainer = session.member_id === ctx.meId;
  const basis = payBasisOf(type);
  const units = payUnits(session, basis);
  const unitsText = formatUnits(units, basis);
  const trainerRate =
    trainerOwnRateFor(
      ctx.trainerRates,
      session.member_id,
      session.session_type_id,
    ) ??
    ownerRateFor(
      ctx.memberSessionTypes,
      typeById,
      session.member_id,
      session.session_type_id,
    );
  const trainerRateSalary = salaryFor(trainerRate, units);
  const trainerSalary = session.salary ?? trainerRateSalary;

  // Only the trainer edits the salary; total pay is their salary + fees.
  const salaryValue = Form.useWatch("salary", form);
  const feeRows: FeeRow[] = Form.useWatch("fees", form) ?? [];
  const salary = canEdit && isTrainer ? (salaryValue ?? 0) : trainerSalary;
  const feeTotal = canEdit
    ? sum(feeRows.map((f) => f?.amount))
    : sum(fees.map((f) => f.amount));

  const initialValues: Values = {
    salary: trainerSalary,
    fees: fees.map((f) => ({ label: f.label, amount: f.amount })),
  };

  const submit = (values: Values) =>
    checkout.mutate(
      {
        sessionId: session.id,
        // Only the trainer sets the salary; the server keeps it otherwise.
        salary: isTrainer ? (values.salary ?? 0) : null,
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
      `${formatLongDay(date)} · ${formatRange(session.starts_at, session.ends_at, tz)} (${formatNumber(hours)} h)`,
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
    // Per-trainee types are paid by this count (set on the session).
    ...(basis === "trainee"
      ? ([["Trainees", session.trainee_count]] as [string, React.ReactNode][])
      : []),
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

      {canEdit && isTrainer ? (
        <Form.Item
          name='salary'
          label='Your salary'
          extra={`Your rate: ${formatRate(trainerRate, basis)} × ${unitsText} = ${formatAmount(trainerRateSalary)}`}
          rules={[{ required: true, message: "Enter the salary" }]}
        >
          <InputNumber<number> {...moneyInputProps} className='w-full' />
        </Form.Item>
      ) : (
        <div className='mb-4'>
          <div className='mb-1.5 text-sm text-foreground-light'>
            {isTrainer ? "Your salary" : "Trainer’s salary"}
          </div>
          <div className='text-sm text-foreground tabular-nums'>
            {formatAmount(trainerSalary)}
          </div>
          <p className='text-xs text-muted-foreground'>
            {session.salary === null
              ? `From the trainer’s rate: ${formatRate(trainerRate, basis)} × ${unitsText}`
              : "Set by the trainer"}
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
                  className='grid grid-cols-[1fr_9rem_auto] items-start gap-2'
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
                      {...moneyInputProps}
                      className='w-full'
                      placeholder='Amount'
                      aria-label='Fee amount'
                    />
                  </Form.Item>
                  <Button
                    type='text'
                    danger
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
            title='Undo completion?'
            description='It goes back to scheduled and its salary and fees are cleared.'
            okText='Undo completion'
            onConfirm={() => reopen.mutate(session.id, { onSuccess: onClose })}
          >
            <Button disabled={false} loading={reopen.isPending}>
              Undo completion
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
