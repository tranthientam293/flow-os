import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Table,
} from "antd";
import { SettingsPanel } from "@/components/molecules";
import {
  deleteSessionTypeMutationOptions,
  saveSessionTypeMutationOptions,
} from "../../apis/session-types";
import {
  MAX_SESSION_HOURS,
  MIN_SESSION_MINUTES,
} from "../../constants/options";
import { useRoster } from "../../context/roster-context";
import type { SessionType } from "../../models/roster";
import {
  DEFAULT_PAY_BASIS,
  PAY_BASIS_OPTIONS,
  formatAmount,
  moneyInputProps,
  payBasisLabel,
  payBasisOf,
  rateSuffix,
  type PayBasis,
} from "../../utils/money";

type Values = {
  name: string;
  pay_basis: PayBasis;
  default_hourly_rate: number | null;
  min_session_min: number;
};
type SessionTypeModalState = { isOpen: boolean; data: SessionType | null };

export function SessionTypesView() {
  return (
    <div className='mx-auto flex max-w-3xl flex-col gap-6 px-4 py-4 sm:px-6'>
      <SessionTypesPanel />
    </div>
  );
}

function SessionTypesPanel() {
  const { center, sessionTypes } = useRoster();
  const remove = useMutation(deleteSessionTypeMutationOptions(center.id));
  const [modalState, setModalState] = useState<SessionTypeModalState>({
    isOpen: false,
    data: null,
  });

  const closeModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <SettingsPanel
      title='Session types'
      description='Kinds of sessions your center runs, e.g. “Piano lesson” or “Group class”. Each one pays per shift, per hour or per trainee (the number of trainees is set on each session), with a default salary and a minimum session length. The type picked when booking becomes the session’s default title. Set each trainer’s types and salary in the Trainers tab.'
    >
      <div className='flex flex-col gap-3'>
        <div className='flex justify-end'>
          <Button
            type='primary'
            icon={<Plus />}
            onClick={() => setModalState({ isOpen: true, data: null })}
          >
            Add session type
          </Button>
        </div>
        {sessionTypes.length > 0 && (
          <Table<SessionType>
            rowKey='id'
            size='small'
            pagination={false}
            dataSource={sessionTypes}
            scroll={{ x: "max-content" }}
            columns={[
              { title: "Name", dataIndex: "name" },
              {
                title: "Pays",
                render: (_, t) => payBasisLabel(payBasisOf(t)),
              },
              {
                title: "Default salary",
                align: "right",
                className: "tabular-nums",
                render: (_, t) =>
                  t.default_hourly_rate === null
                    ? "—"
                    : formatAmount(t.default_hourly_rate),
              },
              {
                title: "Length (minutes)",
                align: "right",
                className: "tabular-nums",
                dataIndex: "min_session_min",
              },
              {
                key: "actions",
                render: (_, t) => (
                  <div className='flex justify-end gap-1'>
                    <Button
                      size='small'
                      type='text'
                      icon={<Pencil />}
                      title='Edit'
                      aria-label={`Edit ${t.name}`}
                      onClick={() => setModalState({ isOpen: true, data: t })}
                    />
                    <Popconfirm
                      title={`Delete ${t.name}?`}
                      description='Booked sessions keep their title. Trainers lose this type.'
                      okText='Delete'
                      okButtonProps={{ danger: true }}
                      onConfirm={() => remove.mutate(t.id)}
                    >
                      <Button
                        size='small'
                        type='text'
                        danger
                        icon={<Trash2 />}
                        title='Delete'
                        aria-label={`Delete ${t.name}`}
                        loading={remove.isPending && remove.variables === t.id}
                      />
                    </Popconfirm>
                  </div>
                ),
              },
            ]}
          />
        )}
      </div>

      <SessionTypeModal
        open={modalState.isOpen}
        data={modalState.data}
        onClose={closeModal}
      />
    </SettingsPanel>
  );
}

interface SessionTypeModalProps {
  open: boolean;
  data: SessionType | null;
  onClose: () => void;
}

function SessionTypeModal({ open, data, onClose }: SessionTypeModalProps) {
  const { center } = useRoster();
  const [form] = Form.useForm<Values>();
  const save = useMutation(saveSessionTypeMutationOptions(center.id));
  const basis = Form.useWatch("pay_basis", form) ?? DEFAULT_PAY_BASIS;

  useEffect(() => {
    if (!open) return;
    const values: Values = data
      ? {
          name: data.name,
          pay_basis: payBasisOf(data),
          default_hourly_rate: data.default_hourly_rate,
          min_session_min: data.min_session_min,
        }
      : {
          name: "",
          pay_basis: DEFAULT_PAY_BASIS,
          default_hourly_rate: null,
          min_session_min: center.default_session_min,
        };
    form.setFieldsValue(values);
  }, [open, data, form, center.default_session_min]);

  const onFinish = (values: Values) =>
    save.mutate(
      {
        id: data?.id,
        name: values.name.trim(),
        pay_basis: values.pay_basis,
        default_hourly_rate: values.default_hourly_rate ?? null,
        min_session_min: values.min_session_min,
      },
      { onSuccess: onClose },
    );

  return (
    <Modal
      open={open}
      title={data ? "Edit session type" : "Add session type"}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText='Save'
      confirmLoading={save.isPending}
      destroyOnHidden
    >
      <Form form={form} layout='vertical' onFinish={onFinish}>
        <Form.Item
          name='name'
          label='Name'
          rules={[{ required: true, whitespace: true }, { max: 80 }]}
        >
          <Input maxLength={80} placeholder='Piano lesson' />
        </Form.Item>
        <div className='grid grid-cols-2 gap-3'>
          <Form.Item name='pay_basis' label='Pays'>
            <Select<PayBasis> options={PAY_BASIS_OPTIONS} />
          </Form.Item>
          <Form.Item name='default_hourly_rate' label='Default salary'>
            <InputNumber<number>
              {...moneyInputProps}
              suffix={rateSuffix(basis)}
              className='w-full'
            />
          </Form.Item>
        </div>
        <Form.Item
          name='min_session_min'
          label='Session length (minutes)'
          extra='Sessions of this type must be at least this long.'
          rules={[{ required: true, message: "Enter a length" }]}
        >
          <InputNumber<number>
            min={MIN_SESSION_MINUTES}
            max={MAX_SESSION_HOURS * 60}
            precision={0}
            className='w-full'
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
