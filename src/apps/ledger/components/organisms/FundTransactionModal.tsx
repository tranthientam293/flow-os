import { useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import { Button, DatePicker, Form, Input, Modal, Select } from "antd";
import { DATE_FORMAT } from "@/constants";
import {
  MODAL_TRANSITION,
  MODAL_WIDTH,
  PICKER_SHEET,
} from "../../constants/modal";
import type {
  FundMember,
  FundTransaction,
  FundTransactionDraft,
  FundTransactionKind,
} from "../../models/ledger";
import { AmountInput } from "../molecules";

const NOTE_MAX_LENGTH = 200;

interface FundTransactionModalProps {
  open: boolean;
  // Set to edit it (its kind stays); otherwise a new one of `kind`, chosen
  // by the button that opened the modal.
  transaction?: FundTransaction;
  kind: FundTransactionKind;
  // Everyone in the fund, for the person field.
  members: FundMember[];
  myMemberId: string;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (draft: FundTransactionDraft) => void;
}

export function FundTransactionModal({
  open,
  transaction,
  kind,
  members,
  myMemberId,
  saving,
  onClose,
  onSubmit,
}: FundTransactionModalProps) {
  const [form] = Form.useForm<FundTransactionDraft>();
  const [changed, setChanged] = useState(false);
  const chosenKind: FundTransactionKind = transaction?.kind ?? kind;
  const isIn = chosenKind === "contribute";

  // Members who have joined (not invited); a removed one stays on their own
  // old transaction.
  const options = members
    .filter(
      (m) =>
        (!m.removed_at && m.status === "active") ||
        m.id === transaction?.member_id,
    )
    .map((m) => ({
      value: m.id,
      label: m.id === myMemberId ? `${m.display_name} (you)` : m.display_name,
    }));

  return (
    <Modal
      open={open}
      title={
        transaction
          ? isIn
            ? "Edit money put in"
            : "Edit money used"
          : isIn
            ? "Put money in"
            : "Use money"
      }
      onCancel={onClose}
      footer={
        <div className='flex gap-2 border-t pt-4 sm:justify-end'>
          <Button
            disabled={saving}
            onClick={onClose}
            className='flex-1 max-sm:h-11 sm:flex-none'
          >
            Cancel
          </Button>
          <Button
            type='primary'
            onClick={() => form.submit()}
            loading={saving}
            disabled={!!transaction && !changed}
            className='flex-1 max-sm:h-11 sm:flex-none'
          >
            {transaction ? "Save changes" : isIn ? "Put money in" : "Use money"}
          </Button>
        </div>
      }
      width={MODAL_WIDTH}
      destroyOnHidden
      transitionName={MODAL_TRANSITION}
      afterOpenChange={(isOpen) => !isOpen && setChanged(false)}
    >
      <Form<FundTransactionDraft>
        form={form}
        layout='vertical'
        requiredMark={false}
        onValuesChange={() => setChanged(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !(e.target instanceof HTMLTextAreaElement))
            e.preventDefault();
        }}
        initialValues={
          transaction
            ? {
                memberId: transaction.member_id,
                amount: transaction.amount,
                note: transaction.note ?? undefined,
                date: dayjs(transaction.occurred_on),
              }
            : { memberId: myMemberId, date: dayjs() }
        }
        onFinish={(values) =>
          onSubmit({
            ...values,
            kind: chosenKind,
            note: values.note?.trim() || undefined,
          })
        }
      >
        <Form.Item
          name='memberId'
          label={isIn ? "Who put it in" : "Who used it"}
          rules={[{ required: true, message: "Pick a person" }]}
        >
          <Select options={options} />
        </Form.Item>
        <Form.Item
          name='amount'
          label='Amount'
          rules={[
            { required: true, message: "Enter the amount" },
            {
              type: "number",
              min: 1,
              message: "The amount must be more than 0",
            },
          ]}
        >
          <AmountInput />
        </Form.Item>
        <Form.Item name='note' label='Note'>
          <Input.TextArea
            // 16px on phones so iOS doesn't zoom in when it's focused.
            className='text-base sm:text-sm'
            autoSize={{ minRows: 2, maxRows: 4 }}
            maxLength={NOTE_MAX_LENGTH}
            placeholder={isIn ? "e.g. November share" : "What was it for?"}
          />
        </Form.Item>
        <Form.Item
          name='date'
          label='Date'
          rules={[
            { required: true, message: "Pick a date" },
            {
              validator: (_, value?: Dayjs) =>
                value?.isAfter(dayjs(), "day")
                  ? Promise.reject(new Error("The date can’t be in the future"))
                  : Promise.resolve(),
            },
          ]}
        >
          <DatePicker
            className='w-full'
            format={DATE_FORMAT}
            allowClear={false}
            inputReadOnly
            // Money can't move on a day that hasn't come yet.
            disabledDate={(day) => day.isAfter(dayjs(), "day")}
            classNames={{ popup: { root: PICKER_SHEET } }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
