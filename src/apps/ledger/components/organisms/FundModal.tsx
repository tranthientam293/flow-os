import { useState } from "react";
import { Button, Form, Input, Modal } from "antd";
import { MODAL_TRANSITION, MODAL_WIDTH } from "../../constants/modal";
import type { FundDraft } from "../../models/ledger";

const NAME_MAX_LENGTH = 80;
const NOTE_MAX_LENGTH = 200;

interface FundModalProps {
  open: boolean;
  // Filled in to edit a fund; empty to create one.
  fund?: FundDraft;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (draft: FundDraft) => void;
}

export function FundModal({
  open,
  fund,
  saving,
  onClose,
  onSubmit,
}: FundModalProps) {
  const [form] = Form.useForm<FundDraft>();
  const [changed, setChanged] = useState(false);

  return (
    <Modal
      open={open}
      title={fund ? "Edit fund" : "New fund"}
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
            disabled={!!fund && !changed}
            className='flex-1 max-sm:h-11 sm:flex-none'
          >
            {fund ? "Save changes" : "Create fund"}
          </Button>
        </div>
      }
      width={MODAL_WIDTH}
      destroyOnHidden
      transitionName={MODAL_TRANSITION}
      afterOpenChange={(isOpen) => !isOpen && setChanged(false)}
    >
      <Form<FundDraft>
        form={form}
        layout='vertical'
        requiredMark={false}
        initialValues={fund}
        onValuesChange={() => setChanged(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !(e.target instanceof HTMLTextAreaElement))
            e.preventDefault();
        }}
        onFinish={(values) =>
          onSubmit({
            name: values.name.trim(),
            note: values.note?.trim() || undefined,
          })
        }
      >
        <Form.Item
          name='name'
          label='Name'
          rules={[
            { required: true, whitespace: true, message: "Enter a name" },
          ]}
        >
          <Input
            className='text-base sm:text-sm'
            maxLength={NAME_MAX_LENGTH}
            placeholder='e.g. Da Lat trip, House fund'
          />
        </Form.Item>
        <Form.Item name='note' label='Note' className='mb-0'>
          <Input.TextArea
            className='text-base sm:text-sm'
            autoSize={{ minRows: 2, maxRows: 4 }}
            maxLength={NOTE_MAX_LENGTH}
            placeholder='What is it for?'
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
