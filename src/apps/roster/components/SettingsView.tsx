import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  TimePicker,
} from "antd";
import { SettingsPanel } from "@/components/molecules";
import { dayjs, type Dayjs } from "@/libs";
import {
  deleteCenterMutationOptions,
  updateCenterMutationOptions,
} from "../apis/centers";
import { useRoster } from "../context/roster-context";
import { allTimezones, hhmm } from "../utils/time";
import { OwnerAsTrainerPanel } from "./OwnerAsTrainerPanel";

type Values = {
  name: string;
  timezone: string;
  week_start: number;
  default_session_min: number;
  past_edit_days: number;
  opens_at: Dayjs;
  closes_at: Dayjs;
};

const TIME = "HH:mm";
const asTime = (value: string) => dayjs(`2000-01-01 ${value}`);
const closeValue = (value: Dayjs) =>
  value.format(TIME) === "00:00" ? "24:00" : value.format(TIME);

export function SettingsView() {
  const { center } = useRoster();
  return (
    <div className='mx-auto flex max-w-3xl flex-col gap-6 px-4 py-4 sm:px-6'>
      <CenterSettings key={center.updated_at} />
      <OwnerAsTrainerPanel />
      <DangerZone centerName={center.name} />
    </div>
  );
}

function CenterSettings() {
  const { center } = useRoster();
  const [form] = Form.useForm<Values>();
  const update = useMutation(updateCenterMutationOptions(center.id));
  const timezones = useMemo(
    () => allTimezones().map((tz) => ({ value: tz, label: tz })),
    [],
  );

  const initialValues: Values = {
    name: center.name,
    timezone: center.timezone,
    week_start: center.week_start,
    default_session_min: center.default_session_min,
    past_edit_days: center.past_edit_days,
    opens_at: asTime(hhmm(center.opens_at)),
    closes_at: asTime(
      hhmm(center.closes_at) === "24:00" ? "00:00" : hhmm(center.closes_at),
    ),
  };

  const onFinish = (values: Values) =>
    update.mutate({
      name: values.name.trim(),
      timezone: values.timezone,
      week_start: values.week_start,
      default_session_min: values.default_session_min,
      past_edit_days: values.past_edit_days,
      opens_at: values.opens_at.format(TIME),
      closes_at: closeValue(values.closes_at),
    });

  return (
    <Form
      form={form}
      layout='vertical'
      initialValues={initialValues}
      onFinish={onFinish}
    >
      <SettingsPanel
        title='Center'
        description='Only the owner can change these.'
        footer={
          <>
            <Button size='small' onClick={() => form.resetFields()}>
              Reset
            </Button>
            <Button
              type='primary'
              size='small'
              htmlType='submit'
              loading={update.isPending}
            >
              Save
            </Button>
          </>
        }
      >
        <div className='grid gap-x-4 sm:grid-cols-2'>
          <Form.Item
            name='name'
            label='Name'
            rules={[{ required: true, whitespace: true }, { max: 120 }]}
          >
            <Input maxLength={120} />
          </Form.Item>
          <Form.Item name='timezone' label='Timezone'>
            <Select showSearch options={timezones} />
          </Form.Item>
          <Form.Item name='week_start' label='Week starts on'>
            <Select
              options={[
                { value: 1, label: "Monday" },
                { value: 0, label: "Sunday" },
              ]}
            />
          </Form.Item>
          <Form.Item
            name='default_session_min'
            label='Default session length (minutes)'
            rules={[{ required: true }]}
          >
            <InputNumber<number>
              min={60}
              max={480}
              step={15}
              className='w-full'
            />
          </Form.Item>
          <Form.Item
            name='past_edit_days'
            label='Past-session edit window (days)'
            extra='How long trainers can fix their own past sessions. 0 = never.'
            rules={[{ required: true }]}
          >
            <InputNumber<number> min={0} max={90} className='w-full' />
          </Form.Item>
          <Form.Item
            name='opens_at'
            label='Opens at'
            rules={[{ required: true }]}
          >
            <TimePicker
              format={TIME}
              minuteStep={1}
              needConfirm={false}
              allowClear={false}
              className='w-full'
            />
          </Form.Item>
          <Form.Item
            name='closes_at'
            label='Closes at'
            extra='Sessions can only be booked between these times. Pick 00:00 for midnight.'
            dependencies={["opens_at"]}
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator: (_rule, value: Dayjs | undefined) => {
                  const open: Dayjs | undefined = getFieldValue("opens_at");
                  if (!value || !open) return Promise.resolve();
                  return closeValue(value) > open.format(TIME)
                    ? Promise.resolve()
                    : Promise.reject(new Error("Must be after opening time"));
                },
              }),
            ]}
          >
            <TimePicker
              format={TIME}
              minuteStep={1}
              needConfirm={false}
              allowClear={false}
              className='w-full'
            />
          </Form.Item>
        </div>
      </SettingsPanel>
    </Form>
  );
}

function DangerZone({ centerName }: { centerName: string }) {
  const { center } = useRoster();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const remove = useMutation(deleteCenterMutationOptions(center.id));

  return (
    <SettingsPanel
      title='Danger zone'
      description='Deleting the center removes every branch, trainer and session. This can’t be undone.'
    >
      <Button danger onClick={() => setOpen(true)}>
        Delete center
      </Button>
      <Modal
        open={open}
        title={`Delete ${centerName}?`}
        okText='Delete'
        okButtonProps={{ danger: true, disabled: typed !== centerName }}
        confirmLoading={remove.isPending}
        onOk={() => remove.mutate()}
        onCancel={() => {
          setOpen(false);
          setTyped("");
        }}
      >
        <p className='mb-2 text-sm text-foreground-light'>
          Type <span className='font-medium text-foreground'>{centerName}</span>{" "}
          to confirm.
        </p>
        <Input value={typed} onChange={(e) => setTyped(e.target.value)} />
      </Modal>
    </SettingsPanel>
  );
}
