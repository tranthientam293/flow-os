import { useState } from "react";
import dayjs from "dayjs";
import { Trash2 } from "lucide-react";
import { Button, DatePicker, Form, Input, Modal } from "antd";
import { DATE_FORMAT } from "@/constants";
import {
  MODAL_TRANSITION,
  MODAL_WIDTH,
  PICKER_SHEET,
} from "../../constants/modal";
import type { Expense, ExpenseDraft } from "../../models/ledger";
import { AmountInput, CategoryPicker } from "../molecules";

const NOTE_MAX_LENGTH = 200;

// Adds an expense, or edits `expense` when given (with Delete, which the
// caller confirms).
export function ExpenseModal({
  open,
  expense,
  saving,
  onClose,
  onSubmit,
  onDelete,
}: {
  open: boolean;
  expense?: Expense;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (draft: ExpenseDraft) => void;
  onDelete?: () => void;
}) {
  const [form] = Form.useForm<ExpenseDraft>();
  // Whether the user has changed anything since the modal opened.
  const [changed, setChanged] = useState(false);

  return (
    <Modal
      open={open}
      title={expense ? "Edit expense" : "Add expense"}
      onCancel={onClose}
      footer={null}
      width={MODAL_WIDTH}
      destroyOnHidden
      transitionName={MODAL_TRANSITION}
      afterOpenChange={(isOpen) => !isOpen && setChanged(false)}
    >
      <Form<ExpenseDraft>
        form={form}
        layout='vertical'
        requiredMark={false}
        onValuesChange={() => setChanged(true)}
        // Enter never submits; only the Save button does. Textareas still get
        // new lines.
        onKeyDown={(e) => {
          if (e.key === "Enter" && !(e.target instanceof HTMLTextAreaElement))
            e.preventDefault();
        }}
        initialValues={
          expense
            ? {
                amount: expense.amount,
                categoryId: expense.category_id,
                note: expense.note ?? undefined,
                date: dayjs(expense.spent_on),
              }
            : { date: dayjs() }
        }
        onFinish={(values) =>
          onSubmit({ ...values, note: values.note?.trim() || undefined })
        }
      >
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
        <Form.Item
          name='categoryId'
          label='Category'
          rules={[{ required: true, message: "Select a category" }]}
        >
          <CategoryPicker />
        </Form.Item>
        <Form.Item name='note' label='Note'>
          <Input.TextArea
            // 16px on phones so iOS doesn't zoom in when it's focused.
            className='text-base sm:text-sm'
            autoSize={{ minRows: 2, maxRows: 4 }}
            maxLength={NOTE_MAX_LENGTH}
            placeholder='What was it for?'
          />
        </Form.Item>
        <Form.Item
          name='date'
          label='Date'
          rules={[{ required: true, message: "Pick a date" }]}
        >
          <DatePicker
            className='w-full'
            format={DATE_FORMAT}
            allowClear={false}
            // No keyboard on phones; pick from the calendar.
            inputReadOnly
            classNames={{ popup: { root: PICKER_SHEET } }}
          />
        </Form.Item>
        {/* Phones: Cancel and the main action share the row at a taller,
            easier-to-tap size. Desktop: right-aligned. Delete stays apart
            on the left. */}
        <div className='mt-6 flex items-center gap-2 border-t pt-4'>
          {expense && onDelete && (
            <Button
              danger
              type='text'
              icon={<Trash2 />}
              disabled={saving}
              onClick={onDelete}
              className='max-sm:h-11'
            >
              Delete
            </Button>
          )}
          <div className='flex flex-1 gap-2 sm:ms-auto sm:flex-none'>
            <Button
              disabled={saving}
              onClick={onClose}
              className='flex-1 max-sm:h-11 sm:flex-none'
            >
              Cancel
            </Button>
            <Button
              type='primary'
              htmlType='submit'
              loading={saving}
              // Editing: nothing to save until something changes.
              disabled={!!expense && !changed}
              className='flex-1 max-sm:h-11 sm:flex-none'
            >
              {expense ? "Save changes" : "Add expense"}
            </Button>
          </div>
        </div>
      </Form>
    </Modal>
  );
}
