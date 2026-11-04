import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Modal, Spin } from "antd";
import { DATE_FORMAT } from "@/constants";
import { useFlowApp } from "@/context";
import { cn } from "@/utils";
import { fundRevisionsQueryOptions } from "../../apis/funds";
import { MODAL_TRANSITION, MODAL_WIDTH } from "../../constants/modal";
import type { FundMember, FundTransaction } from "../../models/ledger";
import { KIND_LABEL, memberName, revisionChanges } from "../../utils/funds";
import { formatAmount } from "../../utils/money";

const ACTION_LABEL = {
  created: "Added",
  edited: "Edited",
  deleted: "Deleted",
} as const;

interface FundHistoryModalProps {
  open: boolean;
  transaction?: FundTransaction;
  members: Map<string, FundMember>;
  onClose: () => void;
}

// Every change to a transaction, oldest first: who made it, when, and what
// changed (the first entry shows what was added).
export function FundHistoryModal({
  open,
  transaction,
  members,
  onClose,
}: FundHistoryModalProps) {
  const { user } = useFlowApp();
  const revisions = useQuery({
    ...fundRevisionsQueryOptions(
      user.id,
      transaction?.fund_id ?? "",
      transaction?.id ?? "",
    ),
    enabled: open && !!transaction,
  });

  return (
    <Modal
      open={open}
      title='Transaction history'
      onCancel={onClose}
      footer={null}
      width={MODAL_WIDTH}
      destroyOnHidden
      transitionName={MODAL_TRANSITION}
    >
      {revisions.isLoading ? (
        <div className='flex justify-center py-8'>
          <Spin />
        </div>
      ) : (
        <ol className='flex flex-col'>
          {(revisions.data ?? []).map((r, i, all) => {
            const previous = all[i - 1];
            const changes =
              r.action === "edited" && previous
                ? revisionChanges(previous, r, members)
                : [];
            return (
              <li key={r.id} className='relative flex gap-3 pb-5 last:pb-0'>
                {/* The timeline line, from this dot down to the next. */}
                {i < all.length - 1 && (
                  <span
                    aria-hidden
                    className='absolute top-4 bottom-0 left-1.25 w-px bg-border'
                  />
                )}
                <span
                  aria-hidden
                  className={cn(
                    "mt-1.5 size-2.75 shrink-0 rounded-full border-2 bg-card",
                    r.action === "deleted"
                      ? "border-destructive"
                      : "border-brand",
                  )}
                />
                <div className='flex min-w-0 flex-1 flex-col gap-1'>
                  <p className='text-sm text-foreground'>
                    <span className='font-medium'>
                      {ACTION_LABEL[r.action]}
                    </span>{" "}
                    by {memberName(members, r.actor_id)}
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    {dayjs(r.created_at).format(`${DATE_FORMAT} HH:mm`)}
                  </p>
                  {r.action === "created" && (
                    <dl className='mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs'>
                      <Field label='Type' value={KIND_LABEL[r.kind]} />
                      <Field
                        label='Person'
                        value={memberName(members, r.member_id)}
                      />
                      <Field label='Amount' value={formatAmount(r.amount)} />
                      <Field
                        label='Date'
                        value={dayjs(r.occurred_on).format(DATE_FORMAT)}
                      />
                      {r.note && <Field label='Note' value={r.note} />}
                    </dl>
                  )}
                  {r.action === "edited" && (
                    <dl className='mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs'>
                      {changes.map((c) => (
                        <Field
                          key={c.label}
                          label={c.label}
                          value={
                            <>
                              <span className='text-muted-foreground line-through'>
                                {c.from}
                              </span>{" "}
                              → {c.to}
                            </>
                          }
                        />
                      ))}
                    </dl>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Modal>
  );
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <>
      <dt className='text-muted-foreground'>{label}</dt>
      <dd className='min-w-0 wrap-break-word text-foreground'>{value}</dd>
    </>
  );
}
