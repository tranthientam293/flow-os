import { useMutation } from "@tanstack/react-query";
import dayjs, { type Dayjs } from "dayjs";
import {
  Alert,
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  TimePicker,
} from "antd";
import { updateRepeatMutationOptions } from "../../apis/repeats";
import {
  MAX_SESSION_HOURS,
  MIN_SESSION_MINUTES,
} from "../../constants/options";
import { useRoster } from "../../context/roster-context";
import type { Repeat } from "../../models/roster";
import { hhmm, openingHours } from "../../utils/time";
import { WeekdayPicker } from "../molecules";

const TIME = "HH:mm";

type Values = {
  branchId: string;
  sessionTypeId?: string;
  weekdays: number[];
  time: [Dayjs, Dayjs];
  traineeCount: number;
  title?: string;
  note?: string;
};

const asTime = (time: string) => dayjs(`2000-01-01T${hhmm(time)}`);

// Edits a weekly repeat. Changes apply from now on: its upcoming sessions
// nobody has changed are rebooked with the new settings; sessions already
// held, and upcoming ones edited by hand, stay as they are. The trainer can't
// be changed (stop the repeat and start a new one instead).
export function RepeatModal({
  repeat,
  onClose,
}: {
  repeat: Repeat;
  onClose: () => void;
}) {
  const ctx = useRoster();
  const {
    center,
    isOwner,
    branches,
    memberBranches,
    sessionTypes,
    memberSessionTypes,
    memberById,
  } = ctx;
  const update = useMutation(updateRepeatMutationOptions(center.id));
  const [form] = Form.useForm<Values>();
  const hours = openingHours(center);
  const member = memberById.get(repeat.member_id);

  const assigned = new Set(
    memberBranches
      .filter((mb) => mb.member_id === repeat.member_id)
      .map((mb) => mb.branch_id),
  );
  const anyBranch = ctx.anyBranchIds.has(repeat.member_id);
  const branchChoices = branches.filter(
    (b) =>
      (!b.archived_at || b.id === repeat.branch_id) &&
      (isOwner || anyBranch || assigned.has(b.id) || b.id === repeat.branch_id),
  );
  const taught = new Set(
    memberSessionTypes
      .filter((mst) => mst.member_id === repeat.member_id)
      .map((mst) => mst.session_type_id),
  );
  const typeChoices = taught.size
    ? sessionTypes.filter(
        (t) => taught.has(t.id) || t.id === repeat.session_type_id,
      )
    : sessionTypes;

  const onFinish = (values: Values) =>
    update.mutate(
      {
        repeatId: repeat.id,
        branchId: values.branchId,
        sessionTypeId: values.sessionTypeId ?? null,
        weekdays: values.weekdays,
        startsTime: values.time[0].format(TIME),
        endsTime: values.time[1].format(TIME),
        title: values.title?.trim() || null,
        note: values.note?.trim() || null,
        traineeCount: values.traineeCount,
      },
      { onSuccess: onClose },
    );

  return (
    <Modal
      open
      title='Edit repeat'
      onCancel={onClose}
      footer={null}
      width={520}
      destroyOnHidden
    >
      <Alert
        type='info'
        showIcon
        className='mb-4'
        title='Changes apply from now on'
        description='Upcoming sessions from this repeat are rebooked with the new settings. Sessions already held, and upcoming ones edited by hand, stay as they are.'
      />
      <Form<Values>
        form={form}
        layout='vertical'
        requiredMark={false}
        initialValues={{
          branchId: repeat.branch_id,
          sessionTypeId: repeat.session_type_id ?? undefined,
          weekdays: repeat.weekdays,
          time: [asTime(repeat.starts_time), asTime(repeat.ends_time)],
          traineeCount: repeat.trainee_count,
          title: repeat.title ?? undefined,
          note: repeat.note ?? undefined,
        }}
        onFinish={onFinish}
      >
        <Form.Item label='Trainer'>
          <Input value={member?.display_name ?? "—"} disabled />
        </Form.Item>
        <Form.Item
          name='weekdays'
          label='Repeat on'
          rules={[
            {
              validator: (_rule, value: number[] | undefined) =>
                value?.length
                  ? Promise.resolve()
                  : Promise.reject(new Error("Pick at least one day")),
            },
          ]}
        >
          <WeekdayPicker weekStart={center.week_start} />
        </Form.Item>
        <Form.Item
          name='time'
          label='Time'
          extra={`At least 1 hour. Open ${hours.open}–${hours.close === "24:00" ? "midnight" : hours.close}.`}
          rules={[
            { required: true, message: "Choose a start and end time" },
            {
              validator: (_rule, value: [Dayjs, Dayjs] | undefined) => {
                if (!value?.[0] || !value[1]) return Promise.resolve();
                const [s, e] = value;
                const minutes = e.diff(s, "minute");
                if (s.format(TIME) < hours.open)
                  return Promise.reject(new Error(`Opens at ${hours.open}`));
                if (e.format(TIME) > hours.close)
                  return Promise.reject(new Error(`Closes at ${hours.close}`));
                if (minutes < MIN_SESSION_MINUTES)
                  return Promise.reject(new Error("At least 1 hour"));
                if (minutes > MAX_SESSION_HOURS * 60)
                  return Promise.reject(
                    new Error(`At most ${MAX_SESSION_HOURS} hours`),
                  );
                return Promise.resolve();
              },
            },
          ]}
        >
          <TimePicker.RangePicker
            className='w-full'
            format={TIME}
            minuteStep={5}
            needConfirm={false}
            allowClear={false}
            order
          />
        </Form.Item>
        <Form.Item
          name='branchId'
          label='Branch'
          rules={[{ required: true, message: "Choose a branch" }]}
        >
          <Select
            options={branchChoices.map((b) => ({
              value: b.id,
              label: `${b.code} · ${b.name}`,
            }))}
          />
        </Form.Item>
        <Form.Item name='sessionTypeId' label='Session type'>
          <Select
            allowClear
            placeholder='Choose a type'
            options={typeChoices.map((t) => ({ value: t.id, label: t.name }))}
          />
        </Form.Item>
        <Form.Item
          name='traineeCount'
          label='Trainees'
          rules={[{ required: true, message: "Enter the number of trainees" }]}
        >
          <InputNumber<number>
            min={1}
            max={999}
            precision={0}
            className='w-full'
          />
        </Form.Item>
        <Form.Item name='title' label='Title' rules={[{ max: 120 }]}>
          <Input maxLength={120} />
        </Form.Item>
        <Form.Item name='note' label='Note' rules={[{ max: 1000 }]}>
          <Input.TextArea
            maxLength={1000}
            autoSize={{ minRows: 2, maxRows: 6 }}
          />
        </Form.Item>
        <div className='flex justify-end gap-2'>
          <Button onClick={onClose}>Cancel</Button>
          <Button type='primary' htmlType='submit' loading={update.isPending}>
            Save changes
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
