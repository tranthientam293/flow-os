import { useMemo } from "react";
import { Form, Input, Modal, Select } from "antd";
import { useMutation } from "@tanstack/react-query";
import { useFlowApp } from "@/context";
import { createCenterMutationOptions } from "../apis/centers";
import { DEFAULT_TIMEZONE } from "../constants/options";
import { nextColor } from "../utils/colors";
import { allTimezones, browserTimezone } from "../utils/time";

type Values = {
  name: string;
  timezone: string;
  displayName: string;
};

export function RegisterCenterModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (centerId: string) => void;
}) {
  const { user } = useFlowApp();
  const [form] = Form.useForm<Values>();
  const create = useMutation(createCenterMutationOptions());
  const timezones = useMemo(
    () => allTimezones().map((tz) => ({ value: tz, label: tz })),
    [],
  );

  const initialValues: Values = {
    name: "",
    timezone: browserTimezone() ?? DEFAULT_TIMEZONE,
    displayName:
      (user.user_metadata?.display_name as string | undefined) ??
      user.email?.split("@")[0] ??
      "",
  };

  const submit = (values: Values) =>
    create.mutate(
      {
        name: values.name.trim(),
        timezone: values.timezone,
        displayName: values.displayName.trim(),
        color: nextColor([]),
      },
      { onSuccess: onCreated },
    );

  return (
    <Modal
      open={open}
      title='Create a center'
      okText='Create'
      onOk={() => form.submit()}
      onCancel={onClose}
      confirmLoading={create.isPending}
      destroyOnHidden
    >
      <p className='mb-4 text-sm text-muted-foreground'>
        You'll be the owner. Next, add branches and invite trainers.
      </p>
      <Form
        form={form}
        layout='vertical'
        preserve={false}
        initialValues={initialValues}
        onFinish={submit}
      >
        <Form.Item
          name='name'
          label='Center name'
          rules={[
            { required: true, whitespace: true, message: "Enter a name" },
            { max: 120 },
          ]}
        >
          <Input placeholder='Melody Music School' maxLength={120} />
        </Form.Item>
        <Form.Item
          name='displayName'
          label='Your name'
          extra='How your trainers see you.'
          rules={[
            { required: true, whitespace: true, message: "Enter your name" },
            { max: 80 },
          ]}
        >
          <Input maxLength={80} />
        </Form.Item>
        <Form.Item name='timezone' label='Timezone'>
          <Select showSearch options={timezones} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
